/*jslint plusplus: true, devel: true, nomen: true, vars: true, node: true, indent: 4, maxerr: 50 */
/*global require, exports, module */

var stream      = require("stream"),
    util        = require("util");

function ReplStream() {
    "use strict";
    
    if (!(this instanceof ReplStream)) {
        return new ReplStream();
    }
    
    stream.Transform.call(this);
}

util.inherits(ReplStream, stream.Transform);

ReplStream.prototype._transform = function (chunk, encoding, done) {
    "use strict";
    
    this.push(chunk);
    done();
};

exports.ReplStream = ReplStream;
