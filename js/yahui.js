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
    version: "1.2.16",
    requiredCcuIoVersion: "1.0.25",
    images: [],
    defaultImages: [],
    sortOrder: {},
    socket: {},
    extensions: {},
    elementOptions: {},
    regaObjects: {},
    stringtable: {},
    inEditMode: false,
    ready: false,
    menuCollapsed: storage.get("yahui-menu-collapsed")
};

$(document).ready(function () {

    var body = $("body");

    var startPage = "";
    var menuCount = 4;
    if (settings.hideFavorites) {
        $(".yahui-nav-favs").remove();
        startPage = "#rooms";
        menuCount -= 1;
    }
    if (settings.hideRooms) {
        $(".yahui-nav-rooms").remove();
        if (startPage == "#rooms") {
            startPage = "#funcs";
        }
        menuCount -= 1;
    }
    if (settings.hideFunctions) {
        $(".yahui-nav-funcs").remove();
        if (startPage == "#funcs") {
            startPage = "#links";
        }
        menuCount -= 1;
    }
    if (settings.hideExtensions) {
        $(".yahui-nav-links").remove();
        menuCount -= 1;
    }
    switch (menuCount) {
        case 3:
            $(".yahui-navbar").attr("data-grid", "b");
            break;
        case 2:
            $(".yahui-navbar").attr("data-grid", "a");
            break;
        case 1:
            $(".yahui-navbar").parent().remove();
            break;
        case 0:
            $(".yahui-navbar").parent().remove();
            break;
    }

    var url = $.mobile.path.parseUrl(location.href);

    var re = new RegExp('\/yahui\/$');
    if (url.pathname.match(re) && url.hash == "" && startPage != "") {
        window.location.href = url.pathname + startPage;
    }

    if (url.hash.match(/&/)) {
        var tmpArr = url.hash.split("&");
        var hash = tmpArr[0];

        window.location.href = url.pathname + hash;
        url = $.mobile.path.parseUrl(location.href);
    }



    settings.prefix = settings.prefix || "";
    settings.defaultPressShort = settings.defaultPressShort || "kurz";
    settings.defaultPressLong = settings.defaultPressLong || "lang";


    $(".yahui-version").html(yahui.version);
    $(".yahui-prefix").html(settings.prefix);

    // Themes
    $("[data-role='header']").attr("data-theme", settings.swatches.header);
    $("[data-role='page']").attr("data-theme", settings.swatches.content);
    $("[data-role='footer']").attr("data-theme", settings.swatches.footer);


    // ggf Info-Button ausblenden
    if (settings.hideInfoButton) {
        $("a[href='#info']").hide();
    }

    $("#ccu-io-disconnect").popup();

    // Diese 3 Objekte beinhalten die CCU Daten.
    // Unter http://hostname:8080/ccu.io/ können diese Objekte inspiziert werden.
    var regaObjects, datapoints = {}, regaIndex;

    // Verbindung zu CCU.IO herstellen.
    yahui.socket = io.connect( $(location).attr('protocol') + '//' +  $(location).attr('host') + '?key=' + socketSession);

    function compareVersion(instVersion, availVersion) {
        var instVersionArr = instVersion.replace(/beta/,".").split(".");
        var availVersionArr = availVersion.replace(/beta/,".").split(".");

        var updateAvailable = false;

        for (var k = 0; k<3; k++) {
            instVersionArr[k] = parseInt(instVersionArr[k], 10);
            if (isNaN(instVersionArr[k])) { instVersionArr[k] = -1; }
            availVersionArr[k] = parseInt(availVersionArr[k], 10);
            if (isNaN(availVersionArr[k])) { availVersionArr[k] = -1; }
        }

        if (availVersionArr[0] > instVersionArr[0]) {
            updateAvailable = true;
        } else if (availVersionArr[0] == instVersionArr[0]) {
            if (availVersionArr[1] > instVersionArr[1]) {
                updateAvailable = true;
            } else if (availVersionArr[1] == instVersionArr[1]) {
                if (availVersionArr[2] > instVersionArr[2]) {
                    updateAvailable = true;
                }
            }
        }
        return updateAvailable;
    }

    yahui.socket.emit('getVersion', function(version) {
        if (compareVersion(version, yahui.requiredCcuIoVersion)) {
            alert("Warning: requires CCU.IO version "+yahui.requiredCcuIoVersion+" - found CCU.IO version "+version+" - please update CCU.IO.");
        }
        $("#ccuioversion").html(version);
    });

    // Von CCU.IO empfangene Events verarbeiten
    yahui.socket.on('event', function(obj) {
        //console.log(obj);
        // id = obj[0], value = obj[1], timestamp = obj[2], acknowledge = obj[3]

        if ($.isArray(obj)) {

            // Hat sich die Anzahl der Service-Meldungen geändert?
            if (settings.showServiceMsgs && obj[0] == 41 && obj[1] != datapoints[41][0]) {
                setTimeout(function () {
                    updateServiceMsgs();
                }, 15000);
            }

            // Datenpunkt-Objekt aktualisieren
            datapoints[obj[0]] = [obj[1], obj[2], obj[3], obj[4]];

            // UI Widgets aktualisieren
            updateWidgets(obj[0], obj[1], obj[2], obj[3], obj[4]);
        }
    });

    yahui.socket.on('connect', function () {
        $("#ccu-io-disconnect").popup("close");
        //console.log((new Date()) + " socket.io connect");
    });

    yahui.socket.on('connecting', function () {
        //console.log((new Date()) + " socket.io connecting");
    });

    yahui.socket.on('disconnect', function () {
        $("#ccu-io-disconnect").popup("open");
        $('html, body').css({
            'overflow': 'hidden',
            'height': '100%'
        });
        //console.log((new Date()) + " socket.io disconnect");
    });

    yahui.socket.on('disconnecting', function () {
        //console.log((new Date()) + " socket.io disconnecting");
    });

    yahui.socket.on('reconnect', function () {
        $("#ccu-io-disconnect").popup("close");
        setTimeout(function () {
            window.location.reload();
        }, 500);
        //console.log((new Date()) + " socket.io reconnect");
    });

    yahui.socket.on('reconnecting', function () {
        //console.log((new Date()) + " socket.io reconnecting");
    });

    yahui.socket.on('reconnect_failed', function () {
        //console.log((new Date()) + " socket.io reconnect failed");
    });
    
    yahui.socket.on('error', function () {
        $("#ccu-io-disconnect p").html("CCU.IO Kommunikationsfehler");
        $("#ccu-io-disconnect").popup("open");
        setTimeout(function () {
            $("#ccu-io-disconnect").popup("close");
            window.location.reload();
        }, 2000);
        //console.log((new Date()) + " socket.io error");
    });

    // Abfragen welche Bild-Dateien im Ordner yahui/images/user/ vorhanden sind
    yahui.socket.emit('readdir', "www" + url.pathname + "images/user", function(dirArr) {
        for (var i = 0; i < dirArr.length; i++) {
            //var id = parseInt(dirArr[i].replace(/\..*$/, ""), 10);
            var id = dirArr[i].replace(/\..*$/, "");
            yahui.images[id] = dirArr[i];
        }
        //console.log(yahui.images);
    });

    // Abfragen welche Bild-Dateien im Ordner yahui/images/default/ vorhanden sind
    yahui.socket.emit('readdir', "www" + url.pathname + "images/default", function(dirArr) {
        for (var i = 0; i < dirArr.length; i++) {
            //var id = parseInt(dirArr[i].replace(/\..*$/, ""), 10);
            var id = dirArr[i].replace(/\..*$/, "");
            yahui.defaultImages[id] = dirArr[i];
        }
        //console.log(yahui.defaultImages);
    });

    // Extensions laden
    yahui.socket.emit('readFile', 'yahui-extensions.json', function (data) {
        if (data) {
            yahui.extensions = data;
        } else {
            yahui.extensions = {
                0: {"text":"Variablen","subtext":"","url":"#variables","special":true},
                1: {"text":"Programme","subtext":"","url":"#programs","special":true},
                2: {"text":"Servicemeldungen","subtext":"","url":"#alarms","special":true}
            };
            yahui.socket.emit("writeFile", "yahui-extensions.json", yahui.extensions);
        }

        // Sortierung laden
        yahui.socket.emit('readFile', 'yahui-sort.json', function (data) {
            if (data) {
                yahui.sortOrder = data;
            }

            yahui.socket.emit('readFile', 'yahui-elementOptions.json', function(data) {
                if (data) {
                    yahui.elementOptions = data;
                }

                // ---------- "Hier geht's los" ----------- //
                getDatapoints();
                renderLinks();
            });
        });
    });

    // Sind wir im Edit-Mode?
    //console.log("url.search="+url.search);
    if (url.search == "?edit") {
        // JA!
        yahui.inEditMode = true;
        $(".yahui-edit").show();
        $(".yahui-noedit").hide();
        $("#edit_indicator").show();
        // Edit Modus!
        $.ajaxSetup({
            cache: true
        });

        $.getScript("js/yahui-edit.js")
            .done(function(script, textStatus) {
                //console.log("edit mode");
            })
            .fail(function(jqxhr, settings, exception) {
                console.log("failed loading yahui-edit.js");
            });

    } else {
        // Kein Edit-Mode
        yahui.inEditMode = false;
        $(".yahui-noedit").show();
        $(".yahui-edit").hide();
    }

    // Laedt die Werte und Timestamps aller Datenpunkte
    function getDatapoints() {
        yahui.socket.emit('getDatapoints', function(obj) {
            datapoints = obj;
            // Weiter gehts mit der Stringtable
            getStringtable();
        });
    }

    // Laedt die Stringtable
    function getStringtable() {
        yahui.socket.emit('getStringtable', function(obj) {
            yahui.stringtable = obj;
            // Weiter gehts mit den Rega Objekten
            getObjects();
        });
    }


    // Laedt Metainformationen zu Rega Objekten
    function getObjects() {
        yahui.socket.emit('getObjects', function(obj) {
            regaObjects = obj;
            yahui.regaObjects = regaObjects;
            // Weiter gehts mit dem Laden des Index
            getIndex();
        });
    }

    // Laedt Index von ccu.io fuer komfortables auffinden von Objekten
    function getIndex() {
        yahui.socket.emit('getIndex', function(obj) {
            regaIndex = obj;

            // Nun sind alle 3 Objekte (regaIndex, regaObjects und datapoints) von ccu.io geladen,

            // Menüseiten Rendern
            if (regaIndex["FAVORITE"]) {
                renderMenu("FAVORITE", "ul#listFavs");
            }
            renderMenu("ENUM_ROOMS", "ul#listRooms");
            renderMenu("ENUM_FUNCTIONS", "ul#listFunctions");

            // "wir sind fertig".
            yahui.ready = true;

            // Starten wir mit einer Page? Wenn ja schnell Rendern.
            if ( url.hash.search(/^#page_/) !== -1 ) {

                var pageId = (url.hash.slice(6));
                if (!$("div#page_"+pageId).html()) {
                    renderPage(pageId, true);
                }

            // Starten wir mit einer Erweiterung? Wenn ja - schnell rendern.
            } else if ( url.hash.search(/^#iframe_/) !== -1 ) {
                var pageId = (url.hash.slice(8));
                if (!$("div#iframe_"+pageId).html()) {
                    renderIFrame(pageId);
                }
            } else if (url.hash == "#programs") {
                renderPrograms();
            } else if (url.hash == "#variables") {
                renderVariables();
            } else if (url.hash == "#alarms") {
                renderAlarms();
            }

            // Farbe übernehmen
            $(document).on('pagebeforeshow', url.hash,  function(){
                var cssBackgroundColor = $("body").css("background-color");
                var cssNew = cssBackgroundColor.replace(/rgb[ ]*\([ ]*([0-9]+)[ ]*,[ ]*([0-9]+)[ ]*,[ ]*([0-9]+[ ]*)[ ]*\)/, function (all, r,g,b) {
                    return "rgba("+r+","+g+","+b+",0.7)";
                });
                $('<style type="text/css">.responsive-grid .ui-listview .ui-li-has-thumb .ui-li-heading, .responsive-grid .ui-listview .ui-li-has-thumb .ui-li-desc {background-color:'+cssNew+';}</style>').appendTo("head");
            });

            // jqMobile initialisieren
            $.mobile.initializePage();

        });
    }

    // Menü-Seiten (Favoriten, Räume und Gewerke) aufbauen
    function renderMenu(en, selector, linkclass) {
        //console.log("renderMenu "+en);
        var domObj = $(selector);
        var sortOrder = [];
        var index = [];
        var img;
        var name, link;
        switch (en) {
            case "ENUM_ROOMS":
                defimg = "images/default/room.png";
                name = "Räume";
                sortOrder = yahui.sortOrder["listRooms"];
                break;
            case "ENUM_FUNCTIONS":
                defimg = "images/default/function.png";
                name = "Gewerke";
                sortOrder = yahui.sortOrder["listFunctions"];
                break;
            case "FAVORITE":
                defimg = "images/default/favorite.png";
                sortOrder = yahui.sortOrder["listFavs"];
                name = "Favoriten";
                break;
        }

        // Wir merken uns welche Widgets bereits gerendert wurden
        var alreadyRendered = [];
        // Sortierung abarbeiten
        if (sortOrder) {
            //console.log("SORT "+en)
            for (var j = 0; j < sortOrder.length; j++) {
                sortOrder[j] = parseInt(sortOrder[j], 10);
                if (regaIndex[en].indexOf(sortOrder[j]) != -1) {
                    domObj.append(renderMenuItem(sortOrder[j], linkclass));
                    alreadyRendered.push(sortOrder[j]);
                }
            }
        }

        // noch nicht gerenderte Widgets (nicht in Sortierung vorhanden) rendern
        for (var i = 0; i < regaIndex[en].length; i++) {
            //console.log("... "+regaIndex[en][i]);
            if (alreadyRendered.indexOf(regaIndex[en][i]) == -1) {
                //console.log("..! "+regaIndex[en][i]);
                domObj.append(renderMenuItem(regaIndex[en][i], linkclass));
            }
        }

        // jqMobile listview bereits initialisiert? Wenn ja refresh - wenn nein jetzt erledigen.
        if (domObj.hasClass('ui-listview')) {
            try {
                domObj.listview('refresh');
            }
            catch (err) {}

        } else {
            domObj.trigger("create");
        }
    }

    // Ein Element auf der Menüseite rendern
    function renderMenuItem(enId, linkclass) {

        var enObj = (regaObjects[enId]);

        if (!enObj || !enObj.Name) {
            return "";
        }

        if (settings.showServiceMsgs) {
            var serviceMsgCount = getServiceMsgCount(enId);
        } else {
            var serviceMsgCount = 0;
        }

        var defimg = "images/default/page.png";

        // User Image vorhanden?
        if (yahui.images[enId]) {
            img = "images/user/" + yahui.images[enId];
        } else {
            img = defimg;
        }

        if (linkclass) {
            if ("#page_"+enId == url.hash) {
                var liClass = "ui-btn-active";
            } else {
                var liClass = "";
            }
        }

        return "<li class='"+liClass+"' data-hm-id='"+enId+"'><div data-hm-service-msg='"+enId+"' style='" + (serviceMsgCount==0 ? "display:none" : "") + "' class='service-message'><div class='service-message-count'>" + (serviceMsgCount == 0 ? "" : serviceMsgCount) + "</div></div><a href='#page_"+enId+"'" + (linkclass && linkclass != "" ? " class='" + linkclass + "'" : "") + ">" +
            "<img src='"+img+"'>" +
            "<h2>"+enObj.Name+ "</h2>"+
            "<p>"+(enObj.EnumInfo?enObj.EnumInfo:"")+"</p>" +
            "</a></li>";
    }

    // Pages bei Bedarf rendern
    $(document).bind( "pagebeforechange", function( e, data ) {
        if ( typeof data.toPage === "string" ) {
            var u = $.mobile.path.parseUrl( data.toPage );
            url = u;


            if ($.mobile.activePage) {
                $("a.yahui-noedit.yahui-editswitch").attr("href", "./?edit#"+ $.mobile.activePage.attr('id'));
                $("a.yahui-edit.yahui-editswitch ").attr("href", "./#"+ $.mobile.activePage.attr('id'));
            }

            // Kommt die Zeichenkette #page_ im Hash vor?
            if ( u.hash.search(/^#page_/) !== -1 ) {
                var pageId = (u.hash.slice(6));
                if (!$("div#page_"+pageId).html()) {
                    renderPage(pageId);
                }
            // Erweiterungen
            } else if ( u.hash.search(/^#iframe_/) !== -1 ) {
                var pageId = (u.hash.slice(8));
                if (!$("div#iframe_"+pageId).html()) {
                     renderIFrame(pageId);
                }
            } else if (u.hash == "#programs") {
                renderPrograms();
            } else if (u.hash == "#variables") {
                renderVariables();
            } else if (u.hash == "#alarms") {
                renderAlarms();
            }
        }
    });

    // Eine Erweiterung "inline" (im iFrame) rendern
    function renderIFrame(pageId) {
        for (var id in yahui.extensions) {
            var link = yahui.extensions[id];

            if (id == pageId) {
                var src = link.url;
                var text = link.text;
                continue;
            }
        }

        var page = '<div id="iframe_'+pageId+'" data-role="page" data-theme="'+settings.swatches.content+'">' +
            '<div data-role="header" data-position="fixed" data-id="f2" data-theme="'+settings.swatches.header+'">' +
            '<a href="#links" data-role="button" data-icon="arrow-l">Erweiterungen</a>' +
            '<a href="#" id="refresh_'+pageId+'" data-role="button" data-inline="true" data-icon="refresh" data-iconpos="notext" class="yahui-info ui-btn-right"></a>' +
            '<h1>' + settings.prefix + text + '</h1>' +
            '</div><div style="margin:0;padding:0;min-height:90%" data-role="content">' +
            '<iframe style="position:absolute; top:0px; left:0px; width:100%; height:100%; height:calc(100% - 42px); padding-top:42px; border: none;" src="'+src+'" id="if_'+pageId+'"></iframe></div></div>';
        body.prepend(page);
        $("#refresh_"+pageId).click(function () {
           $("#if_"+pageId).attr('src', function ( i, val ) { return val; });
        });
    }

    // Link-Seite aufbauen
    function renderLinks() {

        // Fehlende Erweiterungen hinzufügen
        var extArr = [];
        for (var link in yahui.extensions) {
            extArr.push(yahui.extensions[link].url);
        }
        if (extArr.indexOf("#alarms") == -1) {
            yahui.extensions[parseInt(link,10)+1] = {"text":"Servicemeldungen","subtext":"","url":"#alarms","special":true};
            yahui.socket.emit("writeFile", "yahui-extensions.json", yahui.extensions);
        }

        var alreadyRendered = [];

        // Sortierung abarbeiten
        if (yahui.sortOrder && yahui.sortOrder.listLinks) {
            for (var i = 0; i < yahui.sortOrder.listLinks.length; i++) {
                if (yahui.extensions[yahui.sortOrder.listLinks[i]] && (alreadyRendered.indexOf(yahui.sortOrder.listLinks[i]) == -1)) {
                    renderLink(yahui.sortOrder.listLinks[i]);
                    alreadyRendered.push(yahui.sortOrder.listLinks[i]);
                }
            }
        }

        // Noch nicht gerenderte (in Sortierung nicht vorhandene) rendern
        for (var id in yahui.extensions) {
            if (alreadyRendered.indexOf(parseInt(id,10)) == -1) {
                renderLink(id);
            }
        }

    }

    // Ein einzelnen Link rendern
    function renderLink(id) {
        var link = yahui.extensions[id];
        var extHref,
            extClass = "",
            extTarget = "";

        if (link.inline == true) {
            extHref = "#iframe_"+id;
            extTarget = "";
        } else {
            extHref = link.url;
            extTarget = " target='_blank'";
        }

        if (link.special) {
            extClass = "";
            extTarget = "";
        } else {
            extClass = "yahui-extension";
        }

        var img;
        // Bild vorhanden? Falls nicht dummy.png anzeigen
        if (yahui.images["ext_"+id]) {
            img = yahui.images["ext_"+id];
        } else {
            img = "dummy.png";
        }

        var item = "<li data-ext-id='"+id+"'><a class='"+extClass+"' id='ext_"+id+"' href='"+extHref+"'"+extTarget+">" +
            "<img src='images/user/"+img+"'>" +
            "<h2>"+link.text+ "</h2>"+
            "<p>"+link.subtext+"</p>" +
            "</a></li>";

        $("ul#listLinks").append(item);
    }

    // Baut eine Page auf
    function renderPage(pageId, prepend) {
        //console.log("renderPage("+pageId+")");
        var regaObj = (regaObjects[pageId]);
        var name, link;
        switch (regaObj.TypeName) {
            case "FAVORITE":
                name = "Favoriten";
                link = "#favs";
                break;
            case "ENUM_ROOMS":
                name = "Räume";
                link = "#rooms";
                break;
            case "ENUM_FUNCTIONS":
                name = "Gewerke";
                link = "#funcs";
                break;
            default:
                name = "Zurück";
                link = "#";
        }

        var page = '<div id="page_' + pageId + '" data-role="page" data-theme="' + settings.swatches.content + '">' +
            '<div data-role="header" data-position="fixed" data-id="f2" data-theme="' + settings.swatches.header + '">' +
            '<a href="' + link + '" data-role="button" data-icon="arrow-l">'+name+'</a>' +
            '<h1>' +settings.prefix + regaObj.Name + '</h1>';
        if (!settings.hideInfoButton) {
            page += '<a href="#info" data-rel="dialog" data-role="button" data-inline="true" data-icon="info" data-iconpos="notext" class="yahui-info ui-btn-right"></a>';
        }
        page += '</div><div data-role="content"><div class="leftcolumn_collapsed" style="display: none;"><ul data-role="listview" id="ul_list_left_collapsed_' + pageId + '" data-inset="true" class="ul_list_left_collapsed yahui-page-left"></ul></div><div class="leftcolumn"><ul data-role="listview" id="ul_list_left_' + pageId + '" data-inset="true" class="yahui-page-left"></ul></div><div class="rightcolumn">' +
            '<ul data-role="listview" id="list_' + pageId + '" data-inset="true" class="yahui-page yahui-sortable"></ul></div></div></div>';
        if (prepend) {
            body.prepend(page);
        } else {
            body.append(page);
        }

        if (regaObj.TypeName == "ENUM_ROOMS" || regaObj.TypeName == "ENUM_FUNCTIONS" || regaObj.TypeName == "FAVORITE") {
            //falls die sortierung in der zwischenzeit geändert wurde, liste neu laden

            var name = "";
            var myid = "";
            if (regaObj.TypeName == "ENUM_ROOMS") {
                name = "Räume";
                myid = "rooms";
            } else if (regaObj.TypeName == "ENUM_FUNCTIONS") {
                name = "Gewerke";
                myid = "functions";
            } else if (regaObj.TypeName == "FAVORITE") {
                name = "Favoriten";
                myid = "favorites";
            }

            $("ul#ul_list_left_" + pageId).empty();
            $("ul#ul_list_left_" + pageId).append('<li id="heading_' + myid + '_' + pageId + '" data-role="list-divider" role="heading">' + name + '</li>');
            $("ul#ul_list_left_collapsed_" + pageId).empty();
            $("ul#ul_list_left_collapsed_" + pageId).append('<li id="heading_collapsed_' + myid + '_' + pageId + '" data-role="list-divider" role="heading">' + name + '</li>');
            AnimateRotate("ul#ul_list_left_collapsed_" + pageId, 90);

            if (yahui.menuCollapsed) {
                $("div.leftcolumn").hide();
                $("div.leftcolumn_collapsed").show();
                $("div.rightcolumn").css("margin-left", "25px");
            }

            $('#heading_' + myid + '_' + pageId).on("click", function() {
                yahui.menuCollapsed = true;
                storage.set("yahui-menu-collapsed", true);
                $("div.leftcolumn").toggle("slide");
                $("div.leftcolumn_collapsed").toggle("slide");
                $("div.rightcolumn").animate({marginLeft: "25px"});
            });
            $('#heading_collapsed_' + myid + '_' + pageId).on("click", function() {
                yahui.menuCollapsed = false;
                storage.set("yahui-menu-collapsed", false);
                $("div.leftcolumn").toggle("slide");
                $("div.leftcolumn_collapsed").toggle("slide");
                $("div.rightcolumn").animate({marginLeft: "295px"});
            });
            renderMenu(regaObj.TypeName, "ul#ul_list_left_" + pageId, "nopadding");
        }

        var list = $("ul#list_"+pageId);

        var sortOrder = yahui.sortOrder["list_"+pageId];
        var alreadyRendered = [];

        //console.log("renderPage - renderWidgets");
        if (sortOrder) {
            //console.log("SORT "+en)
            for (var j = 0; j < sortOrder.length; j++) {
                sortOrder[j] = parseInt(sortOrder[j], 10);
                if ((regaObj.Channels.indexOf(sortOrder[j])) != -1 && (alreadyRendered.indexOf(sortOrder[j]) == -1)) {
                    renderWidget(list, sortOrder[j], false, pageId);
                    alreadyRendered.push(sortOrder[j]);
                }
            }
        }
        for (var l in regaObj.Channels) {
            var chId = parseInt(regaObj.Channels[l],10);
            if (alreadyRendered.indexOf(chId) == -1) {
                renderWidget(list, chId, false, pageId);
            }
        }
    }

    function AnimateRotate(elem, d){
       /* $({deg: 0}).animate({deg: d}, {
            step: function(now, fx){
                $(elem).css({
                    transform: "rotate(" + now + "deg)"
                });
            }
        });*/
        $(elem).css({
            transform: "rotate(" + 90 + "deg)"
        });
    }

    // Variablen-Erweiterung rendern
    function renderVariables() {
        if (!$("div#variables").html()) {

            var page = '<div id="variables" data-role="page" data-theme="'+settings.swatches.content+'">' +
                '<div data-role="header" data-position="fixed" data-id="f2" data-theme="'+settings.swatches.header+'">' +
                '<a href="#links" data-role="button" data-icon="arrow-l">Erweiterungen</a>' +
                '<h1>Variablen</h1>';
            if (!settings.hideInfoButton) {
                page += '<a href="#info" data-rel="dialog" data-role="button" data-inline="true" data-icon="info" data-iconpos="notext" class="yahui-info ui-btn-right"></a>';
            }

            page += '</div><div data-role="content">' +
                '<ul data-role="listview" id="list_variables" class="yahui-page yahui-sortable"></ul></div></div>';
            body.prepend(page);
            var list = $("ul#list_variables");

            // Alarm-Variablen mitnehmen
            if (regaIndex.ALARMDP) {
                for (var j = 0; j < regaIndex.ALARMDP.length; j++) {
                    regaIndex.VARDP.push(regaIndex.ALARMDP[j]);
                }
            }

            // Alphabetisch sortieren
            regaIndex.VARDP.sort(regaObjectAlphabetically);


            var sortOrder = yahui.sortOrder["list_variables"];
            var alreadyRendered = [];

            //console.log("renderPage - renderWidgets");
            if (sortOrder) {
                //console.log("SORT "+en)
                for (var j = 0; j < sortOrder.length; j++) {
                    sortOrder[j] = parseInt(sortOrder[j], 10);
                    if ((regaIndex.VARDP.indexOf(sortOrder[j])) != -1 && (alreadyRendered.indexOf(sortOrder[j]) == -1)) {
                        renderWidget(list, sortOrder[j], true, '#variables');
                        alreadyRendered.push(sortOrder[j]);
                    }
                }
            }
            for (var l=0; l < regaIndex.VARDP.length; l++) {
                var chId = regaIndex.VARDP[l];
                if (alreadyRendered.indexOf(chId) == -1) {
                    if (chId != 40 && chId != 41 && chId != 69999) {
                        renderWidget(list, chId, true, '#variables');
                    }
                }
            }

        }
    }

    // Service-Meldungs-Erweiterung
    function renderAlarms() {
        if (!$("div#alarms").html()) {
            var page = '<div id="alarms" data-role="page" data-theme="'+settings.swatches.content+'">' +
                '<div data-role="header" data-position="fixed" data-id="f2"  data-theme="'+settings.swatches.header+'">' +
                '<a href="#links" data-role="button" data-icon="arrow-l">Erweiterungen</a>' +
                '<h1>Servicemeldungen</h1>';
            if (!settings.hideInfoButton) {
                page += '<a href="#info" data-rel="dialog" data-role="button" data-inline="true" data-icon="info" data-iconpos="notext" class="yahui-info ui-btn-right"></a>';
            }
            page += '</div><div data-role="content">' +
                '<ul data-role="listview" id="list_alarms" class="yahui-page "></ul></div></div>';
            body.prepend(page);
            var list = $("ul#list_alarms");
            var ALDPs = regaIndex.ALDP;
            for (var i = 0; i < ALDPs.length; i++) {
                if (datapoints[ALDPs[i]][0] == 1) {
                    renderAlarmWidget(list, ALDPs[i], false, "#alarms");
                }
            }

        }
    }



    // Programme-Erweiterung rendern
    function renderPrograms() {
        if (!$("div#programs").html()) {
            var page = '<div id="programs" data-role="page" data-theme="'+settings.swatches.content+'">' +
                '<div data-role="header" data-position="fixed" data-id="f2"  data-theme="'+settings.swatches.header+'">' +
                '<a href="#links" data-role="button" data-icon="arrow-l">Erweiterungen</a>' +
                '<h1>Programme</h1>';
            if (!settings.hideInfoButton) {
                page += '<a href="#info" data-rel="dialog" data-role="button" data-inline="true" data-icon="info" data-iconpos="notext" class="yahui-info ui-btn-right"></a>';
            }
            page += '</div><div data-role="content">' +
                '<ul data-role="listview" id="list_programs" class="yahui-page yahui-sortable"></ul></div></div>';
            body.prepend(page);
            var list = $("ul#list_programs");

            // Alphabetisch sortieren
            regaIndex.PROGRAM.sort(regaObjectAlphabetically);

            var sortOrder = yahui.sortOrder["list_programs"];
            var alreadyRendered = [];

            //console.log("renderPage - renderWidgets");
            if (sortOrder) {
                //console.log("SORT "+en)
                for (var j = 0; j < sortOrder.length; j++) {
                    sortOrder[j] = parseInt(sortOrder[j], 10);
                    if ((regaIndex.PROGRAM.indexOf(sortOrder[j])) != -1 && (alreadyRendered.indexOf(sortOrder[j]) == -1)) {
                        renderWidget(list, sortOrder[j], false, '#programs');
                        alreadyRendered.push(sortOrder[j]);
                    }
                }
            }
            for (var l=0; l < regaIndex.PROGRAM.length; l++) {
                var chId = regaIndex.PROGRAM[l];
                if (alreadyRendered.indexOf(chId) == -1) {
                    renderWidget(list, chId, false, '#programs');
                }
            }

        }
    }

    function renderAlarmWidget(list, id, varEdit, pageId, cb) {
        id = parseInt(id, 10);

        if ($("li.yahui-alarm[data-hm-id='"+id+"']").html()) return;

        var alarm = regaObjects[id];
        var channel = regaObjects[alarm.Parent];
        var device = regaObjects[channel.Parent];

        var parts = alarm.Name.split(".");
        var alarmType = parts[1];
        var alarmText = alarmType;
        if (yahui.stringtable.MAINTENANCE && yahui.stringtable.MAINTENANCE[alarmType] && yahui.stringtable.MAINTENANCE[alarmType].text) {
            alarmText = yahui.stringtable.MAINTENANCE[alarmType].text;
        }

        // Default-Image für Gerät vorhanden?
        var deviceType = device.HssType;
        var img = "images/default/widget.png";
        if (yahui.defaultImages[deviceType]) {
            img = "images/default/"+yahui.defaultImages[deviceType];
        }

        // Zeitstempel
        var alDateSince = formatDate(datapoints[id][1]);
        var alSince = " <span class='yahui-since'>seit <span class='hm-html-alarm-timestamp' data-hm-id='"+id+"'>" + alDateSince + "</span></span>";

        var content = '<li class="yahui-widget yahui-alarm" data-hm-id="'+id+'"><img src="'+img+'" alt="" />' +
            '<div class="yahui-a" data-hm-id="' + id + '">' + device.Name + '</div>';
        if (alarm.Operations & 2) {
            content += '<div class="yahui-b" data-hm-id="' + id + '"><input type="button" value="Bestätigen" id="alarm_'+id+'" data-hm-id="'+id+'" data-inline="true"/></div>';
        } else {
            content += '<div class="yahui-b" data-hm-id="' + id + '"></div>';
        }
        content +=     '<div class="yahui-c" data-hm-id="' + id + '">' + alSince + " " + alarmText + '</div></li>';
        list.append(content);

        $("#alarm_"+id).click(function (e) {
            console.log("alarmReceipt "+parseInt(event.target.dataset.hmId,10))
            yahui.socket.emit("alarmReceipt", parseInt(event.target.dataset.hmId,10));
            $(this).remove();
        });

        if (cb) {
            cb();
        }

    }

    // erzeugt ein Bedien-/Anzeige-Element
    function renderWidget(list, id, varEdit, pageId) {

        //console.log("renderWidget("+list+","+id+","+varEdit+","+pageId+")");
        var el = regaObjects[id];
        var alias = el.Name;
        var visible = true;
        var visibleClass = "visible";

        if (pageId) {
            var optionKey;
            if (pageId == '#variables') {
                optionKey = "#variables_" + id;
            } else if (pageId == '#programs') {
                optionKey = "#programs_" + id;
            } else {
                optionKey = "#page_" + pageId + "_" + id;
            }

            if (yahui.elementOptions[optionKey] && yahui.elementOptions[optionKey].alias) {
                alias = yahui.elementOptions[optionKey].alias;
            }

            if (yahui.elementOptions[optionKey] && yahui.elementOptions[optionKey].visible) {
                if (yahui.inEditMode && yahui.elementOptions[optionKey].visible !== "1") {
                    // ausgrauen
                    visibleClass = "edit_invisible";
                } else if (yahui.elementOptions[optionKey].visible !== "1") {
                    // verstecken
                    visibleClass = "invisible";
                }
            }
        }

        var since = "";
        var lowbat = "";
        var unreach = "";
        var elId = list.attr("id") + "_" + id;

        var img, defimg = "images/default/widget.png";
        if (yahui.images[id]) {
            img = "images/user/" + yahui.images[id];
        }
        // Um was handelt es sich?
        switch (el.TypeName) {
        case "CHANNEL":
            if (el.DPs && el.DPs.LOWBAT && datapoints[el.DPs.LOWBAT].Value) {
                lowbat = '<img data-hm-servicemsg="'+el.DPs.LOWBAT+'" class="yahui-lowbat" src="images/default/lowbat.png" alt="Batteriekapazität niedrig" title="Batteriekapazität niedrig"/>';
            }

            if (regaObjects[el.Parent].Channels && regaObjects[el.Parent].Channels[0]) {
                var serviceChannel = regaObjects[regaObjects[el.Parent].Channels[0]];
                if (serviceChannel && serviceChannel.ALDPs) {
                    var unreach = false;
                    for (var alarmDp in serviceChannel.ALDPs) {
                        if (datapoints[serviceChannel.ALDPs[alarmDp]]) {
                            if (datapoints[serviceChannel.ALDPs[alarmDp]][0] == 1) {
                                var msgVisible = "";
                            } else {
                                var msgVisible = "display:none";
                            }

                            switch (alarmDp) {
                                case "LOWBAT":
                                    lowbat += '<img style="'+msgVisible+'" data-hm-servicemsg="'+serviceChannel.ALDPs[alarmDp]+'" class="yahui-lowbat" src="images/default/lowbat.png" alt="Gerätekommunikation gestört" title="Gerätekommunikation gestört"/>';
                                    break;
                                case "UNREACH":
                                    lowbat += '<img style="'+msgVisible+'" data-hm-servicemsg="'+serviceChannel.ALDPs[alarmDp]+'" class="yahui-lowbat" src="images/default/unreach.png" alt="Gerätekommunikation gestört" title="Gerätekommunikation gestört"/>';
                                    break;
                                default:
                                    lowbat += '<img style="'+msgVisible+'" data-hm-servicemsg="'+serviceChannel.ALDPs[alarmDp]+'" class="yahui-lowbat" src="images/default/warning.png" alt="'+alarmDp+'" title="'+alarmDp+'"/>';
                            }
                        }
                    }
                }
            }

            // Default-Image für Gerät vorhanden?
            var deviceType = regaObjects[el.Parent].HssType;
            if (yahui.defaultImages[deviceType]) {
                defimg = "images/default/"+yahui.defaultImages[deviceType];
            }
            var chanVarsRendered = false;

            switch (el.HssType) {
                case "HUE_DIMMABLE_LIGHT":
                case "HUE_DIMMABLE_PLUG-IN_UNIT":
                    img = (img ? img : defimg);
                    var stateId = regaObjects[id].DPs.STATE;
                    var levelId = regaObjects[id].DPs.LEVEL;
                    var unreachId = regaObjects[id].DPs.UNREACH;
                    var msgVisible = "";
                    if (!datapoints[unreachId][0]) {
                        msgVisible="display:none;";
                    }
                    lowbat = '<img style="'+msgVisible+'" data-hm-servicemsg="'+unreachId+'" class="yahui-lowbat" src="images/default/unreach.png" alt="Gerätekommunikation gestört" title="Gerätekommunikation gestört"/>';
                    content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" />' +
                        '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                        '<div class="yahui-b">' +
                        '<select class="hue-switch" id="hueswitch_'+elId+'_STATE" data-hm-id="'+stateId+'" name="switch_'+elId+'" data-role="slider">' +
                        '<option value="false">Aus</option>' +
                        '<option value="true"'+((datapoints[stateId][0] !== "false" && datapoints[stateId][0] !== false) ?' selected':'')+'>An</option>' +
                        '</select> ' + lowbat;
                    content += '</div><div class="yahui-c">' +
                        '<input class="" id="slider_'+elId+'_LEVEL" type="range" data-hm-factor="1" data-hm-id="'+levelId +
                        '" name="slider_'+elId+'" min="0" max="255" value="'+(datapoints[levelId][0])+'"/>' +
                        '</div></li>';
                    list.append(content);
                    setTimeout(function () {
                        $("[id^='slider_"+elId+"_']").on( 'slidestop', function( event ) {
                            yahui.socket.emit("setState", [parseInt(event.target.dataset.hmId,10), parseInt(event.target.value,10)]);
                        });
                        $("[id^='hueswitch_"+elId+"_']").on( 'slidestop', function( event ) {
                            yahui.socket.emit("setState", [parseInt(event.target.dataset.hmId,10), (event.target.value == "true" ? true : false)]);
                        });
                    }, 500);
                    break;
                case "HUE_COLOR_LIGHT":
                    img = (img ? img : defimg);
                    var stateId = regaObjects[id].DPs.STATE;
                    var levelId = regaObjects[id].DPs.LEVEL;
                    var unreachId = regaObjects[id].DPs.UNREACH;
                    var hueId = regaObjects[id].DPs.HUE;
                    var satId = regaObjects[id].DPs.SAT;
                    var unreachId = regaObjects[id].DPs.UNREACH;
                    var msgVisible = "";
                    if (!datapoints[unreachId][0]) {
                        msgVisible="display:none;";
                    }
                    lowbat = '<img style="'+msgVisible+'" data-hm-servicemsg="'+unreachId+'" class="yahui-lowbat" src="images/default/unreach.png" alt="Gerätekommunikation gestört" title="Gerätekommunikation gestört"/>';
                    content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" />' +
                        '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                        '<div class="yahui-b">' +
                        '<select class="hue-switch" id="hueswitch_'+elId+'_STATE" data-hm-id="'+stateId+'" name="switch_'+elId+'" data-role="slider">' +
                        '<option value="false">Aus</option>' +
                        '<option value="true"'+((datapoints[stateId][0] != "false") ?' selected':'')+'>An</option>' +
                        '</select> ' + lowbat;
                    content += '</div><div class="yahui-c">' +
                        'Helligkeit<input id="slider_'+elId+'_LEVEL" type="range" data-hm-factor="1" data-hm-id="'+levelId +
                        '" name="slider_'+elId+'" min="0" max="255" value="'+(datapoints[levelId][0])+'"/><br/>' +
                        'Sättigung<input id="slider_'+elId+'_SAT" type="range" data-hm-factor="1" data-hm-id="'+satId +
                        '" name="slider_'+elId+'_SAT" min="0" max="255" value="'+(datapoints[satId][0]*100)+'"/><br/>' +
                        '<div class="yahui-slider-hue">Farbe'+
                        '<input id="slider_'+elId+'_HUE" type="range" data-hm-factor="1" data-hm-id="'+hueId +
                        '" name="slider_'+elId+'_HUE"  min="0" max="65535" value="'+(datapoints[hueId][0]*100)+'"/></div></div></li>';
                    list.append(content);
                    setTimeout(function () {
                        $("[id^='slider_"+elId+"_']").on( 'slidestop', function( event ) {

                            yahui.socket.emit("setState", [parseInt(event.target.dataset.hmId,10), parseInt(event.target.value,10)]);
                        });
                        $("[id^='hueswitch_"+elId+"_']").on( 'slidestop', function( event ) {
                            yahui.socket.emit("setState", [parseInt(event.target.dataset.hmId,10), (event.target.value == "true" ? true : false)]);
                        });
                    }, 750);
                    break;
                case "HUE_EXTENDED_COLOR_LIGHT":
                    img = (img ? img : defimg);
                    var stateId = regaObjects[id].DPs.STATE;
                    var levelId = regaObjects[id].DPs.LEVEL;
                    var ctId = regaObjects[id].DPs.CT;
                    var hueId = regaObjects[id].DPs.HUE;
                    var satId = regaObjects[id].DPs.SAT;
                    var colormodeId = regaObjects[id].DPs.COLORMODE;

                    var unreachId = regaObjects[id].DPs.UNREACH;
                    var msgVisible = "";
                    if (!datapoints[unreachId][0]) {
                        msgVisible="display:none;";
                    }
                    lowbat = '<img style="'+msgVisible+'" data-hm-servicemsg="'+unreachId+'" class="yahui-lowbat" src="images/default/unreach.png" alt="Gerätekommunikation gestört" title="Gerätekommunikation gestört"/>';
                    content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" />' +
                        '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                        '<div class="yahui-b">' +
                        '<select class="hue-switch" id="hueswitch_'+elId+'_STATE" data-hm-id="'+stateId+'" name="switch_'+elId+'" data-role="slider">' +
                        '<option value="false">Aus</option>' +
                        '<option value="true"'+((datapoints[stateId][0] !== "false" && datapoints[stateId][0] !== false) ?' selected':'')+'>An</option>' +
                        '</select> ' +
                        '<select class="hue-switch" id="hueswitch_'+elId+'_COLORMODE" data-hm-id="'+colormodeId+'" name="switch_'+elId+'" data-role="slider">' +
                        '<option value="ct">Weiss</option>' +
                        '<option value="hs"'+((datapoints[colormodeId][0] == "hs") ?' selected':'')+'>Farbe</option>' +
                        '</select>'+lowbat;
                    content += '</div><div class="yahui-c">' +
                        'Helligkeit<input id="slider_'+elId+'_LEVEL" type="range" data-hm-factor="1" data-hm-id="'+levelId +
                        '" name="slider_'+elId+'" min="0" max="255" value="'+(datapoints[levelId][0])+'"/><br/>' +
                        '<div style="'+((datapoints[colormodeId][0] == "ct") ? "" : "display:none")+'" id="'+elId+'_CT"><div>Farbtemperatur'+
                        '<div class="yahui-slider-ct"><input class="yahui-slider-ct" id="slider_'+elId+'_CT" type="range" data-hm-factor="1" data-hm-id="'+ctId +
                        '" name="slider_'+elId+'_CT"  min="153" max="500" value="'+(datapoints[ctId][0])+'"/></div></div><br/></div>' +
                        '<div style="'+((datapoints[colormodeId][0] == "ct") ? "display:none" : "")+'" id="'+elId+'_HS">Sättigung'+
                        '<input id="slider_'+elId+'_SAT" type="range" data-hm-factor="1" data-hm-id="'+satId +
                        '" name="slider_'+elId+'_SAT" min="0" max="255" value="'+(datapoints[satId][0]*100)+'"/><br/>' +
                        '<div class="yahui-slider-hue">Farbe'+
                        '<input id="slider_'+elId+'_HUE" type="range" data-hm-factor="1" data-hm-id="'+hueId +
                        '" name="slider_'+elId+'_HUE"  min="0" max="65535" value="'+(datapoints[hueId][0]*100)+'"/></div></div></div></li>';

                    list.append(content);
                    setTimeout(function () {
                        $("[id^='slider_"+elId+"_']").on( 'slidestop', function( event ) {
                            yahui.socket.emit("setState", [parseInt(event.target.dataset.hmId,10), parseInt(event.target.value,10)]);
                        });
                        $("[id^='hueswitch_"+elId+"_']").on( 'slidestop', function( event ) {
                            yahui.socket.emit("setState", [parseInt(event.target.dataset.hmId,10), event.target.value]);
                            if (event.target.value == "ct") {
                                $("#"+elId+"_CT").show();
                                $("#"+elId+"_HS").hide();
                            } else if (event.target.value == "hs") {
                                $("#"+elId+"_CT").hide();
                                $("#"+elId+"_HS").show();
                            }
                        });
                    }, 750);
                    break;
                case "DIMMER":
                    img = (img ? img : defimg);
                    var levelId = regaObjects[id].DPs.LEVEL;
                    var workingId = regaObjects[id].DPs.WORKING;
                    var directionId = regaObjects[id].DPs.DIRECTION;
                    content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                        '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                        '<div class="yahui-b" data-hm-id="' + id + '">' +
                        '<select id="switch_'+elId+'" data-hm-id="'+levelId+'" name="switch_'+elId+'" data-role="slider">' +
                        '<option value="0">Aus</option>' +
                        '<option value="1"'+((datapoints[levelId][0] != 0) ?' selected':'')+'>An</option>' +
                        '</select>'+lowbat;

                    if (directionId) {
                        content += '<span style="display:none;" data-hm-id="'+directionId+'" data-hm-state="1" class="ui-icon ui-icon-arrow-u ui-icon-shadow yahui-direction">&nbsp;</span>' +
                            '<span style="display:none;" data-hm-id="'+directionId+'" data-hm-state="2" class="ui-icon ui-icon-arrow-d ui-icon-shadow yahui-direction">&nbsp;</span>';
                    } else if (workingId) {
                        content += '<span style="display:none;" data-hm-id="'+workingId+'" data-hm-state="true" class="ui-icon ui-icon-refresh ui-icon-shadow yahui-direction">&nbsp;</span>';
                    }
                    content += '</div><div class="yahui-c" data-hm-id="' + id + '">' +
                        '<input id="'+elId+'" type="range" data-hm-factor="100" data-hm-id="'+levelId +
                        '" name="slider_'+elId+'" id="slider_'+elId+'" min="0" max="100" value="'+(datapoints[levelId][0]*100)+'"/></div></li>';
                    list.append(content);
                    setTimeout(function () {
                        $("#"+elId).on( 'slidestop', function( event ) {
                            //console.log("slide "+event.target.value / (event.target.dataset.hmFactor?event.target.dataset.hmFactor:1)+" "+event.target.dataset.hmId);
                            yahui.socket.emit("setState", [parseInt(event.target.dataset.hmId,10), event.target.value / (event.target.dataset.hmFactor?event.target.dataset.hmFactor:1)]);
                        });
                        $("#switch_"+elId).on( 'slidestop', function( event ) {
                            //console.log("slide "+event.target.value+" "+event.target.dataset.hmId);
                            yahui.socket.emit("setState", [parseInt(event.target.dataset.hmId,10), parseInt(event.target.value,10)]);
                        });
                    }, 500);
                    break;
                case "BLIND":
                    img = (img ? img : defimg);
                    var levelId = regaObjects[id].DPs.LEVEL;
                    var workingId = regaObjects[id].DPs.WORKING;
                    var directionId = regaObjects[id].DPs.DIRECTION;
                    content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                        '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                        '<div class="yahui-b" data-hm-id="' + id + '"><select id="switch_'+elId+'" data-hm-id="'+levelId+'" name="switch_state" data-role="slider">' +
                        '<option value="0">Zu</option>' +
                        '<option value="1"'+((datapoints[levelId][0] != 0) ?' selected':'')+'>Auf</option>' +
                        '</select>';
                    if (directionId) {
                        content += '<span style="display:none;" data-hm-id="'+directionId+'" data-hm-state="1" class="ui-icon ui-icon-arrow-u ui-icon-shadow yahui-direction">&nbsp;</span>' +
                            '<span style="display:none;" data-hm-id="'+directionId+'" data-hm-state="2" class="ui-icon ui-icon-arrow-d ui-icon-shadow yahui-direction">&nbsp;</span>';
                    } else if (workingId) {
                        content += '<span style="display:none;" data-hm-id="'+workingId+'" data-hm-state="true" class="ui-icon ui-icon-refresh ui-icon-shadow yahui-direction">&nbsp;</span>';
                    }
                    content += '</div><div class="yahui-c" data-hm-id="' + id + '">' +
                        '<input type="range" data-hm-factor="100" data-hm-id="'+levelId +
                        '" name="slider-1" id="'+elId+'" min="0" max="100" value="'+(datapoints[levelId][0]*100)+'"/></div></li>';

                    list.append(content);

                    setTimeout(function () {
                        $("#"+elId).on( 'slidestop', function( event ) {
                            //console.log("slide "+event.target.value / (event.target.dataset.hmFactor?event.target.dataset.hmFactor:1)+" "+event.target.dataset.hmId);
                            yahui.socket.emit("setState", [parseInt(event.target.dataset.hmId,10), event.target.value / (event.target.dataset.hmFactor?event.target.dataset.hmFactor:1)]);
                        });
                        $("#switch_"+elId).on( 'slidestop', function( event ) {
                            //console.log("slide "+event.target.value+" "+event.target.dataset.hmId);
                            yahui.socket.emit("setState", [parseInt(event.target.dataset.hmId,10), parseInt(event.target.value,10)]);
                        });
                    }, 500);
                    break;
                case "KEY":
                    // 16-Fach LED Anzeige
                    if (el.Parent && regaObjects[el.Parent] && regaObjects[el.Parent].HssType == "HM-OU-LED16") {
                        var textPressShort = settings.defaultPressShort;
                        var ledstatusId = el.DPs.LED_STATUS;
                        if (yahui.elementOptions[optionKey] && yahui.elementOptions[optionKey].textPressShort) {
                            textPressShort = yahui.elementOptions[optionKey].textPressShort;
                        }
                        img = (img ? img : defimg);
                        var shortId = regaObjects[id].DPs.PRESS_SHORT;
                        content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                            '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                            '<div class="yahui-b" data-hm-id="' + id + '">' +
                            '<input type="button" data-hm-id="'+shortId+'" id="press_short_'+elId+'" name="press_short_'+id+'" value="'+textPressShort+'" data-inline="true"/> ' +
                            lowbat +
                            '</div><div class="yahui-c">' +
                            '<div data-hm-id="'+ledstatusId+'" id="led16_'+elId+'" class="led16 led16-'+datapoints[ledstatusId][0]+'"></div>' +
                            '</div></li>';
                        list.append(content);
                        $("#press_short_"+elId).click(function (e) {
                            //console.log("press short "+id);
                            yahui.socket.emit("setState", [parseInt(event.target.dataset.hmId,10), true]);
                        });
                        break;
                    }
                case "VIRTUAL_KEY":
                    var textPressShort = settings.defaultPressShort;
                    var textPressLong = settings.defaultPressLong;
                    if (yahui.elementOptions[optionKey] && yahui.elementOptions[optionKey].textPressShort) {
                        textPressShort = yahui.elementOptions[optionKey].textPressShort;
                    }
                    if (yahui.elementOptions[optionKey] && yahui.elementOptions[optionKey].textPressLong) {
                        textPressLong = yahui.elementOptions[optionKey].textPressLong;
                    }
                    if (!settings.hideKeys) {
                        img = (img ? img : defimg);
                        var shortId = regaObjects[id].DPs.PRESS_SHORT;
                        var longId = regaObjects[id].DPs.PRESS_LONG;
                        content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                            '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                            '<div class="yahui-b" data-hm-id="' + id + '">' +
                            '<input type="button" data-hm-id="'+shortId+'" id="press_short_'+elId+'" name="press_short_'+id+'" value="'+textPressShort+'" data-inline="true"/> ' +
                            '<input type="button" data-hm-id="'+longId+'" id="press_long_'+elId+'" name="press_long_'+id+'" value="'+textPressLong+'" data-inline="true"/>' +
                            lowbat +
                            '</div></li>';
                        list.append(content);
                        $("#press_long_"+elId).on('buttoncreate', function () {
                            if (yahui.elementOptions[optionKey] && yahui.elementOptions[optionKey].hidePressLong) {
                                $("#press_long_"+elId).parent().hide();
                            }
                        });
                        $("#press_short_"+elId).click(function (e) {
                            //console.log("press short "+id);
                            yahui.socket.emit("setState", [parseInt(event.target.dataset.hmId,10), true]);
                        });
                        $("#press_long_"+elId).click(function (e) {
                            //console.log("press long "+id);
                            yahui.socket.emit("setState", [parseInt(event.target.dataset.hmId,10), true]);
                        });
                    }
                    break;
                case "RAINDETECTOR_HEAT":
                case "ALARMACTUATOR":
                case "SWITCH":
                case "DIGITAL_OUTPUT":
                case "DIGITAL_ANALOG_OUTPUT":
                    img = (img ? img : defimg);
                    var stateId = regaObjects[id].DPs.STATE;
                    content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                        '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                        '<div class="yahui-b" data-hm-id="' + id + '">' +
 
                        '<select id="switch_'+elId+'" data-hm-id="'+stateId+'" name="switch_'+elId+'" data-role="slider">' +
                        '<option value="0">Aus</option>' +
                        '<option value="1"'+((datapoints[stateId][0] != 0) ? ' selected' : '')+'>An</option>' +
                        '</select>' +
                        lowbat +
                        '</div></li>';
                    list.append(content);
                    setTimeout(function () {
                        $("#switch_"+elId).on( 'slidestop', function( event ) {
                            //console.log("slide "+event.target.value+" "+event.target.dataset.hmId);
                            yahui.socket.emit("setState", [parseInt(event.target.dataset.hmId,10), parseInt(event.target.value,10)]);
                        });
                    }, 500);
                    break;
                case "KEYMATIC":
                    img = (img ? img : defimg);
                    var stateId = regaObjects[id].DPs.STATE;
                    var openId = regaObjects[id].DPs.OPEN;
                    var uncertainId = regaObjects[id].DPs.STATE_UNCERTAIN;
                    content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                        '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                        '<div class="yahui-b" data-hm-id="' + id + '">' +

                        '<table><tr><td><select id="switch_'+elId+'" data-hm-id="'+stateId+'" name="switch_'+elId+'" data-role="slider">' +
                        '<option value="0">Zu</option>' +
                        '<option value="1"'+((datapoints[stateId][0] != 0) ? ' selected' : '')+'>Auf</option>' +
                        '</select></td>' +
                        '<td><input type="button" data-hm-id="'+openId+'" id="open_'+elId+'" name="open_'+id+'" value="Öffnen" data-inline="true"/></td></tr></table>' +lowbat +
                        '</div><div class="yahui-c" data-hm-id="' + id + '">' +
                        '<span class="yahui-since">' +
                        '<span data-hm-true="Zustand unbestimmt" data-hm-false="" data-hm-id="'+openId+'" class="hm-html">'+(datapoints[openId][0]?"Zustand unbestimmt":"")+'</span></span>' +'</div>' +
                        '</li>';
                    list.append(content);
                    setTimeout(function () {
                        $("#switch_"+elId).on( 'slidestop', function( event ) {
                            //console.log("slide "+event.target.value+" "+event.target.dataset.hmId);
                            yahui.socket.emit("setState", [parseInt(event.target.dataset.hmId,10), parseInt(event.target.value,10)]);
                        });
                        $("#open_"+elId).click(function (e) {
                            //console.log("press short "+id);
                            yahui.socket.emit("setState", [parseInt(event.target.dataset.hmId,10), true]);
                        });
                    }, 500);
                    break;
                case "MOTION_DETECTOR":
                    if (!datapoints[el.DPs.MOTION]) {
                        break;
                    }
                    // Datum formatieren
                    var dateSince;
                    if (datapoints[el.DPs.MOTION] && datapoints[el.DPs.MOTION][3]) {
                        dateSince = formatDate(datapoints[el.DPs.MOTION][3]);
                    }
                    if (dateSince) {
                        since = " <span class='yahui-since'>seit <span class='hm-html-timestamp' data-hm-id='"+el.DPs.MOTION+"'>" + dateSince + "</span></span>";
                    }
                    img = (img ? img : defimg);
                    content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                        '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                        '<div class="yahui-b" data-hm-id="' + id + '">' + lowbat +
                        '</div><div class="yahui-c" data-hm-id="' + id + '"><h3>' +
                        '<span style="'+(datapoints[el.DPs.MOTION][0]?'display:none':'')+'" data-hm-id="'+el.DPs.MOTION+'" data-hm-state="false" style="">keine Bewegung</span>' +
                        '<span style="'+(datapoints[el.DPs.MOTION][0]?'':'display:none')+'" data-hm-id="'+el.DPs.MOTION+'" data-hm-state="true" style="">Bewegung</span>' +
                        since +
                        '</h3><p>Helligkeit: ' + datapoints[el.DPs.BRIGHTNESS][0] +
                        '</p></div></li>';
                    list.append(content);
                    break;
                case "CLIMATECONTROL_VENT_DRIVE":
                    img = (img ? img : defimg);
                    //since = " <span class='yahui-since'>seit <span class='hm-html-timestamp' data-hm-id='"+el.DPs.VALVE_STATE+"'>"+datapoints[el.DPs.VALVE_STATE][1]+"</span></span>";
                    content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                        '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                        '<div class="yahui-b" data-hm-id="' + id + '">' + lowbat +
                        '</div><div class="yahui-c" data-hm-id="' + id + '"><h3>' +
                        '<span style="" data-hm-id="'+el.DPs.VALVE_STATE+'" class="hm-html">'+datapoints[el.DPs.VALVE_STATE][0]+'</span>' +
                        regaObjects[el.DPs.VALVE_STATE].ValueUnit +
                        //since +
                        '</h3></div></li>';
                    list.append(content);
                    break;
                case "CLIMATECONTROL_REGULATOR":
                    img = (img ? img : defimg);
                    //since = " <span class='yahui-since'>seit <span class='hm-html-timestamp' data-hm-id='"+el.DPs.VALVE_STATE+"'>"+datapoints[el.DPs.VALVE_STATE][1]+"</span></span>";
                    if (regaObjects[el.DPs.SETPOINT] && regaObjects[el.DPs.SETPOINT].ValueUnit && regaObjects[el.DPs.SETPOINT].ValueUnit !== "°C" && regaObjects[el.DPs.SETPOINT].ValueUnit.match(/C$/)) {
                        regaObjects[el.DPs.SETPOINT].ValueUnit = "°C";
                    }
                    content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                        '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                        '<div class="yahui-b" data-hm-id="' + id + '">' + lowbat +
                        '</div><div class="yahui-c" data-hm-id="' + id + '">' +
                        '<div style="display: inline-block; width: 70px;">' +
                        '<input id="input_'+id+'" size="3" type="number" pattern="[0-9\.]*" data-mini="false" class="hm-val" data-hm-id="'+el.DPs.SETPOINT+'" value="'+datapoints[el.DPs.SETPOINT][0]+'"  />' +
                        '</div> '+
                        regaObjects[el.DPs.SETPOINT].ValueUnit;
                    if (el.DPs.STATE) {
                        // CUxD Thermostat Wrapper
                        content += '<br/><span class="yahui-since"><span data-hm-true="An" data-hm-false="Aus" data-hm-id="'+el.DPs.STATE+'" class="hm-html">'+(datapoints[el.DPs.STATE][0] ? "An" : "Aus")+'</span>';
                    }
                    content += '</div></li>';
                    list.append(content);
                    setTimeout(function () {
                        $("#input_"+id).change(function( event ) {
                            //console.log("input "+event.target.value+" "+event.target.dataset.hmId);
                            var val = $("#input_"+id).val();
                            var dpId = event.target.dataset.hmId;
                            //console.log("setState"+JSON.stringify([dpId, val]));
                            yahui.socket.emit("setState", [dpId, val]);
                        });
                    }, 500);
                    break;
                case "CLIMATECONTROL_RT_TRANSCEIVER":
                    img = (img ? img : defimg);
                    var controlMode = el.DPs.CONTROL_MODE;
                    if (regaObjects[el.DPs.SET_TEMPERATURE].ValueUnit !== "°C" && regaObjects[el.DPs.SET_TEMPERATURE].ValueUnit.match(/C$/)) {
                        regaObjects[el.DPs.SET_TEMPERATURE].ValueUnit = "°C";
                    }
                    if (regaObjects[el.DPs.ACTUAL_TEMPERATURE].ValueUnit !== "°C" && regaObjects[el.DPs.ACTUAL_TEMPERATURE].ValueUnit.match(/C$/)) {
                        regaObjects[el.DPs.ACTUAL_TEMPERATURE].ValueUnit = "°C";
                    }
                    content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                        '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                        '<div class="yahui-b" data-hm-id="' + id + '">' +
                        '<span style="display:inline-block; padding-right: 16px;"><select id="select_'+elId+'" data-hm-id="'+controlMode+'">';
                    var valueList = regaObjects[controlMode].ValueList.split(";");
                    for (var i = 0; i < valueList.length; i++) {
                        if (datapoints[controlMode][0] == i) {
                            selected = " selected";
                        } else {
                            selected = "";
                        }
                        content += '<option value="'+i+'"'+selected+'>'+valueList[i]+'</option>';
                    }
                    content += '</select></span>' +
                        lowbat +
                        '</div><div class="yahui-c" data-hm-id="' + id + '">' +
                        '<div style="display: inline-block; width: 70px;">' +
                        '<input id="input_'+id+'" size="3" type="number" pattern="[0-9\.]*" data-mini="false" class="hm-val" data-hm-id="'+el.DPs.SET_TEMPERATURE+'" value="'+datapoints[el.DPs.SET_TEMPERATURE][0]+'"  />' +
                        '</div> '+ regaObjects[el.DPs.SET_TEMPERATURE].ValueUnit +
                        '<span style="padding-left:16px;">Ist: <span data-hm-id="'+el.DPs.ACTUAL_TEMPERATURE+'" class="hm-html">'+datapoints[el.DPs.ACTUAL_TEMPERATURE][0]+'</span>'+regaObjects[el.DPs.ACTUAL_TEMPERATURE].ValueUnit+'</span>';
                    if (el.DPs.VALVE_STATE) {
                        content += '<span style="padding-left:16px;">Ventil: <span data-hm-id="'+el.DPs.VALVE_STATE+'" class="hm-html">'+datapoints[el.DPs.VALVE_STATE][0]+'</span>'+regaObjects[el.DPs.VALVE_STATE].ValueUnit+'</span>';
                    }

                    content += '</div></li>';
                    list.append(content);
                    setTimeout(function () {
                        $("#input_"+id).change(function( event ) {
                            var val = $("#input_"+id).val();
                            var mode = parseInt($("#select_"+elId+" option:selected").val(), 10);
                            if (mode == 1) {
                                yahui.socket.emit("setState", [el.DPs.MANU_MODE, val]);
                            } else {
                                yahui.socket.emit("setState", [el.DPs.SET_TEMPERATURE, val]);
                            }
                        });
                        $("#select_"+elId).on( 'change', function( event ) {
                            var val = parseInt($("#select_"+elId+" option:selected").val(), 10);
                            var setTemperature = $("#input_"+id).val();
                            switch (val) {
                                case 0:
                                    yahui.socket.emit("setState", [el.DPs.AUTO_MODE, true]);
                                    break;
                                case 1:
                                    yahui.socket.emit("setState", [el.DPs.MANU_MODE, setTemperature]);
                                    break;
                                case 2:
                                    yahui.socket.emit("setState", [el.DPs.PARTY_MODE, setTemperature]);
                                    break;
                                case 3:
                                    yahui.socket.emit("setState", [el.DPs.BOOST_MODE, true]);
                                    break;
                            }
                        });
                    }, 500);
                    break;
                case "WINDOW_SWITCH_RECEIVER":
                    break;
                case "WEATHER":
                    img = (img ? img : defimg);

                    // Workaround für Encoding-Problem in Zusammenspiel mit der "RCU" (CCU2 Firmware auf RaspberryPi)
                    if (regaObjects[el.DPs.TEMPERATURE].ValueUnit !== "°C" && regaObjects[el.DPs.TEMPERATURE].ValueUnit.match(/C$/)) {
                        regaObjects[el.DPs.TEMPERATURE].ValueUnit = "°C";
                    }

                    if (regaObjects[el.Parent].HssType == "HM-WDS100-C6-O") {

                        // OC3

                        content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                            '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                            '<div class="yahui-b" data-hm-id="' + id + '" style="font-size:12px"><span style="display: inline-block; padding-top:5px;">' + el.HssType +
                            lowbat +
                            '</div><div class="yahui-c" data-hm-id="' + id + '"><table class="yahui-datapoints">';
                        for (var dp in regaObjects[id].DPs) {

                            var dpId = regaObjects[id].DPs[dp];
                            var val = datapoints[dpId][0];
                            var unit = regaObjects[dpId].ValueUnit;

                            if (regaObjects[dpId].ValueType === 16 && regaObjects[dpId].ValueList && regaObjects[dpId].ValueList.match(/;/)) {
                                var valList = regaObjects[dpId].ValueList.split(";");
                                val = valList[val];
                            }

                            // Meter-Datenpunkt auf 3-Nachkommastellen formatieren.
                            if (regaObjects[dpId].Name && regaObjects[dpId].Name.match(/\.METER$/)) {
                                val = val.toFixed(3);
                            }

                            if (regaObjects[dpId].ValueUnit && regaObjects[dpId].ValueUnit == "100%") {
                                unit = "%";
                                val = (val * 100).toFixed(1);
                            }

                            if (regaObjects[dpId].Name && regaObjects[dpId].Name.match(/\./)) {
                                var tmpArr = regaObjects[dpId].Name.split(".");
                                var dpType = tmpArr[2];
                            } else {
                                dpType = "UNKNOWN";
                            }

                            if (!settings.hideDatapoints[dpType]) {
                                content += "<tr><td>"+dp+"</td><td><span class='hm-html' data-hm-id='"+dpId+"'>"+val+"</span>"+unit+"</td></tr>";
                            }
                        }
                        content += "</table></div></li>";

                    } else {
                        content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                            '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                            '<div class="yahui-b" data-hm-id="' + id + '">' + lowbat +
                            '</div><div class="yahui-c" data-hm-id="' + id + '"><h3>' +
                            '<span style="" data-hm-id="'+el.DPs.TEMPERATURE+'" class="hm-html">'+datapoints[el.DPs.TEMPERATURE][0]+'</span>' +
                            regaObjects[el.DPs.TEMPERATURE].ValueUnit;
                        if (el.DPs.TEMP_MIN_24H && el.DPs.TEMP_MAX_24H && !settings.hideDatapoints.TEMP_MIN_24H) {
                            content += ' <span class="yahui-since">(24h min <span data-hm-id="'+el.DPs.TEMP_MIN_24H+'" class="hm-html">'+datapoints[el.DPs.TEMP_MIN_24H][0]+'</span>' +
                                regaObjects[el.DPs.TEMP_MIN_24H].ValueUnit +
                                ' max <span data-hm-id="'+el.DPs.TEMP_MAX_24H+'" class="hm-html">'+datapoints[el.DPs.TEMP_MAX_24H][0]+'</span>' +
                                regaObjects[el.DPs.TEMP_MAX_24H].ValueUnit +
                                ')</span>';
                        }
                        content += '</h3><p>';
                        if (el.DPs.HUMIDITY) {
                            content += 'Luftfeuchte: <span style="" data-hm-id="'+el.DPs.HUMIDITY+'" class="hm-html">' + datapoints[el.DPs.HUMIDITY][0] +
                                '</span>' + regaObjects[el.DPs.HUMIDITY].ValueUnit;
                        }
                        if (el.DPs.ABS_HUMIDITY && !settings.hideDatapoints.ABS_HUMIDITY) {
                            content += ', <span style="" data-hm-id="'+el.DPs.ABS_HUMIDITY+'" class="hm-html">'+datapoints[el.DPs.ABS_HUMIDITY][0]+'</span>' + regaObjects[el.DPs.ABS_HUMIDITY].ValueUnit ;
                        }
                        if (el.DPs.HUM_MIN_24H && !settings.hideDatapoints.HUM_MIN_24H) {
                            content += ' (24h min <span style="" data-hm-id="'+el.DPs.HUM_MIN_24H+'" class="hm-html">'+datapoints[el.DPs.HUM_MIN_24H][0]+'</span>' + regaObjects[el.DPs.HUM_MIN_24H].ValueUnit;
                            content += ' max <span style="" data-hm-id="'+el.DPs.HUM_MAX_24H+'" class="hm-html">'+datapoints[el.DPs.HUM_MAX_24H][0]+'</span>' + regaObjects[el.DPs.HUM_MAX_24H].ValueUnit + ')<br/>';
                        }
                        if (el.DPs.DEW_POINT && !settings.hideDatapoints.DEWPOINT) {
                            if (!el.DPs.HUM_MIN_24H || settings.hideDatapoints.HUM_MIN_24H) {
                                content += ', ';
                            }
                            content += 'Taupunkt: <span style="" data-hm-id="'+el.DPs.DEW_POINT+'" class="hm-html">' + datapoints[el.DPs.DEW_POINT][0] +
                                '</span>'+regaObjects[el.DPs.DEW_POINT].ValueUnit;
                        }
                        content += '</p></div></li>';

                    }

                    list.append(content);
                    break;
                case "SMOKE_DETECTOR":
                case "SMOKE_DETECTOR_TEAM":
                    //since = " <span class='yahui-since'>seit <span class='hm-html-timestamp' data-hm-id='"+el.DPs.STATE+"'>"+datapoints[el.DPs.STATE][1]+"</span></span>";
                    img = (img ? img : defimg);
                    var smokeState;
                    if (el.DPs && el.DPs.STATE && datapoints[el.DPs.STATE]) {
                        smokeState = datapoints[el.DPs.STATE][0];
                        content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                            '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                            '<div class="yahui-b" data-hm-id="' + id + '">' + lowbat +
                            '</div><div class="yahui-c" data-hm-id="' + id + '"><h3>' +
                            '<span style="color: #080; '+(smokeState?'display:none':'')+'" data-hm-id="'+el.DPs.STATE+'" data-hm-state="false">kein Rauch erkannt</span>' +
                            '<span style="color: #c00; '+(smokeState?'':'display:none')+'" data-hm-id="'+el.DPs.STATE+'" data-hm-state="true">Alarm</span>' +
                            //since +
                            '</h3></div></li>';
                        list.append(content);
                    }

                    break;

                case "PING":
                    var dateSince;
                    if (!el.DPs.STATE && el.DPs.ALIVE) {
                        el.DPs.STATE = el.DPs.ALIVE;
                    }
                    // Datum formatieren
                    if (datapoints[el.DPs.STATE] && datapoints[el.DPs.STATE][3]) {
                        dateSince = formatDate(datapoints[el.DPs.STATE][3]);
                    }
                    if (dateSince) {
                        since = " <span class='yahui-since'>seit <span class='hm-html-timestamp' data-hm-id='"+el.DPs.STATE+"'>" + dateSince + "</span></span>";
                    }
                    img = (img ? img : defimg);
                    content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                        '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                        '<div class="yahui-b" data-hm-id="' + id + '">' + lowbat +
                        '</div><div class="yahui-c" data-hm-id="' + id + '"><h3>' +
                        '<span style="color: #c00; '+(datapoints[el.DPs.STATE][0]?'display:none':'')+'" data-hm-id="'+el.DPs.STATE+'" data-hm-state="false">unerreichbar</span>' +
                        '<span style="color: #080; '+(datapoints[el.DPs.STATE][0]?'':'display:none')+'" data-hm-id="'+el.DPs.STATE+'" data-hm-state="true">ping ok</span>' +
                        since +
                        '</h3></div></li>';
                    list.append(content);
                    break;
                case "SHUTTER_CONTACT":
                case "TILT_SENSOR":
                case "DIGITAL_INPUT":
                    // Datum formatieren
                    var dateSince;
                    if (datapoints[el.DPs.STATE] && datapoints[el.DPs.STATE][3]) {
                        dateSince = formatDate(datapoints[el.DPs.STATE][3]);
                    }
                    if (dateSince) {
                        since = " <span class='yahui-since'>seit <span class='hm-html-timestamp' data-hm-id='"+el.DPs.STATE+"'>" + dateSince + "</span></span>";
                    }
                    img = (img ? img : defimg);
                    content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                        '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                        '<div class="yahui-b" data-hm-id="' + id + '">' + lowbat +
                        '</div><div class="yahui-c" data-hm-id="' + id + '"><h3>' +
                        '<span style="color: #080; '+(datapoints[el.DPs.STATE][0]?'display:none':'')+'" data-hm-id="'+el.DPs.STATE+'" data-hm-state="false">geschlossen</span>' +
                        '<span style="color: #c00; '+(datapoints[el.DPs.STATE][0]?'':'display:none')+'" data-hm-id="'+el.DPs.STATE+'" data-hm-state="true">geöffnet</span>' +
                        since +
                        '</h3></div></li>';
                    list.append(content);
                    break;
                case "RAINDETECTOR":
                    // Datum formatieren
                    var dateSince;
                    if (datapoints[el.DPs.STATE] && datapoints[el.DPs.STATE][3]) {
                        dateSince = formatDate(datapoints[el.DPs.STATE][3]);
                    }
                    if (dateSince) {
                        since = " <span class='yahui-since'>seit <span class='hm-html-timestamp' data-hm-id='"+el.DPs.STATE+"'>" + dateSince + "</span></span>";
                    }
                    img = (img ? img : defimg);
                    content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                        '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                        '<div class="yahui-b" data-hm-id="' + id + '">' + lowbat +
                        '</div><div class="yahui-c" data-hm-id="' + id + '"><h3>' +
                        '<span style="color: #080; '+(datapoints[el.DPs.STATE][0]?'display:none':'')+'" data-hm-id="'+el.DPs.STATE+'" data-hm-state="false">Trockenheit</span>' +
                        '<span style="color: #c00; '+(datapoints[el.DPs.STATE][0]?'':'display:none')+'" data-hm-id="'+el.DPs.STATE+'" data-hm-state="true">Regen</span>' +
                        since +
                        '</h3></div></li>';
                    list.append(content);
                    break;
                case "ROTARY_HANDLE_SENSOR":
                    // Datum formatieren
                    var dateSince;
                    if (datapoints[el.DPs.STATE] && datapoints[el.DPs.STATE][3]) {
                        dateSince = formatDate(datapoints[el.DPs.STATE][3]);
                    }
                    if (dateSince) {
                        since = " <span class='yahui-since'>seit <span class='hm-html-timestamp' data-hm-id='"+el.DPs.STATE+"'>" + dateSince + "</span></span>";
                    }
                    img = (img ? img : defimg);
                    content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                        '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                        '<div class="yahui-b" data-hm-id="' + id + '">' + lowbat +
                        '</div><div class="yahui-c" data-hm-id="' + id + '"><h3>' +
                        '<span data-hm-id="'+el.DPs.STATE+'" data-hm-state="0" style="color: #080; '+(datapoints[el.DPs.STATE][0]!=0?'display:none':'')+'">geschlossen</span>' +
                        '<span data-hm-id="'+el.DPs.STATE+'" data-hm-state="1" style="color: #aa0; '+(datapoints[el.DPs.STATE][0]!=1?'display:none':'')+'">gekippt</span>' +
                        '<span data-hm-id="'+el.DPs.STATE+'" data-hm-state="2" style="color: #c00; '+(datapoints[el.DPs.STATE][0]!=2?'display:none':'')+'">geöffnet</span>' +
                        since + '</h3></div></li>';
                    list.append(content);
                    break;
                case "WATERDETECTIONSENSOR":
                    // Datum formatieren
                    var dateSince;
                    if (datapoints[el.DPs.STATE] && datapoints[el.DPs.STATE][3]) {
                        dateSince = formatDate(datapoints[el.DPs.STATE][3]);
                    }
                    if (dateSince) {
                        since = " <span class='yahui-since'>seit <span class='hm-html-timestamp' data-hm-id='"+el.DPs.STATE+"'>" + dateSince + "</span></span>";
                    }
                    img = (img ? img : defimg);
                    content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                        '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                        '<div class="yahui-b" data-hm-id="' + id + '">' + lowbat +
                        '</div><div class="yahui-c" data-hm-id="' + id + '"><h3>' +
                        '<span data-hm-id="'+el.DPs.STATE+'" data-hm-state="0" style="color: #080; '+(datapoints[el.DPs.STATE][0]!=0?'display:none':'')+'">trocken</span>' +
                        '<span data-hm-id="'+el.DPs.STATE+'" data-hm-state="1" style="color: #aa0; '+(datapoints[el.DPs.STATE][0]!=1?'display:none':'')+'">Feuchtigkeit erkannt</span>' +
                        '<span data-hm-id="'+el.DPs.STATE+'" data-hm-state="2" style="color: #c00; '+(datapoints[el.DPs.STATE][0]!=2?'display:none':'')+'">Wasserstand erkannt</span>' +
                        since + '</h3></div></li>';
                    list.append(content);
                    break;
                case "SENSOR_FOR_CARBON_DIOXIDE":
                    // Datum formatieren
                    var dateSince;
                    if (datapoints[el.DPs.STATE] && datapoints[el.DPs.STATE][3]) {
                        dateSince = formatDate(datapoints[el.DPs.STATE][3]);
                    }
                    if (dateSince) {
                        since = " <span class='yahui-since'>seit <span class='hm-html-timestamp' data-hm-id='"+el.DPs.STATE+"'>" + dateSince + "</span></span>";
                    }
                    img = (img ? img : defimg);
                    content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                        '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                        '<div class="yahui-b" data-hm-id="' + id + '">' + lowbat +
                        '</div><div class="yahui-c" data-hm-id="' + id + '"><h3>' +
                        '<span data-hm-id="'+el.DPs.STATE+'" data-hm-state="0" style="color: #080; '+(datapoints[el.DPs.STATE][0]!=0?'display:none':'')+'">CO2-Konz. normal</span>' +
                        '<span data-hm-id="'+el.DPs.STATE+'" data-hm-state="1" style="color: #aa0; '+(datapoints[el.DPs.STATE][0]!=1?'display:none':'')+'">CO2-Konz. erhöht</span>' +
                        '<span data-hm-id="'+el.DPs.STATE+'" data-hm-state="2" style="color: #c00; '+(datapoints[el.DPs.STATE][0]!=2?'display:none':'')+'">CO2-Konz. stark erhöht</span>' +
                        since + '</h3></div></li>';
                    list.append(content);
                    break;

                default:
                    chanVarsRendered = true;
                    img = (img ? img : defimg);
                    content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                        '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                        '<div class="yahui-b" data-hm-id="' + id + '" style="font-size:12px"><span style="display: inline-block; padding-top:5px;">' + el.HssType +
                        lowbat +
                        '</div><div class="yahui-c" data-hm-id="' + id + '"><table class="yahui-datapoints">';
                    for (var dp in regaObjects[id].DPs) {

                        var dpId = regaObjects[id].DPs[dp];
                        var val = datapoints[dpId][0];
                        var unit = regaObjects[dpId].ValueUnit;

                        if (regaObjects[dpId].ValueType === 16 && regaObjects[dpId].ValueList && regaObjects[dpId].ValueList.match(/;/)) {
                            var valList = regaObjects[dpId].ValueList.split(";");
                            val = valList[val];
                        }

                        // Meter-Datenpunkt auf 3-Nachkommastellen formatieren.
                        if (regaObjects[dpId].Name && regaObjects[dpId].Name.match(/\.METER$/)) {
                            val = val.toFixed(3);
                        }

                        if (regaObjects[dpId].ValueUnit && regaObjects[dpId].ValueUnit == "100%") {
                            unit = "%";
                            val = (val * 100).toFixed(1);
                        }

                        if (regaObjects[dpId].Name && regaObjects[dpId].Name.match(/\./)) {
                            var tmpArr = regaObjects[dpId].Name.split(".");
                            var dpType = tmpArr[2];
                        } else {
                            dpType = "UNKNOWN";
                        }

                        if (!settings.hideDatapoints[dpType]) {
                            content += "<tr><td>"+dp+"</td><td><span class='hm-html' data-hm-id='"+dpId+"'>"+val+"</span>"+unit+"</td></tr>";
                        }
                    }
                    content += "</table></div></li>";
                    list.append(content);
            }

            // Variablen die Kanälen zugeordnet sind
            if (!chanVarsRendered) {
                for (var childDP in el.DPs) {
                    if (regaObjects[el.DPs[childDP]].TypeName == "VARDP") {
                        content = "<p class='ui-li-desc'>"+childDP+": ";

                        switch (regaObjects[el.DPs[childDP]].ValueType) {
                            case 2:
                            case 16:
                                var val = datapoints[el.DPs[childDP]][0];
                                if (val === true) { val = 1; }
                                if (val === false) { val = 0; }
                                if (regaObjects[el.DPs[childDP]].ValueList && regaObjects[el.DPs[childDP]].ValueList.match(/;/)) {
                                    var valueList = regaObjects[el.DPs[childDP]].ValueList.split(";");
                                    content += "<span class='hm-html' data-hm-id='"+el.DPs[childDP]+"'>"+valueList[val]+"</span>"+regaObjects[el.DPs[childDP]].ValueUnit;
                                } else {
                                    content += "<span class='hm-html' data-hm-id='"+el.DPs[childDP]+"'>"+val+"</span>"+regaObjects[el.DPs[childDP]].ValueUnit;
                                }
                                break;
                            default:
                                content += "<span class='hm-html' data-hm-id='"+id+"'>"+datapoints[el.DPs[childDP]][0]+"</span>"+regaObjects[el.DPs[childDP]].ValueUnit;
                        }
                        content += "</p>";

                        $("div[data-hm-id='"+id+"']:last").append(content);
                    }
                }
            }



            break;
        case "VARDP":
        case "ALARMDP":
            // WebMatic ReadOnly-Flag -> (r) in Variablen-Beschreibung
            var readOnly;
            if ((!varEdit || varEdit && !settings.editReadOnlyVariablesInVariablelist)  && regaObjects[id].DPInfo) {
                readOnly = (regaObjects[id].DPInfo.match(/\([^\)]*[rR][^\)]*\)/) ? true : false );
            }
            img = (img ? img : defimg);
            if (readOnly) {
                content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                    '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                    '<div class="yahui-bc" data-hm-id="' + id + '">';
                switch (regaObjects[id].ValueType) {
                case 2:
                case 16:
                    var val = datapoints[id][0];
                    if (val === true) { val = 1; }
                    if (val === false) { val = 0; }
                    if (regaObjects[id].ValueList && regaObjects[id].ValueList.match(/;/)) {
                        var valueList = regaObjects[id].ValueList.split(";");
                        content += "<span class='hm-html' data-hm-id='"+id+"'>"+valueList[val]+"</span>"+regaObjects[id].ValueUnit+"</div></li>";
                    } else {
                        content += "<span class='hm-html' data-hm-id='"+id+"'>"+val+"</span>"+regaObjects[id].ValueUnit+"</div></li>";
                    }
                    break;
                default:
                    content += "<span class='hm-html' data-hm-id='"+id+"'>"+datapoints[id][0]+"</span>"+regaObjects[id].ValueUnit+"</div></li>";
                }
                list.append(content);
            } else {
                content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" data-hm-id="' + id + '" />' +
                    '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                    '<div class="yahui-bc" data-hm-id="' + id + '">';
                switch (regaObjects[id].ValueType + "-" + regaObjects[id].ValueSubType) {
                    case "2-2": // Boolean
                    case "2-6": // Alarm
                    case "16-29": // Werteliste

                        var selected = "";
                        var val = datapoints[id][0];
                        if (val == true) { val = 1; }
                        if (val == false) { val = 0; }
                        if (regaObjects[id].ValueList && regaObjects[id].ValueList.match(/;/)) {
                            var valueList = regaObjects[id].ValueList.split(";")
                        } else {
                            var valueList = ["ist falsch", "ist wahr"];
                        }

                        content += '<select id="select_'+elId+'" data-hm-id="'+id+'">';
                        for (var i = 0; i < valueList.length; i++) {
                            if (datapoints[id][0] == i) {
                                selected = " selected";
                            } else {
                                selected = "";
                            }
                            content += '<option value="'+i+'"'+selected+'>'+valueList[i]+'</option>';
                        }
                        content += '</select>'+regaObjects[id].ValueUnit+"</div></li>";
                        list.append(content);
                        setTimeout(function () {
                            $("#select_"+elId).on( 'change', function( event ) {
                                //console.log("select "+event.target.value+" "+event.target.dataset.hmId);
                                var val = parseInt($("#select_"+elId+" option:selected").val(), 10);

                                yahui.socket.emit("setState", [parseInt(event.target.dataset.hmId,10), val]);
                            });
                        }, 500);
                        break;

                    case "4-0": // Zahlenwert
                    case "16-0":
                    case "20-11": // Zeichenkette
                        var unit = regaObjects[id].ValueUnit;
                        if (!unit) { unit = ""; }
                        var val = datapoints[id][0];
                        content += '<table style="width:100%"><tr><td style="width:100%"><input type="text" id="input_'+id+'" class="hm-val" data-hm-id="'+id+'" value="'+String(datapoints[id][0]).replace(/"/g, "&quot;")+'"  /></td><td>'+unit+'</td></tr></table>';
                        list.append(content);
                        setTimeout(function () {
                            $("#input_"+id).change(function( event ) {
                                //console.log("input "+event.target.value+" "+event.target.dataset.hmId);
                                //var id = event.target.dataset.hmId;
                                var val = $("#input_"+id).val();
                                //console.log("setState"+JSON.stringify([id, val]));
                                yahui.socket.emit("setState", [id, val]);
                            });
                        }, 500);
                        break;
                default:
                    content += "<span class='hm-html' data-hm-id='"+id+"'>"+datapoints[id][0]+"</span>"+regaObjects[id].ValueUnit+"</div></li>";
                    list.append(content);
                }

            }
            break;
        case "PROGRAM":
            img = (img ? img : defimg);
            content = '<li class="yahui-widget ' + visibleClass + '" data-hm-id="'+id+'"><img src="'+img+'" alt="" />' +
                '<div class="yahui-a" data-hm-id="' + id + '">' + alias + '</div>' +
                '<div class="yahui-bc" data-hm-id="' + id + '">' +
                '<a href="#" class="yahui-program" data-hm-id="'+id+'" data-role="button" data-icon="arrow-r">Programm ausf&uuml;hren</a>' +
                "</div></li>";
            list.append(content);
            setTimeout(function () {
                $('a.yahui-program[data-hm-id="'+id+'"]').on('click', function( event ) {
                    //console.log("programExecute "+id);
                    yahui.socket.emit("programExecute", [id]);
                });
            }, 500);
            break;
        default:
        }
    }

    function updateWidgets(id, val, lastupdate, ack, ts) {
        if (!yahui.ready) {
            return false;
        }
        //console.log("updateWidgets id="+id+" val="+val);

        // Meter-Datenpunkt auf 3-Nachkommastellen formatieren.
        if (regaObjects[id] && regaObjects[id].Name && regaObjects[id].Name.match(/\.METER$/)) {
            val = val.toFixed(3);
        }

        // Werte mit Einheit "100%" umrechnen
        if (regaObjects[id] && regaObjects[id].ValueUnit && regaObjects[id].ValueUnit == "100%") {
            val = (val * 100).toFixed(1);
        }


        // Servicemeldungen entfernen
        $("li.yahui-alarm[data-hm-id='"+id+"']").each(function () {
            if (val != 1) {
                $(this).remove();
            }
        });

        // Servicemeldung hinzufügen
        if (val == 1 && regaIndex.ALDP && regaIndex.ALDP.indexOf(parseInt(id,10)) != -1) {
            if ($("ul#list_alarms").html() && !$("li.yahui-alarm[data-hm-id='"+id+"']").html()) {
                console.log("new alarm "+JSON.stringify(datapoints[parseInt(id,10)]));
                renderAlarmWidget($("ul#list_alarms"), parseInt(id,10), false, "#alarms", function () {
                    $("ul#list_alarms").listview('refresh');
                });
            }
        }

        // 16-Fach LED Anzeige
        $(".led16[data-hm-id='"+id+"']").each(function () {
            $(this).removeClass("led16-0")
                .removeClass("led16-1")
                .removeClass("led16-2")
                .removeClass("led16-3")
                .addClass("led16-"+val);
        });

        $(".hue-switch[data-hm-id='"+id+"']").each(function () {

            if (val === false) { val = "false"; }
            if (val === true) { val = "true"; }

            $this = $(this);
            $this.find("option[value!='"+val+"']").removeAttr("selected");
            $this.find("option[value='"+val+"']").attr("selected", true);
            $this.slider("refresh");

            if (val == "ct") {
                $("#"+$this.attr("id").replace(/hueswitch_/,"").replace(/_COLORMODE/,"")+"_CT").show();
                $("#"+$this.attr("id").replace(/hueswitch_/,"").replace(/_COLORMODE/,"")+"_HS").hide();
            } else if (val == "hs") {
                $("#"+$this.attr("id").replace(/hueswitch_/,"").replace(/_COLORMODE/,"")+"_CT").hide();
                $("#"+$this.attr("id").replace(/hueswitch_/,"").replace(/_COLORMODE/,"")+"_HS").show();
            }
        });

        $("img[data-hm-servicemsg='"+id+"']").each(function () {
            if (val == 1 || val === true || val === "true") {
                $(this).show();
            } else {
                $(this).hide();
            }
        });

        $(".hm-html[data-hm-id='"+id+"']").each(function () {
            var $this = $(this);
            var datapoint   = regaObjects[id];
            switch (datapoint.ValueType + "-" + datapoint.ValueSubType) {
                case "2-2":
                case "2-6":
                case "16-29":
                    if (regaObjects[id].ValueList && regaObjects[id].ValueList != "") {
                        var valueList = regaObjects[id].ValueList.split(";")
                        if (val == true) { val = 1; }
                        if (val == false) { val = 0; }
                        $this.html(valueList[val]);
                    } else {
                        if ($this.attr("data-hm-true")) {
                            val = (val ? $this.attr("data-hm-true") : $this.attr("data-hm-false"));
                        } else {
                            if (val === false) { val = "false"; }
                        }
                        $this.html(val);
                    }
                    break;
                default:
                    if (val === false) { val = "false"; }
                    $this.html(val);
            }
        });

        $(".hm-html-timestamp[data-hm-id='"+id+"']").each(function () {
            if (ts) {
                $(this).html(formatDate(ts));
            }
        });

        $("[data-hm-state][data-hm-id='"+id+"']").each(function () {
            var $this = $(this);
            var datapoint   = regaObjects[id];
            var state = $this.attr("data-hm-state");

            if (state === "false" || state === false) {
                state = false;
            } else if (state === "true" || state === true) {
                state = true;
            } else {
                state = parseInt(state, 10);
            }
            if (state == val) {
                $this.show();
            } else {
                $this.hide();
            }
        });

        $(".hm-val[data-hm-id='"+id+"']").each(function () {
            var $this = $(this);
            var datapoint   = regaObjects[id];
            switch (datapoint.ValueType + "-" + datapoint.ValueSubType) {
                case "2-2":
                case "2-6":
                case "16-29":
                    var valueList = regaObjects[id].ValueList.split(";")
                    if (val == true) { val = 1; }
                    if (val == false) { val = 0; }
                    $this.val(valueList[val]);
                    break;
                default:
                    // Todo Update verhindern wenn Focus, allerdings muss dann Update erfolgen wenn Focus wieder weg ist.
                    //if (!$this.parent().hasClass("ui-focus")) {
                    $this.val(val);
                    //}
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

            // Eltern-Element aus Index suchen um ggf. WORKING-Datenpunkt zu finden
            var channel     = regaObjects[regaObjects[id].Parent];
            if (channel) {
                if (channel.DPs.WORKING) {
                    working = datapoints[channel.DPs.WORKING][0];
                }
            }

            // Wenn WORKING=true Update des Sliders unterdrücken
            if (!working) {
                var $this = $(this);
                var pos = val;
                //if ($this.data("hm-factor")) {
                //    pos = pos * $this.data("hm-factor");
                //}
                $this.val(pos).slider('refresh');
            }
        });

        $("select[id^='switch'][data-role='slider'][data-hm-id='"+id+"']").each(function () {
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
            //console.log("switch id="+id+" val="+val);
            //console.log(channel.Name+" working="+working);

            // Seltsames Verhalten des 2-Fach Wired-Schaltaktors. WORKING immer true wenn Wert true ist - daher ignorieren des WORKING Datenpunkts...
            if (!working) {
                if (!val || val == 0) {
                    $this.find("option[value='1']").removeAttr("selected");
                    $this.find("option[value='0']").attr("selected", true);
                    $this.find("option[value='0']").prop("selected", true);
                } else {
                    $this.find("option[value='0']").removeAttr("selected");
                    $this.find("option[value='1']").attr("selected", true);
                    $this.find("option[value='1']").prop("selected", true);
                }
                $this.slider("refresh");
            }

        });

        $("select[id^=select][data-hm-id='"+id+"']").each(function() {

            //console.log("select change");
            var $this = $(this);
            $this.find("option").removeAttr("selected");
            if (val == true) { val = 1; }
            if (val == false) { val = 0; }
            $this.find("option[value='"+val+"']").prop("selected", true);
            if ($this.parent().parent().hasClass("ui-select")) {
                $this.selectmenu("refresh");
            }
        });
    }

    function regaObjectAlphabetically(a,b) {
        if (regaObjects[a].Name.toLowerCase() < regaObjects[b].Name.toLowerCase()) {
            return -1;
        }
        if (regaObjects[a].Name.toLowerCase() > regaObjects[b].Name.toLowerCase()) {
            return 1;
        }
        return 0;
    }

    function formatDate(ts) {
        var dateSinceObj = new Date(ts.replace(/ /,"T")+"Z");
        var tzOffset = dateSinceObj.getTimezoneOffset();
        dateSinceObj = new Date(dateSinceObj.getTime() + (tzOffset * 60000));
        var now = new Date((new Date().getTime() + 1000));
        var str;
        switch (settings.dateSinceType) {
            case false:
                // Nichts
                break;
            case "period":
                // Zeitraum
                // TODO Müsste eigentlich sekündlich aktualisiert werden damit es Sinne ergibt...

                var seconds = Math.floor((now.getTime() - dateSinceObj.getTime()) / 1000);
                var minutes = Math.floor(seconds / 60);
                seconds = seconds - (minutes * 60);
                var hours = Math.floor(minutes / 60);
                minutes = minutes - (hours * 60);
                var days = Math.floor(hours / 24);
                hours = hours - (days * 24);
                str = "";
                if (days > 0) {
                    str += days + " Tag";
                    if (days != 1) { str += "e"; }
                } else if (hours > 0) {
                    str += hours + " Stunde";
                    if (hours != 1) { str += "n"; }
                } else if (minutes > 0) {
                    str += minutes + " Minute";
                    if (minutes != 1) { str += "n"; }
                } else {
                    str += seconds + " Sekunde";
                    if (seconds != 1) { str += "n"; }
                }


                break;
            default:
                // Zeitpunkt

                // TODO "Gestern"
                if (now.getDate() == dateSinceObj.getDate()) {
                    // Heute
                    str = dateSinceObj.getHours() + ":" + ("0"+dateSinceObj.getMinutes()).slice(-2) + ":" + ("0"+dateSinceObj.getSeconds()).slice(-2);
                } else  {
                    str = dateSinceObj.getDate()+"."+(dateSinceObj.getMonth()+1)+"."+dateSinceObj.getFullYear();
                    str += " " + dateSinceObj.getHours() + ":" + ("0"+dateSinceObj.getMinutes()).slice(-2) + ":" + ("0"+dateSinceObj.getSeconds()).slice(-2);
                }
                break;

        }
        return str;
    }

    function getServiceMsgCount(enId) {
        // Service-Meldungen suchen
        var chIdArr = regaObjects[enId].Channels;
        var devIdArr = [];
        for (var k = 0; k < chIdArr.length; k++) {
            if (regaObjects[chIdArr[k]]) {
                var devId = regaObjects[chIdArr[k]].Parent;
                if (devIdArr.indexOf(devId) == -1) {
                    devIdArr.push(devId);
                }
            }

        }
        var serviceMsgCount = 0;
        for (var k = 0; k < devIdArr.length; k++) {
            if (regaObjects[devIdArr[k]] && regaObjects[devIdArr[k]].Channels) {
                var ch0Id = regaObjects[devIdArr[k]].Channels[0];
                if (regaObjects[ch0Id].ALDPs) {
                    for (var al in regaObjects[ch0Id].ALDPs) {
                        if (datapoints[regaObjects[ch0Id].ALDPs[al]][0] == 1) {
                            serviceMsgCount += 1;
                        }
                    }
                }
            }
        }
        return serviceMsgCount;
    }

    function updateServiceMsgs() {
        // Favorites
        if (regaIndex.FAVORITE) {
            for (var i = 0; i < regaIndex.FAVORITE.length; i++) {
                updateServiceMsgsItem(regaIndex.FAVORITE[i]);
            }
        }

        // Räume
        for (var i = 0; i < regaIndex.ENUM_ROOMS.length; i++) {
            updateServiceMsgsItem(regaIndex.ENUM_ROOMS[i]);
        }

        // Gewerke
        for (var i = 0; i < regaIndex.ENUM_FUNCTIONS.length; i++) {
            updateServiceMsgsItem(regaIndex.ENUM_FUNCTIONS[i]);
        }
    }

    function updateServiceMsgsItem(en) {
        var count = getServiceMsgCount(en);
        if (count == 0) {
            $("div[data-hm-service-msg='"+en+"']").hide().html("");
        } else {
            $("div[data-hm-service-msg='"+en+"']").show().html("<div class='service-message-count'>" + count + "</div>");
        }
    }

});
