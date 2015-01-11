/*jslint plusplus: true, devel: true, nomen: true, vars: true, node: true, indent: 4, maxerr: 50 */

"use strict";

var io          = require("socket.io"),
    send        = require("send"),
    path        = require("path"),
    spawn       = require("child_process").spawn,
    exec        = require("child_process").exec,
    pkg         = require("../package.json"),
    cmdLine     = require("./command"),
    path        = require("path"),
    fs          = require("fs"),
    repl        = require("repl"),
    util        = require("util"),
    _           = require("lodash"),
    streams     = require("./streams"),
    config      = pkg.config || {},
    errs        = {
        loginNotPosix   : "Login option is available only on POSIX platforms. Please, restart web-terminal without --login option.",
        loginNotRoot    : "Web-terminal must run with root privileges to use --login option. Please start web-terminal with sudo command.",
        loginNoPam      : "Could not load authenticate-pam module. Most likely the module was not installed properly. Please make sure that libpam-dev package is installed prior to web-terminal installation.",
        wrongCrdtls     : "Wrong username or password."
    },
    standalone,
    http,
    autoClose,
    pam;

function redirect(res, url) {
    res.statusCode = 301;
    res.setHeader("Location", url);
    res.end("Redirecting to " + url);
}

function initLogin(socket) {
    if (pam) {
        return true;
    }

    if (process.getuid && process.setuid) {
        if (process.getuid() === 0) {
            try {
                pam = require("authenticate-pam");
                return true;
            } catch (err) {
                console.log(errs.loginNoPam);
                if (socket) {
                    socket.emit("exit", errs.loginNoPam);
                } else {
                    process.exit(1);
                }
            }
        } else {
            console.log(errs.loginNotRoot);
            if (socket) {
                socket.emit("exit", errs.loginNotRoot);
            } else {
                process.exit(1);
            }
        }
    } else {
        console.log(errs.loginNotPosix);
        if (socket) {
            socket.emit("exit", errs.loginNotPosix);
        } else {
            process.exit(1);
        }
    }

    return false;
}

function initialize(options, fn) {

    var port, sPort, protocol, server;

    if (process.env.WEBT_LOGIN) {
        initLogin();
    }

    if ("function" === typeof options) {
        fn = options;
        options = {};
    }

    if (undefined === options.port) {
        if (process.env.PORT) {
            options.port = (+process.env.PORT);
        } else {
            options.port = (+config.port) || 8088;
        }
    }

    if ("string" === typeof options.port) {
        options.port = (+options.port);
    }

    if (/\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(options.interface)) {
        var host = options.interface;
    }

    if ("number" === typeof options.port) {
        // if a port number is passed
        port = options.port;

        if (options && options.key) {
            protocol = "https";
            sPort = (port !== 443) ? ":" + port : "";
        } else {
            protocol = "http";
            sPort = (port !== 80) ? ":" + port : "";
        }

        http = require(protocol);

        server = http.createServer();
        
        if (host) {
            server.listen(port, host, fn);
        } else {
            server.listen(port, fn);
        }
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
                .on("error", function (err) {
                    res.statusCode = err.status || 500;
                    res.end(err.message);
                })
                .on("directory", function () {
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
            env         = _.clone(process.env),
            home        = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE,
            linebreak   = "\n", // check if we need to add \r\n for windows
            promptChar  = process.platform === "win32" ? ">" : "$",
            stdin,
            args,
            cmd,
            proc,
            dir,
            replSrv,
            user,
            username;

        function execCmd(command, shell, terminate) {
            if (env.WEBT_LOGIN && !user) {
                socket.emit("exit", "login required");
                return;
            }

            var opts = { cwd: cwd, env: env };
            if (user) {
                opts.uid = user;
            }

            if (env.WEB_SHELL || shell) {
                proc = spawn(env.WEB_SHELL || shell, null, opts);
                stdin = proc.stdin;
                stdin.write(command + linebreak);
                if (terminate) {
                    stdin.end();
                }
            } else {
                proc = spawn(cmd, args, opts);
                stdin = proc.stdin;
            }

            proc.on("error", function (err) {
                if (err.code === "ENOENT") {
                    err.message = cmd + ": command not found";
                }
                socket.emit("console", err.message);
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
            var i, arg, basePath;

            if (stdin) {
                stdin.write(command + linebreak);
            } else {
                args    = cmdLine.parse(command);
                cmd     = args.splice(0, 1)[0];

                switch (cmd) {
                case "cd":
                    arg = args[0];
                    if (arg[0] === "~") {
                        basePath = home;
                        arg = arg.substring(2);
                    } else {
                        basePath = cwd;
                    }
                    dir = path.resolve(basePath, arg);
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
                case "echo":
                    execCmd(command, process.platform === "win32" ? "cmd" : "bash", true);
                    break;
                case "login":
                case "logout":
                    if (initLogin(socket)) {
                        user = undefined;
                        username = undefined;
                        env.WEBT_LOGIN = "login";
                        socket.emit("configure", { prompt: "", promptChar: ">" });
                        socket.emit("username");
                    }
                    break;
                default:
                    execCmd(command);
                }
            }
        });

        function begin() {
            socket.emit("configure", {
                srvOS       : process.platform,
                prompt      : cwd,
                promptChar  : promptChar
            });
            socket.emit("exit");
        }

        socket.on("username", function (input) {
            username = input;
            socket.emit("password");
        });

        socket.on("password", function (input) {
            pam.authenticate(username, input, function (err) {
                if (err) {
                    console.log("Authentication failed: " + err);
                    socket.emit("exit", errs.wrongCrdtls);
                    socket.emit("username");
                } else {
                    console.log("Authenticated: " + username);
                    require("uid-number")(username, function (err, uid) {
                        if (err) {
                            console.log(err);
                            socket.emit("exit", err);
                        } else {
                            user = uid;
                            exec("echo ~" + username, function (err, stdout) {
                                if (err) {
                                    console.log(err);
                                    socket.emit("exit", err);
                                } else {
                                    cwd = home = env.HOME = stdout.toString().trim();
                                    begin();
                                }
                            });
                        }
                    });
                }
            });
        });

        if (process.env.WEBT_LOGIN) {
            socket.emit("username");
        } else {
            begin();
        }
    });

    return server;
}

module.exports = initialize;
