const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

exports.saveTimer = functions.region('europe-west2').https.onCall((timer, context) => {
    console.log(timer);

    const userId = context.auth.uid;

    timer.end = new Date(timer.endMS);
    timer.end.milliseconds = timer.endMS;
    delete timer.endMS;

    if (!timer.created) {
        timer.created = new Date();
        timer.created.milliseconds = timer.created.getTime();
    }

    timer.updated = new Date();
    timer.updated.milliseconds = timer.updated.getTime();

    timer['userId'] = userId;
    timer.toBeDeleted = false;
    timer.ref.id = userId + "---" + timer.name + "---" + timer.created.toISOString();
    console.log(timer);
    
    return admin.firestore().collection('timers').doc(timer.ref.id)
        .set(timer).then(() => {
            return timer;
        }).catch(error => {
            console.log(error);
            return error;
        });
});

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
    return admin.firestore().collection('timers').doc(timer.ref.id)
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
    return admin.firestore().collection('timers').doc(timer.ref.id).delete().then(function() {
        console.log("Document " + timer.ref.id + " successfully deleted!");
        return deleted = 'ok';
    }).catch(function(error) {
        console.error("Error removing document: ", error);
        return deleted = error;
    });
});

exports.getTimersForCurrentUser = functions.region('europe-west2').https.onCall((id, context) => {
    let timers = [];
    return admin.firestore().collection('timers').where('userId', '==', id).get().then(snap => {
        console.log('Fetching timers for user ' + id);
        snap.forEach(function(doc) {
            timers.push(doc.data());
        });
        console.log('Fetch complete');
        return timers;
    });
});