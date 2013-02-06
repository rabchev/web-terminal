/*jslint plusplus: true, devel: true, nomen: true, vars: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var io          = require("socket.io"),
    send        = require("send"),
    connect     = require("connect"),
    path        = require("path"),
    spawn       = require('child_process').spawn,
    pkg         = require("../package.json"),
    config      = pkg.config || {},
    standalone;

function redirect(res, url) {
    "use strict";
    
    res.statusCode = 301;
    res.setHeader("Location", url);
    res.end("Redirecting to " + url);
}

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
        standalone = true;
    }
    
    server.on("request", function (req, res) {
        if (req.url.indexOf(config.root) === 0) {
            
            send(req, req.url.substr(config.root.length))
                .root(path.normalize(__dirname + "/../web"))
                .on('error', function (err) {
                    res.statusCode = err.status || 500;
                    res.end(err.message);
                })
                .on('directory', function () {
                    redirect(res, req.url + "/");
                })
                .pipe(res);
        } else if (standalone) {
            redirect(res, config.root);
        }
    });
    
    var cwd         = process.cwd(),
        stdin;
    
    io = io.listen(server);
    io.sockets.on("connection", function (socket) {
        socket.on("console", function (command, callback) {
            console.log(command);
            
            if (stdin) {
                stdin.write(command);
                stdin.end();
            } else {
                var args    = command.split(" "),
                    cmd     = args.splice(0, 1),
                    proc    = spawn(cmd, args, { cwd: cwd });
                
                stdin = proc.stdin;
                proc.stdout.on("data", function (data) {
                    callback(data);
                });
                
                proc.stderr.on("data", function (data) {
                    callback(data);
                });
                
                proc.on("exit", function (code) {
                    stdin = null;
                });
            }
        });
    });
}

exports = module.exports = initialize;