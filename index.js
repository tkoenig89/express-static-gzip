let fs = require("fs");
let serveStatic = require("serve-static");
let sanitizeOptions = require("./util/options").sanitizeOptions;
let findEncoding = require("./util/encoding-selection").findEncoding;
let mime = serveStatic.mime;

module.exports = expressStaticGzipMiddleware;

/**
 * Generates a middleware function to serve pre-compressed files. It is build on top of serveStatic.
 * The pre-compressed files need to be placed next to the original files, in the provided `root` directory.
 * @param { string } root: directory to staticly serve files from
 * @param { expressStaticGzip.ExpressStaticGzipOptions } options: options to change module behaviour
 * @returns express middleware function
 */
function expressStaticGzipMiddleware(root, options) {
  let opts = sanitizeOptions(options);
  let serveStaticMiddleware = serveStatic(root, opts.serveStatic || null);
  let compressions = [];
  let files = {};

  registerCompressionsFromOptions();
  parseRootDirForCompressedFiles();

  return expressStaticGzip;

  function expressStaticGzip(req, res, next) {
    changeUrlFromDirectoryToIndexFile(req);

    let clientsAcceptedEncodings = req.headers["accept-encoding"];

    let path = "";
    try {
      path = decodeURIComponent(req.path);
    } catch (e) {
      res.status(400).send(e.message);
      return;
    }

    let fileWithMatchingPath = files[path];
    if (fileWithMatchingPath) {
      // The Vary Header is required for caching proxies to work properly
      res.setHeader("Vary", "Accept-Encoding");

      let compression = findEncoding(
        clientsAcceptedEncodings,
        fileWithMatchingPath.compressions,
        opts.orderPreference
      );
      if (compression) {
        convertToCompressedRequest(req, res, compression);
      }
    }

    serveStaticMiddleware(req, res, next);
  }

  function registerCompressionsFromOptions() {
    if (opts.customCompressions && opts.customCompressions.length > 0) {
      for (let customCompression of opts.customCompressions) {
        registerCompression(
          customCompression.encodingName,
          customCompression.fileExtension
        );
      }
    }

    if (opts.enableBrotli) {
      registerCompression("br", "br");
    }

    registerCompression("gzip", "gz");
  }

  function convertToCompressedRequest(req, res, compression) {
    let type = mime.lookup(req.path);
    let charset = mime.charsets.lookup(type);
    let search = req.url.split("?").splice(1).join("?");

    if (search !== "") {
      search = "?" + search;
    }

    req.url = req.path + compression.fileExtension + search;
    res.setHeader("Content-Encoding", compression.encodingName);
    res.setHeader(
      "Content-Type",
      type + (charset ? "; charset=" + charset : "")
    );
  }

  function changeUrlFromDirectoryToIndexFile(req) {
    const parts = req.url.split('?');
    if (opts.index && parts[0].endsWith("/")) {
      parts[0] += opts.index;
      req.url = parts.length > 1 ? parts.join('?') : parts[0];
    }
  }

  function parseRootDirForCompressedFiles() {
    if (compressions.length > 0) {
      findCompressedFilesInDirectory(root);
    }
  }

  function findCompressedFilesInDirectory(directoryPath) {
    if (!fs.existsSync(directoryPath)) return;

    let filesInDirectory = fs.readdirSync(directoryPath);
    for (let file of filesInDirectory) {
      let filePath = directoryPath + "/" + file;
      let stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        findCompressedFilesInDirectory(filePath);
      } else {
        addMatchingCompressionsToFile(file, filePath);
      }
    }
  }

  /**
   * Takes a filename and checks if there is any compression type matching the file extension.
   * Adds all matching compressions to the file.
   * @param {string} fileName
   * @param {string} fillFilePath
   */
  function addMatchingCompressionsToFile(fileName, fullFilePath) {
    for (let compression of compressions) {
      if (fileName.endsWith(compression.fileExtension)) {
        addCompressionToFile(fullFilePath, compression);
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
    let srcFilePath = filePath
      .replace(root, "")
      .replace(compression.fileExtension, "");
    let existingFile = files[srcFilePath];
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
    if (!findCompressionByName(encodingName)) {
      compressions.push(new Compression(encodingName, fileExtension));
    }
  }

  /**
   * @param {string} encodingName
   * @param {string} fileExtension
   * @returns {{encodingName:string, fileExtension:string}}
   */
  function Compression(encodingName, fileExtension) {
    this.encodingName = encodingName;
    this.fileExtension = "." + fileExtension;
  }

  /**
   * @param {string} encodingName
   * @returns {{encodingName:string, fileExtension:string}}
   */
  function findCompressionByName(encodingName) {
    for (let compression of compressions) {
      if (compression.encodingName === encodingName) {
        return compression;
      }
    }

    return null;
  }
}
