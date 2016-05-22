# StrictBoundsImage
### Strict Bounds Custom Overlay for Google Maps Js API v3.

A StrictBoundsImage acts like a regular overlay, with added features:
1. Map View cannot be panned out of bounds of the overlay
2. It can automatically detect the minimal map zoom level such that the map view is fully contained within bounds of the image
The library is based on the Google Maps JS API v3 "Adding a Custom Overlay" example: https://developers.google.com/maps/documentation/javascript/examples/overlay-simple

Example usage (the image is reused from the above mentioned example): 

```javascript
var bounds = new google.maps.LatLngBounds(
		new google.maps.LatLng(62.281819, -150.287132),
		new google.maps.LatLng(62.400471, -150.005608));

var image_src = 'https://developers.google.com/maps/documentation/' +
		'javascript/examples/full/images/talkeetna.png';

var strict_bounds_image = new StrictBoundsImage(bounds, image_src, map);
```

Optionally, you can provide a 4th parameter, which is the minimal map zoom level above which the user won't be able to zoom. If you don't specify the 4th parameter, the script will calculate the value automatically. Also when map resized, the minimal zoom value is recalculated.

```javascript
var strict_bounds_image = new StrictBoundsImage(bounds, image_src, map, 14);
```