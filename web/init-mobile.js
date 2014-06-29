/*jslint plusplus: true, devel: true, nomen: true, vars: true, continue: true, regexp: true, indent: 4, maxerr: 50 */
/*global window, io, $, navigator */

(function () {
    "use strict";

    // Code for mobile device only
    var mobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    if(mobileAgent.test(navigator.userAgent)) {
    $(window).on('cursor:ready', function (e) {

        // Insert hidden input
        var input = $("#hidden-input");
        if (input.length === 0) {
        input = $('<input type="text" id="hidden-input"/>');
        $('body').append(input);
        }
        input.val("");

        // Bind events
        var content = $("#content");
        content.click(function (e) {
        $("#hidden-input").focus();
        });
        // Focus when added
        // Not a bug: This won't work for some mobile browser like mobile Safari.
        // It is by design that mobile safari ignores certain focus() call except
        // ones originated from a touch event handler.
        // This will cause virtual keyboard to disapear every time a command line
        // is committed
        //$("#hidden-input").focus();
    });
    }
}());
