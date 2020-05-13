/* 
    Mostly global variables and some countdown logic.
    Handles input events.
*/ 

var fs,
    auth,
    functions,
    allTimers,
    expiredTimers,
    countdown,
    currentTimer = {};

$(() => {
    FluxV2(new Date().getHours());
    auth = firebase.auth();
    initAuth(auth);
    
    functions = firebase.app().functions('europe-west2');

    fs = firebase.firestore();
    initFireStore(fs);

    /******* EVENT LISTENERS *******/

    /**
     * Open extra menu modal
     */
    $('#menu-extra').on('click', function() {
        ui.Components.Menu.Modal.Show();
    });
    
    /**
     * Close extra menu modal if user clicks outside of it
     */
    $(document).on('click', function(event) {
        if (!$(event.target).closest('#menu-modal, #menu-extra').length) {
            ui.Components.Menu.Modal.Hide();
        }
    });

    /**
     * Log out
     */
    $('#menu-extra-logout').on('click', function() {
        logout();
    });

    /**
     * Delete current timer
     */
    $('#countdown-delete').on('click tap touchstart', function() {
        if(confirm("Are you sure you want to delete this timer?")) {
            ui.Components.Menu.Modal.Hide();
            db.DeleteTimer(currentTimer);
        }
    });

    /**
     * Display new timer form
     */
    $('#menu-newtimer').on('click', function() {
        if ($(this).hasClass('button-active')) {
            ui.Main.DisplayMainContent('#countdown');
        } else {
            ui.Main.SetMenuButtonActive($(this));
            ui.Main.DisplayMainContent('#newtimer');
        }
    });

    /**
     * Save new timer
     */
    $('#newtimer-form').on('submit', async function(e) {
        e.preventDefault();
        if (ValidateNewTimer()) {
            ui.States.Loading.Start();
            $('.button-active').removeClass('button-active');
            await AddNewTimer();
            $('#newtimer-form')[0].reset();
        }
    });

    /**
     * Display edit timer form
     */
    $('#countdown-edit').on('click tap touchstart', function() {
        if ($(this).hasClass('button-active')) {
            ui.Main.DisplayMainContent('#countdown');
        } else {
            UpdateEditFields();
            ui.Main.SetMenuButtonActive($(this));
            ui.Main.DisplayMainContent('#edittimer');
        }
    });

    /**
     * Save edited timer
     */
    $('#edittimer-form').on('submit', async function(e) {
        e.preventDefault();
        if (ValidateNewTimer()) {
            ui.States.Loading.Start('Saving edit');
            await EditTimer();
            $('#edittimer-form')[0].reset();
        }
    });

    /**
     * Cancel editing timer
     */
    $('#edittimer-cancel').on('click', function () {
        $('#edittimer-form')[0].reset();
        ui.Main.DisplayMainContent('#countdown');
    });

    /**
     * Display next timer
     */
    $('#menu-nexttimer').on('click', function() {
        displayNextTimer();
    });

    /**
     * Display previous timer
     */
    $('#menu-previoustimer').on('click', function() {
        displayNextTimer(false);
    })

    /** 
     * Display all timers
     */
    $('#menu-alltimers').on('click', function() {
        if ($(this).hasClass('button-active')) {
            ui.Main.DisplayMainContent('#countdown');
        } else {
            ui.Main.SetMenuButtonActive($(this));
            ui.Main.DisplayMainContent('#alltimers');
        }
    });

    $('#login-help').on('click', function() {
        ui.Main.DisplayMainContent('#login-help-text', false);
    });

    /**
     * Degree of gradient shift listener
     */
    $(document).on('change', '#gradientInput', () => {
        colors.gradient = parseInt($('#gradientInput').val()) * 2.34;
    });
    
    /**
     * Display selected timer from list of all timers
     */
    $(document).on('click', '.timer-element', function() {
        countdown = startCountdown(allTimers.find(timer => timer.ref.id == $(this).attr("data-timerid")));
        ui.Main.DisplayMainContent('#countdown');
    });

    /**
     * Start/stop background gradient shift
     */
    $('#enableShift > span').on('click', function() {
        if ($(this).parent().hasClass('shift')) {
            $(this).html('start <i class="fas fa-palette"></i>');
            $(this).parent().removeClass('shift');
            $('.input-color-gradient').slideUp();
        } else {
            $(this).html('end <i class="fas fa-palette"></i>');
            $(this).parent().addClass('shift');
            $('.input-color-gradient').slideDown();
        }
        colors.StartGradientShift();
    });

    $('#menu-extra-about').on('click tap touchstart', function() {
        if ($(this).hasClass('button-active')) {
            ui.Main.DisplayMainContent('#countdown');
        } else {
            ui.Main.SetMenuButtonActive($(this));
            ui.Main.DisplayMainContent('#about');
        }
    });

    /**
     * Open the "About" section with a bunch of info that probably no one cares about.
     */
    $('.close').on('click tap touchstart', function() {
        if ($(this).is('#login-help')) {
            console.log(':)');
        } else {
            $('.button-active').removeClass('button-active');
            if (auth.currentUser) {
                ui.Main.DisplayMainContent('#countdown');
            } else {
                ui.States.Login.LoginSignUp();
            }
        }
    });

    /**
     * Delete me functionality (GPDR)
     */
    $('#menu-extra-delete').on('click', async function() {
        if(confirm("This will delete your user from this service, as well as all its " + 
            "data (countdowns, color schemes)")) {
            ui.Components.Menu.Modal.Hide();
            await DeleteCurrentUser();
        }
    });

    /**
     * Used when users forget their passwords
     */
    $('#login-password-forgot').on('click', function() {
        ResetPassword()
    });

    /**
     * Swipe gesture detection
     */
    var el = document.getElementById('countdown');
    swipedetect(el, function(swipedir){
        // swipedir contains either "none", "left", "right", "top", or "down"
        if (swipedir === 'left') {
            $('.button-active').removeClass('button-active');
            displayNextTimer();
        } else if (swipedir === 'right') {
            $('.button-active').removeClass('button-active');
            displayNextTimer(false);
        }
    });
});

