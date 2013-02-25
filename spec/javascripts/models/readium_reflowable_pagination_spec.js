describe("Readium.Models.ReadiumReflowablePagination", function () {

    describe("reflowable pagination", function () { 

        beforeEach(function () {
            
            this.packageDocument = Factory.spy("package_document");
            spyOn(Readium.Models, "PackageDocument").andReturn(this.packageDocument);
            
            Acc = {};
            this.epub = new Readium.Models.EPUB({"package_doc_path": "some/file/path"});
            this.epubController = new Readium.Models.EPUBController({"epub": this.epub});
            this.pages = new Readium.Models.ReadiumReflowablePagination({"model": this.epubController });
        });

        describe('toggling synthetic spread', function () {

            beforeEach(function () {
                
                var section = {
                    isFixedLayout: function () {
                        return false;
                    },

                    firstPageOffset : function () {
                        return false;
                    }
                };

                spyOn(this.epubController, "getCurrentSection").andReturn(section);
                spyOn(this.epubController.paginator, "shouldScroll").andReturn(false);
            });

            describe("left-to-right page progression", function () {

                beforeEach(function () {
                    this.epub.set("page_prog_dir", "ltr");
                });

                it('1 page -> 2 pages', function () {

                    this.pages.set({
                        num_pages: 10,
                        current_page: [2]
                    });

                    this.epubController.set({
                        two_up: false,
                        can_two_up: true
                    });

                    this.pages.toggleTwoUp();

                    expect(this.pages.get('current_page')).toEqual([1, 2]);
                });

                it('2 pages -> 1 page', function () {

                    this.pages.set({
                        num_pages: 10,
                        current_page: [1, 2]
                    });

                    this.epubController.set({
                        two_up: true,
                        can_two_up: true
                    });

                    this.pages.toggleTwoUp();

                    expect(this.pages.get('current_page')).toEqual([1]);
                });
            });
            
            describe("right-to-left page progression", function () {

                beforeEach(function () {
                    this.epub.set("page_prog_dir", "rtl");
                });

                it('1 page -> 2 pages', function () {

                    this.pages.set({
                        num_pages: 10,
                        current_page: [2]
                    });

                    this.epubController.set({
                        two_up: false,
                        can_two_up: true
                    });

                    this.pages.toggleTwoUp();

                    expect(this.pages.get('current_page')).toEqual([1, 2]);
                });

                it('2 pages -> 1 page', function () {

                    this.pages.set({
                        num_pages: 10,
                        current_page: [1, 2]
                    });

                    this.epubController.set({
                        two_up: true,
                        can_two_up: true
                    });

                    this.pages.toggleTwoUp();

                    expect(this.pages.get('current_page')).toEqual([1]);
                });
            });
        });

        describe('1 page navigation', function () {
        
            beforeEach(function () {
                
                var section;
                section = {
                    isFixedLayout: function () {
                        return false;
                    },

                    firstPageOffset : function () {
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

            describe("left-to-right page progression", function () {

                beforeEach(function () {
                    this.epub.set("page_prog_dir", "ltr");
                });

                it('increments the page number if there are more pages', function () {

                    spyOn(this.epubController, "goToNextSection");
                    this.pages.goRight();

                    expect(this.pages.get("current_page")).toEqual([3]);
                    expect(this.epubController.goToNextSection).not.toHaveBeenCalled();
                });

                it('decrements the page number if there are more pages', function () {

                    spyOn(this.epubController, "goToPrevSection");
                    this.pages.goLeft();

                    expect(this.pages.get("current_page")).toEqual([1]);
                    expect(this.epubController.goToPrevSection).not.toHaveBeenCalled();
                });
            });

            describe("right-to-left page progression", function () {

                beforeEach(function () {
                    this.epub.set("page_prog_dir", "rtl");
                });

                it('decrements the page number if there are more pages', function () {

                    spyOn(this.epubController, "goToPrevSection");
                    this.pages.goRight();

                    expect(this.pages.get("current_page")).toEqual([1]);
                    expect(this.epubController.goToPrevSection).not.toHaveBeenCalled();
                });

                it('increments the page number if there are more pages', function () {

                    spyOn(this.epubController, "goToNextSection");
                    this.pages.goLeft();

                    expect(this.pages.get("current_page")).toEqual([3]);
                    expect(this.epubController.goToNextSection).not.toHaveBeenCalled();
                });
            });
        });

        describe('2 page navigation', function () {

            beforeEach(function () {
                
                var section;
                section = {
                    isFixedLayout: function () {
                        return false;
                    },

                    firstPageOffset : function () {
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
                spyOn(this.epubController.paginator, "shouldScroll").andReturn(false);
            });

            describe("left-to-right page progression", function () {

                beforeEach(function () {
                    this.epub.set("page_prog_dir", "ltr");
                });

                it('increments the page number if there are more pages', function () {

                    spyOn(this.epubController, "goToNextSection");
                    this.pages.goRight();

                    expect(this.pages.get("current_page")).toEqual([5, 6]);
                    expect(this.epubController.goToNextSection).not.toHaveBeenCalled();
                });

                it('decrements the page number if there are more pages', function () {

                    spyOn(this.epubController, "goToPrevSection");
                    this.pages.goLeft();

                    expect(this.pages.get("current_page")).toEqual([1,2]);
                    expect(this.epubController.goToPrevSection).not.toHaveBeenCalled();
                });
            });

            describe("right-to-left page progression", function () {

                beforeEach(function () {
                    this.epub.set("page_prog_dir", "rtl");
                });

                it('decrements the page number if there are more pages', function () {

                    spyOn(this.epubController, "goToPrevSection");
                    this.pages.goRight();

                    expect(this.pages.get("current_page")).toEqual([1, 2]);
                    expect(this.epubController.goToPrevSection).not.toHaveBeenCalled();
                });

                it('increments the page number if there are more pages', function () {

                    spyOn(this.epubController, "goToNextSection");
                    this.pages.goLeft();

                    expect(this.pages.get("current_page")).toEqual([5, 6]);
                    expect(this.epubController.goToNextSection).not.toHaveBeenCalled();
                });
            });
        });
    });
});
