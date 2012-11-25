
Readium.Views.ReflowableElementInfo = Backbone.Model.extend({

    initialize : function () {},

    // ------------------------------------------------------------------------------------ //
    //  "PUBLIC" METHODS (THE API)                                                          //
    // ------------------------------------------------------------------------------------ //

    // Layout math
    // Used: MediaOverlayController
    findVisiblePageElements: function(view, body, document) {

        var $elements = $(body).find("[id]");
        var doc = $("#readium-flowing-content", document).contents()[0].documentElement;
        var doc_top = 0;
        var doc_left = 0;
        var doc_right = doc_left + $(doc).width();
        var doc_bottom = doc_top + $(doc).height();
        
        var visibleElms = this.filterElementsByPosition(view, $elements, doc_top, doc_bottom, doc_left, doc_right);
            
        return visibleElms;
    },
    // findVisiblePageElements: function() {

    //     var $elements = $(this.getBody()).find("[id]");
    //     var doc = $("#readium-flowing-content").contents()[0].documentElement;
    //     var doc_top = 0;
    //     var doc_left = 0;
    //     var doc_right = doc_left + $(doc).width();
    //     var doc_bottom = doc_top + $(doc).height();
        
    //     var visibleElms = this.filterElementsByPosition($elements, doc_top, doc_bottom, doc_left, doc_right);
            
    //     return visibleElms;
    // },

    // returns all the elements in the set that are inside the box
    // Layout math
    // Used: this
    filterElementsByPosition: function(view, $elements, documentTop, documentBottom, documentLeft, documentRight) {
        
        var $visibleElms = $elements.filter(function(idx) {
            var elm_top = $(view.el).offset().top;
            var elm_left = $(view.el).offset().left;
            var elm_right = elm_left + $(view.el).width();
            var elm_bottom = elm_top + $(view.el).height();
            
            var is_ok_x = elm_left >= documentLeft && elm_right <= documentRight;
            var is_ok_y = elm_top >= documentTop && elm_bottom <= documentBottom;
            
            return is_ok_x && is_ok_y;
        });  

        return $visibleElms;
    },
    // filterElementsByPosition: function($elements, documentTop, documentBottom, documentLeft, documentRight) {
        
    //     var $visibleElms = $elements.filter(function(idx) {
    //         var elm_top = $(this).offset().top;
    //         var elm_left = $(this).offset().left;
    //         var elm_right = elm_left + $(this).width();
    //         var elm_bottom = elm_top + $(this).height();
            
    //         var is_ok_x = elm_left >= documentLeft && elm_right <= documentRight;
    //         var is_ok_y = elm_top >= documentTop && elm_bottom <= documentBottom;
            
    //         return is_ok_x && is_ok_y;
    //     });  

    //     return $visibleElms;
    // },

    // ------------------------------------------------------------------------------------ //
    //  "PRIVATE" HELPERS                                                                   //
    // ------------------------------------------------------------------------------------ //


});