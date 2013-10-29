# yahui

"yet another homematic user interface"

aktuelle Version: 1.1.3

yahui ist eine weitere jQuery Mobile basierte alternative Weboberfläche (ähnlich WebMatic) für die HomeMatic CCU und
ist für die Bedienung auf Tablets und Smartphones optimiert.

yahui verwendet die Software [CCU.IO](https://github.com/hobbyquaker/ccu.io) um mit der CCU zu kommunizieren und kann sich dadurch folgende Vorteile zu Nutze machen:
  * Wesentlich schnellere Ladezeit, yahui startet quasi "instant" und zeigt sofort alle Werte an.
  * Statusänderungen werden nicht in Intervallen von der CCU abgefragt ("Polling") sondern von der
  CCU via CCU.IO an yahui gesendet (Push-Prinzip). Dies reduziert die Belastung der CCU erheblich und Statusänderungen werden
  mit geringerer Latenz angezeigt.
  * Egal wieviele Instanzen von yahui oder DashUI gleichzeitig geöffnet sind - die Belastung für die CCU bleibt gleich gering
  (CCU.IO fungiert hier quasi als Proxy)


## Dokumentation

### Voraussetzungen

* yahui setzt eine funktionierende [CCU.IO](https://github.com/hobbyquaker/ccu.io)-Installation voraus.
* yahui benötigt einen modernen Browser (Chrome/Chromium/Iron, Firefox und Safari).


### Installation

Um yahui zu installieren genügt es das gesamte Verzeichnis
yahui aus [diesem Zip-File](https://github.com/hobbyquaker/yahui/archive/master.zip) in den Ordner www/ der ccu.io-Installation
zu kopieren und die Datei settings-dist.js (zu finden im Unterordner "js") in settings.js umzubenennen.

yahui ist sobald [CCU.IO](https://github.com/hobbyquaker/ccu.io) bereit ist unter http://ccu-io-host:ccu-io-port/yahui erreichbar.

### Favoriten

Es werden nur Favoriten angezeigt die dem Benutzer "admin" zugeordnet sind.

### Systemvariablen nur Anzeigen

Systemvariablen können in yahui bearbeitet werden. Wie bei WebMatic können Systemvariablen über ein (r) in der
Variablenbeschreibung auf nur-lesen gesetzt werden.

### Einbinden eigener Bilder/Icons

Bilder/Icons können einfach via Drag&Drop hochgeladen werden. Dazu muss sich yahui im "Edit-Modus" befinden (im
Info-Dialog - erreichbar über den i-Button oben rechts - kann der Edit-Modus aktiviert und deaktiviert werden).
Es sind alle Arten von Bilddateien erlaubt, empfohlen wird jedoch ein quadratisches PNG mit 230x230 Pixel Größe und
leichter Transparenz. Wenn bereits Bilder von WebMatic vorhanden sind können diese einfach in das Verzeichnis
yahui/images/user/ kopiert werden.

### Sortierung der Elemente

Sortieren ist im Edit-Modus ebenfalls via Drag&Drop möglich.

### Umbenennen von Elementen

Im Edit-Modus einfach auf einen Namen klicken.

### Ändern der Farben und des Layouts

in der Datei settings.js ist es möglich für die Kopfzeile, den Inhalt und das Menü unten getrennt aus 5
vorgeingestellten Farb-Schemata zu wählen. Wer den Look darüber hinaus customizen will kann sich via
http://jquerymobile.com/themeroller/index.php ein Theme "zusammenklicken". In Zeile 25 der Datei index.html muss dann
die URL der jqueryMobile CSS-Datei entsprechend auf die mit dem Theme-Roller erstellte Datei angepasst werden.

Eigene Style-Angaben zum Anpassen des Layouts können in der Datei yahui/css/user.css vorgenommen werden. In der Datei
user-dist.css ist ein passendes Grundgerüst angelegt, diese einfach umbenennen und die Kommentarzeichen in index.html
Zeile 32 entfernen.

### Hinzufügen von Erweiterungen

Wenn man sich im Edit-Modus befindet kann über den Button "hinzufügen" oben links eine neue Erweiterung angelegt werden.
Zum bearbeiten oder löschen von Erweiterungen einfach im Edit-Modus die Erweiterung anklicken.

### Ausblenden bestimmter Datenpunkte

In der Datei settings.js können Datenpunkte angegeben werden die nicht angezeigt werden sollen.

### Voranstellen eines "Prefix" vor den Seitentitel

In der settings.js besteht die Möglichkeit einen Prefix anzugeben der vor jeden Seitentitel gesetzt wird.

## ToDo/Roadmap

  * Service-Meldungen (Anzeige je Raum/Gewerk)
  * Anzeige aktive Alarme?
  * Liste aller Service-Meldungen mit Möglichkeit zum bestätigen unter Erweiterungen?
  * umbenennen von PRESS_SHORT und PRESS_LONG Buttons, wahlweises ausblenden von PRESS_LONG
  * vergangene Zeit statt Zeitpunkt anzeigen? Über settings.js konfigurierbar?
  * Widget Winmatic
  * Widget Kapazitiver Füllstandsmesser
  * Click-Handler-Initialisierung: passender Event statt setTimeout?
  * Zustandsabhängige Bilder/Icons
  * js/css kombiniert und minifiziert ausliefern

## Changelog

### 1.1.3
 * (Hobbyquaker) Anzeige Anzahl Service-Meldungen je Favorit/Raum/Gewerk (in settings.js abschaltbar)
 * (Hobbyquaker) Bugfix Datum/Zeit Formatierung

### 1.1.2
  * (Anli) Button und Dialog zum Element-Namen editieren statt inline-editing
  * (Hobbyquaker) Bugfix Datum/Zeit Formatierung
  * (Hobbyquaker) neue Option in settings.js dateSinceType - Anzeige von Zeitpunkt, Zeitraum oder gar nichts

### 1.1.1
  * (Hobbyquaker) Bugfix: Fehler wenn kein letztes Änderungsdatum vorhanden ist

### 1.1.0
  * (Anli) Änderbarkeit von Variablen in Variablenliste wenn (r) in Beschreibung einstellbar
  * (Anli) Ausgabe des Datumsformat angepasst, so dass das Datum in der auf dem Gerät eingestellten Format ausgegeben wird (toLocaleString()) statt in yyyy-MM-dd HH:mm:ss
  * (Anli) yahui.js und yahui-edit.js angepasst, so dass es möglich ist, yahui auch in einem Unterordner unter www oder mit einem anderen Namen als yahui zu betreiben
  * (Anli) Aliase für Kanal-, Variablen und Programm-Namen können im Edit-Modus vergeben werden
  * (Hobbyquaker) user.css hinzugefügt
  * (Hobbyquaker) Fallunterscheidung bei Kanal-Typ WEATHER für OC3
  * (Hobbyquaker) Kanaltyp SMOKE_DETECTOR hinzugefügt
  * (Hobbyquaker) Prüfung der CCU.IO Version und gegebenenfalls Warning
  * (Hobbyquaker) Anzeige von Service-Meldungen gefixt (setzt CCU.IO >= 0.9.63 voraus)

### 1.0.14
  * (Hobbyquaker) Style-Korrektur: bei Darstellung von Einheiten Zeilenumbruch verhindert
  * (Hobbyquaker) Bugfix: Editierbare Variablen mit ValueType=16 und ValueSubType=0 richtig darstellen

### 1.0.13
  * (Hobbyquaker) Bugfix: Update des CONTROL_MODE Datenpunkts bei den neuen Heizungsthermostaten
  * (Hobbyquaker) Bugfix: Setzen des Modus und der Temperatur bei den neuen Heizungsthermostaten

### 1.0.12
  * (Hobbyquaker) Bugfix: u.U. wurden Erweiterungen doppelt angezeigt


### 1.0.11
  * (Hobbyquaker) Bugfix: Slider sind nur noch auf 0/1 gesprungen seit ValueUnit 100% verarbeitet wurde

### 1.0.10
  * (Hobbyquaker) Bugfix: u.U. wurden Erweiterungen mehrfach angezeigt

### 1.0.9
  * (Hobbyquaker) Seiten-Titel-Prefix in settings.js verlagert und an fehlenden Stellen ergänzt
  * (Hobbyquaker) Bugfixes

### 1.0.8
  * (Hobbyquaker) Default-Icons nun nach Gerätetyp
  * (Hobbyquaker) Bugfixes

### 1.0.7
  * (Hobbyquaker) Default-Icons für Thermostat, Ventiltrieb, Regendetektor, Drehgriffkontakt und Tür/Fensterkontakt hinzugefügt

### 1.0.6
  * (Hobbyquaker) Unterstützung für den neuen Heizkörperthermostat (HM-CC-RT-DN)
  * (Hobbyquaker) Anzeige der installierten CCU.IO-Version im Info-Dialog
  * (Hobbyquaker) Bugfixes

### 1.0.5
  * (Hobbyquaker) Bugfixes

### 1.0.4
  * (Hobbyquaker) Anzeige von Letzte-Änderung-Timestamp statt Aktualisierungs-Timestamp

### 1.0.3
  * (Bluefox) neue Option in settings um (VIRTUAL_)KEY grundsätzlich auszublenden
  * (Bluefox) KEYMATIC Bugfixes

### 1.0.2
  * Fehler behoben beim Laden von setting.js

### 1.0.1
  * Unterstützung für Kanaltypen DIGITAL_OUTPUT, DIGITAL_ANALOG_OUTPUT und DIGITAL_INPUT (Wired 12/14 Modul)
  * Anpassung an iPhone 5 Bildformat
  * iOS WebApp Splashscreen

### 1.0.0
  * WebApp Icon und "Add-to-Homescreen-Bubble" hinzugefügt
  * Auslieferung nun mit settings-dist.js damit settings bei Updates nicht überschreiben werden.

### 0.9.25
  * Workaround für Encoding-Problem bei ° Zeichen in Verbindung mit "RCU" auch auf CLIMATECONTROL_REGULATOR SETPOINT angewendet

### 0.9.24
  * Anzeige aller Datenpunkte des CUxD WEATHER Kanal 1
  * Möglichkeit bestimmte Datenpunkte auszublenden (settings.js)
  * Workaround für Encoding-Problem bei ° Zeichen in Verbindung mit "RCU" (CCU2 Firmware auf RaspberryPi)
  * Keymatic Unterstützung
  * Neue Attribute data-hm-true und data-hm-false für Texte bei STATE-Anzeige (bei KEYMATIC und CUxD Thermostat-Wrapper-Device genutzt)
  * Wenn PopUp "Verbindung zu CCU.IO unterbrochen" erscheint Scrolling unterbunden
  * Style-Anpassungen für dunkles Farbschema

### 0.9.23
  * Anzeige von Alarm-Variablen

### 0.9.22
  * Fehler beim Versuch nicht vorhandene Widget-Objekte zu rendern abgefangen.

### 0.9.21
  * Automatischer Reload nach reconnect
  * Fehler behoben - Darstellung von nicht mehr vorhandenen Menüs/Widgets unterbunden (wenn noch in sortOrder vorhanden)

### 0.9.20
  * Fehler behoben im Fall dass keine Favoriten angelegt sind

### 0.9.19
  * Kanaltyp RAINDETECTOR_HEAT ergänzt

### 0.9.18
  * indexOf() durch jQuery.inArray() ersetzt zwecks Internet Explorer 8 Kompatibilität

### 0.9.17
  * Bugfixes WEATHER und CLIMATE_CONTROL_REGULATOR
  * diverse console.log entfernt

### 0.9.16
  * CUxD Thermostat Wrapper
  * Popup falls Verbindung zu CCU.IO unterbrochen ist

### 0.9.15
  * Fehler behoben Erweiterungen->Variablen/Programme Link Target

### 0.9.14
  * Fehler behoben bei Darstellung der Erweiterungen

### 0.9.13
  * diverse console.log entfernt

### 0.9.12
  * Style-Anpassung iFrame Höhe, nutzt CSS3 calc() - funktioniert nur auf modernen Browsern

### 0.9.11
  * Fehler behoben bei Auswahl Erweiterung als iFrame oder in neuem Fenster öffnen

### 0.9.10
  * Fehler behoben beim Update von booleschen Variablen

### 0.9.9
  * (VIRTUAL_)KEY PRESS_LONG/PRESS_SHORT implementiert

### 0.9.8
  * Fehlerkorrektur Layout/Style für kleine Auflösungen
  * Variablen unter Erweiterungen->Variablen sind nun grundsätzlich editierbar (auch wenn (r) Flag gesetzt ist) (auf Wunsch
  von Pix)
  * Links können nun via GUI hinzugefügt, bearbeitet und gelöscht werden
  * Variablen und Programme unter Erweiterungen sind nun alphabetisch sortiert (auf Wunsch von Rascal)

### 0.9.7
  * Neue Kanaltypen unterstützt: ALARMACTUATOR, RAINDETECTOR, SENSOR_FOR_CARBON_DIOXIDE, TILT_SENSOR, WATERDETECTIONSENSOR
  * Fehler behoben der dazu führen konnte das keine Darstellung von Geräten mehr erfolgt ist. (Danke Rascal)
  * Layout/Style-Anpassungen für kleine Auflösungen (Danke Pix)

### 0.9.6
  * Konfiguration möglich über js/settings.js
  * Info-Button kann via settings.js ausgeblendet werden
  * aktiver Edit-Modus wird nun in der Kopfzeile angezeigt.
  * "Swatches" (Farb-Schemata) für Kopfzeile, Inhalt und Menü können via settings.js getrennt konfiguriert werden
  * Vorbereitung für Verwaltung der "Erweiterungen" via GUI, noch unfertig

### 0.9.5
  * Rollladen Widget Fehler behoben
  * Speichern der Sortier-Reihenfolge Fehler behoben
  * visualisierung der UNREACH Servicemeldung

### 0.9.4
  * Erweiterungen per iFrame (yr.no und CUxD-Highcharts als Beispiel konfiguriert)
  * DIRECTION bzw. WORKING Datenpunkte von Dimmern und Rollläden werden dargestellt
  * LOWBAT visualisierung Fehler behoben
  * Kleine Bugfixes und Styleanpassungen

### 0.9.3

  * neue Widgets: WEATHER, CLIMATECONTROL_VENT_DRIVE, CLIMATE_CONTROL_REGULATOR, SMOKE_DETECTOR_TEAM
  * WINDOW_SWITCH_RECEIVER ausgeblendet
  * Links in "Erweiterungen" umbenannt
  * Neue Seiten Variablen und Programme unter Erweiterungen

### 0.9.2

  * neue Widgets: SHUTTER_CONTACT, ROTARY_HANDLE_SENSOR, MOTION_DETECTOR
  * Style-Anpassungen
  * Fehler behoben bei Variablentyp Werteliste
  * LOWBAT Meldung wird als leere-Batterie-Icon angezeigt


## In yahui verwendete Software

  * [jQuery](http://jquery.com/)
  * [jQuery Mobile](http://jquerymobile.com/)
  * [Add to Home Screen](http://cubiq.org/add-to-home-screen)

## Lizenz / Copyright

Copyright (c) 2013 hobbyquaker http://hobbyquaker.github.io

Lizenz: [CC BY-NC 3.0](http://creativecommons.org/licenses/by-nc/3.0/de/)

Sie dürfen das Werk bzw. den Inhalt vervielfältigen, verbreiten und öffentlich zugänglich machen,
Abwandlungen und Bearbeitungen des Werkes bzw. Inhaltes anfertigen zu den folgenden Bedingungen:
  * **Namensnennung** - Sie müssen den Namen des Autors/Rechteinhabers in der von ihm festgelegten Weise nennen.
  * **Keine kommerzielle Nutzung** - Dieses Werk bzw. dieser Inhalt darf nicht für kommerzielle Zwecke verwendet werden.

Wobei gilt:   
Verzichtserklärung - Jede der vorgenannten Bedingungen kann aufgehoben werden, sofern Sie die ausdrückliche Einwilligung des Rechteinhabers dazu erhalten.

Die Veröffentlichung dieser Software erfolgt in der Hoffnung, daß sie Ihnen von Nutzen sein wird, aber OHNE IRGENDEINE GARANTIE, sogar ohne die implizite Garantie der MARKTREIFE oder der VERWENDBARKEIT FÜR EINEN BESTIMMTEN ZWECK. Die Nutzung dieser Software erfolgt auf eigenes Risiko!
