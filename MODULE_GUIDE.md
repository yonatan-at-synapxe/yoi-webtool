# Developer Guide: Adding a New Tool Module

This guide details the modular architecture of the **Web Utility Toolbox** and provides step-by-step instructions on how to add a new tool module.

---

## 1. Architectural Principles

This application is designed as an **offline-first, standalone browser utility**. It must run perfectly when opened directly from a local storage drive via the `file://` protocol without requiring a local development server, compilation steps, or runtime bundlers (like Webpack or Vite).

### CORS Constraints and ES6 Modules
> [!WARNING]
> Native ES6 `import` / `export` syntax is **blocked** under the `file://` protocol due to browser CORS policies.
> Instead, modularization is achieved by loading scripts sequentially in `index.html`. Modules communicate via global namespaces:
> - **`window.Tools`**: Exposes pure, stateless utility functions (e.g. `Tools.formatJson`, `Tools.utf8ToBase64`).
> - **`window.App`**: Exposes global core shell controls (e.g., `App.showToast`, `App.handleCopyToClipboard`, `App.navigateTo`).

---

## 2. Directory Structure

```text
yoi-webtool/
│
├── index.html            # Main HTML layout, containing all views/panels
├── style.css             # Main stylesheet (color tokens, theme styles, animations)
├── app.js                # Core shell router, theme loader, search, and toast setup
│
└── js/
    ├── tools/
    │   ├── namespace.js  # Defines window.Tools namespace
    │   ├── json.js       # JSON Utility logic
    │   ├── codec.js      # Base64/URL utility logic
    │   └── ...           # Other utility logic files
    │
    └── controllers/
        ├── json.js       # JSON Formatter event listeners and UI bindings
        ├── codec.js      # Codec event listeners and UI bindings
        └── ...           # Other controller files
```

---

## 3. Step-by-Step Guide to Adding a Tool

Let's walk through implementing a hypothetical **"Epoch Timestamp Converter"** tool.

### Step 1: Add HTML Structure in `index.html`

1. **Add a Sidebar Navigation link** in the `<aside class="sidebar">` navigation list:
   ```html
   <a href="#" class="nav-item" data-target="epoch-converter" title="Convert Epoch timestamps to readable dates">
       <span class="nav-icon">
           <!-- Lucide or custom SVG here -->
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <circle cx="12" cy="12" r="10"></circle>
               <polyline points="12 6 12 12 16 14"></polyline>
           </svg>
       </span>
       <span class="nav-label">Epoch Converter</span>
   </a>
   ```

2. **Add a Dashboard Card** inside the `<div class="dashboard-grid">` so users can access it from the home screen:
   ```html
   <div class="dashboard-card" data-target="epoch-converter">
       <div class="dashboard-card-icon">
           <!-- Same SVG -->
       </div>
       <div class="dashboard-card-title">Epoch Converter</div>
       <div class="dashboard-card-desc">Convert Unix timestamps to human-readable date/time formats and vice-versa.</div>
   </div>
   ```

3. **Add the View Panel** in the `<main class="main-content">` area:
   ```html
   <!-- PANEL: Epoch Converter -->
   <div class="tool-panel" id="epoch-converter">
       <div class="card flex-col">
           <div class="card-title">Unix Timestamp Converter</div>
           <div class="flex-row" style="gap: 12px;">
               <input type="number" class="input-text" id="epoch-input" placeholder="Enter Unix timestamp (e.g. 1716249600)">
               <button class="btn btn-primary" id="btn-convert-epoch">Convert</button>
           </div>
           <div class="card-title" style="margin-top: 20px;">Formatted Date</div>
           <input type="text" class="input-text readonly" id="epoch-output" readonly>
       </div>
   </div>
   ```

### Step 2: Implement Stateless Utilities in `js/tools/`

Create `js/tools/epoch.js` to contain the logic:

```javascript
/**
 * Web Utility Toolbox - Epoch Converter Utility Logic
 */

Tools.epochToDate = function(timestamp) {
    if (!timestamp) return 'Invalid Timestamp';
    try {
        const ms = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
        const date = new Date(Number(ms));
        if (isNaN(date.getTime())) {
            throw new Error('Invalid Date value');
        }
        return date.toString();
    } catch (e) {
        throw new Error('Invalid Unix timestamp format: ' + e.message);
    }
};
```

### Step 3: Implement UI Event Listeners in `js/controllers/`

Create `js/controllers/epoch.js` to coordinate between DOM and Tools logic:

```javascript
/**
 * Web Utility Toolbox - Epoch Converter Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    const epochInput = document.getElementById('epoch-input');
    const epochOutput = document.getElementById('epoch-output');
    const btnConvert = document.getElementById('btn-convert-epoch');

    function convert() {
        const value = epochInput.value.trim();
        if (!value) {
            if (window.App && window.App.showToast) {
                window.App.showToast('Please enter a timestamp', 'warning');
            }
            return;
        }

        try {
            const result = Tools.epochToDate(value);
            epochOutput.value = result;
        } catch (error) {
            epochOutput.value = '';
            if (window.App && window.App.showToast) {
                window.App.showToast(error.message, 'error');
            }
        }
    }

    if (btnConvert) {
        btnConvert.addEventListener('click', convert);
    }
});
```

### Step 4: Register the New Scripts in `index.html`

Scroll to the bottom of `index.html` and append the new scripts. **Ensure correct ordering:**
1. Core logic scripts must be registered **before** `app.js`.
2. UI controller scripts must be registered **after** `app.js`.

```html
    <!-- Script loading -->
    <script src="js/tools/namespace.js"></script>
    <script src="js/tools/json.js"></script>
    ...
    <script src="js/tools/epoch.js"></script> <!-- Core Logic -->
    <script src="app.js"></script>
    <script src="js/controllers/json.js"></script>
    ...
    <script src="js/controllers/epoch.js"></script> <!-- UI Controller -->
```

---

## 4. Best Practices for Developers

- **Global Shell Helpers**: Always check for availability before running global UI triggers:
  - `window.App.showToast('Message', 'success' | 'warning' | 'error')`
  - `window.App.handleCopyToClipboard(string)`
  - `window.App.navigateTo(panelId)`
- **Clean Inputs/Outputs**: Provide "Clear" buttons inside cards to clean up inputs and reset indicators, improving visual polish.
- **Defensive Selectors**: Since all controller scripts run on a single DOM page, ensure that your elements are selected using specific IDs or scoped classes (e.g. `document.getElementById('toolname-input')`) to avoid collisions with other tools.
