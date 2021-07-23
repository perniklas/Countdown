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

        if (/Android|webOS|iPhone|iPad|Mac|Macintosh|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
            $('.hide-mobile').hide();

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
            modal.css({'border': '5px solid white'});
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
            setTimeout(() => modal.css({'border': 'none'}), 400);
        }
    }

    ShowColorModal() {
        let modal = $('.input-color-gradient');
        modal.css({'border': '5px solid white'});
        modal.slideDown();
        $('#palette-btn').addClass('active');
    }

    HideColorModal() {
        let modal = $('.input-color-gradient');
        modal.slideUp();
        setTimeout(() => modal.css({'border': 'none'}), 400);
        $('#palette-btn').removeClass('active');
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
        let bgFunc = function(col) {
            if (col) {
                if (col.data().colors) {
                    let def = this.DefaultColors();
                    if (def.colors.h != col.data().colors.colors.h && def.gradient != col.data().gradient) {
                        this.colors = col.data().colors.colors;
                        this.gradient = col.data().colors.gradient;
                        
                        $('#gradientInput-main').val(this.colors.h);
                        $('#gradientInput-accent').val(this.gradient);

                        if (setbackground) this.GentlySetBackgroundColor();
                    }
                }
            }
            if (callback) callback();
        }.bind(this);

        db.myColors.doc(auth.getUid()).get().then(col => {
            bgFunc(col);
        });
    }

    SaveColorsToFS(colors, gradient) {
        db.myColors.doc(auth.getUid()).set({
            'colors': {
                'colors': colors,
                'gradient': gradient
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

        return 'linear-gradient(' + direction + ', ' + 
            'hsl(' + this.colors.h + ',' + (this.colors.s / 2).toFixed() + '%,' + this.light + '%),' +
            'hsl(' + this.gradient + ',' + (this.colors.s / 2).toFixed() + '%,' + this.light + '%))';
    }

    SetBGColors(color = null) {
        let currentColors = this;
        if (color) currentColors = color;

        let gradient = currentColors.GenerateGradientString(),
            reverse  = currentColors.GenerateGradientString(true),
            midHue   = currentColors.CalculateMidpointHue(),
            title    = 'hsl(' + midHue + ', 100%, 30%)',
            subtitle = 'hsl(' + midHue + ', 60%, 30%)',
            fade     = 'hsl(' + midHue + ', 50%, 80%)';

        this.midHue = midHue;

        currentColors.SetElementBGImageColors('body, .timer-element', gradient);
        currentColors.SetElementBGImageColors('#menu-modal, .input-color-gradient, .btn-submit', reverse, 65);
        $('.color-main, #counters').css({'color': title});
        $('.color-sub').css({'color': subtitle});
        $('.color-fade').css({'color': fade});
    }

    GentlySetBackgroundColor() {
        let tempcol = new Colors();
        let now = new Date().getHours();

        if (tempcol.colors.h != this.colors.h || tempcol.gradient != this.gradient) {
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
                if (tempcol.light >= this.GetFluxV2Value(now) && !down) {
                    clearInterval(dark);
                }
            }.bind(this), 16.7);
        } else {
            ui.FluxV2(now);
        }
    }

    CalculateMidpointHue() {
        let main        = this.HSLToHex(this.colors.h, this.colors.s, this.light);
        let secondary   = this.HSLToHex(this.gradient, this.colors.s, this.light);

        let mainDec     = this.hex2dec(main);
        let offDec      = this.hex2dec(secondary);

        let mainCmyk    = this.rgb2cmyk(mainDec[0], mainDec[1], mainDec[2]);
        let offCmyk     = this.rgb2cmyk(offDec[0], offDec[1], offDec[2]);

        let colorMixC   = (mainCmyk[0] + offCmyk[0]) / 2;
        let colorMixM   = (mainCmyk[1] + offCmyk[1]) / 2;
        let colorMixY   = (mainCmyk[2] + offCmyk[2]) / 2;
        let colorMixK   = (mainCmyk[3] + offCmyk[3]) / 2;

        let mixDec      = this.cmyk2rgb(colorMixC, colorMixM, colorMixY, colorMixK);
        let mixHex      = this.rgb2hex(mixDec[0], mixDec[1], mixDec[2]);
        let mixHSL      = this.HexToHSL(mixHex);

        return mixHSL.substr(mixHSL.indexOf('(') + 1, mixHSL.indexOf(',') - mixHSL.indexOf('(') - 1);
        
        // if (betweenTwoHues)
        //     return this.colors.h - (this.colors.h - (this.gradient / 2))
        //     //return (this.colors.h - (this.gradient / 2)) < 0 ? (360 + this.colors.h) - (this.gradient / 2) : this.colors.h - (this.gradient / 2);
        // return (this.colors.h - this.gradient) < 0 ? ((360 + this.colors.h) - this.gradient) : this.colors.h - this.gradient;
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
            this.SaveColorsToFS(this.colors, this.gradient);
        } else {
            this.shiftInterval = setInterval(function() {
                this.colors.h = (this.colors.h + 0.25 > 360) ? 0 : this.colors.h + 0.25;
                $('#gradientInput-main').val('' + this.colors.h);
                this.SetBGColors();
            }.bind(this), 16.7);
        }
    }

    SetElementBGImageColors(element, gradient) {
        $(element).css({'background-image': gradient});
    }

    hex2dec(hex) {
        return hex.replace('#', '').match(/.{2}/g).map(n => parseInt(n, 16));
    }
    
    rgb2hex(r, g, b) {
        r = Math.round(r);
        g = Math.round(g);
        b = Math.round(b);
        r = Math.min(r, 255);
        g = Math.min(g, 255);
        b = Math.min(b, 255);
        return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
    }
    
    rgb2cmyk(r, g, b) {
        let c = 1 - (r / 255);
        let m = 1 - (g / 255);
        let y = 1 - (b / 255);
        let k = Math.min(c, m, y);
        c = (c - k) / (1 - k);
        m = (m - k) / (1 - k);
        y = (y - k) / (1 - k);
        return [c, m, y, k];
    }
    
    cmyk2rgb(c, m, y, k) {
        let r = c * (1 - k) + k;
        let g = m * (1 - k) + k;
        let b = y * (1 - k) + k;
        r = (1 - r) * 255 + .5;
        g = (1 - g) * 255 + .5;
        b = (1 - b) * 255 + .5;
        return [r, g, b];
    }
    
    
    mix_cmyks(...cmyks) {
        let c = cmyks.map(cmyk => cmyk[0]).reduce((a, b) => a + b) / 2;
        let m = cmyks.map(cmyk => cmyk[1]).reduce((a, b) => a + b) / 2;
        let y = cmyks.map(cmyk => cmyk[2]).reduce((a, b) => a + b) / 2;
        let k = cmyks.map(cmyk => cmyk[3]).reduce((a, b) => a + b) / 2;

        var ceee = cmyks[0];
        return [c, m, y, k];
    }
    
    mix_hexes(...hexes) {
        let rgbs = hexes.map(hex => this.hex2dec(...hex)); 
        let cmyks = rgbs.map(rgb => this.rgb2cmyk(...rgb));
        let mixture_cmyk = this.mix_cmyks(...cmyks);
        let mixture_rgb = this.cmyk2rgb(...mixture_cmyk);
        let mixture_hex = this.rgb2hex(...mixture_rgb);
        return mixture_hex;
    }

    HSLToHex(h, s, l) {
        l /= 100;
        let a = s * Math.min(l, 1 - l) / 100;
        let f = n => {
            let k = (n + h / 30) % 12;
            let color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    HexToHSL(H) {
        // Convert hex to RGB first
        let r = 0, g = 0, b = 0;
        if (H.length == 4) {
          r = "0x" + H[1] + H[1];
          g = "0x" + H[2] + H[2];
          b = "0x" + H[3] + H[3];
        } else if (H.length == 7) {
          r = "0x" + H[1] + H[2];
          g = "0x" + H[3] + H[4];
          b = "0x" + H[5] + H[6];
        }
        // Then to HSL
        r /= 255;
        g /= 255;
        b /= 255;
        let cmin = Math.min(r,g,b),
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
      }
}