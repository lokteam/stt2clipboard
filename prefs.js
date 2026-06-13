import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class Stt2ClipboardPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings('org.gnome.shell.extensions.stt2clipboard');

        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: 'Основные настройки',
        });
        page.add(group);
        
        // 1. Поле для настройки пути сохранения
        const pathRow = new Adw.EntryRow({
            title: 'Имя файла или путь для сохранения',
            text: settings.get_string('save-path')
        });
        pathRow.connect('changed', (entry) => {
            settings.set_string('save-path', entry.get_text());
        });
        group.add(pathRow);

        // 2. Поле для настройки горячей клавиши
        const shortcutRow = new Adw.EntryRow({
            title: 'Горячая клавиша (например: F9, <Super>R, <Ctrl><Alt>R)',
            text: settings.get_strv('shortcut-key')[0] || ''
        });
        shortcutRow.connect('changed', (entry) => {
            // Горячие клавиши в GNOME хранятся как массив строк, поэтому оборачиваем в []
            settings.set_strv('shortcut-key', [entry.get_text()]);
        });
        group.add(shortcutRow);
        
        window.add(page);
    }
}
