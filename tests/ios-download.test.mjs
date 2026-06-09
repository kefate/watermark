import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('iOS downloads use the native share sheet with image files', () => {
    assert.match(
        html,
        /function isIOSDevice\(\)[\s\S]*?iPad\|iPhone\|iPod[\s\S]*?maxTouchPoints > 1/,
        'iOS detection should include iPhones, iPads, and touch-capable iPad desktop mode'
    );
    assert.match(
        html,
        /new File\(\[blob\], fileName, \{ type: fmt \}\)/,
        'encoded canvases should become named image files'
    );
    assert.match(
        html,
        /navigator\.canShare\(\{ files \}\)/,
        'file sharing support should be checked before opening the share sheet'
    );
    assert.match(
        html,
        /await navigator\.share\(\{ files \}\)/,
        'iOS should open the native share sheet for saving images to Photos'
    );
});

test('iOS sharing never falls back to a file download', () => {
    assert.match(
        html,
        /if \(isIOSDevice\(\)\) \{[\s\S]*?await navigator\.share\(\{ files \}\)[\s\S]*?catch \(error\) \{[\s\S]*?\}[\s\S]*?toast\.remove\(\);[\s\S]*?return;/,
        'the iOS branch should end after the share sheet closes or fails'
    );
    assert.match(
        html,
        /\}\s*await downloadFiles\(files\);/,
        'regular downloads should remain available only after the iOS branch returns'
    );
});
