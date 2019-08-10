declare namespace expressStaticGzip {

    /**
     * Options to configure an `expressStaticGzip` instance.
     */
    declare interface ExpressStaticGzipOptions {

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
         * To disable this set to false.
         * @default false
         */
        index?: boolean;

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
         * This will be forwarded to the underlying `serveStatic` instance, used by `expressStaticGzip`.
         * @default null
         */
        serveStatic?: import('serve-static').ServeStaticOptions
    }

    declare interface Compression {
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