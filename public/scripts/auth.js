function initAuth(auth) {
    auth.onAuthStateChanged((user) => {
        authState(user);
    });

    $('#loginform').on('submit', (e) => {
        e.preventDefault();
        let username = $('#login-username').val(),
            password = $('#login-password').val();
        
        auth.signInWithEmailAndPassword(username, password).then((cred) => {
            $(this).trigger('reset');
            $(this).find('.error').hide();
            console.log('Signed in with: ' + cred);
            $('#loginform').slideUp();
            allTimers = fetchAllTimers(auth.currentUser());
            loadPage();
        }).catch(err => {
            $(this).find('.error').text(err.message).slideDown();   
        });
    });
    
    $('#signupform').on('submit', (e) => {
        e.preventDefault();
        let username = $('#signup-username').val(),
            password = $('#signup-password').val();

        auth.createUserWithEmailAndPassword(username, password).then((cred) => {
            $(this).trigger('reset');
            $(this).find('.error').hide();
            console.log('Created account: ' + cred);
            $('#loginform').slideUp();
            allTimers = fetchAllTimers(auth.currentUser());
            loadPage();
        }).catch((err) => {
            $(this).find('.error').text(err.message).slideDown();   
        })
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