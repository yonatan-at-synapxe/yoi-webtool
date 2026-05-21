/**
 * Web Utility Toolbox - Base64 & URL Codec Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    const codecInput = document.getElementById('codec-input');
    const codecOutput = document.getElementById('codec-output');
    const btnB64Encode = document.getElementById('btn-b64-encode');
    const btnB64Decode = document.getElementById('btn-b64-decode');
    const btnUrlEncode = document.getElementById('btn-url-encode');
    const btnUrlDecode = document.getElementById('btn-url-decode');
    const btnJsonEscape = document.getElementById('btn-json-escape');
    const btnJsonUnescape = document.getElementById('btn-json-unescape');
    const btnClearCodec = document.getElementById('btn-clear-codec');

    function runCodec(operation, method) {
        const input = codecInput.value;
        if (!input || input.trim() === '') {
            if (window.App && window.App.showToast) window.App.showToast('Please enter text to process', 'warning');
            return;
        }
        try {
            let output = '';
            if (method === 'b64') {
                output = operation === 'encode' ? Tools.utf8ToBase64(input) : Tools.base64ToUtf8(input);
            } else if (method === 'url') {
                output = operation === 'encode' ? Tools.urlEncode(input) : Tools.urlDecode(input);
            } else if (method === 'json') {
                output = operation === 'encode' ? Tools.jsonEscape(input) : Tools.jsonUnescape(input);
            }
            codecOutput.value = output;
            if (window.App && window.App.showToast) window.App.showToast(`Successfully ${operation}d!`);
        } catch (e) {
            codecOutput.value = '';
            if (window.App && window.App.showToast) window.App.showToast(e.message, 'error');
        }
    }

    if (btnB64Encode) btnB64Encode.addEventListener('click', () => runCodec('encode', 'b64'));
    if (btnB64Decode) btnB64Decode.addEventListener('click', () => runCodec('decode', 'b64'));
    if (btnUrlEncode) btnUrlEncode.addEventListener('click', () => runCodec('encode', 'url'));
    if (btnUrlDecode) btnUrlDecode.addEventListener('click', () => runCodec('decode', 'url'));
    if (btnJsonEscape) btnJsonEscape.addEventListener('click', () => runCodec('encode', 'json'));
    if (btnJsonUnescape) btnJsonUnescape.addEventListener('click', () => runCodec('decode', 'json'));
    if (btnClearCodec) btnClearCodec.addEventListener('click', () => {
        codecInput.value = '';
        codecOutput.value = '';
        if (window.App && window.App.showToast) window.App.showToast('Codec workspace cleared.');
    });
});
