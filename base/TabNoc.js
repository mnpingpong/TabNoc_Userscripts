function getTabNocVersion(){
	return {Version: "1.2.4", Date: "11.01.2018"};
}

try {
	if (String.prototype.contains === undefined) {String.prototype.contains = String.prototype.includes;}
	if (String.prototype.replaceAll === undefined) {String.prototype.replaceAll = function(search, replacement) {var target = this; return target.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'g'), replacement);};}
	if (Date.prototype.timeNow === undefined) {Date.prototype.timeNow = function () {return ((this.getHours() < 10) ? "0" : "") + this.getHours() + ":" + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ":" + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds();};}

	function getTabNoc(){
		var ScriptName = GM_info.script.name;

		if (unsafeWindow.TabNoc_ == null) {
			unsafeWindow.TabNoc_ = cloneInto(({}), unsafeWindow, {
				wrapReflectors: true
			});
		}
		if (unsafeWindow.TabNoc_[ScriptName] == null) {
			unsafeWindow.TabNoc_[ScriptName] = cloneInto(({}), unsafeWindow.TabNoc_, {
				wrapReflectors: true
			});
		}
		return unsafeWindow.TabNoc_[ScriptName];
	}

	function setTabNoc(obj){
		var ScriptName = GM_info.script.name;
		console.log("TabNoc.js.setTabNoc(): Adding " + ScriptName + " to TabNoc.js");

		if (unsafeWindow.TabNoc_ == null) {
			// console.log("Adding " + ScriptName + ": unsafeWindow.TabNoc_ is null");
			unsafeWindow.TabNoc_ = cloneInto(({}), unsafeWindow, {
				wrapReflectors: true
			});
		}
		if (unsafeWindow.TabNoc_[ScriptName] == null) {
			// console.log("Adding " + ScriptName + ": unsafeWindow.TabNoc_[ScriptName] is null");
			unsafeWindow.TabNoc_[ScriptName] = cloneInto(({}), unsafeWindow.TabNoc_, {
				wrapReflectors: true
			});
		}

		unsafeWindow.TabNoc_[ScriptName] = cloneInto(obj, unsafeWindow.TabNoc_, {
			wrapReflectors: true, cloneFunctions: true
		});
        TabNoc = unsafeWindow.TabNoc_[GM_info.script.name];
	}

	TabNoc = null;

	var Feedback = null;
	if (jQuery != undefined) {
		Feedback = {
			messageTimeout: null,
			showMessage: (function (message, type, time, onClickFunction) {
				var element = null;
				clearTimeout(Feedback.messageTimeout);
				Feedback.messageTimeout = null;

				if (document.getElementById("feedback") != null) {
					element = document.getElementById("feedback");
					$(element).off();
				}
				else {
					element = document.createElement("div");
					element.id = "feedback";
					element.title = "Dismiss";
					element.setAttribute("style", "position: fixed; top: 10px; text-align: center; width: 100%; z-index: 2147483647;");
					element.innerHTML = '<span style="border-radius: 5px; cursor: pointer; color: #fff; padding: 3px 6px; font-size: 16px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.2); text-shadow: 0 1px rgba(0, 0, 0, 0.2);"></span>';
					document.body.appendChild(element);
				}
				element.children[0].textContent = message.replaceAll("\r\n", "<br>");
				element.children[0].style.backgroundColor = ((type == "notify") ? "#00A550" : "#C41E3A");
				$(element).on("click", onClickFunction || Feedback.hideMessage);

				if (time){
					Feedback.messageTimeout = setTimeout(Feedback.hideMessage, time);
				}
			}),
			hideMessage: (function () {
				var element = document.getElementById("feedback");
				if (element != null) {
					if (Feedback.messageTimeout != null) {
						clearTimeout(Feedback.messageTimeout);
						Feedback.messageTimeout = null;
					}
					element.removeEventListener("click", Feedback.hideMessage, false);
					document.body.removeChild(element);
				}
			}),
			error: (function (message, time, onClickFunction) {
				Feedback.showMessage(message || "Something went wrong", "error", (time == null ? 8000 : time), onClickFunction);
			}),
			notify: (function (message, time, onClickFunction) {
				Feedback.showMessage(message, "notify", (time == null ? 5000 : time), onClickFunction);
			}),
			showProgress: (function(percent, msg, time, onClickFunction) {
				if (msg != null) {
					Feedback.showMessage(msg, "notify", time || 900, onClickFunction);
				}
				var elementID = this.Locked === true ? "myProgress2" : "myProgress";
				if (percent >= 100 || percent < 0) {
					if ($("#" + elementID).length === 1) {
						$("#" + elementID).css("transition-duration", "900ms");
						$("#" + elementID).css("width", Math.round(percent) + "%");
						setTimeout(this.Locked === true ? Feedback.hideProgress2 : Feedback.hideProgress, 800);
					}
					return;
				}
				if ($("#" + elementID).length !== 1 && percent < 100 && percent >= 0) {
					var style = "position: fixed; z-index: 2147483647; top: " + (this.Locked === true ? "2" : "0") + "px; left: -6px; width: 0%; height: 2px; background: #b91f1f; border-radius: 1px; transition: width 500ms ease-out,opacity 500ms linear; transform: translateZ(0); will-change: width,opacity;";
					var styleNested = "position: absolute; top: " + (this.Locked === true ? "2" : "0") + "px; height: 2px; box-shadow: #b91f1f 1px 0 6px 1px;border-radius: 100%;";
					var styleDt = "opacity: .6; width: 180px; right: -80px; clip: rect(-6px,90px,14px,-6px);";
					var styleDd = "opacity: .6; width: 20px; right: 0; clip: rect(-6px,22px,14px,10px);";
					var progressBarHTML = $("<div id=\"" + elementID + "\" style=\"" + style + "transition-duration: 300ms;width: 0%;height: 2px\"><dt style=\"" + styleNested + styleDt + "\"></dt><dd style=\"" + styleNested + styleDd + "\"></dd></div>");

					$(document.body).append(progressBarHTML);
				}
				$("#" + elementID).show();
				$("#" + elementID).css("width", Math.round(percent) + "%");
			}),
			hideProgress: (function() {
				if ($("#myProgress").length === 1) {
					$("#myProgress").hide();
				}
			}),
			hideProgress2: (function() {
				if ($("#myProgress2").length === 1) {
					$("#myProgress2").hide();
				}
			}),
			Locked : false,
			lockProgress: (function() {
				if (this.Locked === true) {
					throw "TabNoc.js:Fedback.lockProgress->Die Progressbar kann nicht gesperrt werden wenn sie bereits gesperrt ist.";
				}
				this.Locked = true;
			}),
			unlockProgress: (function() {
				if (this.Locked === false) {
					throw "TabNoc.js:Fedback.unlockProgress->Die Progressbar kann nicht entsperrt werden wenn sie nicht gesperrt ist.";
				}
				this.Locked = false;
			})
		};
	}

	console.log("TabNoc.js: Readed TabNoc_Config " + getTabNocVersion().Version + " by TabNoc (namespace: " + GM_info.script.name + ")");
} catch (exc) {
	console.error(exc);
	alert(exc);
}

