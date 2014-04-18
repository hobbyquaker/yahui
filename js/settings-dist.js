/**
 *
 *      yahui Konfiguration
 *
 */

var settings = {

    // Hier kann getrennt für die Kopfzeile, den Inhalt und das Menü ein jquerymobile "Swatch" gewählt werden.
    // a = Dunkelgrau, b=Hellgrau/Blau, c=Hellgrau, d=Grau, e=Gelb
    // komplett individuelle Themes können hier erstellt werden: http://jquerymobile.com/themeroller/index.php
    swatches: {

        // Kopfzeile
        header: "b",

        // Inhalt
        content: "c",

        // Menü
        footer: "a"
    },

    // Prefix das allen Seiten-Titeln vorangestellt wird
    prefix: "",

    // Zeitpunkt oder Zeitraum anzeigen? Mögliche Werte: false (gar nichts anzeingen), "moment" (zeitpunkt), "period" (zeitraum)
    dateSinceType: "moment",

    // Service-Meldungen bei Favoriten/Räumen/Gewerken anzeigen?
    showServiceMsgs: true,

    // Popup nach Programmausführung anzeigen
    showProgramPopup: true,

    // Wie lange soll das Popup bzw die CSS Klasse eine Programmausführung bestätigen? (millisekunden)
    timeProgramConfirm: 1500,

    // Menü-Punkte ausblenden
    hideFavorites: false,
    hideRooms: false,
    hideFunctions: false,
    hideExtensions: false,

    // Info-Button oben rechts ausblenden?
    hideInfoButton: false,

    // (VIRTUAL_)KEY grundsätzlich ausblenden
    hideKeys: false,

    //Variablen auch in der Variablenansicht nicht editierbar, wenn (r) in der Beschreibung enthalten ist
    editReadOnlyVariablesInVariablelist: true,

    // Default Beschriftung für kurzen und langen Tastendruck
    defaultPressShort: "kurz",
    defaultPressLong: "lang",

    // Bestimmte Datenpunkte ausblenden (_MIN_ betrifft auch _MAX_)
    hideDatapoints: {
        TEMP_MIN_24H: false,
        ABS_HUMIDITY: false,
        HUM_MIN_24H: false,
        DEWPOINT: false,
        MISS_24H: true,
        COUNTER: true,
        SUM: true,
        LOWBAT: true
    }
};