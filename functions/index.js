const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

exports.saveTimer = functions.https.onCall((data, context) => {
    const timer = data;
    const userId = context.auth.uid;
    timer.end = new Date(timer.end);
    timer.created = new Date(timer.created);
    timer['userId'] = userId;

    timer.ref.id = userId + "---" + timer.name + "---" + timer.created.toISOString();

    return admin.firestore().collection('timers').doc(timer.ref.id)
        .set(timer).then(() => {
            timer['test'] = timer.end.getTime();
            return timer;
        }).catch(error => {
            return error;
        });
});

exports.migrateEndedTimers = functions.https.onCall(() => {
    var counter = 0;
    const db = admin.firestore();
    db.collection('timers').get().then(snap => {
        snap.forEach(function(doc) {
            if (new Date((doc.data().end.seconds * 1000) + doc.data().end.nanoseconds) < new Date()) {
                db.collection('expired').add(doc.data());
                counter += 1;
                doc.ref.delete();
            }
        });
    });
    console.log('Migrated ' + counter + ' timers.');
    return counter;
});

exports.deleteTimer = functions.https.onCall((data, context) => {
    
});

exports.updateUserInfo = functions.https.onCall((data, context) => {
    
});

exports.getTimersForCurrentUser = functions.https.onCall((id, context) => {
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