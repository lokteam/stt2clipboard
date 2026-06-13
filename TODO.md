# STT2Clipboard Roadmap & Next Actions

This document tracks all tasks, detailed requirements, and steps for the next iteration of the extension.

## Feature 1: Strict English Localization
* **Objective**: Translate all user-facing strings (Preferences window, Notifications, Labels) exclusively into English.
* **Implementation**:
  * Ensure all text arrays, titles, and subtitles in `prefs.js` are in pure English.
  * Localize indicator state label to `Processing...` and all notification texts to English.
* **Expected Result**: 100% of user-visible strings are in English.

## Feature 2: Hotkey Capture (Grabber) Widget
* **Objective**: Remove the raw text-input field for hotkeys and replace it with an interactive hotkey grabber widget.
* **Implementation**:
  * Build a custom `Adw.ActionRow` containing a `Gtk.Button` that says "Нажмите клавишу..." or "Изменить...".
  * When clicked, the button listens for keyboard input (`key-press-event` / `Gtk.EventControllerKey`).
  * Capture the raw key values and modifiers (Shift, Super, Alt, Ctrl), convert them to a GNOME-compatible accelerator string (e.g. `<Super>r`, `<Ctrl><Alt>s`), save it to GSettings, and update the button label.
  * Include a button to reset to the default `F9`.
* **Expected Result**: Users can set shortcuts by pressing the actual keys rather than typing them.

## Feature 3: Whisper Server System-Wide Checker & Distro Installer
* **Objective**: Automatically detect if a local `whisper-server` is installed in PATH. If missing, offer automated/copypasteable distro package install commands.
* **Implementation**:
  * At preferences startup, check for `whisper-server` using `GLib.find_program_in_path()`.
  * If found: Hide the installer interface and run seamlessly.
  * If missing: Show an elegant Adwaita banner with a dropdown to select the distribution (Arch Linux, Ubuntu, Fedora) and a button to run the install command.
  * For Arch Linux: Spawns a terminal or runs `paru -S lokstt` / `yay -S lokstt` using `pkexec` or shows a clear copypaste command.
  * For Ubuntu/Fedora: Provide custom installation commands or scripts.
* **Expected Result**: Clean startup detection with zero-config for users who already have it, and a helper installer for those who don't.

## Feature 4: Model Download Manager & Selection List
* **Objective**: Automatically download GGML models directly from Hugging Face/GitHub and allow choosing them via a dropdown list.
* **Implementation**:
  * Define 5 standard models (Tiny, Base, Small, Medium, Large-v3-Turbo) with direct URLs.
  * Path choice: Download to user's home folder under `~/.local/share/stt2clipboard/models/` to bypass root requirements.
  * In `prefs.js`, create an `Adw.ComboRow` listing the 5 models.
  * If the model file is not present locally, show a "Скачать" button next to it.
  * On click, spawn an asynchronous `curl` process to download the model, and display a `Gtk.ProgressBar` with progress feedback.
* **Expected Result**: Easy model selection and downloading without typing file paths or using root privileges.

## Feature 5: Searchable English Language Dropdown
* **Objective**: Replace the plain language code entry with a searchable dropdown list containing full language names in English.
* **Implementation**:
  * Map 99 standard Whisper languages (e.g. `ru` -> "Russian", `en` -> "English", `de` -> "German", `auto` -> "Auto-detect").
  * Use `Adw.ComboRow` with a search filter inside `prefs.js` so users can easily type and select a language.
* **Expected Result**: Search and click selection of languages using their full native names instead of codes.

## Feature 6: Auto-Port Selection & Settings Cleanup
* **Objective**: Eliminate the port configuration row from settings and manage port selection completely under the hood.
* **Implementation**:
  * Remove `whisper-port` settings row from `prefs.js`.
  * Define a default starting port (e.g., `29482`).
  * Keep the dynamic port probing mechanism (`findFreePort`) in `extension.js` to handle any edge-case port busy scenarios.
* **Expected Result**: No port configs in preferences; 100% automated connection port mapping.

## Feature 7: Temp Files in /tmp & Optional Timestamp History Logging
* **Objective**: Clean up home folder clutter by saving temp files to `/tmp/`, and add optional chronological logging of WAV recordings and TXT transcripts.
* **Implementation**:
  * **Temporary WAV**: Always record directly to `/tmp/stt_temp_record.wav`.
  * **History Option**: Add an `Adw.SwitchRow` "Сохранять историю".
  * **History Folder**: If enabled, show an `Adw.ActionRow` to select a folder (using native `Gtk.FileDialog` / `Gtk.FileChooserNative`).
  * **History Saving**: After successful transcription, if history is enabled, copy the `/tmp/stt_temp_record.wav` file to the history folder with a timestamp (e.g., `stt_2026-06-14_00-30-15.wav`) and save the transcript text to `stt_2026-06-14_00-30-15.txt`.
* **Expected Result**: No home directory clutter, and structured session transcripts with audio backup.
