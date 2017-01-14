//Navigation Bar for hamburger Icon
jQuery(function($) {
    $('.content-list-btn').click(function() {
        $('.content-list').toggleClass('expand');
    });
});

//List of famous places to visit in vadodara.
var locations = [
        {
            title: 'EME Temple',
            location: {
                lat: 22.331528,
                lng: 73.192078
            }
        },{
            title: 'Tapovan Mandir',
            location: {
                lat: 22.349476,
                lng: 73.140855
            }
        },{
            title: 'Baroda Museum & Picture Gallery',
            location: {
                lat: 22.311999,
                lng: 73.188660
            }
        },{
            title: 'Mandvi Gate',
            location: {
                lat: 22.300145,
                lng: 73.210736
            }
        },{
            title: 'Sayaji Baug',
            location: {
                lat: 22.314007,
                lng: 73.188194
            }
        },{
            title: 'Laxmi Vilas Palace',
            location: {
                lat: 22.293597,
                lng: 73.191945
            }
        },{
            title: 'Maharaja Fatehsinh Museum',
            location: {
                lat: 22.289644,
                lng: 73.191393
            }
        },{
            title: 'Sardar Patel Planetarium',
            location: {
                lat: 22.309353,
                lng: 73.189406
            }
        },{
            title: 'Crocodile Pond Sayaji Garden',
            location: {
                lat: 22.311808,
                lng: 73.191127
            }
        },{
            title: 'Sur Sagar Lake',
            location: {
                lat: 22.301039,
                lng: 73.203916
            }
        }
    ];



//Creates a new map
var map;

function initMap() {
    // Initialize the map
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            // Vadodara latitude and longitude
            lat: 22.307159,
            lng: 73.181219
        },
        zoom: 13
    });

    ko.applyBindings(new ViewModel());
}

//*--------------ViewModel----------------*//
var markers = [];
var ViewModel = function() {

    var self = this;
    self.locationList = ko.observableArray(locations);
    self.title = ko.observable('');
    self.navigation = ko.observable();

    self.currentMarker = function(current_location) {
        toggleBounce(current_location.marker);
        google.maps.event.trigger(current_location.marker, 'click');
    };
    self.query = ko.observable('');
    self.search = ko.computed(function() {
        // Make the filter-search case insensitive
        var userInput = self.query().toLowerCase();

        return ko.utils.arrayFilter(self.locationList(), function(item) {
            var title = item.title.toLowerCase();
            var userInputIsInTitle = title.indexOf(userInput) >= 0;
            if (item.marker) {
                // toggle visibility of the marker
                item.marker.setVisible(userInputIsInTitle);
            }
            return userInputIsInTitle;
        });
    });


    //Initialize the InfoWindow
    var largeInfowindow = new google.maps.InfoWindow();
    // Marker styling
    var defaultIcon = makeMarkerIcon('FF0000');
    //  Highlighted location marker - changes the color on mouse over
    var highlightedIcon = makeMarkerIcon('0000FF');
    // Applying bounds inorder to limit the display of locations on the map
    var bounds = new google.maps.LatLngBounds();

    // Populate Window
    function populateWindow() {
            populateInfoWindow(this, largeInfowindow);
            toggleBounce(this, marker);
        }

    // Changing the color to highlight
    function setHighlightedIcon() {
            this.setIcon(highlightedIcon);
        }

    // Setting the default colour of marker
    function setDefaultIcon() {
            this.setIcon(defaultIcon);
        }

    // The following group uses the locations array to create an array of markers on initialize.
    for (i = 0; i < locations.length; i++) {
        // Get the position from the locations array.
        var position = locations[i].location;
        var title = locations[i].title;
        // Create a marker per location, and put into markers array.
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            icon: defaultIcon,
            id: i
        });

        // Push the marker array markers.
        markers.push(marker);
        //Add the marker as a property of the corresponding locationList() element
        self.locationList()[i].marker = marker;

        // Create an onclick event to open the infowindow at each marker.
        marker.addListener('click', populateWindow);

        // Event listeners for changing color of marker on mouseover and mouseout
        marker.addListener('mouseover', setHighlightedIcon);
        marker.addListener('mouseout', setDefaultIcon);

        // Extend the boundaries of the map for each marker and display the marker
        bounds.extend(markers[i].position);
    }
    //make sure all of the markers fit within the map bounds
    map.fitBounds(bounds);
};

// This function populates the infowindow when the marker is clicked.
// Only one infowindow will be open at the clicked marker position.
function populateInfoWindow(marker, infowindow) {
    // Making sure the infowindow is not already opened on the selected marker.
    if (infowindow.marker != marker) {
        // Clear the infowindow content to give the streetview time to load.
        infowindow.setContent('');
        infowindow.marker = marker;
        // Marker property is cleared when the infowindow is closed.
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });

        //Declaring streetViewService and radius
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;

        // Streetview function
        var getStreetView= function getStreetView(data, status) {
        /* First checking the status to be "OK" to make sure that the streetview is found on the given location */
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: { //pov:-> point of view
                        heading: heading,
                        pitch: 30 //slightly above the building
                    }
                };
                //getting Panaroma and putting it inside the div having id= "streetview"
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('streetview'), panoramaOptions);
            } else {
                     document.getElementById('streetview').innerHTML ="No Streetview Found";
            }
        };

        // code for wikipedia ajax request.
        var wikiURL = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.title + '&format=json&callback=wikiCallback';
        var wikiTimeoutRequest = setTimeout(function() {
            // Setting the error message if wikipedia resource is not available within time period
            document.getElementById('url-div').innerHTML ="failed to load wikipedia resources";
        }, 8000);
        $.ajax({
            url: wikiURL,
            dataType: "jsonp",
            success: function(response) {

                // getting the URL from wiki response;
                var URL = response[3];
                // Using streetview service to get the closest streetview image
                streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
                /* setting the infowindow content to have the place name, wikipedia link(if available) and streetview(if available) */
                infowindow.setContent('<div class= "infoWindow_title">' + marker.title + '</div><div id= "url-div"></div><a class="place-url" href ="' + URL + '">' + URL + '</a><div id="streetview"></div>');
                // Open the infowindow on the correct marker.
                infowindow.open(map, marker);
                console.log(URL);
                clearTimeout(wikiTimeoutRequest);
                // Setting the error message if wikipedia resource is not available on selected location
                if(URL.length === 0){
                    document.getElementById('url-div').innerHTML ="No wikipedia resources found";
                }
            }
        });
    }
}

//Adding bounce animation to marker when it is clicked and stop animation after 1 seconds
function toggleBounce(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        marker.setAnimation(google.maps.Animation.null);
    }, 1000);
}

// Marker function
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}

//Display alert message when an error occur to googleMaps
var mapError = function() {
    alert('Fail to load google map. Try again later');
};