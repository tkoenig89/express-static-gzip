
/**
 * Prepares the options object for later use. Strips away any options used for serve-static.
 * Removes problematic options from the input options object.
 * @param {{enableBrotli?:boolean, customCompressions?:[{encodingName:string,fileExtension:string}], indexFromEmptyFile?:boolean, index?: boolean}} userOptions 
 */
function sanitizeOptions(userOptions) {
    userOptions = userOptions || {};

    let options = {
        index: getIndexValue(userOptions)
    }

    if(userOptions.index){
        // required to not interfere with serve-static
        delete userOptions.index;
    }

    if (typeof (userOptions.enableBrotli) !== "undefined") {        
        options.enableBrotli = !!userOptions.enableBrotli;
    }

    if (typeof (userOptions.customCompressions) === "object" ) {
        options.customCompressions = userOptions.customCompressions;
    }

    if (typeof (userOptions.orderPreference) === "object" ) {
        options.orderPreference = userOptions.orderPreference;
    }

    return options;
}

function getIndexValue(opts) {
    if (typeof (opts.indexFromEmptyFile) === "undefined" && typeof (opts.index) !== "undefined") {
        return opts.index;
    } else if (typeof (opts.index) === "undefined" && typeof (opts.indexFromEmptyFile) !== "undefined") {
        return opts.indexFromEmptyFile;
    } else {
        return true;
    }
}

module.exports = {
    sanitizeOptions: sanitizeOptions
};