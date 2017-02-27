// Imports libraries
self.importScripts('../lw.raster-to-gcode.js');

// On messsage received
self.onmessage = function(event) {
    if (event.data.cmd === 'start') {
        start(event.data);
    }
}

// Create RasterToGcode object
var rasterToGcode = new RasterToGcode.RasterToGcode();

// Register events callbacks
rasterToGcode.on('progress', function(event) {
    self.postMessage({ event: 'progress', data: event });
})
.on('done', function(event) {
    self.postMessage({ event: 'done', data: event });
})
.on('abort', function() {
    self.postMessage({ event: 'abort' });
});

// Start job
function start(data) {
    Object.assign(rasterToGcode, data.properties);
    self.postMessage({ event: 'start' });
    rasterToGcode.run(data.settings);
}

// Abort job
function abort() {
    rasterToGcode.abort();
}
