var db,
    allTimers,
    countdown,
    currentTimer = {};

$(() => {
    //db = firebase.firestore();
    //allTimers = fetchAllTimers();
    let seconds = 0;    
    // var timersLoaded = setInterval(() => {
    //     console.log('Second: ' + seconds);
    //     if (++seconds == 5) clearInterval(timersLoaded);
    // }, 1000);

    // if (!allTimers[0]) {
    //     clearInterval(countdown);
    //     countdown = startCountdown({end: new Date().getTime() + 2629800000, name: "A month has passed"});
    // } else {
    //     currentTimer = allTimers[0];
    //     clearInterval(countdown);
    //     countdown = startCountdown(currentTimer);
    // }
});

function startCountdown(timer) {
    console.log(timer);
    let end = timer.end.seconds * 1000;
    return setInterval(() => {
        let now = new Date().getTime();
        $('#countdown-title').empty().text(timer.name || "Untitled");
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
    //timers.sort((a, b) => a.end - b.end); 

    return timers;
}