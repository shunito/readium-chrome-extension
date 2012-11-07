describe("Readium.Models.ReadiumPagination", function () {

    describe('traversing pages', function () {
        
        beforeEach(function () {
            
            this.packageDocument = Factory.spy("package_document");
            spyOn(Readium.Models, "PackageDocument").andReturn(this.packageDocument);
            
            this.epub = new Readium.Models.EPUB({"package_doc_path": "some/file/path"});
            this.epubController = new Readium.Models.EPUBController({"epub": this.epub});
            this.pages = new Readium.Models.ReadiumPagination({"model": this.epubController});
        });

        describe('reflowable with single page displayed', function () {
        
            beforeEach(function () {
                
                var section;
                section = {
                    isFixedLayout: function () {
                        return false;
                    }
                };

                this.pages.set({
                    num_pages: 10,
                    current_page: [2]
                });

                this.epubController.set({
                    two_up: false
                });

                spyOn(this.epubController, "getCurrentSection").andReturn(section);
                spyOn(this.epubController.paginator, "shouldScroll").andReturn(false);
            });

            describe("left-to-right", function () {

                beforeEach(function () {
                    this.epub.set("page_prog_dir", "ltr");
                });

                describe("goRight()", function () {
                    
                    it('increments the page number if there are more pages', function () {

                        spyOn(this.epubController, "goToNextSection");
                        this.pages.goRight();

                        expect(this.pages.get("current_page")).toEqual([3]);
                        expect(this.epubController.goToNextSection).not.toHaveBeenCalled();
                    });

                    it('calls goToNextSection if there are no more pages', function () {

                        this.pages.set("num_pages", 1);
                        spyOn(this.epubController, "goToNextSection");
                        this.pages.goRight();

                        expect(this.pages.get("current_page")).toEqual([1]);
                        expect(this.epubController.goToNextSection).toHaveBeenCalled();
                    });
                });

                describe("goLeft()", function () {

                    it('decrements the page number if there are more pages', function () {

                        spyOn(this.epubController, "goToPrevSection");
                        this.pages.goLeft();

                        expect(this.pages.get("current_page")).toEqual([1]);
                        expect(this.epubController.goToPrevSection).not.toHaveBeenCalled();
                    });

                    it('calls goToPrevSection from page one', function () {
                        
                        this.pages.set("current_page", [1]);
                        spyOn(this.epubController, "goToPrevSection");
                        this.pages.goLeft();

                        expect(this.pages.get("current_page")).toEqual([1]);
                        expect(this.epubController.goToPrevSection).toHaveBeenCalled();
                    });
                });
            });

            describe("right-to-left", function () {

                beforeEach(function () {
                    this.epub.set("page_prog_dir", "rtl");
                });

                describe("goRight()", function () {
                    
                    it('decrements the page number if there are more pages', function () {

                        spyOn(this.epubController, "goToPrevSection");
                        this.pages.goRight();

                        expect(this.pages.get("current_page")).toEqual([1]);
                        expect(this.epubController.goToPrevSection).not.toHaveBeenCalled();
                    });

                    it('calls goToPrevSection if there are no more pages', function () {

                        this.pages.set("num_pages", 1);
                        spyOn(this.epubController, "goToPrevSection");
                        this.pages.goRight();

                        expect(this.pages.get("current_page")).toEqual([1]);
                        expect(this.epubController.goToPrevSection).toHaveBeenCalled();
                    });
                });

                describe("goLeft()", function () {

                    it('increments the page number if there are more pages', function () {

                        spyOn(this.epubController, "goToNextSection");
                        this.pages.goLeft();

                        expect(this.pages.get("current_page")).toEqual([3]);
                        expect(this.epubController.goToNextSection).not.toHaveBeenCalled();
                    });

                    it('calls goToNextSection from last page', function () {
                        
                        this.pages.set("current_page", [10]);
                        spyOn(this.epubController, "goToNextSection");
                        this.pages.goLeft();

                        expect(this.epubController.goToNextSection).toHaveBeenCalled();
                    });
                });
            });
        });

        describe('reflowable with two pages displayed', function () {

            beforeEach(function () {
                
                var section;
                section = {
                    isFixedLayout: function () {
                        return false;
                    }
                };

                this.pages.set({
                    num_pages: 10,
                    current_page: [3, 4]
                });

                this.epubController.set({
                    two_up: true
                });

                spyOn(this.epubController, "getCurrentSection").andReturn(section);
            });

            describe("nextPage()", function () {
                
                it('increments both page numbers if there are more pages', function () {
                });

                it('calls goToNextSection if there are no more pages', function () {

                    this.pages.set("num_pages", 4);
                    spyOn(this.epubController, "goToNextSection");
                    this.pages.nextPage();
                    
                    expect(this.epubController.goToNextSection).toHaveBeenCalled();
                });
            });

            describe("prevPage()", function () {

            it('decrements both page numbers if there are more pages', function () {
            });

            it('calls goToPrevSection if at the beginning', function () {

                this.pages.set("current_page", [1, 2]);
                spyOn(this.epubController, "goToPrevSection");
                this.pages.prevPage();

                expect(this.epubController.goToPrevSection).toHaveBeenCalled();
            });
            });
        });
    });
});
