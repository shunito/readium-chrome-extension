Readium.Views.TocViewBase = Backbone.View.extend({

	el: "#readium-toc",

	initialize: function() {
		this.model.on("change", this.render, this);
		this.model.on("change:visible", this.setVisibility, this);
	},

	events: {
		"click a": "handleClick",
		"click #close-toc-button": "closeToc"
	},

	setVisibility: function() {
		this.$el.toggle(this.model.get("visible"));
	},

	handleClick: function(e) {
		e.preventDefault();
		href = $(e.currentTarget).attr("href");
		this.model.handleLink(href);
	},

	closeToc: function(e) {
		e.preventDefault();
		this.model.hide();
	}

});


Readium.Views.NcxTocView = Readium.Views.TocViewBase.extend({ 

	initialize: function() {
		Readium.Views.TocViewBase.prototype.initialize.call(this);
		this.nav_template = Handlebars.templates.ncx_nav_template;
	},

	render: function() {
		this.setVisibility();
		var ol = $("<ol></ol>");
		var navs = this.model.get("navs");
		for(var i = 0; i < navs.length; i++) {
			ol.append( this.nav_template(navs[i]) );
		}
		this.$('#toc-body').html("<h1 tabindex='-1' id='toc-heading-ref'>" + (this.model.get("title") || "Table of Contents") + "</h1>");
		this.$('#toc-body').append(ol);
		this.$('#toc-body').append("<div id='toc-end-spacer'>");
		return this;
	}

});

Readium.Views.XhtmlTocView = Readium.Views.TocViewBase.extend({ 

	render: function() {
		this.$('#toc-body').html( this.model.get("body").html() );
		this.$('#toc-body').append("<div id='toc-end-spacer'>");
		return this;
	}

});