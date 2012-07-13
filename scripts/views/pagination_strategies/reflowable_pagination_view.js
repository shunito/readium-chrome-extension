
Readium.Views.ReflowablePaginationView = Readium.Views.PaginationViewBase.extend({

	initialize: function() {
		// call the super ctor
		Readium.Views.PaginationViewBase.prototype.initialize.call(this);
		this.page_template = _.template( $('#reflowing-template').html() );

		// make sure we have proper vendor prefixed props for when we need them
		this.stashModernizrPrefixedProps();

		// if this book does right to left pagination we need to set the
		// offset on the right
		if(this.model.get("page_prog_dir") === "rtl") {
			this.offset_dir = "right";
		}
		else {
			this.offset_dir = "left";
		}

		this.model.on("change:current_page", this.pageChangeHandler, this);
		this.model.on("change:toc_visible", this.windowSizeChangeHandler, this);
		this.model.on("repagination_event", this.windowSizeChangeHandler, this);
		this.model.on("change:current_theme", this.injectTheme, this);
		this.model.on("change:two_up", this.setUpMode, this);
		this.model.on("change:two_up", this.adjustIframeColumns, this);
		this.model.on("change:current_margin", this.marginCallback, this);
		this.model.on("change:mo_playing", this.renderMoPlaying, this);
		this.model.on("change:current_mo_frag", this.renderMoFragHighlight, this);

	},

	// we are using experimental styles so we need to 
	// use modernizr to generate prefixes
	stashModernizrPrefixedProps: function() {
		var cssIfy = function(str) {
			return str.replace(/([A-Z])/g, function(str,m1){ 
				return '-' + m1.toLowerCase(); 
			}).replace(/^ms-/,'-ms-');
		};

		// ask modernizr for the vendor prefixed version
		this.columAxis =  Modernizr.prefixed('columnAxis') || 'columnAxis';
		this.columGap =  Modernizr.prefixed('columnGap') || 'columnGap';
		this.columWidth =  Modernizr.prefixed('columnWidth') || 'columnWidth';

		// we are interested in the css prefixed version
		this.cssColumAxis =  cssIfy(this.columAxis);
		this.cssColumGap =  cssIfy(this.columGap);
		this.cssColumWidth =  cssIfy(this.columWidth);
	},

	// sometimes these views hang around in memory before
	// the GC's get them. we need to remove all of the handlers
	// that were registered on the model
	destruct: function() {
		
		this.model.off("change:current_page", this.pageChangeHandler);
		this.model.off("change:toc_visible", this.windowSizeChangeHandler);
		this.model.off("repagination_event", this.windowSizeChangeHandler);
		this.model.off("change:current_theme", this.windowSizeChangeHandler);
		this.model.off("change:two_up", this.setUpMode);
		this.model.off("change:two_up", this.adjustIframeColumns);
		this.model.off("change:current_margin", this.marginCallback);
		this.model.off("change:mo_playing", this.renderMoPlaying);
		this.model.off("change:current_mo_frag", this.renderMoFragHighlight);

		// call the super destructor
		Readium.Views.PaginationViewBase.prototype.destruct.call(this);
	},

	render: function(goToLastPage) {
		var that = this;
		var json = this.model.getCurrentSection().toJSON();

		// make everything invisible to prevent flicker
		this.setUpMode();
		this.$('#container').html( this.page_template(json) );
		
		this.$('#readium-flowing-content').on("load", function(e) {
			that.adjustIframeColumns();
			that.iframeLoadCallback(e);
			that.setFontSize();
			that.injectTheme();
			that.setNumPages();

			if(goToLastPage) {
				that.model.goToLastPage();
			}
			else {
				that.model.goToPage(1);
			}		
		});
		return this;
	},

	getBodyColumnCss: function() {
		var css = {};
		css[this.cssColumAxis] = "horizontal";
		css[this.cssColumGap] = this.gap_width.toString() + "px";
		css[this.cssColumWidth] = this.page_width.toString() + "px";
		css["padding"] = "0px";
		css["margin"] = "0px";
		css["position"] = "absolute";
		css["width"] = this.page_width.toString() + "px";
		css["height"] = this.frame_height.toString() + "px";
		return css;
	},

	adjustIframeColumns: function() {
		var prop_dir = this.offset_dir;
		var $frame = this.$('#readium-flowing-content');
		this.setFrameSize();
		this.frame_width = parseInt($frame.width(), 10);
		this.frame_height = parseInt($frame.height(), 10);
		this.gap_width = Math.floor(this.frame_width / 7);
		if(this.model.get("two_up")) {
			this.page_width = Math.floor((this.frame_width - this.gap_width) / 2);
		}
		else {
			this.page_width = this.frame_width;
		}
		

		// it is important for us to make sure there is no padding or
		// margin on the <html> elem, or it will mess with our column code
		$(this.getBody()).css( this.getBodyColumnCss() );

		this.setNumPages();
		var page = this.model.get("current_page")[0] || 1;
		this.goToPage(page);
	},

	// helper method to get the a reference to the documentElement
	// of the document in this strategy's iFrame.
	// TODO this is a bad name for this function
	getBody: function() {
		return this.$('#readium-flowing-content').contents()[0].documentElement;
	},

	hideContent: function() {
		$("#flowing-wrapper").css("opacity", "0");
	},

	showContent: function() {
		$("#flowing-wrapper").css("opacity", "1");
	},

	calcPageOffset: function(page_num) {
		return (page_num - 1) * (this.page_width + this.gap_width);
	},

	// on iOS frames are automatically expanded to fit the content dom
	// thus we cannot use relative size for the iframe and must set abs 
	// pixel size
	setFrameSize: function() {
		var width = this.getFrameWidth().toString() + "px";
		var height = this.getFrameHeight().toString() + "px";

		this.$('#readium-flowing-content').attr("width", width);
		this.$('#readium-flowing-content').attr("height", height);
		this.$('#readium-flowing-content').css("width", width);
		this.$('#readium-flowing-content').css("height", height);
		
	},

	getFrameWidth: function() {
		var width;
		var margin = this.model.get("current_margin");
		if (margin === 1) {
			this.model.get("two_up") ? (width = 0.95) : (width = 0.90);
		}
		else if (margin === 2) {
			this.model.get("two_up") ? (width = 0.89) : (width = 0.80);
		}
		else if (margin === 3) {
			this.model.get("two_up") ? (width = 0.83) : (width = 0.70);	
		}
		else if (margin === 4) {
			this.model.get("two_up") ? (width = 0.77) : (width = 0.60);	
		}
		else {
			this.model.get("two_up") ? (width = 0.70) : (width = 0.50);	
		}
		
		return Math.floor( $('#flowing-wrapper').width() * width );
	},

	getFrameHeight: function() {
		return $('#flowing-wrapper').height();
	},

	// calculate the number of pages in the current section,
	// based on section length : page size ratio
	calcNumPages: function() {

		var body, offset, width, num;
		
		// get a reference to the dom body
		body = this.getBody();

		// cache the current offset 
		offset = body.style[this.offset_dir];

		// set the offset to 0 so that all overflow is part of
		// the scroll width
		body.style[this.offset_dir] = "0px";

		// grab the scrollwidth => total content width
		width = this.getBody().scrollWidth;

		// reset the offset to its original value
		body.style[this.offset_dir] = offset;

		// perform calculation and return result...
		num = Math.floor( (width + this.gap_width) / (this.gap_width + this.page_width) );

		// in two up mode, always set to an even number of pages
		if( num % 2 === 0 && this.model.get("two_up")) {
			//num += 1;
		}
		return num;
	},

	pageChangeHandler: function() {
		var that = this;
		this.hideContent();
		setTimeout(function() {
			that.goToPage(that.model.get("current_page")[0]);
		}, 150);
	},

	goToPage: function(page) {
		var offset = this.calcPageOffset(page).toString() + "px";
		$(this.getBody()).css(this.offset_dir, "-" + offset);
		this.showContent();
	},

	// navigate to a url hash fragment by calculating the page of
	// the corresponding elem and setting the page number on `this.model`
	//
	// as precondition the hash fragment should identify an element in the
	// section rendered by this view
	goToHashFragment: function() {

		// this method is triggered in response to 
		var fragment = this.model.get("hash_fragment");
		if(fragment) {
			var el = $("#" + fragment, this.getBody())[0];

			if(!el) {
				// couldn't find the el. just give up
				return;
			}

			// we get more precise results if we look at the first children
			while(el.children.length > 0) {
				el = el.children[0];
			}

			var page = this.getElemPageNumber(el);
			if(page > 0) {
				this.model.goToPage(page);	
			}
		}
		// else false alarm no work to do
	},

	getElemPageNumber: function(elem) {

		var rects, shift;
		rects = elem.getClientRects();
		if(!rects || rects.length < 1) {
			// if there were no rects the elem had display none
			return -1;
		}
		shift = rects[0][this.offset_dir];

		// `clientRects` are relative to the top left corner of the frame, but
		// for right to left we actually need to measure relative to right edge
		// of the frame
		if(this.offset_dir === "right") {
			// the right edge is exactly `this.page_width` pixels from the right 
			// edge
			shift = this.page_width - shift;
		}
		// less the amount we already shifted to get to cp
		shift -= parseInt(this.getBody().style[this.offset_dir], 10); 
		return Math.ceil( shift / (this.page_width + this.gap_width) );
	},

	windowSizeChangeHandler: function() {
		this.adjustIframeColumns();
	},

	setFontSize: function() {
		var size = this.model.get("font_size") / 10;
		$(this.getBody()).css("font-size", size + "em");

		// the content size has changed so recalc the number of 
		// pages
		this.setNumPages();
	},

	marginCallback: function() {
		this.adjustIframeColumns();
	},

	// sadly this is just a reprint of what is already in the
	// themes stylesheet. It isn't very DRY but the implementation is
	// cleaner this way
	themes: {
		"default-theme": {
			"background-color": "white",
			"color": "black",
			"mo-color": "#777"
		},

		"vancouver-theme": {
			"background-color": "#DDD",
			"color": "#576b96",
			"mo-color": "#777"
		},

		"ballard-theme": {
			"background-color": "#576b96",
			"color": "#DDD",
			"mo-color": "#888"
		},

		"parchment-theme": {
			"background-color": "#f7f1cf",
			"color": "#774c27",
			"mo-color": "#eebb22"
		},

		"night-theme": {
			"background-color": "#141414",
			"color": "white",
			"mo-color": "#666"
		}
	},

	injectTheme: function() {
		var theme = this.model.get("current_theme");
		if(theme === "default") theme = "default-theme";
		$(this.getBody()).css({
			"color": this.themes[theme]["color"],
			"background-color": this.themes[theme]["background-color"]
		});
		
		// stop flicker due to application for alternate style sheets
		// just set content to be invisible
		$("#flowing-wrapper").css("visibility", "hidden");
		this.activateEPubStyle(this.getBody());

		// wait for new stylesheets to parse before setting back to visible
		setTimeout(function() {
			$("#flowing-wrapper").css("visibility", "visible");	
		}, 100);
		
		
		
		this.renderMoPlaying();
	},

	setNumPages: function() {
		var num = this.calcNumPages();
		console.log('num pages is: ' + num);
		this.model.set("num_pages", num);
	},

	renderMoPlaying: function() {
		var theme = this.model.get("current_theme");
		if(theme === "default") theme = "default-theme";
		if(this.model.get("mo_playing")) {
			$(this.getBody()).css("color", this.themes[theme]["mo-color"]);
		}
		else {
			$(this.getBody()).css("color", this.themes[theme]["color"]);	
			$('.current-mo-content', this.getBody()).
				toggleClass('current-mo-content', false).
				css("color", "");
		}
	},

	renderMoFragHighlight: function() {

		var theme = this.model.get("current_theme");
		if(theme === "default") theme = "default-theme";

		// get rid of the last content
		$('.current-mo-content', this.getBody()).
			toggleClass('current-mo-content', false).
			css("color", "");
		
		var frag = this.model.get("current_mo_frag");
		if(frag) {
			$("#" +  frag, this.getBody()).
				toggleClass('current-mo-content', true).
				css("color", this.themes[theme]["color"]);
		}

	}



});