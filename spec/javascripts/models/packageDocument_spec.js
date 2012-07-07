// // I would really like to port our packageDocument class over to a 
// // backbone object. This is the spec for this port. It is using Jath
// // to conver the XML => JSON
// // 
// // I wrote my own library to do the XML => JSON it is called 
// describe('packageDocument', function() {

//   // an example of an epub 2 package doc
//   var xmlString = '';
//   xmlString += '<?xml version="1.0" encoding="UTF-8"?>'
//   xmlString += '<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="ean" version="2.0">'
//   xmlString += '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns="http://www.idpf.org/2007/opf">'
//   xmlString += "<dc:title>L'espagnol dans votre poche</dc:title>"
//   xmlString += "<dc:creator></dc:creator>"
//   xmlString += "<dc:publisher>Larousse</dc:publisher>"
//   xmlString += "<dc:description>Lorem Ipsum Dolor sed</dc:description>"
//   xmlString += "<dc:rights>copyright something or other</dc:rights>"
//   xmlString += "<dc:identifier id='ean'>9782035862464</dc:identifier>"
//   xmlString += "<dc:language>fr</dc:language>"
//   xmlString += "</metadata>"
//   xmlString += '<manifest>'
//   xmlString += '<item id="Page_1"  href="Page_1.html"  media-type="application/xhtml+xml"/>'
//   xmlString += '<item id="Page_2"  href="Page_2.html"  media-type="application/xhtml+xml"/>'
//   xmlString += '<item id="Page_3"  href="Page_3.html"  media-type="application/xhtml+xml"/>'
//   xmlString += '<item id="Page_4"  href="Page_4.html" media-overlay="Page_4_MO" media-type="application/xhtml+xml"/>'
//   xmlString += '<item id="Page_4_MO"  href="Page_4_MO.smil" media-type="application/smil+xml"/>'
//   xmlString += '<item id="css" href="styles.css" media-type="text/css" />'
//   xmlString += '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />'
//   xmlString += '<item id="cover" href="images/cover.jpg" media-type="image/jpeg"/>'
//   xmlString += '<item id="font2" href="Fonts/HighlanderStd-Medium.otf" media-type="application/x-font-otf"/>'
//   xmlString += '<item id="font3" href="Fonts/HighlanderStd-BookItalic.otf" media-type="application/x-font-otf"/>'
//   xmlString += "</manifest>"
//   xmlString += '<spine toc="ncx">'
//   xmlString += '<itemref idref="Page_1" properties="page-spread-right rendition:layout-pre-paginated"/><itemref idref="Page_2"/><itemref idref="Page_3"/>'
//   xmlString += '</spine>'
//   xmlString += "<bindings>"
//   xmlString += '<mediaType handler="figure-gallery-impl" media-type="application/x-epub-figure-gallery"/>'
//   xmlString += '</bindings>'
//   xmlString += '</package>';

//   var packDoc;

//   beforeEach(function() {
//     packDoc = new Readium.Models.PackageDocumentBase({}, {file_path: "banano/gram", root_url: "http://blah"});
//   });

//   describe('parsing the package document xml', function() {

//     var dom;

//     beforeEach(function() {
//       var parser = new window.DOMParser;
//       dom = parser.parseFromString(xmlString, 'text/xml');
//     });

//     it('parses the spine nodes from an xml string', function() {  
//       var res = packDoc.parse(xmlString);   
//       expect(res.spine.length).toEqual(3);
//     });

//     it('parses the epub version number', function() {
//       var res = packDoc.parse(dom);
//       expect(res.metadata.epub_version).toEqual("2.0");
//     });

//     it('parses the identifier', function() {
//       var res = packDoc.parse(dom);
//       expect(res.metadata.id).toEqual("9782035862464");
//     });

//     it('parses the title', function() {
//       var res = packDoc.parse(dom);
//       expect(res.metadata.title).toEqual("L'espagnol dans votre poche");
//     });

//     it('parses the manifest as a collection', function() {
//       var res = packDoc.parse(dom);
//       expect(typeof res.manifest.reset).toEqual("function")
//     });

