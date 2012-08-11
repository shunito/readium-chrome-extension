# Testing Media Overlays Features

Note that the tests described here go beyond automated unit testing and should be done by a human.

## Moby Dick

[Download](http://code.google.com/p/epub-samples/downloads/detail?name=moby-dick-mo-20120214.epub)

This reflowable book has media overlays for the first two chapters.

 * Go to the beginning of the book and press 'play'. You should get an alert that this part of the book does not feature media overlays.
 * Go to chapter 1. Press 'play'. The text should be highlighted in gray/blue as the audio clips play.
 * Let playback continue. The pages should turn to match it.
 * During playback, turn the page. Playback should jump to the new page.
 * Pause playback and turn the page. Restart playback. It should start at the right place.
 * Switch between single-page and two-page display (in Readium's settings dialog). Try these page-related tests again.
 
Known behavior: if an element starts on one page and ends on another, it is treated as though it is on the first of those two pages. There is no reliable way of synchronizing audio at a sub-element level.

## Valentin Haüy

TBD: Download link

This short reflowable book has media overlays throughout.

Use the same tests as above, except the highlight color should come from Readium's own default themes, as there is no authored active-class style.

## TBD

Include some fixed-layout books that feature Media Overlays.