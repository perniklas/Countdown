/*
    Database (Firestore) related JS and jQuery.
*/

class DatabaseHandler {
    activeTimersCollection;
    myActiveTimers = [];
    isLoadingRightNow = false;

    expiredTimersCollection;
    myExpiredTimers = [];

    myColors;

    currentTimer;
    
    constructor(userID, callback) {
        let fs = firebase.firestore();
        this.activeTimersCollection  = fs.collection("timers"); //.where('userId', '==', userID);
        this.expiredTimersCollection = fs.collection("expired"); //.where('userId', '==', userID);
        this.myColors                = fs.collection("userscolors"); //.where('userId', '==', userID);

        this.MigrateEndedTimers(this.GetActiveTimers(this.GetExpiredTimers(callback)));
    }

    GetActiveTimers(callback) {
        this.isLoadingRightNow = true;
        this.activeTimersCollection.where('userId', '==', auth.getUid()).onSnapshot(snap => {
            this.myActiveTimers = [];
            snap.forEach(doc => {
                let timer = doc.data();
                let add = () => {
                    timer.ref = doc.ref;
                    this.myActiveTimers.push(timer);
                }
                if (!timer.toBeDeleted || timer.toBeDeleted === false) add();
            });
            console.log("[Info]: Fetched " + this.myActiveTimers.length + " records from active timers");
            this.ConvertTimerEndingToMillis(this.myActiveTimers);
            this.SortTimersBySoonest(this.myActiveTimers);
            this.AddTimersToAllTimersList(this.myActiveTimers);
            this.isLoadingRightNow = false;
            if (callback) callback;
        }).bind(this);
    }

    GetExpiredTimers(callback) {
        // this.isLoadingRightNow = true;
        this.expiredTimersCollection.where('userId', '==', auth.getUid()).onSnapshot(snap => {
            this.myExpiredTimers = [];
            snap.forEach(doc => {
                let timer = doc.data();
                timer.ref = doc.ref;
                this.myExpiredTimers.push(timer);
            });
            console.log("[Info]: Fetched " + this.myActiveTimers.length + " records from expired timers");
            this.ConvertTimerEndingToMillis(this.myActiveTimers);
            this.SortTimersBySoonest(this.myActiveTimers);
            // this.AddTimersToAllTimersList(this.myActiveTimers);
            // this.isLoadingRightNow = false;
            if (callback) callback;
        }).bind(this);
    }

    GetNextTimer() {
        if (!this.myActiveTimers || this.myActiveTimers.length == 0) return;
        let index = this.myActiveTimers.findIndex(t => t.ref.id == this.currentTimer.ref.id) + 1;
        if (index >= this.myActiveTimers.length) index = 0;
        return this.myActiveTimers[index];
    }

    GetPreviousTimer() {
        if (!this.myActiveTimers) return;
        let index = this.myActiveTimers.findIndex(t => t.ref.id == this.currentTimer.ref.id) - 1;
        if (index < 0) index = this.myActiveTimers.length - 1;
        return this.myActiveTimers[index];
    }

    GetTimerByID(id) {
        if (!this.myActiveTimers) return;
        return this.myActiveTimers.find(t => t.ref.id === id);
    }

    MigrateEndedTimers() {
        console.log('[Info]: Migrating ended timers...');
        let count = 0;
        this.activeTimersCollection.where('userId', '==', auth.getUid()).onSnapshot(snap => {
            snap.forEach(doc => {
                if (!doc.data().end) doc.ref.delete();
                else if (new Date((doc.data().end.seconds * 1000) + doc.data().end.nanoseconds) < new Date()) {
                    this.expiredTimersCollection.add(doc.data());
                    count += 1;
                    doc.ref.delete();
                }
            });
        }).bind(this);
        if (count > 0) 
            console.log(count > 0 ? '[Info]: Migrated ' + count + ' ended countdowns.' : '[Info]: No countdowns migrated.');
    }

    AddNewTimer() {
        let endDateTime = concatDateAndTime($('#newtimer-end-date').val(), $('#newtimer-end-time').val());
        let newTimer = {
            name: $('#newtimer-name').val(),
            endMS: endDateTime.getTime(),
            end: endDateTime,
            ref: {
                id: null
            },
            created: new Date(),
            updated: new Date()
        };

        let userId = auth.getUid();
        newTimer['userId'] = userId;

        newTimer.created.milliseconds = newTimer.created.getTime();
        newTimer.updated.milliseconds = newTimer.updated.getTime();

        newTimer.ref.id = userId + "---" + newTimer.name + "---" + newTimer.created.toISOString();

        let func = () => { StartLoadingTimers(this.currentTimer); };
        this.SaveTimer(newTimer, func);
    }

    SaveTimer(timer, callback) {
        ui.StartLoading('Saving countdown');
        this.activeTimersCollection.doc(timer.ref.id).set(timer)
            .then(() => {
                this.GetActiveTimers(StartCountdown(this.GetTimerByID(timer.ref.id)));
                this.currentTimer = timer;
                $('#newtimer-form').trigger('reset');

                if (callback) callback();
            })
            .catch(function(error) {
                console.log('[ERROR]: ' + error);
            });
    }

