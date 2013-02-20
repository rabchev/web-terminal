/*jslint plusplus: true, devel: true, nomen: true, vars: true, continue: true, indent: 4, maxerr: 50 */
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
            ""      : ["", false],
            "0"     : ["", false],
            "1"     : ["<b>", "</b>"],
            "01"    : ["<b>", "</b>"],
            "22"    : ["</b>", true],
            "3"     : ["<i>", "</i>"],
            "03"    : ["<i>", "</i>"],
            "23"    : ["</i>", true],
            "4"     : ["<u>", "</u>"],
            "04"    : ["<u>", "</u>"],
            "24"    : ["</u>", true],
            "7"     : ["<span class=\"inverse\">", "</span>"],
            "07"    : ["<span class=\"inverse\">", "</span>"],
            "27"    : ["</span>", true],
            "9"     : ["<del>", "</del>"],
            "09"    : ["<del>", "</del>"],
            "29"    : ["</del>", true],
            "39"    : ["</span>", true],
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
    
    function parseVT100(i, data, closures) {
        var code    = "",
            output  = "",
            val,
            curr,
            clsr;
        
        while (true) {
            curr = data[++i];
            if (curr === "m" || curr === ";") {
                val = vt100[code];
                if (val) {
                    output += val[0];
                    clsr = val[1];
                    
                    if (clsr === true) {
                        closures.pop();
                    } else if (clsr === false) {
                        while (closures.length > 0) {
                            output += closures.pop();
                        }
                    } else if (clsr) {
                        closures.push(clsr);
                    }
                    
                    if (curr === ";") {
                        code = "";
                        continue;
                    } else {
                        break;
                    }
                } else {
                    output += code;
                    break;
                }
            } else if (i === data.length) {
                output += code;
                break;
            }
            code += curr;
        }
        
        return { output: output, i: i };
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
            closure,
            res;
        
        
        for (i = 0; i < data.length; i++) {
            chr = data[i];
            idx = idx[chr];
            if (idx) {
                switch (typeof idx.value) {
                case "string":
                    output += idx.value;
                    idx = index;
                    seq = 0;
                    break;
                case "function":
                    res = idx.value(i, data, closures);
                    i = res.i;
                    output += res.output;
                    idx = index;
                    seq = 0;
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
                    chr = data[i];
                }
                switch (chr) {
                case "<":
                    chr = "&lt;";
                    break;
                case ">":
                    chr = "&gt;";
                    break;
                case "&":
                    chr = "&amp;";
                    break;
                case "\"":
                    chr = "&quot;";
                    break;
                case "'":
                    chr = "&#39;";
                    break;
                }
                output += chr;
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
        if (data) {
            appendContent(data);
        }
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
                if (currentLine === "exit") {
                    socket.disconnect();
                    window.open('', '_self', '');
                    window.close();
                } else {
                    appendContent("<br />");
                    socket.emit("console", currentLine);
                    if (currentLine !== lines[1]) {
                        lines.splice(1, 0, currentLine);
                    }
                    currentLine = "";
                    linePos = 0;
                }
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