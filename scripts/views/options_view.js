Readium.Views.OptionsView = Backbone.View.extend({

	el: '#viewer-settings-modal',

	initialize: function() {
		this.model.on("change:current_theme", this.renderTheme, this);
		this.model.on("change:pagination_mode", this.renderPagination, this);
		this.model.on("change:current_margin", this.renderMarginRadio, this);
		this.model.on("change:font_size", this.renderFontSize, this);
		var that = this;
		Acc.rg = {
			theme: new Acc.RadioGroup('theme-radio-group', ' .' + this.model.get("current_theme"), function(el){
				var id = el.id;
				if(id === "default-theme-option" ) that.model.set("current_theme", "default-theme");
				if(id === "night-theme-option" ) that.model.set("current_theme", "night-theme");
				if(id === "parchment-theme-option" ) that.model.set("current_theme", "parchment-theme");
				if(id === "ballard-theme-option" ) that.model.set("current_theme", "ballard-theme");
				if(id === "vancouver-theme-option" ) that.model.set("current_theme", "vancouver-theme");
			}),

			pagination: new Acc.RadioGroup('pagination_mode', 
				(this.model.get('pagination_mode') == 'single') ? ' #one-up-option' : ((this.model.get('pagination_mode') == 'facing') ? ' #two-up-option' : ' #scrolling-option'),
				function(el){
					if (el.id == 'one-up-option')
						that.model.set("pagination_mode", "single");
					else if (el.id == 'two-up-option')
						that.model.set("pagination_mode", "facing");
					else
						that.model.set("pagination_mode", "scrolling");
				}
			),

			margin: new Acc.RadioGroup('margin-radio-wrapper', ' #margin-option-' + this.model.get("current_margin"), function(el){
				var id = el.id,
				num = id[id.length - 1];
				if(num === "1" ) that.model.set("current_margin", 1);
				if(num === "2" ) that.model.set("current_margin", 2);
				if(num === "3" ) that.model.set("current_margin", 3);
				if(num === "4" ) that.model.set("current_margin", 4);
				if(num === "5" ) that.model.set("current_margin", 5);
			})
		};

		$('#options-btn').attr('aria-pressed', 'false');
		$('#viewer-settings-modal').on('shown', function(){
			$('#setting-header-font-size').focus();
			setTimeout( function() {
				$('#options-btn').attr('aria-pressed', 'true');
			}, 1);
		}).on('hidden', function(){
			setTimeout( function(){
				$('#options-btn').attr('aria-pressed', 'false').focus();
			}, 1);
		});
	},

	render: function() {
		this.renderTheme();
		this.renderPagination();
		this.renderMarginRadio();
		this.renderFontSize();
		return this;
	},

	renderTheme: function() {
		this.$('#preview-text')[0].className = this.model.get("current_theme");
		return this;
	},

	renderPagination: function() {
		var viewPref = this.model.get("pagination_mode");
		this.$("#one-up-option").toggleClass("selected", (viewPref == 'single'));
		this.$("#two-up-option").toggleClass("selected", (viewPref == 'facing'));
		this.$("#scrolling-option").toggleClass("selected", (viewPref == 'scrolling'));
		return this;
	},

	renderMarginRadio: function() {
		var id = "#margin-option-" + this.model.get("current_margin");
		this.$('.margin-radio').toggleClass("selected", false);
		this.$(id).toggleClass("selected", true);
		return this;
	},

	renderFontSize: function() {
		var val = this.model.get("font_size");
		var size = (val / 10).toString() + "em";

		// apply the size to the preview text area
		this.$('#preview-text').css("font-size", size);

		// set the value of the slider
		this.$("#font-size-input").val(val);
	},

	events: {
    	"click .theme-option": 			"selectTheme",
    	"click .margin-radio": 			"selectMargin",
    	"click .pagination-option": 	"selectPagination",
    	"click #cancel-settings-but": 	"cancelSettings",
		"click #save-settings-but": 	"applySettings",
    	"change #font-size-input": 		"extractFontSize"
  	},

  	extractFontSize: function(e) {
		var val = $("#font-size-input").val();
		val = parseInt(val, 10);
		this.model.set("font_size", val);
	},

  	setOneUp: function(e) {
		if (Acc.rg && Acc.rg.format) Acc.rg.format.set('one-up-option');
		this.model.set("two_up", false);
		e.stopPropagation();
	},

	setTwoUp: function(e) {
		if (Acc.rg && Acc.rg.format) Acc.rg.format.set('two-up-option');
		this.model.set("two_up", true);
		e.stopPropagation();
	},

  	selectTheme: function(e) {
  		var el = e.srcElement;
  		while (el != null && !el.classList.contains('theme-option')) {
  			el = el.parentElement;
  		}
  		var id = el ? el.id : '';
		if(id && el && Acc.rg && Acc.rg.theme && el != Acc.rg.theme.selected) Acc.rg.theme.set(id);
  		if(id === "default-theme-option" ) this.model.set("current_theme", "default-theme");
		if(id === "night-theme-option" ) this.model.set("current_theme", "night-theme");
		if(id === "parchment-theme-option" ) this.model.set("current_theme", "parchment-theme");
		if(id === "ballard-theme-option" ) this.model.set("current_theme", "ballard-theme");
		if(id === "vancouver-theme-option" ) this.model.set("current_theme", "vancouver-theme");
		e.stopPropagation();
  	},

  	selectMargin: function(e) {
  		var id = e.srcElement.id;
		if (e.srcElement && Acc.rg && Acc.rg.margin && e.srcElement != Acc.rg.margin.selected) Acc.rg.margin.set(id);
  		var num = id[id.length - 1];
  		if(num === "1" ) this.model.set("current_margin", 1);
		if(num === "2" ) this.model.set("current_margin", 2);
		if(num === "3" ) this.model.set("current_margin", 3);
		if(num === "4" ) this.model.set("current_margin", 4);
		if(num === "5" ) this.model.set("current_margin", 5);
		e.stopPropagation();
  	},

  	selectPagination: function(e) {
  		var el = e.srcElement;
  		while (el != null && !el.classList.contains('pagination-option')) {
  			el = el.parentElement;
  		}
  		var id = el ? el.id : '';
		if (id && el && Acc.rg && Acc.rg.format && el != Acc.rg.pagination.selected) Acc.rg.pagination.set(id);
  		if(id === "one-up-option" ) this.model.set("pagination_mode", 'single');
  		if(id === "two-up-option" ) this.model.set("pagination_mode", 'facing');
  		if(id === "scrolling-option" ) this.model.set("pagination_mode", 'scrolling');
		e.stopPropagation();
  	},

  	cancelSettings: function(e) {
  		this.$el.modal('hide');
  		this.model.resetOptions();
		$('#options-btn').focus();
  	},

  	applySettings: function(e) {
  		this.model.applyOptions();
  		this.$el.modal('hide');
		$('#options-btn').focus();
  	}


});