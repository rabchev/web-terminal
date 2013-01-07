/*jslint plusplus: true, devel: true, nomen: true, vars: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var io          = require("socket.io"),
    send        = require("send"),
    connect     = require("connect"),
    exec        = require('child_process').exec,
    pkg         = require("../package.json"),
    config      = pkg.config || {};

function initialize(server, options, fn) {
    "use strict";
    
    if ("function" === typeof options) {
        fn = options;
        options = {};
    }
    
    if ("undefined" === typeof server) {
        if (process.env.PORT) {
            server = (+process.env.PORT);
        } else {
            server = config.port || 80;
        }
    }
    
    if ("number" === typeof server) {
        // if a port number is passed
        var port = server;
        
        if (options && options.key) {
            server = require("https").createServer(options);
        } else {
            server = require("http").createServer();
        }
        
        server.listen(port, fn);
    }
    
    server.on("request", function (req, res) {
        if (req.url.indexOf(config.root) === 0) {
            res.writeHead(200);
            res.end('This is the terminal!');
        }
    });
    
    io = io.listen(server);
    io.sockets.on("connection", function (socket) {
        socket.on("console", function (command, callBack) {
    
            console.log(command);
    
            exec(command, function (error, stdout, stderr) {
                if (error) {
                    console.log("error: ");
                    console.log(error);
                }
    
                console.log(stdout);
                callBack(stdout);
            });
        });
    });
}

exports = module.exports = initialize;