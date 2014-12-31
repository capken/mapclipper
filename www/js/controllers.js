angular.module('mapclipper.controllers', [])

.controller('MainCtrl', function($scope, $stateParams, $http,
    $ionicModal, $cordovaGeolocation, $cordovaKeyboard, API) {
  var initialize = function() {
    var mapDiv = document.getElementById('map');
    var options = {
      center: new google.maps.LatLng(43.07493,-89.381388),
      zoom: 13,
      zoomControl: false,
      streetViewControl: false
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

  $scope.clickMap = function() {
    if(window.cordova && $cordovaKeyboard.isVisible) {
      document.getElementById('searchBox').blur();
    }
  }

  $scope.search = function(event) {
    if(angular.isString($scope.address) && 
        $scope.address.length > 0) {
      document.getElementById('searchBox').blur();
      $scope.geocoder.geocode( { 'address': $scope.address }, function(data, status) {
        if(status == google.maps.GeocoderStatus.OK) {
          var loc = data[0].geometry.location;
          $scope.map.setCenter(loc);
        } else {
          //alert('Location not found!');
        }
      });
    }
  }

  $scope.locationIcon = 'ion-navigate';
  $scope.getUserPosition = function() {
    $scope.locationIcon = 'ion-loading-d';

    $cordovaGeolocation
    .getCurrentPosition({
      timeout: 5000,
      enableHighAccuracy: false
    })
    .then(function (position) {
      var loc = new google.maps.LatLng(
        position.coords.latitude,
        position.coords.longitude
      );
      $scope.map.setCenter(loc);
      $scope.locationIcon = 'ion-navigate';
    }, function(err) {
      $scope.locationIcon = 'ion-navigate';
    });
  }

  $scope.noteData = {};
  $ionicModal.fromTemplateUrl('templates/save.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.closeSave = function() {
    $scope.modal.hide();
  };

  $scope.doSave = function() {
    var center = $scope.map.getCenter();
    var data = {
      zoom: $scope.map.getZoom(),
      map_type: $scope.map.getMapTypeId(),
      lat: center.lat(),
      lng: center.lng(),
      note_name: $scope.noteData.newNoteName
    }

    if($scope.noteData.selectedNoteGuid !== null) {
      API.updateNote(window.localStorage.authToken, 
        $scope.noteData.selectedNoteGuid, data,
        function() {
        }
      );
    } else {
      API.saveNote(window.localStorage.authToken, data,
        function() {
        }
      );
    }
  };

  $scope.clip = function() {
    $scope.notes = [];

    if(angular.isUndefined(window.localStorage.authToken)) {
      API.getAuthToken(function(token) {
        window.localStorage.authToken = token;
        $scope.modal.show();
        API.getNotes(window.localStorage.authToken, function(data){
          $scope.notes = data.notes;
        });
      });
    } else {
      $scope.modal.show();
      API.getNotes(window.localStorage.authToken, function(data){
        $scope.notes = data.notes;
      });
    }
  }

  google.maps.event.addDomListener(window, 'load', initialize);
});
