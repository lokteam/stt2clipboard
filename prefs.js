import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const LANGUAGES = [
    { code: 'auto', name: 'Auto-detect' },
    { code: 'en', name: 'English' },
    { code: 'zh', name: 'Chinese' },
    { code: 'de', name: 'German' },
    { code: 'es', name: 'Spanish' },
    { code: 'ru', name: 'Russian' },
    { code: 'ko', name: 'Korean' },
    { code: 'fr', name: 'French' },
    { code: 'ja', name: 'Japanese' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'tr', name: 'Turkish' },
    { code: 'pl', name: 'Polish' },
    { code: 'ca', name: 'Catalan' },
    { code: 'nl', name: 'Dutch' },
    { code: 'ar', name: 'Arabic' },
    { code: 'sv', name: 'Swedish' },
    { code: 'it', name: 'Italian' },
    { code: 'id', name: 'Indonesian' },
    { code: 'hi', name: 'Hindi' },
    { code: 'fi', name: 'Finnish' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'he', name: 'Hebrew' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'el', name: 'Greek' },
    { code: 'ms', name: 'Malay' },
    { code: 'cs', name: 'Czech' },
    { code: 'ro', name: 'Romanian' },
    { code: 'da', name: 'Danish' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'ta', name: 'Tamil' },
    { code: 'no', name: 'Norwegian' },
    { code: 'th', name: 'Thai' },
    { code: 'ur', name: 'Urdu' },
    { code: 'hr', name: 'Croatian' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'lt', name: 'Lithuanian' },
    { code: 'la', name: 'Latin' },
    { code: 'mi', name: 'Maori' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'cy', name: 'Welsh' },
    { code: 'sk', name: 'Slovak' },
    { code: 'te', name: 'Telugu' },
    { code: 'fa', name: 'Persian' },
    { code: 'lv', name: 'Latvian' },
    { code: 'bn', name: 'Bengali' },
    { code: 'sr', name: 'Serbian' },
    { code: 'az', name: 'Azerbaijani' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'kn', name: 'Kannada' },
    { code: 'et', name: 'Estonian' },
    { code: 'mk', name: 'Macedonian' },
    { code: 'br', name: 'Breton' },
    { code: 'eu', name: 'Basque' },
    { code: 'is', name: 'Icelandic' },
    { code: 'hy', name: 'Armenian' },
    { code: 'ne', name: 'Nepali' },
    { code: 'mn', name: 'Mongolian' },
    { code: 'bs', name: 'Bosnian' },
    { code: 'kk', name: 'Kazakh' },
    { code: 'sq', name: 'Albanian' },
    { code: 'sw', name: 'Swahili' },
    { code: 'gl', name: 'Galician' },
    { code: 'mr', name: 'Marathi' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'si', name: 'Sinhala' },
    { code: 'km', name: 'Khmer' },
    { code: 'sn', name: 'Shona' },
    { code: 'yo', name: 'Yoruba' },
    { code: 'so', name: 'Somali' },
    { code: 'af', name: 'Afrikaans' },
    { code: 'oc', name: 'Occitan' },
    { code: 'ka', name: 'Georgian' },
    { code: 'be', name: 'Belarusian' },
    { code: 'tg', name: 'Tajik' },
    { code: 'sd', name: 'Sindhi' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'am', name: 'Amharic' },
    { code: 'yi', name: 'Yiddish' },
    { code: 'lo', name: 'Lao' },
    { code: 'uz', name: 'Uzbek' },
    { code: 'fo', name: 'Faroese' },
    { code: 'ht', name: 'Haitian Creole' },
    { code: 'ps', name: 'Pashto' },
    { code: 'tk', name: 'Turkmen' },
    { code: 'nn', name: 'Nynorsk' },
    { code: 'mt', name: 'Maltese' },
    { code: 'sa', name: 'Sanskrit' },
    { code: 'lb', name: 'Luxembourgish' },
    { code: 'my', name: 'Myanmar' },
    { code: 'bo', name: 'Tibetan' },
    { code: 'tl', name: 'Tagalog' },
    { code: 'mg', name: 'Malagasy' },
    { code: 'as', name: 'Assamese' },
    { code: 'tt', name: 'Tatar' },
    { code: 'haw', name: 'Hawaiian' },
    { code: 'ln', name: 'Lingala' },
    { code: 'ha', name: 'Hausa' },
    { code: 'ba', name: 'Bashkir' },
    { code: 'jw', name: 'Javanese' },
    { code: 'su', name: 'Sundanese' }
];

