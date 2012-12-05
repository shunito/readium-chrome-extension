Readium.Models.OptionsPresenter = Backbone.Model.extend({

	initialize: function() {
		var book = this.get("book");
		if(!book) {
			throw "ebook must be set in the constructor";
		}
		this.resetOptions();

		// keep self up to date with book
		book.on("change:font_size", this.resetOptions, this);
		book.on("change:pagination_mode", this.resetOptions, this);
		book.on("change:current_theme", this.resetOptions, this);
		book.on("change:current_margin", this.resetOptions, this);
	},

	applyOptions: function() {
		var book = this.get("book");

		// set everything but two_up
		book.set({
			"font_size": 		this.get("font_size"),
	    	"current_theme": 	this.get("current_theme"),
	    	"current_margin": 	this.get("current_margin"),
	    	"pagination_mode": 	this.get("pagination_mode")
		});

		// persist user settings for next time
		book.save();
	},

	resetOptions: function() {
		var book = this.get("book");
		this.set({
			"font_size": 		book.get("font_size"),
	    	"pagination_mode":	book.get("pagination_mode"),
	    	"current_theme": 	book.get("current_theme"),
	    	"current_margin": 	book.get("current_margin")
		});
	}
});