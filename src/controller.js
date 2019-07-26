// Define socket address (Ubuntu server address)
var socket = io('http://maproom.lmc.gatech.edu:8080/');

// Global Variables
var activeRectangle = document.getElementById("longRect");
var rectWidth = 730;
var rectHeight = 200;
// var propertyAssessmentEnabled = false;
// Global variable definitions
var leftLong, rightLong, lowerLat, upperLat
var curBearing = 0
var curZoom = 1
var curCenter = [1, 1]
var curGeoCoords, curActiveRectangle, curEndCenters
var leftCenter = { lng: -84.3880, lat: 33.7490 }
var rightCenter = { lng: -82.3880, lat: 33.7490 }
var rc, lc
var currentPoints = null;
var projRatio = 0.5
var zoomAdd = 2.75


/*--------------------------------------------------------------------------------------------------------------------*/
/*  Create the map.                                                                                                   */
/*--------------------------------------------------------------------------------------------------------------------*/

mapboxgl.accessToken = 'pk.eyJ1IjoiYXRsbWFwcm9vbSIsImEiOiJjamtiZzJ6dGIybTBkM3dwYXQ2c3lrMWs3In0.tJzsvakNHTk7G4iu73aP7g';

/**
 * creates the MapBox GL map with initial parameters
 */
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/atlmaproom/cjkbg9s6m8njm2roxkx8gprzj', // style from online MapBox GL Studio
    zoom: 12,
    bearing: 0, // refers to rotation angle
    center: [-84.3951, 33.7634],
    interactive: true
});
/*--------------------------------------------------------------------------------------------------------------------*/
/*  Move the map.                                                                                                   */
/*--------------------------------------------------------------------------------------------------------------------*/
/*
 *  when arrow keys are used to adjust the projector image.
 *  Emits the corresponding updates to the socket in order
 *  to update the image on the controller (and projector).
 */

map.on('load', function() {
    map.getCanvas().focus();
    map.getCanvas().addEventListener('keydown', function(e) {
        e.preventDefault();
        if (e.which === 38) { // Up arrow
            socket.emit('projNudge', { 'direction': 'up' })
        } else if (e.which === 40) { // Down arrow
            socket.emit('projNudge', { 'direction': 'down' })
        } else if (e.which === 37) { // Left arrow
            socket.emit('projNudge', { 'direction': 'left' })
        } else if (e.which === 39) { // Right arrow
            socket.emit('projNudge', { 'direction': 'right' })
        } else if (e.which === 68) { // A key
            socket.emit('projNudge', { 'direction': 'ccw' })
        } else if (e.which === 65) { // D key
            socket.emit('projNudge', { 'direction': 'cw' })
        } else if (e.which === 87) { // W key
            socket.emit('projNudge', { 'direction': 'zoom_in' })
        } else if (e.which === 83) { // S key
            socket.emit('projNudge', { 'direction': 'zoom_out' })
        }
    }, true);
});

/*
 * when arrow keys are pressed from the Projector to align the map,
 * Socket emmit sends changes back to be updated on Controller
 */
socket.on('projNudge', function(data) {
    direction = data.direction
    var deltaDistance = 1;
    var deltaDegrees = 1;
    var deltaZoom = 0.03

    if (direction === 'up') {
        map.panBy([0, -deltaDistance]);
    } else if (direction === 'down') {
        map.panBy([0, deltaDistance]);
    } else if (direction === 'left') {
        map.panBy([-deltaDistance, 0]);
    } else if (direction === 'right') {
        map.panBy([deltaDistance, 0]);
    } else if (direction === 'ccw') {
        map.easeTo({ bearing: map.getBearing() - deltaDegrees });
    } else if (direction === 'cw') {
        map.easeTo({ bearing: map.getBearing() + deltaDegrees });
    } else if (direction === 'zoom_in') {
        map.easeTo({ zoom: map.getZoom() + deltaZoom });
    } else if (direction === 'zoom_out') {
        map.easeTo({ zoom: map.getZoom() - deltaZoom });
    }
});

/** Fires when the controller map is moved. Updates the
 *  current view by using current projector location
 *  calculate the exact position of the projector view
 *  within the rectangle view box.
 */
socket.on('pushMapUpdate', function(data) {
    console.log("Controller changed, updating map...");

    curCenter = data['center'];
    curZoom = data['zoom'];
    curBearing = data['bearing'];
    curGeoCoords = data['geoCoordinates'];
    curActiveRectangle = data['activeRectangle'];
    curEndCenters = data['endCenters']

    // Extract the leftmost and rightmost centers for the rectangle view
    leftCenter = curEndCenters.lc
    rightCenter = curEndCenters.rc

    // Current projector view is calculating as a gradient between the
    // left and right centers, depending on the projector position from the sensor
    projLat = leftCenter.lat + (projRatio * (rightCenter.lat - leftCenter.lat))
    projLong = leftCenter.lng + (projRatio * (rightCenter.lng - leftCenter.lng))

    // Performs the map movement to transition to the new position
    map.easeTo({ center: { lng: projLong, lat: projLat }, zoom: (curZoom + zoomAdd), bearing: curBearing, duration: 1000 })
});

