

Readium.Views.FixedPaginationView = Readium.Views.PaginationViewBase.extend({

	initialize: function() {
		// call the super ctor
		this.page_template = _.template( $('#fixed-page-template').html() );
		this.empty_template = _.template( $('#empty-fixed-page-template').html() );
		Readium.Views.PaginationViewBase.prototype.initialize.call(this);
		//this.model.on("first_render_ready", this.render, this);
		this.model.on("change:two_up", this.setUpMode, this);
		this.model.on("change:meta_size", this.setContainerSize, this);
	},

	// sometimes these views hang around in memory before
	// the GC's get them. we need to remove all of the handlers
	// that were registered on the model
	destruct: function() {
		console.log("Fixed paginator destructor called");

		// call the super constructor
		Readium.Views.PaginationViewBase.prototype.destruct.call(this);

		// remove any listeners registered on the model
		this.model.off("change:two_up", this.setUpMode);
		this.model.off("change:meta_size", this.setUpMode);
	},

	render: function() {

		$('body').addClass('apple-fixed-layout');

		// wipe the html
		this.$('#container').html("");
		this.setContainerSize();
		this.setUpMode();

		// add the current section
		//this.addPage( this.model.getCurrentSection(), 1 );
		//currentPage = this.model.set("current_page", [1]);
		
		return this.renderPages();
	},

	setContainerSize: function() {
		var meta = this.model.get("meta_size");
		if(meta) {
			this.$el.width(meta.width * 2);
			this.$el.height(meta.height);
			if(!this.zoomed) {
				this.zoomed = true;
				setTimeout(function() {
					$('#page-wrap').zoomAndScale(); //<= this was a little buggy last I checked but it is a super cool feature
				}, 1)	
			}
		}
	},

	// Description: Creates/gets an iFrame, which contains a page view to represent a spine item, and appends it to an 
	// element that contains the content of the current ePub. Each of these spine item views is not necessarily displayed
	// immediately. 
	addPage: function(spineItem, pageNum) {
		var that = this;
		var view = spineItem.getPageView();
		view.on("iframe_loaded", function() {
			this.iframeLoadCallback({srcElement: view.iframe()});
		}, this);
		var content = spineItem.getPageView().render().el;
		$(content).attr("id", "page-" + pageNum.toString());
		this.$('#container').append(content);
		this.changePage();
		return this;
	},

	renderPages: function() {
		// lost myself in the complexity here but this seems right
		this.changePage();
		return this;
	},

	// Description: For each fixed-page-wrap(per), if it is one of the current pages, toggle it as visible. If it is not
	// Toggle it as invisible.
	// Note: current_page is an array containing the page numbers (as of 25June2012, a maximum of two pages) of the 
	// currently visible pages
	changePage: function() {
		var that = this;
		var currentPage = this.model.get("current_page");

		this.$(".fixed-page-wrap").each(function(index) {
			$(this).toggle(that.isPageVisible(index + 1, currentPage));
		});
	}
});


Readium.Views.FixedPageView = Backbone.View.extend({

	className: "fixed-page-wrap",

	initialize: function() {
		this.template = _.template( $('#fixed-page-template').html() );
		this.model.on("change", this.render, this);
	},

	destruct: function() {
		this.model.off("change", this.render);
	},

	render: function() {
		var that = this;
		var json = this.model.toJSON();
		this.$el.html( this.template( json ) );
		this.$el.addClass( this.model.getPageSpreadClass() );
		this.$('.content-sandbox').on("load", function() {
			that.trigger("iframe_loaded");
		});
		return this;
	},

	iframe: function() {
		return this.$('.content-sandbox')[0];
	}

});
