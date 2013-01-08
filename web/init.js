/*jslint plusplus: true, devel: true, nomen: true, vars: true, indent: 4, maxerr: 50 */
/*global window, io, $ */

(function () {
    "use strict";
    
    var socket = io.connect(),
        content = $("#content"),
        currentLine = "",
        codes = {
            "65": "a",
            "66": "b",
            "67": "c",
            "68": "d",
            "69": "e",
            "70": "f",
            "71": "g",
            "72": "h",
            "73": "i",
            "74": "j",
            "75": "k",
            "76": "l",
            "77": "m",
            "78": "n",
            "79": "o",
            "80": "p",
            "81": "q",
            "82": "r",
            "83": "s",
            "84": "t",
            "85": "u",
            "86": "v",
            "87": "w",
            "88": "x",
            "89": "y",
            "90": "z",
        
            "32": " ",
            "109": "-",
            "189": "-",
            "191": "/",
            "190": "."
        };
        
    window.APP = {
        socket: socket
    };
  
    $(window.document).keydown(function (e) {
  	
        var letter = codes["" + e.keyCode];
  	
        // Handle 'enter'.
        if (e.keyCode === 13) {
        
            console.log("sending console");
            
            // Send...
            socket.emit("console", currentLine, function (output) {
                output = output.replace(/\n/g, "<br />");
                
                console.log(output);
                content.append(output + "<br />");
            });
            
            currentLine = "";
            content.append("<br />");
        
        } else if (e.keyCode === 8) {
            currentLine = currentLine.slice(0, -1);
            content.html(currentLine);
        } else {
            
            if (letter) {
                currentLine += letter;
                content.html(currentLine);
            } else {
                console.log(e.keyCode);
            }
        }
    });
  
}());