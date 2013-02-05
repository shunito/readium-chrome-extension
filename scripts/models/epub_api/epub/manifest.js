Readium.Collections.ManifestItems = Backbone.Collection.extend({
    model: Readium.Models.ManifestItem,

    initialize: function(models, options) {
        this.packageDocument = options.packageDocument;   
    }
});