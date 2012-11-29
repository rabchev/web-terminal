/*jslint plusplus: true, devel: true, nomen: true, vars: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var io = require('socket.io');

function initialize(server) {
    "use strict";
    
    if (!server && process.env.SHELL_PORT) {
        server = process.env.SHELL_PORT;
    }
    
    io = io.listen(server);
    io.sockets.on('connection', function (socket) {
        socket.on('console', function (command, callBack) {
    
            //console.log(command)
    
            function puts(error, stdout, stderr) {
                if (error) {
                    console.log('error: ');
                    console.log(error);
                }
    
                console.log(stdout);
                callBack(stdout);
                //sys.puts(stdout) 
            }
    
            //exec(command, puts);
        });
    });
}