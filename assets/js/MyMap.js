/**************************************
TITLE: MyMap.js
 AUTHOR: Thomas J. Byker (TJB)
 CREATE DATE: 03.18.2013
 PURPOSE: Javascript code that performs various functions for Project 4.   
 LAST MODIFIED ON: 03.25.2013
 LAST MODIFIED BY: Thomas J. Byker (TJB)
 MODIFICATION HISTORY:
 No Modifications

***************************************/

;(function($) {
	
	//  Javascript function "MyMap" that opens Google Maps and works with storing marker points information. 
	var MyMap = function(obj, options) {
		// Var t = "this"
		var $t = $(obj);
		
		var t = {
			callback: {
				newMarker: function(marker, lat, lng) {},	
			},
			db: new localStorageDB("MapIndex", localStorage),
			bounds: new google.maps.LatLngBounds(),
			editIndex: false,
			geocoder: new google.maps.Geocoder(),
			map: false,
			mapOptions: {
				zoom: 15,
				//  Changed the Lat,Lng to reflect somewhere in Carmel, IN.
				center: new google.maps.LatLng(39.984175,-86.119735), 
				//  Changed the default map type from ROADMAP to HYBRID. 
				mapTypeId: google.maps.MapTypeId.HYBRID, 
				scrollwheel: false
			},
			markers: [],
			ui: {
				map: $t
			}
		}
		
		if(!options) {
			var options = {};
		}
		
		t = $.extend(true, t, options);
		
		//  Javascript function 't.initialize' initializes this map and markers.   
		t.initialize = function(options) {
			
			if(options) {
				t.mapOptions = $.extend(true, t.mapOptions, options);	
			}
			
			t.map = new google.maps.Map(t.ui.map.get(0), t.mapOptions);
			
			// t.db.dropTable('markers');
			
			if(!t.db.tableExists('markers')) {			
			    t.db.createTable("markers", ["name", "address", "response", "street", "city", "state", "zipcode", "lat", "lng"]);
			    t.db.commit();
			}
			
			t.db.query('markers', function(row) {
				t.newMarker(row.lat, row.lng);
			});
			
			return t.map;
		}
		
		//  Javascript function t.home
		t.home = function() {
			google.maps.event.trigger(t.map, 'resize');
			t.map.setZoom(t.mapOptions.zoom);
			t.map.fitBounds(t.bounds);
			
			$('a[href="#home"]').click();	
		}
		
		//  Javascript function t.newMarker sets this newMarker to the map. 
		t.newMarker = function(lat, lng) {
			var latLng = new google.maps.LatLng(lat, lng);
		
			marker = new google.maps.Marker({
				map: t.map,
				position: latLng 
			});
			
			t.callback.newMarker(marker, lat, lng, t.markers.length);
			
			t.markers.push(marker);
			t.bounds.extend(latLng);
			t.map.fitBounds(t.bounds);
			
			return marker;
		}
		
		//  Javascript function t.updateMarker updates this Marker to Google maps.
		t.updateMarker = function(marker, lat, lng) {
			marker.setPosition(new google.maps.LatLng(lat, lng));
		}
		
		//  Javascript function t.editMarker edits this Marker in the Google maps.
		t.editMarker = function(location, callback) {
			
			t.geocode(location.address, function(response) {
				if(response.success) {
					
					var lat = response.results[0].geometry.location.lat();
					var lng = response.results[0].geometry.location.lng();
					var hasLatLng = t.hasLatLng(lat, lng);
					
					if(hasLatLng) {
						alert('\''+$.trim(location.address)+'\' is already a location on the map');	
					}
					else {						
						t.updateMarker(t.markers[t.editIndex], lat, lng);
									
						t.db.update("markers", {ID: t.editIndex+1}, function() {
							var row = {
								name: location.name,
								address: location.address,
								street: location.street,
								city: location.city,
								state: location.state,
								zipcode: location.zipcode,
								response: response,
								lat: lat,
								lng: lng
							}
							
						console.log(row);
						
							return row;
						});
						
						t.db.commit();
						
						if(typeof callback == "function") {
							callback(response, location);
						}
					}
				}
				//  alerts the user if the location is invalid.
				else {
					alert('\''+$.trim(location.address)+'\' is an invalid location');
				}
			});
		}
		
		//  Javascript function t.addMarker adds this Marker in Google maps.
		t.addMarker = function(location, save, callback) {
			
			if(typeof save == "undefined") {
				var save = true;
			}
			
			if(typeof save == "function") {
				callback = save;
				save = true;
			}
			
			t.geocode(location.address, function(response) {
				if(response.success) {
					
					var lat = response.results[0].geometry.location.lat();
					var lng = response.results[0].geometry.location.lng();
					var hasLatLng = t.hasLatLng(lat, lng);
					var marker = false;
					
					//  alerts the user if the specific location marker is already on the map.
					if(hasLatLng) {
						alert('\''+$.trim(location.address)+'\' is already a location on the map');	
					}
					else {						
						t.newMarker(lat, lng);
						
						if(typeof callback == "function") {
							callback(response, location, save);
						}
					}
					
					if(save && !hasLatLng) {
						t.db.insert("markers", {
							name: location.name,
							address: location.address,
							street: location.street,
							city: location.city,
							state: location.state,
							zipcode: location.zipcode,
							response: response,
							lat: lat,
							lng: lng
						});
						
						t.db.commit();
					}
				}
				//  alerts the user if the location is invalid.
				else {
					alert('\''+$.trim(location.address)+'\' is an invalid location');
				}
			});
		}
		
		//  Javascript function t.hasLatLng.
		t.hasLatLng = function(lat, lng) {
			var _return = false;
			
			t.db.query('markers', function(row) {
				if(row.lat == lat && row.lng == lng) {
					_return = true;	
				}
			});
			
			return _return;
		}
		
		//  Javascript function t.geocode properly geocodes the form address to a plotable Lat, Lng coordinates.
		t.geocode = function(location, callback) {
			if(typeof callback != "function") {
				callback = function() {};
			}
			
			t.geocoder.geocode({'address': location}, function(results, status) {
				
				var response = {
					success: status == google.maps.GeocoderStatus.OK ? true : false,
					status: status,
					results: results
				}
				
				callback(response);
			});
		}
		
		t.initialize();
		
		return t;
	}
	
	$.fn.MyMap = function(options) {
		return new MyMap($(this), options);
	}	
	
})(jQuery);