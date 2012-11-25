
Readium.Views.ReflowableLayout = Backbone.Model.extend({

    // ------------------------------------------------------------------------------------ //
    //  "PUBLIC" METHODS (THE API)                                                          //
    // ------------------------------------------------------------------------------------ //

    initialize: function(options) {
    },

    iframeLoadCallback: function(e, dom, packageDocument, bindingTemplate, goLeftHandler, goRightHandler, linkClickHandler, handlerContext) {
        
        this.applyBindings( $(e.srcElement).contents(), dom, packageDocument, bindingTemplate);
        this.applySwitches( $(e.srcElement).contents(), dom );
        this.addSwipeHandlers( $(e.srcElement).contents(), goLeftHandler, goRightHandler, handlerContext );
        this.injectMathJax(e.srcElement);
        this.injectLinkHandler(e.srcElement, linkClickHandler, handlerContext);
        var trigs = this.parseTriggers(e.srcElement.contentDocument, e.srcElement.contentDocument);
        this.applyTriggers(e.srcElement.contentDocument, trigs);
        $(e.srcElement).attr('title', Acc.page + ' - ' + Acc.title);
    },
    
    // Description: Activates a style set for the ePub, based on the currently selected theme. At present, 
    //   only the day-night alternate tags are available as an option.  
    activateEPubStyle: function(bookDom, currentTheme) {

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

    // REFACTORING CANDIDATE: This method could use a better name. The purpose of this method is to make one or two 
    //   pages of an epub visible. "setUpMode" seems non-specific. 
    // Description: Changes the html to make either 1 or 2 pages visible in their iframes
    setUpMode: function(reflowableDom, isTwoUp) {
        var two_up = isTwoUp;
        $(reflowableDom).toggleClass("two-up", two_up);
        $('#spine-divider', reflowableDom).toggle(two_up);
    },

    // ------------------------------------------------------------------------------------ //
    //  "PRIVATE" HELPERS                                                                   //
    // ------------------------------------------------------------------------------------ //

    // REFACTORING CANDIDATE: This is a temporary method to encapsulate some logic from the reflowable view that is
    //   also duplicated in the adjustIframeColumns method in this model
    accountForOffset : function (document, isTwoUp, firstPageIsOffset, currentPages, ppd) {

        var $reflowableIframe = $("#readium-flowing-content", document);
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
    // accountForOffset : function () {

    //     var $reflowableIframe = that.$("#readium-flowing-content");
    //     if (that.model.get("two_up")) {
    //         // If the first page is offset, adjust the window to only show one page
    //         var firstPageIsOffset = that.model.getCurrentSection().firstPageOffset();
    //         var firstPageOffsetValue;

    //         // Rationale: A current page of [0, 1] indicates that the current display is synthetic, and that 
    //         //   only the first page should be showing in that display
    //         var onFirstPage = 
    //             that.pages.get("current_page")[0] === 0 &&
    //             that.pages.get("current_page")[1] === 1 
    //             ? true : false;

    //         if (firstPageIsOffset && onFirstPage) {

    //             if (that.model.epub.get("page_prog_dir") === "rtl") {

    //                 firstPageOffset = -(2 * (that.page_width + that.gap_width));
    //                 $reflowableIframe.css("margin-left", firstPageOffset + "px");
    //             }
    //             // Left-to-right pagination
    //             else {

    //                 firstPageOffset = that.page_width + (that.gap_width * 2);
    //                 $reflowableIframe.css("margin-left", firstPageOffset + "px");
    //             }

    //             that.goToPage(1);
    //         }
    //         else {

    //             $reflowableIframe.css("margin-left", "0px");
    //             that.goToPage(that.pages.get("current_page")[0]);
    //         }
    //     }
    //     else {

    //         $reflowableIframe.css("margin-left", "0px");
    //         that.goToPage(that.pages.get("current_page")[0]);
    //     }

    //     that.savePosition();
    // },

    injectCFIElements : function (document, epubCFIs, currSpinePosition) {

        var that = this;
        var contentDocument;
        var epubCFIs;
        var lastPageElementId;

        // Get the content document (assumes a reflowable publication)
        contentDocument = $("#readium-flowing-content", document).contents()[0];

        // TODO: Could check to make sure the document returned from the iframe has the same name as the 
        //   content document specified by the href returned by the CFI.

        // Inject elements for all the CFIs that reference this content document
        epubCFIs = epubCFIs;
        _.each(epubCFIs, function (cfi, key) {

            if (cfi.contentDocSpinePos === currSpinePosition) {

                try {
                    
                    EPUBcfi.Interpreter.injectElement(
                        key,
                        contentDocument,
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

    getFrameWidth: function(view, currentMargin, isTwoUp) {
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
        
        return Math.floor( $('#flowing-wrapper', view.$el).width() * width );
    },

    // Rationale: on iOS frames are automatically expanded to fit the content dom
    // thus we cannot use relative size for the iframe and must set abs 
    // pixel size
    // Layout logic
    // Used: this
    setFrameSize: function(view, currentMargin, isTwoUp) {
        var width = this.getFrameWidth(view, currentMargin, isTwoUp).toString() + "px";

        // REFACTORING CANDIDATE: the $el is no good
        var height = $('#flowing-wrapper', view.$el).height().toString() + "px"; 

        $('#readium-flowing-content', view.$el).attr("width", width);
        $('#readium-flowing-content', view.$el).attr("height", height);
        $('#readium-flowing-content', view.$el).css("width", width);
        $('#readium-flowing-content', view.$el).css("height", height);
    },

    getBodyColumnCss: function(view) {
        var css = {};
        css[view.cssColumAxis] = "horizontal";
        css[view.cssColumGap] = this.gap_width.toString() + "px";
        css[view.cssColumWidth] = this.page_width.toString() + "px";
        css["padding"] = "0px";
        css["margin"] = "0px";
        css["position"] = "absolute";
        css["width"] = this.page_width.toString() + "px";
        css["height"] = this.frame_height.toString() + "px";
        return css;
    },

    adjustIframeColumns: function(offsetDir, $flowingContent, body, isTwoUp, view, firstPageOffset, currentPages, ppd, currentMargin ) {
        var prop_dir = offsetDir;
        var $frame = $flowingContent;
        var page;

        this.setFrameSize(view, currentMargin, isTwoUp); // Move set frame size
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
        $(body).css( this.getBodyColumnCss(view) );

        // If the first page is offset, adjust the window to only show one page
        if (isTwoUp) {
            
            var firstPageIsOffset = firstPageOffset;
            var firstPageOffsetValue;

            // Rationale: A current page of [0, 1] indicates that the current display is synthetic, and that 
            //   only the first page should be showing in that display
            // REFACTORING CANDIDATE: This logic is similar to that in pageChangeHandler
            var onFirstPage = 
                currentPages[0] === 0 &&
                currentPages[1] === 1 
                ? true : false;

            if (firstPageIsOffset && onFirstPage) {

                if (ppd === "rtl") {

                    firstPageOffset = -(2 * (this.page_width + this.gap_width));
                    $frame.css("margin-left", firstPageOffset + "px");
                }
                // Left-to-right pagination
                else {

                    firstPageOffset = this.page_width + (this.gap_width * 2);
                    $frame.css("margin-left", firstPageOffset + "px");
                }

                page = 1;
            }
            else {

                $frame.css("margin-left", "0px");
                page = currentPages[0];
            }
        }
        else {

            $frame.css("margin-left", "0px");
            page = currentPages[0];
        }

        // this.pages.set("num_pages", this.reflowableLayout.calcNumPages(this.getBody(), this.model.get("two_up")));
        return [this.calcNumPages(body, isTwoUp), page];
        // this.goToPage(page);
    },

    injectTheme: function(currentTheme, body) {
        var theme = currentTheme;
        if (theme === "default") {
            theme = "default-theme";
        }

        $(body).css({
            "color": this.themes[theme]["color"],
            "background-color": this.themes[theme]["background-color"]
        });
        
        // stop flicker due to application for alternate style sheets
        // just set content to be invisible
        $("#flowing-wrapper", body).css("visibility", "hidden");
        this.activateEPubStyle(body, currentTheme);

        // wait for new stylesheets to parse before setting back to visible
        setTimeout(function() {
            $("#flowing-wrapper", body).css("visibility", "visible"); 
        }, 100);
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

    setFontSize: function(fontSize, body, isTwoUp) {
        var size = fontSize / 10;
        $(body).css("font-size", size + "em");

        // the content size has changed so recalc the number of 
        // pages
        return this.calcNumPages(body, isTwoUp);
    },

    // Description: we are using experimental styles so we need to 
    //   use modernizr to generate prefixes
    stashModernizrPrefixedProps: function(view) {
        var cssIfy = function(str) {
            return str.replace(/([A-Z])/g, function(str,m1){ 
                return '-' + m1.toLowerCase(); 
            }).replace(/^ms-/,'-ms-');
        };

        // ask modernizr for the vendor prefixed version
        view.columAxis =  Modernizr.prefixed('columnAxis') || 'columnAxis';
        view.columGap =  Modernizr.prefixed('columnGap') || 'columnGap';
        view.columWidth =  Modernizr.prefixed('columnWidth') || 'columnWidth';

        // we are interested in the css prefixed version
        view.cssColumAxis =  cssIfy(view.columAxis);
        view.cssColumGap =  cssIfy(view.columGap);
        view.cssColumWidth =  cssIfy(view.columWidth);
    },

    // Description: calculate the number of pages in the current section,
    //   based on section length : page size ratio
    calcNumPages: function(iframe, isTwoUp) {

        var body, offset, width, num;
        
        // get a reference to the dom body
        body = iframe;

        // cache the current offset 
        offset = body.style[this.offset_dir];

        // set the offset to 0 so that all overflow is part of
        // the scroll width
        body.style[this.offset_dir] = "0px";

        // grab the scrollwidth => total content width
        width = iframe.scrollWidth;

        // reset the offset to its original value
        body.style[this.offset_dir] = offset;

        // perform calculation and return result...
        num = Math.floor( (width + this.gap_width) / (this.gap_width + this.page_width) );

        // in two up mode, always set to an even number of pages
        if( num % 2 === 0 && isTwoUp) {
            //num += 1;
        }
        return num;
    },

    // -----------  Most of this is unique to the reflowable view --------------------- //

    getBindings: function(packageDocument) {
        var packDoc = packageDocument;
        var bindings = packDoc.get('bindings');
        return bindings.map(function(binding) {
            binding.selector = 'object[type="' + binding.media_type + '"]';
            binding.url = packDoc.getManifestItemById(binding.handler).get('href');
            binding.url = packDoc.resolveUri(binding.url);
            return binding;
        })
    },

    applyBindings: function(dom, reflowableDom, packageDocument, bindingTemplate) {
        var bindings = this.getBindings(packageDocument);
        var i = 0;
        for(var i = 0; i < bindings.length; i++) {
            $(bindings[i].selector, dom).each(function() {
                var params = [];
                var $el = $(reflowableDom);
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

    applyTriggers: function(dom, triggers) {
        for(var i = 0 ; i < triggers.length; i++) {
            triggers[i].subscribe(dom);
        }
    },

    // Description: For reflowable content we only add what is in the body tag.
    //   Lots of times the triggers are in the head of the dom
    parseTriggers: function(dom, reflowableDom) {
        var triggers = [];
        $('trigger', dom).each(function() {
            
            triggers.push(new Readium.Models.Trigger(reflowableDom) );
        });
        
        return triggers;
    },

    // Description: Parse the epub "switch" tags and hide
    //   cases that are not supported
    applySwitches: function(dom, reflowableDom) {

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

        $('switch', dom).each(function(ind) {
            
            // keep track of whether or now we found one
            var found = false;

            $('case', reflowableDom).each(function() {

                if( !found && isSupported(reflowableDom) ) {
                    found = true; // we found the node, don't remove it
                }
                else {
                    $(reflowableDom).remove(); // remove the node from the dom
                }
            });

            if(found) {
                // if we found a supported case, remove the default
                $('default', reflowableDom).remove();
            }
        })
    },
  
    addSwipeHandlers: function(dom, goLeftHandler, goRightHandler, handlerContext) {
        var that = this;
        $(dom).on("swipeleft", function(e) {
            e.preventDefault();
            goLeftHandler.call(handlerContext);
            
        });

        $(dom).on("swiperight", function(e) {
            e.preventDefault();
            goRightHandler.call(handlerContext);
        });
    },

    // inject mathML parsing code into an iframe
    injectMathJax: function (iframe) {
        var doc, script, head;
        doc = iframe.contentDocument;
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

    injectLinkHandler: function(iframe, linkClickHandler, handlerContext) {
        $('a', iframe.contentDocument).click(function(e) {
            linkClickHandler.call(handlerContext, e);
        });
    },

    resetEl: function(dom, reflowableDom, zoomer) {
        $('body', dom).removeClass("apple-fixed-layout");
        $("#readium-book-view-el", dom).attr("style", "");
        $(reflowableDom).toggleClass("two-up", false);
        $('#spine-divider', dom).toggle(false);
        zoomer.reset();

        $('#page-wrap', dom).css({
            "position": "relative",
            "right": "0px", 
            "top": "0px",
            "-webkit-transform": "scale(1.0) translate(0px, 0px)"
        });
    }
});