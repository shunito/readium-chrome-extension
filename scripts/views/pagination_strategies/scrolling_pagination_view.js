Readium.Views.ScrollingPaginationView = Readium.Views.PaginationViewBase.extend({

	initialize: function() {
		// call the super ctor
		Readium.Views.PaginationViewBase.prototype.initialize.call(this);
		this.page_template = Handlebars.templates.scrolling_page_template;
	},

	// sometimes these views hang around in memory before
	// the GC's get them. we need to remove all of the handlers
	// that were registered on the model
	destruct: function() {
		console.log("Scrolling paginator destructor called");

		// call the super destructor
		Readium.Views.PaginationViewBase.prototype.destruct.call(this);
	},

	render: function() {
		var that = this;
		var json = this.model.getCurrentSection().toJSON();
		this.$('#container').html( this.page_template(json) );
		
		this.$('.content-sandbox').on("load", function(e) {
			that.iframeLoadCallback(e);
		});
		return this;
	},

	injectLinkHandler: function (iframe) {
        var doc = iframe.contentDocument;
		$("a", doc).click(this.linkClickHandler);
	}

});