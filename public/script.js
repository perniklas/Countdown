var db,
    soonest = 2569600000000;

$(function() {
    db = firebase.firestore();
    let timers = fetchAllTimers();
    let timer = startCountdown(soonest);
});

function startCountdown(end) {
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
            console.log(doc.data());
            if (doc.data().end.seconds * 100 < soonest) {
                soonest = doc.data().end.seconds * 100;
            }
        });
    });
    return timers;
}