function getPixelCoordinates() {
    // get width & height from current rectangle
    width = rectWidth;
    height = rectHeight;
    // get map center in pixel coordinates
    var center = map.project(map.getCenter());
    // calculate pixel coordinates of corners
    var ur = { "x": (center.x + width / 2), "y": (center.y - height / 2) }; // upper right
    var ul = { "x": (center.x - width / 2), "y": (center.y - height / 2) }; // upper left
    var br = { "x": (center.x + width / 2), "y": (center.y + height / 2) }; // bottom right
    var bl = { "x": (center.x - width / 2), "y": (center.y + height / 2) }; // bottom left
    // return an json of pixel coordinates
    return { "ur": ur, "ul": ul, "br": br, "bl": bl };
}

function getGeoCoordinates() {
    // grab pixel coordinates from helper method
    var pixelCoordinates = getPixelCoordinates();
    // unproject to geographic coordinates
    var ur = map.unproject(pixelCoordinates.ur);
    var ul = map.unproject(pixelCoordinates.ul);
    var br = map.unproject(pixelCoordinates.br);
    var bl = map.unproject(pixelCoordinates.bl);
    // return a json of geographic coordinates
    return { "ur": ur, "ul": ul, "br": br, "bl": bl };
}

function getEndCenters() {
    var height = rectHeight;
    // get upper right & upper left pixels
    var pixelCoordinates = getPixelCoordinates();
    var ur = pixelCoordinates.ur;
    var ul = pixelCoordinates.ul;
    // calculate pixel coordinates for right & left center
    var rcPixel = { "x": (ur.x - height / 2), "y": (ur.y + height / 2) };
    var lcPixel = { "x": (ul.x + height / 2), "y": (ul.y + height / 2) };
    var rc = map.unproject(rcPixel);
    var lc = map.unproject(lcPixel);
    // return a json of geographic coordinates
    return { "rc": rc, "lc": lc };
}

/**
 * when the user interacts with the map (pinch/drag to move, zoom, or rotate)
 * all changes are emitted to the server to update the view in Projector
 */
map.on('moveend', function(e) {
    console.log("Sending move change to server...")
    socket.emit('mapUpdate', {
        'center': map.getCenter(),
        'zoom': map.getZoom(),
        'bearing': map.getBearing(),
        'geoCoordinates': getGeoCoordinates(),
        'activeRectangle': activeRectangle.id,
        'endCenters': getEndCenters()
    })
});


/** Fired when the sensor server publishes a measurement
 *  (happens about twice per second) and moves the projector
 *  view to reflect any change in position.
 */
socket.on('pushSensorUpdate', function(data) {
    // These two numbers are VERY important, they define the start
    // and end measurements between which the projector position is
    // linearly modeled.
    var start = 1931
    var end = 5012

    // Simple fraction of current position over total change
    projRatio = ((data.distance - start) / (end - start))

    // Calculate map center that aligns projector view with current area of
    // rectangle within view
    projLat = leftCenter.lat + (projRatio * (rightCenter.lat - leftCenter.lat))
    projLong = leftCenter.lng + (projRatio * (rightCenter.lng - leftCenter.lng))

    map.easeTo({ center: { lng: projLong, lat: projLat }, zoom: (curZoom + zoomAdd), bearing: curBearing, duration: 1000 })
});

/*--------------------------------------------------------------------------------------------------------------------*/
/*  Lock the map.                                                                                                   */
/*--------------------------------------------------------------------------------------------------------------------*/
/**
 * when button is clicked, all user interaction (pinch/drag) with map is
 * disabled to "lock" so map does not become disaligned while drawing
 */
document.getElementById('interactionButton').addEventListener('click', function() {
    map.boxZoom.disable();
    map.scrollZoom.disable();
    map.dragPan.disable();
    map.dragRotate.disable();
    map.keyboard.disable();
    map.doubleClickZoom.disable();
    map.touchZoomRotate.disable();
});

// unlock the map 

/*--------------------------------------------------------------------------------------------------------------------*/
/*  Toggle map layers                                                                                                 */
/*--------------------------------------------------------------------------------------------------------------------*/
/** After receiving a request from the server,
 *  hides the corresponding map layer
 */
socket.on('pushHideLayer', function(data) {
    var hiddenLayer = data['clickedLayer'];
    map.setLayoutProperty(hiddenLayer, 'visibility', 'none');
});

/** After receiving a request from the server,
 *  shows the corresponding map layer
 */
socket.on('pushShowLayer', function(data) {
    var shownLayer = data['clickedLayer'];
    map.setLayoutProperty(shownLayer, 'visibility', 'visible');
});

/**
 * adds BeltLine and data layer sources from MapBox GL Studio
 * and then adds the layers to the map to be toggled
 */
