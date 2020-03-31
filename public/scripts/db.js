/*
    Database (Firestore) related JS and jQuery.
*/

function initDb(db) {
    if (db) {
        console.log('[Info]: Firestore connection established.');
    } else {
        console.log('[ERROR]: Could not connect to Firestore.');
    }

    FluxV2(new Date().getHours());
}

function SaveTimer(timer) {
    console.log(timer);

    var save = firebase.functions().httpsCallable('saveTimer');
    save(timer).then(function(result) {
        console.log(result);
            // ...
    });
}

function AddNewTimer() {
    let endDateTime = concatDateAndTime($('#newtimer-end-date').val(), $('#newtimer-end-time').val());
    let newTimer = {
        name: $('#newtimer-name').val(),
        end: endDateTime.getTime(),
        created: new Date().getTime(),
        ref: {
            id: null
        }
    };
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

async function fetchAllTimers(user, callback = null) {
    let fetch = firebase.functions().httpsCallable('getTimersForCurrentUser');
    let timers = [];
    await fetch(user.uid).then(result => {
        console.log(result.data);
        if (timersLoaded) LoadingComplete(timersLoaded);
        timers = result.data;
        console.log(timers);
        console.log("[Info]: Fetched " + timers.length + " records from firestore");
        convertEndToMillis(timers);
        timers = sortTimersBySoonest(timers);
        addTimersToAllTimersList(timers);;
        if (callback) callback();
    });
    return timers;
    // let expiredListener = db.collection('expired').where('userId', '==', user.uid).onSnapshot(snapshot => {
    //     let exp = [];
    //     snapshot.forEach((doc) => {
    //         let timer = doc.data();
    //         timer.ref = doc.ref;
    //         exp.push(timer);
    //     });
    //     convertEndToMillis(exp);
    //     exp = sortTimersBySoonest(exp);
    //     AddTimersToExpiredTimersList(exp);
    // });
    // expiredListener();
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
    $.each(timers, function(i, timer) {
        timer.end._milliseconds = (timer.end._seconds * 1000) + timer.end._nanoseconds;
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
    console.log('[Info]: Migrating ended timers...');

    let migrate = firebase.functions().httpsCallable('migrateEndedTimers');
    migrate().then(function(result) {
        if (result > 0) {
            console.log("[Info]: Migrated " + result + " timers.");
        } else {
            console.log("[Info]: No timers migrated.");
        }
    });
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

// /** 
//  * Kills the DB listener (when logging out).
//  */
// function stopListening() {
//     timersListener();
// }

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
            console.log('[Info]: Updated user ' + auth.currentUser.email + ' with new login date: ' + user.updated);
        }).catch(error => {
            console.log('[ERROR]: ' + error.message);
        });
    } else {
        userDb.set({
            displayname: user.displayname,
            username: user.username,
            joined: user.joined,
            updated: user.updated
        }, { merge: true }).then(() => {
            console.log('[Info]: Added new user ' + user.username + ' to user list.');
        }).catch(error => {
            console.log('[ERROR]: ' + error.message);
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
        );
    });
}

function AddTimersToExpiredTimersList(timers = expiredTimers) {
    $('#alltimers-expired').empty();
    $.each(timers, (index, timer) => {
        $('#alltimers-expired').append(
            '<div class="timer-element" data-timerid="' + timer.ref.id + '"><p>' + timer.name + '</p><p>' + formatEndDateTimeToString(timer.end) + '</p></div>'
        );
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