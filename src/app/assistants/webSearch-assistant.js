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
           

function WebSearchAssistant(params) {
    if (params) {
        this.startPage = params.startPage;
        this.limitSite = params.limitSite;
    }
}

WebSearchAssistant.prototype.cmdMenuModel = {
    items: [
        {},
        {},
        {},
        {},
//        {label: $L("Back"), command: "home-cmd"}
        {iconPath: "icon32x32.png", command: "home-cmd"}

    ]
};

WebSearchAssistant.prototype.setup = function() {
    this.controller.setupWidget("searchWebView",
            this.attributes = {
                url:    this.startPage,
                /*virtualpagewidth: 280,*/   

                // with interrogateClick=true, openUrl() in the webViewLinkClicked hanlder doesnt work 
                // anymore since webos 2.2.4; so we are using webViewTitleUrlChanged as workaround 
                 /* interrogateClicks: true, */
                minFontSize:8
            },
            this.model = {}
    );

    this.searchWebView = this.controller.get("searchWebView");

    this.handleLinkClicked = this.linkClicked.bind(this);
    this.handleTitleUrlChanged = this.titleUrlChanged.bind(this);  
    this.cmdMenuModel.items[0] = {};
    this.cmdMenuModel.items[1] = {};
    this.level = 0;
    this.maxLevel = 0;

    this.kbdButton = {label:$L('Kbd'), command:'kbd-cmd'};
    if(!_device_.thisDevice.kb){
        //Mojo.Log.info("no keyboard");
        this.cmdMenuModel.items[3]= this.kbdButton;
    }

    this.controller.setupWidget(Mojo.Menu.commandMenu, this.handleCommand, this.cmdMenuModel);
};

WebSearchAssistant.prototype.activate = function(event) {
    Mojo.Event.listen(this.searchWebView, Mojo.Event.webViewLinkClicked, this.handleLinkClicked);
    Mojo.Event.listen(this.searchWebView, Mojo.Event.webViewTitleUrlChanged, this.handleTitleUrlChanged);
};

WebSearchAssistant.prototype.deactivate = function(event) {
    this.stopUrlWatch();
};

WebSearchAssistant.prototype.cleanup = function(event) {
};


WebSearchAssistant.prototype.stopUrlWatch = function() {
    Mojo.Event.stopListening(this.searchWebView, Mojo.Event.webViewLinkClicked, this.handleLinkClicked);
    Mojo.Event.stopListening(this.searchWebView, Mojo.Event.webViewTitleUrlChanged, this.handleTitleUrlChanged);
}


WebSearchAssistant.prototype.titleUrlChanged = function(event) {
   //Mojo.Log.info("event titleurlchanged " + event.url);
   this.urlchanged(event);
}

WebSearchAssistant.prototype.linkClicked = function(event) {
  // Mojo.Log.info("event linkclicked " + event.url);
  this.searchWebView.mojo.openURL(event.url);
}

WebSearchAssistant.prototype.urlchanged = function(event) {
  if( this.lastUrl != event.url ) {
     this.lastUrl = event.url;
     if (this.limitSite && !event.url.startsWith(this.limitSite)) {
         // Elvis has left the site, so the new url is the feed url - hopefully
         Mojo.Log.info("leaving websearch with "+ event.url);
         this.stopUrlWatch();
         this.controller.stageController.popScene({feedToAdd: {url:event.url}});
     } else {
         try{
           this.addBack();
           this.level++;
           this.maxLevel = this.level;
         } catch (e){
           Mojo.Log.error("linkClicked error: " + e);
         }
     }
  }
};

WebSearchAssistant.prototype.handleCommand = function(event) {
    if (event.type == Mojo.Event.command) {
        switch(event.command) {
            case "back-cmd":
                this.backCmd();
                break;
            case "forward-cmd":
                this.forwardCmd();
                break;
            case "home-cmd":
                this.homeCmd();
                break;
            case "kbd-cmd":
                this.kbdCmd();
                break;
        }
    } else if (event.type === Mojo.Event.back) {
        event.stop();
        event.stopPropagation();
        this.backCmd();
    }
};

WebSearchAssistant.prototype.backCmd = function() {
    if (this.level === 0) {
        this.controller.stageController.popScene();
    } else {
        this.level--;
        if (this.level === 0) {
            this.disableBack();
        }
        this.addForward();
        this.searchWebView.mojo.goBack();
    }
};

WebSearchAssistant.prototype.kbdCmd = function() {
    var w= this.controller.window;
    
    w.PalmSystem.setManualKeyboardEnabled(true);
    w.PalmSystem.allowResizeOnPositiveSpaceChange(true);
    w.PalmSystem.keyboardShow(0);
    w.PalmSystem.editorFocused(true, 0, 0);
};

WebSearchAssistant.prototype.forwardCmd = function() {
    this.level++;
    if (this.level === this.maxLevel) {
        this.removeForward();
    }
    this.addBack();
    this.searchWebView.mojo.goForward();
};

WebSearchAssistant.prototype.homeCmd = function() {
    this.controller.stageController.popScene();
};

WebSearchAssistant.prototype.addForward = function() {
    this.cmdMenuModel.items[1] = {icon: "forward", command: "forward-cmd"};
    this.controller.modelChanged(this.cmdMenuModel);
};

WebSearchAssistant.prototype.removeForward = function() {
    this.cmdMenuModel.items[1] = {};
    this.controller.modelChanged(this.cmdMenuModel);
};


WebSearchAssistant.prototype.addBack = function() {
    this.cmdMenuModel.items[0] = {icon: "back", command: "back-cmd"};
    this.controller.modelChanged(this.cmdMenuModel);
};

WebSearchAssistant.prototype.disableBack = function() {
    this.cmdMenuModel.items[0].disabled = true;
    this.controller.modelChanged(this.cmdMenuModel);
};
