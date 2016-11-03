var mime = require("mime");
var express = require("express");

module.exports = staticGzip;

/**
 * Generates a middleware function to serve static files. It is build on top of the express.static middleware.
 * It extends the express.static middleware with the capability to serve (previously) gziped files. For this
 * it asumes, the gziped files are next to the original files.
 * @param {string} root: folder to staticly serve files from
 * @param {{ensureGzipedFiles:boolean,indexFromEmptyFile:boolean}} options: options to change module behaviour  
 * @returns express middleware function
 */
function staticGzip(root, options) {
    options = options || {};    
    //create a express.static middleware to handle serving files 
    var defaultStatic = express.static(root, options);
    var gzipedFiles = null;

    //search for all existing .gz files
    if (options.ensureGzipedFiles) {
        gzipedFiles = findAllGzipedFiles(require("fs"), root);
    }

    return function middleware(req, res, next) {
        changeUrlFromEmptyToIndexHtml(req);

        //check if browser supports gzip encoding
        var acceptEncoding = req.header("accept-encoding");
        if (acceptEncoding && ~acceptEncoding.indexOf("gzip") && isGzipVersionExisting(req.url)) {
            convertToGzipRequest(req, res);
        }

        //allways call the default static file provider
        defaultStatic(req, res, next);
    };

    /**
     * Changes the url and adds required headers to serve a gziped file instead of the requested normal file.
     * @param {Object} req
     * @param {Object} res
     */
    function convertToGzipRequest(req, res) {
        var type = mime.lookup(req.url);
        var charset = mime.charsets.lookup(type);

        req.url = req.url + ".gz";
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Vary", "Accept-Encoding");
        res.setHeader("Content-Type", type + (charset ? "; charset=" + charset : ""));
    }

    /**
     * In case it's enabled in the options and the requested url does not request a specific file, "index.html" will be appended.
     * @param {Object} req
     */
    function changeUrlFromEmptyToIndexHtml(req) {
        if (options.indexFromEmptyFile && req.url.endsWith("/")) {
            req.url += "index.html";
        }
    }

    /**
     * Tests if a ".gz" version of the requested file is existing. If not requested in the options this returns always true.
     * @param {string} path
     * @returns {boolean}
     */
    function isGzipVersionExisting(path) {
        if (options.ensureGzipedFiles) {
            var pathSplit = path.split("/");
            var fileName = pathSplit[pathSplit.length - 1];
            return gzipedFiles.indexOf(fileName + ".gz") >= 0;
        } else {
            return true;
        }
    }

    /**
     * Returns a list of all ".gz" files in the current folder. Search is done recursively!
     * @param {Object} fs: node.fs
     * @param {string} folderPath
     * @returns {string[]} list of all ".gz" files
     */
    function findAllGzipedFiles(fs, folderPath) {
        var gzipedFiles = [];
        var files = fs.readdirSync(folderPath);
        //iterate all files in the current folder
        for (var i = 0; i < files.length; i++) {
            var filePath = folderPath + "/" + files[i];
            var stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                //recursively search folders and append the matching files
                var gzipedInFolder = findAllGzipedFiles(fs, filePath);
                gzipedFiles = gzipedFiles.concat(gzipedInFolder);
            } else if (filePath.endsWith(".gz")) {
                gzipedFiles.push(files[i]);
            }
        }
        return gzipedFiles;
    }
}