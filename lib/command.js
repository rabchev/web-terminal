/*jslint plusplus: true, devel: true, nomen: true, vars: true, node: true, continue: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

exports.parse = function (commandLine) {
    "use strict";
    
    var i,
        buffer  = "",
        args    = [],
        opened,
        escape;
    
    for (i = 0; i < commandLine.length; i++) {
        var c = commandLine[i];
        
        if (c === " " && !opened) {
            if (buffer !== "") {
                args.push(buffer);
                buffer = "";
            }
            continue;
        }
        
        if ((c === "\"" || c === "'") && !escape) {
            if (c === opened) {
                opened = null;
            } else {
                opened = c;
            }
            continue;
        }
        
        if (c === "\\" && opened && !escape) {
            escape = true;
            continue;
        }
        
        if (escape) {
            escape = false;
        }
        
        buffer += c;
    }
    
    if (buffer !== "") {
        args.push(buffer);
    }
    
    return args;
};