const MODELS = [
    { name: 'Tiny', filename: 'ggml-tiny.bin', size: '75 MB', url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin' },
    { name: 'Base', filename: 'ggml-base.bin', size: '142 MB', url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin' },
    { name: 'Small', filename: 'ggml-small.bin', size: '466 MB', url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin' },
    { name: 'Medium', filename: 'ggml-medium.bin', size: '1.5 GB', url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin' },
    { name: 'Large-v3-Turbo', filename: 'ggml-large-v3-turbo.bin', size: '1.5 GB', url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin' }
];

export default class Stt2ClipboardPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings('org.gnome.shell.extensions.stt2clipboard');

        const page = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'preferences-system-symbolic',
        });
        window.add(page);

        // --- GROUP 1: General Settings ---
        const generalGroup = new Adw.PreferencesGroup({
            title: 'General Settings',
        });
        page.add(generalGroup);

        // Feature 2: Hotkey Grabber Widget
        const shortcutRow = new Adw.ActionRow({
            title: 'Hotkey Shortcut',
            subtitle: 'Shortcut to start or stop Speech-to-Text recording'
        });
        generalGroup.add(shortcutRow);

        let shortcutBtn = new Gtk.Button({
            label: settings.get_strv('shortcut-key')[0] || 'F9',
            valign: Gtk.Align.CENTER
        });
        shortcutRow.add_suffix(shortcutBtn);

        let resetBtn = new Gtk.Button({
            icon_name: 'edit-clear-symbolic',
            tooltip_text: 'Reset to F9',
            valign: Gtk.Align.CENTER
        });
        shortcutRow.add_suffix(resetBtn);

        let isListening = false;
        let controller = new Gtk.EventControllerKey();
        shortcutBtn.add_controller(controller);

        let focusController = new Gtk.EventControllerFocus();
        shortcutBtn.add_controller(focusController);

        shortcutBtn.connect('clicked', () => {
            if (!isListening) {
                isListening = true;
                shortcutBtn.set_label('Press keys...');
                shortcutBtn.add_css_class('suggested-action');
                shortcutBtn.grab_focus();
            } else {
                isListening = false;
                shortcutBtn.remove_css_class('suggested-action');
                shortcutBtn.set_label(settings.get_strv('shortcut-key')[0] || 'F9');
            }
        });

        controller.connect('key-pressed', (ctrl, keyval, keycode, state) => {
            if (!isListening) return false;

            let accelName = Gtk.accelerator_name(keyval, state);
            if (accelName === 'Escape') {
                isListening = false;
                shortcutBtn.remove_css_class('suggested-action');
                shortcutBtn.set_label(settings.get_strv('shortcut-key')[0] || 'F9');
                return true;
            }

            if (Gtk.accelerator_valid(keyval, state)) {
                let accel = Gtk.accelerator_name(keyval, state);
                settings.set_strv('shortcut-key', [accel]);
                shortcutBtn.set_label(accel);
                isListening = false;
                shortcutBtn.remove_css_class('suggested-action');
                return true;
            }

            return true;
        });

        focusController.connect('leave', () => {
            if (isListening) {
                isListening = false;
                shortcutBtn.remove_css_class('suggested-action');
                shortcutBtn.set_label(settings.get_strv('shortcut-key')[0] || 'F9');
            }
        });

        resetBtn.connect('clicked', () => {
            settings.set_strv('shortcut-key', ['F9']);
            shortcutBtn.set_label('F9');
            isListening = false;
            shortcutBtn.remove_css_class('suggested-action');
        });

        // Notifications row (Feature 1 translated)
        const notificationRow = new Adw.SwitchRow({
            title: 'Show Notifications',
            subtitle: 'Display a popup notification after copying transcription to clipboard'
        });
        settings.bind('show-notification', notificationRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        generalGroup.add(notificationRow);


        // --- GROUP 2: History Settings (Feature 7) ---
        const historyGroup = new Adw.PreferencesGroup({
            title: 'Recording History Settings',
        });
        page.add(historyGroup);

        const historyRow = new Adw.SwitchRow({
            title: 'Save History',
            subtitle: 'Chronologically save WAV recordings and TXT transcripts'
        });
        settings.bind('history-enabled', historyRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        historyGroup.add(historyRow);

        const historyDirRow = new Adw.ActionRow({
            title: 'History Folder',
            subtitle: settings.get_string('history-directory') || 'None selected'
        });
        historyGroup.add(historyDirRow);

        let selectFolderBtn = new Gtk.Button({
            label: 'Select Folder...',
            valign: Gtk.Align.CENTER
        });
        historyDirRow.add_suffix(selectFolderBtn);

        settings.bind('history-enabled', historyDirRow, 'sensitive', Gio.SettingsBindFlags.DEFAULT);

        selectFolderBtn.connect('clicked', () => {
            let parentWindow = selectFolderBtn.get_root();
            let dialog = new Gtk.FileDialog({
                title: 'Select History Folder'
            });
            dialog.select_folder(parentWindow, null, (dialogObj, res) => {
                try {
                    let folder = dialogObj.select_folder_finish(res);
                    if (folder) {
                        let path = folder.get_path();
                        settings.set_string('history-directory', path);
                        historyDirRow.set_subtitle(path);
                    }
                } catch (err) {
                    console.error("STT2Clipboard: FileDialog failed: ", err);
                }
            });
        });


        // --- GROUP 3: Whisper Installation Helper ---
        let hasServer = GLib.find_program_in_path('whisper-server');
        if (!hasServer) {
            const installationGroup = new Adw.PreferencesGroup({
                title: 'Whisper Server Installation',
            });
            page.add(installationGroup);

            const installRow = new Adw.ActionRow({
                title: 'Install whisper-server',
                subtitle: 'whisper-server binary was not found in system PATH.'
            });
            installationGroup.add(installRow);

            const linkBtn = new Gtk.LinkButton({
                uri: 'https://github.com/ggerganov/whisper.cpp',
                label: 'Instructions',
                valign: Gtk.Align.CENTER
            });
            installRow.add_suffix(linkBtn);
        }


        // --- GROUP 4: Whisper Server Settings ---
        const whisperGroup = new Adw.PreferencesGroup({
            title: 'Whisper Server Settings',
        });
        page.add(whisperGroup);

        const autostartRow = new Adw.SwitchRow({
            title: 'Autostart Server',
            subtitle: 'Start local whisper-server binary when extension is enabled'
        });
        settings.bind('whisper-autostart', autostartRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        whisperGroup.add(autostartRow);

        const binRow = new Adw.EntryRow({
            title: 'Whisper Server Binary Path',
            text: settings.get_string('whisper-server-bin')
        });
        binRow.connect('changed', (entry) => {
            settings.set_string('whisper-server-bin', entry.get_text());
        });
        whisperGroup.add(binRow);
        binRow.set_visible(!hasServer);

        if (hasServer) {
            let currentBin = settings.get_string('whisper-server-bin');
            if (!currentBin || currentBin === '/usr/bin/whisper-server' || !GLib.file_test(currentBin, GLib.FileTest.EXISTS)) {
                settings.set_string('whisper-server-bin', hasServer);
            }
        }

        let maxThreads = Math.max(1, GLib.get_num_processors());
        const threadsRow = new Adw.SpinRow({
            title: 'CPU Threads',
            subtitle: 'Number of CPU threads to allocate for model inference',
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: maxThreads,
                step_increment: 1
            })
        });
        settings.bind('whisper-threads', threadsRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        whisperGroup.add(threadsRow);

        // Feature 4: Model Download Manager & Selection List
        let modelListNames = MODELS.map(m => `${m.name} (${m.size})`);
        modelListNames.push('Custom Path...');
        let modelStringList = Gtk.StringList.new(modelListNames);

        const modelComboRow = new Adw.ComboRow({
            title: 'Whisper Model',
            model: modelStringList
        });
        whisperGroup.add(modelComboRow);

        const customModelRow = new Adw.EntryRow({
            title: 'Custom GGML Model Path (.bin)',
            text: settings.get_string('whisper-model-path')
        });
        whisperGroup.add(customModelRow);

        const downloadRow = new Adw.ActionRow({
            title: 'Model Status',
            subtitle: 'Checking model status...'
        });
        whisperGroup.add(downloadRow);

        const progressBar = new Gtk.ProgressBar({
            valign: Gtk.Align.CENTER,
            visible: false
        });
        downloadRow.add_suffix(progressBar);

        const downloadBtn = new Gtk.Button({
            label: 'Download',
            valign: Gtk.Align.CENTER,
            visible: false
        });
        downloadRow.add_suffix(downloadBtn);

        let modelsDir = GLib.get_user_data_dir() + '/stt2clipboard/models';
        let isDownloading = false;
        let currentDownloadingModel = null;

        let updateModelStatus = () => {
            let index = modelComboRow.get_selected();
            if (index === MODELS.length) {
                customModelRow.set_visible(true);
                downloadRow.set_visible(false);
                settings.set_string('whisper-model-path', customModelRow.get_text());
                return;
            }

            customModelRow.set_visible(false);
            downloadRow.set_visible(true);

            let model = MODELS[index];
            let filepath = modelsDir + '/' + model.filename;
            let exists = GLib.file_test(filepath, GLib.FileTest.EXISTS);

            if (exists) {
                downloadRow.set_subtitle('Model is downloaded and ready.');
                downloadBtn.set_visible(false);
                progressBar.set_visible(false);
                settings.set_string('whisper-model-path', filepath);
            } else {
                if (isDownloading && currentDownloadingModel && currentDownloadingModel.filename === model.filename) {
                    downloadRow.set_subtitle(`Downloading ${model.name}...`);
                    downloadBtn.set_visible(false);
                    progressBar.set_visible(true);
                } else {
                    downloadRow.set_subtitle('Model is not downloaded.');
                    downloadBtn.set_visible(true);
                    progressBar.set_visible(false);
                }
            }
        };

        modelComboRow.connect('notify::selected', () => {
            updateModelStatus();
        });

        customModelRow.connect('changed', (entry) => {
            if (modelComboRow.get_selected() === MODELS.length) {
                settings.set_string('whisper-model-path', entry.get_text());
            }
        });

        downloadBtn.connect('clicked', () => {
            let index = modelComboRow.get_selected();
            if (index >= MODELS.length || isDownloading) return;

            let model = MODELS[index];
            currentDownloadingModel = model;
            isDownloading = true;

            GLib.mkdir_with_parents(modelsDir, 0o755);
            let filepath = modelsDir + '/' + model.filename;
            let tempFilepath = filepath + '.tmp';

            updateModelStatus();

            let pulseId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
                progressBar.pulse();
                return GLib.SOURCE_CONTINUE;
            });

            try {
                let proc = new Gio.Subprocess({
                    argv: ['curl', '-L', '-o', tempFilepath, model.url],
                    flags: Gio.SubprocessFlags.NONE
                });
                proc.init(null);
                proc.wait_async(null, (obj, res) => {
                    try {
                        obj.wait_finish(res);
                        if (obj.get_exit_status() === 0) {
                            let src = Gio.File.new_for_path(tempFilepath);
                            let dest = Gio.File.new_for_path(filepath);
                            src.move(dest, Gio.FileCopyFlags.OVERWRITE, null, null);
                            
                            let selectedIndex = modelComboRow.get_selected();
                            if (selectedIndex < MODELS.length && MODELS[selectedIndex].filename === model.filename) {
                                settings.set_string('whisper-model-path', filepath);
                            }
                        }
                    } catch (e) {
                        console.error("STT2Clipboard: Download failed: ", e);
                    }
                    GLib.source_remove(pulseId);
                    isDownloading = false;
                    currentDownloadingModel = null;
                    updateModelStatus();
                });
            } catch (e) {
                console.error("STT2Clipboard: Failed to spawn curl: ", e);
                GLib.source_remove(pulseId);
                isDownloading = false;
                currentDownloadingModel = null;
                updateModelStatus();
            }
        });

        // Initialize model row selection
        let currentModelPath = settings.get_string('whisper-model-path');
        let initialIndex = -1;

        if (currentModelPath.startsWith('~')) {
            currentModelPath = GLib.get_home_dir() + currentModelPath.slice(1);
        }

        for (let i = 0; i < MODELS.length; i++) {
            let filepath = modelsDir + '/' + MODELS[i].filename;
            if (currentModelPath === filepath) {
                initialIndex = i;
                break;
            }
        }

        if (initialIndex !== -1) {
            modelComboRow.set_selected(initialIndex);
        } else {
            let baseFilepath = modelsDir + '/ggml-base.bin';
            if (!currentModelPath || currentModelPath.endsWith('ggml-base.bin')) {
                modelComboRow.set_selected(1);
            } else {
                let defaultStandardPaths = MODELS.map(m => modelsDir + '/' + m.filename);
                if (defaultStandardPaths.includes(currentModelPath)) {
                    let idx = defaultStandardPaths.indexOf(currentModelPath);
                    modelComboRow.set_selected(idx);
                } else {
                    modelComboRow.set_selected(MODELS.length);
                }
            }
        }
        updateModelStatus();

        const langGroup = new Adw.PreferencesGroup({
            title: 'Recognition Language',
            description: 'Select the language spoken in the recording'
        });
        page.add(langGroup);

        let langNames = LANGUAGES.map(l => l.name);
        let langStringList = Gtk.StringList.new(langNames);

        const langComboRow = new Adw.ComboRow({
            title: 'Recognition Language',
            model: langStringList,
            enable_search: true
        });
        langGroup.add(langComboRow);

        let currentLangCode = settings.get_string('whisper-language');
        let initialLangIndex = LANGUAGES.findIndex(l => l.code === currentLangCode);
        if (initialLangIndex !== -1) {
            langComboRow.set_selected(initialLangIndex);
        }

        langComboRow.connect('notify::selected', () => {
            let index = langComboRow.get_selected();
            if (index >= 0 && index < LANGUAGES.length) {
                settings.set_string('whisper-language', LANGUAGES[index].code);
            }
        });
    }
}
