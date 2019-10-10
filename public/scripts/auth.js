function initAuth(auth) {
    auth.onAuthStateChanged((user) => {
        console.log(user);
        if (user) {
            $('#login').slideUp();
            allTimers = fetchAllTimers(user);
            loadPage();
        } else {
            // if user logs out
            $('#login, #countdown-header, #countdown-content, #counters-text').slideToggle();
        }
    });

    $('#loginform').on('submit', (e) => {
        e.preventDefault();
        let username = $('#login-username').val(),
            password = $('#login-password').val();
                
        auth.signInWithEmailAndPassword(username, password).then((cred) => {
            $(this).trigger('reset');
            $(this).find('.error').hide();
            console.log('Signed in with: ' + cred);
        }).catch(err => {
            console.log(err);
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
        }).catch((err) => {
            console.log(err);
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