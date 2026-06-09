import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

function assertHtml(pattern, message) {
    assert.ok(pattern.test(html), message);
}

test('lightbox closes by clicking the image without a close button', () => {
    assert.doesNotMatch(html, /id="lbClose"/, 'lightbox should not include a close button');
    assert.doesNotMatch(html, /\.lightbox-close\s*\{/, 'removed close button should not keep unused styles');
    assertHtml(
        /dom\.lbImg\.addEventListener\('click',[\s\S]*?closeLightbox\(\)/,
        'clicking the preview image should close the lightbox'
    );
    assert.doesNotMatch(
        html,
        /dom\.lbImg\.addEventListener\('contextmenu',[\s\S]*?preventDefault/,
        'preview image should keep the native long-press menu'
    );
    assertHtml(
        /if \(e\.target === dom\.lightbox\) closeLightbox\(\)/,
        'overlay should close the lightbox'
    );
    assertHtml(
        /if \(e\.key === 'Escape'\) closeLightbox\(\)/,
        'Escape should close an open lightbox'
    );
});

test('desktop lightbox provides bounded previous and next navigation', () => {
    assertHtml(/id="lbPrev"/, 'lightbox should include a previous button');
    assertHtml(/id="lbNext"/, 'lightbox should include a next button');
    assertHtml(
        /card\.addEventListener\('click', \(\) => openLightbox\(index\)\)/,
        'preview cards should open the lightbox at their own index'
    );
    assertHtml(
        /dom\.lbPrev\.disabled = lightboxIndex <= 0/,
        'previous should be disabled on the first image'
    );
    assertHtml(
        /dom\.lbNext\.disabled = lightboxIndex >= resultEntries\.length - 1/,
        'next should be disabled on the last image'
    );
    assertHtml(
        /dom\.lbPrev\.addEventListener\('click', \(\) => showLightboxImage\(lightboxIndex - 1\)\)/,
        'previous button should move back one image'
    );
    assertHtml(
        /dom\.lbNext\.addEventListener\('click', \(\) => showLightboxImage\(lightboxIndex \+ 1\)\)/,
        'next button should move forward one image'
    );
});

test('mobile lightbox hides navigation buttons and supports horizontal swipes', () => {
    assertHtml(
        /@media \(max-width: 640px\) \{[\s\S]*?\.lightbox-nav\s*\{[^}]*display:\s*none;/,
        'mobile layout should hide previous and next buttons'
    );
    assertHtml(
        /dom\.lbImg\.addEventListener\('touchstart',[\s\S]*?touchStartX = e\.touches\[0\]\.clientX/,
        'touch start should record the initial horizontal position'
    );
    assertHtml(
        /dom\.lbImg\.addEventListener\('touchmove',[\s\S]*?dom\.lbImg\.style\.transform = 'translateX\(' \+ dragX \+ 'px\)'/,
        'the image should follow the finger during a horizontal drag'
    );
    assertHtml(
        /const dragX = canNavigate \? deltaX : deltaX \* 0\.25/,
        'dragging past the first or last image should use edge resistance'
    );
    assertHtml(
        /if \(Math\.abs\(deltaX\) < 50 \|\| Math\.abs\(deltaX\) <= Math\.abs\(deltaY\) \|\| !canNavigate\) \{[\s\S]*?resetLightboxPosition\(\)/,
        'short, vertical, or out-of-range gestures should animate back into place'
    );
    assertHtml(
        /animateLightboxChange\(targetIndex, deltaX < 0 \? 1 : -1\)/,
        'valid horizontal swipes should animate to the adjacent image'
    );
    assertHtml(
        /function animateLightboxChange\(index, direction\)[\s\S]*?translateX\(' \+ \(-direction \* 100\) \+ 'vw\)'[\s\S]*?showLightboxImage\(index\)[\s\S]*?translateX\(' \+ \(direction \* 100\) \+ 'vw\)'/,
        'the current image should slide out and the next image should enter from the opposite side'
    );
    assertHtml(
        /function resetLightboxPosition\(\)[\s\S]*?transition = 'transform \.2s ease, opacity \.2s ease'[\s\S]*?transform = 'translateX\(0\)'/,
        'cancelled swipes should use an animated rebound'
    );
    assertHtml(
        /if \(suppressImageClick\) \{[\s\S]*?suppressImageClick = false;[\s\S]*?return;/,
        'the click synthesized after a swipe should not close the lightbox'
    );
});

test('keyboard arrows navigate only while the lightbox is open', () => {
    assertHtml(
        /if \(!dom\.lightbox\.classList\.contains\('open'\)\) return/,
        'keyboard navigation should be inactive while the lightbox is closed'
    );
    assertHtml(/if \(e\.key === 'ArrowLeft'\)/, 'left arrow should navigate backward');
    assertHtml(/if \(e\.key === 'ArrowRight'\)/, 'right arrow should navigate forward');
});

test('lightbox exposes accessible dialog and navigation labels', () => {
    assertHtml(
        /<div class="lightbox" id="lightbox" role="dialog" aria-modal="true"/,
        'lightbox should expose modal dialog semantics'
    );
    assertHtml(/previewDialog:/, 'translations should include a dialog label');
    assertHtml(
        /dom\.lightbox\.setAttribute\('aria-label', t\.previewDialog\)/,
        'dialog label should follow the selected language'
    );
    assertHtml(/previousImage:/, 'translations should include a previous-image label');
    assertHtml(/nextImage:/, 'translations should include a next-image label');
    assertHtml(
        /dom\.lbPrev\.setAttribute\('aria-label', t\.previousImage\)/,
        'previous button label should follow the selected language'
    );
    assertHtml(
        /dom\.lbNext\.setAttribute\('aria-label', t\.nextImage\)/,
        'next button label should follow the selected language'
    );
});
