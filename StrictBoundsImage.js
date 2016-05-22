/**
 * @name StrictBoundsImage
 * @version 1.0 [May 22, 2016]
 * @author Matej Pavla (based on the Google Maps JS API v3 "Adding a Custom Overlay" example: https://developers.google.com/maps/documentation/javascript/examples/overlay-simple)
 * @copyright Copyright 2016 Matej Pavla
 * @fileoverview StrictBoundsImage extends the Google Maps JavaScript API V3 <tt>OverlayView</tt> class.
 *  <p>
 *  A StrictBoundsImage acts like a regular overlay, with added features:
 *     1. Map View cannot be panned out of bounds of the overlay
 *     2. It can automatically detect the minimal map zoom level such that the map view is fully contained within bounds of the image
 *  <p>
 */

/*!
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


function StrictBoundsImage(bounds, image_url, map, min_zoom_level) {
	this.bounds_ = bounds;
	this.map_ = null;
	this.image_url = image_url;
	this.div_ = null;
	this.min_zoom_level_ = null;
	this.bounds_changed_listener_ = null;
	this.map_resize_listener_ = null;

	if(map) {
		this.map_ = map;
		this.setMap(map);
	}

	if(typeof(min_zoom_level) !== "undefined" && min_zoom_level !== null){
		this.min_zoom_level_ = min_zoom_level;
	}
}

StrictBoundsImage.prototype = new google.maps.OverlayView;

/**
 * This function checks if the map view is out of image bounds and if yes, it will reposition it back into bounds
 */
StrictBoundsImage.prototype.repositionToBounds = function(){
	if(this.map_) {

		var max_x = this.bounds_.getNorthEast().lng(),
			max_y = this.bounds_.getNorthEast().lat(),
			min_x = this.bounds_.getSouthWest().lng(),
			min_y = this.bounds_.getSouthWest().lat(),
			m_max_x = this.map_.getBounds().getNorthEast().lng(),
			m_max_y = this.map_.getBounds().getNorthEast().lat(),
			m_min_x = this.map_.getBounds().getSouthWest().lng(),
			m_min_y = this.map_.getBounds().getSouthWest().lat(),
			overlay_projection = this.getProjection(),
			center = this.map_.getCenter(),
			wiggle = 5;

		if(m_max_x > max_x || m_max_y > max_y || m_min_x < min_x || m_min_y < min_y){

			var center_point_px = overlay_projection.fromLatLngToDivPixel(center);
			if(m_max_x > max_x){

				var px_difference = overlay_projection.fromLatLngToDivPixel(new google.maps.LatLng(center.lat(), m_max_x)).x -
					overlay_projection.fromLatLngToDivPixel(new google.maps.LatLng(center.lat(), max_x)).x;
				center_point_px.x -= px_difference + wiggle;
				center = overlay_projection.fromDivPixelToLatLng(center_point_px);

			}else if(m_min_x < min_x){

				var px_difference = overlay_projection.fromLatLngToDivPixel(new google.maps.LatLng(center.lat(), min_x)).x -
					overlay_projection.fromLatLngToDivPixel(new google.maps.LatLng(center.lat(), m_min_x)).x;
				center_point_px.x += px_difference + wiggle;
				center = overlay_projection.fromDivPixelToLatLng(center_point_px);
			}

			center_point_px = overlay_projection.fromLatLngToDivPixel(center);
			if(m_max_y > max_y){

				var px_difference = overlay_projection.fromLatLngToDivPixel(new google.maps.LatLng(max_y, center.lng())).y -
					overlay_projection.fromLatLngToDivPixel(new google.maps.LatLng(m_max_y, center.lng())).y;
				center_point_px.y += px_difference + wiggle;
				center = overlay_projection.fromDivPixelToLatLng(center_point_px);

			}else if(m_min_y < min_y){

				var px_difference = overlay_projection.fromLatLngToDivPixel(new google.maps.LatLng(m_min_y, center.lng())).y -
					overlay_projection.fromLatLngToDivPixel(new google.maps.LatLng(min_y, center.lng())).y;
				center_point_px.y -= px_difference + wiggle;
				center = overlay_projection.fromDivPixelToLatLng(center_point_px);
			}

			this.map_.setCenter(center);
		}
	}
};

/**
 * This function calculates the minimal zoom required, so the map view is fully contained inside the bounds.
 * The calculated minZoom is then set to map
 * Called on init and when the map is resized
 * More about scale used: http://gis.stackexchange.com/questions/111584/what-is-the-significance-of-591657550-5-as-it-relates-to-google-maps-scaling-fac
 */
