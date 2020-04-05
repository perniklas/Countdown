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


    $('#menu-extra').on('click', function() {
        ui.Main.ToggleMenuModal(true);
    });
    
    $(document).on('click', function(event) {
        if (!$(event.target).closest('#menu-modal, #menu-extra').length) {
            ui.Main.ToggleMenuModal();
        }
    });

    $('#menu-extra-logout').on('click', function() {
        logout();
    });

    $('#menu-extra-delete').on('click', function() {
        if(confirm("Are you sure you want to delete this timer?")) {
            ui.Main.ToggleMenuModal();
            db.DeleteTimer(currentTimer);
        }
    });

    $('#menu-extra-edit').on('click', function() {
        UpdateEditFields();
        ui.Main.DisplayMainContent('#edittimer');
    });

    $('#menu-newtimer').on('click', function() {
        if ($(this).hasClass('button-active')) {
            $(this).removeClass('button-active');
            ui.Main.DisplayMainContent('#countdown');
        } else {
            ui.Main.SetMenuButtonActive($(this));
            ui.Main.DisplayMainContent('#newtimer');
        }
    });

    $('#edittimer-form').on('submit', function() {
        validateNewTimer();
        return false;
    });

    $('#edittimer-cancel').on('click', function () {
        ui.Main.DisplayMainContent('#countdown');
    });

    $('#menu-nexttimer').on('click', function() {
        $('.button-active').removeClass('button-active');
        displayNextTimer();
    });

    $('#menu-alltimers').on('click', function() {
        if ($(this).hasClass('button-active')) {
            $(this).removeClass('button-active');
            ui.Main.DisplayMainContent('#countdown');
        } else {
            ui.Main.SetMenuButtonActive($(this));
            ui.Main.DisplayMainContent('#alltimers');
        }
    });

    $('#enableShift').on('click', function() {
        if ($(this).hasClass('shift')) {
            $(this).removeClass('shift');
        } else {
            $(this).addClass('shift');
        }
        colors.StartGradientShift();
    });

    $('#newtimer-form').on('submit', function() {
        validateNewTimer();
        return false;
    });

    $(document).on('click', '.timer-element', function() {
        $('.button-active').removeClass('button-active');
        countdown = startCountdown(allTimers.find(timer => timer.id == $(this).attr("data-timerid")));
        ui.Main.DisplayMainContent('#countdown');
    });
});

function validateNewTimer(edit = false) {
    if (($('#newtimer-end-date').val() && $('#newtimer-name').val()) 
        || ($('#edittimer-end-date').val() && $('#edittimer-name').val())) {
        if (edit) {
            EditTimer();
        } else {
            AddNewTimer();
        }
        $('.button-active').removeClass('button-active');
        ui.Main.DisplayMainContent('#countdown');
    } else {
        alert("A countdown needs at least a name and an end date.");
    }
}

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
function displayNextTimer() {
    if (!allTimers) return;
    HideTimer(StartNext);
}

function HideTimer(callback = null) {
    $('#content').addClass('slidefix');
    $('#countdown-content').slideUp("swing", () => {
        if (callback) callback();
    });
}

function StartNext() {
    countdown = startCountdown(GetNextTimer());
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
    ui.States.Loading.Start();
    await db.GetAllTimers(auth.currentUser, MigrateEndedTimers).then(() => {
        LoadingComplete(displayTimer);
    });
}

function LoadingComplete(timer = null) {
    ui.Main.DisplayMainContent('#countdown');
    if (!allTimers) StartEmptyCountdown();
    else if (allTimers.length < 1) {
        StartEmptyCountdown();
    } else {
        if (timer) {
            countdown = startCountdown(timer);
        } else {
            countdown = startCountdown(findSoonestTimer());
        }
    }
}

/* ABOVE SECTION IS A MESS */

function StartEmptyCountdown() {
    countdown = startCountdown({ name: 'No timers found', end: { _milliseconds: new Date().getTime() }});
    ui.States.Empty.DisplayNoTimersFound();
}

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
    let time = timer.end._milliseconds - new Date().getTime();
    if (time > 0) {
        UpdateTimer(time);
        return setInterval(() => {
            time = timer.end._milliseconds - new Date().getTime();
            //time -= 1000;
            UpdateTimer(time);
        }, 1000);
    } else {
        DisplayEndedTimer();
    }
}

function DisplayTimerInfo(timer) {
    $('#countdown-title').empty().text(timer.name);
    if (timer.end._milliseconds) $('#countdown-end-datetime').empty().text(formatEndDateTimeToString(timer.end));
}

/**
 * Formats a timers end time object to a string that is displayed under a timers' name.
 * @param {object} end 
 */
function formatEndDateTimeToString(end) {
    let e = new Date(end._milliseconds);
    let date = (e.getDate() < 10 ? "0" + e.getDate() : e.getDate()) + "." +
        (e.getMonth() < 10 ? "0" + (e.getMonth() + 1) : (e.getMonth() + 1)) + "." +
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