/*jslint plusplus: true, devel: true, nomen: true, node: true, indent: 4, maxerr: 50 */

var testCase  = require("nodeunit").testCase,
    command     = require("../lib/command");

module.exports = testCase({
    "Command Line With Double Quotes": function (test) {
        "use strict";

        test.expect(5);

        var args = command.parse("git commit -am \"Just a test commit.\"");
        test.equal(args.length, 4);
        test.equal(args[0], "git");
        test.equal(args[1], "commit");
        test.equal(args[2], "-am");
        test.equal(args[3], "Just a test commit.");

        test.done();
    },
    "Command Line With Single Quotes": function (test) {
        "use strict";

        test.expect(5);

        var args = command.parse("git commit -am 'Just a test commit.'");
        test.equal(args.length, 4);
        test.equal(args[0], "git");
        test.equal(args[1], "commit");
        test.equal(args[2], "-am");
        test.equal(args[3], "Just a test commit.");

        test.done();
    },
    "Command Line With Escaped Single Quote": function (test) {
        "use strict";

        test.expect(5);

        var args = command.parse("git commit -am 'don\\'t do it'");
        test.equal(args.length, 4);
        test.equal(args[0], "git");
        test.equal(args[1], "commit");
        test.equal(args[2], "-am");
        test.equal(args[3], "don't do it");

        test.done();
    },
    "Command Line With Escaped Double Quote": function (test) {
        "use strict";

        test.expect(5);

        // This is equal to 'Just a \\"Test\\" commit.'
        var args = command.parse("git commit -am \"Just a \\\"Test\\\" commit.\"");
        test.equal(args.length, 4);
        test.equal(args[0], "git");
        test.equal(args[1], "commit");
        test.equal(args[2], "-am");
        test.equal(args[3], "Just a \"Test\" commit.");

        test.done();
    },
    "Command Line With Path": function (test) {
        "use strict";

        test.expect(6);

        var args = command.parse(" works -o -d ../../Projects/entree & ");
        test.equal(args.length, 5);
        test.equal(args[0], "works");
        test.equal(args[1], "-o");
        test.equal(args[2], "-d");
        test.equal(args[3], "../../Projects/entree");
        test.equal(args[4], "&");

        test.done();
    },
    "Command Line With Windows Path": function (test) {
        "use strict";

        test.expect(10);

        var args = command.parse("    works   -o    -d  .\\Projects\\entree.js -i \"test project\" -b \"Blah Balh\" &  ");
        test.equal(args.length, 9);
        test.equal(args[0], "works");
        test.equal(args[1], "-o");
        test.equal(args[2], "-d");
        test.equal(args[3], ".\\Projects\\entree.js");
        test.equal(args[4], "-i");
        test.equal(args[5], "test project");
        test.equal(args[6], "-b");
        test.equal(args[7], "Blah Balh");
        test.equal(args[8], "&");

        test.done();
    }
});