map.on('load', function() {
    var nav = new mapboxgl.NavigationControl({
        showCompass: true
    });
    var scale = new mapboxgl.ScaleControl({
        maxWidth: 80,
        unit: 'imperial'
    });
    map.addControl(scale);
    scale.setUnit('imperial');
    map.addControl(nav, 'bottom-left');
    // beltline layer
    map.addSource('beltline', {
        type: 'vector',
        url: 'mapbox://atlmaproom.9v2e99o9'
    });
    map.addLayer({
        'id': 'beltline',
        'type': 'line',
        'source': 'beltline',
        'source-layer': 'Beltline_Weave-9xlpb5',
        'layout': {
            'visibility': 'visible',
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': 'yellow green',
            'line-width': 8
        }
    });
    // Change median income later
    map.addSource('ACS', {
        type: 'vector',
        url: 'mapbox://atlmaproom.c97zkvti'
    });
    map.addLayer({
        'id': 'Median Income Change',
        'type': 'fill',
        'source': 'ACS',
        'source-layer': 'merged2-53z777',
        'layout': {
            'visibility': 'none',
        },
        'paint': {
            'fill-outline-color': '#f7ff05',
            'fill-color': {
                property: 'P_C_M_I',
                stops: [
                    [-100, '#00a4d1'],
                    [0, '#fffcd6'],
                    [100, '#e92f2f']
                ]
            },
            'fill-opacity': 0.5
        }
    });
    map.addLayer({
        'id': 'College Educated Change',
        'type': 'fill',
        'source': 'ACS',
        'source-layer': 'merged2-53z777',
        'layout': {
            'visibility': 'none',
        },
        'paint': {
            'fill-outline-color': '#f7ff05',
            'fill-color': {
                property: 'C_C_E_P',
                stops: [
                    [-40, '#00a4d1'],
                    [0, '#fffcd6'],
                    [40, '#e92f2f']
                ]
            },
            'fill-opacity': 0.5
        }
    });
    map.addLayer({
        'id': 'White Occupants Change',
        'type': 'fill',
        'source': 'ACS',
        'source-layer': 'merged2-53z777',
        'layout': {
            'visibility': 'none',
        },
        'paint': {
            'fill-outline-color': '#f7ff05',
            'fill-color': {
                property: 'C_W_P__',
                stops: [
                    [-30, '#00a4d1'],
                    [0, '#fffcd6'],
                    [30, '#e92f2f']
                ]
            },
            'fill-opacity': 0.5
        }
    });
    // MARTA Buses and Rail (all one color)
    map.addSource('MARTA', {
        type: 'vector',
        url: 'mapbox://atlmaproom.cxppjs0d'
    });
    map.addLayer({
        'id': 'MARTA',
        'type': 'line',
        'source': 'MARTA',
        'source-layer': 'marta-bi9p6y',
        'layout': {
            'visibility': 'none',
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-width': 3,
            'line-color': "#32ffd9",
            'line-opacity': 0.8
        }
    });

    map.addLayer({
        'id': 'ATLMaps:r9hrz',
        'type': 'raster',
        'source': {
            'type': 'raster',
            'tiles': [
                'https://geoserver.ecds.emory.edu/ATLMaps/wms?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.0&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=ATLMaps:r9hrz'
            ],
            'tileSize': 256
        }
    });

    map.addLayer({
        'id': 'ATLMaps:r9jr2',
        'type': 'raster',
        'source': {
            'type': 'raster',
            'tiles': [
                'https://geoserver.ecds.emory.edu/ATLMaps/wms?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.0&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=ATLMaps:r9jr2'
            ],
            'tileSize': 256
        }
    });
});

/**
 * link layers to buttons to toggle on screen
 */
var toggleableLayerIds = ['Median Income Change', 'College Educated Change', 'White Occupants Change', 'MARTA'];

for (var i = 0; i < toggleableLayerIds.length; i++) {
    var id = toggleableLayerIds[i];
    var link = document.createElement('a');
    link.href = '#';
    link.textContent = id;
    link.onclick = function(e) {
        var clickedLayer = this.textContent;
        e.preventDefault();
        e.stopPropagation();
        // if (!(clickedLayer===('Property Assessment'))){
        var visibility = map.getLayoutProperty(clickedLayer, 'visibility');
        if (visibility === 'visible') {
            map.setLayoutProperty(clickedLayer, 'visibility', 'none');
            socket.emit('hideLayer', { 'clickedLayer': clickedLayer })
            this.className = '';
        } else {
            this.className = 'active';
            map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
            socket.emit('showLayer', { 'clickedLayer': clickedLayer })
        }
        //   };
        // }else{
        //     if (propertyAssessmentEnabled){
        //         console.log("Removing property assessments...");
        //         socket.emit("removeTA", {'info':'none'});
        //         propertyAssessmentEnabled = false;
        //         this.className = "";
        //     }else{
        //         socket.emit("addTA", {'info':'none'});
        //         propertyAssessmentEnabled = true;
        //         this.className = 'active';
        //     }
        // }
        console.log("Sending layer change to server...")
    };

    var layers = document.getElementById('menu');
    layers.appendChild(link);
}