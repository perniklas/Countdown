function initDb(db) {
    migrateEndedTimers();
}

function saveTimer() {
    let name = $('#newtimer-name').val(),
        end = new Date($('#newtimer-end').val()),
        created = new Date().getTime(),
        userId = auth.currentUser.uid
        id = getHighestId() + 1;
    
    db.collection('timers').add({
        name: name,
        end: end,
        created: created,
        userId: userId
    }).then(() => {
        fetchAllTimers(auth.currentUser);
        setTimeout(() => {
            countdown = startCountdown(allTimers[allTimers.findIndex(timer => 
                timer.name === name && timer.end.milliseconds === new Date(end).getTime())]);
        }, 1000);
    }).catch(error => {
        alert(error.message);
    });
}

function getHighestId() {
    let id = 0;
    db.collection("timers").get().then((snapshot) => {
        snapshot.forEach(doc => {
            if (doc.data().id > id) {
                id = doc.data().id;
            }
        })
        return id;
    }).catch(error => {
        alert(error.message);
        id = -9999;
    });
}

function fetchAllTimers(user) {
    let timers = [];
    timersListener = db.collection("timers").get().then((snapshot) => {
        snapshot.forEach((doc) => {
            if (doc.data().userId == user.uid) {
                let timer = doc.data();
                timer.ref = doc.ref;
                timers.push(doc.data());
            }
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

function migrateEndedTimers() {
    db.collection("timers").get().then((snapshot) => {
        let counter = 0;
        snapshot.forEach((doc) => {
            if (new Date(doc.data().end.seconds * 1000 + doc.data().end.nanoseconds) < new Date()) {
                db.collection('expired').add(doc.data());
                counter += 1;
                doc.ref.delete();
            }
        });

        if (counter == 0) {

        } else {
            console.log("Removed " + counter + " expired timers.");
        }
    });
}

var deleteCount = 0;
function deleteCurrentTimer() {
    deleteCount += 1;
    if (deleteCount > 2) {
        alert("IT'S NOT GONNA MAGICALLY APPEAR JUST BECAUSE YOU PRESSED THE BUTTON A BUNCH OF TIMES");
    } else {
        alert("I'm working on it, come back later");
    }
}

function detachDbListener() {
    
}