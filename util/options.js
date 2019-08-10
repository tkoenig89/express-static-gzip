module.exports = {
    sanitizeOptions: sanitizeOptions
};

/**
 * Prepares the options object for later use. Strips away any options used for serve-static.
 * Removes problematic options from the input options object.
 * @param {expressStaticGzip.ExpressStaticGzipOptions} userOptions 
 * @returns {expressStaticGzip.ExpressStaticGzipOptions}
 */
function sanitizeOptions(userOptions) {
    userOptions = userOptions || {};

    /**
     * @type {expressStaticGzip.ExpressStaticGzipOptions}
     */
    let sanitizedOptions = {
        index: getIndexValue(userOptions)
    }

    if (typeof (userOptions.enableBrotli) !== "undefined") {
        sanitizedOptions.enableBrotli = !!userOptions.enableBrotli;
    }

    if (typeof (userOptions.customCompressions) === "object") {
        sanitizedOptions.customCompressions = userOptions.customCompressions;
    }

    if (typeof (userOptions.orderPreference) === "object") {
        sanitizedOptions.orderPreference = userOptions.orderPreference;
    }

    prepareServeStaticOptions(userOptions, sanitizedOptions);

    return sanitizedOptions;
}

/**
 * 
 * @param {expressStaticGzip.ExpressStaticGzipOptions} userOptions 
 * @param {expressStaticGzip.ExpressStaticGzipOptions} sanitizedOptions
 */
function prepareServeStaticOptions(userOptions, sanitizedOptions) {
    if (typeof (userOptions.serveStatic) !== 'undefined') {
        sanitizedOptions.serveStatic = userOptions.serveStatic;
    }

    copyServeStaticOptions(userOptions, sanitizedOptions);
}

/**
 * Used to be backwards compatible by copying options in root level to the serveStatic options property.
 * @param {expressStaticGzip.ExpressStaticGzipOptions} userOptions 
 * @param {expressStaticGzip.ExpressStaticGzipOptions} sanitizedOptions 
 */
function copyServeStaticOptions(userOptions, sanitizedOptions) {
    var staticGzipOptionsProperties = ['cacheControl', 'dotfiles', 'etag', 'extensions', 'index', 'fallthrough', 'immutable', 'lastModified', 'maxAge', 'redirect', 'setHeaders'];

    for (var propertyIdx in staticGzipOptionsProperties) {
        var property = staticGzipOptionsProperties[propertyIdx];

        if (typeof (userOptions[property]) !== 'undefined' && (!sanitizedOptions.serveStatic || typeof (sanitizedOptions.serveStatic[property]) === 'undefined')) {
            setStaticGzipOptionsProperty(sanitizedOptions, property, userOptions[property]);
        }
    }
}

/**
 * 
 * @param {expressStaticGzip.ExpressStaticGzipOptions} sanitizedOptions 
 * @param {string} property 
 * @param {any} value 
 */
function setStaticGzipOptionsProperty(sanitizedOptions, property, value) {
    if (typeof (sanitizedOptions.serveStatic) !== 'object') {
        sanitizedOptions.serveStatic = {};
    }

    sanitizedOptions.serveStatic[property] = value;
}

/**
 * Takes care of retrieving the index value, by also checking the deprecated `indexFromEmptyFile`
 * @param {expressStaticGzip.ExpressStaticGzipOptions} options 
 */
function getIndexValue(options) {
    if (typeof (options.indexFromEmptyFile) === "undefined" && typeof (options.index) !== "undefined") {
        return options.index;
    } else if (typeof (options.index) === "undefined" && typeof (options.indexFromEmptyFile) !== "undefined") {
        return options.indexFromEmptyFile;
    } else {
        return 'index.html';
    }
}