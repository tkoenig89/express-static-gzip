const expect = require('chai').expect;
const { parseOptions } = require('../util/options');

describe('option', function () {
    it('should handle no options provided', function () {
        const res = parseOptions();
        expect(res).to.deep.equal({ index: true });
    });

    it('should parse index options', function () {
        let res = parseOptions({ index: true });
        expect(res).to.deep.equal({ index: true });

        res = parseOptions({ index: false });
        expect(res).to.deep.equal({ index: false });
    });

    it('should parse indexFromEmptyFile options', function () {
        let res = parseOptions({ indexFromEmptyFile: true });
        expect(res).to.deep.equal({ index: true });

        res = parseOptions({ indexFromEmptyFile: false });
        expect(res).to.deep.equal({ index: false });
    });

    it('should parse enableBrotli option', function () {
        let res = parseOptions({ enableBrotli: true });
        expect(res).to.deep.equal({ enableBrotli: true, index: true });

        res = parseOptions({ enableBrotli: 'true' });
        expect(res).to.deep.equal({ enableBrotli: true, index: true });
    });

    it('should parse customCompressions', function () {
        const compression = { encodingName: 'brotli', fileExtension: 'br' };
        const res = parseOptions({ customCompressions: [compression] });
        expect(res).to.deep.equal({ customCompressions: [compression], index: true });
    });

    it('should parse empty customCompressions', function () {
        const res = parseOptions({ customCompressions: [] });
        expect(res).to.deep.equal({ customCompressions: [], index: true });
    });

    it('should ignore bad customCompressions', function () {
        const res = parseOptions({ customCompressions: true });
        expect(res).to.deep.equal({ index: true });
    });

    it('should strip additional options', function () {
        const res = parseOptions({ index: true, test: 'value' });
        expect(res).to.deep.equal({ index: true });
    });
});
