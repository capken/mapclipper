angular.module('mapclipper.services', [])

.factory('API', function($http, $q) {
  var callbackURL = 'http://localhost/mapclipper';
  var host = 'http://mapclipper.com';
  var oauthServiceURL = host + '/oauth/request_token' + 
    '?back_url=' + encodeURIComponent(callbackURL);

  return {
    getValidToken: function() {
      var deferred = $q.defer();

      if(angular.isDefined(window.localStorage.authToken)) {
        deferred.resolve();
      } else {
        if(window.cordova) {
          var cordovaMetadata = cordova.require('cordova/plugin_list').metadata;
          if (cordovaMetadata.hasOwnProperty('org.apache.cordova.inappbrowser') === true) {
            var browserRef = window.open(oauthServiceURL, '_blank',
              'location=no,clearsessioncache=yes,clearcache=yes');
            browserRef.addEventListener('loadstart', function(event) {
              if ((event.url).indexOf(callbackURL) === 0) {
                var authToken = (event.url).split('auth_token=')[1];
                window.localStorage.authToken = authToken;
                browserRef.close();
                deferred.resolve();
              }
            });
          }
        }
      }

      return deferred.promise;
    },

    getNotes: function() {
      var deferred = $q.defer();

      $http.get(host + '/api/notes?auth_token=' + 
          window.localStorage.authToken)
      .success(function(data, status) {
        deferred.resolve(data);
      }).error(function(data, status) {
        deferred.reject(data);
      });

      return deferred.promise;
    },

    saveNote: function(noteData) {
      var deferred = $q.defer();

      var method = (noteData.selectedNoteGuid === null) ? 'POST' : 'PUT';
      var path = (noteData.selectedNoteGuid === null) ? '/api/notes' : 
        '/api/notes/' + noteData.selectedNoteGuid;

      noteData.auth_token = window.localStorage.authToken;

      $http({
        method: method,
        url: host + path,
        params: noteData,
        responseType: 'json'
      }).success(function(data, status) {
        deferred.resolve(data);
      }).error(function(data, status) {
        deferred.reject(data);
      });

      return deferred.promise;
    }
  };

});
