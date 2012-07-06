// Description: This model is the "controller" for an ePUB, managing the interaction between the 
// pagination views and the ePUB itself

Readium.Models.Ebook = Backbone.Model.extend({

	initialize: function() {

		// capture context for use in callback functions
		var that = this;

		this.epub = this.get("epub");

		// create a [`Paginator`](/docs/paginator.html) object used to initialize
		// pagination strategies for the spine items of this book
		this.paginator = new Readium.Models.Paginator({book: this});

		// Get the epub package document
		this.packageDocument = this.epub.getPackageDocument();
		
		// load the `packageDocument` from the HTML5 filesystem asynchroniously
		this.packageDocument.fetch({

			// success callback is executed once the filesSystem contents have 
			// been read and parsed
			success: function() {

				// restore the position the reader left off at from cookie storage
				var pos = that.restorePosition();
				that.set("spine_position", pos);

				// tell the paginator to start rendering spine items from the 
				// freshly restored position
				var items = that.paginator.renderSpineItems(false);
				that.set("rendered_spine_items", items);
				
				// check if a TOC is specified in the `packageDocument`
				that.epub.set("has_toc", ( !!that.packageDocument.getTocItem() ) );
			}
		});

		// if content reflows and the number of pages in the section changes
		// we need to adjust the the current page
		this.on("change:num_pages", this.adjustCurrentPage, this);

		// `change:spine_position` is triggered whenver the reader turns pages
		// accross a `spine_item` boundary. We need to cache thier new position
		// and 
		this.on("change:spine_position", this.savePosition, this);

		// If a new fixed layout 
		this.on("change:spine_position", this.setMetaSize, this);
	},

	save: function(attrs, options) {
		// TODO: this should be done properly with a backbone sync
		var ops = {
			success: function() {}
		}
		_.extend(ops,options);
		var that = this;
		this.epub.set("updated_at", new Date());
		Lawnchair(function() {
			this.save(that.toJSON(), ops.success);
		});
	},

	defaults: {
		"font_size": 10,
    	"current_page": [1],
    	"num_pages": 0,
    	"two_up": false,
    	"full_screen": false,
    	"toolbar_visible": true,
    	"toc_visible": false,
    	"can_two_up": true,
    	"rendered_spine_items": [],
    	"current_theme": "default-theme",
    	"current_margin": 3
    	//"spine_position": 0
  	},

  	toJSON: function() {

  		// only save attrs that should be persisted:
  		return {
			"current_theme": this.get("current_theme"),
			"updated_at": this.get("updated_at"),
			"current_theme": this.get("current_theme"),
			"current_margin": this.get("current_margin"),
			"font_size": this.get("font_size"),
			"two_up": this.get("two_up"),
			"font_size": this.get("font_size"),
			"current_page": this.get("current_page")
		};
	},

	// Description: This method determines which page numbers to display when switching
	// between a single page and side-by-side page views and vice versa.
	toggleTwoUp: function() {

		if(this.get("can_two_up")) {
			var twoUp = this.get("two_up");
			var displayed = this.get("current_page");
			var newPages = [];

			// Two pages are currently displayed; find the single page number to display
			if(twoUp) {
				if (displayed[0] === 0) {
					newPages[0] = 1;
				} else {
					newPages[0] = displayed[0];
				}
			}
			// A single reflowable page is currently displayed; find two pages to display
			else if(!this.getCurrentSection().isFixedLayout()) {
				if(displayed[0] % 2 === 1) {
					newPages[0] = displayed[0];
					newPages[1] = displayed[0] + 1;
				}
				else {
					newPages[0] = displayed[0] - 1;
					newPages[1] = displayed[0];
				}
			}
			// A single fixed layout page is displayed
			else {

				// page progression is right-to-left
				if (this.epub.get("page_prog_dir") === "rtl") {

					if (this.displayedPageIsLeft(displayed[0])) {
						newPages[0] = displayed[0] - 1;
						newPages[1] = displayed[0];
					}
					else if (this.displayedPageIsRight(displayed[0])) {
						newPages[0] = displayed[0];
						newPages[1] = displayed[0] + 1;
					}

					// TODO: Handle center pages
				}
				// page progression is left-to-right
				else {

					if (this.displayedPageIsLeft(displayed[0])) {
						newPages[0] = displayed[0];
						newPages[1] = displayed[0] + 1;
					}
					else if (this.displayedPageIsRight(displayed[0])) {
						newPages[0] = displayed[0] - 1;
						newPages[1] = displayed[0];
					}

					// TODO: Handle center pages
				}
			}

			this.set({two_up: !twoUp, current_page: newPages});
		}	
	},

	// Description: The displayedPageIs** methods determine if the page is right, left or center.
	//
	// Note: This is not an ideal approach, as we're pulling properties directly out of the dom, rather than
	// out of our models. The rationale is that as of Readium 0.4.1, the page-spread-* value
	// is not maintained in the model hierarchy accessible from an ebook object. An alternative
	// would be to infer the left/right/center value from model attributes on ebook, or other objects in
	// ebook's object hierarchy. However, this would duplicate the logic that exists elsewhere for determining right/left/center
	// for a page, which is probably worse than pulling out of the dom. This approach also avoids having to convert
	// from the page number (based on what is rendered on the screen) to spine index.   
	displayedPageIsRight: function (displayedPageNum) {

		return $("#page-" + displayedPageNum).hasClass("right_page") ? true : false;
	},

	displayedPageIsLeft: function (displayedPageNum) {

		return $("#page-" + displayedPageNum).hasClass("left_page") ? true : false;
	},

	displayedPageIsCenter: function (displayedPageNum) {

		return $("#page-" + displayedPageNum).hasClass("center_page") ? true : false;
	},

	toggleFullScreen: function() {
		var fullScreen = this.get("full_screen");
		this.set({full_screen: !fullScreen});
	},

	increaseFont: function() {
		var size = this.get("font_size");
		this.set({font_size: size + 1})
	},

	decreaseFont: function() {
		var size = this.get("font_size");
		this.set({font_size: size - 1})
	},

	toggleToc: function() {
		var vis = this.get("toc_visible");
		this.set("toc_visible", !vis);
	},

	// turn pages in the rightward direction
	// ie progression direction is dependent on 
	// page progression dir
	goRight: function() {
		if (this.epub.get("page_prog_dir") === "rtl") {
			this.prevPage();
		}
		else {
			this.nextPage();	
		}
	},

	// turn pages in the leftward direction
	// ie progression direction is dependent on 
	// page progression dir
	goLeft: function() {
		if (this.epub.get("page_prog_dir") === "rtl") {
			this.nextPage();
		}
		else {
			this.prevPage();	
		}
	},
	
	prevPage: function() {
		var curr_pg = this.get("current_page");
		var lastPage = curr_pg[0] - 1;

		// For fixed layout pubs, check if the last page is displayed; if so, end navigation.
		// TODO: This is a bit of a hack, but the this entire model underlying the part of the pub that 
		// is displayed on the screen probably needs to change. 
		if (this.getCurrentSection().isFixedLayout()) {

			if (this.get("two_up") && curr_pg[0] === 1) {

				return;
			}
		}

		if(curr_pg[0] <= 1) {
			this.goToPrevSection();
		}
		// Single page navigation
		else if(!this.get("two_up")){
			this.set("current_page", [lastPage]);

			// Reset spine position
			if(this.get("rendered_spine_items").length > 1) {
				var pos = this.get("rendered_spine_items")[lastPage - 1];
				this.set("spine_position", pos);
			}
		}
		// Move to previous page with two side-by-side pages
		else {

			this.setCurrentPagesForPrevPage(lastPage);

			// Reset spine position
			if(this.get("rendered_spine_items").length > 1) {
				var ind = (lastPage > 1 ? lastPage - 2 : 0);
				var pos = this.get("rendered_spine_items")[ind];
				this.set("spine_position", pos);
			}
		}
	},

	setCurrentPagesForPrevPage: function (prevPageNumber) {

		// If fixed layout
		if (this.getCurrentSection().isFixedLayout()) {

			if (this.epub.get("page_prog_dir") === "rtl") {

				// If the first page is a left page in rtl progression, only one page 
				// can be displayed, even in two-up mode
				if (this.displayedPageIsLeft(prevPageNumber) && 
					this.displayedPageIsRight(prevPageNumber - 1)) {

					this.set("current_page", [prevPageNumber - 1, prevPageNumber]);
				}
				else {

					this.set("current_page", [prevPageNumber]);
				}
			}
			// Left-to-right progresion
			else {

				if (this.displayedPageIsRight(prevPageNumber) &&
					this.displayedPageIsLeft(prevPageNumber - 1)) {

					this.set("current_page", [prevPageNumber - 1, prevPageNumber]);
				}
				else {

					this.set("current_page", [prevPageNumber]);
				}
			}
		}
		// A reflowable text
		else {

			this.set("current_page", [prevPageNumber - 1, prevPageNumber]);
		}
	},
	
	nextPage: function() {
		var curr_pg = this.get("current_page");
		var firstPage = curr_pg[curr_pg.length - 1] + 1;

		// For fixed layout pubs, check if the last page is displayed; if so, end navigation
		if (this.getCurrentSection().isFixedLayout()) {

			if (this.get("two_up") && 
				(curr_pg[0] === this.get("rendered_spine_items").length || 
				 curr_pg[1] === this.get("rendered_spine_items").length)
				) {

				return;
			}
		}

		if (curr_pg[curr_pg.length - 1] >= this.get("num_pages")) {

			this.goToNextSection();
		}
		else if (!this.get("two_up")) {

			this.set("current_page", [firstPage]);

			// Reset the spine position
			if (this.get("rendered_spine_items").length > 1) {

				var pos = this.get("rendered_spine_items")[firstPage - 1];
				this.set("spine_position", pos);
			}
		}
		// Two pages are being displayed
		else {

			this.setCurrentPagesForNextPage(firstPage);

			// Reset the spine position
			if (this.get("rendered_spine_items").length > 1) {

				var pos = this.get("rendered_spine_items")[firstPage - 1];
				this.set("spine_position", pos);
			}
		}
	},

	setCurrentPagesForNextPage: function (nextPageNumber) {

		// If fixed layout
		if (this.getCurrentSection().isFixedLayout()) {

			if (this.epub.get("page_prog_dir") === "rtl") {

				// If the first page is a left page in rtl progression, only one page 
				// can be displayed, even in two-up mode
				if (this.displayedPageIsRight(nextPageNumber) &&
					this.displayedPageIsLeft(nextPageNumber + 1)) {

					this.set("current_page", [nextPageNumber, nextPageNumber + 1]);
				}
				else {

					this.set("current_page", [nextPageNumber]);
				}
			}
			else {

				if (this.displayedPageIsLeft(nextPageNumber) && 
					this.displayedPageIsRight(nextPageNumber + 1)) {

					this.set("current_page", [nextPageNumber, nextPageNumber + 1]);
				}
				else {

					this.set("current_page", [nextPageNumber]);
				}
			}
		}
		// Reflowable section
		else {

			this.set("current_page", [nextPageNumber, nextPageNumber + 1]);
		}
	},

	goToLastPage: function() {
		var page = this.get("num_pages");
		this.goToPage(page);
	},

	// is the param pageNumber currenly displayed
	isPageVisible: function(pageNumber) {
		return this.get("current_page").indexOf(pageNumber) > -1;
	},

	goToPage: function(pageNumber) {

		// if the we are already at that page then there is no work to do
		// break out eary to prevent page change events
		if(this.isPageVisible(pageNumber)) {
			return;
		}

		// in two up mode we need to keep track of what side
		// of the spine the odd pages go on
		if(this.get("two_up")) {
			
			// Fixed layout page
			if(this.getCurrentSection().isFixedLayout()) {

				if (this.epub.get("page_prog_dir") === "rtl") {

					if (this.displayedPageIsLeft(pageNumber)) {

						this.set("current_page", [pageNumber - 1, pageNumber]);	
					}
					else if (this.displayedPageIsRight(pageNumber)) {

						this.set("current_page", [pageNumber, pageNumber + 1]);
					}

					// TODO: Handle center pages
				}
				// Left-to-right page progression
				else {

					if (this.displayedPageIsLeft(pageNumber)) {

						this.set("current_page", [pageNumber, pageNumber + 1]);	
					}
					else if (this.displayedPageIsRight(pageNumber)) {

						this.set("current_page", [pageNumber - 1, pageNumber]);
					}

					// TODO: Handle center pages
				}
			}
			// This is a reflowable page
			else {
				// in reflowable format, we want this config always:
				// ODD_PAGE |spine| EVEN_PAGE
				if(pageNumber % 2 === 1) {
					this.set("current_page", [pageNumber, pageNumber + 1]);	
				}
				else {
					this.set("current_page", [pageNumber - 1, pageNumber]);
				}	
			}
			
		}
		else {
			this.set("current_page", [pageNumber])
		}
	},

	restorePosition: function() {
		var pos = Readium.Utils.getCookie(this.epub.get("key"));
		return parseInt(pos, 10) || 0;
	},

	savePosition: function() {
		Readium.Utils.setCookie(this.epub.get("key"), this.get("spine_position"), 365);
	},

	resolvePath: function(path) {
		return this.packageDocument.resolvePath(path);
	},

	adjustCurrentPage: function() {
		var cp = this.get("current_page");
		var num = this.get("num_pages");
		var two_up = this.get("two_up");
		if(cp[cp.length - 1] > num) {
			this.goToLastPage();
		}
	},	
	
	goToNextSection: function() {
		// Is this check even necessary?
		// I think package doc validations takes care of it
		if(this.hasNextSection() ) {
			var pos = this.get("spine_position");
			this.setSpinePos(pos + 1);
		}
	},
	
	goToPrevSection: function() {
		// Is this check even necessary?
		// I think package doc validations takes care of it
		if(this.hasPrevSection() ) {
			var pos = this.get("spine_position");
			this.setSpinePosBackwards(pos - 1);	
		}
	},

	hasNextSection: function() {
		return this.get("spine_position") < (this.packageDocument.spineLength() - 1);
	},

	hasPrevSection: function() {
		return this.get("spine_position") > 0;
	},

	setSpinePos: function(pos) {
		if(pos < 0 || pos >= this.packageDocument.spineLength()) {
			// invalid position
			return;
		}
		var spineItems = this.get("rendered_spine_items");
		this.set("spine_position", pos);
		if(spineItems.indexOf(pos) >= 0) {
			// the spine item is already on the page
			if(spineItems.length > 1) {
				// we are in fixed layout state, one spine item per page
				this.goToPage(spineItems.indexOf(pos) + 1);
			}
			// else nothing to do, because the section is already rendered out
			
		}
		else {
			// the section is not rendered out, need to do so
			var items = this.paginator.renderSpineItems(false);
			this.set("rendered_spine_items", items);	
		}
		
	},

	setSpinePosBackwards: function(pos) {
		if(pos < 0 || pos >= this.packageDocument.spineLength()) {
			// invalid position
			return;
		}

		this.set("spine_position", pos);
		if(this.get("rendered_spine_items").indexOf(pos) >= 0) {
			// the spine item is already on the page, nothing to do
			return;
		}

		var items = this.paginator.renderSpineItems(true);
		this.set("rendered_spine_items", items);
	},

	goToHref: function(href) {
		// URL's with hash fragments require special treatment, so
		// first thing is to split off the hash frag from the rest
		// of the url:
		var splitUrl = href.match(/([^#]*)(?:#(.*))?/);

		// handle the base url first:
		if(splitUrl[1]) {
			var spine_pos = this.packageDocument.spineIndexFromHref(splitUrl[1]);
			this.setSpinePos(spine_pos);
		}

		// now try to handle the fragment if there was one,
		if(splitUrl[2]) {
			// just set observable property to broadcast event
			// to anyone who cares
			this.set({hash_fragment: splitUrl[2]});
		}
	},

	getToc: function() {
		var item = this.packageDocument.getTocItem();
		if(!item) {
			return null;
		}
		else {
			var that = this;
			return Readium.Models.Toc.getToc(item, {
				file_path: that.resolvePath(item.get("href")),
				book: that
			});
		}
	},

	setMetaSize: function() {

		if(this.meta_section) {
			this.meta_section.off("change:meta_height", this.setMetaSize);
		}
		this.meta_section = this.getCurrentSection();
		if(this.meta_section.get("meta_height")) {
			this.set("meta_size", {
				width: this.meta_section.get("meta_width"),
				height: this.meta_section.get("meta_height")
			});
		}
		this.meta_section.on("change:meta_height", this.setMetaSize, this);
	},

	// when the spine position changes we need to update the
	// state of this, this involes setting attributes that reflect
	// the current section's url and content etc, and then we need
	// to persist the position in a cookie
	spinePositionChangedHandler: function() {
		var that = this;
		var sect = this.getCurrentSection();
		var path = sect.get("href");
		var url = this.packageDocument.resolveUri(path);;
		path = this.resolvePath(path);
		this.set("current_section_url", url);

		Readium.FileSystemApi(function(api) {

			api.readTextFile(path, function(result) {
				that.set( {current_content: result} );
			}, function() {
				console.log("Failed to load file: " + path);
			})
		});
		
		// save the position
		this.savePosition();
	},

	// Info: "Section" actually refers to a spine item
	getCurrentSection: function(offset) {
		if(!offset) {
			offset = 0;
		}
		var spine_pos = this.get("spine_position") + offset;
		return this.packageDocument.getSpineItem(spine_pos);
	},

	playMo: function(forceFromStart) {
		// there is way too much code in this method that does
		// does not belong here. TODO: Clean up
		var mo = this.getCurrentSection().getMediaOverlay();
		if(mo) {
			this.set("mo_playing", mo);
			var that = this;
			mo.on("change:current_text_document_url", function () {
                that.goToHref(mo.get("current_text_document_url"));
			});
			mo.on("change:current_text_element_id", function () {
				var frag = mo.get("current_text_element_id")
				that.set("hash_fragment", frag);
				that.set("current_mo_frag", frag);
			});
            mo.on("change:is_document_done", function() {
                that.pauseMo();
                // advance the spine position
                if (that.hasNextSection()) {
                    that.goToNextSection();
                    that.playMo(true);
                }
            });
            if (mo.get("has_started_playback") && forceFromStart == false) {
                mo.resume();
            }
            else {
                mo.startPlayback(null);
            }
		}
		else {
			alert("Sorry, the current EPUB does not contain a media overlay for this content");
		}
	},

	pauseMo: function() {
		var mo = this.get("mo_playing");
		if(mo) {

			// mo.off() and mo.pause() seem like they should be in the same call
			mo.off();
			mo.pause();
			this.set("mo_playing", null);
		}
	},

	// is this book set to fixed layout at the meta-data level
	// TODO: This is only passing through this data to avoid breaking code in viewer.js. Eventually
	// this should probably be removed. 
	isFixedLayout: function() {
		return this.epub.isFixedLayout();
	}
});
