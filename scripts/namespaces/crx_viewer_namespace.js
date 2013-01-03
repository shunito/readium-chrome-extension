// This is the namespace and initialization code that is used by
// by the epub viewer of the chrome extension

window.Readium = {
	Models: {},
	Collections: {},
	Views: {},
	Routers: {},
	Utils: {},
	Init: function() {

		// Detect whether IE is the current browser, and use an alternative to HTML-5 push state and backbone.js routing
		if (this.isIE9()) {

			// Get the book id
			var queryString = window.location.search;
			var firstQueryParam = queryString.split("&")[0];
			var epubId = firstQueryParam.split("=")[1];

			// Open the book with the method that the backbone router would have called. 
			(new Readium.Routers.ViewerRouter).openBook(epubId);
		}
		// Assumes HTML-5 compatible browser: Safari, Firefox, Chrome, IE10
		else {

			_router = new Readium.Routers.ViewerRouter();
			Backbone.history.start({pushState: true});
		}
	},

	isIE9 : function() {

	    var undef;
	    var v = 3;
	    var div = document.createElement('div');
	    var all = div.getElementsByTagName('i');

	    while (
	        div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
	        all[0]
	    );

	    if (v === 9) {
	    	return true;
	    }
	    else {
	    	return false;
	    }
	}
};

$(function() {
	// call the initialization code when the dom is loaded
	window.Readium.Init();
});