const expect = require('chai').expect;

const express = require('express');
const request = require('request').defaults({ followRedirect: false });
const serveStaticGzip = require('../index');

describe('End to end', function () {
    let server;

    afterEach(function () {
        server.close();
    });

    it('should contain right headers', function () {
        setupServer();

        return requestFile('/', { 'accept-encoding': 'gzip' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.headers['vary']).to.equal('Accept-Encoding');
            expect(resp.headers['content-encoding']).to.equal('gzip');
            expect(resp.headers['content-type']).to.equal('text/html; charset=UTF-8');
        });
    });

    it('should return file not found', function () {
        setupServer();

        return requestFile('/notFound.html').then(resp => {
            expect(resp.statusCode).to.equal(404);
        });
    });

    it('should handle index option false', function () {
        setupServer({ index: false });

        return requestFile('/').then(resp => {
            expect(resp.statusCode).to.equal(404);
        });
    });

    it('should handle index option false, serveStatic.index overwritten', function () {
        setupServer({ index: false, serveStatic: { index: "index.html" } });

        return requestFile('/').then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal("index.html")
        });
    });

    it('should handle index option default', function () {
        setupServer();

        return requestFile('/', { 'accept-encoding': 'gzip' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal('index.html.gz');
        });
    });

    it('should handle index option default with queryargs', function () {
        setupServer();

        return requestFile('/?foo=bar', { 'accept-encoding': 'gzip' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal('index.html.gz');
        });
    });

    it('should handle index option set', function () {
        setupServer({ index: 'main.js', enableBrotli: true });

        return requestFile('/', { 'accept-encoding': 'br' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal('main.js.br');
        });
    });

    it('should redirect to a directory with trailing slash with non-root mount', function() {
        setupServer(null, null, '/custom');
        return requestFile('/custom', { 'accept-encoding': 'br' }).then(resp => {
            expect(resp.statusCode).to.equal(301);
            expect(resp.headers['location']).to.equal('/custom/');
        });
    });

    it('should serve compressed index with non-root mount', function() {
        setupServer(null, null, '/custom');
        return requestFile('/custom/', { 'accept-encoding': 'gzip' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal('index.html.gz');
        });
    });

    it('should serve compressed file with non-root mount', function() {
        setupServer({ enableBrotli: true }, null, '/custom');
        return requestFile('/custom/main.js', { 'accept-encoding': 'br ' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal('main.js.br');
        });
    });

    it('should not serve brotli if not enabled', function () {
        setupServer();

        return requestFile('/', { 'accept-encoding': 'br' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal('index.html');
        });
    });

    it('should not serve brotli, but gzip', function () {
        setupServer();

        return requestFile('/', { 'accept-encoding': 'br,gzip' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal('index.html.gz');
        });
    });

    it('should serve brotli', function () {
        setupServer({ enableBrotli: true });

        return requestFile('/', { 'accept-encoding': 'br' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal('index.html.br');
        });
    });

    it('should serve custom compression', function () {
        setupServer({ customCompressions: [{ encodingName: 'test', fileExtension: 'tst' }] });

        return requestFile('/main.js', { 'accept-encoding': 'test' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal('main.js.tst');
        });
    });

    it('should fallback to no compression', function () {
        setupServer({ customCompressions: [{ encodingName: 'test', fileExtension: 'tst' }] });

        return requestFile('/main.js', { 'accept-encoding': 'gzip,br' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal('main.js');
        });
    });

    it('should use first match from accept-encoding', function () {
        setupServer({ customCompressions: [{ encodingName: 'test', fileExtension: 'tst' }], enableBrotli: true });

        return requestFile('/main.js', { 'accept-encoding': 'gzip,br,test' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal('main.js.br');
        }).then(() => {
            return requestFile('/main.js', { 'accept-encoding': 'gzip,test,br' }).then(resp => {
                expect(resp.statusCode).to.equal(200);
                expect(resp.body).to.equal('main.js.tst');
            });
        });
    });

    it('should select based on quality', function () {
        setupServer({ customCompressions: [{ encodingName: 'test', fileExtension: 'tst' }], enableBrotli: true });

        return requestFile('/main.js', { 'accept-encoding': 'gzip;q=1.0,br;q=0.4,test;q=0.5' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal('main.js.tst');
        });
    });

    it('should serve in alphabetical order on wildcard', function () {
        setupServer({ customCompressions: [{ encodingName: 'test', fileExtension: 'tst' }], enableBrotli: true });

        return requestFile('/index.html', { 'accept-encoding': '*' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal('index.html.br');
        });
    });

    it('should use server\'s prefered encoding', function () {
        setupServer({
            customCompressions: [{ encodingName: 'deflate', fileExtension: 'zz' }],
            enableBrotli: true,
            orderPreference: ['br']
        });

        return requestFile('/index.html', { 'accept-encoding': 'gzip, deflate, br' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal('index.html.br');
        });
    });

    it('should use client\'s prefered encoding, when server\'s not available', function () {
        setupServer({
            customCompressions: [{ encodingName: 'deflate', fileExtension: 'zz' }],
            enableBrotli: true,
            orderPreference: ['br']
        });

        return requestFile('/index.html', { 'accept-encoding': 'gzip, deflate' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal('index.html.gz');
        });
    });

    it('should handle foldername with dot', function () {
        setupServer(null, 'wwwroot.gzipped');

        return requestFile("/index.html", { 'accept-encoding': 'gzip' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal('index.html.gz');
        });
    });

    it('should handle subfolders', function () {
        setupServer(null, 'wwwroot.gzipped');

        return requestFile("/css/style.css", { 'accept-encoding': 'gzip' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal('style.css.gz');
        });
    });

    it('should handle url encoded path', function () {
        setupServer();

        return requestFile("/filename with spaces.txt", { 'accept-encoding': 'gzip' }).then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.body).to.equal('"filename with spaces.txt.gz"');
        });
    });

    it('should use serveStatic options', function () {
        setupServer({ serveStatic: { setHeaders: (res) => { res.setHeader('Test-X', 'Value-Y') } } });

        return requestFile('/index.html').then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.headers['test-x']).to.equal('Value-Y');
            expect(resp.headers['test-y']).to.be.undefined;
        });
    });

    it('should use serveStatic options set in root options', function () {
        setupServer({ setHeaders: (res) => { res.setHeader('Test-X', 'Value-Y') } });

        return requestFile('/index.html').then(resp => {
            expect(resp.statusCode).to.equal(200);
            expect(resp.headers['test-x']).to.equal('Value-Y');
            expect(resp.headers['test-y']).to.be.undefined;
        });
    });

    it('should handle malformed uri', function () {
      setupServer({ index: 'main.js', enableBrotli: true });
  
      return requestFile('/%c0').then((resp) => {
        expect(resp.statusCode).to.equal(400);
        expect(resp.body).to.equal("URI malformed");
      });
    });

    /**
     * 
     * @param {string} fileName 
     * @param {request.Headers} headers 
     * @returns {Promise<request.Response>}
     */
    function requestFile(fileName, headers) {
        return new Promise((resolve, reject) => {
            request('http://localhost:8181' + fileName, headers ? { headers } : null,
                function (err, resp, body) {
                    if (err) {
                        reject(err);
                    } else {
                        resp.body = body;
                        resolve(resp);
                    }
                });
        });
    }

    /**
     * 
     * @param {expressStaticGzip.ExpressStaticGzipOptions} options 
     */
    function setupServer(options, dir, mount) {
        dir = dir || 'wwwroot';
        mount = mount || '/';
        const app = express();
        app.use(mount, serveStaticGzip(__dirname + '/' + dir, options));
        server = app.listen(8181);
    }
});
