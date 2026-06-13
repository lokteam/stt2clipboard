---
name: gnome-shell-extensions-gjs
description: GNOME Shell extension development with GJS for system settings and preferences integration. Use when building extension UI components, creating panel indicators, implementing preferences windows, or integrating with GNOME system settings using GJS API.
---

# GNOME Shell Extensions with GJS

Build GNOME Shell extensions with system settings and preferences integration using GJS.

## When to Apply

- Creating panel indicators and system status widgets
- Building extension preferences windows with Adwaita widgets
- Integrating with GNOME system settings through GSettings
- Implementing system calls and GNOME API interactions

## Critical Rules

**Schema ID Convention**: Extension schemas must use `org.gnome.shell.extensions.{extension-name}` base ID

```xml
<!-- WRONG - invalid base ID -->
<schema id="com.example.myextension">

<!-- RIGHT - follows GNOME extension schema naming -->
<schema id="org.gnome.shell.extensions.my-extension" 
        path="/org/gnome/shell/extensions/my-extension/">
```

**Settings Binding**: Always use `getSettings()` from Extension class, not manual Gio.Settings construction

```js
// WRONG - manual schema specification
this._settings = new Gio.Settings({schema_id: 'org.gnome.shell.extensions.example'});

// RIGHT - use Extension's getSettings()
this._settings = this.getSettings();
```

**Panel Button Position**: Use `Main.panel.addToStatusArea()` with extension UUID for proper cleanup

```js
// WRONG - direct panel manipulation
Main.panel._rightBox.insert_child_at_index(this._indicator, 0);

// RIGHT - use addToStatusArea with UUID
Main.panel.addToStatusArea(this.uuid, this._indicator);
```

## Key Patterns

### Extension Main Class

```js
import Gio from 'gi://Gio';
import St from 'gi://St';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

export default class MyExtension extends Extension {
    enable() {
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
        
        const icon = new St.Icon({
            icon_name: 'preferences-system-symbolic',
            style_class: 'system-status-icon',
        });
        this._indicator.add_child(icon);
        
        Main.panel.addToStatusArea(this.uuid, this._indicator);
        
        this._settings = this.getSettings();
        this._settings.bind('show-indicator', this._indicator, 'visible',
            Gio.SettingsBindFlags.DEFAULT);
    }
    
    disable() {
        this._indicator?.destroy();
        this._indicator = null;
        this._settings = null;
    }
}
```

### GSettings Schema Definition

```xml
<?xml version="1.0" encoding="UTF-8"?>
<schemalist>
  <schema id="org.gnome.shell.extensions.my-extension" 
          path="/org/gnome/shell/extensions/my-extension/">
    <key name="show-indicator" type="b">
      <default>true</default>
      <summary>Show panel indicator</summary>
    </key>
    <key name="update-interval" type="i">
      <default>30</default>
      <summary>Update interval in seconds</summary>
    </key>
  </schema>
</schemalist>
```

### Preferences Window with Adwaita

```js
import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class MyPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'preferences-system-symbolic',
        });
        
        const group = new Adw.PreferencesGroup({
            title: _('Appearance'),
            description: _('Configure extension appearance'),
        });
        page.add(group);
        
        const showIndicator = new Adw.SwitchRow({
            title: _('Show Panel Indicator'),
            subtitle: _('Display icon in system panel'),
        });
        group.add(showIndicator);
        
        const updateInterval = new Adw.SpinRow({
            title: _('Update Interval'),
            subtitle: _('Seconds between updates'),
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 300,
                step_increment: 1
            })
        });
        group.add(updateInterval);
        
        window.add(page);
        
        const settings = this.getSettings();
        settings.bind('show-indicator', showIndicator, 'active',
            Gio.SettingsBindFlags.DEFAULT);
        settings.bind('update-interval', updateInterval, 'value',
            Gio.SettingsBindFlags.DEFAULT);
    }
}
```

### System Integration with Meta API

```js
import Meta from 'gi://Meta';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

// Window management
const windows = Meta.get_window_actors();
const workspace = Meta.WorkspaceManager.get_default().get_active_workspace();

// Monitor system preferences
const prefChangedId = Meta.prefs_add_listener((pref) => {
    if (pref === Meta.Preference.DYNAMIC_WORKSPACES) {
        console.log('Dynamic workspaces preference changed');
    }
});

// Clean up in disable()
Meta.prefs_remove_listener(prefChangedId);
```

## Common Mistakes

- **Missing schema file**: Extensions won't load without corresponding `.gschema.xml` file
- **Incorrect schema path**: Path must match `/org/gnome/shell/extensions/{extension-name}/`
- **Settings not bound**: UI changes won't persist without `settings.bind()` calls
- **Incomplete cleanup**: Always destroy panel indicators and disconnect signals in `disable()`
- **Using wrong gettext domain**: Extensions should use their own translation domain, not system ones