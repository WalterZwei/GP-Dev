/*
   This file is part of GuttenPodder.

   GuttenPodder is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   GuttenPodder is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with GuttenPodder.  If not, see <http://www.gnu.org/licenses/>.

   GuttenPodder copyright 2012 Walter Koch <guttenpodder@u32.de>

   GuttenPodder is a fork of drPodder (GPL3):
     drPodder is copyright 2010 Jamie Hatfield

   GuttenPodder contains code from podfrenzy (GPL3)
     podFrenzy is (c) Copyright 2011 Bits Of God Software, LLC 
*/
           

var DrPodder = {};
DrPodder.MainStageName = "DrPodderMain";
DrPodder.DashboardStageName = "DrPodderDashboard";
DrPodder.DownloadingStageName = "DrPodderDownloading";
DrPodder.DownloadedStageName = "DrPodderDownloaded";

function AppAssistant(){
	AppAssistant.downloadService = new DownloadService();
	AppAssistant.applicationManagerService = new ApplicationManagerService();
	AppAssistant.powerService = new PowerService();
	AppAssistant.mediaEventsService = new MediaEventsService();
	AppAssistant.wifiService = new WifiService();

	this.setWakeup();
}

AppAssistant.prototype.handleLaunch = function(launchParams) {
	if (!DB) {
		DB = new DBClass();
		DB.readPrefs();
	}
	if (!launchParams || launchParams.action === undefined) {
		var cardStageController = this.controller.getStageController(DrPodder.MainStageName);
		if (cardStageController) {
			Mojo.Log.warn("Main Stage exists");
			cardStageController.activate();
		} else {
			var pushMainScene = function(stageController) {
				stageController.pushScene("loading");
			};
			Mojo.Log.warn("Create Main Stage");
			var stageArguments = {name: DrPodder.MainStageName, lightweight: true};
			this.controller.createStageWithCallback(stageArguments, pushMainScene.bind(this), "card");
		}
	} else {
		if (!DB.ready) {
			DB.waitForDB(this.handleLaunchParams.bind(this, launchParams));
		} else {
			this.handleLaunchParams(launchParams);
		}
	}
};

AppAssistant.prototype.handleLaunchParams = function(launchParams) {
	Mojo.Log.warn("handleLaunchParams called: %s", launchParams.action);
	var dashboardOpen            = this.controller.getStageController(DrPodder.DashboardStageName);
	var downloadedDashboardOpen  = this.controller.getStageController(DrPodder.DownloadedStageName);
	var downloadingDashboardOpen = this.controller.getStageController(DrPodder.DownloadingStageName);
	switch (launchParams.action) {
		case "updateFeeds":
			this.setWakeup();
			if (Prefs.autoUpdate && !downloadingDashboardOpen && !feedModel.updatingFeeds) {
                if( (Prefs.autoUpdateFeedID == undefined) | (Prefs.autoUpdateFeedID == 'all') ) {
                   Mojo.Log.error("info; launching: updateFeeds()");
                   feedModel.updateFeeds();
                } else {
                   Mojo.Log.error("info; launching: update one feed " + Prefs.autoUpdateFeedID);
                   feedModel.getFeedById(Prefs.autoUpdateFeedID).updateAndDownload()
                }
			}
			break;
		case "download":
			feedModel.download();
			break;
	}
};