StrictBoundsImage.prototype.recalculateMinZoom = function(){
	var min_zoom = 1;
	var max_zoom = 30;
	
	//if the desired zoom level is defined in constructor, use that instead of calculating it
	if(this.min_zoom_level_ !== null){

		min_zoom = this.min_zoom_level_;

	}else if(this.map_ && this.bounds_){

		var map_div_width = this.map_.getDiv().offsetWidth;
		var map_div_height = this.map_.getDiv().offsetHeight;

		if(map_div_width && map_div_height) {

			var current_zoom = this.map_.getZoom();
			var current_zoom_scale = 591657550.500000 / Math.pow(2, current_zoom - 1);
			var overlayProjection = this.getProjection();
			var ratio;

			//find a zoom level where map view is fully contained within our bounds
			var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
			var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());
			var width = Math.abs(sw.x - ne.x);
			var height = Math.abs(sw.y - ne.y);
			min_zoom = 0;
			do{
				min_zoom++;
				ratio = current_zoom_scale / (591657550.500000 / Math.pow(2, min_zoom - 1));
			}while(min_zoom <= max_zoom && (map_div_width > width * ratio || map_div_height  > ratio * height));
		}
	}

	if(map.getZoom() < min_zoom) map.setZoom(min_zoom);
	this.map_.setOptions({minZoom: min_zoom});
};

/**
 * onAdd is called when the map's panes are ready and the overlay has been
 * added to the map.
 */
StrictBoundsImage.prototype.onAdd = function() {

	var div = document.createElement('div');
	div.style.borderStyle = 'none';
	div.style.borderWidth = '0px';
	div.style.position = 'absolute';

	// Create the img element and attach it to the div.
	var img = document.createElement('img');
	img.src = this.image_url;
	img.style.width = '100%';
	img.style.height = '100%';
	img.style.position = 'absolute';
	div.appendChild(img);

	this.div_ = div;

	// Add the element to the "overlayLayer" pane.
	var panes = this.getPanes();
	panes.overlayLayer.appendChild(div);

	//After adding the image, let's set map center to the image center and calculate the min zoom level required to contain map view inside the image's bounds
	this.map_.setCenter(this.bounds_.getCenter());
	this.recalculateMinZoom();

	//Attach some event listeners. Introduced throttling for better performance
	//When the map bounds change, we listen for the event and if we move out of the bounds, we will adjust the map to the nearest bounds
	var me = this;
	var bounds_changed_throttle = null;
	this.bounds_changed_listener_ = google.maps.event.addListener(this.map_, 'center_changed', function(){
		if(bounds_changed_throttle) clearTimeout(bounds_changed_throttle);
		bounds_changed_throttle = setTimeout(function(){
			me.repositionToBounds();
		}, 5);
	});

	//When map is resized, the minimal zoom level required to contain map view inside the image's bounds might change, so let's recalculate it
	var map_resized_throttle = null;
	this.map_resize_listener_ = google.maps.event.addListener(this.map_, 'resize', function(){
		if(map_resized_throttle) clearTimeout(map_resized_throttle);
		map_resized_throttle = setTimeout(function(){
			me.recalculateMinZoom();
		}, 100);
	});
};

StrictBoundsImage.prototype.draw = function() {
	// We use the south-west and north-east
	// coordinates of the overlay to peg it to the correct position and size.
	// To do this, we need to retrieve the projection from the overlay.
	var overlayProjection = this.getProjection();

	// Retrieve the south-west and north-east coordinates of this overlay
	// in LatLngs and convert them to pixel coordinates.
	// We'll use these coordinates to resize the div.
	var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
	var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

	// Resize the image's div to fit the indicated dimensions.
	var div = this.div_;
	div.style.left = sw.x + 'px';
	div.style.top = ne.y + 'px';
	div.style.width = (ne.x - sw.x) + 'px';
	div.style.height = (sw.y - ne.y) + 'px';
};

StrictBoundsImage.prototype.onRemove = function() {
	if(this.bounds_changed_listener_) {
		google.maps.event.removeListener(this.bounds_changed_listener_);
		this.bounds_changed_listener_ = null;
	}
	if(this.map_resize_listener_) {
		google.maps.event.removeListener(this.map_resize_listener_);
		this.map_resize_listener_ = null;
	}
	this.div_.parentNode.removeChild(this.div_);
	this.div_ = null;
};

StrictBoundsImage.prototype.getBounds = function() {
	return this.bounds_;
};