/**
 * Check if input has legit values
 */
function ValidateNewTimer() {
    if (($('#newtimer-end-date').val() && $('#newtimer-name').val()) 
        || ($('#edittimer-end-date').val() && $('#edittimer-name').val())) {
        return true;
    } else {
        alert("A countdown needs at least a name and an end date.");
        return false;
    }
}

/**
 * Use current timer data to update values of input form for editing timer
 */
function UpdateEditFields() {
    $('#edittimer-name').val(currentTimer.name);
    let dt = new Date(currentTimer.end._milliseconds);
    let date = dt.getFullYear() + "-" 
        + (dt.getMonth() < 10 ? ("0" + (dt.getMonth() + 1)) : (dt.getMonth() + 1)) + "-"
        + (dt.getDate() < 10 ? ("0" + dt.getDate()) : dt.getDate());
    let time = (dt.getHours() < 10 ? "0" + dt.getHours() : dt.getHours()) + ":" 
        + (dt.getMinutes() < 10 ? "0" + dt.getMinutes() : dt.getMinutes());
    $('#edittimer-end-date').val(date);
    $('#edittimer-end-time').val(time);
}

/* BELOW SECTION IS A MESS */
function displayNextTimer(next = true) {
    if (!allTimers || allTimers.length < 1) return;
    $('#content').addClass('slidefix');
    $('#countdown-content').slideUp("swing", () => {
        if (next) {
            StartNext();
        } else {
            StartPrevious();
        }
    });
}

function StartNext() {
    countdown = startCountdown(GetNextTimer());
    ui.Main.DisplayMainContent('#countdown');
    $('#content').removeClass('slidefix')
    $('#countdown-content').slideDown();
}

function StartPrevious() {
    countdown = startCountdown(GetPreviousTimer());
    ui.Main.DisplayMainContent('#countdown');
    $('#content').removeClass('slidefix')
    $('#countdown-content').slideDown();
}

function loadPage() {
    if(auth.currentUser) {
        colors.GetColorsFromFS(true);
        StartLoadingTimers();
    }
}

