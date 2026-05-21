/**
 * Web Utility Toolbox - Markdown Editor Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    const mdInput = document.getElementById('md-input');
    const mdPreview = document.getElementById('md-preview');
    const mdActionBtns = document.querySelectorAll('.md-action-btn');
    const btnMdPrint = document.getElementById('btn-md-print');

    function updateMarkdownPreview() {
        if (!mdInput || !mdPreview) return;
        const raw = mdInput.value;
        mdPreview.innerHTML = Tools.parseMarkdown(raw);
    }

    if (mdInput) {
        mdInput.addEventListener('input', updateMarkdownPreview);
        
        // Setup helper action buttons (bold, italic, headers, links)
        mdActionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                const start = mdInput.selectionStart;
                const end = mdInput.selectionEnd;
                const text = mdInput.value;
                const selectedText = text.substring(start, end);
                
                let replacement = '';
                let cursorOffset = 0;

                switch(action) {
                    case 'bold':
                        replacement = `**${selectedText || 'bold text'}**`;
                        cursorOffset = selectedText ? 0 : 2;
                        break;
                    case 'italic':
                        replacement = `*${selectedText || 'italic text'}*`;
                        cursorOffset = selectedText ? 0 : 1;
                        break;
                    case 'header':
                        replacement = `\n## ${selectedText || 'Heading'}\n`;
                        cursorOffset = selectedText ? 0 : 3;
                        break;
                    case 'link':
                        replacement = `[${selectedText || 'link text'}](https://example.com)`;
                        cursorOffset = selectedText ? 0 : 1;
                        break;
                    case 'code':
                        if (selectedText.includes('\n')) {
                            replacement = `\`\`\`javascript\n${selectedText}\n\`\`\``;
                            cursorOffset = 0;
                        } else {
                            replacement = `\`${selectedText || 'code'}\``;
                            cursorOffset = selectedText ? 0 : 1;
                        }
                        break;
                    case 'quote':
                        replacement = `\n> ${selectedText || 'blockquote'}\n`;
                        cursorOffset = selectedText ? 0 : 2;
                        break;
                }

                mdInput.value = text.substring(0, start) + replacement + text.substring(end);
                mdInput.focus();
                
                // Adjust selection
                const newCursorPos = start + replacement.length - cursorOffset;
                mdInput.setSelectionRange(newCursorPos, newCursorPos);
                
                updateMarkdownPreview();
            });
        });
    }

    if (btnMdPrint) {
        btnMdPrint.addEventListener('click', () => {
            window.print();
        });
    }
});