AppAssistant.prototype.setWakeup = function() {
	// send wakeup from command line
	// luna-send -n 1 palm://com.palm.applicationManager/open '{"id":"com.drnull.drpodder","params":{"action":"updateFeeds"}}'
	// obviously, an update time preference needs to be here
	if (Prefs.autoUpdate) {
		// compute time based on Prefs
		// Prefs.updateType: H, D, W
		// Prefs.updateInterval: if H, use directly for "IN" alarm
		// Prefs.updateHour & .updateMinute: if D or W, use to compute next "AT" alarm
		// Prefs.updateDay: ditto
		var alarmType;
		var alarmTime;
		var alarmDate = new Date();
		var now = new Date();
		Mojo.Log.warn("updateType: %s", Prefs.updateType);
		switch (Prefs.updateType) {
			case "H":
				alarmType = "in";
				Mojo.Log.warn("updateInterval: %s", Prefs.updateInterval);
				alarmTime = Prefs.updateInterval;
				break;
			case "W":
				alarmType = "at";
				Mojo.Log.warn("updateDay/Hour/Minute: %s %s:%s", Prefs.updateDay, Prefs.updateHour, Prefs.updateMinute);
				var dayDelta = Math.abs(Prefs.updateDay-alarmDate.getDay())%7;
				alarmDate.setDate(alarmDate.getDate() + dayDelta);
				alarmDate.setHours(Prefs.updateHour);
				alarmDate.setMinutes(Prefs.updateMinute);
				break;
			case "D":
				alarmType = "at";
				Mojo.Log.warn("updateHour/Minute: %s:%s", Prefs.updateHour, Prefs.updateMinute);
				alarmDate.setHours(Prefs.updateHour);
				alarmDate.setMinutes(Prefs.updateMinute);
				break;
		}
		Mojo.Log.warn("alarmTime: %s", alarmTime);
		if (alarmType === "at") {
			// verify that the time is at least 1 minutes in the future
			// if not, jump forward a day or a week depending on Prefs.updateType
			// ACTUALLY drnull said, "this isn't necessary.  AT alarms can fire off whenever.
			// just make sure it's not earlier today, otherwise it fires off immediately"
             if (now.valueOf() + 1*60*1000 > alarmDate.valueOf()) {
				alarmDate.setDate(alarmDate.getDate() + ((Prefs.updateType==="D")?1:7));
			}
			// "mm/dd/yyyy hh:mm:ss"
			var d = alarmDate;
			var mo = "" + (d.getUTCMonth()+1); if (mo.length === 1) { mo = "0" + mo;}
			var da = "" + d.getUTCDate();      if (da.length === 1) { da = "0" + da;}
			var yy = "" + d.getUTCFullYear();
			var hh = "" + d.getUTCHours();     if (hh.length === 1) { hh = "0" + hh;}
			var mi = "" + d.getUTCMinutes();   if (mi.length === 1) { mi = "0" + mi;}
			alarmTime = mo + "/" + da + "/" + yy + " " + hh + ":" + mi + ":00";
		}
		if (alarmTime && alarmType) {
			var parameters = {};
			parameters.key = Mojo.appInfo.id + '.update';
			parameters.uri = "palm://com.palm.applicationManager/open";
			parameters.params = {"id": Mojo.appInfo.id, "params": {"action": "updateFeeds"}};
			parameters[alarmType] = alarmTime;
			Mojo.Log.info("alarm request %s: %s", alarmType, alarmTime);
			this.wakeupRequest = new Mojo.Service.Request("palm://com.palm.power/timeout", {
				method: "set",
				parameters: parameters,
				onSuccess: function(response) {
					Mojo.Log.warn("Alarm set success: %s", response.returnValue);
				},
				onFailure: function(response) {
					Mojo.Log.warn("Alarm set failure: %s:%s", response.returnValue, response.errorText);
				}
			});
            return alarmTime;
		}
	}
};


