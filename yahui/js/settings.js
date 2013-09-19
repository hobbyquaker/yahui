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

    // Info-Button oben rechts ausblenden?
    hideInfoButton: false,

    // Bestimmte Datenpunkte von CUxD Geräten ausblenden (_MIN_ betrifft auch _MAX_)
    hideDatapoints: {
        TEMP_MIN_24H: false,
        ABS_HUMIDITY: false,
        HUM_MIN_24H: true,
        DEWPOINT: false,
        MISS_24H: true,
        COUNTER: true,
        SUM: true,
        LOWBAT: true
    }
};