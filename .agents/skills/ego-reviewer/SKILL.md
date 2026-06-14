---
name: ego-reviewer
description: EGO (extensions.gnome.org) review compliance tools for GNOME Shell extension developers. Lint and validate extensions before submission or deployment.
---

# EGO Reviewer & Compliance Testing

Ensure your GNOME Shell extension passes review and gets approved on extensions.gnome.org (EGO) by adhering to static linting and strict lifecycle guidelines.

## When to Apply

- Before packaging an extension for uploading to extensions.gnome.org (https://extensions.gnome.org/upload/)
- Verifying the correctness of lifecycle management (`enable()` vs `disable()`)
- Troubleshooting signal cleanup, main loop source removal, and memory reference releases
- Sanitizing file packages to exclude build/repo artifacts

## Local Compliance Testing (Shexli)

To test the extension against the exact validation suite used by EGO reviewers, use the pre-configured Python virtual environment containing **shexli** (Shell Extension Linter):

- **Virtual Environment Path**: `/home/al/Projects/gnome_extension_tester`
- **Linter Executable**: `/home/al/Projects/gnome_extension_tester/venv/bin/shexli`

### How to Run Shexli

To scan the extension codebase, run the linter with the absolute path of the extension directory:

```bash
/home/al/Projects/gnome_extension_tester/venv/bin/shexli "/home/al/.local/share/gnome-shell/extensions/stt2clipboard@lokteam.com"
```

To output results as clean JSON for parsing:

```bash
/home/al/Projects/gnome_extension_tester/venv/bin/shexli --format json "/home/al/.local/share/gnome-shell/extensions/stt2clipboard@lokteam.com"
```

> 💡 **Important Note on Git Artifacts**:
> Running `shexli` directly inside a development directory might trigger false-positive warnings (like `EGO-P-006`) regarding unnecessary files (e.g. `.git/HEAD`, `.git/config`) or binary executables (e.g. `.git/hooks/*`). For a completely clean and realistic review test, package the extension into a ZIP archive first (excluding `.git`, build directories, and markdown files), and run `shexli` on the generated ZIP file instead:
> ```bash
> # Create a clean zip
> zip -r extension.zip . -x "*.git*" "*.md" "*.zip"
> # Run shexli on the zip
> /home/al/Projects/gnome_extension_tester/venv/bin/shexli extension.zip
> ```

---

## Critical EGO Review Guidelines

Based on official [GNOME Extension Review Guidelines](https://gjs.guide/extensions/review-guidelines/review-guidelines.html), here are the absolute rules and check list to prevent rejections.

### 1. No Side Effects in Constructor or `init()`
- **Rule**: You must NOT make any changes to GNOME Shell, connect any signals, or add any event/main loop sources before `enable()` is called (e.g. inside the constructor or any legacy `init()`).
- **Allowed**: Setting up translation text domains or initializing local non-GObject state variables.

```js
// WRONG - modifying state before enable()
export default class MyExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._settings = this.getSettings(); // WRONG
        this._indicator = new PanelMenu.Button(0.0, 'Indicator', false); // WRONG
    }
}

// RIGHT - only load metadata and setup translation domains
export default class MyExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        // Clean and empty constructor
    }
    enable() {
        this._settings = this.getSettings(); // RIGHT
    }
}
```

### 2. Flawless Cleanup in `disable()`
- **Rule**: Anything you created, modified, or set up in `enable()` MUST be undone in `disable()`. This is the single most common cause for review rejection (e.g. `EGO-L-002`, `EGO-L-003`, `EGO-L-004`).
- **GObject Signal Disconnection**: Disconnect all GObject signals connected with `.connect()`.
- **Main Loop Removal**: Remove all timeouts (`GLib.timeout_add`), idle sources (`GLib.idle_add`), or Gst pipeline references.
- **UI Widget Destruction**: Call `.destroy()` on UI widgets, panel indicators, and buttons added to the status area.
- **Reference Releasing**: Explicitly null out (`= null`) class references to variables like settings, indicators, timeout IDs, and signal arrays so the JavaScript garbage collector can do its job.

```js
// RIGHT - Complete cleanup sequence
disable() {
    // 1. Remove timeout/idle sources
    if (this._timeoutId) {
        GLib.Source.remove(this._timeoutId);
        this._timeoutId = null;
    }
    
    // 2. Disconnect connected signals
    if (this._signalId && this._targetObject) {
        this._targetObject.disconnect(this._signalId);
        this._signalId = null;
    }

    // 3. Destroy indicator button
    if (this._indicator) {
        this._indicator.destroy();
        this._indicator = null;
    }

    // 4. Nullify settings
    if (this._settings) {
        this._settings = null;
    }
}
```

### 3. Separation of Shell and Preferences Processes (No `Gtk` in Shell)
- **Rule**: Do not import `gi://Gtk` inside files running in the GNOME Shell main process (like `extension.js` or files imported by it).
- **Why**: GNOME Shell runs on `Clutter` and `St`. Importing or interacting with `Gtk` inside the Shell process can cause critical memory leaks, freezes, or hard desktop crashes.
- **Allowed**: Use `prefs.js` for Adwaita and GTK preferences, which is run in a separate sandboxed process (`gnome-shell-extension-prefs`).

### 4. No Excessive Logging
- **Rule**: Do not print excessive logging or verbose debug prints during normal execution (`EGO-A-004`).
- **Why**: Log spam clutters the system journal (`journalctl`). Use logging only for critical errors or major milestone events. Keep console logs below the recommended threshold (typically 5 per file).

### 5. GSettings Schema Rules
- **Rule**:
  - GSettings schema XML filenames must match the schema ID exactly and end in `.gschema.xml` (`EGO-P-004`).
  - Schema path must start with `/org/gnome/shell/extensions/` (`EGO-P-002`).
  - Do not ship compiled GSettings binary files (`gschemas.compiled`) inside the upload package (`EGO-P-006`).

### 6. No Unnecessary Files
- **Rule**: Clean up and remove anything not strictly required for running the extension inside the packaged archive (`EGO-P-006`).
- **Exclude**:
  - `.git/` folder and git configs
  - Build scripts (e.g., `Makefile`, `compile.sh`, `bundle.sh`)
  - Testing folders, dummy audios, or translation source files
  - Unused assets or documentation markdown files (`README.md`, `CHANGELOG.md`)

---

## Pre-Submission Testing Checklist

Before uploading to `https://extensions.gnome.org/upload/`, verify:

1. [ ] **Shexli Validation**: `shexli` outputs 0 errors and minimum acceptable warnings.
2. [ ] **Lifecycle Test**: Enable and disable the extension multiple times sequentially in GNOME Extensions App and check `journalctl -f -o cat /usr/bin/gnome-shell` for errors.
3. [ ] **Clean Package**: Double check the `.zip` archive does not contain `.git`, compiled schemas, or build scripts.
4. [ ] **Version Matching**: Make sure `shell-version` in `metadata.json` accurately lists compatible GNOME versions.
