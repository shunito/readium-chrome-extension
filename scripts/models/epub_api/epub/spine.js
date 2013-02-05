Readium.Collections.Spine = Backbone.Collection.extend({
    model: Readium.Models.SpineItem,

    initialize: function(models, options) {
        this.packageDocument = options.packageDocument;
    },

    isBookFixedLayout: function() {
        return this.packageDocument.get("book").isFixedLayout();
    },

    getMediaOverlay: function(id) {
        return this.packageDocument.getMediaOverlayItem(id);
    }
});