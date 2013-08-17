# yahui

"yet another homematic user interface"

yahui ist eine weitere jQuery Mobile basierte alternative Weboberfläche (ähnlich WebMatic) für die HomeMatic CCU.

yahui verwendet die Software [CCU.IO](https://github.com/hobbyquaker/ccu.io) um mit der CCU zu kommunizieren und kann sich dadurch folgende Vorteile zu Nutze machen:
  * Wesentlich schnellere Ladezeit, yahui startet quasi "instant" und zeigt sofort alle Werte an.
  * Statusänderungen werden nicht (wie z.B. bei WebMatic) in Intervallen von der CCU abgefragt ("Polling") sondern von der
  CCU via CCU.IO an yahui gesendet (Push-Prinzip). Dies reduziert die Belastung der CCU erheblich und Statusänderungen werden
  mit geringerer Latenz angezeigt.
  * Egal wieviele Instanzen von yahui oder DashUI gleichzeitig geöffnet sind - die Belastung für die CCU bleibt gleich gering
  (CCU.IO fungiert hier quasi als Proxy)


## Installation

yahui setzt eine funktionierende ccu.io-installation vorraus. Um yahui zu installieren genügt es dann das gesamte Verzeichnis
yahui aus [diesem Zip-File](https://github.com/hobbyquaker/yahui/archive/master.zip) in den Ordner www/ der ccu.io-Installation
zu kopieren.

## Bedienung

yahui ist sobald CCU.IO bereit ist unter http://ccu-io-host:ccu-io-port/yahui erreichbar.

### Systemvariablen nur Anzeigen

Systemvariablen können in yahui bearbeitet werden. Wie bei WebMatic können Systemvariablen über ein (r) in der
Variablenbeschreibung auf nur-lesen gesetzt werden.

### Einbinden eigener Bilder/Icons

Bilder/Icons können einfach via Drag&Drop hochgeladen werden. Dazu muss sich yahui im "Edit-Modus" befinden (über
http://ccu-io-host:ccu-io-port/yahui/?edit aufrufen). Es sind alle Arten von Bilddateien erlaubt, empfohlen wird jedoch
ein quadratisches PNG mit 230x230 Pixel Größe und leichter Transparenz. Wenn bereits Bilder von WebMatic vorhanden
sind können diese einfach in das Verzeichnis yahui/images/user/ kopiert werden.

### Sortierung der Elemente

Sortieren ist im Edit-Modus ebenfalls via Drag&Drop möglich.

### Hinzufügen von Links zur Link-Seite

zur Zeit muss man dazu leider noch etwas unkomfortabel in yahui/js/yahui.js editieren...

## Changelog

### 0.9.2

  * neue Widgets: SHUTTER_CONTACT, ROTARY_HANDLE_SENSOR, MOTION_DETECTOR
  * Style-Anpassungen
  * Fehler behoben bei Variablentyp Werteliste
  * LOWBAT Meldung wird als leere-Batterie-Icon angezeigt

## ToDo

  * neuer Reiter Variablen
  * "inline" Anzeige von Links

Fehlende Widgets ergänzen:

  * WEATHER
  * CLIMATECONTROL_REGULATOR
  * CLIMATECONTROL_VENT_DRIVE
  * ... ?

Später

  * Links hinzufügen etc komfortabler gestalten
  * Service-Meldungen und Alarme?
  * Timestamps oder vergangene Zeit anzeigen?


## Lizenz / Copyright

Copyright (c) 2013 hobbyquaker http://hobbyquaker.github.io

Lizenz: [CC BY-NC 3.0](http://creativecommons.org/licenses/by-nc/3.0/de/)

Sie dürfen das Werk bzw. den Inhalt vervielfältigen, verbreiten und öffentlich zugänglich machen,
Abwandlungen und Bearbeitungen des Werkes bzw. Inhaltes anfertigen zu den folgenden Bedingungen:
  * Namensnennung - Sie müssen den Namen des Autors/Rechteinhabers in der von ihm festgelegten Weise nennen.
  * Keine kommerzielle Nutzung - Dieses Werk bzw. dieser Inhalt darf nicht für kommerzielle Zwecke verwendet werden.

Wobei gilt:   
Verzichtserklärung - Jede der vorgenannten Bedingungen kann aufgehoben werden, sofern Sie die ausdrückliche Einwilligung des Rechteinhabers dazu erhalten.

Die Veröffentlichung dieser Software erfolgt in der Hoffnung, daß sie Ihnen von Nutzen sein wird, aber OHNE IRGENDEINE GARANTIE, sogar ohne die implizite Garantie der MARKTREIFE oder der VERWENDBARKEIT FÜR EINEN BESTIMMTEN ZWECK. Die Nutzung dieser Software erfolgt auf eigenes Risiko!
