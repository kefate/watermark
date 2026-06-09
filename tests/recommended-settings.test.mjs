import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

function extractFunction(name) {
    const functionIndex = html.indexOf(`function ${name}(`);
    assert.notEqual(functionIndex, -1, `${name} should be declared`);

    const braceIndex = html.indexOf('{', functionIndex);
    let depth = 0;
    let quote = null;
    let escaped = false;
    let lineComment = false;
    let blockComment = false;

    for (let i = braceIndex; i < html.length; i++) {
        const char = html[i];
        const next = html[i + 1];

        if (lineComment) {
            if (char === '\n') lineComment = false;
            continue;
        }
        if (blockComment) {
            if (char === '*' && next === '/') {
                blockComment = false;
                i++;
            }
            continue;
        }
        if (quote) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === quote) {
                quote = null;
            }
            continue;
        }
        if (char === '/' && next === '/') {
            lineComment = true;
            i++;
            continue;
        }
        if (char === '/' && next === '*') {
            blockComment = true;
            i++;
            continue;
        }
        if (char === '"' || char === "'" || char === '`') {
            quote = char;
            continue;
        }
        if (char === '{') depth++;
        if (char === '}' && --depth === 0) {
            return html.slice(functionIndex, i + 1);
        }
    }

    assert.fail(`${name} should have a complete function body`);
}

function loadCalculator() {
    const source = extractFunction('calculateRecommendedSettings');
    const document = {
        createElement() {
            return {
                getContext() {
                    return {
                        font: '',
                        measureText(text) {
                            return { width: Array.from(text).length * 100 };
                        }
                    };
                }
            };
        }
    };

    return vm.runInNewContext(`(${source})`, { document, Math });
}

test('recommended settings stay within the available controls and scale with the image', () => {
    const calculate = loadCalculator();
    const small = calculate(800, 600, 'abcd');
    const large = calculate(1600, 1200, 'abcd');

    for (const settings of [small, large]) {
        assert.ok(settings.opacity >= 18 && settings.opacity <= 30);
        assert.ok(settings.fontSize >= 10 && settings.fontSize <= 100);
        assert.ok(settings.spacing >= 50 && settings.spacing <= 800);
    }

    assert.ok(large.fontSize > small.fontSize);
});

test('longer text does not increase font size or reduce spacing', () => {
    const calculate = loadCalculator();
    const shortText = calculate(1200, 800, 'abcd');
    const longText = calculate(1200, 800, 'x'.repeat(30));

    assert.ok(longText.fontSize <= shortText.fontSize);
    assert.ok(longText.spacing >= shortText.spacing);
});

test('very large images increase spacing after font size reaches its limit', () => {
    const calculate = loadCalculator();
    const medium = calculate(2400, 2000, 'a');
    const large = calculate(8000, 6000, 'a');

    assert.equal(medium.fontSize, 100);
    assert.equal(large.fontSize, 100);
    assert.ok(large.spacing > medium.spacing);
});

test('default Chinese text uses a compact spacing on a common image size', () => {
    const calculate = loadCalculator();
    const settings = calculate(1200, 800, '仅供办理业务使用');

    assert.ok(settings.spacing <= 200);
});

test('extreme text length uses the safe font-size and spacing boundaries', () => {
    const calculate = loadCalculator();
    const settings = calculate(300, 200, 'x'.repeat(500));

    assert.equal(settings.fontSize, 10);
    assert.equal(settings.spacing, 800);
});

test('invalid image dimensions or empty text do not produce settings', () => {
    const calculate = loadCalculator();

    assert.equal(calculate(0, 800, 'text'), null);
    assert.equal(calculate(800, 600, '   '), null);
});

test('recommended settings button is explicit, localized, and keeps color untouched', () => {
    assert.match(
        html,
        /<div class="recommended-settings-panel">[\s\S]*?<div class="recommended-settings-head">[\s\S]*?<span id="lblDisplaySettings">显示参数<\/span>[\s\S]*?<button class="btn-recommend" id="btnRecommend" type="button" disabled>使用推荐参数<\/button>[\s\S]*?id="sliderOpacity"[\s\S]*?id="sliderFontSize"[\s\S]*?id="sliderSpacing"[\s\S]*?<\/div>\s*<div class="field">\s*<label class="field-label" id="lblFormat"/
    );
    assert.doesNotMatch(html, /\.btn-recommend\s*\{[^}]*width:\s*100%/s);
    assert.match(html, /lblDisplaySettings:\s*"显示参数"/);
    assert.match(html, /lblDisplaySettings:\s*"Display Settings"/);
    assert.match(html, /btnRecommend:\s*"使用推荐参数"/);
    assert.match(html, /btnRecommend:\s*"Use Recommended Settings"/);
    assert.match(html, /id="sliderSpacing" min="50" max="800"/);

    const source = extractFunction('applyRecommendedSettings');
    assert.match(source, /loadedImages\[0\]\.image/);
    assert.match(source, /dom\.sliderOpacity\.value = settings\.opacity/);
    assert.match(source, /dom\.sliderFontSize\.value = settings\.fontSize/);
    assert.match(source, /dom\.sliderSpacing\.value = settings\.spacing/);
    assert.match(source, /syncSliders\(\)/);
    assert.match(source, /saveSettings\(\)/);
    assert.doesNotMatch(source, /inputColor/);
    assert.doesNotMatch(source, /generatePreviews/);
});

test('uploaded images preserve file selection order for the recommendation baseline', () => {
    assert.match(html, /valid\.forEach\(\(f, index\) =>/);
    assert.match(html, /loadedImages\[index\] = \{ file: f, image: img, name: f\.name \}/);
    assert.match(html, /dom\.btnRecommend\.disabled = false/);
    assert.match(html, /dom\.btnRecommend\.addEventListener\('click', applyRecommendedSettings\)/);
});
