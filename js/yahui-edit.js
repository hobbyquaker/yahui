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

$(document).ready(function () {
    //console.log("reload");

    var url = $.mobile.path.parseUrl(location.href);

    // Notwendige Scripts laden
    $.getScript("/lib/js/jquery-ui-1.10.3.dragdropsort.min.js").done(function(script, textStatus) {
        $.getScript("/lib/js/jquery.ui.touch-punch.min.js").done(function(script, textStatus) {
            $.getScript("/lib/js/dropzone.js").done(function(script, textStatus) {
                setTimeout(initEditMode, 1000);
            });
        });
    });

    function initEditMode() {
        //console.log("initEditMode()");

        $(".invisible").addClass('edit_invisible').removeClass('invisible');

        $("a.yahui-extension").click(function (e) {

            var id = $(this).attr("id").slice(4);

            $("#edit_link_id").val(id);
            $("#edit_link_text").val(yahui.extensions[id].text);
            $("#edit_link_subtext").val(yahui.extensions[id].subtext);
            $("#edit_link_url").val(yahui.extensions[id].url);

            if (yahui.extensions[id].inline) {
                $("#edit_link_iframe option[value='true']").attr("selected", true);
                $("#edit_link_iframe option[value='false']").removeAttr("selected");
            } else {
                $("#edit_link_iframe option[value='false']").attr("selected", true);
                $("#edit_link_iframe option[value='true']").removeAttr("selected");
            }

            if ($("#edit_link_iframe").parent().parent().hasClass("ui-select")) {
                $("#edit_link_iframe").selectmenu("refresh");
            }

        });

        //console.log("change Links");
        $("a.yahui-extension").each(function () {
            var $this = $(this);

            $this.prop("href", "#edit_link");
            $this.prop("data-rel", "dialog");
            $this.removeAttr("target");
        });
    }

    $(document).on( "pagechange", function (e, data) {
        //url aktualisieren, auch wenn die seite nicht insgesamt neu geladen sondern nur geändert wird.
        url = $.mobile.path.parseUrl(location.href);

        // Sortierung initialisieren
        $(".ui-sortable").sortable("destroy");
        data.toPage.find(".ui-listview.yahui-sortable").sortable({
            start: function (e, ui) {
                ui.item.addClass("drag-start");
            },
            stop: function (e, ui) {

                ui.item.parent().listview("refresh");
                ui.item.removeClass("drag-start");
                var sortOrder = [];
                ui.item.parent().find("li").each(function () {
                    var $this = $(this);

                    var id = parseInt($(this).attr("data-hm-id"), 10);

                    if (!id) {
                        id = parseInt($(this).attr("data-ext-id"), 10);
                    }
                    if (id) {
                        sortOrder.push(id);
                    }

                });

                yahui.sortOrder[ui.item.parent().attr("id")] = sortOrder;
                yahui.socket.emit("writeFile", "yahui-sort.json", yahui.sortOrder);
            }
        });

        // File-Uploads initialisieren
        $("li.ui-li").each(function() {
            var $this = $(this);
            var id = $this.attr("data-hm-id");
            if (!id) {
                id = "ext_"+$this.attr("data-ext-id");
            }
            if (!$this.hasClass("dz-clickable")) {

                $this.dropzone({
                    url: "/upload?path=./www" + url.pathname + "images/user/&id=" + id,
                    acceptedFiles: "image/*",
                    uploadMultiple: false,
                    previewTemplate: '<div class="dz-preview dz-file-preview"><div class="dz-details"><div class="dz-filename"><span data-dz-name></span></div><br/>' +
                        '<div class="dz-size" data-dz-size></div><br/><img data-dz-thumbnail /></div><div class="dz-progress"><span class="dz-upload" data-dz-uploadprogress></span></div>' +
                        '<div class="dz-error-message"><span data-dz-errormessage></span></div></div>',
                    previewsContainer: "#uploadPreview",
                    clickable: true,
                    dragover: function (e) {
                        var el = $(e.toElement);
                        $(e.toElement).closest("li.ui-li").addClass("upload-start");
                    },
                    dragleave: function (e) {
                        $(e.toElement).closest("li.ui-li").removeClass("upload-start");
                    },
                    drop: function (e, ui) {

                        //console.log(e, ui);
                        var closest = $(e.toElement).closest("li.ui-li");
                        closest.removeClass("upload-start");
                        //$("#uploadProgress").html("");
                        //$("#uploadPreview").html("");
                        //$("#popupUpload").popup("open");
                        /*setTimeout(function() {
                         closest.find("img").attr("src", "images/default/dummy.png");
                         setTimeout(function () {
                         closest.find("img").attr("src", "images/user/"+);
                         }, 50);
                         }, 1200);*/
                    },
                    complete: function (e, ui) {
                        $("#uploadProgress").html("");
                        $("#popupUpload").popup("open");
                    }
                });
            }

        });

        //Edit-Button zu Widget hinzufügen
        //console.log("add Edit Buttons");
        var addedEditButtons = 0;
        $("li.yahui-widget").each( function() {
            if ($(this).find("div.yahui-d").length > 0) {
                // Edit Button bereits vorhanden
                return;
            }
            addedEditButtons += 1;
            $(this).append('<div class="yahui-d"><a href="#edit_channel" class="channel_edit" data-rel="dialog" data-role="button" data-icon="gear" data-iconpos="notext" data-inline="true" id="edit_channel_' + $(this).attr('data-hm-id') + '">Kanal editieren</a></div>');
            $(".channel_edit").button();
        });

        // Wurden Buttons hinzugefügt? Wenn ja Click-Handler definieren
        if (addedEditButtons > 0) {
            $(".channel_edit").click(function(e) {
                var id = $(this).attr("id").slice(13);
                var url = $.mobile.path.parseUrl(location.href);
                var el = yahui.regaObjects[id];

                // Typ-spezifischen Bereich des Edit-Fensters einblenden
                if (yahui.regaObjects[id] && yahui.regaObjects[id].HssType) {
                    var chType = yahui.regaObjects[id].HssType;
                } else if (yahui.regaObjects[id] && yahui.regaObjects[id].TypeName) {
                    var chType = yahui.regaObjects[id].TypeName;
                } else {
                    var chType = "UNKNOWN";
                }
                console.log(chType);
                console.log($(this).attr("id"));
                console.log(id);
                console.log(el);
                if (chType == "VIRTUAL_KEY") { chType = "KEY"; }
                $(".edit-area[data-edit-area!='"+chType+"']").hide();
                $(".edit-area[data-edit-area='"+chType+"']").show();

                if (chType == "KEY" || chType == "VIRTUAL_KEY") {
                    var textPressShort = settings.defaultPressShort;
                    var textPressLong = settings.defaultPressLong;
                    var hidePressLong = false;
                    if (yahui.elementOptions[url.hash + "_" + id] && yahui.elementOptions[url.hash + "_" + id].textPressShort) {
                        textPressShort = yahui.elementOptions[url.hash + "_" + id].textPressShort;
                    }
                    if (yahui.elementOptions[url.hash + "_" + id] && yahui.elementOptions[url.hash + "_" + id].textPressLong) {
                        textPressLong = yahui.elementOptions[url.hash + "_" + id].textPressLong;
                    }
                    if (yahui.elementOptions[url.hash + "_" + id] && yahui.elementOptions[url.hash + "_" + id].hidePressLong) {
                        $("select#hide_press_long option:selected").removeAttr("selected");
                        if (yahui.elementOptions[url.hash + "_" + id].hidePressLong && yahui.elementOptions[url.hash + "_" + id].hidePressLong === true) {
                            $("select#hide_press_long option[value='true']").attr("selected", true);
                        }

                    } else {
                        $("select#hide_press_long option[value='false']").attr("selected", true);
                    }
                    if ($('select#hide_press_long').parent().parent().hasClass("ui-select")) {
                        $('select#hide_press_long').selectmenu('refresh');
                    }
                    $("input#text_press_short").val(textPressShort);
                    $("input#text_press_long").val(textPressLong);
                }

                var alias = el.Name;
                if (yahui.elementOptions[url.hash + "_" + id] && yahui.elementOptions[url.hash + "_" + id].alias) {
                    alias = yahui.elementOptions[url.hash + "_" + id].alias;
                }

                $("#edit_channel_id").val(id);
                $("#edit_channel_page_id").val(url.hash);

                var typeName;
                switch (el.TypeName) {
                    case "VARDP":
                        typeName = "Variable";
                        break;
                    case "PROGRAM":
                        typeName = "Programm";
                        break;
                    case "CHANNEL":
                        typeName = "Kanal";
                        break;
                }

                $("#edit_channel_type").text(typeName);
                $("#edit_channel_name").text(el.Name);
                $("#edit_channel_alias").val(alias);

                var visible = "1";
                if (yahui.elementOptions[url.hash + "_" + id] && yahui.elementOptions[url.hash + "_" + id].visible) {
                    visible = yahui.elementOptions[url.hash + "_" + id].visible;
                }
                //console.log(visible);

                $("#edit_channel_visible").val(visible);
                $("#edit_channel_visible").slider("refresh");
            });
        }
    });

    $("body").append('<div data-role="popup" data-dismissible="false" data-history="false" data-overlay-theme="a" id="popupUpload">' +
        '<h3>Upload vollständig</h3>' +
        '<p id="uploadProgress"> <div class="dz-progress"><span class="dz-upload" data-dz-uploadprogress></span></div></p>' +
        '<p id="uploadPreview"></p>' +
        '<p><a href="#" data-role="button" data-icon="refresh" id="refresh">Seite neu laden</a></p>' +
        '</div>');

    $("#refresh").button().click(function () {
        window.location.reload();
    });

    $("#popupUpload").popup({
        history: false
    });

    $("#popupUpload").on({
        popupbeforeposition: function () {
            $('.ui-popup-screen').off();
        }
    });

    // Erweiterung editieren
    $("#link_edit").click(function () {
        var id = $("#edit_link_id").val();
        //console.log("EDIT LINK "+id);

        var link = {
            text:       $("#edit_link_text").val(),
            subtext:    $("#edit_link_subtext").val(),
            url:        $("#edit_link_url").val(),
            inline:     ($("#edit_link_iframe option:selected").val() == "true" ? true : false)
        }
        //console.log(link);
        yahui.extensions[id] = link;
        $("#edit_link").dialog("close");
        $.mobile.loading("show");
        yahui.socket.emit("writeFile", "yahui-extensions.json", yahui.extensions, function () {
            window.location.reload();
        });
    });

    // Erweiterung löschen
    $("#link_del").click(function () {
        var id = $("#edit_link_id").val();

        $("#edit_link").dialog("close");
        $.mobile.loading("show");

        delete yahui.extensions[id];

        yahui.socket.emit("writeFile", "yahui-extensions.json", yahui.extensions, function () {
            window.location.reload();
        });
    });

    // Erweiterung hinzufügen
    $("#link_add").click(function () {
        var id = nextExtId();
        //console.log("ADD LINK "+id);

        var link = {
            text:       $("#link_text").val(),
            subtext:    $("#link_subtext").val(),
            url:        $("#link_url").val(),
            inline:     ($("#link_iframe option:selected").val() == "true" ? true : false)
        };

        //console.log(link);
        yahui.extensions[id] = link;
        $("#add_link").dialog("close");
        $.mobile.loading("show");
        yahui.socket.emit("writeFile", "yahui-extensions.json", yahui.extensions, function () {
            window.location.reload();
        });
    });

    // gibt nächste freie ID für Extension zurück
    function nextExtId() {
        var ids = [];
        for (var id in yahui.extensions) {
            ids.push(parseInt(id,10));
        }
        id = 0;
        while (ids.indexOf(id) !== -1) {
            id += 1;
        }
        return id;
    }

    // Bearbeitung abbrechen
    $("#channel_cancel").click(function () {
        $("#edit_channel").dialog("close");
    });

    // Bild hochladen
    $("#img_upload").click(function () {
        var pageId = $("#edit_channel_page_id").val();
        var elemId =  $("#edit_channel_id").val();
        $("#edit_channel").dialog("close");
        $("div"+pageId).find("li[data-hm-id='"+elemId+"']").trigger("click");
    });

    // Bild löschen
    $("#img_delete").click(function () {
        var pageId = $("#edit_channel_page_id").val();
        var elemId =  $("#edit_channel_id").val();
        var defimg = "images/user/dummy.png";
        console.log(elemId);
        if (!yahui.images[elemId]) {
            alert("kein Bild vorhanden!");
        } else {

            // Default-Image für Gerät vorhanden?
            if (yahui.regaObjects[elemId] && yahui.regaObjects[elemId].Parent) {
                var deviceType = yahui.regaObjects[yahui.regaObjects[elemId].Parent].HssType;
                if (yahui.defaultImages[deviceType]) {
                    defimg = "images/default/"+yahui.defaultImages[deviceType];
                }
            }

            $("img[src='images/user/"+yahui.images[elemId]+"']").attr("src", defimg);
            yahui.socket.emit('delRawFile', "./www/yahui/images/user/"+yahui.images[elemId], function () {

            });
            $("#edit_channel").dialog("close");
        }
    });


    // Bearbeitung zurücksetzen
    $("#channel_reset").click(function () {
        var pageId = $("#edit_channel_page_id").val();
        var elemId =  $("#edit_channel_id").val();
        var elemKey = pageId + "_" + elemId;

        $("#edit_channel_alias").val($("#edit_channel_name").text());
        $("select#hide_press_long option:selected").removeAttr("selected");
        $("select#hide_press_long").selectmenu("refresh");

        delete yahui.elementOptions[elemKey];

        //ausgeblendet zurücksetzen
        $("li.yahui-widget[data-hm-id='" + elemId + "']").removeClass("edit_invisible");
        $("li.yahui-widget[data-hm-id='" + elemId + "']").removeClass("invisible");

        if (yahui.regaObjects[elemId].HssType == "KEY" || yahui.regaObjects[elemId].HssType == "VIRTUAL_KEY") {
            $("input#text_press_short").val(settings.defaultPressShort);
            $("input#text_press_long").val(settings.defaultPressLong);

            $("input#press_short_list_"+pageId.slice(6)+"_"+elemId).val(settings.defaultPressShort);
            $("input#press_short_list_"+pageId.slice(6)+"_"+elemId).parent().find('span.ui-btn-text').text(settings.defaultPressShort);
            $("input#press_long_list_"+pageId.slice(6)+"_"+elemId).val(settings.defaultPressLong);
            $("input#press_long_list_"+pageId.slice(6)+"_"+elemId).parent().find('span.ui-btn-text').text(settings.defaultPressLong);
            $("input#press_long_list_"+pageId.slice(6)+"_"+elemId).parent().show();
        }
        $("#edit_channel").dialog("close");
        $.mobile.loading("show");

        yahui.socket.emit("writeFile", "yahui-elementOptions.json", yahui.elementOptions, function() {
            $("div.yahui-a[data-hm-id='" + $("#edit_channel_id").val() + "']").text($("#edit_channel_alias").val());
        });
    });

    // Bearbeitung speichern
    $("#channel_edit").click(function () {
        var pageId = $("#edit_channel_page_id").val();
        var elemId =  $("#edit_channel_id").val();
        var elemKey = pageId + "_" + elemId;
        if (!yahui.elementOptions[elemKey]) {
            yahui.elementOptions[elemKey] = {};
        }

        if (yahui.regaObjects[elemId].HssType == "KEY" || yahui.regaObjects[elemId].HssType == "VIRTUAL_KEY") {
            yahui.elementOptions[elemKey].hidePressLong = ($("select#hide_press_long option:selected").val()==="true"?true:false);
            yahui.elementOptions[elemKey].textPressShort = $("input#text_press_short").val();
            yahui.elementOptions[elemKey].textPressLong = $("input#text_press_long").val();

            $("input#press_short_list_"+pageId.slice(6)+"_"+elemId).val($("input#text_press_short").val());
            $("input#press_short_list_"+pageId.slice(6)+"_"+elemId).parent().find('span.ui-btn-text').text($("input#text_press_short").val())
            $("input#press_long_list_"+pageId.slice(6)+"_"+elemId).val($("input#text_press_long").val());
            $("input#press_long_list_"+pageId.slice(6)+"_"+elemId).parent().find('span.ui-btn-text').text($("input#text_press_long").val())

            if (yahui.elementOptions[elemKey].hidePressLong === true) {
                $("input#press_long_list_"+pageId.slice(6)+"_"+elemId).parent().hide();
            } else {
                $("input#press_long_list_"+pageId.slice(6)+"_"+elemId).parent().show();
            }
        }

        yahui.elementOptions[elemKey].alias = $("#edit_channel_alias").val();
        yahui.elementOptions[elemKey].visible = $("#edit_channel_visible").val();

        if (yahui.elementOptions[elemKey].visible === "0") {
            $("li.yahui-widget[data-hm-id='" + elemId + "']").addClass("edit_invisible");
        } else {
            $("li.yahui-widget[data-hm-id='" + elemId + "']").removeClass("edit_invisible");
        }

        $("#edit_channel").dialog("close");
        $.mobile.loading("show");

        yahui.socket.emit("writeFile", "yahui-elementOptions.json", yahui.elementOptions, function() {
            $("div.yahui-a[data-hm-id='" + $("#edit_channel_id").val() + "']").text($("#edit_channel_alias").val());
        });
    });
});
