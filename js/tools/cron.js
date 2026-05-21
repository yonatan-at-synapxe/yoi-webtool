/**
 * Web Utility Toolbox - Cron Expression Utility Logic
 */

(function () {

    var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    var MONTH_ABBR  = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var DOW_NAMES   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    var FIELDS = [
        { name: 'minute',       min: 0,  max: 59 },
        { name: 'hour',         min: 0,  max: 23 },
        { name: 'day-of-month', min: 1,  max: 31 },
        { name: 'month',        min: 1,  max: 12 },
        { name: 'day-of-week',  min: 0,  max: 6  }
    ];

    /**
     * Validates that a single cron field value string is structurally correct.
     * Returns { valid: true } or { valid: false, error: string }.
     * @param {string} value - raw field string (e.g. "*", "1-5", "3,6,9", "12")
     * @param {{ name:string, min:number, max:number }} meta
     */
    function validateField(value, meta) {
        if (value === '*') return { valid: true };

        // step: */n or start/n
        if (/^(\*|\d+)\/\d+$/.test(value)) {
            var parts = value.split('/');
            var step  = parseInt(parts[1], 10);
            if (step < 1) return { valid: false, error: 'Step value must be ≥ 1 in ' + meta.name };
            if (parts[0] !== '*') {
                var start = parseInt(parts[0], 10);
                if (start < meta.min || start > meta.max) {
                    return { valid: false, error: 'Start value ' + start + ' out of range (' + meta.min + '–' + meta.max + ') in ' + meta.name };
                }
            }
            return { valid: true };
        }

        // list: a,b,c
        if (value.indexOf(',') !== -1) {
            var items = value.split(',');
            for (var i = 0; i < items.length; i++) {
                var n = parseInt(items[i], 10);
                if (isNaN(n) || String(n) !== items[i].trim()) {
                    return { valid: false, error: 'Invalid value "' + items[i] + '" in ' + meta.name + ' list' };
                }
                if (n < meta.min || n > meta.max) {
                    return { valid: false, error: 'Value ' + n + ' out of range (' + meta.min + '–' + meta.max + ') in ' + meta.name };
                }
            }
            return { valid: true };
        }

        // range: a-b
        if (value.indexOf('-') !== -1) {
            var rangeParts = value.split('-');
            if (rangeParts.length !== 2) return { valid: false, error: 'Invalid range in ' + meta.name };
            var lo = parseInt(rangeParts[0], 10);
            var hi = parseInt(rangeParts[1], 10);
            if (isNaN(lo) || isNaN(hi)) return { valid: false, error: 'Non-numeric range in ' + meta.name };
            if (lo < meta.min || lo > meta.max) return { valid: false, error: 'Range start ' + lo + ' out of range in ' + meta.name };
            if (hi < meta.min || hi > meta.max) return { valid: false, error: 'Range end ' + hi + ' out of range in ' + meta.name };
            if (lo >= hi) return { valid: false, error: 'Range start must be less than end in ' + meta.name };
            return { valid: true };
        }

        // plain number
        var num = parseInt(value, 10);
        if (isNaN(num) || String(num) !== value.trim()) {
            return { valid: false, error: 'Invalid value "' + value + '" in ' + meta.name };
        }
        if (num < meta.min || num > meta.max) {
            return { valid: false, error: 'Value ' + num + ' out of range (' + meta.min + '–' + meta.max + ') in ' + meta.name };
        }
        return { valid: true };
    }

    /**
     * Validates a full 5-field cron string.
     * @param {string} str
     * @returns {{ valid: boolean, error?: string, fields?: string[] }}
     */
    Tools.cronValidate = function (str) {
        if (typeof str !== 'string') return { valid: false, error: 'Input must be a string' };
        var trimmed = str.trim();
        var parts = trimmed.split(/\s+/);
        if (parts.length !== 5) {
            return { valid: false, error: 'Expected 5 fields (minute hour day month weekday), got ' + parts.length };
        }
        for (var i = 0; i < 5; i++) {
            var result = validateField(parts[i], FIELDS[i]);
            if (!result.valid) return { valid: false, error: result.error };
        }
        return { valid: true, fields: parts };
    };

    /**
     * Returns an expanded Set of matching integers for a cron field value string.
     * @param {string} value
     * @param {{ min:number, max:number }} meta
     * @returns {Set<number>}
     */
    function expandField(value, meta) {
        var set = new Set();
        var all = [];
        for (var k = meta.min; k <= meta.max; k++) all.push(k);

        if (value === '*') {
            all.forEach(function (v) { set.add(v); });
            return set;
        }

        // step
        if (value.indexOf('/') !== -1) {
            var sp    = value.split('/');
            var step  = parseInt(sp[1], 10);
            var start = sp[0] === '*' ? meta.min : parseInt(sp[0], 10);
            for (var v = start; v <= meta.max; v += step) set.add(v);
            return set;
        }

        // list
        if (value.indexOf(',') !== -1) {
            value.split(',').forEach(function (item) { set.add(parseInt(item, 10)); });
            return set;
        }

        // range
        if (value.indexOf('-') !== -1) {
            var rp = value.split('-');
            var lo = parseInt(rp[0], 10);
            var hi = parseInt(rp[1], 10);
            for (var n = lo; n <= hi; n++) set.add(n);
            return set;
        }

        // single value
        set.add(parseInt(value, 10));
        return set;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Plain-English Explainer
    // ─────────────────────────────────────────────────────────────────────────

    function ordinal(n) {
        var s = ['th', 'st', 'nd', 'rd'];
        var v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    function pad2(n) { return n < 10 ? '0' + n : String(n); }

    function explainMinute(value) {
        if (value === '*') return null; // handled at sentence level
        if (/^\*\/\d+$/.test(value)) {
            var step = parseInt(value.split('/')[1], 10);
            return 'every ' + step + ' minute' + (step === 1 ? '' : 's');
        }
        if (value.indexOf('-') !== -1) {
            var p = value.split('-');
            return 'minutes ' + p[0] + ' through ' + p[1];
        }
        if (value.indexOf(',') !== -1) {
            return 'at minutes ' + value;
        }
        return 'at minute ' + value;
    }

    function explainHour(value) {
        if (value === '*') return null;
        if (/^\*\/\d+$/.test(value)) {
            var step = parseInt(value.split('/')[1], 10);
            return 'every ' + step + ' hour' + (step === 1 ? '' : 's');
        }
        if (value.indexOf('-') !== -1) {
            var p = value.split('-');
            return pad2(parseInt(p[0], 10)) + ':00 through ' + pad2(parseInt(p[1], 10)) + ':00';
        }
        if (value.indexOf(',') !== -1) {
            return 'at hours ' + value;
        }
        return null; // will be formatted with minute below
    }

    function fmtTime(minuteVal, hourVal) {
        var minuteWild  = minuteVal === '*';
        var hourWild    = hourVal   === '*';
        var minuteStep  = /^\*\/\d+$/.test(minuteVal);
        var hourStep    = /^\*\/\d+$/.test(hourVal);
        var minuteRange = !minuteStep && minuteVal.indexOf('-') !== -1;
        var hourRange   = !hourStep   && hourVal.indexOf('-') !== -1;
        var minuteList  = minuteVal.indexOf(',') !== -1;
        var hourList    = hourVal.indexOf(',')   !== -1;

        // Both specific — emit HH:MM
        if (!minuteWild && !minuteStep && !minuteRange && !minuteList &&
            !hourWild   && !hourStep   && !hourRange   && !hourList) {
            return 'At ' + pad2(parseInt(hourVal, 10)) + ':' + pad2(parseInt(minuteVal, 10));
        }

        // Hour step + every minute  →  every N hours
        if (hourStep && minuteWild) {
            var hs = parseInt(hourVal.split('/')[1], 10);
            return 'Every ' + hs + ' hour' + (hs === 1 ? '' : 's');
        }
        // Hour step + specific minute
        if (hourStep && !minuteWild && !minuteStep && !minuteRange && !minuteList) {
            var hs2 = parseInt(hourVal.split('/')[1], 10);
            return 'Every ' + hs2 + ' hour' + (hs2 === 1 ? '' : 's') + ' at minute ' + minuteVal;
        }
        // Minute step → every N minutes
        if (minuteStep && hourWild) {
            var ms = parseInt(minuteVal.split('/')[1], 10);
            return 'Every ' + ms + ' minute' + (ms === 1 ? '' : 's');
        }
        // Both wild
        if (minuteWild && hourWild) return 'Every minute';

        // Hour range
        if (hourRange) {
            var hp = hourVal.split('-');
            var base = 'Every minute from ' + pad2(parseInt(hp[0], 10)) + ':00 to ' + pad2(parseInt(hp[1], 10)) + ':59';
            if (!minuteWild) base = base + ' (minute: ' + minuteVal + ')';
            return base;
        }
        // Hour list + specific minute
        if (hourList && !minuteWild && !minuteStep && !minuteRange && !minuteList) {
            return 'At minute ' + minuteVal + ' past hours ' + hourVal;
        }
        // Fallback
        var parts = [];
        if (!minuteWild) parts.push(explainMinute(minuteVal) || ('minute ' + minuteVal));
        if (!hourWild)   parts.push('hour ' + hourVal);
        return parts.length ? 'At ' + parts.join(', ') : 'Every minute';
    }

    function explainDOM(value) {
        if (value === '*') return null;
        if (/^\*\/\d+$/.test(value)) {
            var step = parseInt(value.split('/')[1], 10);
            return 'every ' + step + ' day' + (step === 1 ? '' : 's');
        }
        if (value.indexOf('-') !== -1) {
            var p = value.split('-');
            return 'day ' + p[0] + ' through day ' + p[1];
        }
        if (value.indexOf(',') !== -1) {
            var items = value.split(',').map(function (v) { return ordinal(parseInt(v, 10)); });
            var last  = items.pop();
            return 'the ' + (items.length ? items.join(', ') + ' and ' + last : last) + ' of the month';
        }
        return 'the ' + ordinal(parseInt(value, 10)) + ' of the month';
    }

    function explainMonth(value) {
        if (value === '*') return null;
        if (/^\*\/\d+$/.test(value)) {
            var step = parseInt(value.split('/')[1], 10);
            return 'every ' + step + ' month' + (step === 1 ? '' : 's');
        }
        if (value.indexOf('-') !== -1) {
            var p = value.split('-');
            return MONTH_NAMES[parseInt(p[0], 10) - 1] + ' through ' + MONTH_NAMES[parseInt(p[1], 10) - 1];
        }
        if (value.indexOf(',') !== -1) {
            var names = value.split(',').map(function (v) { return MONTH_ABBR[parseInt(v, 10) - 1]; });
            return names.join(', ');
        }
        return 'in ' + MONTH_NAMES[parseInt(value, 10) - 1];
    }

    function explainDOW(value) {
        if (value === '*') return null;
        if (/^\*\/\d+$/.test(value)) {
            var step = parseInt(value.split('/')[1], 10);
            return 'every ' + step + ' weekday' + (step === 1 ? '' : 's');
        }
        if (value.indexOf('-') !== -1) {
            var p = value.split('-');
            return DOW_NAMES[parseInt(p[0], 10)] + ' through ' + DOW_NAMES[parseInt(p[1], 10)];
        }
        if (value.indexOf(',') !== -1) {
            var names = value.split(',').map(function (v) { return DOW_NAMES[parseInt(v, 10)]; });
            var last  = names.pop();
            return names.length ? names.join(', ') + ' and ' + last : last;
        }
        return 'on ' + DOW_NAMES[parseInt(value, 10)];
    }

    /**
     * Translates a valid 5-field cron string into a plain-English description.
     * Returns an object with a `sentence` string and a `parts` breakdown array.
     * @param {string} str
     * @returns {{ sentence: string, parts: Array<{field:string, raw:string, description:string}> }}
     */
    Tools.cronExplain = function (str) {
        var v = Tools.cronValidate(str);
        if (!v.valid) return { sentence: 'Invalid cron expression: ' + v.error, parts: [] };

        var F = v.fields; // [min, hour, dom, month, dow]

        // Build per-field descriptions for the breakdown table
        var minDesc, hourDesc, domDesc, monthDesc, dowDesc;

        if (F[0] === '*') minDesc = 'Every minute';
        else if (/^\*\/\d+$/.test(F[0])) { var s = parseInt(F[0].split('/')[1], 10); minDesc = 'Every ' + s + ' minute' + (s === 1 ? '' : 's'); }
        else if (F[0].indexOf('-') !== -1) { var p = F[0].split('-'); minDesc = 'Minutes ' + p[0] + '–' + p[1]; }
        else if (F[0].indexOf(',') !== -1) minDesc = 'Minutes ' + F[0];
        else minDesc = 'Minute ' + F[0];

        if (F[1] === '*') hourDesc = 'Every hour';
        else if (/^\*\/\d+$/.test(F[1])) { var s2 = parseInt(F[1].split('/')[1], 10); hourDesc = 'Every ' + s2 + ' hour' + (s2 === 1 ? '' : 's'); }
        else if (F[1].indexOf('-') !== -1) { var p2 = F[1].split('-'); hourDesc = pad2(parseInt(p2[0], 10)) + ':00–' + pad2(parseInt(p2[1], 10)) + ':59'; }
        else if (F[1].indexOf(',') !== -1) hourDesc = 'Hours ' + F[1];
        else hourDesc = pad2(parseInt(F[1], 10)) + ':xx';

        if (F[2] === '*') domDesc = 'Every day';
        else domDesc = explainDOM(F[2]) || F[2];
        if (domDesc.charAt(0) !== 'E' && domDesc.charAt(0) !== 'T') domDesc = domDesc.charAt(0).toUpperCase() + domDesc.slice(1);

        if (F[3] === '*') monthDesc = 'Every month';
        else { var em = explainMonth(F[3]); monthDesc = em ? (em.charAt(0).toUpperCase() + em.slice(1)) : F[3]; }

        if (F[4] === '*') dowDesc = 'Any day of week';
        else { var ed = explainDOW(F[4]); dowDesc = ed ? (ed.indexOf('on ') === 0 ? ed.slice(3) : ed) : F[4]; dowDesc = dowDesc.charAt(0).toUpperCase() + dowDesc.slice(1); }

        var parts = [
            { field: 'Minute',       raw: F[0], description: minDesc   },
            { field: 'Hour',         raw: F[1], description: hourDesc   },
            { field: 'Day of Month', raw: F[2], description: domDesc    },
            { field: 'Month',        raw: F[3], description: monthDesc  },
            { field: 'Day of Week',  raw: F[4], description: dowDesc    }
        ];

        // Build the human sentence
        var timePart  = fmtTime(F[0], F[1]);
        var domPart   = explainDOM(F[2]);
        var monthPart = explainMonth(F[3]);
        var dowPart   = explainDOW(F[4]);

        var sentence = timePart;

        // DOW constraint
        if (dowPart) {
            sentence += ', ' + dowPart;
        }

        // DOM constraint (only meaningful if DOW is wild; both non-wild is unusual but show both)
        if (domPart) {
            sentence += (dowPart ? ' and on ' : ', on ') + domPart;
        }

        // Month constraint
        if (monthPart) {
            if (monthPart.indexOf('in ') === 0) {
                sentence += ' ' + monthPart;
            } else {
                sentence += ', ' + monthPart;
            }
        }

        // If everything is wild
        if (!dowPart && !domPart && !monthPart) {
            // sentence is already fmtTime result
        }

        return { sentence: sentence, parts: parts };
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Next Run Time Calculator
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns the next N firing Date objects for a cron expression.
     * Iterates minute-by-minute from `fromDate`, capped at 525,600 iterations (~1 year).
     * @param {string} str         - valid 5-field cron string
     * @param {number} count       - number of future times to return (default 5)
     * @param {Date}   [fromDate]  - starting point (default: now)
     * @returns {Date[]}
     */
    Tools.cronNextRuns = function (str, count, fromDate) {
        var v = Tools.cronValidate(str);
        if (!v.valid) return [];

        var n      = count || 5;
        var base   = fromDate instanceof Date ? new Date(fromDate) : new Date();
        var fields = v.fields;

        // Expand each field into a Set of matching integers
        var minSet   = expandField(fields[0], FIELDS[0]);
        var hourSet  = expandField(fields[1], FIELDS[1]);
        var domSet   = expandField(fields[2], FIELDS[2]);
        var monthSet = expandField(fields[3], FIELDS[3]); // 1-based
        var dowSet   = expandField(fields[4], FIELDS[4]);

        var results = [];
        // Advance to next whole minute
        var cursor = new Date(base);
        cursor.setSeconds(0, 0);
        cursor.setMinutes(cursor.getMinutes() + 1);

        var limit = 525600; // ~1 year of minutes
        while (results.length < n && limit-- > 0) {
            var m   = cursor.getMinutes();
            var h   = cursor.getHours();
            var dom = cursor.getDate();
            var mon = cursor.getMonth() + 1; // 1-based
            var dow = cursor.getDay();       // 0=Sun

            if (minSet.has(m) && hourSet.has(h) && domSet.has(dom) && monthSet.has(mon) && dowSet.has(dow)) {
                results.push(new Date(cursor));
            }
            cursor.setMinutes(cursor.getMinutes() + 1);
        }

        return results;
    };

    /**
     * Assembles a cron string from individual field strings.
     * @param {{ min:string, hour:string, dom:string, month:string, dow:string }} fields
     * @returns {string}
     */
    Tools.cronBuild = function (fields) {
        return [
            fields.min   || '*',
            fields.hour  || '*',
            fields.dom   || '*',
            fields.month || '*',
            fields.dow   || '*'
        ].join(' ');
    };

})();
