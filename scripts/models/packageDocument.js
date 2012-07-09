// Used to validate a freshly unzipped package doc. Once we have 
// validated it one time, we don't care if it is valid any more, we
// just want to do our best to display it without failing
Readium.Models.ValidatedPackageMetaData = Backbone.Model.extend({

	initialize: function(attributes) {
		this.file_path = attributes.file_path;		
		this.uri_obj = new URI(attributes.root_url);
		this.set("package_doc_path", this.file_path);
    },

	validate: function(attrs) {

	},

	// for ease of use call parse before we set the attrs
	reset: function(data) {
		var attrs = this.parse(data);
		this.set(attrs);
	},

	defaults: {
		fixed_layout: false, // default to fixed layout or reflowable format
		apple_fixed: false, // is this file Apple's spec
		open_to_spread: false, // specific to Apple, should two up be allowed?
		cover_href: '/images/library/missing-cover-image.png', // default to no cover image
		created_at: new Date(), // right now
		updated_at: new Date(), // right now
		paginate_backwards: false
	},

	// Apple created its own fixed layout spec for ibooks.
	// this function parses the metadata used by this spec
	parseIbooksDisplayOptions: function(content) {
		var parseBool = function(string) {
			return string.toLowerCase().trim() === 'true';	
		}
		var parser = new window.DOMParser();
		var xmlDoc = parser.parseFromString(content, "text/xml");
		var fixedLayout = xmlDoc.getElementsByName("fixed-layout")[0];
		var openToSpread = xmlDoc.getElementsByName("open-to-spread")[0];
		this.set({
			fixed_layout: ( fixedLayout && parseBool(fixedLayout.textContent) ),
			open_to_spread: ( openToSpread && parseBool(openToSpread.textContent) ),
			apple_fixed: ( fixedLayout && parseBool(fixedLayout.textContent) )
		})
	},

	parse: function(xmlDom) {
		// parse the xml
		var parser = new Readium.Models.PackageDocumentParser(this.uri_obj);
		var json = parser.parse(xmlDom);

		//  only care about the metadata 
		return json.metadata;
	},

	save: function(attrs, options) {
		// TODO: this should be done properly with a backbone sync
		var that = this;
		this.set("updated_at", new Date());
		Lawnchair(function() {
			this.save(that.toJSON(), options.success);
		});
	},

	// TODO: confirm this needs to be here
	resolveUri: function(rel_uri) {
		uri = new URI(rel_uri);
		return uri.resolve(this.uri_obj).toString();
	},

	// TODO: confirm this needs to be here
	// reslove a relative file path to relative to this the
	// the path of this pack docs file path
	resolvePath: function(path) {
		var suffix;
		var pack_doc_path = this.file_path;
		if(path.indexOf("../") === 0) {
			suffix = path.substr(3);
		}
		else {
			suffix = path;
		}
		var ind = pack_doc_path.lastIndexOf("/")
		return pack_doc_path.substr(0, ind) + "/" + suffix;
	}
});

/**
 * The working package doc, used to to navigate a package document
 * vai page turns, cfis, etc etc
 */
