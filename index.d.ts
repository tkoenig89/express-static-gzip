// Type definitions for express-static-gzip 2.0
/* =================== USAGE ===================

    import * as expressStaticGzip from "express-static-gzip";
    app.use(expressStaticGzip("wwwroot", {enableBrotli: true, index: 'index.htm'}))

 =============================================== */

import * as serverStatic from "serve-static";

/**
 * Generates a middleware function to serve static files. It is build on top of serveStatic.
 * It extends serveStatic with the capability to serve (previously) gziped files. For this
 * it asumes, the gziped files are next to the original files.
 * @param root folder to staticly serve files from
 * @param options options to configure expressStaticGzip
 */
declare function expressStaticGzip(root: string, options: expressStaticGzip.ExpressStaticGzipOptions): (req: any, res: any, next: any) => any;

declare namespace expressStaticGzip {

    /**
     * Options to configure an `expressStaticGzip` instance.
     */
    interface ExpressStaticGzipOptions {

        /**
         * Add any other compressions not supported by default. 
         * `encodingName` will be checked against the request's Accept-Header. 
         * `fileExtension` is used to find files using this compression.
         * `fileExtension` does not require a dot (e.g. 'gz' not '.gz').
         * @default null
         */
        customCompressions?: Compression[];

        /**
         * Enables support for the brotli compression, using file extension 'br' (e.g. 'index.html.br'). 
         * @default false
         */
        enableBrotli?: boolean;

        /**
         * By default this module will send "index.html" files in response to a request on a directory. 
         * To disable this set false or to supply a new index pass a string.
         * @default 'index.html'
         */
        index?: boolean | string;

        /**
         * Allows overwriting the client's requested encoding preference 
         * (see [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding)) 
         * with a server side preference. Any encoding listed in orderPreference will be 
         * used first (if supported by the client) before falling back to the client's supported encodings. 
         * The order of entries in orderPreference is taken into account.
         * @default null
         */
        orderPreference?: string[];

        /**
         * This will be forwarded to the underlying `serveStatic` instance used by `expressStaticGzip`.
         * @default null
         */
        serveStatic?: serverStatic.ServeStaticOptions
    }

    interface Compression {
        /**
         * Will be checked against the request's Accept-Header. 
         */
        encodingName: string;

        /**
         * Is used to find files using this compression.
         */
        fileExtension: string;
    }
}

export = expressStaticGzip;