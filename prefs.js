import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class Stt2ClipboardPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings('org.gnome.shell.extensions.stt2clipboard');

        const page = new Adw.PreferencesPage({
            title: 'Основные',
            icon_name: 'preferences-system-symbolic',
        });
        window.add(page);

        const generalGroup = new Adw.PreferencesGroup({
            title: 'Основные настройки',
        });
        page.add(generalGroup);
        
        const shortcutRow = new Adw.EntryRow({
            title: 'Горячая клавиша (например: F9, <Super>R, <Ctrl><Alt>R)',
            text: settings.get_strv('shortcut-key')[0] || ''
        });
        shortcutRow.connect('changed', (entry) => {
            settings.set_strv('shortcut-key', [entry.get_text()]);
        });
        generalGroup.add(shortcutRow);

        const pathRow = new Adw.EntryRow({
            title: 'Имя файла записи (относительно домашней папки или абсолютный путь)',
            text: settings.get_string('save-path')
        });
        pathRow.connect('changed', (entry) => {
            settings.set_string('save-path', entry.get_text());
        });
        generalGroup.add(pathRow);

        const notificationRow = new Adw.SwitchRow({
            title: 'Показывать уведомления',
            subtitle: 'Показывать всплывающее уведомление после успешного копирования в буфер обмена'
        });
        settings.bind('show-notification', notificationRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        generalGroup.add(notificationRow);

        const whisperGroup = new Adw.PreferencesGroup({
            title: 'Настройки Whisper Server',
        });
        page.add(whisperGroup);

        const autostartRow = new Adw.SwitchRow({
            title: 'Автоматический запуск сервера',
            subtitle: 'Запускать локальный whisper-server при активации расширения'
        });
        settings.bind('whisper-autostart', autostartRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        whisperGroup.add(autostartRow);

        const binRow = new Adw.EntryRow({
            title: 'Путь к бинарнику whisper-server',
            text: settings.get_string('whisper-server-bin')
        });
        binRow.connect('changed', (entry) => {
            settings.set_string('whisper-server-bin', entry.get_text());
        });
        whisperGroup.add(binRow);

        const modelRow = new Adw.EntryRow({
            title: 'Путь к GGML модели (.bin)',
            text: settings.get_string('whisper-model-path')
        });
        modelRow.connect('changed', (entry) => {
            settings.set_string('whisper-model-path', entry.get_text());
        });
        whisperGroup.add(modelRow);

        const langRow = new Adw.EntryRow({
            title: 'Язык распознавания (например, ru, en, или auto для автоопределения)',
            text: settings.get_string('whisper-language')
        });
        langRow.connect('changed', (entry) => {
            settings.set_string('whisper-language', entry.get_text());
        });
        whisperGroup.add(langRow);

        const portRow = new Adw.SpinRow({
            title: 'Порт сервера',
            subtitle: 'Порт, на котором будет запущен whisper-server (при занятости выберется свободный)',
            adjustment: new Gtk.Adjustment({
                lower: 1024,
                upper: 65535,
                step_increment: 1
            })
        });
        settings.bind('whisper-port', portRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        whisperGroup.add(portRow);

        const threadsRow = new Adw.SpinRow({
            title: 'Количество потоков CPU',
            subtitle: 'Потоки процессора для вычислений',
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 64,
                step_increment: 1
            })
        });
        settings.bind('whisper-threads', threadsRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        whisperGroup.add(threadsRow);
    }
}
