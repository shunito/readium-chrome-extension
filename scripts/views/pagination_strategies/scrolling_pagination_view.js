Readium.Views.ScrollingPaginationView = Readium.Views.PaginationViewBase.extend({

	/**************************************************************************************/
	/* PUBLIC METHODS (THE API)                                                           */
	/**************************************************************************************/

	initialize: function() {
		// call the super ctor
		Readium.Views.PaginationViewBase.prototype.initialize.call(this);
		this.page_template = _.template( $('#scrolling-page-template').html() );
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

	// REFACTORING CANDIDATE: A method with this name exists on the base model; 
	injectLinkHandler: function (iframe) {
        var doc = iframe.contentDocument;
		$("a", doc).click(this.linkClickHandler);
	},

	/**************************************************************************************/
	/* "PRIVATE" HELPERS                                                                  */
	/**************************************************************************************/

	// sometimes these views hang around in memory before
	// the GC's get them. we need to remove all of the handlers
	// that were registered on the model
	destruct: function() {
		console.log("Scrolling paginator destructor called");

		// call the super destructor
		Readium.Views.PaginationViewBase.prototype.destruct.call(this);
	}
});