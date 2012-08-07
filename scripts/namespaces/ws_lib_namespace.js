// This is the namespace and initialization code that is used by
// by the web served version of readium. It is not included in
// the chrome extension at all.

if( !window.Readium ) {
	window.Readium = {
		Models: {},
		Collections: {},
		Views: {},
		Routers: {},
		Utils: {},
		Init: function() {
			window.options = Readium.Models.ReadiumOptions.getInstance();
			window.optionsView = new Readium.Views.ReadiumOptionsView({model: window.options});
				
			window.Library = new Readium.Collections.LibraryItems(window.ReadiumLibraryData);
			window.lib_view = new Readium.Views.LibraryItemsView({collection: window.Library});
			//window.fp_view = new Readium.Views.FilePickerView();
			window.router = new Readium.Routers.ApplicationRouter({collection: window.Library});

			Backbone.history.start({pushState: false});
			// window.Library.fetch();
			window.Library.trigger('reset');

var hc = $('#library-items-container').hasClass("row-view");
$("#block-view-btn").attr('aria-pressed', hc ? 'false' : 'true');
$("#row-view-btn").attr('aria-pressed', hc ? 'true' : 'false');
			
			$("#block-view-btn").click(function(e) {
$("#block-view-btn").attr('aria-pressed', 'true');
$("#row-view-btn").attr('aria-pressed', 'false');
				$('#library-items-container').addClass("block-view").removeClass("row-view")
			});
			$("#row-view-btn").click(function(e) {
$("#block-view-btn").attr('aria-pressed', 'false');
$("#row-view-btn").attr('aria-pressed', 'true');
				$('#library-items-container').addClass("row-view").removeClass("block-view")
			});
		}
	};
};

$(function() {
	// call the initialization code when the dom is loaded
	window.Readium.Init();
});