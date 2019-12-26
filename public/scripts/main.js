/* 
    Mostly UI and global variables.
*/ 

var db,
    auth,
    allTimers,
    countdown,
    currentTimer = {};

$(() => {
    db = firebase.firestore();
    auth = firebase.auth();
    initAuth(auth);
    initDb(db);

    $('#menu-extra').on('click', () => {
        $('#menu-modal').slideToggle();
    });

    $('#menu-extra-logout').on('click', () => {
        logout();
    });

    $('#delete-button').on('click', () => {
        if(confirm("Are you sure you want to delete this timer?")) {
            deleteCurrentTimer();
        }
    });

    $('#menu-newtimer').on('click', () => {
        $('#newtimer, #countdown-header, #countdown-content').slideToggle();
    });

    $('#newtimer-form').on('submit', () => {
        saveTimer();
    });

    $('#next-button').on('click', () => {
        displayNextTimer();
    });
});

function displayNextTimer() {
    $('#content').addClass('slidefix');
    $('#countdown-title, #counters, #counters p, #counters-text, #counters-text p').slideUp(600, () => {
        let next = allTimers.findIndex(timer => 
            timer.name === currentTimer.name && 
            timer.end.milliseconds === currentTimer.end.milliseconds &&
            timer.created.seconds === currentTimer.created.seconds) + 1;
        if (next >= allTimers.length) { next = 0; }
        countdown = startCountdown(allTimers[next]);
    });
    setTimeout(() => {
        $('#content').removeClass('slidefix')
        $('#countdown-title, #counters, #counters p, #counters-text, #counters-text p').slideDown();
    }, 1000);
}

function loadPage() {
    if(auth.currentUser) {
        let seconds = 0;    
        var timersLoaded = setInterval(() => {
            console.log('Second: ' + seconds);
            if (seconds > 10 || allTimers.length > 0) {
                seconds += 1;
                if (allTimers.length > 0) {
                    convertEndToMillis(allTimers);
                    currentTimer = findSoonestTimer();
                    countdown = startCountdown(currentTimer);
                } else {
                    countdown = startCountdown({name: 'No timers found', end: new Date().getTime() + 25252252});
                    $('#countdown-content, #counters-text').hide();
                }
                clearInterval(timersLoaded);
            }
        }, 1000);
        setTimeout(doneLoading, 1000);
    } else {
        // render "no timers for you"
    }
}

function doneLoading() {
    $('#content').addClass('slidefix');
    $('#countdown-header, #countdown-content, #counters-text, #menu').slideDown();
    $('#content').removeClass('slidefix');
}

function startCountdown(timer) {
    if (countdown) clearInterval(countdown);
    if (!timer.name) { timer.name = "Untitled"; }
    $('#countdown-title').empty().text(timer.name);
    displayEndDateTime(timer.end);
    return setInterval(() => {
        timeBetween = timer.end.milliseconds - new Date().getTime();
        currentTimer = timer;
        displayTimerNumbers(timeBetween);
    }, 1000);
}

function displayEndDateTime(end) {
    let e = new Date(end.milliseconds);
    let date = e.getDate() + "." + (e.getMonth() + 1) + "." + e.getFullYear() + " ";
    if (e.getHours() < 10) {
        date = date + "0" + e.getHours() + ":";
    } else {
        date = date + e.getHours() + ":";
    }
    if (e.getMinutes() < 10) {
        date = date + "0" + e.getMinutes() + ":";
    } else {
        date = date + e.getMinutes() + ":";
    }
    if (e.getSeconds() < 10) {
        date = date + "0" + e.getSeconds();
    } else {
        date = date + e.getSeconds();
    }
    $('#countdown-end-datetime').empty().text(date);
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