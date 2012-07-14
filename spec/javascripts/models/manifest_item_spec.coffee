describe "Readium.Models.ManifestItem", ->

	beforeEach -> 
		spyOn(Readium, "FileSystemApi")
		spyOn(Readium.Models.ManifestItem.prototype, "resolvePath")
		@man_item_attrs = 
			href: "Font/Helvetica-0850.otf"
			id: "id4"
			media_overlay: ""
			media_type: "image/svg+xml"
			properties: ""
		@man_item = new Readium.Models.ManifestItem @man_item_attrs

	describe "initialization", ->

		it "works", ->
			man_item = new Readium.Models.ManifestItem @man_item_attrs
			expect(man_item.loadContent).toBeDefined()

	describe "isImage()", ->

		it "is not an image if it is svg", ->
			expect(@man_item.isImage()).toBeFalsy()

		it "is not an image if it is xhmlt", ->
			@man_item.set("media_type", "application/xhtml+xml")
			expect(@man_item.isImage()).toBeFalsy()

		it "is an image if it has an image mime", ->
			@man_item.set("media_type", "image/jpeg")
			expect(@man_item.isImage()).toBeTruthy()
			@man_item.set("media_type", "image/png")
			expect(@man_item.isImage()).toBeTruthy()

	describe "isSvg()", ->

		it "is svg if it has an svg mime", ->
			expect(@man_item.isSvg()).toBeTruthy()

		it "is not svg if it deos not have svg mime", ->
			@man_item.set("media_type", "application/xhtml+xml")
			expect(@man_item.isSvg()).toBeFalsy()

	describe "parseViewboxTag()", ->

		beforeEach ->
			xml_string = jasmine.getFixtures().read('manifest_item.svg')
			parser = new window.DOMParser();
			@dom = parser.parseFromString(xml_string, 'text/xml');
			spyOn(@man_item, "getContentDom").andReturn(@dom)
			@man_item = new Readium.Models.ManifestItem @man_item_attrs

		it "works", ->
			expect(@dom.document).toBeDefined()
			dom.documentElement.getAttribute("viewBox")


			




describe "Readium.Models.SpineItem", ->

	beforeEach ->
		spyOn(Readium, "FileSystemApi")
		spyOn(Readium.Models.SpineItem.prototype, "resolvePath")
		@spine_item_attrs = 
			href: "Content/pageNum-9.svg"
			id: "ch9"
			idref: "ch9"
			media_overlay: ""
			media_type: "image/svg+xml"
			page_prog_dir: ""
			properties: ""
			spine_index: 6


	describe "initialization", ->

		it "works", ->
			spine_item = new Readium.Models.SpineItem @spine_item_attrs
			expect(spine_item.isImage).toBeDefined()

	describe "isFixedLayout()", ->

		beforeEach ->
			@spine_item = new Readium.Models.SpineItem @spine_item_attrs
			@spine_item.set("media_type", "application/xhtml+xml")

		it "is fixed layout it it is an image", ->
			spyOn(@spine_item, "isImage").andReturn(true)
			expect(@spine_item.isFixedLayout()).toBeTruthy()

		it "is fixed layout if it is svg", ->
			spyOn(@spine_item, "isSvg").andReturn(true)
			expect(@spine_item.isFixedLayout()).toBeTruthy()

		it "it defaults to checking what the books is", ->
			collection = {
				isBookFixedLayout: jasmine.createSpy()
			}
			@spine_item.collection = collection
			@spine_item.isFixedLayout()
			expect(collection.isBookFixedLayout).toHaveBeenCalled();

		it "is fixed layout if its fixed_flow property is set", ->
			@spine_item.set("fixed_flow", true)
			expect(@spine_item.isFixedLayout()).toBeTruthy()

