/**
 * Web Utility Toolbox - Text Diff / Comparator Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    const diffInputA = document.getElementById('diff-input-a');
    const diffInputB = document.getElementById('diff-input-b');
    const btnCompare = document.getElementById('btn-compare-diff');
    const btnClearDiff = document.getElementById('btn-clear-diff');
    const diffOutput = document.getElementById('diff-output');

    const diffDragA = document.getElementById('diff-drag-a');
    const diffDragB = document.getElementById('diff-drag-b');

    function runTextDiff() {
        const valA = diffInputA.value;
        const valB = diffInputB.value;

        if (!valA && !valB) {
            diffOutput.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 40px 0;">Enter text in either block to run comparison.</div>';
            return;
        }

        const diffs = Tools.diffLines(valA, valB);
        let html = '';

        diffs.forEach(diff => {
            let className = '';
            let lineIndicator1 = '&nbsp;';
            let lineIndicator2 = '&nbsp;';
            let lineSymbol = ' ';

            if (diff.type === 'added') {
                className = 'diff-added';
                lineIndicator2 = diff.line2;
                lineSymbol = '+';
            } else if (diff.type === 'removed') {
                className = 'diff-removed';
                lineIndicator1 = diff.line1;
                lineSymbol = '-';
            } else {
                lineIndicator1 = diff.line1;
                lineIndicator2 = diff.line2;
            }

            // Escape HTML tags to prevent render issues
            const safeText = (diff.text || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            html += `
                <div class="diff-line ${className}">
                    <div class="diff-num">${lineIndicator1}</div>
                    <div class="diff-num">${lineIndicator2}</div>
                    <div class="diff-text">${lineSymbol} ${safeText}</div>
                </div>`;
        });

        diffOutput.innerHTML = html;
        if (window.App && window.App.showToast) window.App.showToast('Text comparison complete!');
    }

    // ==========================================
    // Drag and Drop File Loading
    // ==========================================
    function setupDragAndDrop(dropZone, textArea) {
        if (!dropZone || !textArea) return;

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('drag-over');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                const file = files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    textArea.value = event.target.result;
                    // Trigger input event to update previews/trigger listeners
                    textArea.dispatchEvent(new Event('input'));
                    if (window.App && window.App.showToast) {
                        window.App.showToast(`Loaded file: ${file.name}`);
                    }
                };
                reader.readAsText(file);
            }
        }, false);
    }

    setupDragAndDrop(diffDragA, diffInputA);
    setupDragAndDrop(diffDragB, diffInputB);

    if (btnCompare) btnCompare.addEventListener('click', runTextDiff);
    if (btnClearDiff) btnClearDiff.addEventListener('click', () => {
        diffInputA.value = '';
        diffInputB.value = '';
        diffOutput.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 40px 0;">Workspace cleared. Enter new text to compare.</div>';
        if (window.App && window.App.showToast) window.App.showToast('Diff workspace cleared.');
    });
});
