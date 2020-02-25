/*
    Database (Firestore) related JS and jQuery.
*/

function initDb(db) {
    if (db) {
        console.log('Firestore connection established.');
        // call func
    } else {
        console.log('[ERROR]: Could not connect to Firestore.');
    }

    CleanupEndedTimers();
    changed = true;
    FluxV2(new Date().getHours());
}

function CleanupEndedTimers() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
        // Typical action to be performed when the document is ready:
        document.getElementById("demo").innerHTML = xhttp.responseText;
        }
    };
    xhttp.open("GET", "filename", true);
    xhttp.send();
}

function SaveTimer(timer) {
    db.collection('timers').doc(timer.ref.id).set(timer);
    allTimers = fetchAllTimers(auth.currentUser);
    setTimeout(() => {
        countdown = startCountdown(GetTimerByID(timer.ref.id));
    }, 200);
}

function AddNewTimer() {
    let endDateTime = concatDateAndTime($('#newtimer-end-date').val(), $('#newtimer-end-time').val());
    let newTimer = {
        name: $('#newtimer-name').val(),
        end: endDateTime,
        created: new Date(),
        userId: auth.currentUser.uid,
        ref: {
            id: null
        }
    };
    newTimer.ref.id = newTimer.userId + "---" + newTimer.name + "---" + newTimer.created.toISOString();
    SaveTimer(newTimer);
}

function EditTimer() {
    let timer = {
        name: $('#edittimer-name').val(),
        end: concatDateAndTime($('#edittimer-end-date').val(), $('#edittimer-end-time').val()),
        edited: new Date(),
        userId: currentTimer.userId,
        ref: currentTimer.ref
    };
    SaveTimer(timer);
}

function concatDateAndTime(date, time) {
    if (time.length > 0) {
        return new Date(date + "T" + time);
    } else {
        return new Date(date + "T12:00");
    }
};

function fetchAllTimers(user) {
    let timers = [];
    timersListener = db.collection("timers").where('userId', '==', user.uid).onSnapshot(snapshot => {
        migrateEndedTimers(snapshot);
        snapshot.forEach((doc) => {
            let timer = doc.data();
            timer.ref = doc.ref;
            timers.push(timer);
        });
        console.log("Fetched " + timers.length + " records from firestore");
        convertEndToMillis(timers);
        timers = sortTimersBySoonest(timers);
        addTimersToAllTimersList(timers);
    });
    return timers;
}

/**
 * Returns a Timer object that is the one with the shortest amount of time left on the countdown.
 */
function findSoonestTimer() {
    let soonestTimers = sortTimersBySoonest(allTimers);
    let now = new Date().getTime();
    let firstAndBest = soonestTimers[0],
        found = false;
    soonestTimers.forEach(timer => {
        if (timer.end.milliseconds > now && !found) {
            found = true;
            firstAndBest = timer;
        }
    });
    return firstAndBest;
}

function sortTimersByNewest(timers) {
    return timers.sort((a, b) => b.created.seconds - a.created.seconds); 
}

function sortTimersByOldest(timers) {
    return timers.sort((a, b) => a.created.seconds - b.created.seconds); 
}

function sortTimersBySoonest(timers) {
    return timers.sort((a, b) => a.end.milliseconds - b.end.milliseconds); 
}

function sortTimersByLatest(timers) {
    return timers.sort((a, b) => b.end.milliseconds - a.end.milliseconds); 
}

/**
 * Converts the Firestore timestamp from seconds/nanoseconds to milliseconds (much easier to work with).
 * 
 * @param {allTimers[]} timers 
 */
function convertEndToMillis(timers) {
    timers.forEach(timer => {
        timer.end.milliseconds = timer.end.toMillis();
    });
}

/**
 * Takes the current snapshot of Firestore and pilfers through each record to check if they have ended.
 * If they have indeed ended they are first copied to the 'expired' collection before being removed from 
 * the 'timers' collection. Helps clean up the mess without actually deleting the timers.
 * 
 * @param {snapshot?} snapshot firestore snapshot
 */
function migrateEndedTimers(snapshot) {
    console.log('Migrating ended timers...');
    let counter = 0;
    snapshot.forEach((doc) => {
        if (new Date(doc.data().end.seconds * 1000 + doc.data().end.nanoseconds) < new Date()) {
            db.collection('expired').add(doc.data());
            counter += 1;
            doc.ref.delete();
        }
    });

    if (counter == 0) {
        console.log('No timers migrated');
    } else {
        console.log("Migrated " + counter + " expired timers.");
    }
}

/**
 * Deletes the timer that is currently displayed for a user.
 */
function deleteCurrentTimer() {
    HideTimer();
    let next = GetNextTimer();
    currentTimer.ref.delete();
    allTimers = fetchAllTimers(auth.currentUser);
    countdown = startCountdown(next);
    DisplayMainContent('#countdown');
    ShowTimer();
}

/** 
 * Kills the DB listener (when logging out).
 */
function stopListening() {
    timersListener();
}

/**
 * Adds users to a Users collection in Firestore. This lets me see when the user was created and when the user last logged in,
 * which in turn is used to automagically delete accounts that are not used for 2 years.
 * 
 * @param {User} user A Firebase User object.
 */
function addOrUpdateUserCollecton(user) {
    user.updated = new Date();
    let userDb = db.collection('users').doc(auth.currentUser.uid);
    if (userDb) {
        userDb.set({
            updated: user.updated
        }, { merge: true }).then(() => {
            console.log('Updated user ' + auth.currentUser.email + ' with new login date: ' + user.updated);
        }).catch(error => {
            console.log('Error: ' + error.message);
        });
    } else {
        userDb.set({
            displayname: user.displayname,
            username: user.username,
            joined: user.joined,
            updated: user.updated
        }, { merge: true }).then(() => {
            console.log('Added new user ' + user.username + ' to user list.');
        }).catch(error => {
            console.log('Error: ' + error.message);
        });
    }
}

/**
 * Adds all elements in allTimers array (found in fetchAllTimers) to the alltimers-timers HTML element.
 * The timers' identity is provided as a data attribute for ease of use when element is clicked.
 */
function addTimersToAllTimersList(timers = allTimers) {
    $('#alltimers-timers').empty();
    $.each(timers, (index, timer) => {
        $('#alltimers-timers').append(
            '<div class="timer-element" data-timerid="' + timer.ref.id + '"><p>' + timer.name + '</p><p>' + formatEndDateTimeToString(timer.end) + '</p></div>'
        )
    });
}

function GetNextTimer() {
    let index = allTimers.findIndex(t => t.ref.id == currentTimer.ref.id) + 1;
    if (index >= allTimers.length) index = 0;
    return allTimers[index];
}

function GetPreviousTimer() {
    let index = allTimers.findIndex(t => t.ref.id == currentTimer.ref.id) - 1;
    if (index < 0) index = allTimers.length - 1;
    return allTimers[index];
}

function GetTimerByID(id) {
    return allTimers.find(t => t.ref.id === id);
}