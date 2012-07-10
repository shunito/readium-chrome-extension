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

		// Instantiate an object to decide what to display
		this.pageNumberDisplayLogic = new Readium.Models.PageNumberDisplayLogic();
		
		// TODO: this might have to change: Should this model load the package document or epub_state??
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
				that.set("has_toc", ( !!that.packageDocument.getTocItem() ) );
			}
		});

		// if content reflows and the number of pages in the section changes
		// we need to adjust the the current page
		this.on("change:num_pages", this.adjustCurrentPage, this);

		// `change:spine_position` is triggered whenver the reader turns pages
		// accross a `spine_item` boundary. We need to cache thier new position
		// and 
		this.on("change:spine_position", this.savePosition, this);

		// If we encounter a new fixed layout section, we need to parse the 
		// `<meta name="viewport">` to determine the size of the iframe
		this.on("change:spine_position", this.setMetaSize, this);
	},

	save: function(attrs, options) {
		// TODO: this should be done properly with a backbone sync
		var ops = {
			success: function() {}
		}
		_.extend(ops,options);
		var that = this;

		// Set attributes required to persist Readium info
		this.set("updated_at", new Date());
		this.set("key", this.epub.get("key") + "_epubViewProperties");

		// Save
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

  	// serialize this models state to `JSON` so that it can
  	// be persisted and restored
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
			"current_page": this.get("current_page"),
			"key": this.get("key")
		};
	},

	// Description: This method determines which page numbers to display when switching
	// between a single page and side-by-side page views and vice versa.
	toggleTwoUp: function() {

		if(this.get("can_two_up")) {

			var newPages = this.pageNumberDisplayLogic.getPageNumbersForTwoUp (
				this.get("two_up"), 
				this.get("current_page"),
				this.epub.get("page_prog_dir"),
				this.epub.get("isFixedLayout")
				);

			this.set({two_up: !this.get("two_up"), current_page: newPages});
		}	
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

			var pagesToDisplay = this.pageNumberDisplayLogic.getPrevPageNumsToDisplay(
								lastPage,
								this.getCurrentSection().isFixedLayout(),
								this.epub.get("page_prog_dir")
								);
		this.set("current_page", pagesToDisplay);

			// Reset spine position
			if(this.get("rendered_spine_items").length > 1) {
				var ind = (lastPage > 1 ? lastPage - 2 : 0);
				var pos = this.get("rendered_spine_items")[ind];
				this.set("spine_position", pos);
			}
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

			var pagesToDisplay = this.pageNumberDisplayLogic.getNextPageNumsToDisplay(
								firstPage,
								this.getCurrentSection().isFixedLayout(),
								this.epub.get("page_prog_dir")
								);
			this.set("current_page", pagesToDisplay);

			// Reset the spine position
			if (this.get("rendered_spine_items").length > 1) {

				var pos = this.get("rendered_spine_items")[firstPage - 1];
				this.set("spine_position", pos);
			}
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

	goToPage: function(gotoPageNumber) {

		// if the we are already at that page then there is no work to do
		// break out eary to prevent page change events
		if (this.isPageVisible(gotoPageNumber)) {
			return;
		}

		var pagesToGoto = this.pageNumberDisplayLogic.getGotoPageNumsToDisplay(
							this.get("two_up"),
							this.getCurrentSection().isFixedLayout(),
							this.get("page_prog_dir"),
							gotoPageNumber
							);
		this.set("current_page", pagesToGoto);
	},

	// TODO, which key should be used here? the epub or the viewer properties key? 
	restorePosition: function() {
		var pos = Readium.Utils.getCookie(this.epub.get("key"));
		return parseInt(pos, 10) || 0;
	},

	// TODO, which key should be used here? the epub or the viewer properties key? 
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
