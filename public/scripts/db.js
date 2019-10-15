/*
    Database (Firestore) related JS and jQuery.
*/

function initDb(db) {
    if (db) {
        console.log('Firestore connection established.');
        addUserToCollection();
    }
}

function saveTimer() {
    let newTimer = {
        name: $('#newtimer-name').val(),
        end: concatDateAndTime($('#newtimer-end-date').val(), $('#newtimer-end-time').val()),
        created: new Date(),
        userId: auth.currentUser.uid
    };

    console.log('NEW TIMER:');
    console.log(newTimer);

    // conditionals? Or let users add empty values
    
    db.collection('timers').add(newTimer).then(() => {
        allTimers.push(newTimer);
        currentTimer = newTimer;
        countdown = startCountdown(currentTimer);
    }).catch(error => {
        alert(error.message);
    });
}

function concatDateAndTime(date, time) {
    if (time.length > 0) {
        return new Date(date + "T" + time);
    } else {
        return new Date(date);
    }
};

// function getHighestId() {
//     let id = 0;
//     db.collection("timers").get().then((snapshot) => {
//         snapshot.forEach(doc => {
//             if (doc.data().id > id) {
//                 id = doc.data().id;
//             }
//         })
//         return id;
//     }).catch(error => {
//         alert(error.message);
//         id = -9999;
//     });
// }

function fetchAllTimers(user) {
    let timers = [];
    timersListener = db.collection("timers").where('userId', '==', user.uid).onSnapshot(snapshot => {
        migrateEndedTimers(snapshot);
        snapshot.forEach((doc) => {
            let timer = doc.data();
            timer.ref = doc.ref;
            timers.push(doc.data());
        });
        console.log("Fetched " + timers.length + " records from firestore");
        timers = sortTimersBySoonest(timers);
    });
    return timers;
}

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
    return firstAndBest; // {name: 'All timers expired', end: new Date().getTime() + 25252513}
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

function convertEndToMillis(timers) {
    timers.forEach(timer => {
        console.log("Converting from timestamp to milliseconds");
        timer.end.milliseconds = timer.end.toMillis();
    });
}

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

function deleteCurrentTimer() {
    let deleteTimer = db.collection('timers').where('userId', '==', currentTimer.userId);
    deleteTimer = deleteTimer.where('end.seconds', '==', currentTimer.end.seconds);
    deleteTimer = deleteTimer.where('end.nanoseconds', '==', currentTimer.end.nanoseconds);
    deleteTimer = deleteTimer.where('created.seconds', '==', currentTimer.created.seconds);
    deleteTimer = deleteTimer.where('created.nanoseconds', '==', currentTimer.created.nanoseconds);
    deleteTimer = deleteTimer.where('name', '==', currentTimer.name);

    deleteTimer.onSnapshot(snapshot => {
        snapshot.forEach((doc) => {
            console.log('Deleting timer: ' + doc.data());
            doc.ref.delete();
        });
    });
}

function stopListening() {
    timersListener();
}

function addUserToCollection(user) {
    db.collection('users').doc(auth.currentUser.uid).set(user).then(() => {
        console.log('Added ' + user.displayName + ' to collection');
    }).catch(error => {
        alert(error.message);
    });
}

function updateUserInCollection(date) {
    db.collection('users').doc(auth.currentUser.uid).update({
        joined: date
    }).then(() => {
        console.log('Successfully updated login date');
    }).catch(error => {
        alert(error.message);
    });
}