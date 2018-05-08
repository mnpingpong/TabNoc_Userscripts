// ==UserScript==
// @name        MarkGolemPages
// @namespace   TabNoc
// @include     http*://www.golem.de/*
// @version     1.3.4_07052018
// @require     https://code.jquery.com/jquery-2.1.1.min.js
// @require     https://raw.githubusercontent.com/mnpingpong/TabNoc_Userscripts/ImplementSync/base/GM__.js
// @require     https://raw.githubusercontent.com/mnpingpong/TabNoc_Userscripts/ImplementSync/base/TabNoc.js
// @require     https://raw.githubusercontent.com/benjamine/jsondiffpatch/v0.2.5/public/build/jsondiffpatch.js
// @require     https://raw.githubusercontent.com/benjamine/jsondiffpatch/v0.2.5/public/build/jsondiffpatch-formatters.js
// @resource    JDiffHtml https://raw.githubusercontent.com/benjamine/jsondiffpatch/v0.2.5/public/formatters-styles/html.css
// @resource    JDiffAnno https://raw.githubusercontent.com/benjamine/jsondiffpatch/v0.2.5/public/formatters-styles/annotated.css
// @require     https://raw.githubusercontent.com/mnpingpong/TabNoc_Userscripts/ImplementSync/base/States.js
// @require     https://raw.githubusercontent.com/mnpingpong/TabNoc_Userscripts/ImplementSync/base/ImportAll.js
// @require     https://raw.githubusercontent.com/mnpingpong/TabNoc_Userscripts/ImplementSync/base/jquery_ui/jquery-ui.min.js
// @require     https://gist.githubusercontent.com/TheDistantSea/8021359/raw/89d9c3250fd049deb23541b13faaa15239bd9d05/version_compare.js
// @resource	JqueryUI https://raw.githubusercontent.com/mnpingpong/TabNoc_Userscripts/ImplementSync/base/jquery_ui/jquery-ui.min.css
// @resource	MyCss https://raw.githubusercontent.com/mnpingpong/TabNoc_Userscripts/ImplementSync/Golem/MarkGolemPages.css
// updateURL   https://github.com/mnpingpong/TabNoc_Userscripts/raw/master/Golem/MarkGolemPages.user.js
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_registerMenuCommand
// @grant       GM_listValues
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       GM_xmlhttpRequest
// @grant       GM_addValueChangeListener
// @grant       GM_openInTab
// @connect     tabnoc.gear.host
// @noframes
// ==/UserScript==

/*
ChangeList started at 12.12.2016

12.12.2016 - 1.0.0
Start Writing Script

27.04.2017 - 1.1.0
	- changed a bunch

28.04.2017 - 1.1.1
	- optical Improvements

08.05.2017 - 1.2.0
	- rewritten Styling, Script now uses own css file instead of node styles
	- further optical Improvements

10.05.2017 - 1.2.1
	- added @updateURL
	- fixed wrong TabNoc.js file being loaded

21.08.2017 - 1.2.2
	- fixed: very short Message Display Time after Marking
	- changed: Marking Button will only be displayed, if Element isn't marked

19.09.2017 - 1.2.3
	- added: jsondiffpatch
	- added: SetData
	- changed: SetData now uses Diff to provide multiple States

30.09.2017 - 1.2.4
	- added: CreateHistoryDialog
	- added: Version checking from Imports

30.09.2017 - 09.04.2018 - 1.3.0 beta
	- changed alot

09.04.2018 - 1.3.1
	- added: Debug to show Refresh reason

26.04.2018 - 1.3.2
	- changed: modified src, so a webSite change is more easy to handle

02.05.2018 - 1.3.3
	- added: ScanWithKeyPress

07.05.2018 - 1.3.4
	- changed: Validating Element with CheckCurrentElementFunction
	- added: ScanWithKeyPress at Page view to Scan Page etc.
	- changed: replaced UpdateDataBase with a more generic version
*/

