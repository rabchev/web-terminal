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
    util        = require("util"),
    streams     = require("./streams"),
    config      = pkg.config || {},
    standalone,
    http,
    autoClose;

function redirect(res, url) {
    "use strict";
    
    res.statusCode = 301;
    res.setHeader("Location", url);
    res.end("Redirecting to " + url);
}

function initialize(server, options, fn) {
    "use strict";
    
    var port, sPort, protocol;
    
    if ("function" === typeof options) {
        fn = options;
        options = {};
    }
    
    if (undefined === server) {
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
        port = server;
        
        if (options && options.key) {
            protocol = "https";
            http = require(protocol);
            sPort = (port !== 443) ? ":" + port : "";
        } else {
            protocol = "http";
            http = require(protocol);
            sPort = (port !== 80) ? ":" + port : "";
        }
        
        server = http.createServer(options);
        server.listen(port, fn);
        standalone = true;
        
        console.log(util.format("Web-Terminal running at %s://localhost%s/terminal", protocol, sPort));
    }
    
    if (options) {
        autoClose = options.autoClose;
    }
    
    if (!config.root) {
        config.root = "/terminal";
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
        
    io = io.listen(server, { log: false });
    io.sockets.on("connection", function (socket) {
        
        var cwd         = process.cwd(),
            env         = process.env,
            linebreak   = "\n", // check if we need to add \r\n for windows
            promptChar  = process.platform === "win32" ? ">" : "$",
            stdin,
            args,
            cmd,
            proc,
            dir,
            replSrv;
        
        function execCmd(command) {
            if (env.WEB_SHELL) {
                proc = spawn(env.WEB_SHELL, null, { cwd: cwd, env: env });
                stdin = proc.stdin;
                stdin.write(command);
                stdin.end();
            } else {
                proc = spawn(cmd, args, { cwd: cwd, env: env });
                stdin = proc.stdin;
            }
            
            proc.on("error", function (data) {
                // Do nothing, we have to handle this event to prevent exceptoin bubbling.
            });
             
            proc.stdout.setEncoding("utf8");
            proc.stdout.on("data", function (data) {
                socket.emit("console", data);
            });
            
            proc.stderr.setEncoding("utf8");
            proc.stderr.on("data", function (data) {
                if (data.indexOf("execvp():") === 0) {
                    data = cmd + ": command not found";
                }
                socket.emit("console", data);
            });
            
            proc.on("close", function () {
                stdin = null;
                socket.emit("exit", "");
            });
        }
        
        function startRepl() {
            var input   = streams.ReplStream(),
                output  = streams.ReplStream();
                
            input.setEncoding("utf8");
            output.setEncoding("utf8");
                
            stdin = input;
            output.on("data", function (data) {
                socket.emit("console", data);
            });
                
            replSrv = repl.start({
                prompt: "> ",
                input: input,
                output: output,
                terminal: false,
                useColors: true
            });
                
            replSrv.on("exit", function () {
                stdin = null;
                socket.emit("configure", {
                    prompt      : cwd,
                    promptChar  : promptChar
                });
                socket.emit("exit");
                replSrv = null;
            });
            
            socket.emit("configure", {
                prompt      : "",
                promptChar  : ">"
            });
        }
        
        socket.on("disconnect", function () {
            if (autoClose && io.sockets.clients().length === 0) {
                server.close();
            }
        });
        
        socket.on("signal", function (signal) {
            var cmd;
            
            if (replSrv) {
                switch (signal) {
                case "SIGINT":
                    cmd = ".break";
                    break;
                case "SIGQUIT":
                    cmd = ".exit";
                    break;
                }
                stdin.write(cmd + linebreak);
            } else if (proc) {
                proc.kill(signal);
            }
        });
        
        socket.on("console", function (command) {
            var i, arg;
            
            if (stdin) {
                stdin.write(command + linebreak);
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
                            msg = "cwd: " + cwd;
                        } else {
                            msg = "No such file or directory";
                        }
                        socket.emit("exit", msg);
                    });
                    
                    break;
                case "export":
                    for (i = 0; i < args.length; i++) {
                        arg = args[i].split("=");
                        env[arg[0]] = arg[1];
                    }
                    socket.emit("exit");
                    break;
                case "unset":
                    for (i = 0; i < args.length; i++) {
                        delete env[args[i]];
                    }
                    socket.emit("exit");
                    break;
                case "env":
// TODO: handle env command to manage environment variables
                    args.length = 0;
                    command = "env";
                    execCmd(command);
                    break;
                case "ls":
                    if (env.WEB_SHELL) {
                        if (command.length === 2) {
                            command += " --color -C";
                        }
                    } else {
                        if (args.length === 0) {
                            args.push("--color");
                            args.push("-C");
                        }
                    }
                    execCmd(command);
                    break;
                case "node":
                    if (args.length === 0) {
                        startRepl();
                    } else {
                        execCmd(command);
                    }
                    break;
                default:
                    execCmd(command);
                }
            }
        });
        
        socket.emit("configure", {
            srvOS       : process.platform,
            prompt      : cwd,
            promptChar  : promptChar
        });
        socket.emit("exit");
    });
    
    return server;
}

exports = module.exports = initialize;