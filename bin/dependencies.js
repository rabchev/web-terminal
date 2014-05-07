/*jslint plusplus: true, devel: true, nomen: true, node: true, vars: true, indent: 4, maxerr: 50 */

"use strict";

var exec;

if (process.getuid && process.setuid) {
    exec = require("child_process").exec;
    exec("./bin/libpam-dev-check.sh", function (err) {
        if (!err) {
            exec("npm install authenticate-pam", function () {

            });
        } else {
            console.log(err);
        }
    });
}
