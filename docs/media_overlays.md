# Media Overlays

## Goals

 * Serve as an example implementation of the EPUB 3 Media Overlays specification
 * Have all features that DAISY users would expect
 * Integrate well with existing Readium code, which will continue to be developed independently of the Media Overlays features
 

## Media Overlays in EPUB3

http://idpf.org/epub/30/spec/epub30-mediaoverlays.html

Interesting points for implementors:

 * SMIL defines synchronization points, each consisting of a text element and audio clip
 * Each content doc is referenced by no more than one SMIL file
 * Each <par> element is guaranteed to have one text and one audio child element (except for the special case of embedded media)
 * The flow of the SMIL file must match the default reading order of the content document
 * <seq> elements have an attribute `epub:textref`, indicating the corresponding content document element by its ID
 

 

## Implementation in Readium

### Supported features

 * Synchronized text highlight
 * Audio playback
 * Play/pause
 * Follows user navigation

Implemented under-the-hood as a tree structure: depth-first traversal to render as a playlist; tree nodes easy to filter for skip/escape support.
 
User experience challenges:

 * Synchronize with navigation. The easiest way to do this is whenever the page changes, MO changes.
 * Turn the pages during continuous playback. Needed hooks in Readium to listen to MO's current text src and match it with the pagination algorithm.

Technical challenges:

 * Audio synchronization had to work with Chrome's coarse timer granularity (could be as coarse as 1 sec)


### Code organization

 * core implementation exposed in MediaOverlay.js
 * underlying: smilModel.js and audioClipPlayer.js
 * Integration layers: media_overlay_controller.js and media_overlay_view_helper.js
 
 Elsewhere where MO appears: packageDocument.js (loading MediaOverlay objects), pagination_view_base.js, fixed_pagination_view.js, reflowable_pagination_view.js (referencing MediaOverlayController).
 
 TODO diagram
 
### Issues

 * Proper namespace support
 * Highlighting: when to use author-defined, when to use Readium defaults
 * URL matching
 * DOM vs custom tree structure: memory usage

### Future 
 
 This is the featureset being considered for subsequent Readium revisions:
 
 * Option to start MO playback upon opening a book
 * Add keyboard shortcuts (general a11y)
 * Add UI commands to set audio volume and rate
 * Add skippability options
 * Add escapability feature
 * Add fast-forward / rewind, and maybe phrase-level navigation
 * Refine reading experience regarding embedded media [TODO reference spec]
 * Sub-page-level sync: click a paragraph to start playback
 * Resume last audio position upon reopening a book
 * Library view shows whether a book has MO or not
 

## Appendix 1: API

In `mediaOverlay.js`

### `setUrl(url)`
Set the URL of the SMIL file that is to be parsed for this Media Overlay.

### `fetch(options)`
Retrieve the data from the URL specified by `setUrl` (but don't start playback yet).

### `findNodeByTextSrc(src)`
`src`: a text document URL, optionally including a fragment identifier

Returns the node object containing that src, or `null`.

### `startPlayback(node)`
`node`: a SMIL node to start playback from

Used for initializing SMIL playback. To start at a specific point, use `findNodeByTextSrc` to find the node, and then pass it to this function.  If `node` is `null`, then playback will start at the beginning of the file.

### `pause()`
Pause the audio

### `resume()`
Resume the audio

### `setVolume(level)`
`level`: a floating-point number

Set the audio volume. 0 is mute, and 1 is the loudest setting.

### Observable property `current_text_src`
`string`

Text src of the active SMIL text node, including, if relevant, the fragment identifier.

### Observable property `has_started_playback`
`boolean`

Indicates whether the document has started playing or not. Note that if the document has been started and then paused, this is `true`, whereas if it hasn't been started, or if it's been started and reset, this is `false`.

### Observable property `is_document_done`
`boolean`

Indicates that playback of the file has completed.

### Observable property `is_playing`
`boolean`

Indicates whether audio is playing or not.

### Observable property `is_ready`
`boolean`

Indicates that the file is loaded and ready to play.

## Future API functions

These will become available in a future revision.

### `escape()` 
Escape the current structure. If the current structure's `epub:type` value is not in the list of types which may be escaped, then this command is ignored and normal playback continues.

### `addSkipType(type)`
Add an `epub:type` value to the list of items which must be skipped by the player.

### `removeSkipType(type)`
Remove an `epub:type` value from the list of items which must be skipped by the player.

### `addEscapeType(type)`
Add an `epub:type` value to the list of items which may be escaped by the user.

### `removeEscapeType(type)`
Remove an `epub:type` value from the list of items which may be escaped by the user.

### `setRate(rate)`
`rate`: A floating-point value

Set the audio playback rate.  0.5 is considered slow, 1.0 is normal, and 2.0 is fast (but still possibly intelligible).

### Observable property `can_escape`
`boolean`

Indicates that the currently-playing structure may be escaped by the user.


## Appendix 2: Testing Media Overlays Features

Note that the tests described here go beyond automated spec testing and should be done by a human.

### Operations

 * Play
 * Pause
 * Turn a page during playback
 * Turn a page and then start playback
 * Pause playback mid-page and resume
 * Switch betwen two-page and single-page mode
 * See that the pages turn appropriately during continuous playback
 * FXL: The highlight should match what the author specified
 * Reflow: The highlight should do what we've decided (see "issues" above)

### Content

TODO 

 * Moby Dick
 * Valentin Hauy
 * Liz Castro's book
 * Other FXL