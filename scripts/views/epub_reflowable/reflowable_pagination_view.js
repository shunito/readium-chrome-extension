
Readium.Views.ReflowablePaginationView = Backbone.View.extend({

	initialize : function (options) {

		this.viewerModel = options.viewerModel;
		this.spineItemModel = options.spineItemModel;

		this.epubController = this.model;

		// Initalize delegates and other models
		this.reflowableLayout = new Readium.Views.ReflowableLayout();
		this.reflowablePaginator = new Readium.Views.ReflowablePaginator();
		this.reflowableElementsInfo = new Readium.Views.ReflowableElementInfo();
		this.pages = new Readium.Models.ReadiumReflowablePagination({model : this.epubController});
		// this.zoomer = options.zoomer;
        // this.mediaOverlayController = this.model.get("media_overlay_controller");
        // this.mediaOverlayController.setPages(this.pages);
        // this.mediaOverlayController.setView(this);

        // Initialize handlers
		// this.mediaOverlayController.on("change:mo_text_id", this.highlightText, this);
        // this.mediaOverlayController.on("change:active_mo", this.indicateMoIsPlaying, this);
		this.viewerModel.on("change:font_size", this.rePaginationHandler, this);
		this.viewerModel.on("change:two_up", this.pages.toggleTwoUp, this.pages);
		this.viewerModel.on("change:two_up", this.rePaginationHandler, this);
		this.viewerModel.on("change:current_margin", this.rePaginationHandler, this);
		this.pages.on("change:current_page", this.pageChangeHandler, this);
		this.viewerModel.on("change:toc_visible", this.windowSizeChangeHandler, this);
		this.epubController.on("repagination_event", this.windowSizeChangeHandler, this);
		this.viewerModel.on("change:current_theme", this.themeChangeHandler, this);
	},

	
	destruct : function() {
	
		// Remove all handlers so they don't hang around in memory	
		// this.mediaOverlayController.off("change:mo_text_id", this.highlightText, this);
  		// this.mediaOverlayController.off("change:active_mo", this.indicateMoIsPlaying, this);
		this.viewerModel.off("change:font_size", this.rePaginationHandler, this);
		this.viewerModel.off("change:two_up", this.pages.toggleTwoUp, this.pages);
		this.viewerModel.off("change:two_up", this.rePaginationHandler, this);
		this.viewerModel.off("change:current_margin", this.rePaginationHandler, this);
		this.pages.off("change:current_page", this.pageChangeHandler, this);
		this.viewerModel.off("change:toc_visible", this.windowSizeChangeHandler, this);
		this.epubController.off("repagination_event", this.windowSizeChangeHandler, this);
		this.viewerModel.off("change:current_theme", this.themeChangeHandler, this);

        this.reflowableLayout.resetEl(
        	this.getEpubContentDocument(), 
        	this.el, 
        	this.getSpineDivider());
        	// ,
        	// this.zoomer);
	},

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //

	render : function (goToLastPage, hashFragmentId) {

		var that = this;
		// var json = this.model.getCurrentSection().toJSON();
		var json = this.spineItemModel.toJSON();
		this.setElement( Handlebars.templates.reflowing_template(json) ); // set element as iframe 
		
		$(this.getReadiumBookViewEl()).html(this.el);

		// Wait for iframe to load EPUB content document
		$(this.getReadiumFlowingContent()).on("load", function (e) {

			var lastPageElementId = that.initializeContentDocument();

			// Rationale: The content document must be paginated in order for the subsequent "go to page" methods
			//   to have access to the number of pages in the content document.
			that.paginateContentDocument();
			// that.mediaOverlayController.pagesLoaded();

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
    
	// indicateMoIsPlaying: function () {
	// 	var moHelper = new Readium.Models.MediaOverlayViewHelper({epubController : this.model});
	// 	moHelper.renderReflowableMoPlaying(
	// 		this.model.get("current_theme"),
	// 		this.mediaOverlayController.get("active_mo"),
	// 		this
	// 	);
	// },

	// highlightText: function () {
	// 	var moHelper = new Readium.Models.MediaOverlayViewHelper({epubController : this.model});
	// 	moHelper.renderReflowableMoFragHighlight(
	// 		this.model.get("current_theme"),
	// 		this,
	// 		this.mediaOverlayController.get("mo_text_id")
	// 	);
	// },

	// Description: Find an element with this specified id and show the page that contains the element.
	goToHashFragment: function(hashFragmentId) {

		// this method is triggered in response to 
		var fragment = hashFragmentId;
		if(fragment) {
			var el = $("#" + fragment, this.getEpubContentDocument())[0];

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
				this.reflowablePaginator.page_width, 
				this.reflowablePaginator.gap_width,
				this.getEpubContentDocument());

            if (page > 0) {
                //console.log(fragment + " is on page " + page);
                this.pages.goToPage(page);	
			}
		}
		// else false alarm no work to do
	},

	// Description: Generates a CFI for an element is that is currently visible on the page. This CFI and a last-page payload
	//   is then saved for the current EPUB.
	savePosition : function () {

		var $visibleTextNode;
		var existingCFI;
		var lastPageMarkerExists = false;
		var characterOffset;
		var contentDocumentIdref;
		var packageDocument;
		var generatedCFI;

		// Get first visible element with a text node 
		$visibleTextNode = this.reflowableElementsInfo.findVisibleTextNode(
			this.getEpubContentDocument(), 
			this.viewerModel.get("two_up"),
			// REFACTORING CANDIDATE: These two properties should be stored another way. This should be 
			//   temporary.
			this.reflowablePaginator.gap_width,
			this.reflowablePaginator.page_width
			);

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

			this.epubController.addLastPageCFI(existingCFI, this.spineItemModel.get("spine_position"));
			this.epubController.save();
			return; 
		}

		characterOffset = this.reflowableElementsInfo.findVisibleCharacterOffset($visibleTextNode, this.getEpubContentDocument());

		// Get the content document idref
		contentDocumentIdref = this.spineItemModel.get("idref");

		// Get the package document
		packageDocument = this.epubController.getPackageDocumentDOM();

		// Save the position marker
		generatedCFI = EPUBcfi.Generator.generateCharacterOffsetCFI(
			$visibleTextNode[0], 
			characterOffset, 
			contentDocumentIdref, 
			packageDocument, 
			["cfi-marker", "audiError"], 
			[], 
			["MathJax_Message"]);

		this.epubController.addLastPageCFI(
			generatedCFI, 
			this.spineItemModel.get("spine_position"));

		// Save the last page marker been added
		this.epubController.save();
	},	

	// ------------------------------------------------------------------------------------ //
	//  PRIVATE GETTERS FOR VIEW                                                            //
	// ------------------------------------------------------------------------------------ //    

	getReadiumBookViewEl : function () {
		return $("#readium-book-view-el");
	},

	getFlowingWrapper : function () {
		return this.el;
	},

	getReadiumFlowingContent : function () {
		return $(this.el).children()[0];
	},

	getEpubContentDocument : function () {
		return $($($(this.el).children()[0]).contents()[0]).children()[0];
	},

	getSpineDivider : function () {
		return $(".reflowing-spine-divider")[0];
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
			this.epubController.goToHref(href);
		}
	},	

	// REFACTORING CANDIDATE: Don't really need to repaginate, could just show that page!
	pageChangeHandler: function() {

        var that = this;
		this.hideContent();
		setTimeout(function () {

			that.showPage(that.pages.get("current_page")[0]);
			that.showContent();

		}, 150);
	},

	windowSizeChangeHandler: function() {

		this.paginateContentDocument();
		
		// Make sure we return to the correct position in the epub (This also requires clearing the hash fragment) on resize.
		this.goToHashFragment(this.epubController.get("hash_fragment"));
	},
    
	rePaginationHandler: function() {

		this.paginateContentDocument();
	},

	themeChangeHandler : function () {

		this.reflowableLayout.injectTheme(
			this.viewerModel.get("current_theme"), 
			this.getEpubContentDocument(), 
			this.getFlowingWrapper());
	},

	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" HELPERS AND UTILITY METHODS                                               //
	// ------------------------------------------------------------------------------------ //

	// Rationale: This method delegates the pagination of a content document to the reflowable layout model
	paginateContentDocument : function () {

		var pageInfo = this.reflowablePaginator.paginateContentDocument(
			this.getReadiumBookViewEl(),
			this.getSpineDivider(),
			this.viewerModel.get("two_up"),
			this.offsetDirection(),
			this.getEpubContentDocument(),
			this.getReadiumFlowingContent(),
			this.getFlowingWrapper(),
			this.spineItemModel.firstPageOffset(),
			this.pages.get("current_page"),
			this.spineItemModel.get("page_prog_dir"),
			this.viewerModel.get("current_margin"),
			this.viewerModel.get("font_size")
			);

		this.pages.set("num_pages", pageInfo[0]);
		this.showPage(pageInfo[1]);
		this.savePosition();
	},

	initializeContentDocument : function () {

		var elementId = this.reflowableLayout.initializeContentDocument(
			this.getEpubContentDocument(), 
			this.epubController.get("epubCFIs"), 
			this.spineItemModel.get("spine_position"), 
			this.getReadiumFlowingContent(), 
			this.epubController.packageDocument, 
			Handlebars.templates.bindingTemplate, 
			this.linkClickHandler, 
			this, 
			this.viewerModel.get("current_theme"), 
			this.getFlowingWrapper(), 
			this.getReadiumFlowingContent(), 
			this.keydownHandler
			);

		return elementId;
	},

	showPage: function(page) {

		var offset = this.calcPageOffset(page).toString() + "px";
		$(this.getEpubContentDocument()).css(this.offsetDirection(), "-" + offset);
		this.showContent();
        
        if (this.viewerModel.get("two_up") == false || 
            (this.viewerModel.get("two_up") && page % 2 === 1)) {
                // when we change the page, we have to tell MO to update its position
                // this.mediaOverlayController.reflowPageChanged();
        }
	},
	
	// Rationale: For the purpose of looking up EPUB resources in the package document manifest, Readium expects that 
	//   all relative links be specified as relative to the package document URI (or absolute references). However, it is 
	//   valid XHTML for a link to another resource in the EPUB to be specfied relative to the current document's
	//   path, rathƒer than to the package document. As such, URIs passed to Readium must be either absolute references or 
	//   relative to the package document. This method resolves URIs to conform to this condition. 
	resolveRelativeURI : function (rel_uri) {
		var relativeURI = new URI(rel_uri);

		// Get URI for resource currently loaded in the view's iframe
		var iframeDocURI = new URI($(this.getReadiumFlowingContent()).attr("src"));

		return relativeURI.resolve(iframeDocURI).toString();
	},

	hideContent : function() {
		$(this.getFlowingWrapper()).css("opacity", "0");
	},

	showContent : function() {
		$(this.getFlowingWrapper()).css("opacity", "1");
	},

	calcPageOffset : function(page_num) {
		return (page_num - 1) * (this.reflowablePaginator.page_width + this.reflowablePaginator.gap_width);
	},

	offsetDirection : function () {

		// if this book does right to left pagination we need to set the
		// offset on the right
		if (this.spineItemModel.pageProgressionDirection() === "rtl") {
			return "right";
		}
		else {
			return "left";
		}
	}
});