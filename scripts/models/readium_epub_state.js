// Description: This model is responsible for maintaining epub state in the Readium viewer. It has no knowledge of other
//  models that might utilize its data and behaviour. 
// Rationale: This is designed as a model to represent the state of an epub as it is maintained by the Readium application
// Notes:

Readium.Models.ReadiumEPUBState = Backbone.Model.extend({

	initialize: function() {

		// capture context for use in callback functions
		var that = this;

		// intantiate a [`PackageDocument`](/docs/packageDocument.html)
		this.packageDocument = new Readium.Models.PackageDocument({ book: this }, {
			file_path: this.get("package_doc_path")
		});
		
		//  load the `packageDocument` from the HTML5 filesystem asynchroniously
		this.packageDocument.fetch({

			// success callback is executed once the filesSystem contents have 
			// been read and parsed
			success: function() {

				// check if a TOC is specified in the `packageDocument`
				that.set("has_toc", ( !!that.packageDocument.getTocItem() ) );
			}
		});
	},

	getPackageDocument: function () {

		return this.packageDocument;
	},

	save: function(attrs, options) {
		// TODO: this should be done properly with a backbone sync
		var ops = {
			success: function() {}
		}
		_.extend(ops,options);
		var that = this;
		this.set("updated_at", new Date());
		Lawnchair(function() {
			this.save(that.toJSON(), ops.success);
		});
	},

	defaults: {
    	"can_two_up": true,
  	},

  	toJSON: function() {

  		// only save attrs that should be persisted:
  		return {
			"apple_fixed": this.get("apple_fixed"),
			"author": this.get("author"),
			"cover_href": this.get("cover_href"),
			"created_at": this.get("created_at"),
			"description": this.get("description"),
			"epub_version": this.get("epub_version"),
			"fixed_layout": this.get("fixed_layout"),
			"id": this.get("id"),
			"key": this.get("key"),
			"language": this.get("language"),
			"layout": this.get("layout"),
			"modified_date": this.get("modified_date"),
			"ncx": this.get("ncx"),
			"open_to_spread": this.get("open_to_spread"),
			"orientation": this.get("orientation"),
			"package_doc_path": this.get("package_doc_path"),
			"page_prog_dir": this.get("page_prog_dir"),
			"paginate_backwards": this.get("paginate_backwards"),
			"pubdate": this.get("pubdate"),
			"publisher": this.get("publisher"),
			"rights": this.get("rights"),
			"spread": this.get("spread"),
			"src_url": this.get("src_url"),
			"title": this.get("title"),
			"updated_at": this.get("updated_at"),
		};
	},

	resolvePath: function(path) {
		return this.packageDocument.resolvePath(path);
	},

	adjustCurrentPage: function() {
		var cp = this.get("current_page");
		var num = this.get("num_pages");
		var two_up = this.get("two_up");
		if(cp[cp.length - 1] > num) {
			this.goToLastPage();
		}
	},	

	hasNextSection: function() {
		return this.get("spine_position") < (this.packageDocument.spineLength() - 1);
	},

	hasPrevSection: function() {
		return this.get("spine_position") > 0;
	},

	setSpinePos: function(pos) {
		if(pos < 0 || pos >= this.packageDocument.spineLength()) {
			// invalid position
			return;
		}
		var spineItems = this.get("rendered_spine_items");
		this.set("spine_position", pos);
		if(spineItems.indexOf(pos) >= 0) {
			// the spine item is already on the page
			if(spineItems.length > 1) {
				// we are in fixed layout state, one spine item per page
				this.goToPage(spineItems.indexOf(pos) + 1);
			}
			// else nothing to do, because the section is already rendered out
			
		}
		else {
			// the section is not rendered out, need to do so
			var items = this.paginator.renderSpineItems(false);
			this.set("rendered_spine_items", items);	
		}
		
	},

	setSpinePosBackwards: function(pos) {
		if(pos < 0 || pos >= this.packageDocument.spineLength()) {
			// invalid position
			return;
		}
		this.set("spine_position", pos);
		if(this.get("rendered_spine_items").indexOf(pos) >= 0) {
			// the spine item is already on the page, nothing to do
			return;
		}
		var items = this.paginator.renderSpineItems(true);
		this.set("rendered_spine_items", items);
	},

	// is this book set to fixed layout at the meta-data level
	isFixedLayout: function() {
		return this.get("fixed_layout") || this.get("apple_fixed");
	}
});
