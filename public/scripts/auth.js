function authState(user) {
    if (user) {
        user.getIdTokenResult().then(idTokenResult => {
            user.admin = idTokenResult.claims.admin;
            // render countdown
    });
    db.collection('timers').onSnapshot(snapshot => {
        // load user specific timers
        
    }, err => console.log(err.message));
    } else {

    }
}