//     it("parses the bindings", function() {
//       var res = packDoc.parse(dom);
//       expect(res.bindings.length).toEqual(1);
//       expect(res.bindings[0].media_type).toEqual("application/x-epub-figure-gallery");
//     })

//     it("parses spine item properties", function() {
//       var res = packDoc.parse(dom);
//       expect(res.spine[0].properties.page_spread).toEqual('right');
//       expect(res.spine[0].properties.fixed_flow).toEqual(true);
//     });

//     it("it sets properties as empty object if there are none", function() {
//       var res = packDoc.parse(dom);
//       expect(res.spine[1].properties).toEqual({});
//     });
    
//     it("parses the media-overlay attribute", function() {
//        var res = packDoc.parse(dom);
//        expect(res.manifest.at(3).media_overlay == "Page_4_MO"); 
//        expect(res.manifest.at(4).media_overlay == "");
//     });
//   });

//   describe('default values', function() {
    
//   });

//   describe('fetching the xml from the fs', function() {

//     it('accepts a url in the constructor', function() {
//       packDoc = new Readium.Models.PackageDocumentBase({}, {file_path: "banano/gram", root_url: "http://blah"});
//       expect(packDoc.file_path).toEqual("banano/gram");
//     });
//   });

//   describe("PackageDocument", function() {
    
//     var ebook;

//     beforeEach(function() {
//       packDoc = new Readium.Models.PackageDocumentBase({}, {file_path: "banano/gram", root_url: "http://blah"});
//       var parser = new window.DOMParser;
//       var dom = parser.parseFromString(xmlString, 'text/xml');
//       var res = packDoc.parse(dom);
//    	  ebook = new Readium.Models.PackageDocument(res, {file_path: "banano/gram", root_url: "http://blah"}) 
//     });

//     it('sets the default spine position', function() {
//       expect(ebook.get("spine_position")).toEqual(0);
//     });

//     it('does not have a spine_position < 0', function() {
//       expect(ebook.hasPrevSection()).toBeFalsy();
//     });

//     it('does not have a spine_position > spine.length - 1', function() {
//       ebook.set({spine_position: 2});
//       expect(ebook.hasNextSection()).toBeFalsy();
//     });

//     it('it does not enter an invalid state', function() {
//       ebook.set({spine_position: 100});
//       expect(ebook.get("spine_position") === 100).toBeFalsy()
//     });

//     it('fires and increased:spine pos event', function() {
//       var stub = {
//         called: function() {}
//       }

//       spyOn(stub, "called")
//       ebook.on("increased:spine_position", stub.called)
//       ebook.set({spine_position: 2});
//       //expect(stub.callback).toHaveBeenCalled();
//     })

//     it("sets the file_path if passed to constructor", function() {
//       ebook = new Readium.Models.PackageDocument({}, {file_path: "/public/sample_data/sample.opf"});
//       expect(ebook.file_path).toEqual("/public/sample_data/sample.opf");
//     });

//     describe("goToHref", function() {
//       it("sets the spine position correctly", function() {
//         ebook.goToHref("http://blah/Page_3.html");
//         expect(ebook.get("spine_position") ).toEqual(2);
//       })

//       it("does not change the spine position on invalid href", function() {
//         ebook.set({spine_position: 2})
//         ebook.goToHref("http://blah/Pafdsafasge_3.html");
//         expect(ebook.get("spine_position") ).toEqual(2);
//       })
//     });

//     it('can fetch itself from the fs', function() {
//       var done = false;
//       var isDone = function() {
//         return done;
//       }

//       Readium.FileSystemApi(function(api) { 
//         api.writeFile("path", xmlString, function(e) {
//           console.log("write succeeded")
//           done=true;
//         }, function() {
//           console.log("write failed")
//           done=true;
//         })
//       });
      
//       ebook = new Readium.Models.PackageDocument({}, {file_path: "path"});
//       waitsFor(isDone);
//       runs(function() {
//         done = false;
//         ebook.fetch({
//           success: function() {
//             done = true;
//           }
//         });  
//       })
      
//       waitsFor(isDone);
//       runs(function() {
//         expect(ebook.get("spine").length).toEqual(3);  
//       })
      


//     });

//   })
  
  
// })