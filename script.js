
//used to store all the marker datapoints because evidently Google can't provide me a getter for the markers attached to a map for some reason.
var markers = [];
var mypos = {lat: 43.2, lng: -83};
var map;
const socket = new WebSocket("wss://thinklab1239.mybluemix.net/ws/snp");

//utility functions
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

// Calculate maximum latitude value on mercator projection
var maxLat = Math.atan(Math.sinh(Math.PI)) * 180 / Math.PI;

//Fix the text versions of the coordinates into actual numbers
function latRange(n) {
    return Math.min(Math.max(parseFloat(n), -maxLat), maxLat);
}

function lngRange(n) {
    return Math.min(Math.max(parseFloat(n), -180), 180);
}   

var updateMap = function(mymap){
  console.log("mymap: --"+mymap);
  var bounds = new google.maps.LatLngBounds();

  for(i=0;i<markers.length;i++) {
    bounds.extend(markers[i].getPosition());
  }

  mymap.setCenter(bounds.getCenter());

  mymap.fitBounds(bounds);

}

// Initialize and add the map
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
    
  } else { 
    msg.innerHTML = "Geolocation is not supported by this browser.";
  }

}

function showPosition(position) {
   // console.log(position)
    mypos=position
    initMap(position) 
} 

function initMap(pos) {

  //make a position with our location
  mypos = {lat:pos.coords.latitude, lng: pos.coords.longitude};

  // The map, centered at student position
  map = new google.maps.Map(
      document.getElementById('map'), {zoom: 9, center: mypos, mapTypeId: google.maps.MapTypeId.ROADMAP});

  //make a map marker and add it to the map
  var marker = new google.maps.Marker({position: mypos, map: map, title : "Me"});

  //add our mark to the list of all markers
  markers.push(marker);

  //make some code that will listen for when we add new markers and update the map
  google.maps.event.addDomListener(document.getElementById('marker_form'), 'submit', function(e) {

        e.preventDefault();//stops the submission of the form from refreshing the page and losing our info

        // Get lat and lng values from input fields
        var lat = document.getElementById('lat').value;
        var lng = document.getElementById('lng').value;
        var name = document.getElementById('name').value;

        // Validate user input as numbers
        lat = (!isNumber(lat) ? 0 : lat);
        lng = (!isNumber(lng) ? 0 : lng);

        // Validate user input as valid lat/lng values
        lat = latRange(lat);
        lng = lngRange(lng);

        // Replace input values
        document.getElementById('lat').value = "";
        document.getElementById('lng').value = "";
        document.getElementById('name').value = "";

        //put the cursor back into the name field
        document.getElementById("name").focus();

        //make a position with form entries
        var newPos = {lat:lat, lng: lng};

        //make the new marker
        var newMarker = new google.maps.Marker({
            position: newPos,
            title: name,
            map: map
        });

        //add the new marker to our list of markers
        markers.push(newMarker);

        //reset the zoom and center the map on all of the locations
        updateMap(map);

        //update the message on the page
        msg.innerHTML = "New marker added: Name:"+name+", lat:"+ mypos.lat+", long: "+ mypos.lng; 


    });
  
    //for the first time the map runs, let us know where our position is
    msg.innerHTML = "My Position is lat: "+ mypos.lat+", long: "+ mypos.lng; 

}

// Connection opened
socket.addEventListener('open', function (event) {
    socket.send('Hello Server!');
});

socket.onopen = function(e) {
  console.log("[open] Connection established");
  console.log("Sending to server");
  //mysocket.send("My name is John");

  //compose a message to send to the server
  mymsg = { "name":"John", "id":30 };//this is an example to make

  mymsg.event="coordinates";
  mymsg.name="Nathan";
  mymsg.id="20";
  mymsg.lon=mypos.lng;
  mymsg.lat=mypos.lat;
  socket.send(JSON.stringify(mymsg));
  console.log(mymsg);
};

socket.onmessage = function(event) {
  // console.log(`[message] Data received from server: ${event.data}`);
  var lat = "";
  var lng = "";

  var newData = JSON.parse(event.data,(key, value) =>
    {
     // console.log("parsing is "+key);
      if (key === 'lat'){
        console.log("lat is "+value);
        lat = value;
      }
      else if (key === 'lng'||key === 'lon'){
        lng = value;
        console.log("lng is "+lng);
      }
      else if (key === 'name'){
        name = value;
        console.log("name is "+name);
      }
    });
    
    // Validate user input as numbers
        lat = (!isNumber(lat) ? 0 : lat);
        lng = (!isNumber(lng) ? 0 : lng);

        // Validate user input as valid lat/lng values
        lat = latRange(lat);
        lng = lngRange(lng);

   //make a position with the incoming server data
   var newPos = {lat:lat, lng: lng};
    
  
    console.log("newPos is "+lat+","+lng);
    console.log("map is "+map);
   //make the new marker
      var newMarker = new google.maps.Marker({
        position: newPos,
        title: name,
        map: map
      });

      //add the new marker to our list of markers
      markers.push(newMarker);

      updateMap(map);
};

socket.onclose = function(event) {
  if (event.wasClean) {
     console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
  } else {
    // e.g. server process killed or network down
    // event.code is usually 1006 in this case
     console.log('[close] Connection died');
  }
};

socket.onerror = function(error) {
   console.log(`[error] ${error.message}`);
};