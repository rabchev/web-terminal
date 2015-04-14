Web-Terminal
============
Web-Terminal is a very lightweight terminal server that provides remote CLI via standard web browser and HTTP protocol.
It works on all operating systems supported by Node.js, it doesn't depend on native modules.
Fast and easy to install. Supports mutiple sessions.

NOTE: It is not a TTY emulator. It doesn't support complex TTY interaction like in vi, nano and etc. It's good only for simple command/response cases. For fully featured TTY emulator I would suggest [Wetty](https://github.com/krishnasrinivas/wetty) project.

Prerequisites
-------------
Node.js v0.10 or newer.

Installation
------------

Install from npm:

    $ npm install web-terminal -g
    
Usage Examples
--------------

### Starting web-terminal:

    $ web-terminal --port 8088

Open your favorite web browser, navigate to http://localhost:8088 and start playing with the browser based CLI.

### Integrating web-terminal with web applications:
```javascript

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
    
```
Start the above application, then open your favorite browser and navigate to: http://localhost:8088/terminal

Features
--------

### Colors
Most of the display VT100 escape sequences are translated to HTML. However, Web-terminal doesn't present itself as TTY and 
therefore most programs won't output escape sequences to **stdout** unless they are explicitly instructed so.

Example configurations:

    $ git config --global color.ui always
    
    $ npm config set color always --global
    
### Shell commands
To execute commands through a shell such as bash or cmd.exe (for windows), an environment variable have to be set:

    $ export WEB_SHELL=bash
    
### JavaScript REPL
To start the REPL, just type **node** without arguments in the browser. 
Type **.exit** to return to the command prompt. 
NOTE: REPL is executed on the server, not in the brwoser.

Issues
------
Commands that require interaction with TTY cause web-terminal to stop responding.

For instance, commands like sudo that require password from TTY directly cause web-terminal to stop responding. In this case the whole process has to be restarted.

The workaround for the time being is to issue sudo with -S argument to instruct sudo to ask for password on the standard IO. 
Example: 

    $ sudo -S apt-get install git-core

For Git, passwords have to be stored to avoid this problem:

    $ git config credential.helper store

Security Considerations
-----------------------
Web-terminal does not provide embedded authentication and encryption mechanisms. 
Therefore, if the service is exposed to the Internet, it is strongly recommended to require TLS with client certificates or VPN connection.

License
-------

(MIT License)

Copyright (c) 2013 Boyan Rabchev <boyan@rabchev.com>. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
