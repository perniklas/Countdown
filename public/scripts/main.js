/* 
    Mostly UI and global variables.
*/ 

var db,
    auth,
    allTimers,
    countdown,
    currentTimer = {};

$(() => {
    auth = firebase.auth();
    initAuth(auth);

    db = firebase.firestore();
    initDb(db);

    $('#menu-extra').on('click', function(e) {
        ToggleMenuModal(true);
    });
    
    $(document).on('click', function(event) {
        if (!$(event.target).closest('#menu-modal').length) {
            ToggleMenuModal();
        }
      });

    $('#menu-extra-logout').on('click', function() {
        logout();
    });

    $('#menu-extra-delete').on('click', function() {
        if(confirm("Are you sure you want to delete this timer?")) {
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
        saveTimer();
        DisplayMainContent('#countdown');
    });

    $('#alltimers-timers > div').on('click', function() {
        countdown = startCountdown(allTimers.find(timer => timer.ref.id == $(this).attr("data-timerid")));
    });
});

function displayNextTimer() {
    HideTimer();
    let next = allTimers.findIndex(timer => timer.ref.id == currentTimer.ref.id) + 1;
    if (next >= allTimers.length) { next = 0; }
    countdown = startCountdown(allTimers[next]);
    DisplayMainContent('#countdown');
    ShowTimer();
}

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
                    countdown = startCountdown({name: 'No timers found', end: new Date().getTime() + 25252252});
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

function startCountdown(timer) {
    if (countdown) clearInterval(countdown);
    if (!timer.name) { timer.name = "Untitled"; }
    $('#countdown-title').empty().text(timer.name);
    if (timer.end) $('#countdown-end-datetime').empty().text(formatEndDateTimeToString(timer.end));
    return setInterval(() => {
        timeBetween = timer.end.milliseconds - new Date().getTime();
        currentTimer = timer;
        displayTimerNumbers(timeBetween);
    }, 1000);
}

function formatEndDateTimeToString(end) {
    let e = new Date(end.milliseconds);
    let date = (e.getDate() < 10 ? "0" + e.getDate() : e.getDate()) + "." +
        (e.getMonth() < 10 ? "0" + (e.getMonth() + 1) : (e.getMonth() + 1)) + "." +
        e.getFullYear() + ", " +
        (e.getHours() < 10 ? "0" + e.getHours() : e.getHours()) + ":" +
        (e.getMinutes() < 10 ? "0" + e.getMinutes() : e.getMinutes());
    return date;
}

function displayTimerNumbers(time) {
    if (time > 0) {
        let days = Math.floor(time / (1000 * 60 * 60 * 24)),
            hours = Math.floor((time % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60)),
            seconds = Math.floor((time % (1000 * 60)) / 1000);
        $('#days').text(days);
        $('#hours').text(hours);
        $('#minutes').text(minutes);
        $('#seconds').text(seconds);
    } else {
        $('#days').text("0");
        $('#hours').text("0");
        $('#minutes').text("0");
        $('#seconds').text("0");
    }
}