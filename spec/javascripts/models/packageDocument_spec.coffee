describe 'PackageDocument', ->

	describe "initialization", ->

		beforeEach ->
			stubFileSystem()
			@packageDocument = new Readium.Models.PackageDocument({book: {}, file_path: "some/path"})

		it 'exists in the namespace', ->
			expect(Readium.Models.PackageDocument).toBeDefined()

		it 'sets the file path'
			#expect(@packageDocument.uri_obj).toBeDefined()


		it 'subscribes to spine position changed events', ->
			spyOn(@packageDocument.onSpinePosChanged, "apply")
			@packageDocument.trigger("change:spine_position")
			expect(@packageDocument.onSpinePosChanged.apply).toHaveBeenCalled()

	
	describe "parsing the xml", ->

		beforeEach ->
			xml_string = jasmine.getFixtures().read('package_document.xml')
			@xml = new window.DOMParser().parseFromString(xml_string, 'text/xml')
			@packageDocument = new Readium.Models.PackageDocument({file_path: "some/path"})
			@packageDocument.uri_obj = new URI("http://google.ca")
			spyOn(@packageDocument, "crunchSpine")
			@json = @packageDocument.parse(@xml) 

		it 'is working', ->
			expect($('title', @xml).text()).toEqual("L'espagnol dans votre poche")
			expect(Jath.resolver).toBeDefined()
			expect(Readium.Collections.ManifestItems).toBeDefined()
			

		it 'parses the spine nodes', ->
			expect(@json.spine.length).toEqual(3)

		it 'parses the manifest', ->
			expect(typeof(@json.manifest)).toEqual("object")

		it 'calls getCoverHref with the manifest', ->
			#expect(@packageDocument)

		describe 'parsing the metadata', ->

			it 'parses the id', ->
				#expect(@json.metadata.id).toEqual(3)
