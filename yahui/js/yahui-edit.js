$(document).ready(function () {

    $.getScript("/lib/js/jquery-ui-1.10.3.dragdropsort.min.js").done(function(script, textStatus) {
        $.getScript("/lib/js/jquery.ui.touch-punch.min.js").done(function(script, textStatus) {
            $.getScript("/lib/js/dropzone.js").done(function(script, textStatus) {
                setTimeout(initEditMode, 1000);
            });
        });
    });




    function initEditMode() {
        console.log("initEditMode()");


/*
        $(".ui-listview").sortable({
            stop: function (e, ui) {
                ui.item.parent().listview("refresh");
            }
        });
        $("li.ui-li").dropzone({
            url: "/upload/post?yahui",
            clickable: true,
            addedfile: function (file) {
                console.log(file);
                // $("#popupUpload").popup("open");
            },
            dragover: function (e) {
                console.log(e);
                var el = $(e.toElement);

                $(e.toElement).closest(".ui-li").find("img").addClass("upload-start");

            },
            dragleave: function (e) {
                console.log("drag end");
                $(e.toElement).closest(".ui-li").find("img").removeClass("upload-start");
            },
            drop: function (e) {
                console.log("drag end");
                $(e.toElement).closest(".ui-li").find("img").removeClass("upload-start");
            }
        });*/
    }

    $(document).on( "pagechange", function (e, data) {
        console.log("pagechange");
        $(".ui-sortable").sortable("destroy");
        data.toPage.find(".ui-listview").sortable({
            start: function (e, ui) {
                console.log("drag start");
                console.log(ui.item);
                ui.item.addClass("drag-start");
            },
            stop: function (e, ui) {

                console.log("drag stop");
                ui.item.parent().listview("refresh");
                ui.item.removeClass("drag-start");
            }
        });
        $("li.ui-li").each(function() {
            var $this = $(this);
            var id = $this.attr("data-hm-id");
            if (!$this.hasClass("dz-clickable")) {

                $this.dropzone({
                    url: "../upload?path=./www/yahui/images/user/&id=" + id,
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

                        console.log(e, ui);
                        var closest = $(e.toElement).closest("li.ui-li");
                        closest.removeClass("upload-start");
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



    $("body").append('<div data-role="popup" data-history="false" data-overlay-theme="a" id="popupUpload">' +
        '<p id="uploadProgress"> <div class="dz-progress"><span class="dz-upload" data-dz-uploadprogress></span></div></p>' +
        '<p id="uploadPreview"></p>' +
        '<p><input type="button" value="Seite neu laden" id="reload"/></p>' +
        '</div>');

    $("#popupUpload").popup();

});

