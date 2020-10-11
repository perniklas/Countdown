// const functions = require('firebase-functions');
// const admin = require('firebase-admin');
// admin.initializeApp();

// // // Create and Deploy Your First Cloud Functions
// // // https://firebase.google.com/docs/functions/write-firebase-functions

// exports.saveTimer = functions.region('europe-west2').https.onCall((timer, context) => {
//     console.log(timer);

//     // If timer lacks Created, it is a new timer.
//     if (!timer.created) {
//         console.log('Adding new timer');
//         timer.created = new Date();
//         timer.created.milliseconds = timer.created.getTime();

//         const userId = context.auth.uid;
//         timer['userId'] = userId;
//         timer.ref.id = userId + "---" + timer.name + "---" + timer.created.toISOString();
//         timer.toBeDeleted = false;
//     } else {
//         console.log('Editing existing timer');
//     }

//     timer.end = new Date(timer.endMS);
//     timer.end.milliseconds = timer.endMS;
//     delete timer.endMS;

//     timer.updated = new Date();
//     timer.updated.milliseconds = timer.updated.getTime();
//     console.log(timer);
    
//     return admin.firestore().collection('timers').doc(timer.ref.id)
//         .set(timer).then(() => {
//             return timer;
//         }).catch(error => {
//             console.log('Error saving timer: ' + error.message);
//             return error;
//         });
// });

// exports.migrateEndedTimers = functions.region('europe-west2').https.onCall(() => {
//     return admin.firestore().collection('timers').get().then(snap => { 
//         let counter = 0;
//         snap.forEach(function(doc) {
//             console.log(doc.data());
//             if (new Date((doc.data().end.seconds * 1000) + doc.data().end.nanoseconds) < new Date()) {
//                 admin.firestore().collection('expired').add(doc.data());
//                 counter += 1;
//                 doc.ref.delete();
//             }
//         });
//         if (counter > 0) {
//             console.log('[Info]: Migrated ' + counter + ' ended countdowns.');
//         } else {
//             console.log('[Info]: No countdowns migrated.');
//         }
//         return counter;
//     });
// });

// exports.markTimerForDeletion = functions.region('europe-west2').https.onCall((timer, context) => {
//     return admin.firestore().collection('timers').doc(timer.ref.id)
//         .update({
//             toBeDeleted: true
//         }
//     ).then(() => {
//         return 'good';
//     }).catch(bad => {
//         console.log('Error marking timer for deletion: ' + bad.message);
//         return bad;
//     });
// });

// exports.deleteTimer = functions.region('europe-west2').https.onCall((timer, context) => {
//     let deleted = '';    
//     return admin.firestore().collection('timers').doc(timer.ref.id).delete().then(function() {
//         console.log("Document " + timer.ref.id + " successfully deleted!");
//         return deleted = 'ok';
//     }).catch(function(error) {
//         console.error("Error removing document: ", error.message);
//         return deleted = error;
//     });
// });

// exports.getTimersForCurrentUser = functions.region('europe-west2').https.onCall((id, context) => {
//     let timers = [];
//     return admin.firestore().collection('timers').where('userId', '==', id).get().then(snap => {
//         console.log('Fetching timers for user ' + id);
//         snap.forEach(function(doc) {
//             timers.push(doc.data());
//         });
//         console.log('Fetch completed. ' + timers.length + ' timers fetched.');
//         return timers;
//     }).catch(error => {
//         console.log('Error fetching timers: ' + error.message);
//     });
// });

// exports.deleteAllTimers = functions.region('europe-west2').https.onCall((garbage, context) => {
//     let id = context.auth.uid;
//     return admin.firestore().collection('timers').where('userId', '==', id).get()
//         .then(function(querySnapshot) {
//             // Once we get the results, begin a batch
//             var batch = admin.firestore().batch();
    
//             querySnapshot.forEach(function(doc) {
//                 // For each doc, add a delete operation to the batch
//                 batch.delete(doc.ref);
//             });
    
//             // Commit the batch
//             return batch.commit();
//         }).then(function() {
//             console.log('All active timers for user ' + id + ' deleted');
//         }).catch(error => {
//             console.log('Error deleting active timers: ' + error.message);
//         });
// });

// exports.deleteAllExpired = functions.region('europe-west2').https.onCall((garbage, context) => {
//     let id = context.auth.uid;
//     return admin.firestore().collection('expired').where('userId', '==', id).get()
//         .then(function(querySnapshot) {
//             // Once we get the results, begin a batch
//             var batch = admin.firestore().batch();
    
//             querySnapshot.forEach(function(doc) {
//                 // For each doc, add a delete operation to the batch
//                 batch.delete(doc.ref);
//             });
    
//             // Commit the batch
//             return batch.commit();
//         }).then(function() {
//             console.log('All expired timers for user ' + id + ' deleted');
//         }).catch(error => {
//             console.log('Error deleting expired timers: ' + error.message);
//         });
// });

// exports.deleteColors = functions.region('europe-west2').https.onCall((garbage, context) => {
//     let id = context.auth.uid;
//     return admin.firestore().collection('userscolors').doc(id).delete().then(function() {
//         console.log("Colors for user " + id + " deleted.");
//     }).catch(error => {
//         console.log('Error deleting colors: ' + error.message);
//     });
// });

// exports.deleteUserLogs = functions.region('europe-west2').https.onCall((garbage, context) => {
//     let id = context.auth.uid;
//     return admin.firestore().collection('users').doc(id).delete().then(function() {
//         console.log('All logs for user ' + id + ' deleted.');
//     }).catch(error => {
//         console.log('Error deleting logs: ' + error.message);
//     });
// });