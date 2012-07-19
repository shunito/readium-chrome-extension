(function() {

  describe('PackageDocument', function() {
    describe("initialization", function() {
      beforeEach(function() {
        stubFileSystem();
        return this.packageDocument = new Readium.Models.PackageDocument({
          book: {},
          file_path: "some/path"
        });
      });
      it('exists in the namespace', function() {
        return expect(Readium.Models.PackageDocument).toBeDefined();
      });
      it('sets the file path');
      return it('subscribes to spine position changed events', function() {
        spyOn(this.packageDocument.onSpinePosChanged, "apply");
        this.packageDocument.trigger("change:spine_position");
        return expect(this.packageDocument.onSpinePosChanged.apply).toHaveBeenCalled();
      });
    });
    return describe("parsing the xml", function() {
      beforeEach(function() {
        var xml_string;
        xml_string = jasmine.getFixtures().read('package_document.xml');
        this.xml = new window.DOMParser().parseFromString(xml_string, 'text/xml');
        this.packageDocument = new Readium.Models.PackageDocument({
          file_path: "some/path"
        });
        this.packageDocument.uri_obj = new URI("http://google.ca");
        spyOn(this.packageDocument, "crunchSpine");
        return this.json = this.packageDocument.parse(this.xml);
      });
      it('is working', function() {
        expect($('title', this.xml).text()).toEqual("L'espagnol dans votre poche");
        expect(Jath.resolver).toBeDefined();
        return expect(Readium.Collections.ManifestItems).toBeDefined();
      });
      it('parses the spine nodes', function() {
        return expect(this.json.spine.length).toEqual(3);
      });
      it('parses the manifest', function() {
        return expect(typeof this.json.manifest).toEqual("object");
      });
      it('calls getCoverHref with the manifest', function() {});
      return describe('parsing the metadata', function() {
        return it('parses the id', function() {});
      });
    });
  });

}).call(this);
