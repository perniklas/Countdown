/*
    Database (Firestore) related JS and jQuery.
*/

var db = {
    SaveTimer: async function(timer) {
        ui.States.Loading.Start();
        let save = functions.httpsCallable('saveTimer');
        await save(timer).then(result => {
            console.log('[Info]: Saved timer ', result.data);
            LoadingComplete(result.data);
        });
    },
    GetAllTimers: async function(user, callback = null) {
        let fetch = functions.httpsCallable('getTimersForCurrentUser');
        await fetch(user.uid).then(result => {
            unfilteredTimers = result.data;
            let allTimers = [];
            console.log("[Info]: Fetched " + allTimers.length + " records from firestore");
            convertEndToMillis(allTimers);
            allTimers = sortTimersBySoonest(allTimers);
            addTimersToAllTimersList(allTimers);;
            colors.SetElementBGImageColors('',)
            if (callback) callback();
        });
    },
    DeleteTimer: async function(timer, callback = null) {
        ui.Loading.Start();
        let next = GetNextTimer();
        let deleteFunction = functions.httpsCallable('deleteTimer');
        let markForDeletionFunction = functions.httpsCallable('markTimerForDeletion');
        await markForDeletionFunction(timer).then(result => {
            console.log(result.data);
            StartLoadingTimers(next);
        });

        let del = await deleteFunction(timer).then(result => {
            if (result.data == 'ok') {
                console.log('Timer was deleted');
            } else {
                console.log('[ERROR]: ', result.data);
            }
            if (callback) callback();
        });

        return del;
    }
};

function initFireStore(fs) {
    if (fs) {
        console.log('[Info]: Firestore connection established.');
    } else {
        console.log('[ERROR]: Could not connect to Firestore.');
    }

    FluxV2(new Date().getHours());
}

async function AddNewTimer() {
    let endDateTime = concatDateAndTime($('#newtimer-end-date').val(), $('#newtimer-end-time').val());
    let newTimer = {
        name: $('#newtimer-name').val(),
        end: endDateTime.getTime(),
        created: new Date().getTime(),
        ref: {
            id: null
        }
    };
    await db.SaveTimer(newTimer);
}

async function EditTimer() {
    currentTimer.name = $('#edittimer-name').val();
    currentTimer.end._milliseconds = new Date(concatDateAndTime($('#edittimer-end-date').val(), $('#edittimer-end-time').val())).getTime();
    currentTimer.edited = new Date().getTime();
    await db.SaveTimer(currentTimer);
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
    let soonestTimers = sortTimersBySoonest(allTimers);
    let now = new Date().getTime();
    let firstAnfsest = soonestTimers[0],
        found = false;
    soonestTimers.forEach(timer => {
        if (timer.end._milliseconds > now && !found) {
            found = true;
            firstAnfsest = timer;
        }
    });
    return firstAnfsest;
}

function sortTimersByNewest(timers) {
    return timers.sort((a, b) => b.created._seconds - a.created._seconds); 
}

function sortTimersByOldest(timers) {
    return timers.sort((a, b) => a.created._seconds - b.created._seconds); 
}

function sortTimersBySoonest(timers) {
    return timers.sort((a, b) => a.end._milliseconds - b.end._milliseconds); 
}

function sortTimersByLatest(timers) {
    return timers.sort((a, b) => b.end._milliseconds - a.end._milliseconds); 
}

/**
 * Converts the Firestore timestamp from seconds/nanoseconds to milliseconds (much easier to work with).
 * 
 * @param {allTimers[]} timers 
 */
function convertEndToMillis(timers) {
    $.each(timers, function(i, timer) {
        timer.end._milliseconds = (timer.end._seconds * 1000) + timer.end._nanoseconds;
    });
}

/**
 * Takes the current snapshot of Firestore and pilfers through each record to check if they have ended.
 * If they have indeed ended they are first copied to the 'expired' collection before being removed from 
 * the 'timers' collection. Helps clean up the mess without actually deleting the timers.
 */
function MigrateEndedTimers() {
    console.log('[Info]: Migrating ended timers...');
    let migrate = functions.httpsCallable('migrateEndedTimers');
    migrate().then(function(result) {
        if (result > 0) {
            console.log("[Info]: Migrated " + result + " timers.");
        } else {
            console.log("[Info]: No timers migrated.");
        }
    });
}

/**
 * Adds all elements in allTimers array (found in db.GetAllTimers) to the alltimers-timers HTML element.
 * The timers' identity is provided as a data attribute for ease of use when element is clicked.
 */
function addTimersToAllTimersList(timers = allTimers) {
    $('#alltimers-timers').empty();
    if (!timers) return;
    $.each(timers, (index, timer) => {
        $('#alltimers-timers').append(
            GenerateTimerListElement(timer)
        );
    });
}

function AddTimersToExpiredTimersList(timers = expiredTimers) {
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
    return '<div class="timer-element" data-timerid="' + timer.id + '"><p>' + timer.name + '</p><p>' + formatEndDateTimeToString(timer.end) + '</p></div>'
}

function GetNextTimer() {
    if (!allTimers) return;
    let index = allTimers.findIndex(t => t.id == currentTimer.id) + 1;
    if (index >= allTimers.length) index = 0;
    return allTimers[index];
}

function GetPreviousTimer() {
    if (!allTimers) return;
    let index = allTimers.findIndex(t => t.ref.id == currentTimer.ref.id) - 1;
    if (index < 0) index = allTimers.length - 1;
    return allTimers[index];
}

function GetTimerByID(id) {
    if (!allTimers) return;
    return allTimers.find(t => t.ref.id === id);
}