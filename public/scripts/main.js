var db,
    auth,
    allTimers,
    countdown,
    currentTimer = {},
    timersListener;

$(() => {
    db = firebase.firestore();
    auth = firebase.auth();
    initAuth(auth);
    initDb(db);

    $('#menu-button').on('click', () => {
        $('#menu').slideToggle();
    });

    $('#logout-button').on('click', () => {
        logout();
    });

    $('#delete-button').on('click', () => {
        if(confirm("Are you sure you want to delete this timer?")) {
            deleteCurrentTimer();
        }
    });

    $('#add-button').on('click', () => {
        $('#newtimer, #countdownsContainer').slideToggle();
    });

    $('#newtimer-form').on('submit', () => {
        saveTimer();
    });

    $('#next-button').on('click', () => {
        displayNextTimer();
    });
});

function displayNextTimer() {
    $('#countdown-title, #counters, #counters p, #counters-text, #counters-text p').slideUp(600, () => {
        let next = allTimers.findIndex(timer => 
            timer.name === currentTimer.name && 
            timer.end.milliseconds === currentTimer.end.milliseconds &&
            timer.created.seconds === currentTimer.created.seconds) + 1;
        if (next >= allTimers.length) { next = 0; }
        countdown = startCountdown(allTimers[next]);
    });
    setTimeout(() => {
        $('#countdown-title, #counters, #counters p, #counters-text, #counters-text p').slideDown();
    }, 1000);
}

function loadPage(authenticated = false) {
    if(authenticated) {
        let seconds = 0;    
        var timersLoaded = setInterval(() => {
            console.log('Second: ' + seconds);
            if (++seconds == 6 || allTimers.length > 0) {
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
    $('#countdown-header, #countdown-content, #counters-text').slideDown();
    $('.menu-container').css('display', 'flex');
}

function startCountdown(timer) {
    if (countdown) clearInterval(countdown);
    if (!timer.name) { timer.name = "Untitled"; }
    $('#countdown-title').empty().text(timer.name);
    return setInterval(() => {
        timeBetween = timer.end.milliseconds - new Date().getTime();
        currentTimer = timer;
        if (timeBetween > 0) {
            let days = Math.floor(timeBetween / (1000 * 60 * 60 * 24)),
                hours = Math.floor((timeBetween % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes = Math.floor((timeBetween % (1000 * 60 * 60)) / (1000 * 60)),
                seconds = Math.floor((timeBetween % (1000 * 60)) / 1000);
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
    }, 1000);
}

