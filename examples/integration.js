/*jslint plusplus: true, devel: true, nomen: true, vars: true, node: true, sloppy: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var http        = require("http"),
    terminal    = require("web-terminal");

var app = http.createServer(function (req, res) {
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("Hello World\n");
});

app.listen(1337);

console.log("Server running at http://127.0.0.1:1337/");

terminal(app);

console.log("Web-terminal accessible at http://127.0.0.1:1337/terminal");