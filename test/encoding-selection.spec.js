const expect = require('chai').expect;
const { findEncoding } = require('../util/encoding-selection');

describe('encoding-selection', function () {
    const GZIP = { encodingName: "gzip", fileExtension: 'gz' };
    const BROTLI = { encodingName: "br", fileExtension: 'br' };
    const DEFLATE = { encodingName: "deflate", fileExtension: 'deflate' };

    it('should handle empty accepted-encoding', function () {
        const result = findEncoding('', [GZIP]);
        expect(result).to.be.null;
    });

    it('should handle no available compressions', function () {
        const result = findEncoding('gzip', []);
        expect(result).to.be.null;
    });

    it('should select simple match', function () {
        const result = findEncoding('gzip', [GZIP]);
        expect(result).to.be.deep.equal(GZIP);
    });

    it('should select by order', function () {
        const result = findEncoding('gzip, br', [GZIP, BROTLI]);
        expect(result).to.be.deep.equal(GZIP);
    });

    it('should select by different order', function () {
        const result = findEncoding('br, gzip', [GZIP, BROTLI]);
        expect(result).to.be.deep.equal(BROTLI);
    });

    it('should select by quality', function () {
        const result = findEncoding('br;q=0.5, gzip;q=1.0', [GZIP, BROTLI]);
        expect(result).to.be.deep.equal(GZIP);
    });

    it('should handle strange formating', function () {
        const result = findEncoding('br ; q=0.5 , gzip ; q=1.0', [GZIP, BROTLI]);
        expect(result).to.be.deep.equal(GZIP);
    });

    it('should handle wildcard', function () {
        const result = findEncoding('br ; q=0.5 , * ; q=1.0', [GZIP]);
        expect(result).to.be.deep.equal(GZIP);
    });

    it('should favour server preference over client order', function () {
        const result = findEncoding('gzip, deflate, br', [GZIP, BROTLI, DEFLATE], ['br']);
        expect(result).to.be.deep.equal(BROTLI);
    });

    it('should work with multiple server preferences', function () {
        const result = findEncoding('deflate, gzip', [GZIP, BROTLI, DEFLATE], ['br', 'gzip']);
        expect(result).to.be.deep.equal(GZIP);
    });

    it('should use client order, when server preference not available', function () {
        const result = findEncoding('deflate, gzip', [GZIP, BROTLI, DEFLATE], ['br']);
        expect(result).to.be.deep.equal(DEFLATE);
    });

    it('should use server preference with quality', function () {
        const result = findEncoding('gzip; q=0.6, deflate; q=1, br;q=0.5', [GZIP, BROTLI, DEFLATE], ['br']);
        expect(result).to.be.deep.equal(BROTLI);
    });
});
