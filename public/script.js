var db,
    countdown,
    currentTimer = {},
    allTimers = [];

$(function() {
    db = firebase.firestore();
    allTimers = fetchAllTimers();
    
    if (!allTimers[0]) {
        countdown = startCountdown({end: new Date().getTime() + 2629800000, name: "A month has passed"});
    } else {
        setTimeout(() => {
            currentTimer = allTimers[0];
        }, fetchAllTimers);
        countdown = startCountdown(currentTimer);
    }
});

function startCountdown(timer) {
    clearInterval(countdown);
    let end = timer.end.seconds * 100;
    return setInterval(function() {
        let now = new Date().getTime();
        timeBetween = end - now;
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

function fetchAllTimers() {
    let timers = [];
    db.collection("timers").get().then((snapshot) => {
        snapshot.forEach((doc) => {
            timers.push(doc.data());
        });
    });
    return timers;
}
