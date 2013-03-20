/*jslint plusplus: true, devel: true, nomen: true, vars: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var io          = require("socket.io"),
    send        = require("send"),
    connect     = require("connect"),
    path        = require("path"),
    spawn       = require('child_process').spawn,
    pkg         = require("../package.json"),
    cmdLine     = require("./command"),
    path        = require("path"),
    fs          = require("fs"),
    repl        = require("repl"),
    config      = pkg.config || {},
    standalone,
    http;

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
            server = (+config.port) || 8088;
        }
    }
    
    if ("string" === typeof server) {
        server = (+server);
    }
    
    if ("number" === typeof server) {
        // if a port number is passed
        var port = server;
        
        if (options && options.key) {
            http = require("https");
        } else {
            http = require("http");
        }
        server = http.createServer(options);
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
        stdin,
        args,
        cmd,
        proc,
        dir;
    
    io = io.listen(server, { log: false });
    io.sockets.on("connection", function (socket) {
        
        socket.on("disconnect", function () {
            server.close();
        });
        
        socket.on("signal", function (signal) {
            if (proc) {
                proc.kill(signal);
            }
        });
        
        socket.on("console", function (command) {
            console.log(command);
            
            if (stdin) {
                stdin.write(command);
                stdin.end();
            } else {
                args    = cmdLine.parse(command);
                cmd     = args.splice(0, 1)[0];
                
                switch (cmd) {
                case "cd":
                    dir = path.join(cwd, args[0]);
                    fs.exists(dir, function (exists) {
                        var msg;
                        if (exists) {
                            cwd = dir;
                            msg = "";
                        } else {
                            msg = "No such file or directory";
                        }
                        socket.emit("exit", msg);
                    });
                    
                    break;
                case "node":
                    repl.start({
                        prompt: "> ",
                        input: process.stdin,
                        output: process.stdout
                    });
                    break;
                default:
                    if (process.env.shell) {
                        if (command === "ls") {
                            command += " --color -C";
                        }
                        proc = spawn(process.env.shell, null, { cwd: cwd });
                        stdin = proc.stdin;
                        stdin.write(command);
                        stdin.end();
                    } else {
                        if (cmd === "ls" && args.length === 0) {
                            args.push("--color");
                            args.push("-C");
                        }
                        proc = spawn(cmd, args, { cwd: cwd });
                        stdin = proc.stdin;
                    }
                     
                    proc.stdout.setEncoding("utf8");
                    proc.stdout.on("data", function (data) {
                        socket.emit("console", data);
                    });
                    
                    proc.stderr.setEncoding("utf8");
                    proc.stderr.on("data", function (data) {
                        socket.emit("console", data);
                    });
                    
                    proc.on("close", function () {
                        stdin = null;
                        socket.emit("exit", "");
                    });
                    break;
                }
            }
        });
    });
}

exports = module.exports = initialize;