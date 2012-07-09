// Description: This model is responsible for page navigation for both reflowable and fixed layout pubs
// Rationale: Currently, this model exists to simplify the ebook.js file.

Readium.Models.PageNumberDisplayLogic = Backbone.Model.extend({

	initialize: function () {},

	getGotoPageNumsToDisplay: function(twoUp, isFixedLayout, pageProgDirection, gotoPageNumber) {

		// in two up mode we need to keep track of what side
		// of the spine the odd pages go on
		if (twoUp) {
			
			// Fixed layout page
			if (isFixedLayout) {

				if (pageProgDirection === "rtl") {

					if (this.displayedPageIsLeft(gotoPageNumber)) {

						return [gotoPageNumber - 1, gotoPageNumber];
					}
					else if (this.displayedPageIsRight(pageNumber)) {

						return [gotoPageNumber, gotoPageNumber + 1];
					}

					// TODO: Handle center pages
				}
				// Left-to-right page progression
				else {

					if (this.displayedPageIsLeft(gotoPageNumber)) {

						return [gotoPageNumber, gotoPageNumber + 1];
					}
					else if (this.displayedPageIsRight(gotoPageNumber)) {

						return [gotoPageNumber - 1, gotoPageNumber];
					}

					// TODO: Handle center pages
				}
			}
			// This is a reflowable page
			else {
				// in reflowable format, we want this config always:
				// ODD_PAGE |spine| EVEN_PAGE
				if (gotoPageNumber % 2 === 1) {

					return [gotoPageNumber, gotoPageNumber + 1];	
				}
				else {

					return [gotoPageNumber - 1, gotoPageNumber];
				}	
			}
			
		}
		else {
			
			return [pageNumber];
		}
	},

	getPrevPageNumsToDisplay: function (prevPageNumber, isFixedLayout, pageProgDirection) {

		// If fixed layout
		if (isFixedLayout) {

			if (pageProgDirection === "rtl") {

				// If the first page is a left page in rtl progression, only one page 
				// can be displayed, even in two-up mode
				if (this.displayedPageIsLeft(prevPageNumber) && 
					this.displayedPageIsRight(prevPageNumber - 1)) {

					return [prevPageNumber - 1, prevPageNumber];
				}
				else {

					return [prevPageNumber];
				}
			}
			// Left-to-right progresion
			else {

				if (this.displayedPageIsRight(prevPageNumber) &&
					this.displayedPageIsLeft(prevPageNumber - 1)) {

					return [prevPageNumber - 1, prevPageNumber];
				}
				else {

					return [prevPageNumber];
				}
			}
		}
		// A reflowable text
		else {

			return [prevPageNumber - 1, prevPageNumber];
		}
	},

	getNextPageNumsToDisplay: function (nextPageNumber, isFixedLayout, pageProgDirection) {

		// If fixed layout
		if (isFixedLayout) {

			if (pageProgDirection === "rtl") {

				// If the first page is a left page in rtl progression, only one page 
				// can be displayed, even in two-up mode
				if (this.displayedPageIsRight(nextPageNumber) &&
					this.displayedPageIsLeft(nextPageNumber + 1)) {

					return [nextPageNumber, nextPageNumber + 1];
				}
				else {

					return [nextPageNumber];
				}
			}
			else {

				if (this.displayedPageIsLeft(nextPageNumber) && 
					this.displayedPageIsRight(nextPageNumber + 1)) {

					return [nextPageNumber, nextPageNumber + 1];
				}
				else {

					return [nextPageNumber];
				}
			}
		}
		// Reflowable section
		else {

			return [nextPageNumber, nextPageNumber + 1];
		}
	},

	// Description: This method determines which page numbers to display when switching
	// between a single page and side-by-side page views and vice versa.
	getPageNumbersForTwoUp: function(twoUp, displayedPageNumbers, pageProgDirection, isFixedLayout) {

		var displayed = displayedPageNumbers;
		var newPages = [];

		// Two pages are currently displayed; find the single page number to display
		if (twoUp) {

			if (displayed[0] === 0) {
				
				newPages[0] = 1;
			} 
			else {
				
				newPages[0] = displayed[0];
			}
		}
		// A single reflowable page is currently displayed; find two pages to display
		else if (!isFixedLayout) {

			if (displayed[0] % 2 === 1) {
				
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
			if (pageProgDirection === "rtl") {

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

		return newPages;
	},

	// Description: The `displayedPageIs...` methods determine if a fixed layout page is right, left or center.
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
});