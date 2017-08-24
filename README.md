# express-static-gzip
Provides a small layer on top of the express.static middleware, which allows to serve pre-gzipped files from a directory. Now supports other compressions like *brotli* as well.

# Requirements
For the express-static-gzip middleware to work properly you need to first ensure that you have all files gzipped, which you want to serve as a compressed version to the browser.
Simplest use case is to either have a folder with only .gz files, or you have a folder with the .gz files next to the original files. Some goes for other compressions.

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

The following example will show how to add brotli and deflate (with file extension *.zz*) to the middleware (it will still support gzip), as well as `cache-control` headers:

```javascript
var express = require("express");
var expressStaticGzip = require("express-static-gzip");
var app = express();

app.use("/", expressStaticGzip("/my/rootFolder/", {
    enableBrotli: true,
    customCompressions: [{
        encodingName: "deflate",
        fileExtension: "zz"
    }],
    cache: {
      flag: "public",
      maxAge: "3600"
    }
}));
```

Compressions are selected in the following order if a file is requested from the middleware:
* any custom compression in the order they are provided to *options.customCompressions*
* brotli (if enabled via *options.enableBrotli*)
* gzip
* plain file (in case no compression exists or none is matching the browsers accepted encodings header)

When the middleware is created it will check the given root folder and all subfolders for files matching the registered compression. Adding files later to the folder will not be recognized by the middleware.

In default mode a request for "/" or "\<somepath\>/" will now serve index.html as compressed version. If for some kind of reason you don't want this to happen set **options.indexFromEmptyFile** to false.

```javascript
app.use("/", expressStaticGzip("/my/rootFolder/", { indexFromEmptyFile: false }));
```

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
