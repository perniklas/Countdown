/**
 * UI functionality based on states.
 */

let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);

window.addEventListener('resize', () => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
});

var colors = {
    original: {},
    col: DefaultColors().col,
    gradient: DefaultColors().gradient,
    light: 55,
    shiftInterval: null,
    GetColorsFromFS: function(setbackground = false) {
        if (!auth.currentUser) setTimeout(500);
        fs.collection('userscolors').doc(auth.currentUser.uid).get().then(c => {
            if (c) {
                if (c.data().colors) {
                    colors.col = (c.data().colors.col) ? c.data().colors.col : DefaultColors().col;
                    colors.gradient = (c.data().colors.gradient) ? c.data().colors.gradient : DefaultColors().gradient;
                    if (setbackground) colors.GentlySetBackgroundColor();
                }
            }
        });
    },
    SaveColorsToFS: function() { 
        fs.collection('userscolors').doc(auth.currentUser.uid).set({
            'colors': {
                'col': colors.col,
                'gradient': colors.gradient
            }
        });
    },
    GetColorsFromCurrentBG: function() {
        let bg = GetRGBFromLinearGradient('body');
        colors.col = GetHSLValues(RGBToHSL(bg.col));
    },
    SetBGColors: function(color = null) {
        let c = colors;
        if (color) c = color;
        let gradient = colors.GenerateGradientString(c),
            reverse = colors.GenerateGradientString(c, true);
        let midHue = colors.CalculateSecondaryHue(true);
            title = 'hsl(' + midHue + ', 100%, 30%)',
            subtitle = 'hsl(' + midHue + ', 60%, 30%)';
        colors.SetElementBGImageColors('body, .timer-element', gradient);
        colors.SetElementBGImageColors('#menu-modal, .btn-submit', reverse, 65);
        $('.color-main, #counters').css({'color': title});
        $('.color-sub').css({'color': subtitle});
    },
    GenerateGradientString: function(pColors, reverse = false, light = null) {
        if (!light) light = colors.light;
        let direction = 'to bottom right';
        if (reverse) direction = 'to top left';
        let hue2 = colors.CalculateSecondaryHue();

        return 'linear-gradient(' + direction + ', ' + 
            'hsl(' + pColors.col.h + ',' + (pColors.col.s / 2).toFixed() + '%,' + pColors.light + '%),' +
            'hsl(' + hue2 + ',' + (pColors.col.s / 2).toFixed() + '%,' + pColors.light + '%))';
    },
    SetElementBGImageColors: function(element, gradient) {
        $(element).css({'background-image': gradient});
    },
    StartGradientShift: function() {
        if (colors.shiftInterval) {
            clearInterval(colors.shiftInterval);
            colors.shiftInterval = null;
            colors.SaveColorsToFS();
        } else {
            colors.shiftInterval = setInterval(function() {
                colors.col.h = (colors.col.h + 0.25 > 360) ? 0 : colors.col.h + 0.25;
                colors.SetBGColors();
            }, 16.7);
        }
    },
    GentlySetBackgroundColor: function() {
        let tempcol = {
            col: DefaultColors().col,
            gradient: DefaultColors().gradient,
            light: colors.light
        };
        let now = new Date().getHours();

        if (tempcol.col.h != colors.col.h || tempcol.gradient != colors.gradient) {
            let down = true;
            let dark = setInterval(function() {
                if (down) tempcol.light = tempcol.light / 1.047;
                else tempcol.light = tempcol.light + (0.125 / ((2 / tempcol.light) > 1 ? 0.173 : (2 / tempcol.light)));

                colors.SetBGColors(tempcol);
                if (tempcol.light < 1.3) {
                    down = false;
                    tempcol.col = colors.col;
                    tempcol.gradient = colors.gradient;
                }
                if (tempcol.light >= GetFluxV2Value(now)) {
                    clearInterval(dark);
                }
            }, 16.7);
        } else {
            FluxV2(now);
        }
    },
    CalculateSecondaryHue: function(betweenTwoHues = false) {
        if (betweenTwoHues) return (colors.col.h - (colors.gradient / 2)) < 0 ? (360 + colors.col.h) - (colors.gradient / 2) : colors.col.h - (colors.gradient / 2);
        return (colors.col.h - colors.gradient) < 0 ? ((360 + colors.col.h) - colors.gradient) : colors.col.h - colors.gradient;
    }
};

