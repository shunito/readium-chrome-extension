(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['binding_template'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  


  return "<iframe scrolling=\"no\" \r\n		frameborder=\"0\" \r\n		marginwidth=\"0\" \r\n		marginheight=\"0\" \r\n		width=\"100%\" \r\n		height=\"100%\" \r\n		class='binding-sandbox'>\r\n</iframe>";});
templates['extracting_item_template'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<h5>";
  foundHelper = helpers.log_message;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.log_message; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</h5>\r\n<div class=\"progress progress-striped progress-success active \">	\r\n		<div role=\"status\" aria-live=\"assertive\" aria-relevant=\"all\" class=\"bar\" style=\"width: ";
  foundHelper = helpers.progress;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.progress; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "%;\"></div>\r\n</div>";
  return buffer;});
templates['fixed_page_template'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"fixed-page-margin\">\r\n	<iframe scrolling=\"no\" \r\n			frameborder=\"0\" \r\n			marginwidth=\"0\" \r\n			marginheight=\"0\" \r\n			width=\"";
  foundHelper = helpers.width;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.width; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "px\" \r\n			height=\"";
  foundHelper = helpers.height;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.height; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "px\" \r\n			src=\"";
  foundHelper = helpers.uri;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.uri; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"\r\n			title=\"";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.title;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\"\r\n			class='content-sandbox'>\r\n	</iframe>\r\n</div>";
  return buffer;});
templates['image_page_template'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"fixed-page-margin\">\r\n	<img src=\"";
  foundHelper = helpers.uri;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.uri; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\" >\r\n</div>";
  return buffer;});
templates['library_items_template'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  


  return "<div id='empty-message'>\r\n	<p id='empty-message-text' class='green'>\r\n		Add items to your</br>library here!\r\n	</p>\r\n	<img id='empty-arrow' src='/images/library/empty_library_arrow.png' alt='' />\r\n</div>";});
templates['library_item_template'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing;


  buffer += "<div class='info-wrap clearfix'>\r\n	<div class='caption book-info'>\r\n		<h2 class='green info-item title'>";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.title;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</h2>\r\n		<div class='info-item author'>";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.author;
  foundHelper = helpers.orUnknown;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "orUnknown", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "</div>\r\n		<div class='info-item epub-version'>ePUB ";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.epub_version;
  foundHelper = helpers.orUnknown;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "orUnknown", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "</div>\r\n		\r\n	</div>\r\n	\r\n	<img class='cover-image read' src='";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.cover_href;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "' width='150' height='220' alt='Open ePUB ";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.title;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "'>\r\n	\r\n	<a href=\"#details-modal-";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.key;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\" class=\"info-icon\" data-toggle=\"modal\" role=\"button\">\r\n		<img class='info-icon pull-right' src='/images/library/info-icon.png' height=\"39px\" width=\"39px\" alt='";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.title;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + " information'>\r\n	</a>\r\n</div>\r\n\r\n<div class=\"caption clearfix buttons\">\r\n	<a href=\"#todo\" class=\"btn read\" data-book='";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.key;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "' role='button'>Read</a>\r\n	<a href=\"#details-modal-";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.key;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\" class=\"btn details\" data-toggle=\"modal\" role=\"button\">\r\n		Details\r\n	</a>\r\n</div>\r\n\r\n<div id='details-modal-";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.key;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "' class='modal fade details-modal'>\r\n	<div class=\"pull-left modal-cover-wrap\">\r\n		<img class='details-cover-image' src='";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.cover_href;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "' width='150' height='220' alt='ePUB cover'>\r\n		<div class=\"caption clearfix modal-buttons\">\r\n</div>\r\n	</div>\r\n	<div class='caption modal-book-info'>\r\n		<h3 class='green modal-title'>";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.title;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "</h3>\r\n		<div class='modal-detail gap'>Author: ";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.author;
  foundHelper = helpers.orUnknown;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "orUnknown", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "</div>\r\n		<div class='modal-detail'>Publisher: ";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.publisher;
  foundHelper = helpers.orUnknown;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "orUnknown", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "</div>\r\n		<div class='modal-detail'>Pub Date: ";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.pubdate;
  foundHelper = helpers.orUnknown;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "orUnknown", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "</div>\r\n		<div class='modal-detail'>Modified Date: ";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.modified_date;
  foundHelper = helpers.orUnknown;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "orUnknown", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "</div>\r\n		<div class='modal-detail gap'>ID: ";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.id;
  foundHelper = helpers.orUnknown;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "orUnknown", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "</div>\r\n		<div class='modal-detail green'>Format: ePUB ";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.epub_version;
  foundHelper = helpers.orUnknown;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "orUnknown", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "</div>\r\n		<div class='modal-detail'>Added: ";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.created_at;
  foundHelper = helpers.orUnknown;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "orUnknown", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "</div>\r\n	</div>\r\n	<div class='modal-detail source'>\r\n	<span class='green' style=\"padding-right: 10px\">Source:</span>\r\n		";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.src_url;
  foundHelper = helpers.orUnknown;
  stack1 = foundHelper ? foundHelper.call(depth0, stack1, {hash:{}}) : helperMissing.call(depth0, "orUnknown", stack1, {hash:{}});
  buffer += escapeExpression(stack1) + "\r\n	</div>\r\n</div>			";
  return buffer;});
templates['ncx_nav_template'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<li class=\"nav-elem\">\r\n	<a href=\"";
  foundHelper = helpers.href;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.href; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.text;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.text; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "</a>\r\n</li>";
  return buffer;});
templates['reflowing_template'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div id=\"flowing-wrapper\">\r\n	<iframe scrolling=\"no\" \r\n			frameborder=\"0\" \r\n			marginwidth=\"0\" \r\n			marginheight=\"0\" \r\n			width=\"50%\" \r\n			height=\"100%\" \r\n			title=\"";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.title;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\"\r\n			src=\"";
  foundHelper = helpers.uri;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.uri; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"\r\n			id=\"readium-flowing-content\">\r\n	</iframe>\r\n</div>";
  return buffer;});
templates['scrolling_page_template'] = template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div id=\"scrolling-content\" class=\"scrolling-page-wrap\">\r\n	<div class=\"scrolling-page-margin\">\r\n\r\n		<iframe scrolling=\"yes\" \r\n				frameborder=\"0\" \r\n				marginwidth=\"0\" \r\n				marginheight=\"0\" \r\n				width=\"100%\" \r\n				height=\"100%\" \r\n				title=\"";
  stack1 = depth0.data;
  stack1 = stack1 == null || stack1 === false ? stack1 : stack1.title;
  stack1 = typeof stack1 === functionType ? stack1() : stack1;
  buffer += escapeExpression(stack1) + "\"\r\n				src=\"";
  foundHelper = helpers.uri;
  if (foundHelper) { stack1 = foundHelper.call(depth0, {hash:{}}); }
  else { stack1 = depth0.uri; stack1 = typeof stack1 === functionType ? stack1() : stack1; }
  buffer += escapeExpression(stack1) + "\"\r\n				class='content-sandbox'>\r\n		</iframe>\r\n	</div>\r\n</div>";
  return buffer;});
})();