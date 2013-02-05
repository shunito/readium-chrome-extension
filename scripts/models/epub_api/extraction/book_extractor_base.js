Readium.Models.BookExtractorBase = Backbone.Model.extend({
	// Constants
	MIMETYPE: "mimetype",
	CONTAINER: "META-INF/container.xml",
	EPUB3_MIMETYPE: "application/epub+zip",
	DISPLAY_OPTIONS:"META-INF/com.apple.ibooks.display-options.xml",

	defaults: {
		task_size: 100,
		progress: 1,
		extracting: false,
		log_message: "Fetching epub file"
	},

	 // delete any changes to file system in the event of error, etc.
	clean: function() {
		this.removeHandlers();
		if(this.fsApi) {
			this.fsApi.rmdir(this.base_dir_name);
		}
	},

	parseContainerRoot: function(content) {
		var rootFile = this.get("root_file_path");
		this.packageDoc = new Readium.Models.ValidatedPackageMetaData({
				key: this.base_dir_name,
				src_url: this.get("src"),
				file_path: this.base_dir_name + "/" + rootFile,
				root_url: this.get("root_url") + "/" + rootFile
			}); 
		this.packageDoc.reset(content);
		this.trigger("parsed:root_file")		
	},

	writeFile: function(rel_path, content, cb) {
		var that = this;
		var abs_path = this.base_dir_name + "/" + rel_path;

		this.fsApi.writeFile(abs_path, content, cb , function() {
			that.set("error", "ERROR: while writing to filesystem");
		});
	},

	parseMetaInfo: function(content) {	
		var parser = new window.DOMParser();
		var xmlDoc = parser.parseFromString(content, "text/xml");
		var rootFiles = xmlDoc.getElementsByTagName("rootfile");

		if(rootFiles.length < 1) {
			// all epubs must have a rootfile
			this.set("error", "This epub is not valid. The rootfile could not be located.");
		}
		else {
			// According to the spec more than one rootfile can be specified 
			// but we are required to parse the first one only for now...
			if (rootFiles[0].hasAttribute("full-path")) {
				this.set("root_file_path", rootFiles[0].attributes["full-path"].value);
			}
			else {
				this.set("error", "Error: could not find package rootfile");
			}				
		}
	},

	validateMimetype: function(content) {
		if($.trim(content) === this.EPUB3_MIMETYPE) {
			this.trigger("validated:mime");
		} else {
			this.set("error", "Invalid mimetype discovered. Progress cancelled.");
		}
	},

	// remove all the callback handlers attached to
	// events that might be registered on this
	removeHandlers: function() {
		this.off();
	},

	extraction_complete: function() {
		this.set("extracting", false);
	},

	finish_extraction: function() {
		var that = this;
		this.set("log_message", "Unpacking process completed successfully!");
		// HUZZAH We did it, now save the meta data
		this.packageDoc.save({}, {
			success: function() {
				that.trigger("extraction_success");
			},
			failure: function() {
				that.set("failure", "ERROR: unknown problem during unpacking process");
			}
		});
	},

	// sadly we need to manually go through and reslove all urls in the
	// in the epub, because webkit filesystem urls are completely supported
	// yet, see: http://code.google.com/p/chromium/issues/detail?id=114484
	correctURIs: function() {
	
		var root = this.get("root_url");
		var i = this.get("patch_position");
		var manifest = this.get("manifest");
		var uid = this.packageDoc.get("id");
		var that = this;
		
		if( i >= manifest.length) {
			this.off("change:patch_position");
			this.finish_extraction();
		} 
		else {			
			this.set("log_message", "monkey patching: " + manifest[i]);
			monkeyPatchUrls(root + "/" + manifest[i], function() {
					that.incPatchPos();
				}, function() {
					that.set("failure", "ERROR: unknown problem during unpacking process");
				}, uid);
		}
	

	},

	incPatchPos: function() {
		var pos = this.get("patch_position") || 0;
		pos += 1;
		this.set("patch_position", pos);
	}

});



