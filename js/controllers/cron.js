/**
 * Web Utility Toolbox - Cron Builder/Explainer Controller
 */

document.addEventListener('DOMContentLoaded', function () {

    // ── Element references ────────────────────────────────────────────────────
    var tabBuild    = document.getElementById('cron-tab-build');
    var tabExplain  = document.getElementById('cron-tab-explain');
    var sectionBuild   = document.getElementById('cron-builder-section');
    var sectionExplain = document.getElementById('cron-explain-section');

    // Builder
    var presetBtns    = document.querySelectorAll('.cron-preset-btn');
    var fieldRows     = document.querySelectorAll('.cron-field-row');
    var cronOutput    = document.getElementById('cron-output');
    var cronSummary   = document.getElementById('cron-build-summary');
    var btnCronCopy   = document.getElementById('btn-cron-copy');
    var btnCronClear  = document.getElementById('btn-cron-build-clear');

    // Explainer
    var cronInput     = document.getElementById('cron-explain-input');
    var cronStatus    = document.getElementById('cron-explain-status');
    var cronExplainOut  = document.getElementById('cron-explanation');
    var cronNextRunsOut = document.getElementById('cron-next-runs');
    var btnExplainClear = document.getElementById('btn-cron-explain-clear');

    // Field selectors (type + value containers)
    var FIELD_IDS = ['min', 'hour', 'dom', 'month', 'dow'];
    var FIELD_RANGES = {
        min:   { min: 0,  max: 59 },
        hour:  { min: 0,  max: 23 },
        dom:   { min: 1,  max: 31 },
        month: { min: 1,  max: 12 },
        dow:   { min: 0,  max: 6  }
    };
    var FIELD_LABELS = {
        min:   'minute',
        hour:  'hour',
        dom:   'day of month',
        month: 'month',
        dow:   'day of week'
    };

    // ── Mode switching ────────────────────────────────────────────────────────

    function switchMode(mode) {
        if (!tabBuild || !tabExplain || !sectionBuild || !sectionExplain) return;
        if (mode === 'build') {
            sectionBuild.style.display   = '';
            sectionExplain.style.display = 'none';
            tabBuild.classList.add('active');
            tabExplain.classList.remove('active');
        } else {
            sectionBuild.style.display   = 'none';
            sectionExplain.style.display = '';
            tabBuild.classList.remove('active');
            tabExplain.classList.add('active');
        }
    }

    if (tabBuild)   tabBuild.addEventListener('click',   function () { switchMode('build');   });
    if (tabExplain) tabExplain.addEventListener('click', function () { switchMode('explain'); });

    // ── Builder: field type → value input visibility ──────────────────────────

    function syncFieldInputs(fieldId) {
        var typeSelect  = document.getElementById('cron-' + fieldId + '-type');
        var valSpecific = document.getElementById('cron-' + fieldId + '-specific');
        var valRangeFrom = document.getElementById('cron-' + fieldId + '-range-from');
        var valRangeTo   = document.getElementById('cron-' + fieldId + '-range-to');
        var valStep      = document.getElementById('cron-' + fieldId + '-step');
        var wrapSpecific = document.getElementById('cron-' + fieldId + '-wrap-specific');
        var wrapRange    = document.getElementById('cron-' + fieldId + '-wrap-range');
        var wrapStep     = document.getElementById('cron-' + fieldId + '-wrap-step');

        if (!typeSelect) return;
        var type = typeSelect.value;

        if (wrapSpecific) wrapSpecific.style.display = type === 'specific' ? 'flex' : 'none';
        if (wrapRange)    wrapRange.style.display    = type === 'range'    ? 'flex' : 'none';
        if (wrapStep)     wrapStep.style.display     = type === 'step'     ? 'flex' : 'none';
    }

    FIELD_IDS.forEach(function (fieldId) {
        var typeSelect = document.getElementById('cron-' + fieldId + '-type');
        if (typeSelect) {
            typeSelect.addEventListener('change', function () {
                syncFieldInputs(fieldId);
                buildAndUpdate();
            });
        }
        ['specific', 'range-from', 'range-to', 'step'].forEach(function (suffix) {
            var el = document.getElementById('cron-' + fieldId + '-' + suffix);
            if (el) el.addEventListener('input', buildAndUpdate);
        });
        // Initialize visibility
        syncFieldInputs(fieldId);
    });

    // ── Builder: assemble cron string from current field state ────────────────

    function getFieldString(fieldId) {
        var typeSelect = document.getElementById('cron-' + fieldId + '-type');
        if (!typeSelect) return '*';
        var type = typeSelect.value;

        if (type === '*') return '*';

        if (type === 'specific') {
            var val = document.getElementById('cron-' + fieldId + '-specific');
            var raw = val ? val.value.trim() : '';
            var n   = parseInt(raw, 10);
            var rng = FIELD_RANGES[fieldId];
            if (raw === '' || isNaN(n) || n < rng.min || n > rng.max) return '*';
            return String(n);
        }

        if (type === 'range') {
            var fromEl = document.getElementById('cron-' + fieldId + '-range-from');
            var toEl   = document.getElementById('cron-' + fieldId + '-range-to');
            var from   = fromEl ? parseInt(fromEl.value, 10) : NaN;
            var to     = toEl   ? parseInt(toEl.value,   10) : NaN;
            var rng2   = FIELD_RANGES[fieldId];
            if (isNaN(from) || isNaN(to) || from < rng2.min || to > rng2.max || from >= to) return '*';
            return from + '-' + to;
        }

        if (type === 'step') {
            var stepEl = document.getElementById('cron-' + fieldId + '-step');
            var step   = stepEl ? parseInt(stepEl.value, 10) : NaN;
            if (isNaN(step) || step < 1) return '*';
            return '*/' + step;
        }

        return '*';
    }

    function buildAndUpdate() {
        var fields = {
            min:   getFieldString('min'),
            hour:  getFieldString('hour'),
            dom:   getFieldString('dom'),
            month: getFieldString('month'),
            dow:   getFieldString('dow')
        };

        var expr = Tools.cronBuild(fields);
        if (cronOutput) cronOutput.value = expr;

        if (cronSummary) {
            var result = Tools.cronExplain(expr);
            cronSummary.textContent = result.sentence;
            cronSummary.className   = 'cron-summary-text';
        }
    }

    // ── Builder: preset buttons ───────────────────────────────────────────────

    var PRESETS = {
        'every-minute':  '* * * * *',
        'every-hour':    '0 * * * *',
        'daily-midnight':'0 0 * * *',
        'daily-9am':     '0 9 * * *',
        'weekdays-9am':  '0 9 * * 1-5',
        'weekly-sunday': '0 0 * * 0',
        'monthly-1st':   '0 0 1 * *',
        'every-15min':   '*/15 * * * *'
    };

    function applyPreset(cronStr) {
        var parts = cronStr.trim().split(/\s+/);
        if (parts.length !== 5) return;
        var map = { min: parts[0], hour: parts[1], dom: parts[2], month: parts[3], dow: parts[4] };

        FIELD_IDS.forEach(function (fieldId) {
            var val = map[fieldId];
            var typeSelect = document.getElementById('cron-' + fieldId + '-type');
            if (!typeSelect) return;

            if (val === '*') {
                typeSelect.value = '*';
            } else if (/^\*\/\d+$/.test(val)) {
                typeSelect.value = 'step';
                var stepEl = document.getElementById('cron-' + fieldId + '-step');
                if (stepEl) stepEl.value = val.split('/')[1];
            } else if (val.indexOf('-') !== -1) {
                typeSelect.value = 'range';
                var rp = val.split('-');
                var fromEl = document.getElementById('cron-' + fieldId + '-range-from');
                var toEl   = document.getElementById('cron-' + fieldId + '-range-to');
                if (fromEl) fromEl.value = rp[0];
                if (toEl)   toEl.value   = rp[1];
            } else if (val.indexOf(',') !== -1) {
                // list — map to specific with first value as a fallback
                typeSelect.value = 'specific';
                var specEl = document.getElementById('cron-' + fieldId + '-specific');
                if (specEl) specEl.value = val.split(',')[0];
            } else {
                typeSelect.value = 'specific';
                var specEl2 = document.getElementById('cron-' + fieldId + '-specific');
                if (specEl2) specEl2.value = val;
            }

            syncFieldInputs(fieldId);
        });

        buildAndUpdate();
    }

    presetBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var presetKey = btn.getAttribute('data-preset');
            var cronStr   = PRESETS[presetKey];
            if (cronStr) applyPreset(cronStr);
        });
    });

    // ── Builder: Copy & Clear ─────────────────────────────────────────────────

    if (btnCronCopy) {
        btnCronCopy.addEventListener('click', function () {
            var val = cronOutput ? cronOutput.value : '';
            if (window.App && window.App.handleCopyToClipboard) {
                window.App.handleCopyToClipboard(val);
            }
        });
    }

    if (btnCronClear) {
        btnCronClear.addEventListener('click', function () {
            FIELD_IDS.forEach(function (fieldId) {
                var typeSelect = document.getElementById('cron-' + fieldId + '-type');
                if (typeSelect) typeSelect.value = '*';
                syncFieldInputs(fieldId);
            });
            buildAndUpdate();
            if (window.App && window.App.showToast) window.App.showToast('Builder reset to defaults.');
        });
    }

    // ── Explainer: live parse on input ────────────────────────────────────────

    var EMPTY_EXPLAIN = '<span style="color:var(--text-muted); font-size:0.875rem;">'
                      + 'Enter a cron expression above to see the plain-English explanation.'
                      + '</span>';
    var EMPTY_RUNS    = '<span style="color:var(--text-muted); font-size:0.875rem;">'
                      + 'Next run times will appear here once you enter a valid expression.'
                      + '</span>';

    var DAY_NAMES   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function fmtDate(d) {
        var days = DAY_NAMES[d.getDay()];
        var mon  = MONTH_NAMES[d.getMonth()];
        var date = d.getDate();
        var yr   = d.getFullYear();
        var h    = d.getHours();
        var m    = d.getMinutes();
        var hh   = h < 10  ? '0' + h  : String(h);
        var mm   = m < 10  ? '0' + m  : String(m);
        return days + ', ' + date + ' ' + mon + ' ' + yr + ' at ' + hh + ':' + mm;
    }

    function updateExplainer() {
        if (!cronInput) return;
        var raw = cronInput.value.trim();

        if (!raw) {
            if (cronStatus)    { cronStatus.style.display = 'none'; cronStatus.textContent = ''; }
            if (cronExplainOut) cronExplainOut.innerHTML = EMPTY_EXPLAIN;
            if (cronNextRunsOut) cronNextRunsOut.innerHTML = EMPTY_RUNS;
            return;
        }

        var validation = Tools.cronValidate(raw);

        if (!validation.valid) {
            if (cronStatus) {
                cronStatus.className   = 'status-indicator error';
                cronStatus.style.display = 'flex';
                cronStatus.textContent = validation.error;
            }
            if (cronExplainOut)  cronExplainOut.innerHTML  = EMPTY_EXPLAIN;
            if (cronNextRunsOut) cronNextRunsOut.innerHTML = EMPTY_RUNS;
            return;
        }

        // Valid — clear error
        if (cronStatus) { cronStatus.style.display = 'none'; cronStatus.textContent = ''; }

        // Plain English
        var explain = Tools.cronExplain(raw);
        if (cronExplainOut) {
            var html = '<p class="cron-sentence">' + escHtml(explain.sentence) + '</p>';
            html += '<div class="cron-parts-grid">';
            explain.parts.forEach(function (p) {
                html += '<div class="cron-part-row">'
                      + '<code class="cron-part-raw">'  + escHtml(p.raw)         + '</code>'
                      + '<span class="cron-part-field">' + escHtml(p.field)       + '</span>'
                      + '<span class="cron-part-desc">'  + escHtml(p.description) + '</span>'
                      + '</div>';
            });
            html += '</div>';
            cronExplainOut.innerHTML = html;
        }

        // Next run times
        if (cronNextRunsOut) {
            var runs = Tools.cronNextRuns(raw, 5);
            if (runs.length === 0) {
                cronNextRunsOut.innerHTML = '<span style="color:var(--text-muted); font-size:0.875rem;">No upcoming runs found within the next year.</span>';
            } else {
                var rhtml = '<ol class="cron-runs-list">';
                runs.forEach(function (d) {
                    rhtml += '<li class="cron-run-item"><code>' + escHtml(fmtDate(d)) + '</code></li>';
                });
                rhtml += '</ol>';
                cronNextRunsOut.innerHTML = rhtml;
            }
        }
    }

    function escHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    if (cronInput) cronInput.addEventListener('input', updateExplainer);

    if (btnExplainClear) {
        btnExplainClear.addEventListener('click', function () {
            if (cronInput) cronInput.value = '';
            if (cronStatus)    { cronStatus.style.display = 'none'; cronStatus.textContent = ''; }
            if (cronExplainOut)  cronExplainOut.innerHTML  = EMPTY_EXPLAIN;
            if (cronNextRunsOut) cronNextRunsOut.innerHTML = EMPTY_RUNS;
            if (window.App && window.App.showToast) window.App.showToast('Explainer cleared.');
        });
    }

    // ── Initial state ─────────────────────────────────────────────────────────
    FIELD_IDS.forEach(syncFieldInputs);
    buildAndUpdate();
});
