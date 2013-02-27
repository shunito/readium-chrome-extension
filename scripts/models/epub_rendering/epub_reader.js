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



        this.loadSpineItems(options.epubController, options.viewerSettings);
        this.renderPageView(2, false, undefined); // TEMPORARY
    },

    // ---- Public interface ------------------------------------------------------------------------

    nextPage : function () {

        var currentPageView = this.getCurrentPageView();
        if (currentPageView.onLastPage()) {
            this.goToNextPageView();
        }
        else {
            currentPageView.pages.goRight();
        }
    },

    previousPage : function () {

        var currentPageView = this.getCurrentPageView();
        if (currentPageView.onFirstPage()) {
            this.goToPreviousPageView();
        }
        else {
            currentPageView.pages.goLeft();
        }
    },


    // goToHref() <--- Probably not here, dereferencing hrefs can be in the epub controller thingy
    // goToCFI() <--- Hmm, not sure how to handle this exactly. 
    // goToSpineItem() <--- Gonna need this, for sure. 
    // goToId() <---- Supply a spine item for this one.




    // changeMargin()
    // changeFontSize()
    // changeTheme()
    // addSpine() ---- not sure about this. Maybe just do the initialize
    // toggleTOC() <---- I don't think this should actually be part of it


    // ------------------------------------------------------------------------------------ //  
    //  "PRIVATE" HELPERS                                                                   //
    // ------------------------------------------------------------------------------------ //  

    // spinePositionIsRendered()
    // renderSpinePosition()

    // Description: This method chooses the appropriate page view to load for individual 
    //   spine items, and sections of the spine. 
    loadSpineItems : function (epubController, viewerSettings) {

        var spineIndex;
        var currSpineItem; 
        var FXLStartIndex;
        var FXLEndIndex;
        for (spineIndex = 0; spineIndex <= this.epubSpine.length - 1; spineIndex++) {

            currSpineItem = this.epubSpine.at(spineIndex);

            // A fixed layout epub
            if (currSpineItem.isFixedLayout()) {

                FXLStartIndex = spineIndex;

                // Another loop to find the start and end index of the current FXL part of the spine
                spineIndex++;
                for (spineIndex; spineIndex <= this.epubSpine.length - 1; spineIndex++) {

                    currSpineItem = this.epubSpine.at(spineIndex);
                    if (currSpineItem.isFixedLayout()) {
                        FXLEndIndex = spineIndex;
                    }
                    else {
                        break;
                    }
                }

                // This is where the start and end index is passed to the method to load the FXL page view
            }
            // A scrolling epub
            else if (this.shouldScroll(epubController)) {

            }
            // A reflowable epub
            else {
                this.loadReflowableSpineItem(epubController, currSpineItem, viewerSettings);
            }
        }
    },

    goToNextPageView : function () {

        var nextPageViewIndex;
        if (this.hasNextPageView()) {
            nextPageViewIndex = this.get("currentPageView") + 1;
            this.renderPageView(nextPageViewIndex, false, undefined);
        }
    },

    goToPreviousPageView : function () {

        var previousPageViewIndex;
        if (this.hasPreviousPageView()) {
            previousPageViewIndex = this.get("currentPageView") - 1;
            this.renderPageView(previousPageViewIndex, true, undefined);
        }
    },

    numPageViews : function () {

        return Object.keys(this.get("renderedPageViews")).length;
    },

    hasNextPageView : function () {

        return this.get("currentPageView") < this.numPageViews() ? true : false;
    },

    hasPreviousPageView : function () {

        return this.get("currentPageView") > 0 ? true : false;
    },

    loadReflowableSpineItem : function (epubController, spineItem, viewerSettings) {

        view = new Readium.Views.ReflowablePaginationView({
                model : epubController,
                spineItemModel : spineItem,
                viewerModel : viewerSettings
            });
        this.get("renderedPageViews")[spineItem.get('spine_index')] = view;
    },

    renderPageView : function (pageViewIndex, renderLast, hashFragmentId) {

        this.set("currentPageView", pageViewIndex);
        this.get("renderedPageViews")[pageViewIndex].render(renderLast, hashFragmentId);
    },

    getCurrentPageView : function () {

        return this.get("renderedPageViews")[this.get("currentPageView")];
    },

    shouldScroll : function (epubController) {
        
        return epubController.get("pagination_mode") === "scrolling";
    },




    // initialize: function() {

    //     var self = this;
    //     this.model = this.get("book");
    //     this.zoomer = new Readium.Views.FixedLayoutBookZoomer();
    //     this.model.on("change:pagination_mode", function() { self.renderSpineItems(); });       
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