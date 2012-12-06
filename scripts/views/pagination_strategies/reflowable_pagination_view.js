
Readium.Views.ReflowablePaginationView = Backbone.View.extend({

	el: "#readium-book-view-el",

	initialize: function(options) {

		// Initalize delegates and other models
		this.reflowableLayout = new Readium.Views.ReflowableLayout();
		this.reflowableElementsInfo = new Readium.Views.ReflowableElementInfo();
		this.pages = new Readium.Models.ReadiumPagination({model : this.model});
		this.zoomer = options.zoomer;
        this.mediaOverlayController = this.model.get("media_overlay_controller");
        this.mediaOverlayController.setPages(this.pages);
        this.mediaOverlayController.setView(this);

        // Initialize handlers
		this.mediaOverlayController.on("change:mo_text_id", this.highlightText, this);
        this.mediaOverlayController.on("change:active_mo", this.indicateMoIsPlaying, this);
		this.model.on("change:font_size", this.rePaginationHandler, this);
		this.model.on("change:two_up", this.pages.toggleTwoUp, this.pages);
		this.model.on("change:two_up", this.rePaginationHandler, this);
		this.model.on("change:current_margin", this.rePaginationHandler, this);
		this.pages.on("change:current_page", this.pageChangeHandler, this);
		this.model.on("change:toc_visible", this.windowSizeChangeHandler, this);
		this.model.on("repagination_event", this.windowSizeChangeHandler, this);
		this.model.on("change:current_theme", this.themeChangeHandler, this);
	},

	// Description: Remove all handlers so they don't hang around in memory
	destruct: function() {
		
		this.mediaOverlayController.off("change:mo_text_id", this.highlightText, this);
        this.mediaOverlayController.off("change:active_mo", this.indicateMoIsPlaying, this);
		this.model.off("change:font_size", this.rePaginationHandler, this);
		this.model.off("change:two_up", this.pages.toggleTwoUp, this.pages);
		this.model.off("change:two_up", this.rePaginationHandler, this);
		this.model.off("change:current_margin", this.rePaginationHandler, this);
		this.pages.off("change:current_page", this.pageChangeHandler, this);
		this.model.off("change:toc_visible", this.windowSizeChangeHandler, this);
		this.model.off("repagination_event", this.windowSizeChangeHandler, this);
		this.model.off("change:current_theme", this.themeChangeHandler, this);

        this.reflowableLayout.resetEl(
        	this.getBody(), 
        	this.el, 
        	this.getSpineDivider(),
        	this.getPageWrap(),
        	this.zoomer);
	},

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //

	render : function (goToLastPage, hashFragmentId) {

		var that = this;
		var json = this.model.getCurrentSection().toJSON();
		$(this.getContainer()).html( Handlebars.templates.reflowing_template(json) );
		
		// Wait for iframe to load EPUB content document
		$(this.getReadiumFlowingContent()).on("load", function (e) {

			var lastPageElementId = that.initializeContentDocument();
			that.mediaOverlayController.pagesLoaded();

			// Rationale: The assumption here is that if a hash fragment is specified, it is the result of Readium 
			//   following a clicked linked, either an internal link, or a link from the table of contents. The intention
			//   to follow a link should supersede restoring the last-page position, as this should only be done for the 
			//   case where Readium is re-opening the book, from the library view. 
			if (hashFragmentId) {
				that.goToHashFragment(hashFragmentId);
			}
			else if (lastPageElementId) {
				that.goToHashFragment(lastPageElementId);
			}
			else {

				if (goToLastPage) {
					that.pages.goToLastPage();
				}
				else {
					that.pages.goToPage(1);
				}		
			}
		});
		
		return [this.model.get("spine_position")];
	},
    
	indicateMoIsPlaying: function () {
		var moHelper = new Readium.Models.MediaOverlayViewHelper({epubController : this.model});
		moHelper.renderReflowableMoPlaying(
			this.model.get("current_theme"),
			this.mediaOverlayController.get("active_mo"),
			this
		);
	},

	highlightText: function () {
		var moHelper = new Readium.Models.MediaOverlayViewHelper({epubController : this.model});
		moHelper.renderReflowableMoFragHighlight(
			this.model.get("current_theme"),
			this,
			this.mediaOverlayController.get("mo_text_id")
		);
	},

	// Description: navigate to a url hash fragment by calculating the page of
	//   the corresponding elem and setting the page number on `this.model`
	//   as precondition the hash fragment should identify an element in the
	//   section rendered by this view
	goToHashFragment: function(hashFragmentId) {

		// this method is triggered in response to 
		var fragment = hashFragmentId;
		if(fragment) {
			var el = $("#" + fragment, this.getBody())[0];

			if(!el) {
				// couldn't find the el. just give up
                return;
			}

			// we get more precise results if we look at the first children
			while (el.children.length > 0) {
				el = el.children[0];
			}

			var page = this.reflowableElementsInfo.getElemPageNumber(
				el, 
				this.offsetDirection(), 
				this.reflowableLayout.page_width, 
				this.reflowableLayout.gap_width,
				this.getBody());
            if (page > 0) {
                this.pages.goToPage(page);	
			}
		}
		// else false alarm no work to do
	},

	// Save position in epub
	// Refactor this, probably stays here, although much else will move into finding visible elements
	savePosition : function () {

		var $visibleTextNode;
		var existingCFI;
		var lastPageMarkerExists = false;
		var characterOffset;
		var contentDocumentIdref;
		var packageDocument;
		var generatedCFI;

		// Get first visible element with a text node 
		$visibleTextNode = this.reflowableElementsInfo.findVisibleTextNode(this.getEpubContentDocument(), this.model.get("two_up"));

		// Check if a last page marker already exists on this page
		try {
			$.each($visibleTextNode.parent().contents(), function () {

				if ($(this).hasClass("last-page")) {
					lastPageMarkerExists = true;
					existingCFI = $(this).attr("data-last-page-cfi");

					// Break out of loop
					return false;
				}
			});
		}
		catch (e) {

			console.log("Could not generate CFI for non-text node as first visible element on page");

			// No need to execute the rest of the save position method if the first visible element is not a text node
			return;
		}

		// Re-add the CFI for the marker on this page
		// REFACTORING CANDIDATE: This shortcut makes this method confusing, it needs to be refactored for simplicity
		if (lastPageMarkerExists) {

			this.model.addLastPageCFI(existingCFI, this.model.get("spine_position"));
			this.model.save();
			return; 
		}

		characterOffset = this.reflowableElementsInfo.findVisibleCharacterOffset($visibleTextNode, this.getEpubContentDocument());

		// Get the content document idref
		contentDocumentIdref = this.model.getCurrentSection().get("idref");

		// Get the package document
		packageDocument = this.model.getPackageDocumentDOM();

		// Save the position marker
		generatedCFI = EPUBcfi.Generator.generateCharacterOffsetCFI(
			$visibleTextNode[0], 
			characterOffset, 
			contentDocumentIdref, 
			packageDocument, 
			["cfi-marker", "audiError"], 
			[], 
			["MathJax_Message"]);

		this.model.addLastPageCFI(
			generatedCFI, 
			this.model.get("spine_position"));

		// Save the last page marker been added
		this.model.save();
	},	

	// ------------------------------------------------------------------------------------ //
	//  PRIVATE GETTERS FOR VIEW                                                            //
	// ------------------------------------------------------------------------------------ //    

	// Rationale: This method is the same as epubContentDocument as other parts of readium call
	//   this. It should be removed at some point.
	getBody : function() {
		return this.$('#readium-flowing-content').contents()[0].documentElement;
	},

	getReadiumBookViewEl : function () {
		return this.el;
	},

	getContainer : function () {
		return this.$('#container')[0];
	},

	getFlowingWrapper : function () {
		return this.$("#flowing-wrapper")[0];
	},

	getPageWrap : function () {
		return this.$("#page-wrap")[0];
	},

	getReadiumFlowingContent : function () {
		return this.$("#readium-flowing-content")[0];
	},

	getEpubContentDocument : function () {
		return this.$("#readium-flowing-content").contents()[0].documentElement;
	},

	getSpineDivider : function () {
		return this.$("#spine-divider")[0];
	},

	// ------------------------------------------------------------------------------------ //
	// PRIVATE EVENT HANDLERS                               								//
	// ------------------------------------------------------------------------------------ //

	keydownHandler : function (e) {

        if (e.which == 39) {
            this.pages.goRight();
        }
                        
        if (e.which == 37) {
            this.pages.goRight();
        }
    },

	// Description: Handles clicks of anchor tags by navigating to
	//   the proper location in the epub spine, or opening
	//   a new window for external links
	linkClickHandler : function (e) {

		var href;
		e.preventDefault();

		// Check for both href and xlink:href attribute and get value
		if (e.currentTarget.attributes["xlink:href"]) {
			href = e.currentTarget.attributes["xlink:href"].value;
		}
		else {
			href = e.currentTarget.attributes["href"].value;
		}

		// Resolve the relative path for the requested resource.
		href = this.resolveRelativeURI(href);
		if (href.match(/^http(s)?:/)) {
			window.open(href);
		} 
		else {
			this.model.goToHref(href);
		}
	},	

	pageChangeHandler: function() {

        var that = this;
		this.hideContent();
		setTimeout(function () {

			that.paginateContentDocument();

		}, 150);
	},

	windowSizeChangeHandler: function() {

		this.paginateContentDocument();
		
		// Make sure we return to the correct position in the epub (This also requires clearing the hash fragment) on resize.
		this.goToHashFragment(this.model.get("hash_fragment"));
	},
    
	rePaginationHandler: function() {

		this.paginateContentDocument();
	},

	themeChangeHandler : function () {

		this.reflowableLayout.injectTheme(
			this.model.get("current_theme"), 
			this.getEpubContentDocument(), 
			this.getFlowingWrapper());
	},

	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" HELPERS AND UTILITY METHODS                                               //
	// ------------------------------------------------------------------------------------ //

	// Rationale: This method delegates the pagination of a content document to the reflowable layout model
	paginateContentDocument : function () {

		var pageInfo = this.reflowableLayout.paginateContentDocument(
			this.getReadiumBookViewEl(),
			this.getSpineDivider(),
			this.model.get("two_up"),
			this.offsetDirection(),
			this.getEpubContentDocument(),
			this.getReadiumFlowingContent(),
			this.getFlowingWrapper(),
			this.model.getCurrentSection().firstPageOffset(),
			this.pages.get("current_page"),
			this.model.epub.get("page_prog_dir"),
			this.model.get("current_margin"),
			this.model.get("font_size")
			);

		this.pages.set("num_pages", pageInfo[0]);
		this.showPage(pageInfo[1]);
		this.savePosition();
	},

	initializeContentDocument : function () {

		var elementId = this.reflowableLayout.initializeContentDocument(
			this.getEpubContentDocument(), 
			this.model.get("epubCFIs"), 
			this.model.get("spine_position"), 
			this.getReadiumFlowingContent(), 
			this.model.packageDocument, 
			Handlebars.templates.bindingTemplate, 
			this.linkClickHandler, 
			this, 
			this.model.get("current_theme"), 
			this.getFlowingWrapper(), 
			this.getReadiumFlowingContent(), 
			this.keydownHandler
			);

		this.paginateContentDocument();

		return elementId;
	},

	showPage: function(page) {
        // check to make sure we're not already on that page
        // REFACTORING CANDIDATE: This should be this.pages.get("current_page")
        if (this.model.get("current_page") != undefined && this.model.get("current_page").indexOf(page) != -1) {
            return;
        }
		var offset = this.calcPageOffset(page).toString() + "px";
		$(this.getBody()).css(this.offsetDirection(), "-" + offset);
		this.showContent();
        
        if (this.model.get("two_up") == false || 
            (this.model.get("two_up") && page % 2 === 1)) {
                // when we change the page, we have to tell MO to update its position
                this.mediaOverlayController.reflowPageChanged();
        }
	},
	
	// Rationale: For the purpose of looking up EPUB resources in the package document manifest, Readium expects that 
	//   all relative links be specified as relative to the package document URI (or absolute references). However, it is 
	//   valid XHTML for a link to another resource in the EPUB to be specfied relative to the current document's
	//   path, rather than to the package document. As such, URIs passed to Readium must be either absolute references or 
	//   relative to the package document. This method resolves URIs to conform to this condition. 
	// REFACTORING CANDIDATE: This could be moved into some sort of utility method uri resolution
	resolveRelativeURI : function (rel_uri) {
		var relativeURI = new URI(rel_uri);

		// Get URI for resource currently loaded in the view's iframe
		var iframeDocURI = new URI($("#readium-flowing-content").attr("src"));

		return relativeURI.resolve(iframeDocURI).toString();
	},

	hideContent : function() {
		$("#flowing-wrapper").css("opacity", "0");
	},

	showContent : function() {
		$("#flowing-wrapper").css("opacity", "1");
	},

	calcPageOffset : function(page_num) {
		return (page_num - 1) * (this.reflowableLayout.page_width + this.reflowableLayout.gap_width);
	},

	offsetDirection : function () {

		// if this book does right to left pagination we need to set the
		// offset on the right
		if (this.model.epub.get("page_prog_dir") === "rtl") {
			return "right";
		}
		else {
			return "left";
		}
	}
});