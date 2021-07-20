/**
 * UI functionality based on states.
 */

let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);

window.addEventListener('resize', () => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
});

class UserInterface {
    constructor() {
        this.FluxV2(new Date().getHours());
    }

    FluxV2(now) {
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

    DisplayMainContent(container, displayMenu = true, callback = null) {
        if (container == '#countdown') 
            $('.button-active').removeClass('button-active');

        $('#content > div').not(container + ', #menu').slideUp();
        //this.HideMenu();
        $(container).slideDown();

        if ($('#countdown > div:not(#countdown-header)').is(':hidden'))
            $('#countdown > div:not(#countdown-header)').slideDown();

        if (displayMenu)    this.ShowMenu();
        else                this.HideMenu();
        if (callback)       callback();
    }

    DisplayTimerWhenLoadingIsComplete(timer) {
        if (timer && timer.end) {
            let tingtong = setInterval(function() {
                if (!db.isLoadingRightNow) {
                    countdown = StartCountdown(timer);
                    this.DisplayMainContent('#countdown');
                    clearInterval(tingtong);
                }
            }.bind(this), 1500);
        }
    }

    SetMenuButtonActive(button) {
        $('.button-active').removeClass('button-active');
        button.addClass('button-active');
    }

    ShowMenu() {
        if ($('#menu').is(':hidden')) 
            $('#menu').css({display: 'flex'}).slideDown();
    }
    
    HideMenu() {
        if ($('#menu').is(':visible'))
            $('#menu').slideUp();
    }

    LoginSignUp(signup = false) {
        $('#content > *, #menu').hide();
        this.DisplayMainContent('#login', false);
        if (signup) {
            $('#loginform').slideUp();
            $('#signupform').slideDown();
        } else {
            $('#signupform').slideUp();
            $('#login, #loginform').slideDown();
        }
    }

    StartLoading(message = null) {
        if (message) {
            $('#loading h1').text(message);
        } else {
            $('#loading h1').text('Loading...');
        }
        this.DisplayMainContent('#loading', false);
        $('#menu').slideUp();
    }

    StopLoading(success = true) {
        if (success) {
            $('#content').addClass('slidefix');
            $('#countdown-header, #countdown-content, #counters-text, #menu').slideDown();
            $('#content').removeClass('slidefix');
            colors.GetColorsFromFS(true);
        } else {
            this.DisplayNoTimersFound();
        }
    }

    DisplayNoTimersFound() {
        $('#countdown-end-datetime').text('');
        this.DisplayMainContent('#countdown');
        $('#countdown > div:not(#countdown-header)').hide();
    }

    ShowModal() {
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
    }
    
    HideModal() {
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

class Colors {
    originalColors;
    colors;
    gradient;
    light;
    shiftInterval;

    constructor() {
        let defaultColors = this.DefaultColors();
        this.colors       = defaultColors.colors;
        this.gradient     = defaultColors.gradient;
        this.light        = 55;
    }

    GetColorsFromFS(setbackground = false, callback) {
        db.myColors.doc(auth.getUid()).get().then(col => {
            if (col) {
                if (col.data().colors) {
                    let def = this.DefaultColors();
                    if (def.colors.h != col.data().colors.colors.h && def.gradient != col.data().gradient) {
                        this.colors = col.data().colors.colors;
                        this.gradient = col.data().colors.gradient;
                        if (setbackground) this.GentlySetBackgroundColor();
                    }
                }
            }
            if (callback) callback();
        });
    }

    SaveColorsToFS() {
        db.myColors.doc(auth.getUid()).set({
            'colors': {
                'colors': this.colors,
                'gradient': this.gradient
            }
        });
    }

    // GetColorsFromCurrentBG() {
    //     let bg = GetRGBFromLinearGradient('body');
    //     this.colors = GetHSLValues(RGBToHSL(bg.colors));
    // }

    GenerateGradientString(isReversed = false) {
        let direction = 'to bottom right';
        if (isReversed) direction = 'to top left';
        let hue2 = this.CalculateSecondaryHue();

        return 'linear-gradient(' + direction + ', ' + 
            'hsl(' + this.colors.h + ',' + (this.colors.s / 2).toFixed() + '%,' + this.light + '%),' +
            'hsl(' + hue2 + ',' + (this.colors.s / 2).toFixed() + '%,' + this.light + '%))';
    }

    SetBGColors(color = null) {
        let currentColors = this;
        if (color) currentColors = color;

        let gradient = currentColors.GenerateGradientString(),
            reverse  = currentColors.GenerateGradientString(true),
            midHue   = currentColors.CalculateSecondaryHue(true),
            title    = 'hsl(' + midHue + ', 100%, 30%)',
            subtitle = 'hsl(' + midHue + ', 60%, 30%)';

        currentColors.SetElementBGImageColors('body, .timer-element', gradient);
        currentColors.SetElementBGImageColors('#menu-modal, .btn-submit', reverse, 65);
        $('.color-main, #counters').css({'color': title});
        $('.color-sub').css({'color': subtitle});
    }

    GentlySetBackgroundColor() {
        let tempcol = new Colors();
        let now = new Date().getHours();

        if (tempcol.colors.h != colors.colors.h || tempcol.gradient != colors.gradient) {
            let down = true;
            let dark = setInterval(function() {
                if (down) tempcol.light = tempcol.light / 1.047;
                else tempcol.light = tempcol.light + (0.125 / ((2 / tempcol.light) > 1 ? 0.173 : (2 / tempcol.light)));

                this.SetBGColors(tempcol);
                if (tempcol.light < 1.3) {
                    down             = false;
                    tempcol.colors   = this.colors;
                    tempcol.gradient = this.gradient;
                }
                if (tempcol.light >= this.GetFluxV2Value(now)) {
                    clearInterval(dark);
                }
            }.bind(this), 16.7);
        } else {
            ui.FluxV2(now);
        }
    }

    CalculateSecondaryHue(betweenTwoHues = false) {
        if (betweenTwoHues)
            return (this.colors.h - (this.gradient / 2)) < 0 ? (360 + this.colors.h) - (this.gradient / 2) : this.colors.h - (this.gradient / 2);
        return (this.colors.h - this.gradient) < 0 ? ((360 + this.colors.h) - this.gradient) : this.colors.h - this.gradient;
    }

    DefaultColors() {
        return {
            colors: { h: 311, s: 100, l: 55 },
            gradient: 117
        };
    }

    GetFluxV2Value(now) {
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

    // GetRGBFromLinearGradient(element) {
    //     let css = $(element).css('background-image');
    //     if (!css) return;
    //     let m1 = css.split('),')[0].match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/),
    //         m2 = css.split('),')[1].match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
    //     return {
    //         col1: "rgb(" + m1[1] + ", " + m1[2] + ", " + m1[3] + ")",
    //         col2: "rgb(" + m2[1] + ", " + m2[2] + ", " + m2[3] + ")"
    //     };
    // }

    RGBToHSL(rgb) {
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

    GetHSLValues(str) {
        let regexp = /hsl\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?%)\s*,\s*(\d+(?:\.\d+)?%)\)/g;
        let match = regexp.exec(str).slice(1);
        return match ? {
          h: parseInt(match[0]),
          s: parseInt(match[1]),
          l: parseInt(match[2])
        } : {};
    }

    IncreaseHSLValues(cols, inc = 1) {
        return {
            h: ((cols.h + inc) > 360) ? (0 + inc) : (cols.h + inc),
            s: cols.s,
            l: cols.l
        };
    }

    StartGradientShift() {
        if (this.shiftInterval) {
            clearInterval(this.shiftInterval);
            this.shiftInterval = null;
            this.SaveColorsToFS();
        } else {
            this.shiftInterval = setInterval(function() {
                this.colors.h = (this.colors.h + 0.25 > 360) ? 0 : this.colors.h + 0.25;
                this.SetBGColors();
            }.bind(this), 16.7);
        }
    }

    SetElementBGImageColors(element, gradient) {
        $(element).css({'background-image': gradient});
    }
}