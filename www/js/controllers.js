angular.module('mapclipper.controllers', [])

.controller('MainCtrl', function($scope, $ionicLoading, $http, $ionicPopup,
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
    var offset = (window.screen.width-20)/2;

    var proj = $scope.map.getProjection();
    var center = proj.fromLatLngToPoint($scope.map.getCenter());

    var scale = Math.pow(2, $scope.map.getZoom());

    var sw = new google.maps.Point(
      center.x - offset/scale,
      center.y + offset/scale
    );
    var ne = new google.maps.Point(
      center.x + offset/scale,
      center.y - offset/scale
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

      $ionicLoading.show({ template: 'Loading...' });

      API.searchAddress($scope.address)
      .then(function(loc) {
        $ionicLoading.hide();
        $scope.map.setCenter(loc);
      }, function(data) {
        $ionicLoading.hide();
      });
    }
  }

  $scope.locationIcon = 'ion-navigate';

  $scope.getUserPosition = function() {
    $ionicLoading.show({ template: 'Loading...' });

    $cordovaGeolocation.getCurrentPosition({
      timeout: 5000,
      enableHighAccuracy: false
    }).then(function (position) {
      var loc = new google.maps.LatLng(
        position.coords.latitude,
        position.coords.longitude
      );
      $scope.map.setCenter(loc);
      $ionicLoading.hide();
    }, function(err) {
      $ionicLoading.hide();
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
    var noteData = {
      lat: center.lat(),
      lng: center.lng(),
      mlat: center.lat(),
      mlng: center.lng(),
      zoom: $scope.map.getZoom(),
      map_type: $scope.map.getMapTypeId(),
      note_name: $scope.noteData.newNoteName,
      selectedNoteGuid: $scope.noteData.selectedNoteGuid
    }

    API.getValidToken().then(function() {
      $ionicLoading.show({ template: 'Saving...' });

      API.saveNote(noteData).then(function(data) {
        console.log(data);

        $ionicLoading.hide();
        $scope.modal.hide();

        $ionicPopup.confirm({
          title: 'Save to Evernote successfully',
          template: 'Do you want to view it?',
          cancelText: 'Close'
        }).then(function(res) {
          if(res) {
            window.open(data.note_url, '_system');
          }
        });
      }, function(data) {
        $ionicLoading.hide();
        console.log(data);
      });
    });
  };

  $scope.clip = function() {
    $scope.notes = [];

    console.log();

    API.getValidToken().then(function() {
      $scope.modal.show();
      API.getNotes().then(function(data) {
        $scope.notes = data.notes;
      });
    });
  }

  google.maps.event.addDomListener(window, 'load', initialize);
});
