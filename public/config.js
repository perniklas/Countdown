const firebaseConfig = {
  apiKey: "AIzaSyA6dJyYJ_zUBQZXqRhkAZea8QjHx8g3l8g",
  authDomain: "countdown-57acd.firebaseapp.com",
  databaseURL: "https://countdown-57acd.firebaseio.com",
  projectId: "countdown-57acd",
  storageBucket: "countdown-57acd.appspot.com",
  messagingSenderId: "362252931164",
  appId: "1:362252931164:web:342deac425337925b81699"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();