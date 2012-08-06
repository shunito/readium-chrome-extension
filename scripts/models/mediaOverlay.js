// loads and plays a single SMIL document
Readium.Models.MediaOverlay = Backbone.Model.extend({
    audioplayer: null,
    smilModel: null,
    consoleTrace: false,
    
    // observable properties
    defaults: {
        is_ready: false,
        is_document_done: false,
        is_playing: false,
        should_highlight: true,
        has_started_playback: false,
        current_text_src: null,    
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
            self.debugPrint("document done");
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
                self.debugPrint("Text: " + src)
                self.set("current_text_src", src);
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
            this.debugPrint("document not ready");
            return;
        }
        this.set({is_document_done: false});
        this.set({has_started_playback: true});
        this.smilModel.render(node);        
    },
    pause: function() {
        if (this.get("is_ready") == false) {
            this.debugPrint("document not ready");
            return;
        }
        if (this.get("has_started_playback") == false) {
            this.debugPrint("can't pause: playback not yet started");
            return;
        }
        this.audioplayer.pause();
    },
    resume: function() {
        if (this.get("is_ready") == false) {
            this.debugPrint("document not ready");
            return;
        }
        if (this.get("has_started_playback") == false) {
            this.debugPrint("can't resume: playback not yet started");
            return;
        }
        this.audioplayer.resume();        
    },
    findNodeByTextSrc: function(src) {
        if (this.get("is_ready") == false) {
            this.debugPrint("document not ready");
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
            this.debugPrint("document not ready");
            return;
        }
        
        this.audioplayer.setVolume(volume);
    },
    setConsoleTrace: function(onOff) {
        this.consoleTrace = onOff;
    },
    debugPrint: function(str) {
        if (this.consoleTrace) {
            console.log("MediaOverlay: " + str);
        }
        
    }
});