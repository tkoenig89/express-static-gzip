// see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding

/**
 * 
 * @param {string} acceptEncoding Content of the accept-encoding header
 * @param {{encodingName: string, fileExtension: string}[]} availableCompressions 
 */
function findEncoding(acceptEncoding, availableCompressions) {
    if (acceptEncoding) {
        let sortedEncodingList = parseEncoding(acceptEncoding);
        return findFirstMatchingCompression(sortedEncodingList, availableCompressions);
    }

    return null;
}

function findFirstMatchingCompression(sortedEncodingList, availableCompressions) {
    for (const encoding of sortedEncodingList) {
        for (let i = 0; i < availableCompressions.length; i++) {
            if (encoding.name === availableCompressions[i].encodingName) {
                return availableCompressions[i];
            }
        }
    }
    return null;
}

/**
 * 
 * @param {string} acceptedEncoding 
 */
function parseEncoding(acceptedEncoding) {
    return acceptedEncoding.split(',')
        .map(encoding => parseQuality(encoding))
        .sort((encodingA, encodingB) => encodingB.q - encodingA.q);
}

/**
 * Parses the quality value of an entry. Empty value will be set to 1.
 * @param {string} encoding 
 * @returns {{name: string, q: number}[]}
 */
function parseQuality(encoding) {
    let eSplit = encoding.split(';');
    try {
        if (eSplit.length > 1) {
            const num = eSplit[1].trim().match(/q=(.*)/)[1];
            return {
                name: eSplit[0].trim(),
                q: parseFloat(num)
            };
        }
    } catch (ex) { }
    return {
        name: eSplit[0].trim(),
        q: 1
    };
}

module.exports = {
    findEncoding: findEncoding
};