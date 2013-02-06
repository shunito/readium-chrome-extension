Readium.Views.ExtractItemView = Backbone.View.extend({
    
    el: '#progress-container',

    initialize: function() {    
        this.template = Handlebars.templates.extracting_item_template;
        this.model.bind('change', this.render, this);
        this.model.bind("change:error", this.extractionFailed, this);
    },

    render: function() {
        var $el = $(this.el);
        if( this.model.get('extracting') ) {
            $el.html(this.template(this.model.toJSON()));
            $el.show("slow");
        }
        else {
            $el.hide("slow");
        }
        return this;
    },

    extractionFailed: function(msg) {
        alert(this.model.get("error"));
        this.model.set("extracting", false);
    }

});