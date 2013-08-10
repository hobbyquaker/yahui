# yahui 0.6

"yet another homematic user interface"

yahui ist eine weitere jQuery Mobile basierte alternative Weboberfl�che (vergleichbar mit WebMatic) f�r die HomeMatic CCU.
Yahui verwendet die Software "CCU.IO" um mit der CCU zu kommunizieren und kann sich dadurch folgende Vorteile zu nutze machen:
  * Wesentlich schnellere Ladezeit, yahui startet quasi "instant" und zeigt sofort alle Werte an.
  * Status�nderungen werden nicht in Intervallen von der CCU abgefragt ("Polling") sondern via Websocket-Verbindung von
  CCU.IO an yahui gesendet (Push-Prinzip). Dies reduziert die Belastung der CCU erheblich und Status�nderungen werden mit
  geringerer Latenz angezeigt.
  * Egal wieviele Instanzen von yahui oder DashUI ge�ffnet sind - die Belastung f�r die CCU bleibt gleich gering (CCU.IO
  fungiert hier quasi als Proxy)


## Installation

yahui setzt eine funktionierende ccu.io-installation vorraus. Um yahui zu installieren gen�gt es dann den gesamten Ordner
yahui aus diesem Zip-File in den Ordner ccu.io/www/ zu kopieren.


## Konfiguration

### Einbinden eigener Bilder/Icons

Bilder/Icons k�nnen einfach via Drag&Drop hochgeladen werden. Dazu muss sich yahui im "Edit-Modus" befinden (�ber
http://.../yahui/?edit aufrufen). Es sind alle arten von Bilddateien erlaubt, empfohlen wird jedoch ein quadratisches
Format mit 230x230 Pixel Gr��e.

### Sortierung der Elemente

Sortieren ist im Edit-Modus ebenfalls via Drag&Drop m�glich.

### Hinzuf�gen von Links zur Link-Seite

## Roadmap/ToDo

  * Variablen Editieren (falls nicht Webmatic-Readonly-Flag gesetzt ist)
  * mehr angepasste Widgets f�r HomeMatic und CUxD Ger�te
  * div Style-Anpassungen
  * Sortierung speichern
  * Link-Seite implementieren


## Lizenz / Copyright

Copyright (c) 2013 hobbyquaker http://hobbyquaker.github.io
Lizenz: CC BY-NC 3.0

Sie d�rfen:

das Werk bzw. den Inhalt vervielf�ltigen, verbreiten und �ffentlich zug�nglich machen
Abwandlungen und Bearbeitungen des Werkes bzw. Inhaltes anfertigen
Zu den folgenden Bedingungen:

Namensnennung - Sie m�ssen den Namen des Autors/Rechteinhabers in der von ihm festgelegten Weise nennen.
Keine kommerzielle Nutzung ? Dieses Werk bzw. dieser Inhalt darf nicht f�r kommerzielle Zwecke verwendet werden.
Wobei gilt:

Verzichtserkl�rung - Jede der vorgenannten Bedingungen kann aufgehoben werden, sofern Sie die ausdr�ckliche Einwilligung des Rechteinhabers dazu erhalten.
Die Ver�ffentlichung dieser Software erfolgt in der Hoffnung, da� sie Ihnen von Nutzen sein wird, aber OHNE IRGENDEINE GARANTIE, sogar ohne die implizite Garantie der MARKTREIFE oder der VERWENDBARKEIT F�R EINEN BESTIMMTEN ZWECK.

Die Nutzung dieser Software er