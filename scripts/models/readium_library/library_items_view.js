Readium.Views.LibraryItemsView = Backbone.View.extend({
    tagName: 'div',

    id: "library-items-container",

    className: 'row-view',

    initialize: function() {
        this.template = Handlebars.templates.library_items_template;
        this.collection.bind('reset', this.render, this);
        this.collection.bind('add',   this.addOne, this);
    },

    render: function() {
        var collection = this.collection;
        var content = this.template({});
        var $el = this.$el;
        $el.html(content);
        
        this.$('#empty-message').toggle(collection.isEmpty());

        collection.each(function(item) {
            var view = new Readium.Views.LibraryItemView({
                model: item,
                collection: collection,
                id: item.get('id')
            });
            $el.append( view.render().el );

        });
        this.restoreViewType();
        // i dunno if this should go here
        $('#library-books-list').html(this.el);
        return this;
    },

    restoreViewType: function() {
        // restore the setting
        if(Readium.Utils.getCookie("lib_view") === "block") {
            this.$el.addClass("block-view").removeClass("row-view");
        }
    },

    addOne: function(book) {
        var view = new Readium.Views.LibraryItemView({
            model: book,
            collection: this.collection,
            id: book.get('id')
        });
        // we are adding so this should always be hidden!
        this.$('#empty-message').toggle(false);
        $(this.el).append( view.render().el );
    },

    events: {
        
    }
});