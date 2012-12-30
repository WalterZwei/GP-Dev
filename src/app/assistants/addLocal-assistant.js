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

function AddLocalAssistant(feed) {
    this.feed = feed;

	this.cmdMenuModel = {items: [{label: $L("Back"), command: "cancel-cmd"},
	                             {label: $L("Done"), command: "save-cmd"}]};

    if (this.feed !== null) {
        this.newFeed = false;
        this.originalUrl = feed.url;
        this.title = this.feed.title;
        this.filterExpression = this.feed.url.substring(8);
        this.albumArt = this.feed.albumArt;
        this.autoDelete = this.feed.autoDelete;
        this.includeOwnFiles = this.feed.hideFromOS;
        this.maxEpisodes = this.feed.maxEpisodes;
    } else {
        this.newFeed = true;
        this.title = null;
        this.filterExpression = null;
        this.albumArt = null;
        this.albumArt = "images/localmedia-icon.png";
        this.autoDelete = true;
        this.includeOwnFiles = false;
        this.maxEpisodes = 0;
    }
}

AddLocalAssistant.prototype.menuAttr = {omitDefaultItems: true};

AddLocalAssistant.prototype.setup = function() {
    this.menuModel = {
        visible: true,
        items: [
            Mojo.Menu.editItem,
            {label: $L("Help") + "...", command: "help-cmd"}
        ]
    };

    this.controller.setupWidget(Mojo.Menu.appMenu, this.menuAttr, this.menuModel);

	this.controller.setupWidget(Mojo.Menu.commandMenu, this.handleCommand, this.cmdMenuModel);

    this.controller.setupWidget("newFeedURL", {
            hintText : $L({value:"filter expression", key:"filterExpression"}),
            focus : true,
            limitResize : true,
            autoReplace : false,
            textCase : Mojo.Widget.steModeLowerCase,
            enterSubmits : false
        },
        this.urlModel = { value : this.filterExpression });

    this.controller.setupWidget("newFeedName", {
            hintText : $L({value:"Title (Optional)", key:"titleOptional"}),
            limitResize : true,
            autoReplace : false,
            textCase : Mojo.Widget.steModeTitleCase,
            enterSubmits : false
        },
        this.nameModel = { value : this.title });

    this.controller.setupWidget("albumArt", {
            hintText : $L({value:"Album Art (space clears)", key:"albumArtSpaceClears"}),
            limitResize : true,
            autoReplace : false,
            textCase : Mojo.Widget.steModeLowerCase,
            enterSubmits : false
        },
        this.albumArtModel = { value : this.albumArt });

    this.controller.setupWidget("sortingList",
        {label: "Sorting",
		 labelPlacement: Mojo.Widget.labelPlacementLeft,
         choices: [
            {label: "publication date, newest first", value: 0}, 
            {label: "publication date, oldest first", value: 1}, 
            {label: "title ", value: 2},
            {label: "title descending", value: 3},
            {label: "url descending", value: 4}                  
         ]
        },
        this.sortingListModel = { value : this.maxEpisodes });

    this.controller.setupWidget("includeOwnFilesToggle",
        {},
        this.includeOwnFilesModel = { value : this.includeOwnFiles });

    this.localize.bind(this).defer();
};

AddLocalAssistant.prototype.localize = function() {
    if (this.newFeed) {
        Util.localize(this, "dialogTitle", "Add local media feed", "addLocalFeed");
    } else {
        Util.localize(this, "dialogTitle", "Edit local media feed", "editLocalFeed");
    }
    Util.localize(this, "urlLabel", "Filter");
    Util.localize(this, "titleLabel", "Title");
    Util.localize(this, "iconLabel", "Icon");
    Util.localize(this, "feedOptions", "Options", "feedOptions");
    Util.localize(this, "includeDrPodderFiles", "include Guttenpodder's own podcast files", "includeDrPodderFiles");
};


AddLocalAssistant.prototype.updateFields = function() {
    if (this.urlModel.value)  {
        this.feed.filenameFilterExp = this.urlModel.value;
    } else { 
        this.feed.filenameFilterExp = ""; 
    }
    if (this.nameModel.value) {this.feed.title = this.nameModel.value;}
    if (this.albumArtModel.value) {this.feed.albumArt = this.albumArtModel.value;}
    this.feed.autoDelete = false; 
    this.feed.hideFromOS = this.includeOwnFilesModel.value;
    if (this.sortingListModel != this.feed.maxEpisodes) {
        this.feed.maxEpisodes  = this.sortingListModel.value;
        this.feed.sortEpisodesAndPlaylists();
    }
};


AddLocalAssistant.prototype.checkFeed = function() {
    // If the filter is the same, then assume that it's just a title change,
    // update the feed title and close the dialog. Otherwise update the feed.
    if (!this.newFeed && this.feed !== null &&
         this.feed.filenameFilterExp === this.urlModel.value 
    ) { // URL not changed
        Mojo.Log.info("feed filterexp not changed: %s", this.urlModel.value);
        this.updateFields();
        DB.saveFeed(this.feed);
        this.controller.stageController.popScene({feedChanged: true, feedIndex: feedModel.items.indexOf(this.feed)});
    } else {
        //  If a new feed, push the entered feed data on to the feedlist and
        //  call processFeed to evaluate it.
        if (this.newFeed) {
            Mojo.Log.info("new local media feed. filterexp: %s", this.urlModel.value);
            this.feed = new Feed();
            this.feed.interval = 60000;
        }
        this.feed.isLocalMedia = true;
        this.updateFields();
        Mojo.Log.info("saving filterexp: %s", this.feed.filenameFilterExp);

        var results = {};
        if (this.newFeed) {
            feedModel.items.push(this.feed);
            results.feedAdded = true;
        } else {
            results.feedChanged = true;
            results.feedIndex = feedModel.items.indexOf(this.feed);
            DB.saveFeed(this.feed);
        }
        this.feed.update(); 
        this.controller.stageController.popScene(results);
    }
};

AddLocalAssistant.prototype.fail = function(message, log, reveal) {
    if (message) {
        Util.banner(message);
    }
    if (log) {
        Mojo.Log.error(log);
    }

    if (!reveal) {
        reveal = "newFeedURL";
    }

    this.controller.getSceneScroller().mojo.revealTop(true);
    this.controller.get(reveal).mojo.focus();
};


AddLocalAssistant.prototype.handleCommand = function(event) {
    if (event.type === Mojo.Event.command) {
        switch (event.command) {
            case "cancel-cmd":
                if (!this.newFeed) {
                    this.feed.url = this.originalUrl;
                }
                this.controller.stageController.popScene();
                break;
			case "save-cmd":
                this.checkFeed();
				break;
        }
    } else if (event.type === Mojo.Event.back) {
        event.stop();
        event.stopPropagation();
        this.checkFeed();
    }
};

