const expect = require('chai').expect;
const { findEncoding } = require('../util/encoding-selection');

describe('encoding-selection', function () {
    const GZIP = { encodingName: "gzip", fileExtension: 'gz' };
    const BROTLI = { encodingName: "brotli", fileExtension: 'br' };

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
        const result = findEncoding('gzip, brotli', [GZIP, BROTLI]);
        expect(result).to.be.deep.equal(GZIP);
    });

    it('should select by different order', function () {
        const result = findEncoding('brotli, gzip', [GZIP, BROTLI]);
        expect(result).to.be.deep.equal(BROTLI);
    });

    it('should select by quality', function () {
        const result = findEncoding('brotli;q=0.5, gzip;q=1.0', [GZIP, BROTLI]);
        expect(result).to.be.deep.equal(GZIP);
    });

    it('should handle strange formating', function () {
        const result = findEncoding('brotli ; q=0.5 , gzip ; q=1.0', [GZIP, BROTLI]);
        expect(result).to.be.deep.equal(GZIP);
    });
});
