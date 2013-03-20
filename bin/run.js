#!/usr/bin/env node

/*jslint plusplus: true, devel: true, nomen: true, node: true, vars: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var connect     = require("connect"),
    util        = require("util"),
    commander   = require("commander"),
    shell       = require("../"),
    pkg         = require("../package.json");

if (commander.options.length === 0) {
    commander
            .version(pkg.version)
            .option("-p, --port <port>", "Cpecifies the TCP port for the HTTP server.")
            .option("-s, --ssl", "Start HTTP server over secure socket layer.");
}

shell(commander.port);