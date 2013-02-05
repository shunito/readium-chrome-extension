// Description: This model is responsible for coordinating actions for processing of media overlays 
// it does the following:
// - manages MO/spine interaction
// - listens to MO events
// - invokes MO play/pause/resume functions

// Properties of this model: 
//   active_mo
//   mo_text_id


Readium.Models.MediaOverlayController = Backbone.Model.extend({

	defaults: {
		"active_mo" : null, // the currently-playing media overlay; null if nothing is being played
        "mo_text_id": null, // the current MO text fragment identifier
        "rate": 1.0, // the playback rate
        "volume": 1.0 // the volume
	},

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //

	initialize: function () {

        // the current media overlay
        this.mo = null;
        
        // we track the current section to see when it changes
        this.currentSection = null; 
        
        // flags
        this.autoplayNextSpineItem = false;
        this.processingMoTextSrc = false;
        
        // media overlay playback starts here, if not null
        this.targetHtmlId = null;
        
        // for mute/unmute
        this.savedVolume = 0;
        
        // readium pages object
        this.pages = null;
        // readium view
        this.currentView = null;
        // readium epub controller, set as a constructor option
		this.epubController = this.get("epubController");
		
        // trigger media overlay position updates
        this.epubController.on("change:spine_position", this.handleSpineChanged, this);   
        this.epubController.on("change:hash_fragment", this.handleHashFragmentChanged, this);
        this.on("change:rate", this.rateChanged, this);
        this.on("change:volume", this.volumeChanged, this);     
	},
    
    // each time there is a new pagination view created, it must call setPages
    setPages: function(pages) {
        if (this.pages != null) {
            this.pages.off();
        }
        this.pages = pages;
    },
    
    // each time there is a new pagination view created, it must call setView
    setView: function(view) {
        this.currentView = view;
    },
    
    // main playback function
	playMo: function() {
        if (this.mo == null) {
            return;
        }
        
        this.set("active_mo", this.mo);
        this.mo.on("change:current_text_src", this.handleMoTextSrc, this);
		this.mo.on("change:is_document_done", this.handleMoDocumentDone, this);
        
        var moTargetNode;
        var hadTargetHtmlId = this.targetHtmlId != null;
        // find our target on this page (either a specific target, or the top of the page)
        if (hadTargetHtmlId) {
            moTargetNode = this.findTarget(this.targetHtmlId);
        }
        else {
            moTargetNode = this.findFirstOnPage();
        }
        this.targetHtmlId = null;
        
        // FXL
        if (this.currentSection.isFixedLayout()) {
            if (this.mo.get("has_started_playback") && hadTargetHtmlId == false) {
                this.resumeMo();
            }
            else {
                this.mo.startPlayback(moTargetNode);
            }
        }
            
        // Reflowable
        else {
            var currMoPage = -1;
            var currMoId = this.get("mo_text_id");
            if (currMoId != null && currMoId != undefined && currMoId != "") {
                // REFACTORING CANDIDATE: This has got to change. Tight coupling and lots of indirection. 
                currMoPage = this.currentView.reflowableElementsInfo.getElemPageNumberById(
                    currMoId, 
                    this.currentView.getEpubContentDocument(),
                    this.currentView.offsetDirection(),
                    this.currentView.reflowableElementsInfo.page_width,
                    this.currentView.reflowableElementsInfo.gap_width
                    );
            }
                
            // if media overlays is on our current page, then resume playback
            var currMoPageIsVisible = this.pages.get("current_page").indexOf(currMoPage) != -1;
                
            if (currMoPageIsVisible && hadTargetHtmlId == false) {   
                this.resumeMo();
            }
            else {
                this.mo.startPlayback(moTargetNode);
            }
        }
	},

    // pause the media overlay playback
	pauseMo: function() {
        if (this.mo) {
			this.mo.off();
			this.mo.pause();
			this.set("active_mo", null);             
		}
	},
    
    // toggles mute/unmute
    mute: function() {
        if (this.mo) {
            // unmute
            if (this.mo.getVolume() == 0) {
                this.set("volume", this.savedVolume);
            }
            // mute
            else {
                this.savedVolume = this.mo.getVolume();
                this.set("volume", 0);
            }
        }
    },
    
    volumeChanged: function() {
        if (this.mo) {
            this.mo.setVolume(this.get("volume"));
        }
    },
    
    rateChanged: function() {
        if (this.mo) {
            this.mo.setRate(this.get("rate"));
        }
    },
    
    // called by the reflowable view when the page changes
    reflowPageChanged: function() {
        
        // if MO is driving navigation, don't process the page change
        // it's probably something we triggered ourselves
        if (this.processingMoTextSrc || this.autoplayNextSpineItem ) {
            return;
        }
        
        var wasPlaying = this.get("active_mo") != null;
        if (wasPlaying) {
            this.pauseMo();
        }
        
        // if media overlays were playing, then resume playback
        if (wasPlaying) {
            this.playMo();
        } 
    },
    
    // the pagination view calls this when it has reloaded the pages, for example when the spine item changes
    // we need to wait for this event because the pages shuffle a bit during reloading, 
    // which otherwise causes MO to start playback at the wrong point.
    pagesLoaded: function() {
        // just to be safe, ignore FXL
        if (this.currentSection.isFixedLayout()) {
            return;
        }
        if (this.autoplayNextSpineItem == true) {
            this.autoplayNextSpineItem = false;
            this.playMo();
        }
    },
    
	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" METHODS                                                                   //
	// ------------------------------------------------------------------------------------ //
    resumeMo: function() {
        this.set("mo_text_id", null); // clear it so that any listeners re-hear the event
        this.handleMoTextSrc();
        this.mo.resume();
    },
    
    handleMoTextSrc: function() {
        var textSrc = this.mo.get("current_text_src");
        if (textSrc == null) {
            this.set("mo_text_id", null);
            return;
        }
        
        this.processingMoTextSrc = true;
        this.epubController.goToHref(textSrc);
        var frag = "";
        if (textSrc.indexOf("#") != -1 && textSrc.indexOf("#") < textSrc.length -1) {
            frag = textSrc.substr(textSrc.indexOf("#")+1);
        }
        this.set("mo_text_id", frag);
        this.processingMoTextSrc = false;    
    },
    
    handleMoDocumentDone: function() {
        if (this.mo != null && this.mo != undefined) {
            if (this.mo.get("is_document_done") == false) {
                return;
            }
        }
        
        this.pauseMo();
        // advance the spine position
        if (this.epubController.hasNextSection()) {
            this.autoplayNextSpineItem = true; 
            this.epubController.goToNextSection();
        }
    },
    
    handleSpineChanged: function() {
        this.set("mo_text_id", null);
        // sometimes the spine changed event fires but the spine didn't actually change
        if (this.epubController.getCurrentSection() == this.currentSection) {
            return;
        }
        // was something playing?
        if (this.get("active_mo") != null) {
            this.autoplayNextSpineItem = true; 
            this.pauseMo();
        }
        this.currentSection = this.epubController.getCurrentSection();
        this.mo = this.currentSection.getMediaOverlay();
        if (this.mo == null) {
            this.autoplayNextSpineItem = false;
            return;
        }
        
        this.mo.reset();
        // keep the volume and rate consistent
        this.mo.setVolume(this.get("volume"));
        this.mo.setRate(this.get("rate"));
        
        if (this.currentSection.isFixedLayout() && this.autoplayNextSpineItem) {
            this.autoplayNextSpineItem = false;
            this.playMo();
        }
    },
    
    handleHashFragmentChanged: function() {
        // if MO is driving navigation, don't process the hash fragment change
        // it's probably something we triggered ourselves
        if (this.processingMoTextSrc) {
            return;
        }
        
        var hash = this.epubController.get("hash_fragment");
        if (hash == undefined || hash == "") {
            return;
        }
        this.targetHtmlId = hash;
        this.pauseMo();
        this.playMo();
    },
    
    // find the MO starting point closest to targetId
    findTarget: function(targetId) {
        
        if (targetId == null || targetId == undefined || targetId == "") {
            return null;
        }
        // two issues here:
        // 1. MO might not have a corresponding <text> pointing to #targetId
        // In this case, we have to find the next-closest
        //
        // 2. we have to look at all elements, not just the currently visible ones. the pages get refreshed a few times
        // and the target element might not be displayed until the second time around. however, we need to find what the
        // most reasonable MO target is and can't risk coming up with nothing (because then MO starts at the top)
        var allElms = this.currentView.getAllPageElementsWithId();
        var docHref = this.currentSection.resolveUri(this.currentSection.get("href"));
        var startHref = docHref + "#" + targetId;
        var foundStart = false; 
        var node = null;
        
        for (var i = 0; i<allElms.length; i++) {
            var id = $(allElms[i]).attr("id");
            var src = docHref + "#" + id;
            if (src == startHref) {
                foundStart = true;
            }
            // once we found our starting point in the set, start looking at MO nodes
            if (foundStart) {
                node = this.mo.findNodeByTextSrc(src);
                if (node) {
                    break;
                }
            }
        }
        return node;
    },
    
    // find the first visible page element with an MO <text> equivalent
    findFirstOnPage: function() {
        // this is only useful for reflowable content
        if (this.currentSection.isFixedLayout()) {
            return null;
        }
        
        var pageElms = this.currentView.findVisiblePageElements();
        var docHref = this.currentSection.resolveUri(this.currentSection.get("href"));
        var node = null;
        for (var i = 0; i<pageElms.length; i++) {
            var id = $(pageElms[i]).attr("id");
            var src = docHref + "#" + id;
            node = this.mo.findNodeByTextSrc(src);
            if (node) {
                break;
            }
        }
        return node;
    }
});