Readium.Models.PackageDocument = Backbone.Model.extend({


	initialize: function(attributes, options) {
		var that = this;
		
		if(!attributes.file_path) {
			// Sanity Check: we need to know where to fetch the data from
			throw "This class cannot be synced without a file path";
		}
		else {
			// set it as a property of `this` so that `BackboneFileSystemSync`
			// knows how to find it
			this.file_path = attributes.file_path;

			// use the `FileSystemApi` to generate a fully resolved
			// `filesytem:url`
			Readium.FileSystemApi(function(api) {
				api.getFsUri(that.file_path, function(uri) {
					that.uri_obj = new URI(uri);
				})
			});
		}
		this.on('change:spine_position', this.onSpinePosChanged);
		
    },

    onSpinePosChanged: function() {
    	if( this.get("spine_position") >= this.previous("spine_position") ) {
    		this.trigger("increased:spine_position");
    	}
    	else {
    		this.trigger("decreased:spine_position");
    	}
    },


	// just want to make sure that we do not slip into an
	// invalid state
	validate: function(attrs) {
		
		if( !( attrs.manifest || this.get("manifest") ) ) {
			return "ERROR: All ePUBs must have a manifest";
		}

		//validate the spine exists and the position is valids
		var spine = attrs.spine || this.get("spine") ;
		if( !spine ) {
			return "ERROR: All ePUBs must have a spine";
		}
		if(attrs.spine_position < 0 || attrs.spine_position >= spine.length)	{
			return "ERROR: invalid spine position";
		}
	},

	sync: BBFileSystemSync,

	defaults: {
		spine_position: 0
	},
	
	getManifestItemById: function(id) {
		return this.get("manifest").find(function(x) { 
					if(x.get("id") === id) return x;
				});
	},

	getSpineItem: function(index) {
		return this.get("res_spine").at(index);
	},

	spineLength: function() {
		return this.get("res_spine").length;
	},

	goToNextSection: function() {
		var cp = this.get("spine_position");
		this.set({spine_position: (cp + 1) });
	},

	goToPrevSection: function() {
		var cp = this.get("spine_position");
		this.set({spine_position: (cp - 1) });	
	},

	spineIndexFromHref: function(href) {
		var spine = this.get("res_spine");
		href = this.resolveUri(href).replace(/#.*$/, "");
		for(var i = 0; i < spine.length; i++) {
			var path = spine.at(i).get("href");
			path = this.resolveUri(path).replace(/#.*$/, "");
			if(path === href) {
				return i;
			}
		}
		return -1;
	},

	goToHref: function(href) {
		var spine = this.get("spine");
		var manifest = this.get("manifest");
		var that = this;
		href = that.resolveUri(href).replace(/#.*$/, "");
		var node = manifest.find(function(x) {
			var path = that.resolveUri(x.get("href")).replace(/#.*$/, "");
			if (href == path) return x;
		});
								 
		// didn't find the spine node, href invalid
		if(!node) {
			return null;
		}

		var id = node.get("id");
		
		for(var i = 0; i < spine.length; ++i ) {
			if(spine[i].idref === id) {
				// always aproach link spine items in fwd dir
				this.set({spine_position: i}, {silent: true});
				this._previousAttributes.spine_position = 0
				this.trigger("change:spine_position")
				break;
			}
		}
	},

	getTocItem: function() {
		var manifest = this.get("manifest");
		var spine_id = this.get("metadata").ncx;
		var item = manifest.find(function(item){ 
			return item.get("properties") === "nav" 
		});

		if( item ) {
			return item;
		}

		if( spine_id && spine_id.length > 0 ) {
			return manifest.find(function(item) {
				return item.get("id") === spine_id;
			});
		}

		return null;
	},

	getMediaOverlayItem: function(idref) {
		// just look up the object in the mo_map
		var map = this.get("mo_map");
		return map && map[idref];
	},

	// combine the spine item data with the corresponding manifest
	// data to build useful set of backbone objects
	crunchSpine: function(spine, manifest) {
		//var bbSpine = new Readium.Collections.Spine(spine, {packageDocument: this});
		var that = this;
		var index = -1; // to keep track of the index of each spine item
		
		var bbSpine = _.map(spine, function(spineItem) {
			index += 1;
			
			var manItem = manifest.find(function(x) {
				if(x.get("id") === spineItem["idref"]) return x;
			});

			// crunch spine attrs and manifest attrs together into one obj
			var book = that.get("book");
			return _.extend({}, spineItem, manItem.attributes, {"spine_index": index}, {"page_prog_dir": book.get("page_prog_dir")});
		});

		return new Readium.Collections.Spine(bbSpine, {packageDocument: this});
	},

	parse: function(xmlDom) {
		var parser = new Readium.Models.PackageDocumentParser(this.uri_obj);
		var json = parser.parse(xmlDom);
		json.res_spine = this.crunchSpine(json.spine, json.manifest);
		return json;
	},

	resolveUri: function(rel_uri) {
		uri = new URI(rel_uri);
		return uri.resolve(this.uri_obj).toString();
	},

	// reslove a relative file path to relative to this the
	// the path of this pack docs file path
	resolvePath: function(path) {
		var suffix;
		var pack_doc_path = this.file_path;
		if(path.indexOf("../") === 0) {
			suffix = path.substr(3);
		}
		else {
			suffix = path;
		}
		var ind = pack_doc_path.lastIndexOf("/")
		return pack_doc_path.substr(0, ind) + "/" + suffix;
	}


});
