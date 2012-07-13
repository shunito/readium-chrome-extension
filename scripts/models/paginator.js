
// Description: Chooses a pagination strategy based on the ePub ebook passed in
// Inputs: This model references an ebook

Readium.Models.Paginator = Backbone.Model.extend({

	renderToLastPage: false,
	
	initialize: function() {

		this.rendered_spine_positions = [];
		this.model = this.get("book");
	},

	// Description: Determine what the current spine item is and render it
	// Updates which spine items have been rendered in an array of rendered spine items
	renderSpineItems: function(renderToLast) {
		var book = this.model;
		var spine_position = book.get("spine_position");
		var that = this;
		
		// we are going to clear everything out and start from scratch
		this.rendered_spine_positions = [];

		// clean up the old view if there is one
		if(this.v) {
			this.v.destruct();
		}

		// Spine items as found in the package document can have attributes that override global settings for the ebook. This 
		// requires checking/creating the correct pagination strategy for each spine item
		var spineItem = book.getCurrentSection();
		if(spineItem.isFixedLayout()) {
			this.should_two_up = book.get("two_up");
			
			this.v = new Readium.Views.FixedPaginationView({model: book});

			// throw down the UI
			this.v.render();

			var pageNum = 1; // start from page 1
			var offset = this.findPrerenderStart();

			// (I think) Gets each page of the current pub and injects it into the page, then 
			// keeps track of what has been pre-rendered
			while( this.shouldPreRender( this.model.getCurrentSection(offset) ) ) {
				this.v.addPage(book.getCurrentSection(offset), pageNum );
				this.rendered_spine_positions.push(spine_position + offset);
				pageNum += 1;
				offset += 1;
			}

			// set the page we should be on
			var page = this.rendered_spine_positions.indexOf(spine_position) + 1;
			book.set("num_pages", pageNum - 1);
			book.goToPage(page);
			setTimeout(function() {
				that.v.setContainerSize();
			}, 5);
		}
		// This is either an ePub that should be rendered in a scrolling container, or with a fully
		// reflowable presentation
		else {
			if(this.shouldScroll()) {
				this.v = new Readium.Views.ScrollingPaginationView({model: book});
			}
			else {
				if(this.should_two_up) {
					book.set("two_up", true);
				}
				this.v = new Readium.Views.ReflowablePaginationView({model: book});
			}
			this.v.render(!!renderToLast);
			this.rendered_spine_positions.push(spine_position);
		}
		return this.rendered_spine_positions;
	},
  
	findPrerenderStart: function() {
		var i = 0;
		while( this.shouldPreRender( this.model.getCurrentSection(i) ) ) {
			i -= 1;
		}
		return i + 1; // sloppy fix for an off by one error
	},

	// A spine item should pre-render if it is not undefined and should render as a fixed item
	shouldPreRender: function(spineItem) {
		return spineItem && spineItem.isFixedLayout(); 
	},

	shouldScroll: function() {
		var optionString = localStorage["READIUM_OPTIONS"];
		var options = (optionString && JSON.parse(optionString) ) || {"singleton": {}};
		return !options["singleton"]["paginate_everything"];
	}
	
});