try {
	setTabNoc({
		Variables: {
			startTime: new Date(),
			checkElementsInterval: null,
			Interval: null,
			MarkToggleState: true,
			lastCheckItemCount: 0,
			lastCheckScanBufferAmount: 0,
			Active: true,

			promptOnClose : true,

			Debug: false, // WebKonsole: TabNoc_.MarkGolemPages.Variables.Debug = true;
			// Wird zurückgesetzt, wenn die Seite versteckt war
			WasHidden: true,
			// Status, wann die Funktion wieder bestätigt werden muss
			ScanWithKeyPressActiveTimeOut: 0,
			PageReaded: false
		},

		Settings: {
			SavingEnabled: true,
			MarkAfterScan: true,
			HideAlreadyWatchedNews : false,

			Personal: {
				ScanUninterestingTweet: false,
				HideUninterestingTweets: false,
				UninterestingTweetsText: [],
				TimerInterval: 1000
			},

			ScanWithKeyPressEnabled: true,
			ShowOpenInNewTabButton: false,

			ScanButtonDomParent: "#grandwrapper",
			ElementsSearchString: "#index-promo, .list-articles>li",
			NameOfElements: "Newspages",
			NameOfElement: "Newspage",
			GetIDFunction: function(element) {return $(element).children("a")[0].getAttribute("href");},
			GetCurrentSiteIDFunction: function() {return document.URL;},
			CheckCurrentElementFunction: function(element) {return $(element).children("a").length === 1 && ($(element).children("a")[0].getAttribute("id").includes("hpalt") ||
														  $(element).children("a")[0].getAttribute("id").includes("bigalt") ||
														  $(element).children("a")[0].getAttribute("id").includes("msalt"));}
		},

		HTML: {
			ScanButton: '<div class="MyScanButton" title="Scannen"><div></div></div>',
			ReadButton: '<div class="MyReadButton" title="Lesen"><div></div></div>',
			OpenTabButton: '<div class="MyOpenTabButton" title="Open in new Tab"><div></div></div>'
		}
	});

	// ### http*://www.golem.de ###
	function StartPageLoader() {
		console.log("MarkGolemPages.user.js loading");
		try {
			registerTabNoc();

			// ############# Golem Code #############

			$("#index-vica2").remove();

			$(".list-articles>li").detach().appendTo($(".list-articles").first());

			$(".iqadlinetop>div").css("border-color", "transparent");

			// ############# Golem Code #############

			// ## ScanWithKeyPress ##

			if (TabNoc.Settings.ScanWithKeyPressEnabled === true) {
				$(document).on("keydown", event => {
					if (event.keyCode == 160) {
						if (TabNoc.Variables.ScanWithKeyPressActiveTimeout > new Date() && TabNoc.Variables.WasHidden == false) {
							let scanElement = $(TabNoc.Settings.ElementsSearchString).toArray().find(element => element.className == "MyPageElement");
							if (scanElement != null) {getAllElements(null, TabNoc.Settings.GetIDFunction(scanElement), false);}
							event.preventDefault();
							TabNoc.Variables.ScanWithKeyPressActiveTimeout = new Date(new Date().getTime() + 600000);
						}
						else {
							if (confirm("Soll die Bearbeitung durch ScanWithKeyPress aktiviert werden?") == true) {
							TabNoc.Variables.ScanWithKeyPressActiveTimeout = new Date(new Date().getTime() + 600000);
								TabNoc.Variables.WasHidden = false;
							}
						}
					}
				});
			}

			// ## ScanWithKeyPress ##

			var ScanButton = $(TabNoc.HTML.ScanButton);
			ScanButton.click(function(){getAllElements();$(TabNoc.Settings.ScanButtonDomParent + ">.MyScanButton").remove();});
			$(TabNoc.Settings.ScanButtonDomParent).append(ScanButton);

			var ValueChangeCallback = function(name, old_value, new_value, remote) {
				startCheckElements(TabNoc.Variables.MarkToggleState, true);
			};
			GM_addValueChangeListener("ReadedNewsArray", ValueChangeCallback);
			GM_addValueChangeListener("SeenNewsArray", ValueChangeCallback);
			GM_addValueChangeListener("ToReadNewsArray", ValueChangeCallback);

			TabNoc.Variables.checkElementsInterval = setInterval(returnExec(function () {
				startCheckElements(TabNoc.Variables.MarkToggleState);
			}), TabNoc.Settings.Personal.TimerInterval);
			console.log("MarkGolemPages.user.js executed");

			console.log("MarkGolemPages.user.js done");
		} catch (exc) {
			console.error(exc);
			alert(exc);
		}
	}

	function registerTabNoc() {
		// Scannen
		exportFunction(getAllElements, unsafeWindow, {
			defineAs: "getAllElements"
		});

		GM_registerMenuCommand("Einlesen", returnExec(getAllElements));

		GM_registerMenuCommand("CreateHistoryDialog", function() {CreateHistoryDialog(GetData("changes", "([])", true));});

		GM_registerMenuCommand("ManuelleSyncronisation", returnExec(Syncronisieren));
	}

	/**
	 * [startCheckElements description]
	 * @param  {bool} ToggleState Overwirtes ToggleState
	 * @param  {bool} force       foreces Execution when true
	 * @return {void}
	 */
	function startCheckElements(ToggleState, force) {
		if (document.hidden === false || force === true) {
			var elements = $(TabNoc.Settings.ElementsSearchString);
			if (force === true || TabNoc.Variables.lastCheckItemCount !== elements.length) {
				// ### ReadedNewsArray ###
				var ReadedNewsArray = GetData("ReadedNewsArray", "([])", true);
				// ### SeenNewsArray ###
				var SeenNewsArray = GetData("SeenNewsArray", "([])", true);
				// ### ToReadNewsArray ###
				var ToReadNewsArray = GetData("ToReadNewsArray", "([])", true);

				if (TabNoc.Variables.Debug === true) {
					console.log(force === true, TabNoc.Variables.lastCheckItemCount !== elements.length);
				}

				execTime(checkElements, ReadedNewsArray.reverse(), elements, ToggleState, SeenNewsArray.reverse(), ToReadNewsArray.reverse());

				TabNoc.Variables.lastCheckItemCount = elements.length;
			}
		}
		else {
			TabNoc.Variables.WasHidden = true;
		}
	}

	function checkElements(ReadedNewsArray, elements, ToggleState, SeenNewsArray, ToReadNewsArray) {
		var UnScannedElements = 0;
		Feedback.showProgress(0, "Initialised Scan");

		if (ToggleState == null) {
			ToggleState = TabNoc.Variables.MarkToggleState;
		}

		for (var i = 0; i < elements.length; i++) {
			Feedback.showProgress(i / elements.length * 100, "Analysing Element " + i + " from " + elements.length);
			var element = elements[i];

			if (TabNoc.Settings.CheckCurrentElementFunction(element) == true) {
				UnScannedElements = checkElement(element, ReadedNewsArray, ToggleState, SeenNewsArray, ToReadNewsArray) == true ? UnScannedElements : UnScannedElements + 1;
			} else {
				console.error("CheckCurrentElementFunction: Folgendes Element entspricht nicht den Vorgaben", element);
			}
		}
		TabNoc.Variables.MarkToggleState = ToggleState;

		Feedback.showProgress(100, "Finished " + (elements.length - UnScannedElements) + " elements marked");
		console.log((elements.length - UnScannedElements) + " Marked Elements | " + UnScannedElements + " UnMarked Elements | Total " + elements.length + " Elements (" + ReadedNewsArray.length + " " + TabNoc.Settings.NameOfElements + " readed, " + ToReadNewsArray.length + " " + TabNoc.Settings.NameOfElements + " to read, " + SeenNewsArray.length + " " + TabNoc.Settings.NameOfElements + " marked)");

		if (TabNoc.Settings.HideAlreadyWatchedNews === false) {
			Feedback.notify(UnScannedElements + " UnMarked Elements", 10000, function(){TabNoc.Settings.HideAlreadyWatchedNews = !TabNoc.Settings.HideAlreadyWatchedNews; startCheckElements(true, true);Feedback.hideMessage();});
		}
	}

	function checkElement(checkElement, ReadedNewsArray, ToggleState, SeenNewsArray, ToReadNewsArray) {
		//return true if checkedElement is already Scanned
		var SearchString = TabNoc.Settings.GetIDFunction(checkElement);

		var ReadedID = ReadedNewsArray.indexOf(SearchString);
		var SeenID = SeenNewsArray.indexOf(SearchString);
		var ToReadID = ToReadNewsArray.indexOf(SearchString);

		if ($(checkElement).find(".MyScanButton").length === 0 && $(checkElement).find(".MyMarkedReadedElement").length === 0 && $(checkElement).find(".MyOpenTabButton").length === 0 && $(checkElement).find(".MyMarkedSeenElement").length === 0) {
			let ScanButton = $(TabNoc.HTML.ScanButton);
			ScanButton.click(function(){getAllElements(SearchString, SearchString);});
			$(checkElement).append(ScanButton);

			let ReadButton = $(TabNoc.HTML.ReadButton);
			ReadButton.click(function(){if (confirm("Soll dieser Eintrag wirklich ohne zu öffnen auf ToRead gesetz werden?") == true) getAllElements(SearchString, SearchString, true);});
			$(checkElement).append(ReadButton);

			if (TabNoc.Settings.ShowOpenInNewTabButton == true) {
				let OpenTabButton = $(TabNoc.HTML.OpenTabButton);
				OpenTabButton.click(function(){GM_openInTab(SearchString, {active: false, loadInBackground: true, insert: true, setParent: true});});
				$(checkElement).append(OpenTabButton);
			}
		}

		if (ToggleState === true) {
			$(checkElement).addClass("MyPageElement");
			if (ReadedID !== -1) {
				$(checkElement).addClass("MyMarkedReadedElement").removeClass("MyMarkedSeenElement").removeClass("MyMarkedToReadElement").find(".MyScanButton,.MyReadButton").remove();
				if (TabNoc.Settings.HideAlreadyWatchedNews === true) {
					$(checkElement).hide();
				}
				else {
					$(checkElement).show();
				}
				return true;
			}
			else if (SeenID !== -1) {
				$(checkElement).removeClass("MyMarkedReadedElement").addClass("MyMarkedSeenElement").removeClass("MyMarkedToReadElement").find(".MyScanButton").remove();
				if (TabNoc.Settings.HideAlreadyWatchedNews === true) {
					$(checkElement).hide();
				}
				else {
					$(checkElement).show();
				}
				return true;
			}
			else if (ToReadID !== -1) {
				$(checkElement).removeClass("MyMarkedReadedElement").removeClass("MyMarkedSeenElement").addClass("MyMarkedToReadElement").find(".MyScanButton,.MyReadButton").remove();
				if (TabNoc.Settings.HideAlreadyWatchedNews === true) {
					$(checkElement).hide();
				}
				else {
					$(checkElement).show();
				}
				return true;
			}
		}
		else {
			$(checkElement).removeClass("MyMarkedReadedElement").removeClass("MyMarkedSeenElement").removeClass("MyToReadElement").removeClass("MyPageElement").show().find(".MyScanButton .MyReadButton").remove();
		}

		return false;
	}

	function getAllElements(from, till, asToRead) {
		try {
			var start = new Date().getTime();

			// ### ReadedNewsArray ###
			var ReadedNewsArray = GetData("ReadedNewsArray", "([])", true);
			// ### SeenNewsArray ###
			var SeenNewsArray = GetData("SeenNewsArray", "([])", true);
			// ### ToReadNewsArray ###
			var ToReadNewsArray = GetData("ToReadNewsArray", "([])", true);

			var elements = $(TabNoc.Settings.ElementsSearchString);

			var fromIndex = from == null ? 0 : elements.toArray().findIndex(function (element) { try {return TabNoc.Settings.GetIDFunction(element) == from;} catch(exc) {console.error("getAllElements: getFromIndex", exc); return false;}});
			if (fromIndex == -1) throw "from(" + from + ") were not found";

			var tillIndex = till == null ? elements.length : (elements.toArray().findIndex(function (element) { try {return TabNoc.Settings.GetIDFunction(element) == till;} catch(exc) {console.error("getAllElements: getTillIndex", exc); return false;}}) + 1);
			if (tillIndex == -1) throw "till(" + till + ") were not found";
			// tillIndex > elements.length ? elements.length : tillIndex;

			for (var i = fromIndex; i < tillIndex; i++) {
				var element = elements[i];
				var currentElementId = TabNoc.Settings.GetIDFunction(element);

				if (TabNoc.Settings.CheckCurrentElementFunction(element) == true) {
					if (asToRead == true) {
						if (ReadedNewsArray.indexOf(currentElementId) == -1 && ToReadNewsArray.indexOf(currentElementId) == -1) {
							ToReadNewsArray.push(currentElementId);
							if (SeenNewsArray.indexOf(currentElementId) != -1) {
								SeenNewsArray.splice(SeenNewsArray.indexOf(currentElementId), 1);
							}
						}
					} else {
						if (SeenNewsArray.indexOf(currentElementId) == -1 && ReadedNewsArray.indexOf(currentElementId) == -1 && ToReadNewsArray.indexOf(currentElementId) == -1) {
							SeenNewsArray.push(currentElementId);
						}
					}
				} else {
					console.error("CheckCurrentElementFunction: Folgendes Element entspricht nicht den Vorgaben", element);
				}
			}
			GM_Lock();
			SetData("SeenNewsArray", SeenNewsArray.toSource(), true);
			SetData("ToReadNewsArray", ToReadNewsArray.toSource(), true);
			GM_Unlock();

			if (TabNoc.Settings.MarkAfterScan) {
				startCheckElements(true);
			}

			var time = new Date().getTime() - start;
			console.log('getAllElements() Execution time: ' + time);
		}
		catch (exc) {
			console.error(exc);
			alert(exc);
		}
	}

	function createToReadDialog(){
		throw "NotImplementedException";
		bla +="<ul style='list-style-type:none'>";
		foreach();{bla +="<li>" + Coffee  + "</li>";}
		bla +="</ul>";
	}

	// ### http*://www.golem.de ###

	// ### http*://www.golem.de/news/* ###
	function NewsPageLoader(){
		console.log("MarkGolemPages.user.js loading");
		try {
			OpenNewspage();

			GM_registerMenuCommand("Löschen", function () {
				ReadingNewspage(true);
			});

			$(window).on('beforeunload', function(e){
				if (TabNoc.Variables.promptOnClose === true) {
					e.returnValue = 'Die Seite wurde nicht als gelsesen markiert, fortfahren?';
					return 'Die Seite wurde nicht als gelsesen markiert, fortfahren?';
				}
			});

			// ## ScanWithKeyPress ##
			if (TabNoc.Settings.ScanWithKeyPressEnabled === true) {
				$(document).on("keydown", event => {
					let finished = false;
					let KeyPressActivated = TabNoc.Variables.ScanWithKeyPressActiveTimeout > new Date() && TabNoc.Variables.WasHidden == false;
					if (event.keyCode == 160) {
						if (KeyPressActivated == false) {
							if (confirm("Soll die Bearbeitung durch ScanWithKeyPress aktiviert werden?") == true) {
								TabNoc.Variables.WasHidden = false;
								finished = true;
								KeyPressActivated = true;
							}
							event.preventDefault();
						}
						if (KeyPressActivated && TabNoc.Variables.PageReaded == false && confirm("Soll die Seite als Gelesen markiert werden?") == true) {
							ReadingNewspage();
							finished = true;
							if ($("#jtocb_next").length == 1 && confirm("Soll die nächste Siete geöffnet werden?") == true) {
								$("#jtocb_next")[0].click();
							}
						}
						if (KeyPressActivated && TabNoc.Variables.PageReaded == true && confirm("Soll die Seite geschlossen werden?") == true) {
							window.open('', '_self').close();
							alert("If you can see this you have to set 'dom.allow_scripts_to_close_windows' to 'true' in about:config.");
						}
					}
					else if (event.key == "ArrowRight" && event.ctrlKey == true) {
						if (KeyPressActivated) {
							if ($("#jtocb_next").length == 1) {
								$("#jtocb_next")[0].click();
							}
							finished = true;
						}
					}
					else if (event.key == "ArrowLeft" && event.ctrlKey == true) {
						if (KeyPressActivated) {
							if ($("#atoc_prev").length == 1) {
								$("#atoc_prev")[0].click();
							}
							finished = true;
						}
					}
					if (finished == true) {
						event.preventDefault();
						TabNoc.Variables.ScanWithKeyPressActiveTimeout = new Date(new Date().getTime() + 600000);
					}
				});
			}
			// ## ScanWithKeyPress ##

			console.log("MarkGolemPages.user.js done");
		} catch (exc) {
			console.error(exc);
			alert(exc);
		}
	}

	function OpenNewspage(){
		try {
			// ### ReadedNewsArray ###
			var ReadedNewsArray = GetData("ReadedNewsArray", "([])", true);
			// ### SeenNewsArray ###
			var SeenNewsArray = GetData("SeenNewsArray", "([])", true);
			// ### ToReadNewsArray ###
			var ToReadNewsArray = GetData("ToReadNewsArray", "([])", true);

			GM_Lock();

			var currentID = TabNoc.Settings.GetCurrentSiteIDFunction();

			if (SeenNewsArray.indexOf(currentID) !== -1) {
				SeenNewsArray.splice(SeenNewsArray.indexOf(currentID), 1);
				SetData("SeenNewsArray", SeenNewsArray.toSource(), true);
				console.info("OpenNewspage: " + TabNoc.Settings.NameOfElement + " removed from SeenNewsArray");
			}

			if (ToReadNewsArray.indexOf(currentID) === -1 && ReadedNewsArray.indexOf(currentID) === -1) {
				ToReadNewsArray.push(currentID);
				SetData("ToReadNewsArray", ToReadNewsArray.toSource(), true);
				console.info("OpenNewspage: " + TabNoc.Settings.NameOfElement + " added to ToReadNewsArray");
			}

			if (ReadedNewsArray.indexOf(currentID) !== -1) {
				setTimeout(function(){alert("readed");}, 100);
				console.info("OpenNewspage: " + TabNoc.Settings.NameOfElement + " already readed!");
				TabNoc.Variables.PageReaded = true;
			}
			else {
				$("body").append('<div id="reading" style="position: fixed;top: 20px;right: 20px;">Gelesen</div>');
				$("#reading").button().on("click", (function(){ReadingNewspage();}));
			}

			GM_Unlock();
		} catch (exc) {
			console.error(exc);
			alert(exc);
		}
	}

	function ReadingNewspage(deleteEntry){
		try {
			if (deleteEntry !== true) deleteEntry = false;

			var currentID = TabNoc.Settings.GetCurrentSiteIDFunction();

			// ### ReadedNewsArray ###
			var ReadedNewsArray = GetData("ReadedNewsArray", "([])", true);
			// ### SeenNewsArray ###
			var SeenNewsArray = GetData("SeenNewsArray", "([])", true);
			// ### ToReadNewsArray ###
			var ToReadNewsArray = GetData("ToReadNewsArray", "([])", true);

			GM_Lock();

			if (SeenNewsArray.indexOf(currentID) !== -1 && deleteEntry === false) {
				SeenNewsArray.splice(SeenNewsArray.indexOf(currentID), 1);
				SetData("SeenNewsArray", SeenNewsArray.toSource(), true);
				console.info("ReadingNewspage: " + TabNoc.Settings.NameOfElement + " removed from SeenNewsArray");
			}

			if (ToReadNewsArray.indexOf(currentID) !== -1 && deleteEntry === false) {
				ToReadNewsArray.splice(ToReadNewsArray.indexOf(currentID), 1);
				SetData("ToReadNewsArray", ToReadNewsArray.toSource(), true);
				console.info("ReadingNewspage: " + TabNoc.Settings.NameOfElement + " removed from ToReadNewspage");
			}

			if (ReadedNewsArray.indexOf(currentID) === -1 && deleteEntry === false) {
				ReadedNewsArray.push(currentID);
				SetData("ReadedNewsArray", ReadedNewsArray.toSource(), true);
				console.info("ReadingNewspage: " + TabNoc.Settings.NameOfElement + " added to ReadedNewsArray");

				$("#reading").remove();
				TabNoc.Variables.promptOnClose = false;
				TabNoc.Variables.PageReaded = true;
			}
			else {
				if (deleteEntry === true) {
					ReadedNewsArray.splice(SeenNewsArray.indexOf(currentID), 1);
					SetData("ReadedNewsArray", ReadedNewsArray.toSource(), true);
					console.info("ReadingNewspage: " + TabNoc.Settings.NameOfElement + " removed from ReadedNewsArray!!!");
				}
				else {
					setTimeout(function(){alert("readed");}, 100);
					console.info("ReadingNewspage: " + TabNoc.Settings.NameOfElement + " already readed!");
				}
				$("#reading").remove();
				TabNoc.Variables.promptOnClose = false;
				TabNoc.Variables.PageReaded = true;
			}
			GM_Unlock();
			console.log("TabNoc.Variables.promptOnClose", TabNoc.Variables.promptOnClose);
		} catch (exc) {
			console.error(exc);
			alert(exc);
		}
	}
	// ### http*://www.golem.de/news/* ###

	/*
	var TableUpdateObject = {
		"ReadedNewsArray": {
			"CheckInit": function () {
				// code
				// return true || false;
			},
			"InitTable": function () {
				//code
			},
			1: function () {
				var returnStats = {
						ChangeCount: 0,
						OldSize: 0,
						NewSize: 0
					};
				// code
				return {
					Result: true,
					Stats: returnStats,
					Save: function () {}
				};
			}
		}
	};
	*/

	function UpdateDatabaseTable(ExpectedVersionNumber, CurrentVersionNumber, TableName, TableUpdateObject) {
		if (ExpectedVersionNumber == null) {
			throw ("ArgumentNullException (ExpectedVersionNumber):\r\nDer Parameter ExpectedVersionNumber ist null");
		}
		if (typeof(ExpectedVersionNumber) != "number") {
			throw ("ArgumentException (ExpectedVersionNumber):\r\nDer Parameter ExpectedVersionNumber hat das falsche Format, erwartet: number");
		}

		if (CurrentVersionNumber == null) {
			throw ("ArgumentNullException (CurrentVersionNumber):\r\nDer Parameter CurrentVersionNumber ist null");
		}
		if (typeof(CurrentVersionNumber) != "number") {
			throw ("ArgumentException (CurrentVersionNumber):\r\nDer Parameter CurrentVersionNumber hat das falsche Format, erwartet: number");
		}

		if (TableName == null) {
			throw ("ArgumentNullException (TableName):\r\nDer Parameter TableName ist null");
		}
		if (typeof(TableName) != "string") {
			throw ("ArgumentException (TableName):\r\nDer Parameter TableName hat das falsche Format, erwartet: string");
		}

		if (TableUpdateObject == null) {
			throw ("ArgumentNullException (TableUpdateObject):\r\nDer Parameter TableUpdateObject ist null");
		}
		if (typeof(TableUpdateObject) != "object") {
			throw ("ArgumentException (TableUpdateObject):\r\nDer Parameter TableUpdateObject hat das falsche Format, erwartet: object");
		}

		if (CurrentVersionNumber != ExpectedVersionNumber) {
			let updateMsg = "Es wurde ein Versionsunterschied der Datenbank-Tabelle " + TableName + " gefunden (aktuell: " + CurrentVersionNumber + " | erwartet: " + ExpectedVersionNumber + ")";
			console.info(updateMsg);
			if (TableUpdateObject.CheckInit() === false) {
				alert(updateMsg + "\r\nOK drücken um den Updatevorgang zu starten.");
				if (TableUpdateObject[TableName][CurrentVersionNumber] == null) {
					throw ("NoUpdateImplemeneted:\r\nFür die Version " + CurrentVersionNumber + " der Tabelle " + TableName + " wurde kein Update definiert!");
				}
				let UpdateResult = TableUpdateObject[TableName][CurrentVersionNumber]();

				if (UpdateResult.Result === true) {
					updateMsg = "Die Version der Tabelle " + TableName + " wurde auf " + GM_getValue(TableName + "-Version") + " geändert";
					console.log(updateMsg);
					alert(updateMsg + "\r\nDataBase:'" + TableName + "' die alten Daten wurden erfolgreich importiert!\r\nDie Datenbank wurde von alten Daten bereinigt.");

					alert("Es wurden " + UpdateResult.ChangeCount + " Elemente aktualisiert (alte Datenmenge: " + UpdateResult.OldSize + "B | neue Datenmenge: " + UpdateResult.NewSize + "B)");
					if (confirm("Sollen die Änderungen gespeichert werden?") === true) {
						UpdateResult.Save();
						console.log("Die Version der Tabelle " + TableName + " wurde auf " + GM_getValue(TableName + "-Version") + " geändert");
					}
					else {
						throw ("UserAbort:\r\nDer Update-Vorgang für Version " + CurrentVersionNumber + " der Tabelle " + TableName + " wurde durch den Benutzer abgebrochen!");
					}
				}
			}
			else {
				TableUpdateObject.InitTable();
				GM_setValue(TableName + "-Version", ExpectedVersionNumber);
				let updateMsg = "Die Datenbank-Tabelle " + TableName + " wurde initialisiert (Version: " + GM_getValue(TableName + "-Version") + ")";
				console.log(updateMsg);
			}
			return true;
		}
		return false;
	}



	function UpdateDataBase() {
		var ExpectedVersionNumber_ReadedNewsArray = 1;
		var ExpectedVersionNumber_SeenNewsArray = 1;
		var ExpectedVersionNumber_ToReadNewsArray = 1;

		// ### ReadedNewsArray-Version ###
		var CurrentVersionNumber_ReadedNewsArray = GetData("ReadedNewsArray-Version", 0, true);
		// ### SeenNewsArray-Version ###
		var CurrentVersionNumber_SeenNewsArray = GetData("SeenNewsArray-Version", 0, true);
		// ### ToReadNewsArray-Version ###
		var CurrentVersionNumber_ToReadNewsArray = GetData("ToReadNewsArray-Version", 0, true);

		var TableUpdateObject = {
			"ReadedNewsArray": {
				"CheckInit": function () {
					return GM_getValue("ReadedNewsArray") == undefined;
				},
				"InitTable": function () {},
				0: function () {
					var returnStats = {
						ChangeCount: 0,
						OldSize: 0,
						NewSize: 0
					};
					return {
						Result: true,
						Stats: returnStats,
						Save: function () {GM_setValue("ReadedNewsArray-Version", 1);}
					};
				}
			},
			"SeenNewsArray": {
				"CheckInit": function () {
					return GM_getValue("SeenNewsArray") == undefined;
				},
				"InitTable": function () {},
				0: function () {
					var returnStats = {
						ChangeCount: 0,
						OldSize: 0,
						NewSize: 0
					};
					return {
						Result: true,
						Stats: returnStats,
						Save: function () {GM_setValue("SeenNewsArray-Version", 1);}
					};
				}
			},
			"ToReadNewsArray": {
				"CheckInit": function () {
					return GM_getValue("ToReadNewsArray") == undefined;
				},
				"InitTable": function () {},
				0: function () {
					var returnStats = {
						ChangeCount: 0,
						OldSize: 0,
						NewSize: 0
					};
					return {
						Result: true,
						Stats: returnStats,
						Save: function () {GM_setValue("ToReadNewsArray-Version", 1);}
					};
				}
			}
		};

		UpdateDatabaseTable(ExpectedVersionNumber_ReadedNewsArray, CurrentVersionNumber_ReadedNewsArray, "ReadedNewsArray", TableUpdateObject);
		UpdateDatabaseTable(ExpectedVersionNumber_SeenNewsArray, CurrentVersionNumber_SeenNewsArray, "SeenNewsArray", TableUpdateObject);
		UpdateDatabaseTable(ExpectedVersionNumber_ToReadNewsArray, CurrentVersionNumber_ToReadNewsArray, "ToReadNewsArray", TableUpdateObject);
	}

	// TODO: removeScriptName
	function Syncronisieren(scriptName) {
		var onAbort = (function (response) {
			console.log("onabort");
			console.info(response);
		});

		var onError = (function (msg) {
			return (function (response) {
				console.log("onerror");
				console.info(response);
				alert(msg);
				Feedback.hideProgress();
			});
		});

		var onTimeout = (function (response) {
			console.log("ontimeout");
			console.info(response);
		});

		var onLoadPost = returnExec(function (response) {
				if (response.status !== 200) {
					console.error(response);
					alert("Statuscode:" + response.status);
					Feedback.showProgress(100, "Senden der Daten fehlgeschlagen");
					return;
				}
				if (response.responseText.charAt(0) === '#') {
					console.error(response);
					alert("Bei der Abfrage ist ein Fehler aufgetreten:" + response.responseText);
					Feedback.showProgress(100, "Senden der Daten fehlgeschlagen");
					return;
				}
				Feedback.showProgress(100, "Senden der Daten erfolgreich abgeschlossen");
				alert("Die Syncronisierung der Daten mit dem Server wurde erfolgreich abgeschlossen.\r\nAktueller Versionsstand: " + response.responseText);
			});

		var onLoadGet = returnExec(function (response) {
				console.error(response);
				Feedback.showProgress(40, "Servernachricht auswerten");
				var error = false;
				if (response.status !== 200) {
					console.error(response);
					alert("Statuscode:" + response.status);
					Feedback.showProgress(100, "Abgebrochen, es konnten keine Daten empfangen werden");
					return;
				}
				if (response.responseText.charAt(0) === '#') {
					console.error(response);
					var errorCode = response.responseText.split("\r\n")[0].substring(1);
					if (errorCode === "2") {
						error = true;
					} else {
						alert("Bei der Abfrage ist ein Fehler aufgetreten:" + response.responseText);
						Feedback.showProgress(100, "Abgebrochen, Fehler auf dem Server");
						return;
					}
				}
				Feedback.showProgress(50, "Empfangene Daten migrieren");
				if (!error) {
					var responseData = eval(response.responseText);
					console.info("Server response Data:", responseData);
					if (responseData.ReadedNewsArray != null && responseData.SeenNewsArray != null) {
						Feedback.lockProgress();
						ImportData(responseData, ([{
										Name: "ReadedNewsArray",
										defaultVersion: 0,
										defaultValue: "([])",
										ImportAction: function (dataStorage, currentEntry, importElement) {
											if (dataStorage[currentEntry.Name].indexOf(importElement) == -1) {
												dataStorage[currentEntry.Name].push(importElement);
											}
										}
									}, {
										Name: "ToReadNewsArray",
										defaultVersion: 0,
										defaultValue: "([])",
										ImportAction: function (dataStorage, currentEntry, importElement) {
											if (dataStorage[currentEntry.Name].indexOf(importElement) == -1) {
												dataStorage[currentEntry.Name].push(importElement);
											}
										}
									}, {
										Name: "SeenNewsArray",
										defaultVersion: 0,
										defaultValue: "([])",
										ImportAction: function (dataStorage, currentEntry, importElement) {
											if (dataStorage.ReadedNewsArray.indexOf(importElement) == -1 && dataStorage.ToReadNewsArray.indexOf(importElement) == -1) {
												if (dataStorage[currentEntry.Name].indexOf(importElement) == -1) {
													dataStorage[currentEntry.Name].push(importElement);
												}
											}
										}
									}
								]));
						Feedback.unlockProgress();
					} else {
						alert("Der Wert des Response des Servers war ungültig!");
					}
				}
				if (confirm("Sollen die aktuellen Daten auf dem Server gespeichert werden?") === false) {
					Feedback.showProgress(100, "Senden der Daten abgebrochen");
					return;
				}
				Feedback.showProgress(75, "Neue Daten auf dem Server speichern");

				var element = ({});
				element.ReadedNewsArray = eval(GM_getValue("ReadedNewsArray") || "([])");
				element.SeenNewsArray = eval(GM_getValue("SeenNewsArray") || "([])");
				element.ToReadNewsArray = eval(GM_getValue("ToReadNewsArray") || "([])");
				element["ReadedNewsArray-Version"] = GetData("ReadedNewsArray-Version", 0, true);
				element["SeenNewsArray-Version"] = GetData("SeenNewsArray-Version", 0, true);
				element["ToReadNewsArray-Version"] = GetData("ToReadNewsArray-Version", 0, true);
				GM_xmlhttpRequest({
					data: {
						Token: Token,
						data: element.toSource()
					}
					.toSource(),
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					onabort: onAbort,
					onerror: onError("Sending New Data Failed"),
					onload: onLoadPost,
					ontimeout: onTimeout,
					timeout: 60000,
					url: "https://tabnoc.gear.host/MyDataFiles//Input"
				});
			});

		Feedback.showProgress(10, "Token erfassen");
		var Token = prompt("Bitte Token eingeben") + scriptName;
		Feedback.showProgress(20, "Request starten");
		GM_xmlhttpRequest({
			data: {
				Token: Token
			}
			.toSource(),
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			onabort: onAbort,
			onerror: onError("Receving Server Data Failed"),
			onload: onLoadGet,
			ontimeout: onTimeout,
			timeout: 60000,
			url: "https://tabnoc.gear.host/MyDataFiles//Output"
		});
		Feedback.showProgress(30, "Warte auf Rückmeldung vom Server");
	}

	function ModuleImport(moduleName, moduleFunction, expectedVersion) {
		let currentVersion = moduleFunction().Version;
		let versionCompareResult = versionCompare(currentVersion, expectedVersion);
		var versionData = GetData("ImportVersion", "({show: true})", true);
		versionData[moduleName] = versionData[moduleName] || ({});
		if (versionData.show == true && versionData[moduleName].Version != currentVersion && versionData[moduleName].Version != undefined) {
			alert ("Das Modul " + moduleName + " wurde von Version " + versionData[moduleName].Version + " auf Version " + currentVersion + " aktualisiert (Die erwartete Version ist " + expectedVersion + ")");
		}

		if (versionCompareResult != 0) {
			var msg = "Das geladene " + moduleName + " Modul ist " + (versionCompareResult < 0 ? "älter" : "neuer") + " als die konfigurierte Version";
			msg += "\r\nDie erwartete Version ist: " + expectedVersion + " gegeben ist: " + currentVersion;
			if (versionData[moduleName].skipNotification !== currentVersion && !confirm(msg + "\r\n\r\nSoll diese Meldung für diese Version des Moduls weiterhin angezeigt werden?")) {
				versionData[moduleName].skipNotification = currentVersion;
			}
			console.info(msg);
		}
		versionData[moduleName].Version = currentVersion;
		SetData("ImportVersion", versionData.toSource(), true);
	}

	function Main() {
		ModuleImport("States", getStatesVersion, "1.2.8");
		ModuleImport("TabNoc_GM", getTabNoc_GMVersion, "2.0.2");
		ModuleImport("TabNoc", getTabNocVersion, "1.2.2");
		ModuleImport("ImportAll", getImportAllVersion, "1.0.3");

		var count = 0;
		while (GM_Locked() == true) {
			count = count + 1;
			alert("Der Aktuelle Sperrzustand der Datenbank ist positiv, dies wird durch Fehlermeldungen während der Ausführung ausgelöst oder ist nur eine kurzweilige erscheinung. \r\n\r\n Bitte Meldung bestätigen!");
			if (count >= 2) {
				if (confirm("Soll der Sperrzustand der Datenbank aufgehoben werden [empfohlen]?") === true ) {
					GM_Unlock(true);
				}
			}
		}

		GM_addStyle(GM_getResourceText("JqueryUI"));
		UpdateDataBase();

		GM_addStyle(GM_getResourceText("MyCss"));
		GM_addStyle(GM_getResourceText("JDiffAnno"));
		GM_addStyle(GM_getResourceText("JDiffHtml"));

		// Startseite
		if (document.URL.includes("news") == false) {
			StartPageLoader();
		}
		// Nachrichtenseite
		else if (document.URL.includes("news") == true) {
			NewsPageLoader();
		}
		else {
			alert("MarkGolemPages.user.js:Main()->No LoadObject found!");
			console.info("No LoadObject found!");
		}
	}

	if (false) {
/* 		var Feedback = Feedback || null;
		var GM_Unlock = GM_Unlock || null;
		var GM_Locked = GM_Locked || null;
		var SetData = SetData || null;
		var GetData = GetData || null;
		var versionCompare = versionCompare || null;
		var ImportData = ImportData || null;
		var $ = $ || null;
		var returnExec = returnExec || null;
		var TabNoc = TabNoc || null;
		var GM_Lock = GM_Lock || null;
		var setTabNoc = setTabNoc || null;
		var exportFunction = exportFunction || null;
		var CreateHistoryDialog = CreateHistoryDialog || null;
		var execTime = execTime || null; */
	}

	$(Main());

	console.info("MarkGolemPages.user.js [v" + GM_info.script.version + ", Autoupdate: " + GM_info.scriptWillUpdate + "] readed");
} catch (exc) {
	console.error(exc);
	alert(exc);
}
