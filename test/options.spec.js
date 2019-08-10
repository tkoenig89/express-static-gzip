const expect = require('chai').expect;
const { sanitizeOptions } = require('../util/options');

describe('option', function () {
    it('should handle no options provided', function () {
        const res = sanitizeOptions();
        expect(res).to.deep.equal({ index: 'index.html' });
    });

    it('should parse index options', function () {
        let res = sanitizeOptions({ index: 'main.js' });
        expect(res).to.deep.equal({ index: 'main.js', serveStatic: { index: 'main.js' } });

        res = sanitizeOptions({ index: false });
        expect(res).to.haveOwnProperty("index");
        expect(res.index).to.equal(false);
    });

    it('should parse indexFromEmptyFile options', function () {
        let res = sanitizeOptions({ indexFromEmptyFile: 'main.js' });
        expect(res).to.deep.equal({ index: 'main.js' });

        res = sanitizeOptions({ indexFromEmptyFile: false });

        expect(res).to.haveOwnProperty("index");
        expect(res.index).to.equal(false);
    });

    it('should keep serveStatic options', function () {
        const res = sanitizeOptions({ serveStatic: { index: 'main.js' } });
        expect(res).to.deep.equal({ index: 'index.html', serveStatic: { index: 'main.js' } });
    });

    it('should not overwrite serverStatic.index when already set', function () {
        const res = sanitizeOptions({ index: false, serveStatic: { index: 'index.html' } });
        expect(res).to.deep.equal({ index: false, serveStatic: { index: 'index.html' } });
    });

    it('should parse enableBrotli option', function () {
        let res = sanitizeOptions({ enableBrotli: true });
        expect(res).to.deep.equal({ enableBrotli: true, index: 'index.html' });

        res = sanitizeOptions({ enableBrotli: 'true' });
        expect(res).to.deep.equal({ enableBrotli: true, index: 'index.html' });
    });

    it('should parse customCompressions', function () {
        const compression = { encodingName: 'brotli', fileExtension: 'br' };
        const res = sanitizeOptions({ customCompressions: [compression] });
        expect(res).to.deep.equal({ customCompressions: [compression], index: 'index.html' });
    });

    it('should parse empty customCompressions', function () {
        const res = sanitizeOptions({ customCompressions: [] });
        expect(res).to.deep.equal({ customCompressions: [], index: 'index.html' });
    });

    it('should ignore bad customCompressions', function () {
        const res = sanitizeOptions({ customCompressions: true });
        expect(res).to.deep.equal({ index: 'index.html' });
    });

    it('should strip additional options', function () {
        const res = sanitizeOptions({ index: 'main.js', test: 'value' });
        expect(res).to.deep.equal({ index: 'main.js', serveStatic: { index: 'main.js' } });
    });

    it('should parse orderPreference', function () {
        const res = sanitizeOptions({ orderPreference: ['br'] });
        expect(res).to.deep.equal({ index: 'index.html', orderPreference: ['br'] });
    });

    it('should copy serveStatic options from root', function () {
        const res = sanitizeOptions({ fallthrough: false });
        expect(res.serveStatic.fallthrough).to.equal(false);

        const res2 = sanitizeOptions({ setHeaders: () => 'test' });
        expect(res2.serveStatic.setHeaders()).to.equal('test');
    });

    it('should copy serveStatic options from root, while keeping other serveStatic options', function () {
        const options = sanitizeOptions({ fallthrough: false, serveStatic: { maxAge: 234 } });
        expect(options.serveStatic).to.deep.equal({ fallthrough: false, maxAge: 234 });
    });

    it('should not overwrite serveStatic options with options from root', function () {
        const options = sanitizeOptions({ maxAge: 123, serveStatic: { maxAge: 234 } });
        expect(options.serveStatic).to.deep.equal({ maxAge: 234 });
    });

});
