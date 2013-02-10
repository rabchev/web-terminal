/*jslint plusplus: true, devel: true, nomen: true, vars: true, indent: 4, maxerr: 50 */
/*global window, io, $ */

(function () {
    "use strict";
    
    var socket      = io.connect(),
        content     = $("#content"),
        lines       = [""],
        linePos     = -1,
        currentLine = "",
        index       = {};
    
    function addSequence(seq, val) {
        
        var prnt    = index,
            len     = seq.length - 1,
            chld,
            prop,
            i;
        
        for (i = 0; i <= len; i++) {
            prop = seq[i];
            chld = prnt[prop];
            
            if (!chld) {
                prnt[prop] = chld = (i === len) ? val : {};
            }
            prnt = chld;
        }
    }
    
    // Build the index
    //
    addSequence("\n", "<br />");
    addSequence("\r\n", "<br />");
    addSequence("\t", "&nbsp;&nbsp;&nbsp;&nbsp;");
    addSequence("  ", "&nbsp;&nbsp;");
    addSequence("\x1B[1m", "<b>");
    addSequence("\x1B[22m", "</b>");
    addSequence("\x1B[3m", "<i>");
    addSequence("\x1B[23m", "</i>");
    addSequence("\x1B[4m", "<u>");
    addSequence("\x1B[24m", "</u>");
    addSequence("\x1B[7m", "<span class=\"inverse\">");
    addSequence("\x1B[27m", "</span>");
    addSequence("\x1B[9m", "<del>");
    addSequence("\x1B[29m", "</del>");
    
    // close style
    addSequence("\x1B[39m", "</span>");
    
    // grayscale
    addSequence("\x1B[90m", "<span style=\"color:grey;\">");
    
    // fore colors
    addSequence("\x1B[30m", "<span style=\"color:black;\">");
    addSequence("\x1B[31m", "<span style=\"color:red;\">");
    addSequence("\x1B[32m", "<span style=\"color:green;\">");
    addSequence("\x1B[33m", "<span style=\"color:yellow;\">");
    addSequence("\x1B[34m", "<span style=\"color:blue;\">");
    addSequence("\x1B[35m", "<span style=\"color:magenta;\">");
    addSequence("\x1B[36m", "<span style=\"color:cyan;\">");
    addSequence("\x1B[37m", "<span style=\"color:white;\">");
    
    // background colors
    addSequence("\x1B[40m", "<span style=\"background-color:black;\">");
    addSequence("\x1B[41m", "<span style=\"background-color:red;\">");
    addSequence("\x1B[42m", "<span style=\"background-color:green;\">");
    addSequence("\x1B[43m", "<span style=\"background-color:yellow;\">");
    addSequence("\x1B[44m", "<span style=\"background-color:blue;\">");
    addSequence("\x1B[45m", "<span style=\"background-color:magenta;\">");
    addSequence("\x1B[46m", "<span style=\"background-color:cyan;\">");
    addSequence("\x1B[47m", "<span style=\"background-color:white;\">");
    
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
    
    function convertToHtml(data) {
        
        var i,
            chr,
            output  = "",
            idx     = index,
            seq     = 0;
        
        
        for (i = 0; i < data.length; i++) {
            chr = data[i];
            idx = idx[chr];
            if (idx) {
                if (typeof idx === "string") {
                    output += idx;
                    idx = index;
                    seq = 0;
                } else {
                    seq++;
                }
            } else {
                idx = index;
                
                if (seq > 0) {
                    i = i - seq;
                    seq = 0;
                    output += data[i];
                } else {
                    output += chr;
                }
            }
        }
        
        return output;
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
        appendContent(convertToHtml(data));
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