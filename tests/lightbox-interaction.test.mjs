import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

function assertHtml(pattern, message) {
    assert.ok(pattern.test(html), message);
}

test('lightbox supports every close interaction', () => {
    assertHtml(
        /dom\.lbClose\.addEventListener\('click', closeLightbox\)/,
        'close button should close the lightbox'
    );
    assertHtml(
        /dom\.lbImg\.addEventListener\('click', closeLightbox\)/,
        'preview image should close the lightbox'
    );
    assertHtml(
        /if \(e\.target === dom\.lightbox\) closeLightbox\(\)/,
        'overlay should close the lightbox'
    );
    assertHtml(
        /if \(e\.key === 'Escape' && dom\.lightbox\.classList\.contains\('open'\)\) closeLightbox\(\)/,
        'Escape should close an open lightbox'
    );
});

test('mobile close button is touch friendly and respects safe areas', () => {
    assertHtml(
        /\.lightbox-close\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/s,
        'close button should be at least 44px square'
    );
    assertHtml(
        /top:\s*calc\(1rem \+ env\(safe-area-inset-top\)\)/,
        'close button should respect the top safe area'
    );
    assertHtml(
        /right:\s*calc\(1rem \+ env\(safe-area-inset-right\)\)/,
        'close button should respect the right safe area'
    );
});

test('lightbox exposes accessible dialog and close button labels', () => {
    assertHtml(
        /<div class="lightbox" id="lightbox" role="dialog" aria-modal="true"/,
        'lightbox should expose modal dialog semantics'
    );
    assertHtml(/previewDialog:/, 'translations should include a dialog label');
    assertHtml(/closePreview:/, 'translations should include a close label');
    assertHtml(
        /dom\.lightbox\.setAttribute\('aria-label', t\.previewDialog\)/,
        'dialog label should follow the selected language'
    );
    assertHtml(
        /dom\.lbClose\.setAttribute\('aria-label', t\.closePreview\)/,
        'close button label should follow the selected language'
    );
});
