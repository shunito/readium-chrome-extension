describe("Readium.Models.ReadiumPagination", function () {

    describe("defaults", function () {

        beforeEach(function () {

            this.epub = new Readium.Models.EPUB({"package_doc_path": "some/file/path"});
            this.epubController = new Readium.Models.EPUBController({"epub": this.epub});
            this.pagination = new Readium.Models.ReadiumPagination({"model": this.epubController});
        });

        it('correctly sets default attributes', function () {

            expect(this.pagination.get("num_pages")).toEqual(0);
        });
    });

    describe('traversing pages', function () {
        
        beforeEach(function () {
            
            this.packageDocument = Factory.spy("package_document");
            spyOn(Readium.Models, "PackageDocument").andReturn(this.packageDocument);
            
            this.epub = new Readium.Models.EPUB({"package_doc_path": "some/file/path"});
            this.epubController = new Readium.Models.EPUBController({"epub": this.epub});
            this.pages = new Readium.Models.ReadiumPagination({"model": this.epubController});
        });

        describe('reflowable section in one up', function () {
        
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
            });
        });

        describe("nextPage()", function () {
            
            it('increments the page number if there are more pages', function () {
            });

            it('calls goToNextSection if there are no more pages', function () {

                this.pages.set("num_pages", 1);
                spyOn(this.epubController, "goToNextSection");
                this.pages.nextPage();

                expect(this.pages.get("current_page")).toEqual([1]);
                expect(this.epubController.goToNextSection).toHaveBeenCalled();
            });
        });

        describe("prevPage()", function () {

            it('decrements the page number if there are more pages', function () {
            });

            it('calls goToPrevSection from page one', function () {
                
                this.pages.set("current_page", [1]);
                spyOn(this.epubController, "goToPrevSection");
                this.pages.prevPage();

                expect(this.pages.get("current_page")).toEqual([1]);
                expect(this.epubController.goToPrevSection).toHaveBeenCalled();
            });
        });
    });

    describe("reflowable section in two up", function () {
        
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
