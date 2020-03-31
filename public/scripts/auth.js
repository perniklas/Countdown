/*
    Authentication handling.
*/
var userLog = {};

function initAuth(auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            if (user.email) {
                addOrUpdateUserCollecton(userLog);
                loadPage();
            }
        } else {
            /* User logs out */
            DisplayMainContent('login');
            LoginOrSignup();
        }
    });

    $('#loginform').on('submit', (e) => {
        e.preventDefault();
        let username = $('#login-username').val(),
            password = $('#login-password').val();
        userLog.updated = new Date();

        auth.signInWithEmailAndPassword(username, password).then((cred) => {
            $('#loginform').trigger('reset');
            $('#loginform .error').hide();
            console.log('[Info]: Signed in user ' + cred.user.email);
        }).catch(err => {
            console.log('[ERROR]: ' + err);
            $('#loginform .error').text(err.message).slideDown();   
        });
    });
    
    $('#signupform').on('submit', (e) => {
        $('#signupform .error').slideUp();
        if (verifyPasswords()) {
            e.preventDefault();
            userLog.displayname = $('#signup-displayname').val(),
            userLog.username = $('#signup-username').val(),
            userLog.joined = new Date(),
            userLog.updated = new Date();
            
            auth.createUserWithEmailAndPassword(userLog.username, $('#signup-password').val()).then((cred) => {
                $('#signupform').trigger('reset');
                $('#signupform .error').hide();
                console.log('[Info]: Created account: ' + cred.User.email);
            }).catch((err) => {
                console.log('[ERROR]: ' +err);
                $('#signupform .error').text(err.message).slideDown();   
            })
        }
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

function logout() {
    auth.signOut().then(() => {
        //stopListening();
        console.log("[Info]: User signed out");
    }).catch(error => {
        alert(error.message);
    });
}

function verifyPasswords() {
    let pass1 = $('#signup-password').val(),
        pass2 = $('#signup-password-verify').val();
    
    if (pass1 == pass2 && pass1.length >= 6) {
        return true;
    } else {
        if (pass1 != pass2) {
            $('#signupform .error').text("Passwords don't match").slideDown();
        } else if (pass1 == pass2 && pass1.length < 6) {
            $('#signupform .error').text("Password isn't strong enough").slideDown();
        }
        return false;
    }
}