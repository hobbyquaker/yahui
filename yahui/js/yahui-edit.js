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

    url = $.mobile.path.parseUrl(location.href);

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

        //Edit-Button zu Widget hinzufügen
        $("li.yahui-widget").each( function() {
            $(this).append('<div class="yahui-d"><a href="#edit_channel" class="channel_edit" data-rel="dialog" data-role="button" data-icon="gear" data-iconpos="notext" data-inline="true" id="edit_channel_' + $(this).attr('data-hm-id') + '">Kanal editieren</a></div>');
            $(".channel_edit").button();
        });

        $(".channel_edit").click(function(e) {
            var id = $(this).attr("id").slice(13);
            var url = $.mobile.path.parseUrl(location.href);
            var el = yahui.regaObjects[id];
            var alias = yahui.channelNameAliases[url.hash + "_" + id];
            if (!alias)
                alias = el.Name;

            $("#edit_channel_id").val(id);
            $("#edit_channel_page_id").val(url.hash);
            $("#edit_channel_name").text(el.Name);
            $("#edit_channel_alias").val(alias);
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
                    sortOrder.push(id);
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
                        $("#uploadProgress").html("");
                        //$("#uploadPreview").html("");
                        $("#popupUpload").popup("open");
                        /*setTimeout(function() {
                         closest.find("img").attr("src", "images/default/dummy.png");
                         setTimeout(function () {
                         closest.find("img").attr("src", "images/user/"+);
                         }, 50);
                         }, 1200);*/
                    }
                });
            }

        });
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
        //console.log(ids);
        id = 0;
        while (ids.indexOf(id) !== -1) {
            id += 1;
        }
        return id;
    }

    // Kanalbearbeitung abbrechen
    $("#channel_cancel").click(function () {
        $("#edit_channel").dialog("close");

        if (url.hash.match(/&/)) {
            var tmpArr = url.hash.split("&");
            var hash = tmpArr[0];
            window.location.href = url.pathname + "?edit" + hash;
            url = $.mobile.path.parseUrl(location.href);
        }
        else
            window.location.href = url.pathname + "?edit" + url.hash;
    });

    // Kanalbearbeitung speichern
    $("#channel_edit").click(function () {

        yahui.channelNameAliases[$("#edit_channel_page_id").val() + "_" + $("#edit_channel_id").val()] = $("#edit_channel_alias").val();

        $("#edit_channel").dialog("close");
        $.mobile.loading("show");

        yahui.socket.emit("writeFile", "yahui-channelnamealiases.json", yahui.channelNameAliases, function() {
            $("div.yahui-a[data-hm-id='" + $("#edit_channel_id").val() + "'").text($("#edit_channel_alias").val());
        });
    });
});
