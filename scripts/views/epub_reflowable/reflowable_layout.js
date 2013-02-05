
Readium.Views.ReflowableLayout = Backbone.Model.extend({

    initialize: function (options) {
        // make sure we have proper vendor prefixed props for when we need them
    },

    // ------------------------------------------------------------------------------------ //
    //  "PUBLIC" METHODS (THE API)                                                          //
    // ------------------------------------------------------------------------------------ //

    initializeContentDocument : function (epubContentDocument, epubCFIs, currSpinePosition, readiumFlowingContent, packageDocument, bindingTemplate, linkClickHandler, handlerContext, currentTheme, flowingWrapper, readiumFlowingContent, keydownHandler) {

        var triggers;
        var lastPageElementId = this.injectCFIElements(
            epubContentDocument, 
            epubCFIs, 
            currSpinePosition
            );

        this.applyBindings( readiumFlowingContent, epubContentDocument, packageDocument, bindingTemplate );
        this.applySwitches( epubContentDocument, readiumFlowingContent ); 
        this.injectMathJax(epubContentDocument);
        this.injectLinkHandler(epubContentDocument, linkClickHandler, handlerContext);
        triggers = this.parseTriggers(epubContentDocument);
        this.applyTriggers(epubContentDocument, triggers);
        $(epubContentDocument).attr('title', Acc.page + ' - ' + Acc.title);

        this.injectTheme(
            currentTheme, 
            epubContentDocument, 
            flowingWrapper
        );

        this.injectKeydownHandler(
            readiumFlowingContent, 
            keydownHandler, 
            handlerContext
        );

        return lastPageElementId;
    },

    paginateContentDocument : function (readiumBookViewEl, spineDivider, isTwoUp, offsetDir, epubContentDocument, readiumFlowingContent, flowingWrapper, firstPageOffset, currentPages, ppd, currentMargin, fontSize) {

        this.toggleSyntheticLayout(
            readiumBookViewEl, 
            spineDivider, 
            isTwoUp
            );

        var page = this.adjustIframeColumns(
            offsetDir, 
            epubContentDocument, 
            readiumFlowingContent, 
            flowingWrapper, 
            isTwoUp, 
            firstPageOffset, 
            currentPages, 
            ppd, 
            currentMargin
            );

        var numPages = this.setFontSize(
            fontSize, 
            epubContentDocument, 
            isTwoUp
            );

        return [numPages, page];
    },

    injectTheme : function (currentTheme, epubContentDocument, flowingWrapper) {

        var theme = currentTheme;
        if (theme === "default") {
            theme = "default-theme";
        }

        $(epubContentDocument).css({
            "color": this.themes[theme]["color"],
            "background-color": this.themes[theme]["background-color"]
        });
        
        // stop flicker due to application for alternate style sheets
        // just set content to be invisible
        $(flowingWrapper).css("visibility", "hidden");
        this.activateEPubStyle(epubContentDocument, currentTheme);

        // wait for new stylesheets to parse before setting back to visible
        setTimeout(function() {
            $(flowingWrapper).css("visibility", "visible"); 
        }, 100);
    },

    resetEl : function (epubContentDocument, readiumBookViewEl, spineDivider, pageWrap, zoomer) {

        $("body", epubContentDocument).removeClass("apple-fixed-layout");
        $(readiumBookViewEl).attr("style", "");
        $(readiumBookViewEl).toggleClass("two-up", false);
        $(spineDivider).toggle(false);
        zoomer.reset();

        $(pageWrap).css({
            "position": "relative",
            "right": "0px", 
            "top": "0px",
            "-webkit-transform": "scale(1.0) translate(0px, 0px)"
        });
    },

    // ------------------------------------------------------------------------------------ //
    //  PRIVATE HELPERS                                                                     //
    // ------------------------------------------------------------------------------------ //

    getColumnAxisCssName : function () {
        var columnAxisName = Modernizr.prefixed('columnAxis') || 'columnAxis';
        return this.createCssPropertyName(columnAxisName);
    },

    getColumnGapCssName : function () {
        var columnGapName = Modernizr.prefixed('columnGap') || 'columnGap';
        return this.createCssPropertyName(columnGapName);
    },

    getColumnWidthCssName : function () {
        var columnWidthName = Modernizr.prefixed('columnWidth') || 'columnWidth';
        return this.createCssPropertyName(columnWidthName);
    },

    createCssPropertyName : function (modernizrName) {

        return modernizrName.replace(/([A-Z])/g, function (modernizrName, m1) {  
            return '-' + m1.toLowerCase(); 
        }).replace(/^ms-/,'-ms-');
    },

    // ------------------------------------------------------------------------------------ //
    //  PRIVATE METHODS FOR INITIALIZING EPUB CONTENT DOCUMENT CONTAINER                    //
    // ------------------------------------------------------------------------------------ //

    injectCFIElements : function (epubContentDocument, epubCFIs, currSpinePosition) {

        var that = this;
        var contentDocument;
        var epubCFIs;
        var lastPageElementId;

        // Get the content document (assumes a reflowable publication)
        contentDocument = epubContentDocument;

        // TODO: Could check to make sure the document returned from the iframe has the same name as the 
        //   content document specified by the href returned by the CFI.

        // Inject elements for all the CFIs that reference this content document
        epubCFIs = epubCFIs;
        _.each(epubCFIs, function (cfi, key) {

            if (cfi.contentDocSpinePos === currSpinePosition) {

                try {
                    
                    EPUBcfi.Interpreter.injectElement(
                        key,
                        contentDocument.parentNode,
                        cfi.payload,
                        ["cfi-marker", "audiError"],
                        [],
                        ["MathJax_Message"]);

                    if (cfi.type === "last-page") {
                        lastPageElementId = $(cfi.payload).attr("id");
                    }
                } 
                catch (e) {

                    console.log("Could not inject CFI");
                }
            }
        });

        // This will be undefined unless there is a "last-page" element injected into the page
        return lastPageElementId;
    },

    // REFACTORING CANDIDATE: It looks like this could go on the package document itself
    getBindings: function (packageDocument) {
        var packDoc = packageDocument;
        var bindings = packDoc.get('bindings');
        return bindings.map(function(binding) {
            binding.selector = 'object[type="' + binding.media_type + '"]';
            binding.url = packDoc.getManifestItemById(binding.handler).get('href');
            binding.url = packDoc.resolveUri(binding.url);
            return binding;
        })
    },

    applyBindings: function (readiumFlowingContent, epubContentDocument, packageDocument, bindingTemplate) {

        var bindings = this.getBindings(packageDocument);
        var i = 0;
        for(var i = 0; i < bindings.length; i++) {
            $(bindings[i].selector, epubContentDocument.parentNode).each(function() {
                var params = [];
                var $el = $(readiumFlowingContent);
                var data = $el.attr('data');
                var url;
                params.push("src=" + packageDocument.resolveUri(data));
                params.push('type=' + bindings[i].media_type);
                url = bindings[i].url + "?" + params.join('&');
                var content = $(bindingTemplate({}));
                // must set src attr separately
                content.attr('src', url);
                $el.html(content);
            });
        }
    },

    applyTriggers: function (epubContentDocument, triggers) {
        for(var i = 0 ; i < triggers.length; i++) {
            triggers[i].subscribe(epubContentDocument.parentNode);
        }
    },

    // Description: For reflowable content we only add what is in the body tag.
    //   Lots of times the triggers are in the head of the dom
    parseTriggers: function (epubContentDocument) {
        var triggers = [];
        $('trigger', epubContentDocument.parentNode).each(function() {
            
            triggers.push(new Readium.Models.Trigger(epubContentDocument.parentNode) );
        });
        
        return triggers;
    },

    // Description: Parse the epub "switch" tags and hide
    //   cases that are not supported
    applySwitches: function (epubContentDocument, readiumFlowingContent) {

        // helper method, returns true if a given case node
        // is supported, false otherwise
        var isSupported = function(caseNode) {

            var ns = caseNode.attributes["required-namespace"];
            if(!ns) {
                // the namespace was not specified, that should
                // never happen, we don't support it then
                console.log("Encountered a case statement with no required-namespace");
                return false;
            }
            // all the xmlns's that readium is known to support
            // TODO this is going to require maintanence
            var supportedNamespaces = ["http://www.w3.org/1998/Math/MathML"];
            return _.include(supportedNamespaces, ns);
        };

        $('switch', epubContentDocument.parentNode).each(function(ind) {
            
            // keep track of whether or now we found one
            var found = false;

            $('case', readiumFlowingContent).each(function() {

                if( !found && isSupported(readiumFlowingContent) ) {
                    found = true; // we found the node, don't remove it
                }
                else {
                    $(readiumFlowingContent).remove(); // remove the node from the dom
                }
            });

            if(found) {
                // if we found a supported case, remove the default
                $('default', readiumFlowingContent).remove();
            }
        })
    },

    // inject mathML parsing code into an iframe
    injectMathJax: function (epubContentDocument) {

        var doc, script, head;
        doc = epubContentDocument.parentNode;
        head = doc.getElementsByTagName("head")[0];
        // if the content doc is SVG there is no head, and thus
        // mathjax will not be required
        if(head) {
            script = doc.createElement("script");
            script.type = "text/javascript";
            script.src = MathJax.Hub.config.root+"/MathJax.js?config=readium-iframe";
            head.appendChild(script);
        }
    },

    injectLinkHandler: function (epubContentDocument, linkClickHandler, handlerContext) {

        $('a', epubContentDocument).click(function (e) {
            linkClickHandler.call(handlerContext, e);
        });
    },

    injectKeydownHandler : function (readiumFlowingContent, keydownHandler, handlerContext) {

        $(readiumFlowingContent).contents().keydown(function (e) {
            keydownHandler.call(handlerContext, e);
        });
    },

    // ------------------------------------------------------------------------------------ //
    //  PRIVATE METHODS FOR PAGINATING EPUB REFLOWABLE CONTENT DOCUMENT
    // ------------------------------------------------------------------------------------ //

    // Description: Activates a style set for the ePub, based on the currently selected theme. At present, 
    //   only the day-night alternate tags are available as an option.  
    activateEPubStyle : function (bookDom, currentTheme) {

        var selector;
        
        // Apply night theme for the book; nothing will be applied if the ePub's style sheets do not contain a style
        // set with the 'night' tag
        if (currentTheme === "night-theme") {

            selector = new Readium.Models.AlternateStyleTagSelector;
            bookDom = selector.activateAlternateStyleSet(["night"], bookDom);

        }
        else {

            selector = new Readium.Models.AlternateStyleTagSelector;
            bookDom = selector.activateAlternateStyleSet([""], bookDom);
        }
    },

    // Description: Changes the html to make either 1 or 2 pages visible in their iframes
    toggleSyntheticLayout : function (readiumBookViewEl, spineDivider, isTwoUp) {

        $(readiumBookViewEl).toggleClass("two-up", isTwoUp);
        $(spineDivider).toggle(isTwoUp);
    },

    // Description: calculate the number of pages in the current section,
    //   based on section length : page size ratio
    calcNumPages : function (epubContentDocument, isTwoUp, offsetDir) {

        var body, offset, width, num;
        
        // get a reference to the dom body
        body = epubContentDocument;

        // cache the current offset 
        offset = body.style[offsetDir];

        // set the offset to 0 so that all overflow is part of
        // the scroll width
        body.style[offsetDir] = "0px";

        // grab the scrollwidth => total content width
        width = epubContentDocument.scrollWidth;

        // reset the offset to its original value
        body.style[offsetDir] = offset;

        // perform calculation and return result...
        num = Math.floor( (width + this.gap_width) / (this.gap_width + this.page_width) );

        // in two up mode, always set to an even number of pages
        if( num % 2 === 0 && isTwoUp) {
            //num += 1;
        }
        return num;
    },

    getFrameWidth : function (flowingWrapperWidth, currentMargin, isTwoUp) {

        var width;
        var margin = currentMargin;
        if (margin === 1) {
            isTwoUp ? (width = 0.95) : (width = 0.90);
        }
        else if (margin === 2) {
            isTwoUp ? (width = 0.89) : (width = 0.80);
        }
        else if (margin === 3) {
            isTwoUp ? (width = 0.83) : (width = 0.70); 
        }
        else if (margin === 4) {
            isTwoUp ? (width = 0.77) : (width = 0.60); 
        }
        else {
            isTwoUp ? (width = 0.70) : (width = 0.50); 
        }
        
        return Math.floor( flowingWrapperWidth * width );
    },

    // Rationale: on iOS frames are automatically expanded to fit the content dom
    //   thus we cannot use relative size for the iframe and must set abs 
    //   pixel size
    setFrameSize : function (flowingWrapperWidth, flowingWrapperHeight, readiumFlowingContent, currentMargin, isTwoUp) {

        var width = this.getFrameWidth(flowingWrapperWidth, currentMargin, isTwoUp).toString() + "px";

        var height = flowingWrapperHeight.toString() + "px"; 

        $(readiumFlowingContent).attr("width", width);
        $(readiumFlowingContent).attr("height", height);
        $(readiumFlowingContent).css("width", width);
        $(readiumFlowingContent).css("height", height);
    },

    getBodyColumnCss : function () {
        var css = {};
        css[this.getColumnAxisCssName()] = "horizontal";
        css[this.getColumnGapCssName()] = this.gap_width.toString() + "px";
        css[this.getColumnWidthCssName()] = this.page_width.toString() + "px";
        css["padding"] = "0px";
        css["margin"] = "0px";
        css["position"] = "absolute";
        css["width"] = this.page_width.toString() + "px";
        css["height"] = this.frame_height.toString() + "px";
        return css;
    },

    // Description: This method accounts for the case in which the page-spread-* property is set on the current 
    //   content document. When this property is set, it requires that the first page of content is offset by 1, 
    //   creating a blank page as the first page in a synthetic spread.
    accountForOffset : function (readiumFlowingContent, isTwoUp, firstPageIsOffset, currentPages, ppd) {

        var $reflowableIframe = $(readiumFlowingContent);

        if (isTwoUp) {
            // If the first page is offset, adjust the window to only show one page
            var firstPageIsOffset = firstPageIsOffset;
            var firstPageOffsetValue;

            // Rationale: A current page of [0, 1] indicates that the current display is synthetic, and that 
            //   only the first page should be showing in that display
            var onFirstPage = 
                currentPages[0] === 0 &&
                currentPages[1] === 1 
                ? true : false;

            if (firstPageIsOffset && onFirstPage) {

                if (ppd === "rtl") {

                    firstPageOffset = -(2 * (this.page_width + this.gap_width));
                    $reflowableIframe.css("margin-left", firstPageOffset + "px");
                }
                // Left-to-right pagination
                else {

                    firstPageOffset = this.page_width + (this.gap_width * 2);
                    $reflowableIframe.css("margin-left", firstPageOffset + "px");
                }

                return 1;
            }
            else {

                $reflowableIframe.css("margin-left", "0px");
                return currentPages[0];
            }
        }
        else {

            $reflowableIframe.css("margin-left", "0px");
            return currentPages[0];
        }
    },

    adjustIframeColumns : function (offsetDir, epubContentDocument, readiumFlowingContent, flowingWrapper, isTwoUp, firstPageOffset, currentPages, ppd, currentMargin ) {

        var prop_dir = offsetDir;
        var $frame = $(readiumFlowingContent);
        var page;

        this.setFrameSize($(flowingWrapper).width(), $(flowingWrapper).height(), readiumFlowingContent, currentMargin, isTwoUp);

        this.frame_width = parseInt($frame.width(), 10);
        this.frame_height = parseInt($frame.height(), 10);
        this.gap_width = Math.floor(this.frame_width / 7);
        if (isTwoUp) {
            this.page_width = Math.floor((this.frame_width - this.gap_width) / 2);
        }
        else {
            this.page_width = this.frame_width;
        }

        // it is important for us to make sure there is no padding or
        // margin on the <html> elem, or it will mess with our column code
        $(epubContentDocument).css( this.getBodyColumnCss() );

        page = this.accountForOffset(readiumFlowingContent, isTwoUp, firstPageOffset, currentPages, ppd);
        return page;
    },

    // Rationale: sadly this is just a reprint of what is already in the
    //   themes stylesheet. It isn't very DRY but the implementation is
    //   cleaner this way
    themes: {
        "default-theme": {
            "background-color": "white",
            "color": "black",
            "mo-color": "#777"
        },

        "vancouver-theme": {
            "background-color": "#DDD",
            "color": "#576b96",
            "mo-color": "#777"
        },

        "ballard-theme": {
            "background-color": "#576b96",
            "color": "#DDD",
            "mo-color": "#888"
        },

        "parchment-theme": {
            "background-color": "#f7f1cf",
            "color": "#774c27",
            "mo-color": "#eebb22"
        },

        "night-theme": {
            "background-color": "#141414",
            "color": "white",
            "mo-color": "#666"
        }
    },

    setFontSize : function (fontSize, epubContentDocument, isTwoUp) {

        var size = fontSize / 10;
        $(epubContentDocument).css("font-size", size + "em");

        // the content size has changed so recalc the number of 
        // pages
        return this.calcNumPages(epubContentDocument, isTwoUp);
    }
});