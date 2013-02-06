Timer = function() {};
Timer.prototype.start = function() {this.start = new Date()};
Timer.prototype.stop = function() {this.stop = new Date()};
Timer.prototype.report = function() {
	console.log("===================Timer Report======================");
	console.log(this.stop - this.start);
	console.log("===================Timer Report======================");
};

Readium.Models.LibraryItem = Backbone.Model.extend({

	idAttribute: "key",
	
	getViewBookUrl: function(book) {
		return "/views/viewer.html?book=" + this.get('key');
	},

	openInReader: function() {
		window.location = this.getViewBookUrl();
	},

	destroy: function() {
		var key = this.get('key');
		Lawnchair(function() {
			var that = this; // <=== capture Lawnchair scope
			this.get(key, function(book) {
				if(book) {
					Readium.FileSystemApi(function(fs) {
						fs.rmdir(book.key);
						that.remove(key);
					});
				}
			});

			// Remove the viewer preferences as well
			propertiesKey = key + "_epubViewProperties";
			this.get(propertiesKey, function(epubViewProperties) {
				if(epubViewProperties) {
					Readium.FileSystemApi(function(fs) {
						fs.rmdir(epubViewProperties.key);
						that.remove(propertiesKey);
					});
				}
			});
		});
	}
});