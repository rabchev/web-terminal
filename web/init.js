/*jslint plusplus: true, devel: true, nomen: true, vars: true, indent: 4, maxerr: 50 */
/*global window, io, $ */

(function () {
    "use strict";
    
    var socket      = io.connect(),
        content     = $("#content"),
        lines       = [""],
        linePos     = -1,
        currentLine = "";
        
    window.APP = {
        socket: socket
    };
    
    function appendContent(data) {
        content.append(data);
        
        $('html, body').animate({
            scrollTop: $(window.document).height()
        }, 500);
    }
    
    function appendLine() {
        if (currentLine.length > 0) {
            content.html(content.html().slice(0, currentLine.length * -1));
        }
        currentLine = lines[linePos];
        appendContent(currentLine);
    }
    
    $(window.document).keydown(function (e) {
        switch (e.keyCode) {
        case 8:
            if (currentLine.length > 0) {
                currentLine = currentLine.slice(0, -1);
                content.html(content.html().slice(0, -1));
            }
            break;
        case 38:
            if (linePos < lines.length - 1) {
                linePos++;
                appendLine();
            }
            return false;
        case 40:
            if (linePos > 0) {
                linePos--;
                appendLine();
            }
            return false;
        }
    });
    
    socket.on("exit", function (data) {
        appendContent("<br />~$ ");
    });
    
    socket.on("console", function (data) {
        data = data.replace(/\n/g, "<br />");
        appendContent(data);
    });
  
    $(window.document).keypress(function (e) {
        
        var letter = String.fromCharCode(e.keyCode);
  	
        // Handle 'enter'.
        if (e.keyCode === 13) {
            
            if (currentLine.length > 0) {
                // Send...
                
                appendContent("<br />");
                socket.emit("console", currentLine);
                if (currentLine !== lines[1]) {
                    lines.splice(1, 0, currentLine);
                }
                currentLine = "";
                linePos = 0;
            } else {
                appendContent("<br />~$ ");
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