AppAssistant.prototype.importOpml = function(opml) {
	try {
		var doc = (new DOMParser()).parseFromString(opml, "text/xml");
		var nodes = document.evaluate("//outline", doc, null, XPathResult.ANY_TYPE, null);
		var node = nodes.iterateNext();
		var imported = 0;
		while (node) {
			var title = Util.xmlGetAttributeValue(node, "title") || Util.xmlGetAttributeValue(node, "text");
			var url   = Util.xmlGetAttributeValue(node, "xmlUrl") || Util.xmlGetAttributeValue(node, "url");
			var autoDownload = Util.xmlGetAttributeValue(node, "autoDownload");
			var autoDelete = Util.xmlGetAttributeValue(node, "autoDelete");
			var maxDownloads = Util.xmlGetAttributeValue(node, "maxDownloads");
			var replacements = Util.xmlGetAttributeValue(node, "replacements");
			var hideFromOS = Util.xmlGetAttributeValue(node, "hideFromOS");
			var username = Util.xmlGetAttributeValue(node, "username");
			var password = Util.xmlGetAttributeValue(node, "password");
			if (title !== undefined && url !== undefined) {
				Mojo.Log.warn("Importing feed: (%s)-[%s]", title, url);
				feed = new Feed();
				feed.url = url;
				feed.title = title;
				if (autoDownload !== undefined) {feed.autoDownload = (autoDownload==='1');}
				if (autoDelete !== undefined) {feed.autoDelete = (autoDelete==='1');}
				if (maxDownloads !== undefined) {feed.maxDownloads = maxDownloads;}
				if (replacements !== undefined) {feed.replacements = replacements;}
				if (hideFromOS !== undefined) {feed.hideFromOS = hideFromOS;}
				if (username !== undefined) {feed.username = username;}
				if (password !== undefined) {feed.password = password;}
				feedModel.items.push(feed);
				feed.update(null, null, true);
				imported++;
			} else {
				Mojo.Log.warn("Skipping import: (%s)-[%s]", title, url);
			}
			node = nodes.iterateNext();
		}
		if (imported > 0) {
			DB.saveFeeds();
			Util.showError($L({value:"OPML Import Finished", key:"opmlImportFinished"}), $L({value:"The #{num} imported feed" + ((imported !== 1)?"s":"") + " can be found at the END of your feed list.", key:"opmlImportStatus"}).interpolate({num:imported}));
							} else {
			Util.showError($L({value:"OPML Import Finished", key:"opmlImportFinished"}), $L({value:"No valid feeds found in drpodder.xml", key:"noValidFeeds"}));
		}
	} catch (e){
		Mojo.Log.error("error with OPML: (%s)", e);
		Util.showError($L({value:"Error parsing OPML File", key:"errorParsingOPML"}), $L({value:"There was an error parsing the OPML file.  Please send the file to guttenpodder@u32.de.", key:"errorParsingOPMLBody"}));
	}
};

