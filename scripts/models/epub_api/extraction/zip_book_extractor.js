// This method takes a url for an epub, unzips it and then
// writes its contents out to disk.
Readium.Models.ZipBookExtractor = Readium.Models.BookExtractorBase.extend({

    initialize: function() {
        zip.workerScriptsPath = "../lib/"
        var file_name = this.get("src_filename");
        if(!this.get("file")) {
            throw "A zip file must be specified";
        }
        else {
            this.base_dir_name = Readium.Utils.MD5(file_name + (new Date()).toString());
            this.set("src", file_name);
        }   
    },
    
    extractEntryByName: function(name, callback) {
        var writer, entry;

        entry = _.find(this.entries, function(entry) {
            return entry.filename === name;
        });
        if(entry) {
            writer = new zip.TextWriter();
            entry.getData(writer, callback);
        }
        else {
            throw ("asked to extract non-existent zip-entry: " + name);
        }
    },
    
    extractContainerRoot: function() {
        var that = this;
        var path = this.get("root_file_path");
        try {
            this.extractEntryByName(path, function(content) {
                that.parseContainerRoot(content);
            });             
        } catch(e) {
            this.set("error", e);
        }   
    },
    
    extractMetaInfo: function() {
        var that = this;
        try {
            this.extractEntryByName(this.CONTAINER, function(content) {
                that.parseMetaInfo(content);
            });
        } catch (e) {
            this.set("error", e);
        }
    },
        
    extractMimetype: function() {
        var that = this;
        this.set("log_message", "Verifying mimetype");
        try {
            this.extractEntryByName(this.MIMETYPE, function(content) {
                that.validateMimetype(content);
            });         
        } catch (e) {
            this.set("error", e);
        }

    },
    
    validateZip: function() {
        // set the task
        // weak test, just make sure MIMETYPE and CONTAINER files are where expected    
        var that = this;
        this.set("log_message", "Validating zip file");
        var has_mime = _.any(this.entries, function(x){
            return x.filename === that.MIMETYPE
        });
        var has_container = _.any(this.entries, function(x){
            return x.filename === that.CONTAINER
        });
        if(has_mime && has_container) {
            this.trigger("validated:zip");
        }
        else {
            this.set("error", "File does not appear to be a valid EPUB. Progress cancelled."); 
        }
        
    },

    extractEntry: function(entry) {
        var that = this;
        var writer = new zip.BlobWriter();
        entry.getData(writer, function(content) {
            that.writeFile(entry.filename, content, function() {
                that.available_workers += 1;
                that.set("zip_position", that.get("zip_position") + 1);
            });
        });
    },
    
    extractBook: function() {

        // genericly extract a file and then write it to disk
        var entry;

        if(this.get("zip_position") === 0) {
            this.available_workers = 5;
            this.entry_position = 0;
            this.on("change:zip_position", this.checkCompletion, this);
        }

        while(this.available_workers > 0 && this.entry_position < this.entries.length) {
            entry = this.entries[this.entry_position];  
            if( entry.filename.substr(-1) === "/" ) {
                // skip over directories
                this.entry_position += 1;
                this.set("zip_position", this.get("zip_position") + 1);
            }
            else {
                this.available_workers -= 1;
                this.entry_position += 1;
                this.extractEntry(entry);
            }

        }
        
        for(var i = 0; i < this.entries.length; i++) {
            
        }
    },

    parseIbooksDisplayOptions: function() {
        var that = this;
        try {
            this.extractEntryByName(this.DISPLAY_OPTIONS, function(content) {
                that.packageDoc.parseIbooksDisplayOptions(content);
                that.trigger("parsed:ibooks_options");
            });
        } catch(e) {
            // there was no ibook_options file, thats fine....
            this.trigger("parsed:ibooks_options");  
        }
    },

    checkCompletion: function() {
        var pos = this.get("zip_position");
        if(pos === this.entries.length) {
            this.set("log_message", "All files unzipped successfully!");
            this.set("patch_position", 0);
        }
        else {
            // this isn't exactly accurate but it will signal the user
            // that we are still doing work
            this.set("log_message", "extracting: " + this.entries[pos].filename);
        }
    },

    beginUnpacking: function() {        
        var manifest = [];
        var entry;
        for(var i = 0; i < this.entries.length; i++) {
            entry = this.entries[i];
            if( entry.filename.substr(-1) !== "/" ) {
                manifest.push(entry.name);
            }
        }
        this.set("manifest", manifest);
        // just set the first position
        this.set("zip_position", 0);
    },
    
    extract: function() {

        // set up all the callbacks
        this.on("initialized:zip", this.validateZip, this);
        this.on("validated:zip", this.extractMimetype, this);
        this.on("validated:mime", this.extractMetaInfo, this);
        this.on("change:root_file_path", this.extractContainerRoot, this);
        this.on("parsed:root_file", this.parseIbooksDisplayOptions, this);
        this.on("parsed:ibooks_options", this.beginUnpacking, this);
        this.on("change:zip_position", this.extractBook, this);
        this.on("change:patch_position", this.correctURIs, this);
        this.on("change:failure", this.clean, this);
        this.on("change:failure", this.removeHandlers, this);

        // set up callbacks for reporting progess
        this.on("change:task_size", this.update_progress, this);
        this.on("change:zip_position", this.update_progress, this);
        this.on("change:patch_position", this.update_progress, this);
        this.on("extraction_success", this.extraction_complete, this);

        // fire the event that says started
        this.set("extracting", true);

        // initialize the FS and begin process
        var that = this;
        Readium.FileSystemApi(function(fs){
            that.fsApi = fs;
            that.initializeZip();
        });

    },

    update_progress: function() {
        var zip = this.get("zip_position") || 0;
        var patch = this.get("patch_position") || 0;
        var x = Math.floor( (zip + patch + 3) * 100 / this.get("task_size") );
        this.set("progress", x );
    },

    initializeZip: function() {
        var that = this;
        
        this.fsApi.getFileSystem().root.getDirectory(this.base_dir_name, {create: true}, function(dir) {
            that.set("root_url", dir.toURL());
            zip.createReader(new zip.BlobReader(that.get("file")), function(zipReader) {
                zipReader.getEntries(function(entries) {
                    that.entries = entries;
                    that.set("task_size", entries.length * 2 + 3);
                    that.trigger("initialized:zip");
                });
            }, function() {
                that.set("error", "File does not appear to be a valid EPUB. Progress cancelled."); 
            });

        }, function() {
            console.log("In beginUnpacking error handler. Does the root dir already exist?");
        });
    }
    
});