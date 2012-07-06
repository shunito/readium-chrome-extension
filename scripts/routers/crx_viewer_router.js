// This router is used in the book view of the chrome extension build of readium
Readium.Routers.ViewerRouter = Backbone.Router.extend({

	routes: {
		"views/viewer.html?book=:key": "openBook",
		"*splat": "splat_handler"
	},

	openBook: function(key) {
		// the "right" way to do this is probably to call fetch()
		// on the book, but I needed to know what kind of book to 
		// initialize at early on. This is a pragmatic solution
		// NOT TRUE ANY MORE TODO: fixme
		Lawnchair(function() {
			this.get(key, function(result) {
				if(result === null) {
					alert('Could not load book, try refeshing your browser.')
					return;
				}
				// ------ START: REFACTORED CODE ---- //
				
				window._book = new Readium.Models.ReadiumEPUBState(result);

				// ------ END: REFACTORED CODE ------ // 

				window._book = new Readium.Models.Ebook({epub : window._book});
				
				window._applicationView = new Readium.Views.ViewerApplicationView({
					model: window._book
				});
				window._applicationView.render();
			});		
		});
	},

	splat_handler: function(splat) {
		console.log(splat)
	}

});