var ui = {
    Main: {
        DisplayMainContent: function(container, displayMenu = true, callback = null) {
            if (container == '#countdown') {
                $('.button-active').removeClass('button-active');
            }

            $('#content > div').not(container + ', #menu').slideUp();
            ui.Components.Menu.Modal.Hide();
            $(container).slideDown();

            if ($('#countdown > div:not(#countdown-header)').is(':hidden')) {
                $('#countdown > div:not(#countdown-header)').slideDown();
            }

            if (displayMenu) {
                ui.Components.Menu.Show();
            } else {
                ui.Components.Menu.Hide();
            }
            if (callback) callback();
        },
        SetMenuButtonActive: function(button) {
            $('.button-active').removeClass('button-active');
            button.addClass('button-active');
        }
    },
    States: {
        Login: {
            LoginSignUp: function(signup = false) {
                $('#content > *, #menu').hide();
                ui.Main.DisplayMainContent('#login', false);
                if (signup) {
                    $('#loginform').slideUp();
                    $('#signupform').slideDown();
                } else {
                    $('#signupform').slideUp();
                    $('#login, #loginform').slideDown();
                }
            }
        },
        Loading: {
            Start: function(message = null) {
                if (message) {
                    $('#loading h1').text(message);
                } else {
                    $('#loading h1').text('Loading...');
                }
                ui.Main.DisplayMainContent('#loading', false);
                $('#menu').slideUp();
            },
            End: function(success = true) {
                if (success) {
                    $('#content').addClass('slidefix');
                    $('#countdown-header, #countdown-content, #counters-text, #menu').slideDown();
                    $('#content').removeClass('slidefix');
                    colors.GetColorsFromfs(true);
                } else {
                    ui.States.Empty.DisplayNoTimersFound();
                }
            }
        },
        Empty: {
            // create empty state func
            DisplayNoTimersFound: function() {
                $('#countdown-end-datetime').text('');
                ui.Main.DisplayMainContent('#countdown');
                $('#countdown > div:not(#countdown-header)').hide();
            }
        }
    },
    Components: {
        Menu: {
            Show: function() {
                if ($('#menu').is(':hidden')) {
                    $('#menu').css({display: 'flex'}).slideDown();
                }
            },
            Hide: function() {
                if ($('#menu').is(':visible')) {
                    $('#menu').slideUp();
                }
            },
            Modal: {
                Show: function() {
                    let modal = $('#menu-modal'),
                        modalButtons = $('#menu-modal > a');
                    if (modal.css('height') == '0px') {
                        let modalHeight = 16 + ($('#menu-modal > a').length * 31);
                        modal.show().animate({
                            height: modalHeight + 'px'
                        }, 1);
                        modalButtons.animate({
                            fontSize: '16px'
                        }, 240);
                    }
                },
                Hide: function() {
                  let modal = $('#menu-modal'),
                        modalButtons = $('#menu-modal > a');
                    if (modal.css('height') != '0px') {
                        modal.animate({
                            height: "0px"
                        }, 1);
                        modalButtons.animate({
                            fontSize: '0px'
                        }, 1);
                    }
                }
            }
        }
    }
};

function DefaultColors() {
    return {
        col: { h: 311, s: 100, l: 55 },
        gradient: 117
    };
}
    
function FluxV2(now) {
    if (now < 12) {
        colors.light = 55 - ((12 - now) * 2.5);
    }
    else if (now > 17) {
        let n = ((now / 2) / 2.5);
        colors.light = 55 - (n * n);
    } else {
        colors.light = 55;
    }

    colors.SetBGColors();
}

function GetFluxV2Value(now) {
    let light = 55;
    if (now < 12) {
        light = 55 - ((12 - now) * 2.5);
    }
    else if (now > 17) {
        let n = ((now / 2) / 2.5);
        light = 55 - (n * n);
    }
    return light;
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