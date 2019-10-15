/*
    Authentication handling.
*/

function initAuth(auth) {
    var userLog = {};
    auth.onAuthStateChanged((user) => {
        if (user) {
            if (user.email) {
                $('#login').slideUp();
                allTimers = fetchAllTimers(user);
                addOrUpdateUserCollecton();
                loadPage();
            }
        } else {
            // if user logs out
            $('#countdown-header, #countdown-content, #counters-text, .menu-container').slideUp();
            $('#login').slideDown();
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
            console.log('Signed in user ' + cred.User.email);
        }).catch(err => {
            console.log(err);
            $('#loginform .error').text(err.message).slideDown();   
        });
    });
    
    $('#signupform').on('submit', (e) => {
        e.preventDefault();
        userLog.displayname = $('#signup-displayname').val(),
        userLog.username = $('#signup-username').val(),
        userLog.joined = new Date(),
        userLog.updated = new Date();
        
        auth.createUserWithEmailAndPassword(user.username, $('#signup-password').val()).then((cred) => {
            $('#signupform').trigger('reset');
            $('#signupform .error').hide();
            console.log('Created account: ' + cred.User.email);
        }).catch((err) => {
            console.log(err);
            $('#signupform .error').text(err.message).slideDown();   
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

function logout() {
    auth.signOut().then(() => {
        stopListening();
        console.log("Signed out");
    }).catch(error => {
        alert(error.message);
    });
}