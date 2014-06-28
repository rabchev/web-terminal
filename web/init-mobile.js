/*jslint plusplus: true, devel: true, nomen: true, vars: true, continue: true, regexp: true, indent: 4, maxerr: 50 */
/*global window, io, $ */

(function () {
    "use strict";
    
    // Code for mobile device only
    var mobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
    if(mobileAgent.test(navigator.userAgent)) {
	console.log("Running on mobile device");
	// Insert hidden input
	$('body').append('<input type="text" id="hidden-input"/>');
	// Bind events
	var content = $("#content");
	content.click(function (e) {
	    $("#hidden-input").focus();
	});
    }
    console.log("Not on mobile device");
}());
