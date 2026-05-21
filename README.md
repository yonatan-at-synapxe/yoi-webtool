# Yoi Webtool

A self-contained, offline-first developer and office utility suite with a stunning glassmorphic interface.

## Core Features
1. **JSON Formatter & Validator**: Format, validate, and minify JSON inputs. Includes an interactive visual tree explorer.
2. **Base64 / URL Codec**: Instantly encode or decode text using Base64 or URL-safe schemas.
3. **Markdown Live Preview**: Write rich texts using Markdown syntax with real-time browser preview, HTML copy capability, and professional PDF export.
4. **Text Comparator**: Compute differences line-by-line between two text inputs.
5. **Password Generator**: Securely create random passwords using cryptographically secure random values and custom criteria.
6. **JWT Decoder**: Decode JSON Web Tokens and inspect headers, payloads, signatures, and signature expiry status.
7. **NRIC / FIN Generator**: Compute valid Singapore NRIC and FIN check digits from a given prefix and 7-digit number sequence.
8. **Client Assertion Generator**: Generate signed JWT client assertions for Microsoft Entra ID (Azure AD) using a private key and certificate thumbprint.
9. **Regex Sandbox**: Test and explain regular expressions with instant match highlighting.
10. **Cron Builder**: Build cron schedules visually with field-by-field controls and quick presets, or paste an expression to read it in plain English with upcoming run times.

---

## Markdown to PDF Export

The **Markdown Live** tool features an integrated **Export PDF** utility. 

### Architecture
To maintain the application's zero-dependency, offline-first architecture, the export is powered by **Native Print Media queries** (`@media print`):
* **No external libraries**: No CDNs or bloated scripts are needed. Works 100% offline.
* **Vector Text Quality**: The generated PDF contains selectable text (copy-pasteable and searchable) instead of flattened canvas screenshots.
* **Typographic Rules**: Page margins, headings (`h1`–`h6`), page breaks, pre-formatted code block widths, and quote containers are formatted explicitly to ensure a clean, book-like layout upon printing or exporting.

### How to use
1. Navigate to the **Markdown Live** panel.
2. Type or paste your Markdown code.
3. Click the **Export PDF** button in the preview pane header.
4. Select **Save as PDF** or choose your physical printer in the browser dialog.
5. Save the generated document.