    DeleteTimer(timer, callback) {
        ui.StartLoading('Deleting');
        let next = this.GetNextTimer();
        console.log('[Info]: Deleting countdown');

        this.activeTimersCollection.doc(timer.ref.id).delete()
            .then(() => {
                console.log("Timer successfully deleted.");
                StartLoadingTimers(next);
                if (callback) callback();
            }).catch(error => {
                alert(error);
                StartLoadingTimers(timer);
            });
    }

    ConvertTimerEndingToMillis(timers) {
        $.each(timers, function(i, timer) {
            if (timer.end) timer.end._milliseconds = (timer.end.seconds * 1000) + timer.end.nanoseconds;
        });
    }

    /* SORTING */
    SortTimersByNewest(timers) {
        timers.sort((a, b) => b.created._seconds - a.created._seconds); 
    }
    
    SortTimersByOldest(timers) {
        timers.sort((a, b) => a.created._seconds - b.created._seconds); 
    }
    
    SortTimersBySoonest(timers) {
        timers.sort((a, b) => a.end._milliseconds - b.end._milliseconds); 
    }
    
    SortTimersByLatest(timers) {
        timers.sort((a, b) => b.end._milliseconds - a.end._milliseconds); 
    }

    AddTimersToAllTimersList(timers = this.myActiveTimers) {
        $('#alltimers-timers').empty();
        if (!timers) return;
        $.each(timers, (index, timer) => {
            $('#alltimers-timers').append(
                GenerateTimerListElement(timer)
            );
        });
        setTimeout(() => {
            colors.SetElementBGImageColors('.timer-element', colors.GenerateGradientString(colors, true));
        }, 150);
    }

    EditTimer() {
        let newEndDateTime = concatDateAndTime($('#edittimer-end-date').val(), $('#edittimer-end-time').val());
        this.currentTimer.name = $('#edittimer-name').val();
        this.currentTimer.endMS = new Date(newEndDateTime).getTime();

        var func = () => { StartLoadingTimers(this.currentTimer); };
        db.SaveTimer(this.currentTimer, func);
    }

    DeleteAllDataForCurrentUser() {
        let activeCount = 0;
        this.activeTimersCollection.where('userId', '==', auth.getUid()).onSnapshot(snap => {
            snap.forEach(doc => {
                activeCount += 1;
                doc.delete();
            }).then(() => {
                console.log("Deleted " + activeCount + " active countdowns");
            });
        });

        let expiredCount = 0;
        this.expiredTimersCollection.where('userId', '==', auth.getUid()).onSnapshot(snap => {
            snap.forEach(doc => {
                expiredCount += 1;
                doc.delete();
            }).then(() => {
                console.log("Deleted " + expiredCount + " expired countdowns");
            });
        });

        let colorCount = 0;
        this.myColors.onSnapshot(snap => {
            snap.forEach(doc => {
                if (doc.ref.id == auth.getUid()) {
                    colorCount += 1;
                    doc.delete();
                }
            }).then(() => {
                console.log("Deleted " + colorCount + " user settings");
            });
        });
    }
}

function concatDateAndTime(date, time) {
    if (time.length > 0) {
        return new Date(date + "T" + time);
    } else {
        return new Date(date + "T12:00");
    }
};

/**
 * Returns a Timer object that is the one with the shortest amount of time left on the countdown.
 */
function findSoonestTimer() {
    let newTimersObject = db.myActiveTimers;
    db.SortTimersBySoonest(newTimersObject);
    let now = new Date().getTime();
    let firstAnfsest = newTimersObject[0],
        found = false;
    newTimersObject.forEach(timer => {
        if (timer.end._milliseconds > now && !found) {
            found = true;
            firstAnfsest = timer;
        }
    });
    return firstAnfsest;
}

/**
 * Adds all elements in allTimers array (found in db.GetAllTimers) to the alltimers-timers HTML element.
 * The timers' identity is provided as a data attribute for ease of use when element is clicked.
 */
function AddTimersToAllTimersList(timers = db.myActiveTimers) {
    $('#alltimers-timers').empty();
    if (!timers) return;
    $.each(timers, (index, timer) => {
        $('#alltimers-timers').append(
            GenerateTimerListElement(timer)
        );
    });
    setTimeout(() => {
        colors.SetElementBGImageColors('.timer-element', colors.GenerateGradientString(colors, true));
    }, 150);
}

function AddTimersToExpiredTimersList(timers = db.myExpiredTimers) {
    $('#alltimers-expired').empty();
    if (!timers) return;
    $.each(timers, (index, timer) => {
        $('#alltimers-expired').append(
            GenerateTimerListElement(timer)
        );
    });
}

function GenerateTimerListElement(timer) {
    if (!timer) return;
    return '<div class="timer-element" data-timerid="' + timer.ref.id + '"><p>' + timer.name + '</p><p>' + formatEndDateTimeToString(timer.end) + '</p></div>'
}