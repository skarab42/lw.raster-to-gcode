// Debug...
var debug = true;

// Defaults settings
var file, gcode, heightMap, rasterToGcode;

var settings = {
    ppi: { x: 254, y: 254 }, // Pixel Per Inch (25.4 ppi == 1 ppm)

    beamSize : 0.1,                  // Beam size in millimeters
    beamRange: { min: 0, max: 1 },   // Beam power range (Firmware value)
    beamPower: { min: 0, max: 100 }, // Beam power (S value) as percentage of beamRange
    feedRate : 1500,                 // Feed rate in mm/min (F value)
    feedUnit : 'mm/min',             // Feed rate unit [mm/min, mm/sec]

    offsets  : { X: 0, Y: 0 }, // Global coordinates offsets
    trimLine : true,           // Trim trailing white pixels
    joinPixel: true,           // Join consecutive pixels with same intensity
    burnWhite: true,           // [true = G1 S0 | false = G0] on inner white pixels
    verboseG : false,          // Output verbose GCode (print each commands)
    diagonal : false,          // Go diagonally (increase the distance between points)

    precision: { X: 2, Y: 2, S: 4 }, // Number of decimals for each commands

    nonBlocking: true, // Use setTimeout to avoid blocking the UI

    filters: {
        smoothing   : 0,      // Smoothing the input image ?
        brightness  : 0,      // Image brightness [-255 to +255]
        contrast    : 0,      // Image contrast [-255 to +255]
        gamma       : 0,      // Image gamma correction [0.01 to 7.99]
        grayscale   : 'none', // Graysale algorithm [average, luma, luma-601, luma-709, luma-240, desaturation, decomposition-[min|max], [red|green|blue]-chanel]
        shadesOfGray: 256     // Number of shades of gray [2-256]
    },

    progress       : null, // On progress callbacks
    progressContext: null, // On progress callback context

    done       : null, // On done callback
    doneContext: null  // On done callback context
}

// Load file...
function loadFile() {
    console.log('file:', file);
    $downloadGCode.hide();
    $downloadHeightMap.hide();

    // Create RasterToGcode object
    rasterToGcode = new RasterToGcode.RasterToGcode(settings);

    // Register events callbacks
    rasterToGcode.on('progress', function(event) {
        console.log('onProgress:', event.percent);
        $progressBar.css('width', event.percent + '%').html(event.percent + '%');
    })
    .on('done', function(event) {
        console.log('onDone: lines:', event.gcode.length);
        gcode = event.gcode.join('\n');
        $progressBar.parent().hide();
        $downloadGCode.show();
    });

    // <file> can be Image, File URL object or URL string (http://* or data:image/*)
    rasterToGcode.load(file).then(function(rtg) {
        console.log('rasterToGcode:', rtg);
        drawCanvasGrid(rtg);
    })
    .catch(function(error) {
        console.error('error:', error);
    });
}

// To gcode
function toGCode() {
    console.log('toGCode:', file.name);
    $progressBar.parent().show();
    rasterToGcode.run();
}

// Download gcode
function downloadGCode() {
    console.log('downloadGCode:', file.name);
    var gCodeFile = new Blob([gcode], { type: 'text/plain;charset=utf-8' });
    saveAs(gCodeFile, file.name + '.gcode');
}

// To height-map
function toHeightMap() {
    console.log('toHeightMap:', file.name);
    heightMap = [];
    $progressBar.parent().show();
    rasterToGcode.getHeightMap({
        progress: function(event) {
            console.log('onProgress:', event.percent);
            $progressBar.css('width', event.percent + '%').html(event.percent + '%');
            heightMap.push(event.pixels.join(','));
        },
        done: function(event) {
            heightMap = heightMap.join('\n');
            $progressBar.parent().hide();
            $downloadHeightMap.show();
        }
    });
}

// Download height-map
function downloadHeightMap() {
    console.log('downloadHeightMap:', file.name);
    var heightMapFile = new Blob([heightMap], { type: 'text/plain;charset=utf-8' });
    saveAs(heightMapFile, file.name + '.height-map.txt');
}

