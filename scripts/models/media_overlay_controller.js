// Description: This model is responsible for coordinating actions for processing of media overlays 

// Properties of this model: 
//   active_mo
//   

// REFACTORING CANDIDATE: As the media overlay progresses through the epub, the page numbers have to get updated, as well. There
//   will be an interaction here regarding which code will be responsible for loading the next spine item. 

Readium.Models.MediaOverlayController = Backbone.Model.extend({

	defaults: {
		"active_mo" : null, // the currently-playing media overlay; null if nothing is being played
		"mo_processing": false, // flag that we are currently processing an MO event
		"mo_target": null  // target MO node: gets set when the page changes; MO can update its playback accordingly by restarting at the new target
	},

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //

	initialize: function () {

		this.epubController = this.get("epubController");
		this.pages = this.get("pages");
		this.currentView = this.get("view");

		// trigger media overlay position updates
        if (this.epubController.getCurrentSection().isFixedLayout()) {
            this.epubController.on("change:spine_position", this.updateMoPosition, this);
        }
        else {
            this.pages.on("change:num_pages", this.updateMoPosition, this);
        }
	},

	playMo: function() {
		var currentSection = this.epubController.getCurrentSection();
		var mo = currentSection.getMediaOverlay();
		if(mo) {
			this.set("active_mo", mo);
			mo.on("change:current_text_src", this.handleMoTextSrc, this);
			mo.on("change:is_document_done", this.handleMoDocumentDone, this);
            
            var target = this.get("mo_target");
            this.set("mo_target", null);
            
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
		if(mo) {
			mo.off();
			mo.pause();
			this.set("active_mo", null); 
            this.set("mo_text_id", "");
		}
	},
    
    pageChanged: function() {
        this.updateMoPosition();
    },
    
	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" METHODS                                                                   //
	// ------------------------------------------------------------------------------------ //
    resumeMo: function() {
        var currentSection = this.epubController.getCurrentSection();
        var mo = currentSection.getMediaOverlay();
        this.handleMoTextSrc();
        mo.resume();
    },
    
    handleMoTextSrc: function() {
        var mo = this.get("active_mo");
        var textSrc = mo.get("current_text_src");
        this.set("mo_processing", true);
        this.epubController.goToHref(textSrc);
        var frag = "";
        if (textSrc.indexOf("#") != -1 && textSrc.indexOf("#") < textSrc.length -1) {
            frag = textSrc.substr(textSrc.indexOf("#")+1);
        }
        this.set("mo_text_id", frag);
        this.set("mo_processing", false);    
    },
    
    handleMoDocumentDone: function() {
        var mo = this.get("active_mo");
        if (mo != null && mo != undefined) {
            if (mo.get("is_document_done") == false) {
                return;
            }
        }
        this.set("mo_processing", true);
        this.set("mo_target", null);
        this.pauseMo();
        // advance the spine position
        if (this.epubController.hasNextSection()) {
            this.epubController.goToNextSection();
            this.set("mo_processing", false);
            this.playMo();
        }
        this.set("mo_processing", false);
    },
    
    updateMoPosition: function() {

    	var currentSection;
    	var mo;
        // if we are processing an MO event, then don't update MO position:
        // chances are, it's a page change event that came from MO playback advancing
        if (this.get("active_mo") != null && this.get("mo_processing") == true) {
            return;
        }
        
        var mo_is_playing = this.get("active_mo") != null;
        
        this.pauseMo();
        
        currentSection = this.epubController.getCurrentSection();

        if (currentSection.isFixedLayout()) {
            mo = currentSection.getMediaOverlay();
            if (mo) {
                mo.set("has_started_playback", false);
            }
        }
        else {
            this.setMoTarget();
        }
        // if media overlays were playing, then resume playback
        if (mo_is_playing) {
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
        
        // TODO remove debug output
        if (node) {
            console.log("Found MO target for " + src);
        }
        else {
            console.log("MO target not found for " + src);
        }
        this.set("mo_target", node);
    }
});