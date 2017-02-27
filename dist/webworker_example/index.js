// Create RasterToGcode object
var settings      = { nonBlocking: false };
var rasterToGcode = new RasterToGcode.RasterToGcode(settings);

// Create the Worker object
var worker = createWorker();

// On file input change
$('#file').on('change', function(event) {
    loadFile(event.target.files[0]);
    $('#start').show();
    $('#abort').hide();
    $(this).val(null);
});

// On button click
$('#start').hide().on('click', function(event) {
    var properties = {
        cellSize  : rasterToGcode.cellSize,
        scaleRatio: rasterToGcode.scaleRatio,
        filters   : rasterToGcode.filters,
        size      : rasterToGcode.size,
        pixels    : rasterToGcode.pixels
    };
    worker.postMessage({ cmd: 'start', settings: settings, properties: properties });
    $('#start').hide();
    $('#abort').show();
});

$('#abort').hide().on('click', function(event) {
    worker.terminate();
    worker = createWorker();
    console.log('Aborted !');
    $('#start').show();
    $('#abort').hide();
});

// Load the input file
function loadFile(file) {
    console.log('loadFile:', file);

    // <file> can be Image, File URL object or URL string (http://* or data:image/*)
    rasterToGcode.load(file).then(function(rtg) {
        console.log('rasterToGcode:', rtg);
    })
    .catch(function(error) {
        console.error('error:', error);
    });
}

// Create and return the Worker object
function createWorker() {
    var worker = new Worker('worker.js');

    // On worker messsage
    worker.onmessage = function(event) {
        if (event.data.event === 'done') {
            console.log('done:', event.data.data);
            $('#start').show();
            $('#abort').hide();
        }
        else if (event.data.event === 'progress') {
            console.log('progress:', event.data.data.percent, '%');
        }
    };

    return worker;
}
