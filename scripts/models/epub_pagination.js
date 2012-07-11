
Readium.Models.EPUBPagination = Backbone.Model.extend({ 

	/**************************************************************************************/
	/* PUBLIC METHODS (THE API)                                                           */
	/**************************************************************************************/

	initialize: function () {

		// TODO: This should be a temporary hack until the persistence for current_page/spine_position can be
		//   worked out. 		
		this.epubController = this.get("model");
		this.set("current_page", [1]);
	},

	// START: Methods that have been added as a result of refactoring

	// Description: This method determines which page numbers to display when switching
	// between a single page and side-by-side page views and vice versa.
	toggleTwoUp: function() {

		if (this.epub.get("can_two_up")) {

			// REFACTORING CANDIDATE: refactor page number display logic to this model
			var newPages = this.epub.pageNumberDisplayLogic.getPageNumbersForTwoUp (
				this.epubController.get("two_up"), 
				this.get("current_page"),
				this.epubController.epub.get("page_prog_dir"),
				this.epubController.getCurrentSection().isFixedLayout()
				);

			this.epubController.set({two_up: !this.epubController.get("two_up")});
			this.set({current_page: newPages});
		}	
	},

	// REFACTORING CANDIDATE: This needs to be investigated, but I bet if the prevPage and nextPage methods were 
	//   called directly (goRight and goLeft were removed), the new page number display logic would account for the 
	//   page progression direction and that that logic could also be simplified.
	// turn pages in the rightward direction
	// ie progression direction is dependent on 
	// page progression dir
	goRight: function() {
		if (this.epubController.epub.get("page_prog_dir") === "rtl") {
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
		if (this.epubController.epub.get("page_prog_dir") === "rtl") {
			this.nextPage();
		}
		else {
			this.prevPage();	
		}
	},

	goToPage: function(gotoPageNumber) {

		// if the we are already at that page then there is no work to do
		// break out early to prevent page change events
		if (this.isPageVisible(gotoPageNumber)) {
			return;
		}

		var pagesToGoto = this.epubController.pageNumberDisplayLogic.getGotoPageNumsToDisplay(
							gotoPageNumber,
							this.epubController.get("two_up"),
							this.epubController.getCurrentSection().isFixedLayout(),
							this.epubController.epub.get("page_prog_dir")
							);
		this.set("current_page", pagesToGoto);
	},

	// Description: Return true if the pageNum argument is a currently visible 
	// page. Return false if it is not; which will occur if it cannot be found in 
	// the array.
	isPageVisible: function(pageNum) {
		return this.get("current_page").indexOf(pageNum) !== -1;
	},

	/**************************************************************************************/
	/* "PRIVATE" HELPERS                                                                  */
	/**************************************************************************************/

	// REFACTORING CANDIDATE: This is public but not sure it should be; it's called from the navwidget and viewer.js
	prevPage: function() {

		var curr_pg = this.get("current_page");
		var lastPage = curr_pg[0] - 1;

		// For fixed layout pubs, check if the last page is displayed; if so, end navigation.
		// TODO: This is a bit of a hack, but the this entire model underlying the part of the pub that 
		// is displayed on the screen probably needs to change. 
		if (this.epubController.getCurrentSection().isFixedLayout()) {

			if (this.epubController.get("two_up") && curr_pg[0] === 1) {

				return;
			}
		}

		if(curr_pg[0] <= 1) {

			this.epubController.goToPrevSection();
		}
		// Single page navigation
		else if(!this.epubController.get("two_up")){

			this.set("current_page", [lastPage]);

			// Reset spine position
			if(this.epubController.get("rendered_spine_items").length > 1) {
				var pos = this.epubController.get("rendered_spine_items")[lastPage - 1];
				this.epubController.set("spine_position", pos);
			}
		}
		// Move to previous page with two side-by-side pages
		else {

			var pagesToDisplay = this.epubController.pageNumberDisplayLogic.getPrevPageNumsToDisplay(
								lastPage,
								this.epubController.getCurrentSection().isFixedLayout(),
								this.epubController.epub.get("page_prog_dir")
								);
			this.set("current_page", pagesToDisplay);

			// Reset spine position
			if(this.epubController.get("rendered_spine_items").length > 1) {
				var ind = (lastPage > 1 ? lastPage - 2 : 0);
				var pos = this.epubController.get("rendered_spine_items")[ind];
				this.epubController.set("spine_position", pos);
			}
		}
	},

	nextPage: function() {

		var curr_pg = this.get("current_page");
		var firstPage = curr_pg[curr_pg.length - 1] + 1;

		// For fixed layout pubs, check if the last page is displayed; if so, end navigation
		if (this.epubController.getCurrentSection().isFixedLayout()) {

			if (this.epubController.get("two_up") && 
				(curr_pg[0] === this.epubController.get("rendered_spine_items").length || 
				 curr_pg[1] === this.epubController.get("rendered_spine_items").length)
				) {

				return;
			}
		}

		if (curr_pg[curr_pg.length - 1] >= this.epubController.get("num_pages")) {

			this.epubController.goToNextSection();
		}
		else if (!this.epubController.get("two_up")) {

			this.set("current_page", [firstPage]);

			// Reset the spine position
			if (this.epubController.get("rendered_spine_items").length > 1) {

				var pos = this.epubController.get("rendered_spine_items")[firstPage - 1];
				this.epubController.set("spine_position", pos);
			}
		}
		// Two pages are being displayed
		else {

			var pagesToDisplay = this.epubController.pageNumberDisplayLogic.getNextPageNumsToDisplay(
								firstPage,
								this.epubController.getCurrentSection().isFixedLayout(),
								this.epubController.epub.get("page_prog_dir")
								);
			this.set("current_page", pagesToDisplay);

			// Reset the spine position
			if (this.epubController.get("rendered_spine_items").length > 1) {

				var pos = this.epubController.get("rendered_spine_items")[firstPage - 1];
				this.epubController.set("spine_position", pos);
			}
		}
	},

	adjustCurrentPage: function() {
		var cp = this.get("current_page");
		var num = this.epubController.get("num_pages");
		var two_up = this.epubController.get("two_up");
		if(cp[cp.length - 1] > num) {
			this.goToLastPage();
		}
	},	

	// REFACTORING CANDIDATE: this is strange in that it does not seem to account for 
	//   possibly crossing over a section boundary
	goToLastPage: function() {
		var page = this.epubController.get("num_pages");
		this.goToPage(page);
	}

	// END: Methods that have been added as a result of refactoring
});