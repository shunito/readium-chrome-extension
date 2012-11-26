
Readium.Views.ReflowablePaginationView = Backbone.View.extend({

	el: "#readium-book-view-el",

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //

	initialize: function(options) {

		var that = this;
		this.reflowableLayout = new Readium.Views.ReflowableLayout();
		this.reflowableElementsInfo = new Readium.Views.ReflowableElementInfo();

		// --- START from base
		this.zoomer = options.zoomer;
        this.pages = new Readium.Models.ReadiumPagination({model : this.model});
        this.mediaOverlayController = this.model.get("media_overlay_controller");
        this.mediaOverlayController.setPages(this.pages);
        this.mediaOverlayController.setView(this);

        this.bindingTemplate = Handlebars.templates.binding_template;
		this.page_template = Handlebars.templates.reflowing_template;

		// if this book does right to left pagination we need to set the
		// offset on the right
		if(this.model.epub.get("page_prog_dir") === "rtl") {
			this.offset_dir = "right";
		}
		else {
			this.offset_dir = "left";
		}

		this.model.on("change:font_size", this.setFontSizeHandler, this);
		this.model.on("change:two_up", this.pages.toggleTwoUp, this.pages);
		this.pages.on("change:current_page", this.pageChangeHandler, this);
		this.mediaOverlayController.on("change:mo_text_id", this.highlightText, this);
        this.mediaOverlayController.on("change:active_mo", this.indicateMoIsPlaying, this);
		this.model.on("change:toc_visible", this.windowSizeChangeHandler, this);
		this.model.on("repagination_event", this.windowSizeChangeHandler, this);
		this.model.on("change:current_theme", this.injectThemeHandler, this);
		this.model.on("change:two_up", this.setUpModeHandler, this);
		this.model.on("change:two_up", this.adjustIframeColumnsHandler, this);
		this.model.on("change:current_margin", this.marginCallback, this);
		this.model.on("save_position", this.savePosition, this);
	},

	adjustIframeColumnsHandler : function () {

		var pageInfo = this.reflowableLayout.adjustIframeColumns(
				this.offset_dir,
				this.$("#readium-flowing-content"),
				this.getBody(),
				this.model.get("two_up"),
				this,
				this.model.getCurrentSection().firstPageOffset(),
				this.pages.get("current_page"),
				this.model.epub.get("page_prog_dir"),
				this.model.get("current_margin"));

		this.pages.set("num_pages", pageInfo[0]);
		this.goToPage(pageInfo[1]);
	},

	setUpModeHandler : function () {

		this.reflowableLayout.setUpMode(this.el, this.model.get("two_up"));
	},

	injectThemeHandler : function () {

		this.reflowableLayout.injectTheme(this.model.get("current_theme"), this.getBody());
	},

	setFontSizeHandler : function () {

		var numPages = this.reflowableLayout.setFontSize(this.model.get("font_size"), this.getBody(), this.model.get("two_up"));
		this.pages.set("num_pages", numPages);
	},

	render: function(goToLastPage, hashFragmentId) {
		var that = this;
		var json = this.model.getCurrentSection().toJSON();

		// make everything invisible to prevent flicker
		this.reflowableLayout.setUpMode(this.el, this.model.get("two_up"));
		this.$('#container').html( this.page_template(json) );
		
		this.$('#readium-flowing-content').on("load", function(e) {
			// Important: Firefox doesn't recognize e.srcElement, so this needs to be checked for whenever it's required.
			if (!e.srcElement) e.srcElement = this;

			var lastPageElementId = that.reflowableLayout.injectCFIElements(document, that.model.get("epubCFIs"), that.model.get("spine_position"));
			var pageInfo = that.reflowableLayout.adjustIframeColumns(
				that.offset_dir,
				that.$("#readium-flowing-content"),
				that.getBody(),
				that.model.get("two_up"),
				that,
				that.model.getCurrentSection().firstPageOffset(),
				that.pages.get("current_page"),
				that.model.epub.get("page_prog_dir"),
				that.model.get("current_margin"));

			that.pages.set("num_pages", pageInfo[0]);
			that.goToPage(pageInfo[1]);

			that.reflowableLayout.iframeLoadCallback(
				e, 
				this, 
				that.model.epub.getPackageDocument(),
				that.bindingTemplate,
				that.pages.goLeft,
				that.pages.goRight,
				that.linkClickHandler,
				that );
			that.mediaOverlayController.pagesLoaded();
			that.reflowableLayout.setFontSize(that.model.get("font_size"), that.getBody(), that.model.get("two_up"));
			that.reflowableLayout.injectTheme(that.model.get("current_theme"), that.getBody());
			that.pages.set("num_pages", that.reflowableLayout.calcNumPages(that.getBody(), that.model.get("two_up")));
			that.applyKeydownHandler();

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
    
    // override
    // Used: PaginationViewBase
	indicateMoIsPlaying: function () {
		var moHelper = new Readium.Models.MediaOverlayViewHelper({epubController : this.model});
		moHelper.renderReflowableMoPlaying(
			this.model.get("current_theme"),
			this.mediaOverlayController.get("active_mo"),
			this
		);
	},

    // override
    // Used: PaginationViewBase
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
	// Used: epubController, reflowablePagination
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
				this.offset_dir, 
				this.reflowableLayout.page_width, 
				this.reflowableLayout.gap_width,
				this.getBody());
            if (page > 0) {
                this.pages.goToPage(page);	
			}
		}
		// else false alarm no work to do
	},

	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" HELPERS                                                                   //
	// ------------------------------------------------------------------------------------ //

	// Description: Sometimes these views hang around in memory before
	//   the GC's get them. we need to remove all of the handlers
	//   that were registered on the model
	destruct: function() {
		
		this.pages.off("change:current_page", this.pageChangeHandler);
		this.model.off("change:toc_visible", this.windowSizeChangeHandler);
		this.model.off("repagination_event", this.windowSizeChangeHandler);
		this.model.off("change:current_theme", this.windowSizeChangeHandler);
		this.model.off("change:two_up", this.setUpMode);
		this.model.off("change:two_up", this.adjustIframeColumnsHandler);
		this.model.off("change:current_margin", this.marginCallback);
		this.pages.off("change:current_page", this.showCurrentPages);
        this.model.off("change:font_size", this.setFontSizeHandler);
        this.mediaOverlayController.off("change:mo_text_id", this.highlightText);
        this.mediaOverlayController.off("change:active_mo", this.indicateMoIsPlaying);
        this.reflowableLayout.resetEl(document, this, this.zoomer);
	},

	// Description: Handles clicks of anchor tags by navigating to
	//   the proper location in the epub spine, or opening
	//   a new window for external links
	// Stays here
	// Used: PaginationViewBase
	linkClickHandler: function (e) {
		e.preventDefault();

		var href;

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

	// Rationale: For the purpose of looking up EPUB resources in the package document manifest, Readium expects that 
	//   all relative links be specified as relative to the package document URI (or absolute references). However, it is 
	//   valid XHTML for a link to another resource in the EPUB to be specfied relative to the current document's
	//   path, rather than to the package document. As such, URIs passed to Readium must be either absolute references or 
	//   relative to the package document. This method resolves URIs to conform to this condition. 
	// REFACTORING CANDIDATE: This could be moved into some sort of utility method uri resolution
	// Used: this
	resolveRelativeURI: function (rel_uri) {
		var relativeURI = new URI(rel_uri);

		// Get URI for resource currently loaded in the view's iframe
		var iframeDocURI = new URI($("#readium-flowing-content").attr("src"));

		return relativeURI.resolve(iframeDocURI).toString();
	},

	// Stays here
	// Used: this
	// REFACTORING CANDIDATE: No need to make that call through the epubController

	// Actually, the handler is being applied here, so it should be moved to layout logic
	applyKeydownHandler : function () {

		var that = this;

		this.$("#readium-flowing-content").contents().keydown(function (e) {

			if (e.which == 39) {
				that.model.paginator.v.pages.goRight();
			}
							
			if (e.which == 37) {
				that.model.paginator.v.pages.goLeft();
			}
		});
	},

	// REFACTORING CANDIDATE: I think this is actually part of the public interface
	// Move some of this to layout math
	// Used: this
	goToPage: function(page) {
        // check to make sure we're not already on that page
        if (this.model.get("current_page") != undefined && this.model.get("current_page").indexOf(page) != -1) {
            return;
        }
		var offset = this.calcPageOffset(page).toString() + "px";
		$(this.getBody()).css(this.offset_dir, "-" + offset);
		this.showContent();
        
        if (this.model.get("two_up") == false || 
            (this.model.get("two_up") && page % 2 === 1)) {
                // when we change the page, we have to tell MO to update its position
                this.mediaOverlayController.reflowPageChanged();
        }
	},

	// Save position in epub
	// Refactor this, probably stays here, although much else will move into finding visible elements
	// Used: this
	savePosition : function () {

		var $visibleTextNode;
		var existingCFI;
		var lastPageMarkerExists = false;
		var characterOffset;
		var contentDocumentIdref;
		var packageDocument;
		var generatedCFI;

		// Get first visible element with a text node 
		$visibleTextNode = this.reflowableElementsInfo.findVisibleTextNode(this.getBody(), document, this.model.get("two_up"));

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

		characterOffset = this.reflowableElementsInfo.findVisibleCharacterOffset($visibleTextNode, document);

		// Get the content document idref
		contentDocumentIdref = this.model.getCurrentSection().get("idref");

		// Get the package document
		// REFACTORING CANDIDATE: This is a temporary approach for retrieving a document representation of the 
		//   package document. Probably best that the package model be able to return this representation of itself.
        $.ajax({

            type: "GET",
            url: this.model.epub.get("root_url"),
            dataType: "xml",
            async: false,
            success: function (response) {

                packageDocument = response;
            }
        });

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

	// This is now part of the public interface
	// Description: helper method to get the a reference to the documentElement
	// of the document in this strategy's iFrame.
	// TODO: this is a bad name for this function
	// Used: this, MediaOverlayViewHelper
	getBody: function() {
		return this.$('#readium-flowing-content').contents()[0].documentElement;
	},

	// Used: this
	// Layout logic helper, mostly
	hideContent: function() {
		$("#flowing-wrapper").css("opacity", "0");
	},

	// Used: this
	// Layout logic helper, mostly
	showContent: function() {
		$("#flowing-wrapper").css("opacity", "1");
	},

	// Layout logic 
	// Used: this
	calcPageOffset: function(page_num) {
		return (page_num - 1) * (this.reflowableLayout.page_width + this.reflowableLayout.gap_width);
	},

    // Stays here although it needs to be refactored; logic is duplicated in this 
    // Used: this
	pageChangeHandler: function() {
        var that = this;
		this.hideContent();
		setTimeout(function () {

			var pageNumToGoTo = that.reflowableLayout.accountForOffset(
				document, 
				that.model.get("two_up"),
				that.model.getCurrentSection().firstPageOffset(),
				that.pages.get("current_page"),
				that.model.epub.get("page_prog_dir"));
			that.goToPage(pageNumToGoTo);
			that.savePosition();

		}, 150);
	},

	windowSizeChangeHandler: function() {
		var pageInfo = this.reflowableLayout.adjustIframeColumns(
				this.offset_dir,
				this.$("#readium-flowing-content"),
				this.getBody(),
				this.model.get("two_up"),
				this,
				this.model.getCurrentSection().firstPageOffset(),
				this.pages.get("current_page"),
				this.model.epub.get("page_prog_dir"),
				this.model.get("current_margin")
				);

		this.pages.set("num_pages", pageInfo[0]);
		this.goToPage(pageInfo[1]);
		
		// Make sure we return to the correct position in the epub (This also requires clearing the hash fragment) on resize.
		this.goToHashFragment(this.model.get("hash_fragment"));
	},
    
    // Stays here
    // Used: this
	marginCallback: function() {
		var pageInfo = this.reflowableLayout.adjustIframeColumns(
				this.offset_dir,
				this.$("#readium-flowing-content"),
				this.getBody(),
				this.model.get("two_up"),
				this,
				this.model.getCurrentSection().firstPageOffset(),
				this.pages.get("current_page"),
				this.model.epub.get("page_prog_dir"),
				this.model.get("current_margin")
				);

		this.pages.set("num_pages", pageInfo[0]);
		this.goToPage(pageInfo[1]);
	}
});