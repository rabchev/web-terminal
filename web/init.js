/*jslint plusplus: true, devel: true, nomen: true, vars: true, indent: 4, maxerr: 50 */
/*global window, io, $ */

(function () {
    "use strict";
    
    var socket = io.connect(),
        content = $("#content"),
        currentLine = "";
        
    window.APP = {
        socket: socket
    };
    
    $(window.document).keydown(function (e) {
        if (e.keyCode === 8) {
            currentLine = currentLine.slice(0, -1);
            //content.html(currentLine);
        }
    });
    
    socket.on("console", function (data) {
        data = data.replace(/\n/g, "<br />");
        content.append(data + "<br />~$");
        
        $('html, body').animate({
            scrollTop: $(window.document).height()
        },
        1500);
    });
  
    $(window.document).keypress(function (e) {
        
        var letter = String.fromCharCode(e.keyCode);
  	
        // Handle 'enter'.
        if (e.keyCode === 13) {
            
            if (currentLine.length > 0) {
                // Send...
                socket.emit("console", currentLine);
                currentLine = "";
                content.append("<br />");
            } else {
                content.append("<br />~$");
            }
        } else {
            
            if (letter) {
                currentLine += letter;
                content.append(letter);
            } else {
                console.log(e.keyCode);
            }
        }
    });
  
}());