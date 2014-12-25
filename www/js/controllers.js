angular.module('mapclipper.controllers', [])

.controller('MainCtrl', function($scope, $stateParams) {
  var initialize = function() {
    var mapDiv = document.getElementById("map");
    var options = {
      center: new google.maps.LatLng(43.07493,-89.381388),
      zoom: 13
    };

    $scope.map = new google.maps.Map(mapDiv, options);
    $scope.geocoder = new google.maps.Geocoder();

    initClippedArea();
  };

  var clippedBounds = function() {
    var proj = $scope.map.getProjection();
    var center = proj.fromLatLngToPoint($scope.map.getCenter());

    var scale = Math.pow(2, $scope.map.getZoom());

    var sw = new google.maps.Point(
      center.x - 150/scale,
      center.y + 150/scale
    );
    var ne = new google.maps.Point(
      center.x + 150/scale,
      center.y - 150/scale
    );

    return new google.maps.LatLngBounds(
      proj.fromPointToLatLng(sw),
      proj.fromPointToLatLng(ne)
    );
  };

  var rectOptions = function() {
    return {
      strokeOpacity: 0,
      fillColor: '#FF0000',
      fillOpacity: 0.15,
      map: $scope.map,
      bounds: clippedBounds()
    }
  };

  var initClippedArea = function() {
    $scope.clippedArea = new google.maps.Rectangle();

    google.maps.event.addListenerOnce($scope.map, 'idle', function() {
      $scope.clippedArea.setOptions(rectOptions());
    });

    google.maps.event.addListener($scope.map, 'zoom_changed', function() {
      $scope.clippedArea.setOptions(rectOptions());
    });

    google.maps.event.addListener($scope.map, 'center_changed', function() {
      $scope.clippedArea.setOptions(rectOptions());
    });
  };

  $scope.search = function(event) {
    if(event.keyCode === 13 && $scope.address !== "") {
      if(window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.close();
      }
      //$cordovaKeyboard.close();
      $scope.geocoder.geocode( { "address": $scope.address }, function(data, status) {
        if(status == google.maps.GeocoderStatus.OK) {
          var loc = data[0].geometry.location;
          $scope.map.setCenter(loc);
        } else {
          //alert("Location not found!");
        }
      });
    }
  }

  google.maps.event.addDomListener(window, 'load', initialize);
});
