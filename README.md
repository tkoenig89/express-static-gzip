
# express-static-gzip

[![npm][npm-version-image]][npm-url]
![Node CI](https://github.com/tkoenig89/express-static-gzip/workflows/Node%20CI/badge.svg?branch=master&event=push)
[![npm][npm-downloads-image]][npm-url]
[![Donate][donate-paypal-image]][donate-url]

Provides a small layer on top of [*serve-static*](http://expressjs.com/en/resources/middleware/serve-static.html), which allows to serve pre-gzipped files. Supports *brotli* and allows configuring any other compression you can think of as well.

If `express-static-gzip` saved you some time, feel free to buy me a cup of coffee :) [![Donate][donate-paypal-image]][donate-url]


# Requirements
For the `express-static-gzip` middleware to work properly you need to first ensure that you have all files gzipped (or compressed with your desired algorithm) which you want to serve as a compressed version to the browser.
Simplest use case is to either have a folder with only .gz files, or you have a folder with the .gz files next to the original files. Same goes for other compressions.

# Install

```bash
    $ npm install express-static-gzip
```

# Changelog for v2.0

* Even so this is a mayor release, this should be fully backwards compatible and should not have any breaking change to v1.1.3.

* Moved all options for `serveStatic` in its own section (`serveStatic`) to prevent collisions when setting up your static fileserving middleware. 

* For backwards compatibility all root options that apply to `serveStatic` will be copied to the new `serveStatic` section, except if you have set values there already (no overwrite). Here is a small example of this behaviour:
    ```JavaScript
    {
        enableBrotli: true,         // not a serverStatic option, will not be moved
        maxAge: 123,                // not copied, as already present.
        index: 'main.js',           // copied to serveStatic section
        serveStatic: {
            maxAge: 234,            // will be kept 
            cacheControl: false     // will be kept as well
        }
    }
    ```

    In the above scenario serveStatic will use `cacheControl`: false, `index`: 'main.js', `maxAge`:234.


# Usage
In case you just want to serve gzipped files only, this simple example would do:

```javascript
var express = require("express");
var expressStaticGzip = require("express-static-gzip");
var app = express();

app.use("/", expressStaticGzip("/my/rootFolder/"));
```

While gzip compression is always enabled you now have the choice to add other types of compressions using the *options* object. Currently *brotli* can be enabled using the **options.enableBrotli** flag.
All other compressions need to be added by passing an array to **options.customCompressions**.
The *options.serveStatic* section is passed to the underlying `serve-static` middleware, in case you want to configure this one as well.

The following example will show how to add brotli and deflate (with file extension *.zz*) to the middleware (it will still support gzip) and force brotli to be used if available (`orderPreference`):

```javascript
var express = require('express');
var expressStaticGzip = require('express-static-gzip');
var app = express();

app.use('/', expressStaticGzip('/my/rootFolder/', {
    enableBrotli: true,
    customCompressions: [{
        encodingName: 'deflate',
        fileExtension: 'zz'
    }],
    orderPreference: ['br']
}));
```

Compressions are selected in the following order if a file is requested from the middleware:
* any encoding listed in `option.orderPreference` and supported by the client
* in order of the requests 'accept-encoding' header content (if no quality if provided)
* in order of their respective quality (if provided)
* in case of a wildcard '*', the compression is selected in alphabetical order (for now)
* plain file (in case no compression exists or none is matching the browsers accept-encoding header)

For more details see [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding), but not all of it is implemented at the moment.

When the middleware is created it will check the given root folder and all subfolders for files matching the registered compression. **Adding files later to the folder will not be recognized by the middleware.**

# Available options

* **`enableBrotli`**: boolean (default: **false**)

    Enables support for the brotli compression, using file extension 'br' (e.g. 'index.html.br').
    
* **`index`**: boolean | string (default: 'index.html')
        
    By default this module will send "index.html" files in response to a request on a directory (url ending with '/'). To disable this set false or to supply a new index file pass a string (like 'index.htm').

* **`customCompressions`**: [{encodingName: string, fileExtension: string}]

    Using this option, you can add any other compressions you would like. `encodingName` will be checked against the `Accept`-Header. `fileExtension` is used to find files using this compression. `fileExtension` does not require a dot (not ~~'.gz'~~, but `'gz'`).

* **`orderPreference`**: string[]

    This options allows overwriting the client's requested encoding preference (see [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding)) with a server side preference. Any encoding listed in `orderPreference` will be used first (if supported by the client) before falling back to the client's supported encodings. The order of entries in `orderPreference` is taken into account.

* **`serveStatic`**: [ServeStaticOptions](https://github.com/expressjs/serve-static#options)
    
    This will be forwarded to the underlying `serveStatic` instance used by `expressStaticGzip`

# Behavior warning

In default mode a request for "/" or "\<somepath\>/" will serve index.html as compressed version. This could lead to **complications if you are serving a REST API** from the same path, when *express-server-static* is registered before your API. 

One solution would be to register *express-server-static* last. Otherwise you can set **options.index** to false:

```javascript
app.use("/", expressStaticGzip("/my/rootFolder/", { index: false }));
```

Because this middleware was developed for a static production server use case to maximize performance, it is designed to look up and cache the compressed files corresponding to uncompressed file names on startup.  This means that it will not be aware of compressed files being added or removed later on.

# Example
In case you have the following basic file structure

* rootFolder
    * index.html
    * index.html.gz
    * index.html.br
    * test.html.gz
    * main.js

and you use set the *enableBrotli* flag to true, express-static-gzip will answer GET requests like this:

> GET / >>> /my/rootFolder/index.html.br

> GET /index.html >>> /my/rootFolder/index.html.br

> GET /test.html >>> /my/rootFolder/test.html.gz

> GET /main.js >>> /my/rootFolder/main.js


[npm-url]: https://www.npmjs.com/package/express-static-gzip
[npm-downloads-image]: https://img.shields.io/npm/dw/express-static-gzip
[npm-version-image]: https://img.shields.io/npm/v/express-static-gzip
[donate-paypal-image]: https://img.shields.io/badge/Donate-PayPal-green.svg
[donate-url]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=J8F2P79BKCTG8
