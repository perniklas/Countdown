var db,
    auth,
    allTimers,
    countdown,
    currentTimer = {};

$(() => {
    db = firebase.firestore();
    auth = firebase.auth();
    initAuth(auth);

    $('#menu-button').on('click', () => {
        alert('This function is coming soon!');
    });

    $('#add-button').on('click', () => {
        $('#newtimer, #countdownsContainer').slideToggle();
    });

    $('#newtimer-form').on('submit', () => {
        let name = $('#newtimer-name').val(),
            end = new Date($('#newtimer-end').val()),
            created = new Date().getTime(),
            userId = auth.currentUser.uid;
        
        db.collection('timers').add({
            name: name,
            end: end,
            created: created,
            userId: userId
        }).then(() => {
            fetchAllTimers(auth.currentUser);
            setTimeout(() => {
                countdown = startCountdown(allTimers[allTimers.findIndex(timer => 
                    timer.name === name && timer.end.milliseconds === new Date(end).getTime())]);
            }, 1000);
        }).catch(error => {
            alert(error.message);
        });
    });

    $('#next-button').on('click', () => {
        var index = allTimers.findIndex(timer => timer.name === currentTimer.name && timer.end.milliseconds === currentTimer.end.milliseconds) + 1;
        if (index > allTimers.length) { index = 0; }
        countdown = startCountdown(allTimers[index]);
    });
});

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
    $('#countdown-header, #countdown-content, #counters-text, .menu-container').slideDown();
}

function findSoonestTimer() {
    let soonestTimers = sortTimersBySoonest(allTimers);
    let now = new Date().getTime();
    let firstAndBest = soonestTimers[0],
        found = false;
    soonestTimers.forEach(timer => {
        if (timer.end.milliseconds > now && !found) {
            console.log("Finding soonest timer");
            console.log(timer);
            found = true;
            firstAndBest = timer;
        }
    });
    return firstAndBest; // {name: 'All timers expired', end: new Date().getTime() + 25252513}
}

function startCountdown(timer) {
    if (countdown) clearInterval(countdown);
    return setInterval(() => {
        $('#countdown-title').empty().text(timer.name || "Untitled");
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

function fetchAllTimers(user) {
    let timers = [];
    db.collection("timers").get().then((snapshot) => {
        snapshot.forEach((doc) => {
            if (doc.data().userId == user.uid) {
                timers.push(doc.data());
            }
        });
    });
    console.log("Fetched " + timers.length + " records from firestore");
    return timers;
}

function sortTimersByNewest(timers) {
    return timers.sort((a, b) => b.created.seconds - a.created.seconds); 
}

function sortTimersByOldest(timers) {
    return timers.sort((a, b) => a.created.seconds - b.created.seconds); 
}

function sortTimersBySoonest(timers) {
    return timers.sort((a, b) => a.end.milliseconds - b.end.milliseconds); 
}

function sortTimersByLatest(timers) {
    return timers.sort((a, b) => b.end.milliseconds - a.end.milliseconds); 
}

function convertEndToMillis(timers) {
    timers.forEach(timer => {
        console.log("Converting from timestamp to milliseconds");
        timer.end.milliseconds = timer.end.toMillis();
    });
}