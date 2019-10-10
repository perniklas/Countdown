function initAuth(auth) {
    auth.onAuthStateChanged((user) => {
        authState(user);
    });

    $('#loginform').on('submit', () => {
        let username = $('#login-username').val(),
            password = $('#login-password').val();
        
        auth.signInWithEmailAndPassword(username, password).then((cred) => {
            $(this).reset();
            $(this).querySelector('.error').innerHTML = '';
            console.log('Signed in with: ' + cred);
            $('#loginform').slideUp();
            loadPage();
        }).catch(err => {
            $(this).querySelector('.error').innerHTML = err.message;   
        });
    });
    
    $('#signupform').on('submit', () => {
        console.log('sign');
    }); 

    $('#signup').on('click', () => {
        if ((!$('#loginform').is(':hidden'))) {
            $('#loginform, #signupform').slideToggle();
            $('#signup h5').text("or sign in");
        } else {
            $('#loginform, #signupform').slideToggle();
            $('#signup h5').text("or sign up");
        }
    });
}

function authState(user) {
    if (user) {
        user.getIdTokenResult().then(idTokenResult => {
            user.admin = idTokenResult.claims.admin;
            // render countdown
    });
    fetchAllTimers(user);
    } else {

    }
}