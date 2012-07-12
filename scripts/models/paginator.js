
// Description: Chooses a pagination strategy based on the ePub ebook passed in
// Inputs: This model references an ebook

Readium.Models.Paginator = Backbone.Model.extend({

	renderToLastPage: false,
	
	/**************************************************************************************/
	/* PUBLIC METHODS (THE API)                                                           */
	/**************************************************************************************/

	initialize: function() {

		this.model = this.get("book");
	},

	// Description: Determine what the current spine item is and render it
	// Updates which spine items have been rendered in an array of rendered spine items
	renderSpineItems: function(renderToLast) {
		var book = this.model;
		var that = this;
		var rendered_spine_positions = [];

		// clean up the old view if there is one
		if (this.v) {
			this.v.destruct();
		}

		// Spine items as found in the package document can have attributes that override global settings for the ebook. This 
		// requires checking/creating the correct pagination strategy for each spine item
		var spineItem = book.getCurrentSection();
		if (spineItem.isFixedLayout()) {

			this.v = new Readium.Views.FixedPaginationView({model: book});
		}
		// A scrolling epub
		else if (this.shouldScroll()) {

				this.v = new Readium.Views.ScrollingPaginationView({model: book});
		}
		// A reflowable epub
		else {

			this.v = new Readium.Views.ReflowablePaginationView({model: book});
		}

		this.rendered_spine_positions = this.v.render(!!renderToLast);
		return this.rendered_spine_positions;
	},
  
	/**************************************************************************************/
	/* "PRIVATE" HELPERS                                                                  */
	/**************************************************************************************/

	shouldScroll: function() {
		var optionString = localStorage["READIUM_OPTIONS"];
		var options = (optionString && JSON.parse(optionString) ) || {"singleton": {}};
		return !options["singleton"]["paginate_everything"];
	}
});