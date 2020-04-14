const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

exports.saveTimer = functions.region('europe-west2').https.onCall((timer, context) => {
    const userId = context.auth.uid;
    //timer = GenerateDateData(timer);

    timer.end = new Date(timer.end);
    timer.end.milliseconds = GenerateMillisecondsFromDate(timer.end);
    if (!timer.created) timer.created = new Date();
    if (!timer.created.milliseconds) timer.created.milliseconds = GenerateMillisecondsFromDate(timer.created);
    timer.updated = new Date();
    timer.updated.milliseconds = GenerateMillisecondsFromDate(timer.updated);

    console.log(timer);
    timer['userId'] = userId;
    timer.toBeDeleted = false;
    timer.ref.id = userId + "---" + timer.name + "---" + timer.created.toISOString();

    return admin.firestore().collection('timers').doc(timer.ref.id)
        .set(timer).then(() => {
            return timer;
        }).catch(error => {
            console.log(error);
            return error;
        });
});

function GenerateDateData(timer) {
    let processedTimer = timer;
    processedTimer.end = new Date(timer.end);
    processedTimer.end.milliseconds = GenerateMillisecondsFromDate(processedTimer.end);
    if (!processedTimer.created) processedTimer.created = new Date();
    if (!processedTimer.created.milliseconds) processedTimer.created.milliseconds = GenerateMillisecondsFromDate(processedTimer.created);
    processedTimer.updated = new Date();
    processedTimer.updated.milliseconds = GenerateMillisecondsFromDate(processedTimer.updated);
    return processedTimer;
}

function GenerateMillisecondsFromDate(date) {
    if (date.seconds || date.nanoseconds) {
        let seconds = (date.seconds) ? date.seconds * 1000 : 0;
        let nanoseconds = (date.nanoseconds) ? date.nanoseconds : 0;
        return seconds + nanoseconds;
    } else return 0;
}

function GenerateDateTimeISOString(date) {

}

exports.migrateEndedTimers = functions.region('europe-west2').https.onCall(() => {
    return admin.firestore().collection('timers').get().then(snap => { 
        let counter = 0;
        snap.forEach(function(doc) {
            console.log(doc.data());
            if (new Date((doc.data().end.seconds * 1000) + doc.data().end.nanoseconds) < new Date()) {
                admin.firestore().collection('expired').add(doc.data());
                counter += 1;
                doc.ref.delete();
            }
        });
        if (counter > 0) {
            console.log('[Info]: Migrated ' + counter + ' ended countdowns.');
        } else {
            console.log('[Info]: No countdowns migrated.');
        }
        return counter;
    });
});

exports.markTimerForDeletion = functions.region('europe-west2').https.onCall((timer, context) => {
    return admin.firestore().collection('timers').doc(timer.id)
        .update({
            toBeDeleted: true
        }
    ).then(() => {
        return 'good';
    }).catch(bad => {
        console.log(bad);
        return bad;
    });
});

exports.deleteTimer = functions.region('europe-west2').https.onCall((timer, context) => {
    let deleted = '';    
    return admin.firestore().collection('timers').doc(timer.id).delete().then(function() {
        console.log("Document " + timer.id + " successfully deleted!");
        return deleted = 'ok';
    }).catch(function(error) {
        console.error("Error removing document: ", error);
        return deleted = error;
    });
});

exports.getTimersForCurrentUser = functions.region('europe-west2').https.onCall((id, context) => {
    let timers = [];
    return admin.firestore().collection('timers').where('userId', '==', id).get().then(snap => {
        snap.forEach(function(doc) {
            let timer = doc.data();
            timer.ref = doc.ref;
            timer.id = doc.ref.id;
            timers.push(timer);
        });
        return timers;
    });
});