AppAssistant.prototype.handleCommand = function(event) {
	var stageController = this.controller.getActiveStageController();
	var currentScene = stageController.activeScene();

	if (event.type === Mojo.Event.command) {
		switch (event.command) {
			case "prefs-cmd":
				stageController.pushScene({name:"preferences", transition: Prefs.transition});
				break;
			case "import-clipboard-cmd":
				this.importOpml("");
				break;
			case "import-cmd":
				var req = new Ajax.Request("/media/internal/drpodder.xml", {
					method: 'get',
					onFailure: function() {
						Util.showError($L({value:"Error reading OPML File", key:"errorReadingOPML"}), $L({value:"I don't know what happened, but we couldn't read the drpodder.xml file.", key:"couldntReadDrpodder"}));
					},
					on404: function() {
						Util.showError($L({value:"OPML File not found", key:"opmlNotFound"}), $L({value:"Please place the drpodder.xml file in the root of the WebOS device's USB directory and retry.", key:"pleasePlaceDrpodder"}));
					},
					onSuccess: function(transport) {
						this.importOpml(transport.responseText);
					}.bind(this)
				});
				break;
			case "export-cmd":
				var message = $L({value:"Copy the following out to a file named drpodder.xml (Make sure the filename is all lowercase and Windows doesn't rename the file as drpodder.xml.txt).<br>" +
				              "To restore this set of feeds to GuttenPodder, simply copy drpodder.xml to the root of the Pre's USB directory.", key:"opmlInstructions"}) +
							  "<br><br>&lt;opml version='1.1'>&lt;body><br>";
				for (var i=0; i<feedModel.items.length; i++) {
					var feed = feedModel.items[i];
					if (!feed.playlist) {
						message += "&lt;outline text='" + feed.title.replace(/&/g, "&amp;amp;").replace(/'/g, "&amp;apos;") + "'";
						message += " type='rss' xmlUrl='" + feed.url.replace(/&/g, "&amp;amp;") + "'";
						message += " autoDownload='" + feed.autoDownload + "'";
						message += " autoDelete='" + feed.autoDelete + "'";
						message += " maxDownloads='" + feed.maxDownloads + "'";
						message += " replacements='" + feed.replacements.replace(/&/g,"&amp;amp;").replace(/'/g, "&amp;apos;") + "'";
						message += " hideFromOS='" + feed.hideFromOS + "'";
						if (feed.username) {
							message += " username='" + feed.username + "'";
							message += " password='" + feed.password + "'";
						}
						message += "/><br>";
					}
				}
				message += "&lt;/body>&lt;/opml>";
				AppAssistant.applicationManagerService.email($L({value:"GuttenPodder OPML Export", key:"opmlSubject"}), message);
				break;
            case "report-cmd":
				var dialog = new drnull.Dialog.Confirm(event.assistant, $L({value:"Report A Problem", key:"reportProblem"})+'?',
					$L({value:"Would you like to send an email that is prepopulated with a detailed error report? No personal information such as usernames or passwords will be included.", key:"reportProblemPrompt"}),
					function() {
						var message = $L({value:"Please describe the problem you are experiencing with GuttenPodder here:", key:"reportProblemIntro"}) + "<br/><br/><br/><br/><br/><br/>";
						message += $L({value:"Report Information (please do not remove)", key:"reportInfo"}) + "<br/>";
						message += "Application: " + Mojo.appInfo.id + " v" + Mojo.Controller.appInfo.version + "<br/>";
						message += "Phone: Palm " + Mojo.Environment.DeviceInfo.modelName + " on " + Mojo.Environment.DeviceInfo.carrierName + "(" + Mojo.Environment.DeviceInfo.platformVersion + ")<br/>";
						message += "webOS Mojo build: " + Mojo.Environment.build + "<br/>";
						message += event.data;
						AppAssistant.applicationManagerService.email("GuttenPodder Problem Report", message, true);
					}.bind(this),
					function() {
						var dialog = new drnull.Dialog.Info(event.assistant, $L({value:"Sorry for the inconvenience!", key:"sorry1"}),
							$L({value:"I hope you can resolve your problem.  Please contact guttenpodder@u32.de if you need further assistance.", key:"sorry2"}));
						dialog.show();
					}.bind(this));
				dialog.show();
				break;
            case "help-cmd":
				var url="help";
				switch (currentScene.sceneName) {
					case "preferences":
						url="preferences";
						break;
					case "feedList":
						url="feed-list";
						break;
					case "episodeList":
						url="episode-list";
						break;
					case "episodeDetails":
						url="episode-player";
						break;
					case "feedSearch":
						url="feed-search";
						break;
					case "addFeed":
						url="edit-feed";
						break;
					case "addPlaylist":
						url="edit-playlist";
						break;
				}
               // i do not like web based help (the are people out there
               // without online everywhere
               //
			   // var obj = new Mojo.Service.Request("palm://com.palm.applicationManager", {
			   // 	method: "open",
			   // 	parameters: {
			   // 		target: 'http://www.u32.de/guttenpodder/' + url
			   // 	}
			   // });
				//no break;(!)
			case "about-cmd":
				//stageController.pushAppSupportInfoScene();
                stageController.pushScene({name:"about", transition: Prefs.transition}); // params: url
				break;
		}
	}
};
/*
AppAssistant.VideoLibrary = MojoLoader.require({
	name: "metascene.videos",
	version: "1.0"
})["metascene.videos"];
*/
