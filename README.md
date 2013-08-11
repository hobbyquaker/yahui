# yahui

"yet another homematic user interface"

yahui ist eine weitere jQuery Mobile basierte alternative Weboberfläche (Funktionsumfang ähnlich WebMatic) für die HomeMatic CCU.
Yahui verwendet die Software "CCU.IO" um mit der CCU zu kommunizieren und kann sich dadurch folgende Vorteile zu nutze machen:
  * Wesentlich schnellere Ladezeit, yahui startet quasi "instant" und zeigt sofort alle Werte an.
  * Statusänderungen werden nicht (wie z.B. bei WebMatic) in Intervallen von der CCU abgefragt ("Polling") sondern von der
  CCU via CCU.IO an yahui gesendet (Push-Prinzip). Dies reduziert die Belastung der CCU erheblich und Statusänderungen werden
  mit geringerer Latenz angezeigt.
  * Egal wieviele Instanzen von yahui oder DashUI gleichzeitig geöffnet sind - die Belastung für die CCU bleibt gleich gering
  (CCU.IO fungiert hier quasi als Proxy)


## Installation

yahui setzt eine funktionierende ccu.io-installation vorraus. Um yahui zu installieren genügt es dann den gesamten Ordner
yahui aus [diesem Zip-File](https://github.com/hobbyquaker/yahui/archive/master.zip) in den Ordner www/ der ccu.io-Installation
zu kopieren.


## Konfiguration

### Einbinden eigener Bilder/Icons

Bilder/Icons können einfach via Drag&Drop hochgeladen werden. Dazu muss sich yahui im "Edit-Modus" befinden (über
http://.../yahui/?edit aufrufen). Es sind alle arten von Bilddateien erlaubt, empfohlen wird jedoch ein quadratisches
Format mit 230x230 Pixel Größe.

### Sortierung der Elemente

Sortieren ist im Edit-Modus ebenfalls via Drag&Drop möglich.

### Hinzufügen von Links zur Link-Seite

## Roadmap/ToDo

### 1.0

  * Variablen Editieren (falls nicht "Webmatic-Style" Readonly-Flag gesetzt ist)
  * Programme starten
  * Sortierung speichern
  * Link-Seite implementieren
  * Widgets: SHUTTER, SHUTTER_CONTACT, ROTARY_HANDLE_SENSOR, WEATHER, CLIMATECONTROL_REGULATOR, CLIMATECONTROL_VENT_DRIVE, SENSOR


### 1.1

  * Service-Meldungen und Alarme?
  * neue und verbesserte Widgets
  * Timestamps oder vergangene Zeit anzeigen?

## Lizenz / Copyright

Copyright (c) 2013 hobbyquaker http://hobbyquaker.github.io
Lizenz: CC BY-NC 3.0

Sie dürfen:

das Werk bzw. den Inhalt vervielfältigen, verbreiten und öffentlich zugänglich machen
Abwandlungen und Bearbeitungen des Werkes bzw. Inhaltes anfertigen
Zu den folgenden Bedingungen:

Namensnennung - Sie müssen den Namen des Autors/Rechteinhabers in der von ihm festgelegten Weise nennen.
Keine kommerzielle Nutzung ? Dieses Werk bzw. dieser Inhalt darf nicht für kommerzielle Zwecke verwendet werden.
Wobei gilt:

Verzichtserklärung - Jede der vorgenannten Bedingungen kann aufgehoben werden, sofern Sie die ausdrückliche Einwilligung des Rechteinhabers dazu erhalten.
Die Veröffentlichung dieser Software erfolgt in der Hoffnung, daß sie Ihnen von Nutzen sein wird, aber OHNE IRGENDEINE GARANTIE, sogar ohne die implizite Garantie der MARKTREIFE oder der VERWENDBARKEIT FÜR EINEN BESTIMMTEN ZWECK.

Die Nutzung dieser Software erfolgt auf eigenes Risiko!