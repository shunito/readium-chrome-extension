describe("ebook", function() {

	var pacDocStub = {
		on: function() {},
		fetch: function() {},
		set: function() {},
		get: function() {},
		trigger: function() {},
		getTocItem: function() {},
	}

	
	describe("initialization", function() {

		var ebook;
		
		beforeEach(function() {
			spyOn(Readium.Models, "PackageDocument").andReturn(pacDocStub);
		});

		it('constructs the package document', function() {
			ebook = new Readium.Models.Ebook({"package_doc_path": "banana"});
			expect(Readium.Models.PackageDocument).toHaveBeenCalled();
		});

		it('passes the "package_doc_path" path to packDoc contructor', function() {
			ebook = new Readium.Models.Ebook({"package_doc_path": "banana"});
			var args = Readium.Models.PackageDocument.mostRecentCall.args;
			expect(args[1].file_path).toEqual("banana");
		});

		it('passes a reference to itself to the package document', function() {
			ebook = new Readium.Models.Ebook({"package_doc_path": "banana"});
			var args = Readium.Models.PackageDocument.mostRecentCall.args;
			expect(args[0].book).toEqual(ebook);
		});

		it("calls fetch on the package document", function() {
			spyOn(pacDocStub, "fetch");
			ebook = new Readium.Models.Ebook({"package_doc_path": "banana"});
			expect(pacDocStub.fetch).toHaveBeenCalled()
		});

		

	});


	describe("paginating", function() {

		var ebook;
		
		beforeEach(function() {
			pacDocStub.goToNextSection = function() {}
			spyOn(Readium.Models, "PackageDocument").andReturn(pacDocStub);
			ebook = new Readium.Models.Ebook;
		});

		it('sets the current page to [1] by default', function() {
			ebook = new Readium.Models.Ebook({"package_doc_path": "banana"});
			expect(ebook.get("current_page")[0]).toEqual(1);
		});

		it("increments the page number if there are more pages", function() {
			ebook.set({"num_pages": 10});
			ebook.nextPage();
			expect(ebook.get("current_page")[0]).toEqual(2);
		});

		it("increments the page number if there are more pages", function() {
			ebook.set({"num_pages": 10});
			ebook.nextPage();
			expect(ebook.get("current_page")[0]).toEqual(2);
		});


	});


	describe("unit test from one-up to two-up", function() {

		var ebook;
		
		beforeEach(function() {
			pacDocStub.goToNextSection = function() {}
			spyOn(Readium.Models, "PackageDocument").andReturn(pacDocStub);
			ebook = new Readium.Models.Ebook;
		});

		it('if current page is even when two-up is toggled, show even page then the next page which is odd', function() {
			ebook.set({"current_page": [2]});
			ebook.toggleTwoUp();
			expect(ebook.get("current_page")).toEqual([2,3]);
		});

		it('if current page is odd when two-up is toggled, show previous page which is even then the odd page', function() {
			ebook.set({"current_page": [3]});
			ebook.toggleTwoUp();
			expect(ebook.get("current_page")).toEqual([2,3]);
		});

		it('if current page is 1 when two-up is toggled, show page 0 and page 1', function() {
			ebook.set({"current_page": [1]});
			ebook.toggleTwoUp();
			expect(ebook.get("current_page")).toEqual([0,1]);
		});

	});

	describe("unit test from two-up to one-up", function() {

		var ebook;
		
		beforeEach(function() {
			pacDocStub.goToNextSection = function() {}
			spyOn(Readium.Models, "PackageDocument").andReturn(pacDocStub);
			ebook = new Readium.Models.Ebook;
		});

		it('when toggling to one-up, it shows the lowest number page', function(){
			ebook.set({"two_up": true});
			ebook.set({"current_page": [6,7]});
			ebook.toggleTwoUp();
			expect(ebook.get("current_page")).toEqual([6]);
		});

		it('when toggling to one-up when the current page is 0 & 1, it shows page 1', function(){
			ebook.set({"two_up": true});
			ebook.set({"current_page": [0,1]});
			ebook.toggleTwoUp();
			expect(ebook.get("current_page")).toEqual([1]);
		});

	})

	describe("paginating", function() {

		var ebook;
		
		beforeEach(function() {
			pacDocStub.goToNextSection = function() {}
			spyOn(Readium.Models, "PackageDocument").andReturn(pacDocStub);
			ebook = new Readium.Models.Ebook;
		});

		it("sets the length of the current_page array to two in two up", function() {
			ebook.set({"num_pages": 10});
			ebook.toggleTwoUp();
			expect(ebook.get("current_page").length).toEqual(2);
		});

		it("sets the pages to [0,1] when toggling on the first page", function() {
			// edge case
			ebook.set({"num_pages": 10, "current_page": [1]});
			ebook.toggleTwoUp();
			expect(ebook.get("current_page")[0]).toEqual(0);
			expect(ebook.get("current_page")[1]).toEqual(1);
		});

		it("sets the pages to [2,3] when toggling on page 1 or 3", function() {
			ebook.set({"num_pages": 10, "current_page": [2]});
			ebook.toggleTwoUp();
			expect(ebook.get("current_page")[0]).toEqual(2);
			expect(ebook.get("current_page")[1]).toEqual(3);

			// una mas
			ebook.toggleTwoUp(); 
			ebook.set({"current_page": [3]});
			ebook.toggleTwoUp();

			expect(ebook.get("current_page")[0]).toEqual(2);
			expect(ebook.get("current_page")[1]).toEqual(3);

		});

	})

});