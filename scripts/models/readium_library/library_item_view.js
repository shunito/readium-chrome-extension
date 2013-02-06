Readium.Views.LibraryItemView = Backbone.View.extend({

    tagName: 'div',

    className: "book-item",

    initialize: function() {
        this.template = Handlebars.templates.library_item_template;
    },

    render: function() {
        var renderedContent = this.template({data: this.model.toJSON()});
        $(this.el).html(renderedContent);
        return this;
    },

    events: {
        "click .delete": function(e) {
            e.preventDefault();
            var confMessage;
            var selector = "#details-modal-" + this.model.get('key');
            confMessage  = "Are you sure you want to permanently delete " 
            confMessage += this.model.get('title');
            confMessage += "?";


            if(confirm(confMessage)) {
                $(selector).modal('hide');
                this.model.destroy();
                this.remove();
            }
        },

        "click .read": function(e) {
            this.model.openInReader();
        }
        
    }
});