//listen for submit
var srch = document.getElementById('search');
srch.addEventListener('click', geocode);


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

function geocode() {
    loc = document.getElementById('location').value;
    axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
            address: loc
            , key: 'AIzaSyC9xurRiTwaVtktWTYIvvyd2v8Nk5B2uD8'
        }
    }).then(function (response) {
        console.log(response)
        var formattedAddress = response.data.results[0].formatted_address;
        //Geometry
        lat = response.data.results[0].geometry.location.lat;
        lng = response.data.results[0].geometry.location.lng;
        coords = {
            lat: lat
            , lng: lng
        };
        
        console.log(lat); console.log(lng);
        
        document.getElementById('location').value = formattedAddress;
        
    }).catch(function (error) {
        console.log(error);
    });
    
}

//Detecting Through GPS
function geoFindMe() {
        if (!navigator.geolocation) {
            console.log("Geolocation is not supported by your browser");
            return;
        }

        function success(position) {
            var latitude = position.coords.latitude;
            var longitude = position.coords.longitude;
            console.log("Latitude: " + latitude);
            console.log("Longitude: " + longitude);
        }

        function error() {
            console.log("Unable to retrieve your location");
        }
        navigator.geolocation.getCurrentPosition(success, error);
    }



