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


class Indicator {
    
    constructor(ext) {
        this.ext = ext
        this.visible = false
        this.timerId = null;
        this.proc = null;
    }

    show() {
        this.visible = true
        this.ext._indicator = new PanelMenu.Button(0.0, this.ext.metadata.name, false);

        // Создаем контейнер, чтобы положить в него и таймер, и иконку
        this.box = new St.BoxLayout({ style_class: 'panel-status-indicators-box' });

        // Таймер (пока с пустым текстом)
        this.timerLabel = new St.Label({
            text: '00:00',
            y_align: Clutter.ActorAlign.CENTER // Центрируем по вертикали
        });

        // Иконка микрофона
        this.icon = new St.Icon({
            icon_name: 'audio-input-microphone-symbolic',
            style_class: 'system-status-icon',
        });

        // Собираем всё вместе
        this.box.add_child(this.timerLabel);
        this.box.add_child(this.icon);
        this.ext._indicator.add_child(this.box);

        // Обрабатываем нажатие на саму кнопку индикатора (останавливаем всё)
        this.ext._indicator.connect('button-press-event', () => {
            this.hide();
        });

        // Add the indicator to the panel
        Main.panel.addToStatusArea(this.ext.uuid, this.ext._indicator);

        // Сразу запускаем запись и таймер
        this.startRecording();
    }

    hide() {
        this.stopRecording();
        this.visible = false
        this.ext._indicator?.destroy();
        this.ext._indicator = null;
    }

    startRecording() {
        // 1. Делаем красный цвет для иконки и таймера
        this.icon.add_style_class_name('stt-recording-icon');
        this.timerLabel.add_style_class_name('stt-timer-label');

        // 2. Запускаем таймер
        this.startTime = GLib.get_monotonic_time();
        this.updateTimer(); // Первый вызов сразу, чтобы не ждать секунду
        this.timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
            this.updateTimer();
            return GLib.SOURCE_CONTINUE;
        });

        // 3. Запускаем нативный GStreamer для записи в файл
        let savePath = this.ext.settings.get_string('save-path');
        // Если путь начинается со слеша - значит он абсолютный, берем как есть. 
        // Иначе - подставляем домашнюю папку пользователя
        let filePath = savePath.startsWith('/') ? savePath : GLib.get_home_dir() + '/' + savePath;
        
        try {
            Gst.init(null);
            // Создаем пайплайн: захват микрофона -> конвертация -> упаковка в WAV -> запись в файл
            let pipelineStr = `autoaudiosrc ! audioconvert ! wavenc ! filesink location=${filePath}`;
            this.pipeline = Gst.parse_launch(pipelineStr);
            this.pipeline.set_state(Gst.State.PLAYING);
            console.log("Запись началась через GStreamer в файл: " + filePath);
        } catch (e) {
            console.error("Ошибка запуска GStreamer: ", e);
        }
    }

    updateTimer() {
        // Считаем разницу во времени
        let now = GLib.get_monotonic_time();
        let diffSeconds = Math.floor((now - this.startTime) / 1000000); // Переводим микросекунды в секунды

        // Форматируем минуты и секунды с нулями впереди (MM:SS)
        let mins = Math.floor(diffSeconds / 60).toString().padStart(2, '0');
        let secs = (diffSeconds % 60).toString().padStart(2, '0');
        
        this.timerLabel.set_text(`${mins}:${secs}`);
    }

    stopRecording() {
        // 1. Убиваем таймер
        if (this.timerId) {
            GLib.source_remove(this.timerId);
            this.timerId = null;
        }

        // 2. Останавливаем процесс записи GStreamer
        if (this.pipeline) {
            // Посылаем End Of Stream (EOS), чтобы файл WAV корректно закрылся (записались заголовки с длиной)
            this.pipeline.send_event(Gst.Event.new_eos());
            
            // Даем полсекунды на то, чтобы GStreamer успел сбросить буфер на диск и закрыть файл, затем гасим пайплайн
            GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
                if (this.pipeline) {
                    this.pipeline.set_state(Gst.State.NULL);
                    this.pipeline = null;
                }
                return GLib.SOURCE_REMOVE;
            });
            console.log("Запись остановлена (GStreamer)");
        }
    }
}


export default class ExampleExtension extends Extension {
    enable() {
        this.indicatorObj = new Indicator(this);
        // this.indicatorObj.show(); // Можно убрать автопоказ при старте, если хотим показывать только по F9

        // 1. Получаем настройки нашего расширения
        this.settings = this.getSettings('org.gnome.shell.extensions.stt2clipboard');

        // 2. Добавляем биндинг клавиши (у нас в схеме прописана F9)
        Main.wm.addKeybinding(
            'shortcut-key', // имя ключа в файле настроек
            this.settings,
            Meta.KeyBindingFlags.NONE,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
            () => {
                // Это тот самый handler (функция), который срабатывает при нажатии F9.
                // Давай сделаем так: если микрофон не виден - показываем, если виден - прячем.
                if (!this.indicatorObj.visible) {
                    this.indicatorObj.show();
                } else {
                    this.indicatorObj.hide();
                }
            }
        );
    }

    disable() {
        if (this.indicatorObj) {
            this.indicatorObj.hide();
            this.indicatorObj = null;
        }

        // Обязательно удаляем биндинг при отключении расширения!
        Main.wm.removeKeybinding('shortcut-key');
        
        this.settings = null;
    }
}