# express-static-gzip
Provides a small layer on top of *serve-static*, which allows to serve pre-gzipped files. Supports *brotli* and any other compressions as well.

# Requirements
For the express-static-gzip middleware to work properly you need to first ensure that you have all files gzipped (or compressed with your desired algorithm), which you want to serve as a compressed version to the browser.
Simplest use case is to either have a folder with only .gz files, or you have a folder with the .gz files next to the original files. Some goes for other compressions.

# Install

```bash
    $ npm install express-static-gzip
```

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
The *options* object is also passed to the express.static middleware, in case you want to configure this one as well.

The following example will show howto add brotli and deflate(with file extension *.zz*) to the middleware (it will still support gzip) and force brotli to be used if available (`orderPreference`):

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

    This will enable brotli compression in addition to gzip
    
* **`index`**: boolean (default: **true**)
        
    If not set to false, any request to '/' or 'somepath/' will be answered with the file '/index.html' or 'somepath/index.html' in an accepted compression

* **`indexFromEmptyFile`** (**deprecated**, see `index` option)

* **`customCompressions`**: [{encodingName: string, fileExtension: string}]

    Using this option, you can add any other compressions you would like. `encodingName` will be checked against the `Accept`-Header. `fileExtension` is used to find files using this compression. `fileExtension` does not require a dot (not ~~'.gz'~~, but `'gz'`).

* **`orderPreference`**: string[]

    This options allows overwriting the client's requested encoding preference (see [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding)) with a server side preference. Any encoding listed in `orderPreference` will be used first (if supported by the client) before falling back to the client's supported encodings. The order of entries in `orderPreference` is taken into account.

# Behavior warning

In default mode a request for "/" or "\<somepath\>/" will serve index.html as compressed version. This could lead to **complications if you are serving a REST API** from the same path, when the *express-server-static* is registered before your API. 

One solution would be to register *express-server-static* last. Otherweise you can set **options.index** to false:

```javascript
app.use("/", expressStaticGzip("/my/rootFolder/", { index: false }));
```

Because this middleware was developed for a static production server use case, to maximize performance, it is designed to look up and cache the compressed files corresponding to uncompressed file names on startup.  This means that it will not be aware of compressed files being added or removed later on.

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
