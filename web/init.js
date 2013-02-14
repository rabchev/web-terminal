/*jslint plusplus: true, devel: true, nomen: true, vars: true, indent: 4, maxerr: 50 */
/*global window, io, $ */

(function () {
    "use strict";
    
    var socket      = io.connect(),
        content     = $("#content"),
        lines       = [""],
        linePos     = -1,
        currentLine = "",
        index       = {},
        vt100       = {
            ""      : "[all]",
            "0"     : "[all]",
            "1"     : ["<b>", "</b>"],
            "01"    : ["<b>", "</b>"],
            "22"    : "</b>",
            "3"     : ["<i>", "</i>"],
            "03"    : ["<i>", "</i>"],
            "23"    : "<i>",
            "4"     : ["<u>", "</u>"],
            "04"    : ["<u>", "</u>"],
            "24"    : "</u>",
            "7"     : ["<span class=\"inverse\">", "</span>"],
            "07"    : ["<span class=\"inverse\">", "</span>"],
            "27"    : "</span>",
            "9"     : ["<del>", "</del>"],
            "09"    : ["<del>", "</del>"],
            "29"    : "</del>",
            "39"    : "</span>",
            "90"    : ["<span style=\"color:grey;\">", "</span>"],
            "30"    : ["<span style=\"color:black;\">", "</span>"],
            "31"    : ["<span style=\"color:red;\">", "</span>"],
            "32"    : ["<span style=\"color:green;\">", "</span>"],
            "33"    : ["<span style=\"color:yellow;\">", "</span>"],
            "34"    : ["<span style=\"color:blue;\">", "</span>"],
            "35"    : ["<span style=\"color:magenta;\">", "</span>"],
            "36"    : ["<span style=\"color:cyan;\">", "</span>"],
            "37"    : ["<span style=\"color:white;\">", "</span>"],
            "40"    : ["<span style=\"background-color:black;\">", "</span>"],
            "41"    : ["<span style=\"background-color:red;\">", "</span>"],
            "42"    : ["<span style=\"background-color:green;\">", "</span>"],
            "43"    : ["<span style=\"background-color:yellow;\">", "</span>"],
            "44"    : ["<span style=\"background-color:blue;\">", "</span>"],
            "45"    : ["<span style=\"background-color:magenta;\">", "</span>"],
            "46"    : ["<span style=\"background-color:cyan;\">", "</span>"],
            "47"    : ["<span style=\"background-color:white;\">", "</span>"]
        };
    
    function parseVT100(i, data, output) {
        
    }
        
    function addSequence(seq, val, closure) {
        
        var prnt    = index,
            len     = seq.length - 1,
            chld,
            prop,
            i;
        
        for (i = 0; i <= len; i++) {
            prop = seq[i];
            chld = prnt[prop];
            
            if (!chld) {
                prnt[prop] = chld = (i === len) ? { sequance: seq, value: val, closure: closure} : {};
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
    addSequence("\x1B[", parseVT100);
    
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
            j,
            chr,
            output      = "",
            idx         = index,
            seq         = 0,
            closures    = [],
            closure;
        
        
        for (i = 0; i < data.length; i++) {
            chr = data[i];
            idx = idx[chr];
            if (idx) {
                switch (typeof idx.value) {
                case "string":
                    if (idx.value === "[all]") {
                        while (closures.length > 0) {
                            output += closures.pop();
                        }
                    } else {
                        output += idx.value;
                        
                        if (idx.closure) {
                            if (idx.closure === true) {
                                closures.pop();
                            } else {
                                closures.push(idx.closure);
                            }
                        }
                    }
                    idx = index;
                    seq = 0;
                    break;
                case "function":
                    idx.value(i, data, output);
                    break;
                default:
                    seq++;
                    break;
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