Readium.Models.EpubReader = Backbone.Model.extend({

    defaults : {
        "renderedPageViews" : {},
        "currentPageView" : 1
    },

    initialize : function (attributes, options) {

        var that = this;
        this.epubSpine = this.get("model");


        // Rendering strategy option
        // 

        // Render a number of page views based on strategy: STATIC STRATEGY ALL!! PEW PEW PEW PEW
        this.epubSpine.each(function (spineItem) {
            that.loadReflowableSpineItem(options.epubController, spineItem, options.viewerSettings);
        });

        this.renderPageView(2, false, undefined); // TEMPORARY
        this.set("currentPageView", 2);

        // Apply the viewer settings to each view that has been rendered
    },

    // ---- Public interface

    // nextPage()
    nextPage : function () {

        var currentPageView = this.getCurrentPageView();

        // If current view is not at the end of it's pages, delegate to turn page

        // Not sure if this is required anymore 
        // this.epubController.set("hash_fragment", undefined);

        // if the number of pages has been reached
        if (currentPageView.onLastPage()) {
            this.goToNextPageView();
            // this.epubController.goToNextSection();
        }
        else {
            currentPageView.pages.goRight();
        }
    },

    // previousPage()

    previousPage : function () {

        var currentPageView = this.getCurrentPageView();

        // If current view is not at the end of it's pages, delegate to turn page

        // Not sure if this is required anymore 
        // this.epubController.set("hash_fragment", undefined);

        // if the number of pages has been reached
        if (currentPageView.onFirstPage()) {
            this.goToPreviousPageView();
            // this.epubController.goToNextSection();
        }
        else {
            currentPageView.pages.goLeft();
        }
    },
    // goToHref()
    // goToCFI()
    // goToSpineItem()
    // changeMargin()
    // changeFontSize()
    // changeTheme()
    // addSpine() ---- not sure about this. Maybe just do the initialize


    // ---- Private helpers -----------------------------------------------------------------------------

    // spinePositionIsRendered()
    // renderSpinePosition()


    // nextPageView()
    goToNextPageView : function () {

        // Check if it has one - Confirm that index bases are the same here
        var hasNextPageView = this.get("currentPageView") < this.numPageViews() ? true : false;
        var nextPageViewIndex;

        if (hasNextPageView) {
            nextPageViewIndex = this.get("currentPageView") + 1;
            this.set("currentPageView", nextPageViewIndex);
            this.renderPageView(nextPageViewIndex, false, undefined);
        }
    },

    // previousPageView()
    goToPreviousPageView : function () {

        // Check if it has one - Confirm that index bases are the same here
        var hasPreviousPageView = this.get("currentPageView") > 0 ? true : false;
        var previousPageViewIndex;

        if (hasPreviousPageView) {
            previousPageViewIndex = this.get("currentPageView") - 1;
            this.set("currentPageView", previousPageViewIndex);
            this.renderPageView(previousPageViewIndex, true, undefined);
        }
    },

    numPageViews : function () {

        return Object.keys(this.get("renderedPageViews")).length;
    },


    // hasNextPageView()
    // hasPreviousPageView()

    loadReflowableSpineItem : function (epubController, spineItem, viewerSettings) {

        view = new Readium.Views.ReflowablePaginationView({
                model : epubController,
                spineItemModel : spineItem,
                viewerModel : viewerSettings
            });
        this.get("renderedPageViews")[spineItem.get('spine_index')] = view;
    },

    renderPageView : function (pageViewIndex, renderLast, hashFragmentId) {

        this.get("renderedPageViews")[pageViewIndex].render(renderLast, hashFragmentId);
    },

    getCurrentPageView : function () {

        return this.get("renderedPageViews")[this.get("currentPageView")];
    }











    // initialize: function() {

    //     var self = this;
    //     this.model = this.get("book");
    //     this.zoomer = new Readium.Views.FixedLayoutBookZoomer();
    //     this.model.on("change:pagination_mode", function() { self.renderSpineItems(); });       
    // },

    // // Description: Determine what the current spine item is and render it
    // //   Updates which spine items have been rendered in an array of rendered spine items
    // renderSpineItems: function(renderToLast, hashFragmentId) {
    //     var book = this.model;
    //     var that = this;
    //     var rendered_spine_positions = [];

    //     // clean up the old view if there is one
    //     if (this.v) {
    //         this.v.destruct();
    //     }

    //     // Spine items as found in the package document can have attributes that override global settings for the ebook. This 
    //     // requires checking/creating the correct pagination strategy for each spine item
    //     var spineItem = book.getCurrentSection();
    //     if (spineItem.isFixedLayout()) {

    //         this.v = new Readium.Views.FixedPaginationView({model: book, zoomer: this.zoomer});
    //     }
    //     // A scrolling epub
    //     else if (this.shouldScroll()) {

    //         this.v = new Readium.Views.ScrollingPaginationView({model: book, zoomer: this.zoomer});
    //     }
    //     // A reflowable epub
    //     else {

    //         // Create viewer model here

    //         // Get the spine item model here
    //         var viewerController = new Readium.Models.ViewerController({
    //             "two_up" : book.get("two_up"),
    //             "current_theme" : book.get("current_theme"),
    //             "current_margin" : book.get("current_margin"),
    //             "font_size" : book.get("font_size"),
    //             "toc_visible" : book.get("toc_visible")
    //             });

    //         this.v = new Readium.Views.ReflowablePaginationView({ 
    //             model : book, 
    //             spineItemModel : book.getCurrentSection(), // Passing a spine item here
    //             viewerModel : viewerController
    //         });
    //     }

    //     this.rendered_spine_positions = this.v.render(!!renderToLast, hashFragmentId);
    //     return this.rendered_spine_positions;
    // },

    // // ------------------------------------------------------------------------------------ //
    // //  "PRIVATE" HELPERS                                                                   //
    // // ------------------------------------------------------------------------------------ //  

    // shouldScroll: function() {
    //     return this.model.get("pagination_mode") == "scrolling";
    // },

    // updatePaginationSettings: function() {
    //     if (this.get("pagination_mode") == "facing") {
    //         this.set("two_up", true);
    //     } else {
    //         this.set("two_up", false);
    //     }
    // },

    // toggleFullScreen: function() {
    //     var fullScreen = this.get("full_screen");
    //     this.set({full_screen: !fullScreen});
    // },

    // increaseFont: function() {
    //     var size = this.get("font_size");
    //     this.set({font_size: size + 1})
    // },

    // decreaseFont: function() {
    //     var size = this.get("font_size");
    //     this.set({font_size: size - 1})
    // },

    // toggleToc: function() {
    //     var vis = this.get("toc_visible");
    //     this.set("toc_visible", !vis);
    // },

    // // Description: Obtains the href and hash (if it exists) to set as the current "position"
    // //    of the epub. Any views and models listening to epub attributes are informed through
    // //    the backbone event broadcast.
    // // Arguments (
    // //   href (URL): The url and hash fragment that indicates the position in the epub to set as
    // //   the epub's current position. This argument either has to be the absolute path of the resource in 
    // //   the filesystem, or the path of the resource RELATIVE to the package document.
    // //   When a URI is resolved by the package document model, it assumes that any relative path for a resource is
    // //   relative to the package document.
    // // )
    // goToHref: function(href) {
    //     // URL's with hash fragments require special treatment, so
    //     // first thing is to split off the hash frag from the rest
    //     // of the url:
    //     var splitUrl = href.match(/([^#]*)(?:#(.*))?/);

    //     // Check if the hash contained a CFI reference
    //     if (splitUrl[2] && splitUrl[2].match(/epubcfi/)) {

    //         this.handleCFIReference(splitUrl[2]);
    //     }
    //     // The href is a standard hash fragment
    //     else {

    //         // REFACTORING CANDIDATE: Move this into its own "private" method
    //         if(splitUrl[1]) {
    //             var spine_pos = this.packageDocument.spineIndexFromHref(splitUrl[1]);

    //             if (this.get("media_overlay_controller").mo &&
    //                 this.get("media_overlay_controller").mo.get("has_started_playback")) {
                    
    //                 this.setSpinePos(spine_pos, false, false, splitUrl[2]);
    //             }
    //             else {
    //                 this.setSpinePos(spine_pos, false, true, splitUrl[2]);  
    //             }   

    //             this.set("hash_fragment", splitUrl[2]);
    //         }
    //     }
    // },

    // // Note: "Section" actually refers to a spine item
    // getCurrentSection: function(offset) {
    //     if(!offset) {
    //         offset = 0;
    //     }
    //     var spine_pos = this.get("spine_position") + offset;
    //     return this.packageDocument.getSpineItem(spine_pos);
    // },

    //     restorePosition: function() {
    //     var pos = Readium.Utils.getCookie(this.epub.get("key"));
    //     return parseInt(pos, 10) || this.packageDocument.getNextLinearSpinePostition();
    // },

    // savePosition: function() {
    //     Readium.Utils.setCookie(this.epub.get("key"), this.get("spine_position"), 365);
    // },

    // resolvePath: function(path) {
    //     return this.packageDocument.resolvePath(path);
    // },

    // hasNextSection: function() {
    //     var start = this.get("spine_position");
    //     return this.packageDocument.getNextLinearSpinePostition(start) > -1;
    // },

    // hasPrevSection: function() {
    //     var start = this.get("spine_position");
    //     return this.packageDocument.getPrevLinearSpinePostition(start) > -1;
    // },

    // // goes the next linear section in the spine. Non-linear sections should be
    // // skipped as per [the spec](http://idpf.org/epub/30/spec/epub30-publications.html#sec-itemref-elem)
    // // REFACTORING CANDIDATE: I think this is a public method and should be moved to the public section
    // goToNextSection: function() {

    //     var cp = this.get("spine_position");
    //     var pos = this.packageDocument.getNextLinearSpinePostition(cp);
    //     if(pos > -1) {
    //         this.setSpinePos(pos, false, false);
    //     }
    // },
    
    // // goes the previous linear section in the spine. Non-linear sections should be
    // // skipped as per [the spec](http://idpf.org/epub/30/spec/epub30-publications.html#sec-itemref-elem)
    // // REFACTORING CANDIDATE: I think this is a public method and should be moved to the public section
    // goToPrevSection: function() {
    //     var cp = this.get("spine_position");
    //     var pos = this.packageDocument.getPrevLinearSpinePostition(cp);
    //     if(pos > -1) {
    //         this.setSpinePos(pos, true, false);
    //     }
    // },

    // // Description: Sets the current spine position for the epub, checking if the spine
    // //   item is already rendered. 
    // // Arguments (
    // //   pos (integer): The index of the spine element to set as the current spine position
    // //   goToLastPageOfSection (boolean): Set the viewer to the last page of the spine item (content document/svg)
    // //     that will be loaded.
    // //   reRenderSpinePos (boolean): Force the spine item to be re-rendered, regardless of whether it is the 
    // //     currently set spine item.
    // //   goToHashFragmentId: Set the view position to the element with the specified id. This parameter 
    // //     overrides the behaviour of "goToLastPageOfSection"
    // //  )
    // // REFACTORING CANDIDATE: The abstraction here is getting sloppy, as goToHashFragmentId overrides goToLastPageOfSection
    // //   and generally, the behaviour of this method is not entirely clear from its name. Perhaps a simple renaming of the
    // //   method would suffice? Additionally, the internal impementation could be reviewed to tightened up (comments below).
    // setSpinePos: function(pos, goToLastPageOfSection, reRenderSpinePos, goToHashFragmentId) {

    //     // check for invalid spine position
    //     if (pos < 0 || pos >= this.packageDocument.spineLength()) {
            
    //         return;
    //     }

    //     var spineItems = this.get("rendered_spine_items");
    //     var spinePosIsRendered = spineItems.indexOf(pos) >=0 ? true : false;
    //     var renderedItems;

    //     // REFACTORING CANDIDATE: There is a somewhat hidden dependency here between the paginator
    //     //   and the setting of the spine_position. The pagination strategy selector re-renders based on the currently
    //     //   set spine_position on this model. The pagination strategy selector has a reference to this model, which is 
    //     //   how it accesses the new spine_position, through the "getCurrentSection" method. 
    //     //   This would be clearer if the spine_position to set were passed explicitly to the paginator. 
    //     this.set("spine_position", pos);

    //     // REFACTORING CANDIDATE: This event should only be triggered for fixed layout sections
    //     this.trigger("FXL_goToPage");

    //     // Render the new spine position if it is not already rendered. Otherwise, check if a re-render should
    //     // be forced (in case a new CFI has to be injected, for example). 
    //     if (!spinePosIsRendered) {

    //         renderedItems = this.paginator.renderSpineItems(goToLastPageOfSection, goToHashFragmentId);
    //         this.set("rendered_spine_items", renderedItems);
    //     }
    //     else {

    //         if (reRenderSpinePos) {

    //             this.removeLastPageCFI();
    //             renderedItems = this.paginator.renderSpineItems(goToLastPageOfSection, goToHashFragmentId);
    //             this.set("rendered_spine_items", renderedItems);                
    //         }
    //         else {

    //             if (!this.isFixedLayout() && goToHashFragmentId) {
    //                 this.paginator.v.goToHashFragment(goToHashFragmentId);
    //             }
    //         }
    //     }
    // },

    // // Private helpers


});