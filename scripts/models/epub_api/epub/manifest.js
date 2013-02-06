Readium.Collections.Manifest = Backbone.Collection.extend({
    model: Readium.Models.ManifestItem,

    initialize: function(models, options) {
        this.packageDocument = options.packageDocument;   
    }
});