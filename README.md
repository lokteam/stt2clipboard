# STT2Clipboard

GNOME Shell extension that performs Speech-to-Text (STT) and automatically copies the transcription to your system clipboard.

## Features

* **Single-key trigger**: Press F9 (customizable) to start recording, and press it again to stop, transcribe, and copy.
* **Panel Indicator**: Shows a recording microphone with a real-time duration timer. On stop, it transitions to a processing state (spinner) while waiting for the Whisper server response.
* **Wayland Compatible**: Uses the native St.Clipboard API which works seamlessly under Wayland.
* **Integrated Background Process**: Manages the lifecycle of a local whisper-server. It starts the server when the extension is enabled and terminates it when the extension is disabled.
* **Automatic Port Probing**: Dynamically scans for a free TCP port starting from the configured port to avoid conflicts.

## Requirements

* **GNOME Shell**: 45+ (compatible with GNOME 49)
* **whisper-server**: Binary from whisper.cpp (typically at `/usr/bin/whisper-server`)
* **Whisper GGML Model**: A downloaded model file (e.g., in `/usr/share/whisper-models/`)
* **System Utilities**: `curl` and `ffmpeg` must be installed on your system.

## GStreamer Audio Pipeline

The extension records audio using the GStreamer framework with the following high-efficiency pipeline optimized for Whisper:
`autoaudiosrc ! audioconvert ! audioresample ! audio/x-raw,rate=16000,channels=1 ! wavenc ! filesink`

This ensures that the captured WAV file is exactly 16000Hz mono, reducing the size of the uploaded audio by approximately 6x and minimizing inference latency.

## Configuration

Open the extension preferences to configure:
* **Hotkey**: Set custom keybindings (e.g., F9, `<Super>R`, etc.).
* **Save Path**: The path to save the temporary recording file (relative to your home directory or absolute).
* **Autostart Server**: Turn automatic management of the whisper-server on or off.
* **Binary Path**: Path to your `whisper-server` executable.
* **Model Path**: Path to your `.bin` GGML model file.
* **Language**: Recognition language code (e.g., `ru`, `en`) or `auto` for auto-detection.
* **Port**: Starting port for the whisper-server.
* **CPU Threads**: Number of threads to allocate for model inference.
* **Show Notifications**: Toggle desktop notifications upon successful transcription.
