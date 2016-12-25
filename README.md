# lw.raster-to-gcode
Raster to G-Code for [LaserWeb/CNCWeb](https://github.com/LaserWeb/LaserWeb4).

## Demo
https://lautr3k.github.io/lw.raster-to-gcode/dist/example/

## Installation
Using NPM
```
npm install lw.raster-to-gcode
```

Using GIT
```
git clone https://github.com/lautr3k/lw.raster-to-gcode.git
cd lw.raster-to-gcode
npm install
```

Or download the last build from https://raw.githubusercontent.com/lautr3k/lw.raster-to-gcode/master/dist/lw.raster-to-gcode.js
```html
<script src="./lw.raster-to-gcode.js"></script>
<script>
  var rasterToGcode = RasterToGcode.RasterToGcode();
</script>
```

## Settings
```javascript
let settings = {
    ppi: { x: 254, y: 254 }, // Pixel Per Inch (25.4 ppi == 1 ppm)

    toolDiameter: 0.1,      // Tool diameter in millimeters
    rapidRate   : 1500,     // Feed rate in mm/min (G0 F value)
    feedRate    : 500,      // Feed rate in mm/min (G1 F value)
    rateUnit    : 'mm/min', // Feed rate unit [mm/min, mm/sec]

    beamRange: { min: 0, max: 1 },   // Beam power range (Firmware value)
    beamPower: { min: 0, max: 100 }, // Beam power (S value) as percentage of beamRange

    milling  : false, // EXPERIMENTAL
    zSafe    : 5,     // Safe Z for fast move
    zSurface : 0,     // Usinable surface
    zDepth   : -10,   // Z depth (min:white, max:black)
    passDepth: 1,     // Pass depth in millimeters

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
        shadesOfGray: 256,    // Number of shades of gray [2-256]
        invertColor : false   // Invert color...
    },

    progress       : null, // On progress callbacks
    progressContext: null, // On progress callback context

    done       : null, // On done callback
    doneContext: null  // On done callback context
}
```

## Usages
```javascript
import RasterToGcode from 'lw.raster-to-gcode'

// Create RasterToGcode object
let rasterToGcode = new RasterToGcode(settings)

// Register events callbacks
rasterToGcode.on('progress', function(event) {
    console.log('onProgress:', event); // event = { gcode, percent }
})
.on('done', function(event) {
    console.log('onDone:', event); // event = { gcode }
});

// <file> can be Image, File URL object or URL string (http://* or data:image/*)
rasterToGcode.load(file).then(function(rtg) {
    console.log('rasterToGcode:', rtg); // rtg === rasterToGcode
    rasterToGcode.run(); // Return gcode array if nonBlocking = false
})
.catch(function(error) {
    console.error('error:', error);
});
```
