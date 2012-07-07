
describe "Readium.Models.Ebook", ->

	
	describe "initialization", ->

		beforeEach ->
			stubFileSystem()

		
		describe "without passing a file path", ->

			it "throws an exeption", ->
				createWithNoPath = -> new Readium.Models.Ebook()
				expect(createWithNoPath).toThrow("Cannot sync the model to the fs without a path")

		
		describe "with valid params", ->

			it "initializes a paginator", ->
				ebook = new Readium.Models.Ebook({"package_doc_path": "some/file/path"})
				expect(ebook.paginator).toBeDefined()

			it "initializes the package document", ->
				ebook = new Readium.Models.Ebook({"package_doc_path": "some/file/path"})
				expect(ebook.packageDocument).toBeDefined()

			it 'passes a reference to itself to the package document', ->
				packDoc = new Readium.Models.PackageDocument({book: {}}, {"file_path": "some/path"})
				spyOn(Readium.Models, "PackageDocument").andReturn(packDoc)
				ebook = new Readium.Models.Ebook({"package_doc_path": "some/file/path"})
				args = Readium.Models.PackageDocument.mostRecentCall.args
				expect(args[0].book).toEqual(ebook)


			it "calls fetch on the package document", ->
				packDoc = new Readium.Models.PackageDocument({book: {}}, {"file_path": "some/path"})
				spyOn(Readium.Models, "PackageDocument").andReturn(packDoc)
				spyOn(packDoc, "fetch")
				ebook = new Readium.Models.Ebook({"package_doc_path": "some/file/path"})
				expect(Readium.Models.PackageDocument).toHaveBeenCalled()
				expect(packDoc.fetch).toHaveBeenCalled()

			
			describe "sets up event handlers", ->

				beforeEach ->
					@ebook = new Readium.Models.Ebook({"package_doc_path": "some/file/path"})

				it 'adjustCurrentPage on change:num_pages', ->
					spyOn(@ebook.adjustCurrentPage, "apply")
					@ebook.trigger("change:num_pages")
					expect(@ebook.adjustCurrentPage.apply).toHaveBeenCalled()

				it 'savePosition and setMetaSize on change:num_pages', ->
					spyOn(@ebook.savePosition, "apply")
					spyOn(@ebook.setMetaSize, "apply")
					@ebook.trigger("change:spine_position")
					expect(@ebook.savePosition.apply).toHaveBeenCalled()
					expect(@ebook.setMetaSize.apply).toHaveBeenCalled()

	
	describe "defaults", ->

		beforeEach ->
			@ebook = new Readium.Models.Ebook({"package_doc_path": "some/file/path"})

		it 'correctly sets default attrs', ->
			expect(@ebook.get("font_size")).toEqual(10)
			expect(@ebook.get("current_page")).toEqual([1])
			expect(@ebook.get("num_pages")).toEqual(0)
			expect(@ebook.get("two_up")).toEqual(false)
			expect(@ebook.get("full_screen")).toEqual(false)
			expect(@ebook.get("toolbar_visible")).toEqual(true)
			expect(@ebook.get("toc_visible")).toEqual(false)
			expect(@ebook.get("can_two_up")).toEqual(true)
			expect(@ebook.get("rendered_spine_items")).toEqual([])
			expect(@ebook.get("current_theme")).toEqual("default-theme")
			expect(@ebook.get("current_margin")).toEqual(3)

	
	describe "toJSON", ->

		beforeEach ->
			@ebook = new Readium.Models.Ebook({"package_doc_path": "some/file/path"})

		it 'does not serialize attrs that should not be presisted', ->
			# TODO: add some more
			@ebook.set("current_page", [1])
			json = @ebook.toJSON()
			expect(json.current_page).not.toBeDefined()

		it 'serializes attrs that should be persisted', ->
			# TODO: add some more
			json = @ebook.toJSON()
			expect(json.current_theme).toBeDefined()

	
	describe 'traversing pages', ->

		beforeEach ->
			@packageDocument = Factory.spy("package_document")
			spyOn(Readium.Models, "PackageDocument").andReturn(@packageDocument)
			@ebook = new Readium.Models.Ebook({"package_doc_path": "some/file/path"})

		
		describe 'reflowable section in one up', ->

			beforeEach ->
				section =
					isFixedLayout: -> false
				@ebook.set
					num_pages: 10
					current_page: [2]
					two_up: false
				spyOn(@ebook, "getCurrentSection").andReturn(section)

			
			describe "nextPage()", ->		

				it 'increments the page number if there are more pages', ->
					@ebook.nextPage()
					expect(@ebook.get("current_page")).toEqual([3])

				it 'calls goToNextSection if there are no more pages', ->
					@ebook.set("num_pages", 1)
					spyOn(@ebook, "goToNextSection")
					@ebook.nextPage()
					expect(@ebook.get("current_page")).toEqual([1])
					expect(@ebook.goToNextSection).toHaveBeenCalled()

			
			describe "prevPage()", ->

				it 'decrements the page number if there are more pages', ->
					@ebook.prevPage()
					expect(@ebook.get("current_page")).toEqual([1])

				it 'calls goToPrevSection from page one', ->
					@ebook.set("current_page", [1])
					spyOn(@ebook, "goToPrevSection")
					@ebook.prevPage()
					expect(@ebook.get("current_page")).toEqual([1])
					expect(@ebook.goToPrevSection).toHaveBeenCalled()

			describe "toggleTwoUp()", ->

				it 'sets the up_mode member', ->
					@ebook.toggleTwoUp()
					expect(@ebook.get("two_up")).toBeTruthy()

				it 'from page #1 sets current page correctly', ->
					@ebook.set("current_page", [1])
					@ebook.toggleTwoUp()
					expect(@ebook.get("current_page")).toEqual([1,2])

				it 'from an even page # sets current page correctly', ->
					@ebook.set("current_page", [4])
					@ebook.toggleTwoUp()
					expect(@ebook.get("current_page")).toEqual([3,4])

				it 'from an odd page # sets current page correctly', ->
					@ebook.set("current_page", [3])
					@ebook.toggleTwoUp()
					expect(@ebook.get("current_page")).toEqual([3,4])

				it 'from an odd last page # sets current page correctly', ->
					@ebook.set("num_pages", 3)
					@ebook.set("current_page", [3])
					@ebook.toggleTwoUp()
					# we allow for a non-existant page 4, because it will simple be
					# display as a blank page
					expect(@ebook.get("current_page")).toEqual([3,4])

		
		describe "reflowable section in two up", ->

			beforeEach ->
				section =
					isFixedLayout: -> false
				@ebook.set
					num_pages: 10
					current_page: [3,4]
					two_up: true
				spyOn(@ebook, "getCurrentSection").andReturn(section)

			
			describe "nextPage()", ->

				it 'increments both page numbers if there are more pages', ->
					@ebook.nextPage()
					expect(@ebook.get("current_page")).toEqual([5,6])

				it 'increments both page numbers if there are more pages', ->
					@ebook.nextPage()
					expect(@ebook.get("current_page")).toEqual([5,6])

				it 'calls goToNextSection if there are no more pages', ->
					@ebook.set("num_pages", 4)
					spyOn(@ebook, "goToNextSection")
					@ebook.nextPage()
					expect(@ebook.goToNextSection).toHaveBeenCalled()

				it 'delegates calculation to ebook.setCurrentPagesForNextPage()', ->
					spyOn(@ebook, "setCurrentPagesForNextPage")
					@ebook.nextPage()
					expect(@ebook.setCurrentPagesForNextPage).toHaveBeenCalledWith(5)

			
			describe "prevPage()", ->

				it 'decrements both page numbers if there are more pages', ->
					@ebook.prevPage()
					expect(@ebook.get("current_page")).toEqual([1,2])

				it 'calls goToPrevSection if at the beginning', ->
					@ebook.set("current_page", [1,2])
					spyOn(@ebook, "goToPrevSection")
					@ebook.prevPage()
					expect(@ebook.goToPrevSection).toHaveBeenCalled()

			describe "toggleTwoUp", ->

				it 'sets the up_mode member', ->
					@ebook.toggleTwoUp()
					expect(@ebook.get("two_up")).toBeFalsy()

				it 'shows the lowest page in the array', ->
					@ebook.toggleTwoUp()
					expect(@ebook.get("current_page")).toEqual([3])