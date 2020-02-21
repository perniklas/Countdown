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
var originalColors,
    ogh1,
    ogh2,
    changed = false,
    light = 55;
    
function FluxV2(now) {
    if (now < 12) {
        light = 55 - ((12 - now) * 2);
    }
    else if (now > 17) {
        let n = ((now / 2) / 2.5);
        light = 55 - (n * n);
    } else {
        light = 55;
    }

    SetBGColors();
}

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

function SetBGColors(user = false) {
    let colors;
    if (user) {
        colors = GetCurrentGradientFromDB();
    }

    if (!changed) {
        originalColors = (colors == null) ? GetRGBFromLinearGradient('body') : colors;
        ogh1 = GetHSLValues(RGBToHSL(originalColors.col1));
        ogh2 = GetHSLValues(RGBToHSL(originalColors.col2));
    } else {
        let colors = GetRGBFromLinearGradient('body');
        ogh1 = GetHSLValues(RGBToHSL(colors.col1));
        ogh2 = GetHSLValues(RGBToHSL(colors.col2));
    }

    let gradient = 'linear-gradient(to bottom right, hsl(' + ogh1.h + ',' + ogh1.s + '%,' + light + '%), hsl(' + ogh2.h + ',' + ogh2.s + '%,' + light + '%))';
    $('body, .timer-element').css({'background-image': gradient});
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

function TimersAreLoaded() {
    $('#content').addClass('slidefix');
    $('#countdown-header, #countdown-content, #counters-text, #menu').slideDown();
    $('#content').removeClass('slidefix');
}

function HideTimer(next = false) {
    $('#content').addClass('slidefix');
    $('#countdown-content').slideUp("swing", () => {
        if (next) {
            StartNext();
        }
    });
}

function StartNext() {
    countdown = startCountdown(GetNextTimer());
    DisplayMainContent('#countdown');
    ShowTimer();
}

function ShowTimer() {
    $('#content').removeClass('slidefix')
    $('#countdown-content').slideDown();
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

let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);

window.addEventListener('resize', () => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
});

function StartGradientShift() {
    changed = true;
    let colors = GetRGBFromLinearGradient('body');
    let col1 = GetHSLValues(RGBToHSL(colors.col1)),
        col2 = GetHSLValues(RGBToHSL(colors.col2));
    
    return setInterval(function() {
        col1 = IncreaseHSLValues(col1, 0.3);
        col2 = IncreaseHSLValues(col2, 0.3);
        let gradient = 'linear-gradient(to bottom right, hsl(' + col1.h + ',' + col1.s + '%,' + light + '%), hsl(' + col2.h + ',' + col2.s + '%,' + light + '%))',
            reverse = 'linear-gradient(to top left, hsl(' + col1.h + ',' + col1.s + '%,' + light + '%), hsl(' + col2.h + ',' + col2.s + '%,' + light + '%))';
        $('body, .timer-element').css({'background-image': gradient});
        $('#menu-modal, .btn-submit').css({'background-image': reverse});
    }, 16.7);
}

function GetRGBFromLinearGradient(element) {
    let css = $(element).css('background-image');
    if (!css) return;
    let m1 = css.split('),')[0].match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/),
        m2 = css.split('),')[1].match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
    return {
        col1: "rgb(" + m1[1] + ", " + m1[2] + ", " + m1[3] + ")",
        col2: "rgb(" + m2[1] + ", " + m2[2] + ", " + m2[3] + ")"
    };
}

function GetHSLValues(str){
    let regexp = /hsl\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?%)\s*,\s*(\d+(?:\.\d+)?%)\)/g;
    let match = regexp.exec(str).slice(1);
    return match ? {
      h: parseInt(match[0]),
      s: parseInt(match[1]),
      l: parseInt(match[2])
    } : {};
}

function IncreaseHSLValues(cols, inc = 1) {
    return {
        h: ((cols.h + inc) > 360) ? (0 + inc) : (cols.h + inc),
        s: cols.s,
        l: cols.l
    };
}

function RGBToHSL(rgb) {
    let ex = /^rgb\((((((((1?[1-9]?\d)|10\d|(2[0-4]\d)|25[0-5]),\s?)){2}|((((1?[1-9]?\d)|10\d|(2[0-4]\d)|25[0-5])\s)){2})((1?[1-9]?\d)|10\d|(2[0-4]\d)|25[0-5]))|((((([1-9]?\d(\.\d+)?)|100|(\.\d+))%,\s?){2}|((([1-9]?\d(\.\d+)?)|100|(\.\d+))%\s){2})(([1-9]?\d(\.\d+)?)|100|(\.\d+))%))\)$/i;
    if (ex.test(rgb)) {
        let sep = rgb.indexOf(",") > -1 ? "," : " ";
        rgb = rgb.substr(4).split(")")[0].split(sep);
        
        for (let R in rgb) {
            let r = rgb[R];
            if (r.indexOf("%") > -1)
                rgb[R] = Math.round(r.substr(0,r.length - 1) / 100 * 255);
        }

        let r = rgb[0] / 255,
            g = rgb[1] / 255,
            b = rgb[2] / 255,

            cmin = Math.min(r,g,b),
            cmax = Math.max(r,g,b),
            delta = cmax - cmin,
            h = 0,
            s = 0,
            l = 0;

        if (delta == 0)
            h = 0;
        else if (cmax == r)
            h = ((g - b) / delta) % 6;
        else if (cmax == g)
            h = (b - r) / delta + 2;
        else
            h = (r - g) / delta + 4;

        h = Math.round(h * 60);
        if (h < 0)
            h += 360;
        l = (cmax + cmin) / 2;
        s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
        s = +(s * 100).toFixed(1);
        l = +(l * 100).toFixed(1);
        
        return "hsl(" + h + "," + s + "%," + l + "%)";

    } else {
        return "Invalid input color";
    }
}