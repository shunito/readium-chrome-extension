
Readium.Views.ReflowableSequenceView = Backbone.View.extend({

    id: "reflowing-sequence",

    // Set default for current view

    initialize: function(options) {

    },
    
    destruct: function() {
    
    },

    // ------------------------------------------------------------------------------------ //
    //  "PUBLIC" METHODS (THE API)                                                          //
    // ------------------------------------------------------------------------------------ //

    render : function (goToLastPage, hashFragmentId) {

        var that = this;
        // This should also be moved into something like the pagination strategy selector
        $(this.getReadiumBookViewEl()).html(this.getReflowingSequence());

        // For each content document in the spine, create a wrapper with template; the selection of the 
        //  content documents to render in this sequence is here for now only to prevent having to refactor
        //  the fixed and scrolling views too soon. This code should be moved to the viewer 

        var reflowableView = new Readium.Views.ReflowablePaginationView({ model : this.model });
        $(this.getReflowingSequence()).append(reflowableView.render(goToLastPage, hashFragmentId).el);
        this.currentView = reflowableView;

        
        // The spine positions that have been rendered have to be returned 
        return [this.model.get("spine_position")];
    },

    goRight : function () {
        this.getCurrentView().pages.goRight();
    },

    goLeft : function () {
        this.getCurrentView().pages.goLeft();
    },

    // ------------------------------------------------------------------------------------ //
    //  PRIVATE GETTERS FOR VIEW                                                            //
    // ------------------------------------------------------------------------------------ //    

    getCurrentView : function () {
        return this.currentView;
    },

    getReflowingSequence : function () {
        return this.el;
    },

    getReadiumBookViewEl : function () {
        return $("#readium-book-view-el")[0];
    }

    // ------------------------------------------------------------------------------------ //
    // PRIVATE EVENT HANDLERS                                                               //
    // ------------------------------------------------------------------------------------ //

    // ------------------------------------------------------------------------------------ //
    //  "PRIVATE" HELPERS AND UTILITY METHODS                                               //
    // ------------------------------------------------------------------------------------ //
});