/*
    Authentication handling.
*/

function initAuth(auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            if (user.email) {
                loadPage();
            }
        } else {
            /* User logs out */
            ui.States.Login.LoginSignUp();
        }
    });

    $('#loginform').on('submit', (e) => {
        e.preventDefault();
        let username = $('#login-username').val(),
            password = $('#login-password').val();

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
        if (verifyPasswords($('#signup-password').val(), $('#signup-password-verify').val())) {
            e.preventDefault();            
            auth.createUserWithEmailAndPassword($('#signup-username').val(), $('#signup-password').val()).then((cred) => {
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
        console.log("[Info]: User signed out");
    }).catch(error => {
        alert(error.message);
    });
}

function VerifyEmail(email) {
    if (typeof email === 'string' || email instanceof String) {
        return /\S+@\S+\.\S+/.test(email);
    }
    return false;
}

function verifyPasswords(pass1, pass2) {
    if (pass1 == pass2 && pass1.length >= 6) {
        return true;
    } else {
        if (pass1 != pass2) {
            $('#signupform .error').text("Passwords don't match").slideDown();
        } else if (pass1 == pass2 && pass1.length < 6) {
            $('#signupform .error').text("Password isn't long enough").slideDown();
        }
        return false;
    }
}

/**
 * Sends an email to the given user, letting them change their password.
 * 
 * @param {string} user 
 */
function ResetPassword() {
    let user = $('#login-username').val();
    // verify email address?
    if (user && VerifyEmail(user)) {
        auth.sendPasswordResetEmail(user).then(function() {
            // Email sent.
            $('#loginform .error').text('An email has been sent to you with instructions on how to reset the password.').slideDown();
          }).catch(function(error) {
            // An error happened.
            $('#loginform .error').text(error.message).slideDown();
          });
    } else {
        $('#loginform .error').text('Please provide an email address').slideDown();
    }
}