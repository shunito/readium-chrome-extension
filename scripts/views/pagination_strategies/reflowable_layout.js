
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