// This method takes a url for an epub, unzips it and then
// writes its contents out to disk.
Readium.Models.UnpackedBookExtractor = Readium.Models.BookExtractorBase.extend({

    initialize: function() {
        
        var dirPicker = this.get("dir_picker");
        var pathList = [];
        var path;
        this.fNameStartInd = dirPicker.files[0].webkitRelativePath.indexOf("/") + 1;

        // Just hashing the date for now
        this.base_dir_name = Readium.Utils.MD5("Banana" + (new Date()).toString()); 
        this.fileList = dirPicker.files;
        for (var i = 0, file; file = this.fileList[i]; ++i) {
            path = file.webkitRelativePath;
            if(path.substr(-2) !== "/.") {
                pathList.push( this.getShortName(path) );
            }
        }
        this.set("src", "Local Directory: " + this.fileList[0].webkitRelativePath.substring(0, this.fNameStartInd));
        this.set("task_size", pathList.length * 2 + 3);
        this.set("manifest", pathList);
    },

    getShortName: function(longName) {
        return longName.substr(this.fNameStartInd);
    },

    update_progress: function() {
        var write_position = this.get("write_position") || 0;
        var patch_position = this.get("patch_position") || 0;
        var x = 3 + write_position + patch_position;
        this.set("progress", x );
    },

    extract: function() {
        // set up all the callbacks
        this.on("validated:dir", this.readMime, this);
        this.on("validated:mime", this.readMetaInfo, this);
        this.on("change:root_file_path", this.readContainerRoot, this);
        this.on("parsed:root_file", this.parseIbooksDisplayOptions, this);
        this.on("parsed:ibooks_options", this.beginWriting, this);
        this.on("change:write_position", this.writeEntry, this);
        this.on("change:patch_position", this.correctURIs, this);
        this.on("change:failure", this.clean, this);
        this.on("change:failure", this.removeHandlers, this);

        // set up callbacks for reporting progess
        this.on("change:task_size", this.update_progress, this);
        this.on("change:write_position", this.update_progress, this);
        this.on("change:patch_position", this.update_progress, this);
        this.on("extraction_success", this.extraction_complete, this);

        // fire the event that says started
        this.set("extracting", true);

        // initialize the FS and begin process
        var that = this;
        Readium.FileSystemApi(function(fs){
            that.fsApi = fs;
            fs.getFileSystem().root.getDirectory(that.base_dir_name, {create: true}, function(dir) {
                that.set("root_url", dir.toURL());
                that.validateDir();
            });
        });

    },

    parseIbooksDisplayOptions: function() {
        this.trigger("parsed:ibooks_options");
        var that = this;
        try {
            this.readEntryByShortName(this.DISPLAY_OPTIONS, function(content) {
                that.packageDoc.parseIbooksDisplayOptions(content);
                that.trigger("parsed:ibooks_options");
            });
        } catch(e) {
            // there was no ibook_options file, thats fine....
            this.trigger("parsed:ibooks_options");  
        }
    },

    validateDir: function() {
        var entries = this.get("manifest")
        if(entries.indexOf(this.MIMETYPE) >= 0 && entries.indexOf(this.CONTAINER) >= 0) {
            this.trigger("validated:dir");
        } else {
            this.set("error", "the directory you selected was not valid");
        }
    },

    readMime: function() {
        var that = this;
        this.set("log_message", "Verifying mimetype");
        try {
            this.readEntryByShortName(this.MIMETYPE, function(content) {
                that.validateMimetype(content);
            });         
        } catch (e) {
            this.set("error", e);
        }
    },

    readMetaInfo: function() {
        var that = this;
        try {
            this.readEntryByShortName(this.CONTAINER, function(content) {
                that.parseMetaInfo(content);
            });
        } catch (e) {
            this.set("error", e);
        }
    },

    readContainerRoot: function() {
        var that = this;
        var path = this.get("root_file_path");
        try {
            this.readEntryByShortName(path, function(content) {
                that.parseContainerRoot(content);
            });             
        } catch(e) {
            this.set("error", e);
        }   
    },

    beginWriting: function() {      
        // just set the first position
        this.set("write_position", 0);
    },

    writeEntry: function() {
        var that = this;
        var i = this.get("write_position");
        if(i === this.fileList.length) {
            this.set("patch_position", 0);
            return;
        }

        var file = this.fileList[i];
        var relpath = this.getShortName(file.webkitRelativePath);
        this.set("log_message", "writing: " + relpath);
        if(relpath.substr(-2) === "/.") {
            this.set("write_position", i+1);
            return;
        }
        this.writeFile(relpath, file, function() {
            that.set("write_position", i+1);
        });
    },

    // should only be used for text files
    readEntryByShortName: function(name, callback) {
        var found = false;
        var files = this.get("dir_picker").files;
        for (var i=0; i < files.length; i++) {
            if(this.getShortName(files[i].webkitRelativePath) === name) {
                found = true;
                var reader = new FileReader();
                reader.onload = function(e) {
                    callback(e.target.result);
                };
                reader.readAsText(files[i]);
                break;
            }
        }
        if(!found) {
            throw ("asked to read non-existent file: " + name);
        }
    }

});