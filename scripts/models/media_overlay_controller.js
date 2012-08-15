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
        "mo_text_id": null // the current MO text fragment identifier
	},

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //

	initialize: function () {

        this.waitForPagesToLoadThenPlay = false;
        this.mo_processing = false;
        this.mo_target = null;
        this.pages = null;
        this.currentView = null;
		this.epubController = this.get("epubController");
		// trigger media overlay position updates
        this.epubController.on("change:spine_position", this.spineChanged, this);        
	},
    
    // each time there is a new pagination view, it must call setPages
    setPages: function(pages) {
        if (this.pages != null) {
            this.pages.off();
        }
        this.pages = pages;
    },
    
    // each time there is a new pagination view, it must call setView
    setView: function(view) {
        this.currentView = view;
    },
    
	playMo: function() {
        var currentSection = this.epubController.getCurrentSection();
		var mo = currentSection.getMediaOverlay();
        
		if(mo) {
			this.set("active_mo", mo);
			mo.on("change:current_text_src", this.handleMoTextSrc, this);
			mo.on("change:is_document_done", this.handleMoDocumentDone, this);
            
            var target = this.mo_target;
            this.mo_target = null;
            
            if (currentSection.isFixedLayout()) {
                if (mo.get("has_started_playback")) {
                    this.resumeMo();
                }
                else {
                    mo.startPlayback(null);
                }
            }
            // Is a reflowable section
            else {
                var currMoPage = -1;
                var currMoId = this.get("mo_text_id");
                if (currMoId != null && currMoId != undefined && currMoId != "") {
                    currMoPage = this.currentView.getElemPageNumberById(currMoId);
                }
                
                // if media overlays is on our current page, then resume playback
                var currMoPageIsVisible = this.pages.get("current_page").indexOf(currMoPage) != -1;
                
                if (currMoPageIsVisible) {    
                    this.resumeMo();
                }
                else {
                    mo.startPlayback(target);
                }
            }
		}
		else {
			alert("Sorry, the current EPUB does not contain a media overlay for this content");
		}
	},

	pauseMo: function() {
        var mo = this.get("active_mo");
		if (mo) {
			mo.off();
			mo.pause();
			this.set("active_mo", null);             
		}
	},
    
    pageChanged: function() {
        if (this.mo_processing || this.waitForPagesToLoadThenPlay ) {
            // TODO debug
            console.log("ignoring page change.\n");
            return;
        }
            
        this.updateMoPosition();
    },
    
    // reflowable pagination view calls this when it is reloaded with pages, for example when the spine item changes
    pagesLoaded: function() {
        if (this.waitForPagesToLoadThenPlay == true) {
            this.waitForPagesToLoadThenPlay = false;
            this.playMo();
        }
    },
    
	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" METHODS                                                                   //
	// ------------------------------------------------------------------------------------ //
    resumeMo: function() {
        var currentSection = this.epubController.getCurrentSection();
        var mo = currentSection.getMediaOverlay();
        this.set("mo_text_id", null); // clear it so that any listeners re-hear the event
        this.handleMoTextSrc();
        mo.resume();
    },
    
    handleMoTextSrc: function() {
        var mo = this.get("active_mo");
        var textSrc = mo.get("current_text_src");
        
        this.mo_processing = true;
        this.epubController.goToHref(textSrc);
        var frag = "";
        if (textSrc.indexOf("#") != -1 && textSrc.indexOf("#") < textSrc.length -1) {
            frag = textSrc.substr(textSrc.indexOf("#")+1);
        }
        this.set("mo_text_id", frag);
        this.mo_processing = false;    
    },
    
    handleMoDocumentDone: function() {
        var mo = this.get("active_mo");
        if (mo != null && mo != undefined) {
            if (mo.get("is_document_done") == false) {
                return;
            }
        }
        this.mo_target = null;
        this.set("mo_text_id", null);
        this.pauseMo();
        // advance the spine position
        if (this.epubController.hasNextSection()) {
            this.waitForPagesToLoadThenPlay = true; 
            this.epubController.goToNextSection();
        }
    },
    
    spineChanged: function() {
        // we only care about spine changes for FXL books because the page load handler takes care of reflowable books
        if (this.epubController.getCurrentSection().isFixedLayout()) {
            // if we were waiting for the next spine item before continuing playback
            if (this.waitForPagesToLoadThenPlay) {
                this.waitForPagesToLoadThenPlay = false;
                this.playMo();
            }
            // else just update our position so when playback starts, we'll be at the right point
            else {
                this.updateMoPosition();
            }
        }
    },
    
    updateMoPosition: function() {
        
        // if we are processing an MO event, then don't update MO position:
        // chances are, it's a page change event that came from MO playback advancing
        if (this.mo_processing) {
            // TODO debug
            console.log("ignoring updateMoPosition");
            return;
        }
        
        var mo_was_playing = this.get("active_mo") != null;
        this.pauseMo();
        var currentSection = this.epubController.getCurrentSection();

        if (currentSection.isFixedLayout()) {
            var mo = currentSection.getMediaOverlay();
            if (mo) {
                // reset so it starts at the beginning of the page 
                mo.reset(); 
            }
        }
        else {
            this.setMoTarget();
        }
        // if media overlays were playing, then resume playback
        if (mo_was_playing) {
            this.playMo();
        } 
    },
    
    // look at the current page and find the first visible page element that also appears in the document's MO
    setMoTarget: function() {

    	var pageElms;
    	var node;
        // using this instead of "active_mo" because this function could be called when MO is not playing
        var currentSection = this.epubController.getCurrentSection();
        var mo = currentSection.getMediaOverlay();
        if (mo == null) {
            return;
        }
        
        if (!currentSection.isFixedLayout()) {
        	pageElms = this.currentView.findVisiblePageElements();
            var doc_href = currentSection.get("href");
            
	        node = null;
	        for (var i = 0; i<pageElms.length; i++) {
	            var id = $(pageElms[i]).attr("id");
	            var src = doc_href + "#" + id;
	            node = mo.findNodeByTextSrc(src);
	            if (node) {
	                break;
	            }
	        }
        }
        else {
            // fixed layout doesn't need a target node: the top of the page is always the start of the document
        	node = null;
        }
        
        this.mo_target = node;
    }
});