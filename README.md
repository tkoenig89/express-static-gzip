# static gzip
Provides a small layer on top of the express.static middleware, which allows to serve pre-gziped files from a directory.

# Requirements
For the static-gzip middleware to work properly you need to first ensure that you have all files gziped. 
Simplest use case is to either have a folder with only .gz files, or you have a folder with the .gz files next to the original files.

# Usage
In case you just want to serve gziped files only this example should work:

```javascript
var express = require("express");
var staticGzip = require("static-gzip");
var app = express();

app.use("/", staticGzip("rootFolder"));
```

If you want to serve files from a folder where you might have a few files gziped and some are not, you can use an optional *options* object to define this.
The *options* object is also passed to the express.static middleware, in case you want to configure this one as well.
To first check the folder for all available .gz files, use the *ensureGzipedFiles* flag on the *options*.

```javascript
var express = require("express");
var staticGzip = require("static-gzip");
var app = express();

app.use("/", staticGzip("rootFolder", { ensureGzipedFiles: true }));
```

In default mode a request for "/" or "\<somepath\>/" will serve index.html in a non-gziped version. To use the gziped version use the options flag *indexFromEmptyFile*.

```javascript
app.use("/", staticGzip("rootFolder", { 
    ensureGzipedFiles: true,
    indexFromEmptyFile: true }));
```

# Example
In case you have the following basic file structure

* rootFolder
 * index.html
 * index.html.gz
 * main.js

and you use set the *ensureGzipedFiles* flag to true, static-gzip will answer GET requests like this:

> GET /index.html >>> rootFolder/index.html.gz

> GET /main.js >>> rootFolder/main.js

In case you would not set *ensureGzipedFiles* to true the request for main.js would result in an error response, as the server would not find *main.js.gz*.