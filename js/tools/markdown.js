/**
 * Web Utility Toolbox - Markdown & Syntax Highlighter Utility Logic
 */

Tools.parseMarkdown = function(markdown) {
    if (!markdown) return '';
    
    // Escape HTML to prevent XSS in previewer
    let html = markdown
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Block elements tracking
    const lines = html.split('\n');
    let processedLines = [];
    let inList = false;
    let listType = null; // 'ul' or 'ol'
    let inCodeBlock = false;
    let codeContent = [];
    let codeLang = '';

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Code blocks
        if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
                inCodeBlock = false;
                const highlighted = Tools.highlightCode(codeContent.join('\n'), codeLang);
                processedLines.push(`<pre><code class="language-${codeLang}">${highlighted}</code></pre>`);
                codeContent = [];
                codeLang = '';
            } else {
                inCodeBlock = true;
                codeLang = line.trim().substring(3).trim().toLowerCase();
            }
            continue;
        }

        if (inCodeBlock) {
            codeContent.push(line);
            continue;
        }

        // Close lists if we hit an empty line or non-list line
        const isUnordered = line.match(/^\s*[\-\*]\s+(.*)$/);
        const isOrdered = line.match(/^\s*\d+\.\s+(.*)$/);

        if (!isUnordered && !isOrdered && inList) {
            processedLines.push(`</${listType}>`);
            inList = false;
            listType = null;
        }

        // Headers
        if (line.startsWith('#')) {
            const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
            if (headerMatch) {
                const level = headerMatch[1].length;
                const content = Tools.parseInlineMarkdown(headerMatch[2]);
                processedLines.push(`<h${level}>${content}</h${level}>`);
                continue;
            }
        }

        // Blockquotes
        if (line.trim().startsWith('&gt;')) {
            const content = Tools.parseInlineMarkdown(line.substring(line.indexOf('&gt;') + 4).trim());
            processedLines.push(`<blockquote>${content}</blockquote>`);
            continue;
        }

        // Unordered List Items
        if (isUnordered) {
            if (!inList || listType !== 'ul') {
                if (inList) processedLines.push(`</${listType}>`);
                processedLines.push('<ul>');
                inList = true;
                listType = 'ul';
            }
            const content = Tools.parseInlineMarkdown(isUnordered[1]);
            processedLines.push(`<li>${content}</li>`);
            continue;
        }

        // Ordered List Items
        if (isOrdered) {
            if (!inList || listType !== 'ol') {
                if (inList) processedLines.push(`</${listType}>`);
                processedLines.push('<ol>');
                inList = true;
                listType = 'ol';
            }
            const content = Tools.parseInlineMarkdown(isOrdered[1]);
            processedLines.push(`<li>${content}</li>`);
            continue;
        }

        // Regular paragraph or empty line
        if (line.trim() === '') {
            processedLines.push('<br/>');
        } else {
            const content = Tools.parseInlineMarkdown(line);
            processedLines.push(`<p>${content}</p>`);
        }
    }

    // Clean up unclosed code blocks
    if (inCodeBlock) {
        const highlighted = Tools.highlightCode(codeContent.join('\n'), codeLang);
        processedLines.push(`<pre><code class="language-${codeLang}">${highlighted}</code></pre>`);
    }

    // Clean up unclosed lists
    if (inList) {
        processedLines.push(`</${listType}>`);
    }

    // Merge contiguous blank lines
    let finalHtml = processedLines.join('\n')
        .replace(/(<br\/>\n){2,}/g, '<br/>')
        .replace(/<p><\/p>/g, '');

    return finalHtml;
};

Tools.parseInlineMarkdown = function(text) {
    return text
        // Bold & Italic combined
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/___(.*?)___/g, '<strong><em>$1</em></strong>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        // Inline Code
        .replace(/`(.*?)`/g, '<code>$1</code>')
        // Links [text](url)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
};

Tools.highlightCode = function(code, lang) {
    if (!lang) return code;
    
    if (lang === 'js' || lang === 'javascript' || lang === 'json') {
        const tokenRegex = /(\/\*[\s\S]*?\*\/|\/\/.*)|('(?:\\[']|[^'])*'|"(?:\\["]|[^"])*"|`(?:\\[`]|[^`])*`)|(\b(const|let|var|function|return|class|import|export|from|if|else|for|while|switch|case|default|break|continue|new|typeof|this|try|catch|throw|async|await|true|false|null|undefined)\b)|(\b\d+\b)/g;
        
        return code.replace(tokenRegex, (match, comment, string, keyword, number) => {
            if (comment) return `<span class="token-comment">${comment}</span>`;
            if (string) return `<span class="token-string">${string}</span>`;
            if (keyword) return `<span class="token-keyword">${keyword}</span>`;
            if (number) return `<span class="token-number">${number}</span>`;
            return match;
        });
    }
    
    if (lang === 'html' || lang === 'xml') {
        const htmlRegex = /(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?[a-zA-Z0-9:-]+|&gt;)|(\s[a-zA-Z0-9:-]+=(?:"[^"]*"|'[^']*'))/g;
        
        return code.replace(htmlRegex, (match, comment, tag, attr) => {
            if (comment) return `<span class="token-comment">${comment}</span>`;
            if (tag) return `<span class="token-tag">${tag}</span>`;
            if (attr) {
                const eqIdx = attr.indexOf('=');
                const name = attr.substring(0, eqIdx);
                const val = attr.substring(eqIdx);
                return ` <span class="token-attr">${name.trim()}</span><span class="token-string">${val}</span>`;
            }
            return match;
        });
    }
    
    if (lang === 'css') {
        const cssRegex = /(\/\*[\s\S]*?\*\/)|([a-zA-Z0-9#._: -]+)\s*(?=\{)|([a-zA-Z-]+)\s*:(?=[^;]+;)/g;
        
        return code.replace(cssRegex, (match, comment, selector, property) => {
            if (comment) return `<span class="token-comment">${comment}</span>`;
            if (selector) return `<span class="token-selector">${selector}</span>`;
            if (property) return `<span class="token-property">${property}</span>`;
            return match;
        });
    }
    
    return code;
};
