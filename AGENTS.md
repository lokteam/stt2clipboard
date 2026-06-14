# Developer and Agent Instructions

This document outlines the architecture, critical technical choices, and constraints of the STT2Clipboard GNOME Shell extension.

## Architecture and Control Flow

1. **Extension Lifecycle (`ExampleExtension`)**
   - On `enable()`, the extension retrieves settings from `'org.gnome.shell.extensions.stt2clipboard'`.
   - If `whisper-autostart` is enabled, the extension dynamically probes for a free TCP port starting from the default port (`29482`) using `Gio.SocketListener`.
   - It then spawns the `whisper-server` process using `Gio.Subprocess` with a `--convert` argument to handle robust ffmpeg-based audio ingestion. It resolves tilde (`~`) paths to absolute home paths automatically.
   - On `disable()`, the extension cleans up by terminating the background `whisper-server` process using `.force_exit()` to prevent orphan/zombie processes.

2. **UI and Recording State (`Indicator`)**
   - The panel indicator is created dynamically during active operations (`recording` and `processing` states) and destroyed when entering `idle`.
   - It is styled with `stt-indicator-button` to enforce a stable width of `80px` (`min-width` and `max-width`), preventing layout/panel shifts.
   - It transitions between three states:
     - `idle`: Not visible.
     - `recording`: Displays a red/orange microphone icon (`stt-recording-icon`) and real-time MM:SS timer. Captures audio via GStreamer to a WAV file.
     - `processing`: Hides the timer label (`visible = false`) and displays a rotating blue spinner (`stt-processing-icon`, using `process-working-symbolic`). Performs an asynchronous HTTP POST request using `curl` via `Gio.Subprocess`.
   - **Click Navigation & Interception**: Click actions use `Clutter.ClickGesture` connected to `recognize` to cleanly stop recording or cancel processing.
   - **Keyboard Focus & Controls**: The indicator enables focus (`can_focus = true`) and automatically grabs system focus upon recording start (`global.stage.set_key_focus()`). Pressing `Enter`/`Return` or `KP_Enter` triggers finishing or canceling actions, and returns `true` to stop propagation.

3. **Preferences and Settings Window (`prefs.js`)**
   - Built exclusively in **English** using GNOME Adwaita (`Adw`).
   - **Interactive Hotkey Grabber**: Implemented with `Gtk.EventControllerKey` and `Gtk.EventControllerFocus` to record custom key combos dynamically or reset to the default `F9`.
   - **System-Wide Whisper Checker & Installer Banner**: Startup detection using `GLib.find_program_in_path('whisper-server')`. If missing, shows an `Adw.Banner` with a dropdown menu to select the Linux distribution (Arch Linux, Ubuntu/Debian, Fedora) and a button to run the installation script directly by spawning `gnome-terminal`.
   - **Model Download Manager**: Displays standard Whisper models. Missing models can be downloaded asynchronously using `curl` in a `Gio.Subprocess` directly into `~/.local/share/stt2clipboard/models/`. Uses standard stream parsing to update a `Gtk.ProgressBar` in real-time.
   - **Searchable Language Dropdown**: Uses an `Adw.ComboRow` with search enabled (`enable_search: true`) to easily type and select spoken languages.
   - **Thread Tuning**: Configures inference threads restricted automatically to the system's actual hardware logical core count.
   - **Recording History**: Supports copying `/tmp/stt_temp_record.wav` to a custom history folder with timestamped filenames (`stt_YYYY-MM-DD_HH-MM-SS.wav`), accompanied by the transcribed text saved in an identical `.txt` file.

## Key Technical Decisions

- **GStreamer audioresample**: The GStreamer pipeline is explicitly restricted to `rate=16000,channels=1` using `audioresample ! audio/x-raw,rate=16000,channels=1`. Whisper models strictly require 16000Hz mono PCM audio. Recording at other rates or channels causes `whisper-server` to reject files.
- **Subprocess curl**: Instead of constructing raw multipart HTTP streams manually in GJS (which lacks high-level FormData/Blob APIs), the extension executes `curl` via `Gio.Subprocess` with a `Gio.Cancellable`. This is robust, secure, and allows the user to cancel ongoing transcription requests in real-time.
- **St.Clipboard**: Wayland enforces strict window-focus restrictions on background clipboard writes. To bypass this, the extension uses `St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, text)`, which is native to GNOME Shell and works perfectly in background/Wayland contexts.
- **Temporary WAV**: The temporary audio recording is always stored safely in `/tmp/stt_temp_record.wav` to keep the user's home directory clean.

## Constraints

* Do not add comments or docstrings unless absolutely necessary (for complex math/algorithms). The code itself must remain self-documenting.
* Never use `as any`, `@ts-ignore`, or `@ts-expect-error` inside TypeScript/JavaScript code.
* Always clean up GStreamer pipelines, timeout sources, and background subprocesses on extension disable or cancellation to prevent leaks.

## Git and Commit Guidelines

* After implementing each feature or atomic change, the agent must create a git commit.
* The commit message must be clear, concise, and written in Russian (на русском языке), describing exactly what was changed (e.g., "Добавлена валидация путей к Whisper", "Реализован асинхронный загрузчик моделей").
* Making frequent, atomic commits with clear Russian messages makes rolling back and troubleshooting individual changes much easier.
