//listen for submit
var inputLat = document.getElementById("latitude");
var inputLon = document.getElementById("longitude");

var latitude = '';
var longitude = '';


/*function initMap(coords) {
    var options = {
        zoom: 13, //2 - 14
        center: (!coords?{
                    lat: 28.5236226
                    , lng: 77.178454
                }:coords)
    }
    var map = new google.maps.Map(document.getElementById('map'), options);
    
    function addMarker(coords) {
        var marker = new google.maps.Marker({
            position: coords,
            map: map
        });
    }

    addMarker(coords);
}*/





document.onchange = function(){
    
    if(document.getElementById('location').value == ''){
        var latitude = '';
        var longitude = '';
    }
    
}

var isWait;

function geocode(oFormElement) {
    
    if(latitude == ''){
        isWait = true;
    loc = document.getElementById('location').value;
    if(loc != 'enter your location' && loc != ''){
    axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
            address: loc
            , key: 'AIzaSyC9xurRiTwaVtktWTYIvvyd2v8Nk5B2uD8'
        }
    }).then(function (response) {
        isWait = false;
        var formattedAddress = response.data.results[0].formatted_address;
        //Geometry
        latitude = response.data.results[0].geometry.location.lat;
        longitude = response.data.results[0].geometry.location.lng;
        
        document.getElementById('location').value = formattedAddress;
        
    }).catch(function (error) {
        console.log(error);
    });
    }else{
        return false;
    }
}else{
      sendRequest(oFormElement);      
}
    if(isWait){
        return false;
    }
}


function sendRequest(oFormElement){
    
    inputLat.value = latitude;
    inputLon.value = longitude;
    var xhr = new XMLHttpRequest();
    xhr.open (oFormElement.method, oFormElement.action);
    xhr.send ();
    latitude = '';    
    longitude = '';
    return true;
}



//Detecting Through GPS
function geoFindMe() {
        if (!navigator.geolocation) {
            document.getElementById('location').value = "Geolocation is not supported by your browser";
            return;
        }

        function success(position) {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
           
            var google_map_position = new google.maps.LatLng( latitude, longitude );
            var google_maps_geocoder = new google.maps.Geocoder();
            
            

            google_maps_geocoder.geocode(
                { 'latLng': google_map_position },
                function( results, status ) {
                   
                    if ( status == google.maps.GeocoderStatus.OK && results[0] ) {
                        document.getElementById('location').value = results[0].formatted_address;
                    }
                }
            );
            
        }

        function error() {
            document.getElementById('location').value = "Unable to track your location.Please allow the gps tracker.";
        }
        navigator.geolocation.getCurrentPosition(success, error);
    }



