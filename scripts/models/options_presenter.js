Readium.Models.OptionsPresenter = Backbone.Model.extend({

	initialize: function() {
		var book = this.get("book");
		if(!book) {
			throw "ebook must be set in the constructor";
		}
		this.resetOptions();

		// keep self up to date with book
		book.on("change:font_size", this.resetOptions, this);
		book.on("change:two_up", this.resetOptions, this);
		book.on("change:current_theme", this.resetOptions, this);
		book.on("change:current_margin", this.resetOptions, this);
	},

	applyOptions: function() {
		var book = this.get("book");

		// set everything but two_up
		book.set({
			"font_size": 		this.get("font_size"),
	    	"current_theme": 	this.get("current_theme"),
	    	"current_margin": 	this.get("current_margin")
		});

		// cannot set two_up directly, need to call toggle
		// so determine if we should
		var shouldToggleTwoUp = this.get("two_up") !== book.get("two_up");
		if (shouldToggleTwoUp) {

			book.set("two_up", !book.get("two_up"));
		}

		// persist user settings for next time
		book.save();
	},

	resetOptions: function() {
		var book = this.get("book");
		this.set({
			"font_size": 		book.get("font_size"),
	    	"two_up": 			book.get("two_up"),
	    	"current_theme": 	book.get("current_theme"),
	    	"current_margin": 	book.get("current_margin")
		});
	}
});