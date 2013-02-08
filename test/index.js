/*jslint plusplus: true, devel: true, nomen: true, node: true, es5: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

try {
    var reporter = require("nodeunit").reporters.default;
} catch (e) {
    console.log("Cannot find nodeunit module.");
    console.log("Please install dependant modules for this project by doing:");
    console.log("");
    console.log("    $ npm install");
    console.log("");
    process.exit();
}

process.chdir(__dirname);
reporter.run(["./command.js"]);