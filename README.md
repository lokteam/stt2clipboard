# STT2Clipboard

GNOME Shell extension that performs Speech-to-Text (STT) and automatically copies the transcription to your system clipboard.

## Features

* **Interactive Hotkey Trigger**: Press **F9** (customizable via an interactive Gtk Hotkey Grabber in preferences) to start recording, and press it again to stop, transcribe, and copy.
* **Focused Keyboard Controls**: Upon recording, the indicator grabs system key focus. You can complete recording or cancel processing instantly with the `Enter`/`Return` or `Escape` keys.
* **Stable Panel Indicator**: Styled using native classes (`stt-indicator-button`) with a stabilized width (80px) and vertical alignments to prevent panel layout shifts.
  * **Recording**: Displays an orange microphone icon with a real-time MM:SS timer.
  * **Processing**: Hides the timer and displays a rotating blue spinner while asynchronously executing the transcription request.
* **GStreamer Optimized Audio**: Records directly using GStreamer restricted to `16000Hz` mono PCM audio (`autoaudiosrc ! audioconvert ! audioresample ! audio/x-raw,rate=16000,channels=1 ! wavenc ! filesink`), satisfying Whisper's exact input requirements.
* **No Home Clutter**: Stores temporary recording files safely in `/tmp/stt_temp_record.wav`.
* **Integrated Background Process**: Spawns and manages the lifecycle of a local `whisper-server` process with `--convert` flags. Automatically shuts down the process when the extension is disabled.
* **Automatic Port Probing**: Scans local TCP ports starting from `29482` to run the server on a free port without conflicts.
* **Wayland Compatible**: Leverages GNOME's native `St.Clipboard` API to bypass Wayland's strict background window-focus clipboard restrictions.
* **English Localization**: Clean English user interface for all preferences and system desktop notifications.

## Requirements

* **GNOME Shell**: 46 to 50
* **whisper-server**: Binary from `whisper.cpp` (typically auto-detected in user PATH or custom path).
* **Whisper GGML Model**: A `.bin` model file.
* **System Utilities**: `curl`, `ffmpeg`, and `gnome-terminal` (used for running the auto-installer).

## Configuration & Preferences

Open the extension preferences to configure and use these rich features:

1. **Hotkey Grabber**: Click to capture actual keys and modifiers (e.g., `<Super>R`, `<Ctrl><Alt>S`) directly or reset back to `F9`.
2. **System-wide Whisper Checker & Distro Installer**: Automatically detects if `whisper-server` is in your PATH. If missing, displays an elegant banner with pre-configured command instructions for Arch Linux, Ubuntu/Debian, and Fedora, which can be copied or executed directly in a newly spawned terminal.
3. **Model Download Manager**: Choose from standard models (Tiny, Base, Small, Medium, Large-v3-Turbo) or supply a custom path. If a standard model is missing, click **Download** to fetch it asynchronously via `curl` directly into `~/.local/share/stt2clipboard/models/` with real-time percentage progress bar feedback.
4. **Searchable Language Dropdown**: Multi-language selection using a searchable dropdown (with `enable_search` enabled) to select recognition languages by their full names instead of codes.
5. **CPU Threads Bounding**: Allocates the number of CPU threads to use for inference, bounded up to your hardware's actual logical core count.
6. **Recording History**: Option to chronologically archive WAV recordings and TXT transcripts to a folder of your choice (saved as `stt_YYYY-MM-DD_HH-MM-SS.wav` and `.txt`).
7. **Desktop Notifications**: Toggle toast notifications upon successful copy.
