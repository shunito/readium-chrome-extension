// loads and plays a single SMIL document
Readium.Models.MediaOverlay = Backbone.Model.extend({
    audioplayer: null,
    smilModel: null,
    
    // observable properties
    defaults: {
        is_ready: false,
        is_document_done: false,
        is_playing: false,
        should_highlight: true,
        current_text_document_url: null,
        current_text_element_id: null,
        has_started_playback: false        
    },
    
    // initialize with a "smil_url" option
    initialize: function() {
        var self = this;
        this.audioplayer = new Readium.Models.AudioClipPlayer();
        this.audioplayer.setConsoleTrace(false);

        this.url = this.get("smil_url");
        
        // always know whether we're playing or paused
        this.audioplayer.setNotifyOnPause(function() {
            self.set({is_playing: self.audioplayer.isPlaying()});
        });
        this.audioplayer.setNotifyOnPlay(function(){
           self.set({is_playing: self.audioplayer.isPlaying()});
        });
        
    },
    
    fetch: function(options) {
        this.set({is_ready: false});
        options || (options = {});
        options.dataType="xml";
        Backbone.Model.prototype.fetch.call(this, options);
    },
    // backbone fetch() callback
    parse: function(xml) {
        var self = this;
        this.smilModel = new Readium.Models.SmilModel();
        this.smilModel.setUrl(this.get("smil_url"));
        this.smilModel.setNotifySmilDone(function() {
            self.set({is_document_done: true});
        });
        
        // very important piece of code: attach render functions to the model
        // at runtime, 'this' is the node in question
        this.smilModel.addRenderers({
            "audio": function() {
                // have the audio player inform the node directly when it's done playing
                var thisNode = this;
                self.audioplayer.setNotifyClipDone(function() {
                    thisNode.notifyChildDone();
                });
                var isJumpTarget = false;
                if (this.hasOwnProperty("isJumpTarget")) {
                    isJumpTarget = this.isJumpTarget;
                    // reset the node's property
                    this.isJumpTarget = false;
                }
                // play the node
                self.audioplayer.play($(this).attr("src"), parseFloat($(this).attr("clipBegin")), parseFloat($(this).attr("clipEnd")), isJumpTarget);
            }, 
            "text": function(){
                var src = $(this).attr("src");
                // broadcast the text properties so that any listeners can do the right thing wrt loading/highlighting text
                self.set({
                    current_text_document_url: self.stripFragment(src), 
                    current_text_element_id: self.getFragment(src)
                });
            }
        });
        
        // start the playback tree at <body>
        var smiltree = $(xml).find("body")[0]; 
        this.smilModel.build(smiltree);
        this.set({is_ready: true});
    },
    // start playback
    // node is a SMIL node that indicates the starting point
    // if node is null, playback starts at the beginning
    startPlayback: function(node) {
        if (this.get("is_ready") == false) {
            return;
        }
        this.set({is_document_done: false});
        this.set({has_started_playback: true});
        this.smilModel.render(node);        
    },
    pause: function() {
        if (this.get("is_ready") == false) {
            return;
        }
        if (this.get("has_started_playback") == false) {
            return;
        }
        this.audioplayer.pause();
    },
    resume: function() {
        if (this.get("is_ready") == false) {
            return;
        }
        if (this.get("has_started_playback") == false) {
            return;
        }
        this.audioplayer.resume();        
    },
    findNodeByTextSrc: function(src) {
        if (this.get("is_ready") == false) {
            return null;
        }
        
        if (src == null || src == undefined || src == "") {
            return null;
        }
        
        var elm = this.smilModel.findNodeByAttrValue("text", "src", src);
        if (elm == null){
            elm = this.smilModel.findNodeByAttrValue("seq", "epub:textref", src);
        }    
        return elm;
    },
    setVolume: function(volume) {
        if (this.get("is_ready") == false) {
            return;
        }
        
        this.audioplayer.setVolume(volume);
    },
    
    getFragment: function(url) {
        if (url.indexOf("#") != -1 && url.indexOf("#") < url.length -1) {
            return url.substr(url.indexOf("#")+1);
        }
        return "";
    },
    stripFragment: function(url) {
        if (url.indexOf("#") == -1) {
            return url;
        }
        else {
            return url.substr(0, url.indexOf("#"));
        }
    }
});