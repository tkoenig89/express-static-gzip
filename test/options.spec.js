const expect = require('chai').expect;
const { sanitizeOptions } = require('../util/options');

describe('option', function () {
    it('should handle no options provided', function () {
        const res = sanitizeOptions();
        expect(res).to.deep.equal({ index: true });
    });

    it('should parse index options', function () {
        let res = sanitizeOptions({ index: true });
        expect(res).to.deep.equal({ index: true });

        res = sanitizeOptions({ index: false });
        expect(res).to.deep.equal({ index: false });
    });

    it('should parse indexFromEmptyFile options', function () {
        let res = sanitizeOptions({ indexFromEmptyFile: true });
        expect(res).to.deep.equal({ index: true });

        res = sanitizeOptions({ indexFromEmptyFile: false });
        expect(res).to.deep.equal({ index: false });
    });

    it('should parse enableBrotli option', function () {
        let res = sanitizeOptions({ enableBrotli: true });
        expect(res).to.deep.equal({ enableBrotli: true, index: true });

        res = sanitizeOptions({ enableBrotli: 'true' });
        expect(res).to.deep.equal({ enableBrotli: true, index: true });
    });

    it('should parse customCompressions', function () {
        const compression = { encodingName: 'brotli', fileExtension: 'br' };
        const res = sanitizeOptions({ customCompressions: [compression] });
        expect(res).to.deep.equal({ customCompressions: [compression], index: true });
    });

    it('should parse empty customCompressions', function () {
        const res = sanitizeOptions({ customCompressions: [] });
        expect(res).to.deep.equal({ customCompressions: [], index: true });
    });

    it('should ignore bad customCompressions', function () {
        const res = sanitizeOptions({ customCompressions: true });
        expect(res).to.deep.equal({ index: true });
    });

    it('should strip additional options', function () {
        const res = sanitizeOptions({ index: true, test: 'value' });
        expect(res).to.deep.equal({ index: true });
    });

    it('should parse orderPreference', function () {
        const res = sanitizeOptions({ orderPreference: ['br'] });
        expect(res).to.deep.equal({ index: true, orderPreference: ['br'] });
    });
});
