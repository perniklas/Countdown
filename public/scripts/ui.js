/**
 * UI functionality based on states.
 * States:
 * - Login
 *      - Sign up
 * 
 * - Loading timers
 * - Display timer
 * - Show all timers
 * - Add new timer
 * - Show menu modal
 */

function LoginOrSignup(signup = false) {
    if (signup) {
        $('#content > *, #menu').hide();
        DisplayMainContent('#login');
        $('#loginform').slideUp();
        $('#signupform').slideDown();
    } else {
        $('#content > *, #menu').hide();
        DisplayMainContent('#login');
        $('#signupform').hide();
        $('#login, #loginform').slideDown();
    }
}

/**
 * Hides everything except the desired container.
 * Intentional use is to pass ID of container to display.
 * 
 * @param {string} container 
 */
function DisplayMainContent(container) {
    $('#content > div').not(container + ', #menu').slideUp();
    $(container).slideDown();
}

function DoneLoading() {
    $('#content').addClass('slidefix');
    $('#countdown-header, #countdown-content, #counters-text, #menu').slideDown();
    $('#content').removeClass('slidefix');
}

function HideTimer() {
    $('#content').addClass('slidefix');
    $('#countdown-title, #counters, #counters p, #counters-text, #counters-text p').slideUp();
}

function ShowTimer() {
    $('#content').removeClass('slidefix')
    $('#countdown-title, #counters, #counters p, #counters-text, #counters-text p').slideDown();
}

function ToggleMenuModal(show = false) {
    if (show) {
        $('#menu-modal').fadeIn();
    } else {
        $('#menu-modal').fadeOut();
    }
}

function SetMenuButtonActive(button) {
    $('.button-active').removeClass('button-active');
    button.addClass('button-active');
}