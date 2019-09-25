$(function() {
    let timer = countdown(new Date('2019-12-31').getTime());
    db.collection("timers").get().then((snapshot) => {
        snapshot.forEach((doc) => {
            console.log(doc.data());
        });
    });
});

function countdown(end) {
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