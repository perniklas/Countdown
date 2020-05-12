/*
    Database (Firestore) related JS and jQuery.
*/

var db = {
    SaveTimer: async function(timer) {
        ui.States.Loading.Start('Saving countdown');
        let save = functions.httpsCallable('saveTimer');
        let result = await save(timer);
        return result.data;
    },
    GetAllTimers: async function(user, callback = null) {
        let fetchTimers = functions.httpsCallable('getTimersForCurrentUser');
        let unfiltered = await fetchTimers(user.uid);
        let timers = [];
        $.each(unfiltered.data, (i, timer) => {
            if (!timer.toBeDeleted) timers.push(timer); 
            else {
                if (timer.toBeDeleted === false) timers.push(timer);
            }
        });
        console.log(timers);
        allTimers = timers;
        console.log("[Info]: Fetched " + allTimers.length + " records from firestore");
        convertEndToMillis(allTimers);
        allTimers = sortTimersBySoonest(allTimers);
        AddTimersToAllTimersList(allTimers);
        if (callback) callback;
    },
    DeleteTimer: async function(timer, callback = null) {
        ui.States.Loading.Start('Deleting');
        let next = GetNextTimer();
        let deleteFunction = functions.httpsCallable('deleteTimer');
        let markForDeletionFunction = functions.httpsCallable('markTimerForDeletion');

        console.log('[Info]: Marking countdown for deletion: ' + timer);
        let mark = await markForDeletionFunction(timer);
        console.log(mark.data);
        StartLoadingTimers(next);

        console.log('[Info]: Deleting countdown');
        let del = await deleteFunction(timer);
        if (del.data == 'ok') {
            console.log('Timer was deleted');
        } else {
            console.log('[ERROR]: ', result.data);
        }
        if (callback) callback();
    },
    /**
     * Migrate ended countdowns from the Timers collection to the Expired collection.
     */
    MigrateEndedTimers: async function() {
        console.log('[Info]: Migrating ended timers...');
        let migrate = functions.httpsCallable('migrateEndedTimers');
        let count = await migrate();
        if (count.data > 0) {
            console.log('[Info]: Migrated ' + count.data + ' ended countdowns.');
        } else {
            console.log('[Info]: No countdowns migrated.');
        }
    },
    DeleteAllDataForCurrentUser: async function() {
        let deleteAllActiveTimers = functions.httpsCallable('deleteAllTimers');
        await deleteAllActiveTimers('yes');

        let deleteAllExpiredTimers = functions.httpsCallable('deleteAllExpired');
        await deleteAllExpiredTimers('maybe');

        let deleteColors = functions.httpsCallable('deleteColors');
        await deleteColors('yes');
        
        let deleteUserLog = functions.httpsCallable('deleteUserLogs');
        await deleteUserLog('yes');
    },
    ResetColorsForCurrentUser: async function() {
        let deleteColors = functions.httpsCallable('deleteColors');
        await deleteColors('yes');
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
        endMS: endDateTime.getTime(),
        ref: {
            id: null
        }
    };
    let savedTimer = await db.SaveTimer(newTimer);
    if (savedTimer) {
        console.log('[Info]: Saved timer ', savedTimer);
        StartLoadingTimers(savedTimer);
    } else {
        console.log('[ERROR]: Could not save timer');
        ui.Main.DisplayMainContent('#countdown');
    }
}

async function EditTimer() {
    let newEndDateTime = concatDateAndTime($('#edittimer-end-date').val(), $('#edittimer-end-time').val());
    currentTimer.name = $('#edittimer-name').val();
    currentTimer.endMS = new Date(newEndDateTime).getTime();
    let savedTimer = await db.SaveTimer(currentTimer);
    if (savedTimer) {
        console.log('[Info]: Edited countdown ', savedTimer);
        StartLoadingTimers(savedTimer);
    } else {
        console.log('[ERROR]: Could not save countdown');
        ui.Main.DisplayMainContent('#countdown');
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
 * Adds all elements in allTimers array (found in db.GetAllTimers) to the alltimers-timers HTML element.
 * The timers' identity is provided as a data attribute for ease of use when element is clicked.
 */
function AddTimersToAllTimersList(timers = allTimers) {
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
    return '<div class="timer-element" data-timerid="' + timer.ref.id + '"><p>' + timer.name + '</p><p>' + formatEndDateTimeToString(timer.end) + '</p></div>'
}

function GetNextTimer() {
    if (!allTimers) return;
    let index = allTimers.findIndex(t => t.ref.id == currentTimer.ref.id) + 1;
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