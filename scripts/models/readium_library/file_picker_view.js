Readium.Views.FilePickerView = Backbone.View.extend({
    el:"#add-book-modal",

    initialize: function() {
        $(this.el).on('shown', function(){
            $('#add-book-heading').focus();
            setTimeout( function() {
                $('#add-book-btn').attr('aria-pressed', 'true');
            }, 1);
        }).on('hidden', function(){
            setTimeout( function(){
                $('#add-book-btn').attr('aria-pressed', 'false').focus();
            }, 1);
        });
    },

    events: {
        "change #files": "handleFileSelect",
        "change #dir_input": "handleDirSelect",
        "click #url-button": "handleUrl"
    },

    show: function() {
        this.$el.modal('show');
    },

    hide: function() {
        this.$el.modal('hide');
    },

    resetForm: function() {
        this.$('input').val("");
    },

    handleUrl: function(evt) {
        var input = document.getElementById('book-url');
        if(input.value === null || input.value.length < 1) {
            alert("invalid url, cannot process");
        }
        else {
            var url = input.value;
            // TODO check src filename
            var extractor = new Readium.Models.ZipBookExtractor({url: url, src_filename: url});
            this.beginExtraction(extractor);
        }
    },

    handleFileSelect: function(evt) {
        var files = evt.target.files; // FileList object
        var extractor = new Readium.Models.ZipBookExtractor({file: files[0], src_filename: files[0].name});
        this.beginExtraction(extractor);
    },

    handleDirSelect: function(evt) {
        var dirpicker = evt.target; // FileList object      
        var extractor = new Readium.Models.UnpackedBookExtractor({dir_picker: dirpicker});
        this.beginExtraction(extractor);
        
    },

    beginExtraction: function(extractor) {
        var that = this;
        var timer = new Timer();
        timer.start();
        window._extract_view = new Readium.Views.ExtractItemView({model: extractor});
        extractor.on("extraction_success", function() {
            var book = extractor.packageDoc.toJSON();
            timer.stop();
            timer.report();
            that.collection.add(new Readium.Models.LibraryItem(book));
            that.resetForm();
            setTimeout(function() {
                chrome.tabs.create({url: "/views/viewer.html?book=" + book.key });
            }, 800);
        });
        extractor.on("change:failure", this.resetForm, this);
        
        extractor.extract();
        this.hide();
    }

});