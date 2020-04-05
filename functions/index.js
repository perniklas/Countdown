const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

exports.saveTimer = functions.region('europe-west2').https.onCall((timer, context) => {

    const userId = context.auth.uid;
    timer.end = new Date(timer.end);
    timer.end.milliseconds = timer.end.getTime();
    timer.created = new Date(timer.created);
    timer.created.milliseconds = timer.created.getTime();
    timer['userId'] = userId;
    timer.toBeDeleted = false;

    timer.ref.id = userId + "---" + timer.name + "---" + timer.created.toISOString();

    console.log(timer);

    return admin.firestore().collection('timers').doc(timer.ref.id)
        .set(timer).then(() => {
            return timer;
        }).catch(error => {
            return error;
        });
});

exports.migrateEndedTimers = functions.region('europe-west2').https.onCall(() => {
    var counter = 0;
    admin.firestore().collection('timers').get().then(snap => { 
        snap.forEach(function(doc) {
            if (new Date((doc.data().end.seconds * 1000) + doc.data().end.nanoseconds) < new Date()) {
                fs.collection('expired').add(doc.data());
                counter += 1;
                doc.ref.delete();
            }
        });
    });
    console.log('Migrated ' + counter + ' timers.');
    return counter;
});

exports.markTimerForDeletion = functions.region('europe-west2').https.onCall((timer, context) => {
    return admin.firestore().collection('timers').doc(timer.id)
        .update({
            toBeDeleted: true
        }
    ).then(() => {
        return 'good';
    }).catch(bad => {
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