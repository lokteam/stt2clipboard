# Developer and Agent Instructions

This document outlines the architecture, critical technical choices, and constraints of the STT2Clipboard GNOME Shell extension.

## Architecture and Control Flow

1. **Extension Lifecycle (`ExampleExtension`)**
   - On `enable()`, the extension checks if `whisper-autostart` is enabled.
   - If enabled, it probes for a free TCP port starting from the configured `whisper-port` using `Gio.SocketListener`.
   - It then spawns the local `/usr/bin/whisper-server` as a background process using `Gio.Subprocess`. The argument list includes `--convert` to ensure ffmpeg-based robust audio ingestion.
   - On `disable()`, the extension kills the background `whisper-server` process using `.force_exit()` to prevent orphan/zombie processes.

2. **UI and Recording State (`Indicator`)**
   - The panel indicator is created only during active operations (`recording` and `processing` states) and destroyed when `idle`.
   - It transitions between three states:
     - `idle`: Not visible.
     - `recording`: Displays a microphone icon (red) and real-time MM:SS timer. Captures audio via GStreamer to a WAV file.
     - `processing`: Displays a rotating spinner (blue) and "Распознавание..." label. Performs an asynchronous HTTP POST request to the local server.
   - Clicks on the panel button and hotkey events are fully captured and stop propagation by returning `true` (Clutter.EVENT_STOP) on the `'button-press-event'` signal. This blocks GNOME Shell from attempting to trigger default menu actions.

## Key Technical Decisions

- **GStreamer audioresample**: The GStreamer pipeline is explicitly restricted to `rate=16000,channels=1`. Whisper models strictly require 16000Hz mono PCM audio. Recording at 44100Hz stereo caused `whisper-server` to reject files with an `Invalid request` error.
- **Subprocess curl**: Instead of constructing raw multipart HTTP streams manually in GJS (which lacks high-level FormData/Blob APIs), the extension executes `curl` via `Gio.Subprocess` with a `Gio.Cancellable`. This is robust, secure, and allows the user to cancel ongoing transcription requests in real-time.
- **St.Clipboard**: Wayland enforces strict window-focus restrictions on background clipboard writes. To bypass this, the extension uses `St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, text)`, which is native to GNOME Shell and works perfectly in background/Wayland contexts.
