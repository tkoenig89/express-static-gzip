var mime = require("mime");
var express = require("express");

module.exports = expressStaticGzip;

/**
 * Generates a middleware function to serve static files. It is build on top of the express.static middleware.
 * It extends the express.static middleware with the capability to serve (previously) gziped files. For this
 * it asumes, the gziped files are next to the original files.
 * @param {string} rootFolder: folder to staticly serve files from
 * @param {{enableBrotli:boolean, customCompressions:[{encodingName:string,fileExtension:string}], indexFromEmptyFile:boolean}} options: options to change module behaviour  
 * @returns express middleware function
 */
function expressStaticGzip(rootFolder, options) {
    options = options || {};
    if (typeof (options.indexFromEmptyFile) === "undefined") options.indexFromEmptyFile = true;

    //create a express.static middleware to handle serving files 
    var defaultStatic = express.static(rootFolder, options),
        compressions = [],
        files = {};

    //read compressions from options
    setupCompressions();

    //if at least one compression has been added, lookup files
    if (compressions.length > 0) {
        findAllCompressionFiles(require("fs"), rootFolder);
    }

    return function middleware(req, res, next) {
        changeUrlFromEmptyToIndexHtml(req);

        //get browser's' supported encodings
        var acceptEncoding = req.header("accept-encoding");

        //test if any compression is available 
        var matchedFile = files[req.url];
        if (matchedFile) {
            //as long as there is any compression available for this file, add the Vary Header (used for caching proxies)
            res.setHeader("Vary", "Accept-Encoding");

            //use the first matching compression to serve a compresed file
            var compression = findAvailableCompressionForFile(matchedFile.compressions, acceptEncoding);
            if (compression) {
                convertToCompressedRequest(req, res, compression);
            }
        }

        //allways call the default static file provider
        defaultStatic(req, res, next);
    };

    /**
     * Reads the options into a list of available compressions.
     */
    function setupCompressions() {
        //register all provided compressions
        if (options.customCompressions && options.customCompressions.length > 0) {
            for (var i = 0; i < options.customCompressions.length; i++) {
                var customCompression = options.customCompressions[i];
                registerCompression(customCompression.encodingName, customCompression.fileExtension);
            }
        }

        //enable brotli compression
        if (options.enableBrotli) {
            registerCompression("br", "br");
        }

        //gzip compression is enabled by default
        registerCompression("gzip", "gz");
    }

    /**
     * Changes the url and adds required headers to serve a compressed file.
     * @param {Object} req
     * @param {Object} res
     */
    function convertToCompressedRequest(req, res, compression) {
        var type = mime.lookup(req.url);
        var charset = mime.charsets.lookup(type);

        req.url = req.url + compression.fileExtension;
        res.setHeader("Content-Encoding", compression.encodingName);
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
     * Searches for the first matching compression available from the given compressions.
     * @param {[Compression]} compressionList
     * @param {string} acceptedEncoding
     * @returns
     */
    function findAvailableCompressionForFile(compressionList, acceptedEncoding) {
        if (acceptedEncoding) {
            for (var i = 0; i < compressionList.length; i++) {
                if (acceptedEncoding.indexOf(compressionList[i].encodingName) >= 0) {
                    return compressionList[i];
                }
            }
        }
        return null;
    }

    /**
     * Picks all files into the matching compression's file list. Search is done recursively!
     * @param {Object} fs: node.fs
     * @param {string} folderPath
     */
    function findAllCompressionFiles(fs, folderPath) {
        var files = fs.readdirSync(folderPath);
        //iterate all files in the current folder
        for (var i = 0; i < files.length; i++) {
            var filePath = folderPath + "/" + files[i];
            var stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                //recursively search folders and append the matching files
                findAllCompressionFiles(fs, filePath);
            } else {
                addAllMatchingCompressionsToFile(files[i], filePath);
            }
        }
    }

    /**
     * Takes a filename and checks if there is any compression type matching the file extension.
     * Adds all matching compressions to the file.     
     * @param {string} fileName
     * @param {string} fillFilePath
     */
    function addAllMatchingCompressionsToFile(fileName, fullFilePath) {
        for (var i = 0; i < compressions.length; i++) {
            if (fileName.endsWith(compressions[i].fileExtension)) {
                addCompressionToFile(fullFilePath, compressions[i]);
                return;
            }
        }
    }

    /**
     * Adds the compression to the file's list of available compressions
     * @param {string} filePath
     * @param {Compression} compression
     */
    function addCompressionToFile(filePath, compression) {
        var srcFilePath = filePath.replace(compression.fileExtension, "").replace(rootFolder, "");
        var existingFile = files[srcFilePath];
        if (!existingFile) {
            files[srcFilePath] = { compressions: [compression] };
        } else {
            existingFile.compressions.push(compression);
        }
    }

    /**
     * Registers a new compression to the module.
     * @param {string} encodingName
     * @param {string} fileExtension
     */
    function registerCompression(encodingName, fileExtension) {
        if (!findCompressionByName(encodingName))
            compressions.push(new Compression(encodingName, fileExtension));
    }

    /**
     * Constructor
     * @param {string} encodingName
     * @param {string} fileExtension
     * @returns {encodingName:string, fileExtension:string,files:[Object]}
     */
    function Compression(encodingName, fileExtension) {
        this.encodingName = encodingName;
        this.fileExtension = "." + fileExtension;
    }

    /**
     * Compression lookup by name.
     * @param {string} encodingName
     * @returns {Compression}
     */
    function findCompressionByName(encodingName) {
        for (var i = 0; i < compressions.length; i++) {
            if (compressions[i].encodingName === encodingName)
                return compressions[i];
        }
        return null;
    }
}