async function StartLoadingTimers(displayTimer = null) {
    ui.States.Loading.Start('Fetching your things');
    await db.GetAllTimers(auth.currentUser).then(() => {
        LoadingComplete(displayTimer);
        db.MigrateEndedTimers();
    });
}

function LoadingComplete(timer = null) {
    ui.Main.DisplayMainContent('#countdown');
    if (!allTimers) StartEmptyCountdown();
    else if (allTimers.length < 1) {
        StartEmptyCountdown();
    } else {
        if (timer) {
            console.log('Starting timer: ' + timer);
            countdown = startCountdown(timer);
        } else {
            countdown = startCountdown(findSoonestTimer());
        }
    }
}

/**
 * Starts an empty countdown telling user there were no countdowns (maybe delete func)
 */
function StartEmptyCountdown() {
    countdown = startCountdown({ name: 'No timers found', end: { _milliseconds: new Date().getTime() }});
    ui.States.Empty.DisplayNoTimersFound();
}

/**
 * Checks if the length of allTimers is larger than 0
 * 
 * @param {number} seconds 
 */
function CheckForTimerLength(seconds = 0) {
    if (!allTimers) {
        return 0;
    }
    if (seconds % 1 == 0) console.log(`[Info]: Loading for ${seconds} seconds`);
    if (seconds > 10 || allTimers.length > 0) {
        if (allTimers.length > 0) {
            return 1;
        } else {
            return -1;
        }
    } else {
        return 0;
    }
}

/**
 * startCountdown takes care of the necessary workings to put a timer object into motion,
 * starting the countdown on the main countdown page.
 * 
 * @param {object} timer a timer object that has a name, end.milliseconds and a userid.
 */
function startCountdown(timer) {
    if (countdown) clearInterval(countdown);
    DisplayTimerInfo(timer);
    currentTimer = timer;
    let milliseconds = (timer.end._milliseconds) ? timer.end._milliseconds : (timer.end.milliseconds) ? timer.end.milliseconds : 0;
    let time = milliseconds - new Date().getTime();
    if (time > 0) {
        UpdateTimer(time);
        return setInterval(() => {
            time = milliseconds - new Date().getTime();
            UpdateTimer(time);
        }, 1000);
    } else {
        DisplayEndedTimer();
    }
}

function DisplayTimerInfo(timer) {
    $('#countdown-title').empty().text(timer.name);
    if (timer.end._milliseconds || timer.end.milliseconds) $('#countdown-end-datetime').empty().text(formatEndDateTimeToString(timer.end));
}

/**
 * Formats a timers end time object to a string that is displayed under a timers' name.
 * @param {object} end 
 */
function formatEndDateTimeToString(end) {
    let e;
    if (end.milliseconds) {
        e = new Date(end.milliseconds);
    } else {
        e = new Date(end._milliseconds);
    }
    let date = (e.getDate() < 10 ? "0" + e.getDate() : e.getDate()) + "." +
        (e.getMonth() < 9 ? "0" + (e.getMonth() + 1) : (e.getMonth() + 1)) + "." +
        e.getFullYear() + ", " +
        (e.getHours() < 10 ? "0" + e.getHours() : e.getHours()) + ":" +
        (e.getMinutes() < 10 ? "0" + e.getMinutes() : e.getMinutes());
    return date;
}

/**
 * Turn a millisecond value into the actual numbers being displayed in the countdown window.
 * 
 * @param {int} time Millisecond value
 */
function UpdateTimer(time) {
    if (time <= 0) {
        DisplayEndedTimer()
    } else {
        if (confetti.isRunning()) {
            confetti.stop();
        }
        let days = Math.floor(time / (1000 * 60 * 60 * 24)),
            hours = Math.floor((time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60)),
            seconds = Math.floor((time % (1000 * 60)) / 1000);
        $('#days').text(days);
        $('#hours').text(hours);
        $('#minutes').text(minutes);
        $('#seconds').text(seconds);
    }
}

function DisplayEndedTimer() {
    $('#days').text("0");
    $('#hours').text("0");
    $('#minutes').text("0");
    $('#seconds').text("0");
    if (CheckForTimerLength() == 1) {
        confetti.start();
    }
}