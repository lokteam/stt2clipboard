import St from 'gi://St';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';
import Gst from 'gi://Gst';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

function findFreePort(startPort) {
    let port = startPort;
    while (port < 65535) {
        try {
            let listener = new Gio.SocketListener();
            let address = Gio.InetSocketAddress.new_from_string('127.0.0.1', port);
            listener.add_address(address, Gio.SocketType.STREAM, Gio.SocketProtocol.TCP, null, null);
            listener.close();
            return port;
        } catch (e) {
            port++;
        }
    }
    return startPort;
}

class Indicator {
    constructor(ext) {
        this.ext = ext;
        this.visible = false;
        this.timerId = null;
        this.pipeline = null;
        this.state = 'idle';
        this._cancellable = null;
    }

    show() {
        this.visible = true;
        this.state = 'recording';
        this.ext._indicator = new PanelMenu.Button(0.0, this.ext.metadata.name, true);
        this.ext._indicator.add_style_class_name('stt-indicator-button');

        this.box = new St.BoxLayout({
            style_class: 'panel-status-indicators-box',
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER
        });

        this.timerLabel = new St.Label({
            text: '00:00',
            y_align: Clutter.ActorAlign.CENTER
        });

        this.icon = new St.Icon({
            icon_name: 'audio-input-microphone-symbolic',
            style_class: 'system-status-icon',
        });

        this.box.add_child(this.timerLabel);
        this.box.add_child(this.icon);
        this.ext._indicator.add_child(this.box);

        if (this.ext._indicator._clickGesture) {
            this.ext._indicator.remove_action(this.ext._indicator._clickGesture);
        }

        this._clickGesture = new Clutter.ClickGesture();
        this._clickGesture.connect('recognize', () => {
            if (this.state === 'recording') {
                this.stopAndProcess();
            } else if (this.state === 'processing') {
                this.cancelAndHide();
            }
        });
        this.ext._indicator.add_action(this._clickGesture);

        this.ext._indicator.connect('key-press-event', (actor, event) => {
            let symbol = event.get_key_symbol();
            if (symbol === Clutter.KEY_Return || symbol === Clutter.KEY_KP_Enter) {
                if (this.state === 'recording') {
                    this.stopAndProcess();
                } else if (this.state === 'processing') {
                    this.cancelAndHide();
                }
                return true;
            }
            return false;
        });

        Main.panel.addToStatusArea(this.ext.uuid, this.ext._indicator);

        this.startRecording();

        this.ext._indicator.can_focus = true;
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 50, () => {
            if (this.ext._indicator) {
                global.stage.set_key_focus(this.ext._indicator);
            }
            return GLib.SOURCE_REMOVE;
        });
    }

    hide() {
        this.stopRecording();
        if (this._cancellable) {
            this._cancellable.cancel();
            this._cancellable = null;
        }
        this.state = 'idle';
        this.visible = false;
        this.ext._indicator?.destroy();
        this.ext._indicator = null;
    }

    startRecording() {
        this.icon.add_style_class_name('stt-recording-icon');
        this.timerLabel.add_style_class_name('stt-timer-label');

        this.startTime = GLib.get_monotonic_time();
        this.updateTimer();
        this.timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
            this.updateTimer();
            return GLib.SOURCE_CONTINUE;
        });

        let filePath = '/tmp/stt_temp_record.wav';
        
        try {
            Gst.init(null);
            let pipelineStr = `autoaudiosrc ! audioconvert ! audioresample ! audio/x-raw,rate=16000,channels=1 ! wavenc ! filesink location=${filePath}`;
            this.pipeline = Gst.parse_launch(pipelineStr);
            this.pipeline.set_state(Gst.State.PLAYING);
        } catch (e) {
            console.error("STT2Clipboard: Error starting GStreamer: ", e);
        }
    }

    updateTimer() {
        let now = GLib.get_monotonic_time();
        let diffSeconds = Math.floor((now - this.startTime) / 1000000);
        let mins = Math.floor(diffSeconds / 60).toString().padStart(2, '0');
        let secs = (diffSeconds % 60).toString().padStart(2, '0');
        this.timerLabel.set_text(`${mins}:${secs}`);
    }

    stopRecording() {
        if (this.timerId) {
            GLib.source_remove(this.timerId);
            this.timerId = null;
        }

        if (this.pipeline) {
            this.pipeline.send_event(Gst.Event.new_eos());
            let pipelineToClose = this.pipeline;
            this.pipeline = null;
            GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
                if (pipelineToClose) {
                    try {
                        pipelineToClose.set_state(Gst.State.NULL);
                    } catch (e) {
                        console.error("STT2Clipboard: Error setting pipeline state to NULL: ", e);
                    }
                }
                return GLib.SOURCE_REMOVE;
            });
        }
    }

    async stopAndProcess() {
        if (this.state !== 'recording') return;
        this.state = 'processing';

        if (this.timerId) {
            GLib.source_remove(this.timerId);
            this.timerId = null;
        }

        let filePath = '/tmp/stt_temp_record.wav';

        if (this.pipeline) {
            this.pipeline.send_event(Gst.Event.new_eos());
            let pipelineToClose = this.pipeline;
            this.pipeline = null;
            
            await new Promise(resolve => {
                GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
                    if (pipelineToClose) {
                        try {
                            pipelineToClose.set_state(Gst.State.NULL);
                        } catch (e) {
                            console.error("STT2Clipboard: Error setting pipeline state to NULL: ", e);
                        }
                    }
                    resolve();
                    return GLib.SOURCE_REMOVE;
                });
            });
        }

        if (this.state !== 'processing') return;

        this.icon.icon_name = 'process-working-symbolic';
        this.icon.remove_style_class_name('stt-recording-icon');
        this.icon.add_style_class_name('stt-processing-icon');

        this.timerLabel.visible = false;

        this._cancellable = new Gio.Cancellable();

        try {
            let language = this.ext.settings.get_string('whisper-language');
            let port = this.ext.activeWhisperPort;

            let argv = [
                'curl', '-s',
                '-X', 'POST',
                `http://127.0.0.1:${port}/inference`,
                '-H', 'Content-Type: multipart/form-data',
                '-F', `file=@${filePath}`,
                '-F', 'temperature=0.0',
                '-F', 'response_format=json'
            ];
            if (language && language !== 'auto') {
                argv.push('-F', `language=${language}`);
            }

            let proc = new Gio.Subprocess({
                argv: argv,
                flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            });
            proc.init(this._cancellable);

            let [stdout, stderr] = await proc.communicate_utf8_async(null, this._cancellable);
            let status = proc.get_exit_status();

            if (status !== 0) {
                throw new Error(stderr ? stderr.trim() : `curl exited with status ${status}`);
            }

            let response = JSON.parse(stdout);
            let text = response.text ? response.text.trim() : '';

            if (text) {
                St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, text);
                if (this.ext.settings.get_boolean('show-notification')) {
                    Main.notify('STT2Clipboard', `Text copied: "${text}"`);
                }
                if (this.ext.settings.get_boolean('history-enabled')) {
                    let historyDir = this.ext.settings.get_string('history-directory');
                    if (historyDir) {
                        this.saveToHistory(historyDir, text);
                    }
                }
            } else {
                if (this.ext.settings.get_boolean('show-notification')) {
                    Main.notify('STT2Clipboard', 'No speech recognized.');
                }
            }
        } catch (e) {
            console.error("STT2Clipboard: Error during STT: ", e);
            if (this.ext.settings.get_boolean('show-notification')) {
                Main.notify('STT2Clipboard', `Recognition error: ${e.message}`);
            }
        } finally {
            this._cancellable = null;
            this.hide();
        }
    }

    saveToHistory(historyDir, text) {
        try {
            if (historyDir.startsWith('~')) {
                historyDir = GLib.get_home_dir() + historyDir.slice(1);
            }
            GLib.mkdir_with_parents(historyDir, 0o755);

            let now = new Date();
            let pad = (num) => num.toString().padStart(2, '0');
            let timestamp = `stt_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
            
            let srcFile = Gio.File.new_for_path('/tmp/stt_temp_record.wav');
            let destWavFile = Gio.File.new_for_path(GLib.build_filenamev([historyDir, `${timestamp}.wav`]));
            srcFile.copy(destWavFile, Gio.FileCopyFlags.OVERWRITE, null, null);

            let destTxtFile = Gio.File.new_for_path(GLib.build_filenamev([historyDir, `${timestamp}.txt`]));
            destTxtFile.replace_contents(
                text,
                null,
                false,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                null
            );
        } catch (e) {
            console.error("STT2Clipboard: Error saving to history: ", e);
        }
    }

    cancelAndHide() {
        if (this._cancellable) {
            this._cancellable.cancel();
            this._cancellable = null;
        }
        this.hide();
    }
}

export default class ExampleExtension extends Extension {
    enable() {
        this.indicatorObj = new Indicator(this);
        this.settings = this.getSettings('org.gnome.shell.extensions.stt2clipboard');

        let startPort = 29482;
        if (this.settings.get_boolean('whisper-autostart')) {
            let port = findFreePort(startPort);
            this.activeWhisperPort = port;

            let binPath = this.settings.get_string('whisper-server-bin');
            if (binPath.startsWith('~')) {
                binPath = GLib.get_home_dir() + binPath.slice(1);
            }
            let modelPath = this.settings.get_string('whisper-model-path');
            if (modelPath.startsWith('~')) {
                modelPath = GLib.get_home_dir() + modelPath.slice(1);
            }
            let threads = this.settings.get_int('whisper-threads');
            let language = this.settings.get_string('whisper-language');

            let argv = [
                binPath,
                '-m', modelPath,
                '--port', port.toString(),
                '--host', '127.0.0.1',
                '-t', threads.toString(),
                '--convert'
            ];
            if (language && language !== 'auto') {
                argv.push('-l', language);
            }

            try {
                this._whisperProc = new Gio.Subprocess({
                    argv: argv,
                    flags: Gio.SubprocessFlags.NONE
                });
                this._whisperProc.init(null);
                console.log(`STT2Clipboard: Started whisper-server on port ${port}`);
            } catch (e) {
                console.error(`STT2Clipboard: Failed to start whisper-server: ${e.message}`);
                Main.notify('STT2Clipboard', `Failed to start server: ${e.message}`);
            }
        } else {
            this.activeWhisperPort = startPort;
            this._whisperProc = null;
        }

        Main.wm.addKeybinding(
            'shortcut-key',
            this.settings,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
            () => {
                if (this.indicatorObj.state === 'idle') {
                    this.indicatorObj.show();
                } else if (this.indicatorObj.state === 'recording') {
                    this.indicatorObj.stopAndProcess();
                } else if (this.indicatorObj.state === 'processing') {
                    this.indicatorObj.cancelAndHide();
                }
            }
        );
    }

    disable() {
        if (this.indicatorObj) {
            this.indicatorObj.hide();
            this.indicatorObj = null;
        }

        Main.wm.removeKeybinding('shortcut-key');

        if (this._whisperProc) {
            try {
                this._whisperProc.force_exit();
            } catch (e) {
                console.error(`STT2Clipboard: Error stopping whisper-server: ${e.message}`);
            }
            this._whisperProc = null;
        }

        this.settings = null;
    }
}
