const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// exports.cleanupEndedTimers = functions.https.onCall((data, context) => {
//     var db = admin.firestore();
//     var count = 0;
//     db.collection('timers').get().then((snapshot) => {
//         snapshot.forEach((doc) => {
//             if (new Date(doc.data().end.seconds * 1000 + doc.data().end.nanoseconds) < new Date()) {
//                 count += 1;
//                 db.collection('expired').add(doc.data());
//                 doc.ref.delete();
//             }
//         });
//     });
//     return count;
// });

exports.cleanupEndedTimers = functions.https.onRequest((req, res) => {
    var db = admin.firestore();
    db.collection('timers').get().then((snapshot) => {
        snapshot.forEach((doc) => {
            if (new Date(doc.data().end.seconds * 1000 + doc.data().end.nanoseconds) < new Date()) {
                db.collection('expired').add(doc.data());
                doc.ref.delete();
            }
        });
    });
});