Readium.Views.ReadiumOptionsView = Backbone.View.extend({
    el: "#readium-options-modal",

    initialize: function() {
        this.model.on("change", this.render, this);
        this.render();
        $(this.el).on('shown', function(){
            $('#options-heading').focus();
            setTimeout( function() {
                $('#options-btn').attr('aria-pressed', 'true');
            }, 1);
        }).on('hidden', function(){
            setTimeout( function(){
                $('#options-btn').attr('aria-pressed', 'false').focus();
            }, 1);
        });
    },

    render: function() {
        var m = this.model;
        this.$('#paginate_everything').prop('checked', m.get("paginate_everything"));
        this.$('#verbose_unpacking').prop('checked', m.get("verbose_unpacking"));
        this.$('#hijack_epub_urls').prop('checked', m.get("hijack_epub_urls"));
    },

    events: {
        "change #verbose_unpacking": "updateSettings",
        "change #hijack_epub_urls": "updateSettings",
        "change #paginate_everything": "updateSettings",
        "click #save-settings-btn": "save"
        },

        updateSettings: function() {
            var hijack = this.$('#hijack_epub_urls').prop('checked')
            var unpack = this.$('#verbose_unpacking').prop('checked')
            var paginate = this.$('#paginate_everything').prop('checked')
            
        this.model.set({"verbose_unpacking": unpack,
                        "hijack_epub_urls": hijack,
                        "paginate_everything": paginate});
        },

        save: function() {
            this.model.save();
            this.$el.modal("hide");
        }

});