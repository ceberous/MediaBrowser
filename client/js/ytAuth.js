var googleApiClientReady = function() {

  gapi.client.init({
    'apiKey': OAUTH2_CLIENT_ID,
    'discoveryDocs': ['https://people.googleapis.com/$discovery/rest'],
  }).then(function() {
    gapi.client.load( 'youtube' , 'v3' , onYouTubeApiLoaded );
  }, function(reason) {
    console.log('Error: ' + reason.result.error.message);
  });  

};

var onYouTubeApiLoaded = function() {
	console.log("youtube data-client is ready");
	$(document).trigger( "ytDataClientReady" );
};