// UI --------------------------------------------------------------------------

var $canvasWrapper     = $('#canvasWrapper');
var $fileName          = $('#fileName');
var $fileSize          = $('#fileSize');
var $noFile            = $('.noFile');
var $hasFile           = $('.hasFile');
var $file              = $('#file');
var $pixel             = $('#pixel');
var $filters           = $('.filters');
var $settings          = $('.settings');
var $ppm               = $('#ppm');
var $toGCode           = $('#toGCode');
var $toHeightMap       = $('#toHeightMap');
var $downloadGCode     = $('#downloadGCode');
var $downloadHeightMap = $('#downloadHeightMap');
var $imageSize         = $('#imageSize');

var $pixelRGBA   = $pixel.find('.rgba');
var $pixelColor  = $pixel.find('.color');
var $pixelCoords = $pixel.find('.coords');

$progressBar = $('.progress-bar');

function drawCanvasGrid(cg) {
    //console.info('onCanvas:', canvas);
    $canvasWrapper.empty().width(cg.size.width);
    $fileName.html(cg.file.name);
    $fileSize.html(cg.size.width + ' x ' + cg.size.height);
    $imageSize.html(cg.outputSize.width + ' x ' + cg.outputSize.height);
    $ppm.html(cg.ppm.x + ' - ' + cg.ppm.y);
    $hasFile.show();
    $noFile.hide();

    var x, y, l;

    // For each grid line
    for (y = 0, yl = cg.canvas.length; y < yl; y++) {
        l = cg.canvas[y];

        // For each line cell
        for (x = 0, xl = l.length; x < xl; x++) {
            $canvasWrapper.append(l[x]);
        }
    }
}

$(document).ready(function() {
    // On file input change
    $file.on('change', function(event) {
        file = event.target.files[0];

        loadFile(file);
        $(this).val(null);
    });

    // To gcode !
    $toGCode.on('click', toGCode);
    $toHeightMap.on('click', toHeightMap);
    $downloadGCode.on('click', downloadGCode);
    $downloadHeightMap.on('click', downloadHeightMap);

    // On mouse move
    $(document).on('mousemove', function(event) {
        if (! rasterToGcode) {
            return;
        }

        var x    = event.pageX;
        var y    = event.pageY;
        var xMax = rasterToGcode.size.width;
        var yMax = rasterToGcode.size.height;

        if (x >= xMax || y >= yMax) {
            return;
        }

        var pixel  = rasterToGcode.getPixel(x, y);
        var rgba   = 'rgba(' + pixel.color.r + ',' + pixel.color.g + ',' + pixel.color.b + ',' + (pixel.color.a / 255) + ')';
        var coords = 'x = ' + x + ', y = ' + y

        $pixelColor.css('backgroundColor', rgba);
        $pixelCoords.html(coords);
        $pixelRGBA.html(rgba);
        $pixel.show();

        var px    = x;
        var py    = y;
        var pxMax = xMax - $pixel.width() - 20;
        var pyMax = yMax - $pixel.height() - 20;

        if (px >= pxMax) {
            px -= px - pxMax;
        }

        if (py >= pyMax) {
            py -= py - pyMax;
        }

        $pixel.css({ left: px + 10, top: py + 10 });
    });

    $canvasWrapper.on('mouseleave', function(event) {
        $pixel.hide();
    });

    $settings.find('select, input').on('change', function(event) {
        var keys    = this.id.split('-');
        var mainKey = keys.shift();
        var subKey  = keys.shift();
        var value   = this.value;

        if (this.type === 'checkbox') {
            value = this.checked;
        }
        else if (mainKey !== 'feedUnit') {
            value = parseFloat(value);
        }

        if (! settings[mainKey]) {
            settings[mainKey] = {};
        }

        if (subKey) {
            settings[mainKey][subKey] = value;
        }
        else {
            settings[mainKey] = value;
        }

        loadFile();
    });

    $filters.find('select, input').on('change', function(event) {
        var value = this.value;

        if (this.id !== 'grayscale') {
            value = parseFloat(value);
        }

        settings.filters[this.id] = value;

        loadFile();
    });
});
