angular.module('mapclipper.services', [])

.factory('API', function($http) {
  var callbackURL = 'http://localhost/mapclipper';
  var host = 'http://mapclipper.com';
  var oauthServiceURL = host + '/oauth/request_token' + 
    '?back_url=' + encodeURIComponent(callbackURL);

  return {
    getAuthToken: function(callback) {
      if (window.cordova) {
        var cordovaMetadata = cordova.require('cordova/plugin_list').metadata;
        if (cordovaMetadata.hasOwnProperty('org.apache.cordova.inappbrowser') === true) {
          var browserRef = window.open(oauthServiceURL, '_blank',
            'location=no,clearsessioncache=yes,clearcache=yes');
          browserRef.addEventListener('loadstart', function(event) {
            if ((event.url).indexOf(callbackURL) === 0) {
              var authToken = (event.url).split('auth_token=')[1];
              callback(authToken);
              browserRef.close();
            }
          });
        }
      }
    },
    getNotes: function(token, callback) {
      $http.get(host + '/api/notes' + '?auth_token=' + token)
      .success(
        function(data, status, headers, config) {
          console.log(JSON.stringify(data));
          callback(data);
        }
      ).error(function() {
      });
    },
    saveNote: function(token, data, callback) {
      console.log('save => ' + JSON.stringify(data));
    },
    updateNote: function(token, noteGuid, data, callback) {
      console.log('update(' + noteGuid + ') => ' + JSON.stringify(data));
    }
  };

});
