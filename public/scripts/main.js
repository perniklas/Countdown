/* 
    Mostly global variables and some countdown logic.
*/ 

var db,
    auth,
    func,
    allTimers,
    countdown,
    currentTimer = {};

$(() => {
    auth = firebase.auth();
    initAuth(auth);

    func = firebase.functions();

    db = firebase.firestore();
    initDb(db);

    $('#menu-extra').on('click', function() {
        ToggleMenuModal(true);
    });
    
    $(document).on('click', function(event) {
        if (!$(event.target).closest('#menu-modal, #menu-extra').length) {
            ToggleMenuModal();
        }
    });

    $('#menu-extra-logout').on('click', function() {
        logout();
    });

    $('#menu-extra-delete').on('click', function() {
        if(confirm("Are you sure you want to delete this timer?")) {
            ToggleMenuModal();
            deleteCurrentTimer();
        }
    });

    $('#menu-newtimer').on('click', function() {
        if ($(this).hasClass('button-active')) {
            $(this).removeClass('button-active');
            DisplayMainContent('#countdown');
        } else {
            SetMenuButtonActive($(this));
            DisplayMainContent('#newtimer');
        }
    });

    $('#menu-nexttimer').on('click', function() {
        $('.button-active').removeClass('button-active');
        displayNextTimer();
    });

    $('#menu-alltimers').on('click', function() {
        if ($(this).hasClass('button-active')) {
            $(this).removeClass('button-active');
            DisplayMainContent('#countdown');
        } else {
            SetMenuButtonActive($(this));
            DisplayMainContent('#alltimers');
        }
    });

    $('#newtimer-form').on('submit', function() {
        if ($('#newtimer-end-date').val() && $('#newtimer-name').val()) {
            saveTimer();
            $('.button-active').removeClass('button-active');
            DisplayMainContent('#countdown');
        } else {
            alert("A timer needs at least a name and an end date.");
        }
    });

    $(document).on('click', '.timer-element', function() {
        console.log($(this));
        $('.button-active').removeClass('button-active');
        countdown = startCountdown(allTimers.find(timer => timer.ref.id == $(this).attr("data-timerid")));
        DisplayMainContent('#countdown');
    });
});

/**
 * Displays the timer that is after the currentTimer in allTimers array (whichever way the array has been ordered).
 */
function displayNextTimer() {
    HideTimer(true);
}

/**
 * Horrible name. Takes care of loading the page after users log in (waiting for timers to load etc).
 * Does too many things, should be split up at some point.
 */
function loadPage() {
    if(auth.currentUser) {
        let seconds = 0;    
        var timersLoaded = setInterval(() => {
            console.log('Second: ' + seconds);
            if (seconds > 5 || allTimers.length > 0) {
                if (allTimers.length > 0) {
                    convertEndToMillis(allTimers);
                    currentTimer = findSoonestTimer();
                    countdown = startCountdown(currentTimer);
                    addTimersToAllTimersList();
                } else {
                    countdown = startCountdown({name: 'No timers found', end: {
                        milliseconds: new Date().getTime()}
                    });
                    //$('#countdown-content, #counters-text').hide();
                }
                clearInterval(timersLoaded);
            }
            seconds += 1;
        }, 1000);
        setTimeout(DoneLoading, 1000);
    } else {
        // render "no timers for you"
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
    $('#countdown-title').empty().text(timer.name);
    if (timer.end.seconds) $('#countdown-end-datetime').empty().text(formatEndDateTimeToString(timer.end));
    currentTimer = timer;
    let time = timer.end.milliseconds - new Date().getTime();
    if (time > 0) {
        UpdateTimer(time);
        return setInterval(() => {
            time -= 1000;
            UpdateTimer(time);
        }, 1000);
    } else {
        DisplayEndedTimer();
    }
}

/**
 * Formats a timers end time object to a string that is displayed under a timers' name.
 * @param {object} end 
 */
function formatEndDateTimeToString(end) {
    let e = new Date(end.milliseconds);
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
        confetti.stop();
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
    confetti.start();
}