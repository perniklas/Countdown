const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// exports.cleanupEndedTimers = functions.firestore.document('/timers/{documentId}')
//     .onCreate((snap, context) => {
//         const original = snap.data().original;
//         console.log('Uppercasing', context.params.documentId, original);
//         const uppercase = original.toUpperCase();
//         // You must return a Promise when performing asynchronous tasks inside a Functions such as
//         // writing to the Cloud Firestore.
//         // Setting an 'uppercase' field in the Cloud Firestore document returns a Promise.
//         return snap.ref.set({uppercase}, {merge: true});
//     });