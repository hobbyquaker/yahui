/**
 *      yahui
 *
 *      yet another HomeMatic user interface
 *
 *      Copyright (c) 2013 http://hobbyquaker.github.io
 *
 *      CC BY-NC 3.0
 *
 *      Kommerzielle Nutzung nicht gestattet!
 *
 */


var yahui = {
    version: "0.7.1",
    images: []
};


$(document).ready(function () {

    var body = $("body");

    var url = $.mobile.path.parseUrl(location.href);

    console.log(url);

    if (url.search == "?edit") {
        // Edit Modus!
        $.ajaxSetup({
            cache: true
        });
        $.getScript("js/yahui-edit.js")
        .done(function(script, textStatus) {
            console.log("edit mode");

        })
        .fail(function(jqxhr, settings, exception) {

        });
    }


    // Verbindung zu CCU.IO herstellen.
    var socket = io.connect( $(location).attr('protocol') + '//' +  $(location).attr('host'));

    // Von CCU.IO empfangene Events verarbeiten
    socket.on('event', function(obj) {
        console.log(obj);
        // id = obj[0], value = obj[1], timestamp = obj[2], acknowledge = obj[3]

        // Datenpunkt-Objekt aktualisieren
        datapoints[obj[0]] = [obj[1], obj[2], obj[3]];

        // UI Widgets aktualisieren
        updateWidgets(obj[0], obj[1], obj[2], obj[3]);
    });


    // Abfragen welche Bild-Dateien im Ordner yahui/images/user/ vorhanden sind
    socket.emit('readdir', "www/yahui/images/user", function(dirArr) {
        console.log(dirArr);
        for (var i = 0; i < dirArr.length; i++) {
            var id = parseInt(dirArr[i].replace(/\..*$/, ""), 10);
            yahui.images[id] = dirArr[i];
        }
        console.log(yahui.images);
    });



    // Diese 3 Objekte beinhalten die CCU Daten.
    // Unter http://hostname:8080/ccu.io/ können diese Objekte inspiziert werden.
    var regaObjects, datapoints, regaIndex;

    // "Hier geht's los"
    getDatapoints();

    // Laedt die Werte und Timestamps aller Datenpunkte
    function getDatapoints() {
        socket.emit('getDatapoints', function(obj) {
            datapoints = obj;
            // Weiter gehts mit den Rega Objekten
            getObjects();
        });
    }

    // Laedt Metainformationen zu Rega Objekten
    function getObjects() {
        socket.emit('getObjects', function(obj) {
		console.log("received objects");
		console.log(obj);
            regaObjects = obj;
            // Nun sind alle 3 Objekte von CCU.IO empfangen worden

            // Starten wir mit einer Page? Wenn ja schnell Rendern.
            if ( url.hash.search(/^#page_/) !== -1 ) {
                var pageId = (url.hash.slice(6));
                if (!$("div#page_"+pageId).html()) {
                    renderPage(pageId, true);
                }
            }

            // jqMobile initialisieren
            $.mobile.initializePage();

            // Weiter gehts mit dem Laden des Index
            getIndex();
        });
    }

    // Laedt Index von ccu.io fuer komfortables auffinden von Objekten
    function getIndex() {
        socket.emit('getIndex', function(obj) {
            regaIndex = obj;

            // Nun sind alle 3 Objekte (regaIndex, regaObjects und datapoints) von ccu.io geladen,

            // Menüseiten Rendern
            renderMenu("FAVORITE", "ul#listFavs");
            renderMenu("ENUM_ROOMS", "ul#listRooms");
            renderMenu("ENUM_FUNCTIONS", "ul#listFunctions");

            // "wir sind fertig".

        });
    }

    // Menü-Seite (Favoriten, Räume und Gewerke) aufbauen
    function renderMenu(en, selector) {
        var domObj = $(selector);
        var img;
        var defimg = "images/default/page.png";
        var name, link;
        switch (en) {
            case "ENUM_ROOMS":
                defimg = "images/default/room.png";
                name = "R&auml;ume"
                break;
            case "ENUM_FUNCTIONS":
                defimg = "images/default/function.png";
                name = "Gewerke";
                break;
            case "FAVORITE":
                defimg = "images/default/favorite.png";
                name = "Favoriten";
                break;

        }
        for (var i = 0; i < regaIndex[en].length; i++) {
            var enId = regaIndex[en][i];
            var enObj = (regaObjects[enId]);

            // User Image vorhanden?
            if (yahui.images[enId]) {
                img = "images/user/" + yahui.images[enId];
            } else {
                img = defimg;
            }

            var li = "<li data-hm-id='"+enId+"'><a href='#page_"+enId+"'>" +
                "<img src='"+img+"'>" +
                "<h2>"+enObj.Name+ "</h2>"+
                "<p>"+(enObj.EnumInfo?enObj.EnumInfo:"")+"</p>" +
                "</a></li>";
            domObj.append(li);
        }
        if (domObj.hasClass('ui-listview')) {
            domObj.listview('refresh');
        } else {
            domObj.trigger("create");
        }
    }

    // Pages bei Bedarf rendern
    $(document).bind( "pagebeforechange", function( e, data ) {
        if ( typeof data.toPage === "string" ) {
            var u = $.mobile.path.parseUrl( data.toPage );
            // Kommt die Zeichenkette #page_ im Hash vor?
            if ( u.hash.search(/^#page_/) !== -1 ) {
                var pageId = (u.hash.slice(6));
                if (!$("div#page_"+pageId).html()) {
                    renderPage(pageId);
                }
            }
        }
    });

    // Baut eine Page auf
    function renderPage(pageId, prepend) {
        console.log("renderPage("+pageId+")");
        var regaObj = (regaObjects[pageId]);
        var name, link;
        switch (regaObj.TypeName) {
        case "FAVORITE":
            name = "Favoriten";
            link = "#favs";
            break;
        case "ENUM_ROOMS":
            name = "R&auml;ume";
            link = "#rooms";
            break;
        case "ENUM_FUNCTIONS":
            name = "Gewerke";
            link = "#funcs";
            break;
        default:
            name = "Zur&uuml;ck";
            link = "#";
        }

        var page = '<div id="page_'+pageId+'" data-role="page">' +
            '<div data-role="header" data-position="fixed" data-id="f2" data-theme="b">' +
            '<a href="'+link+'" data-role="button" data-icon="arrow-l" data-theme="b">'+name+'</a>' +
            '<h1>' +regaObj.Name + '</h1>' +
            //'<a href="?edit" data-icon="gear">Edit</a>' +
            '</div><div data-role="content">' +
            '<ul data-role="listview" id="list_'+pageId+'"></ul></div></div>';
        if (prepend) {
            body.prepend(page);
        } else {
            body.append(page);
        }
        var list = $("ul#list_"+pageId);
        for (var l in regaObj.Channels) {
            var chId = regaObj.Channels[l];
            renderWidget(list, chId);
        }

    }

    // erzeugt ein Bedien-/Anzeige-Element
    function renderWidget(list, id) {
        var el = regaObjects[id];
        var elId = list.attr("id") + "_" + id;

        var img, defimg = "images/default/widget.png";
        if (yahui.images[id]) {
            img = "images/user/" + yahui.images[id];
        }
        console.log("renderWidget("+id+") "+el.TypeName+" "+el.Name);
        switch (el.TypeName) {
        case "CHANNEL":
            switch (el.HssType) {
                case "DIMMER":
                    defimg = "images/default/dimmer.png";
                    var levelId = regaObjects[id].DPs.LEVEL;
                    var workingId = regaObjects[id].DPs.WORKING;
                    var directionId = regaObjects[id].DPs.DIRECTION;
                    content = '<li class="yahui-widget" data-hm-id="'+id+'"><img src="'+img+'">' +
                        '<div class="yahui-a">'+el.Name+'</div>' +
                        '<div class="yahui-b">' +
                        '<select id="switch_'+elId+'" data-hm-id="'+levelId+'" name="switch_'+elId+'" data-role="slider">' +
                        '<option value="0">Aus</option>' +
                        '<option value="1"'+((datapoints[levelId][0] != 0) ?' selected':'')+'>An</option>' +
                        '</select><span data-hm-id="'+directionId+'" class="yahui-direction"></span></div><div class="yahui-c">' +
                        '<input id="'+elId+'" type="range" data-hm-factor="100" data-hm-id="'+levelId +
                        '" name="slider_'+elId+'" id="slider_'+elId+'" min="0" max="100" value="'+(datapoints[levelId][0]*100)+'"/></div></li>';

                    list.append(content);

                    setTimeout(function () {
                        $("#"+elId).on( 'slidestop', function( event ) {
                            console.log("slide "+event.target.value / (event.target.dataset.hmFactor?event.target.dataset.hmFactor:1)+" "+event.target.dataset.hmId);
                            socket.emit("setState", [parseInt(event.target.dataset.hmId,10), event.target.value / (event.target.dataset.hmFactor?event.target.dataset.hmFactor:1)]);
                        });
                        $("#switch_"+elId).on( 'slidestop', function( event ) {
                            console.log("slide "+event.target.value+" "+event.target.dataset.hmId);
                            socket.emit("setState", [parseInt(event.target.dataset.hmId,10), parseInt(event.target.value,10)]);
                        });
                    }, 500);


                    break;
                case "BLIND":
                    defimg = "images/default/blind.png";
                    img = (img ? img : defimg);
                    var levelId = regaObjects[id].DPs.LEVEL;
                    var workingId = regaObjects[id].DPs.WORKING;
		            content = '<li class="yahui-widget" data-hm-id="'+id+'"><img src="'+img+'">' +
                        '<div class="yahui-a">'+el.Name+'</div>' +
                        '<div class="yahui-b"><select data-hm-id="'+levelId+'" name="switch_state" data-role="slider">' +
                        '<option value="0">Aus</option>' +
                        '<option value="1"'+((datapoints[levelId][0] != 0) ?' selected':'')+'>An</option>' +
                        '</select></div><div class="yahui-c">' +
                        '<input type="range" data-hm-factor="100" data-hm-id="'+levelId +
                        '" name="slider-1" id="slider-1" min="0" max="100" value="'+(datapoints[levelId][0]*100)+'"/></div></li>';

                    list.append(content);

                    setTimeout(function () {
                        $("#"+elId).on( 'slidestop', function( event ) {
                            console.log("slide "+event.target.value / (event.target.dataset.hmFactor?event.target.dataset.hmFactor:1)+" "+event.target.dataset.hmId);
                            socket.emit("setState", [parseInt(event.target.dataset.hmId,10), event.target.value / (event.target.dataset.hmFactor?event.target.dataset.hmFactor:1)]);
                        });
                    }, 500);
                    break;
                case "KEY":
                    defimg = "images/default/key.png";
                    img = (img ? img : defimg);
                    var shortId = regaObjects[id].DPs.PRESS_SHORT;
                    var longId = regaObjects[id].DPs.PRESS_LONG;
                    content = '<li class="yahui-widget" data-hm-id="'+id+'"><img src="'+img+'">' +
                        '<div class="yahui-a">'+el.Name+'</div>' +
                        '<div class="yahui-b">' +
                        '<input type="button" data-hm-id="'+shortId+'" name="press_short" value="kurz" data-inline="true"/> ' +
                        '<input type="button" data-hm-id="'+longId+'" name="press_long" value="lang" data-inline="true"/></div></li>';
                    list.append(content);
                    break;
                case "SWITCH":
                    defimg = "images/default/switch.png";
                    img = (img ? img : defimg);
                    var stateId = regaObjects[id].DPs.STATE;
                    content = '<li class="yahui-widget" data-hm-id="'+id+'"><img src="'+img+'">' +
                        '<div class="yahui-a">'+el.Name+'</div>' +
                        '<div class="yahui-b">' +
 
                        '<select id="switch_'+elId+'" data-hm-id="'+stateId+'" name="switch_'+elId+'" data-role="slider">' +
                        '<option value="0">Aus</option>' +
                        '<option value="1"'+((datapoints[stateId][0] != 0) ? ' selected' : '')+'>An</option>' +
                        '</select></div></li>';
                    list.append(content);
                    setTimeout(function () {
                        $("#switch_"+elId).on( 'slidestop', function( event ) {
                            console.log("slide "+event.target.value+" "+event.target.dataset.hmId);
                            socket.emit("setState", [parseInt(event.target.dataset.hmId,10), parseInt(event.target.value,10)]);
                        });
                    }, 500);
                    break;
                default:

                    img = (img ? img : defimg);
                    content = '<li class="yahui-widget" data-hm-id="'+id+'"><img src="'+img+'">' +
                        '<div class="yahui-a">'+el.Name+'</div>' +
                        '<div class="yahui-b" style="font-size:12px"><span style="display: inline-block; padding-top:5px;">' + el.HssType +
                        '</div><div class="yahui-c"><table class="yahui-datapoints">';
                    for (var dp in regaObjects[id].DPs) {
                        var dpId = regaObjects[id].DPs[dp];
                        var val = datapoints[dpId][0];

                        // Meter-Datenpunkt auf 3-Nachkommastellen formatieren.
                        if (regaObjects[dpId].Name.match(/\.METER$/)) {
                            val = val.toFixed(3);
                        }
                        content += "<tr><td>"+dp+"</td><td><span class='hm-val' data-hm-id='"+dpId+"'>"+val+"</span>"+regaObjects[dpId].ValueUnit+"</td></tr>";
                    }
                    content += "</table></div></li>";
                    list.append(content);
            }
            break;
        case "VARDP":
            // WebMatic ReadOnly-Flag -> (r) in Variablen-Beschreibung
            var readOnly = (regaObjects[id].DPInfo.match(/\([^\)]*r[^\)]*\)/) ? true : false );
            img = (img ? img : defimg);
            if (readOnly) {
                content = '<li class="yahui-widget" data-hm-id="'+id+'"><img src="'+img+'">' +
                    '<div class="yahui-a">'+el.Name+'</div>' +
                    '<div class="yahui-bc">';
                switch (regaObjects[id].ValueType) {
                case 2:
                case 16:
                    var valueList = regaObjects[id].ValueList.split(";")
                    var val = datapoints[id][0];
                    if (val == true) { val = 1; }
                    if (val == false) { val = 0; }
                    content += "<span class='hm-val' data-hm-id='"+id+"'>"+valueList[val]+"</span>"+regaObjects[id].ValueUnit+"</div></li>";
                    break;

                default:
                    content += "<span class='hm-val' data-hm-id='"+id+"'>"+datapoints[id][0]+"</span>"+regaObjects[id].ValueUnit+"</div></li>";
                }


            } else {
                content = '<li class="yahui-widget" data-hm-id="'+id+'"><img src="'+img+'">' +
                    '<div class="yahui-a">'+el.Name+'</div>' +
                    '<div class="yahui-bc">';
                switch (regaObjects[id].ValueType) {
                case 2:
                case 16:
                    var valueList = regaObjects[id].ValueList.split(";")
                    var val = datapoints[id][0];
                    if (val == true) { val = 1; }
                    if (val == false) { val = 0; }
                    content += "<select>";
                    for (var i = 0; i < valueList.length; i++) {
                        content += '<option value="'+i+'">'+valueList[i]+'</option>';
                    }
                    content += '</select>'+regaObjects[id].ValueUnit+"</div></li>";
                    break;
                default:
                    content += "<span class='hm-val' data-hm-id='"+id+"'>"+datapoints[id][0]+"</span>"+regaObjects[id].ValueUnit+"</div></li>";

                }

            }
            list.append(content);
            break;
        case "PROGRAM":

            img = (img ? img : defimg);
            content = '<li class="yahui-widget" data-hm-id="'+id+'"><img src="'+img+'">' +
                '<div class="yahui-a">'+el.Name+'</div>' +
                '<div class="yahui-bc">' +
                '<a href="#" data-role="button" data-icon="arrow-r">Programm ausf&uuml;hren</a>' +
                "</div></li>";
            list.append(content);
            break;
        default:
        }


    }

    function updateWidgets(id, val, ts, ack) {
        // Alle Elemente mit passender id suchen
        $("span[data-hm-id='"+id+"']").each(function () {
            var $this = $(this);
            var datapoint   = regaObjects[id];

            if ($this.data("hm-val")) {
                switch (datapoint.ValueType) {
                case 2:
                    $this.html(val);
                    break;

                }
            }

        });

        $("input[data-type='range'][data-hm-id='"+id+"']").each(function () {
            var working = false;
            var direction = 0;
            // Eltern-Element aus Index suchen
            var channel     = regaObjects[regaObjects[id].Parent];
            if (channel) {
                if (channel.DPs.WORKING) {
                    working = datapoints[channel.DPs.WORKING][0];
                }
                if (channel.DPs.DIRECTION) {
                    direction = datapoints[channel.DPs.WORKING][0];
                }
            }
            // Eltern-Element aus Index suchen
            var channel     = regaObjects[regaObjects[id].Parent];
            if (channel) {
                if (channel.DPs.WORKING) {
                    working = datapoints[channel.DPs.WORKING][0];
                }
            }
            console.log(channel.Name+" working="+working);
            if (!working) {
                var $this = $(this);
                var pos = val;
                if ($this.data("hm-factor")) {
                    pos = pos * $this.data("hm-factor");
                }
                $this.val(pos).slider('refresh');
            }
        });
        $("select[data-role='slider'][data-hm-id='"+id+"']").each(function () {
            var $this = $(this);
            var working = false;
            var direction = 0;
            // Eltern-Element aus Index suchen
            var channel     = regaObjects[regaObjects[id].Parent];
            if (channel) {
                if (channel.DPs.WORKING) {
                    working = datapoints[channel.DPs.WORKING][0];
                }
                if (channel.DPs.DIRECTION) {
                    direction = datapoints[channel.DPs.WORKING][0];
                }
            }
            console.log(channel.Name+" working="+working);
            if (!working) {
                if (!val) {
                    $this.find("option[value='1']").removeAttr("selected");
                    $this.find("option[value='0']").prop("selected", true);
                } else {
                    $this.find("option[value='0']").removeAttr("selected");
                    $this.find("option[value='1']").prop("selected", true);
                }
                $this.slider("refresh");
            }

        });
    }

});
