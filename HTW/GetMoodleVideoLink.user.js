// ==UserScript==
// @name         GetMoodleVideoLink
// @namespace    https://github.com/mnpingpong/TabNoc_Userscripts
// @version      0.1
// @updateURL    https://github.com/mnpingpong/TabNoc_Userscripts/raw/master/HTW/GetMoodleVideoLink.user.js
// @description  Opens a prompt with the Url of the Video File
// @author       TabNoc
// @match        https://moodle.htw-berlin.de/mod/vimp/view.php?id=*
// @match        https://mediathek.htw-berlin.de/media/embed?*
// @grant        window.close
// ==/UserScript==

// @run-at       context-menu

(function() {
	'use strict';

	if (window.top === window.self) {
		window.addEventListener("message", function(event) {
			window.console.log("This is data from '" + event.data.title +
								"'; with message '" + event.data.message +
								"'; with data '" + event.data.data + "'" +
								"'; from domain '" + event.data.domain + "'");
			if (prompt("VideoUrl:", event.data.data) === event.data.data) {
				if (confirm("Open Link in New Tab?") === true) {
					window.open(event.data.data);
				}
				window.close();
			}
		}, false);
	}
	else {
		window.top.postMessage({
			title: document.title,
			domain: document.domain,
			message: "Hello from, iframe - " + document.title,
			data: document.querySelector("#p_video>source").src
		}, "*");
	}
	// Your code here...
})();