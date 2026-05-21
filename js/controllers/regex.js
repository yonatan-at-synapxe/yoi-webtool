/**
 * Web Utility Toolbox - Regex Sandbox Controller
 */

document.addEventListener('DOMContentLoaded', function() {
    var patternInput    = document.getElementById('regex-pattern');
    var testInput       = document.getElementById('regex-test-input');
    var highlightOutput = document.getElementById('regex-highlight-output');
    var matchCount      = document.getElementById('regex-match-count');
    var explainOutput   = document.getElementById('regex-explain-output');
    var regexStatus     = document.getElementById('regex-status');
    var btnClear        = document.getElementById('btn-regex-clear');
    var flagG           = document.getElementById('regex-flag-g');
    var flagI           = document.getElementById('regex-flag-i');
    var flagM           = document.getElementById('regex-flag-m');
    var flagS           = document.getElementById('regex-flag-s');

    var EMPTY_EXPLAIN = '<span style="color:var(--text-muted); font-size:0.875rem;">'
                      + 'Enter a pattern above to see a token-by-token explanation.'
                      + '</span>';

    function getFlags() {
        var f = '';
        if (flagG && flagG.checked) f += 'g';
        if (flagI && flagI.checked) f += 'i';
        if (flagM && flagM.checked) f += 'm';
        if (flagS && flagS.checked) f += 's';
        return f;
    }

    function escHtml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function clearStatus() {
        if (regexStatus) {
            regexStatus.style.display = 'none';
            regexStatus.textContent   = '';
        }
    }

    function updateRegex() {
        var pattern = patternInput ? patternInput.value : '';
        var testStr = testInput    ? testInput.value    : '';

        /* Nothing entered yet — reset all outputs */
        if (!pattern) {
            if (highlightOutput) highlightOutput.innerHTML = escHtml(testStr);
            if (matchCount)      matchCount.textContent    = '';
            if (explainOutput)   explainOutput.innerHTML   = EMPTY_EXPLAIN;
            clearStatus();
            return;
        }

        /* ── Dynamic explainer (runs on every keystroke) ── */
        if (explainOutput) {
            try {
                var tokens = Tools.regexExplain(pattern);
                if (tokens.length === 0) {
                    explainOutput.innerHTML = EMPTY_EXPLAIN;
                } else {
                    explainOutput.innerHTML = tokens.map(function(t) {
                        return '<div class="regex-token-pill">'
                             + '<code class="regex-token-code">' + escHtml(t.token) + '</code>'
                             + '<span class="regex-token-desc">' + escHtml(t.description) + '</span>'
                             + '</div>';
                    }).join('');
                }
            } catch (e) {
                explainOutput.innerHTML = EMPTY_EXPLAIN;
            }
        }

        /* ── Run regex against test string ── */
        var flags  = getFlags();
        var result = Tools.regexTest(pattern, flags, testStr);

        if (!result.valid) {
            if (regexStatus) {
                regexStatus.className   = 'status-indicator error';
                regexStatus.style.display = 'flex';
                regexStatus.textContent = result.error;
            }
            if (matchCount)      matchCount.textContent    = '';
            if (highlightOutput) highlightOutput.innerHTML = escHtml(testStr);
            return;
        }

        clearStatus();

        var count = result.matches.length;

        if (!testStr) {
            if (matchCount)      matchCount.textContent = '';
            if (highlightOutput) highlightOutput.innerHTML = '';
        } else if (count === 0) {
            if (matchCount)      matchCount.textContent    = 'No matches';
            if (highlightOutput) highlightOutput.innerHTML = escHtml(testStr);
        } else {
            var label = count === 1 ? '1 match' : count + ' matches';
            if (matchCount)      matchCount.textContent    = label;
            if (highlightOutput) highlightOutput.innerHTML = Tools.regexHighlight(testStr, result.matches);
        }
    }

    if (patternInput) patternInput.addEventListener('input',  updateRegex);
    if (testInput)    testInput.addEventListener('input',     updateRegex);
    if (flagG)        flagG.addEventListener('change', updateRegex);
    if (flagI)        flagI.addEventListener('change', updateRegex);
    if (flagM)        flagM.addEventListener('change', updateRegex);
    if (flagS)        flagS.addEventListener('change', updateRegex);

    if (btnClear) {
        btnClear.addEventListener('click', function() {
            if (patternInput)    patternInput.value        = '';
            if (testInput)       testInput.value           = '';
            if (highlightOutput) highlightOutput.innerHTML = '';
            if (matchCount)      matchCount.textContent    = '';
            if (explainOutput)   explainOutput.innerHTML   = EMPTY_EXPLAIN;
            clearStatus();
            if (window.App && window.App.showToast) window.App.showToast('Regex sandbox cleared.');
        });
    }
});
