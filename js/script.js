
var xmlhttp = null;
var nextbusURL = "http://webservices.nextbus.com/service/publicXMLFeed";
var selectedAgency = null;
var selectedRoute = "";
var selectedStop = "";

var agencies = new Array();
var routes = new Array();
var stops  = new Array();
var regions = new Array();
var currentDirection = null;
var currentStops = null;
var currentAgency = "";


function Agency(tag, title, regionTitle) {
    this.tag = tag;
    this.title = title;
    this.regionTitle = regionTitle;
}

function Route(tag, title) {
    this.tag = tag;
    this.title = title;
}

function Stop(tag, title, lat, lon, stopId) {
    this.tag = tag;
    this.title = title;
    this.lat = lat;
    this.lon = lon;
    this.stopId = stopId;
}

function Prediction(epochTime, seconds, minutes, isDeparture, affectedByLayover, branch, dirTag, vehicle, block, tripTag) {
    this.epochTime = epochTime;
    this.seconds = seconds;
    this.minutes = minutes;
    this.isDeparture = isDeparture;
    this.affectedByLayover = affectedByLayover;
    this.branch = branch;
    this.dirTag = dirTag;
    this.vehicle = vehicle;
    this.block = block;
    this.tripTag = tripTag;
}

function createXMLRequest() {
    if (window.XMLHttpRequest)
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp=new XMLHttpRequest();
    }
    else
    {// code for IE6, IE5
        xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
}

function buildAgencyList() {
    xmlhttp.open("GET", nextbusURL+"?command=agencyList", false);
    xmlhttp.send();
    xmlDoc=xmlhttp.responseXML;

    var regionSelectionHTML = "<option>Choose one...</option>";
    var regionCount = 0;
    var list = xmlDoc.getElementsByTagName("agency");
    for (var i = 0; i < list.length; i++) {
        agencies[i] = new Agency(list[i].getAttribute("tag"),
                                 list[i].getAttribute("title"),
                                 list[i].getAttribute("regionTitle"));

        if (!findStringInArray(agencies[i].regionTitle, regions)) {
            regions[regionCount] = agencies[i].regionTitle;
            regionSelectionHTML += "<option id='" + agencies[i].regionTitle + "' value='" + regionCount++ + "'>" + agencies[i].regionTitle + "</option>";
        }
    }

    document.getElementById("region-selection").innerHTML = regionSelectionHTML;
}

function findStringInArray(str, strArray) {
    for (var i = 0; i < strArray.length; i++) {
        if (strArray[i].match(str))    return true;
    }
    return false;
}

function selectAgency(tag) {
    currentAgency = tag;
}

function onRegionSelect(value) {
    var agencySelectionHTML = "";
    for (var i = 0; i < agencies.length; i++) {
        if (agencies[i].regionTitle.match(regions[value])) {
            agencySelectionHTML += "<li><a href='routes.html' onclick=\"selectAgency('" + agencies[i].tag + "');\">" + agencies[i].title + "</a>\n";
        }
    }

    document.getElementById("agency").innerHTML = agencySelectionHTML;
    $('#agency').listview('refresh');
}

function onRouteSelect(value) {
    selectedRoute = routes[value].tag;
    xmlhttp.open("GET", nextbusURL + "?command=routeConfig&a=" + currentAgency + "&r=" + routes[value].tag, false);
    xmlhttp.send();
    xmlDoc=xmlhttp.responseXML;
    currentStops = xmlDoc.getElementsByTagName("stop");
    
    currentDirection = xmlDoc.getElementsByTagName("direction");
    var directionsHTML = "<option>Choose one...</option>";
    for (var i = 0; i < currentDirection.length; i++) {
        directionsHTML += "<option id='" + currentDirection[i].getAttribute("tag") + "' value='" + i + "'>" + currentDirection[i].getAttribute("title") + "</option>";
    }
    
    document.getElementById("route-direction").innerHTML = directionsHTML;
    document.getElementById("stop-group").innerHTML = "";
    $('#stop-group').listview('refresh');
    $('#route-direction').selectmenu('refresh');
}

function onDirectionSelect(value) {
    var stopGroupHTML = "";

    var stopList = currentDirection[value].getElementsByTagName("stop");
    for (var j = 0; j < stopList.length; j++) {
        for (var k = 0; k < currentStops.length; k++) {
            if (currentStops[k].getAttribute("tag") == stopList[j].getAttribute("tag")) {
                stopGroupHTML += "<li><a href='predictions.html' onclick=\"selectStop('" + currentStops[k].getAttribute("tag") + "');\">" + currentStops[k].getAttribute("tag") + " - " + currentStops[k].getAttribute("title") + "</a></li>\n";
                break;
            }
        }
    }

    document.getElementById("stop-group").innerHTML = stopGroupHTML;
    $('#stop-group').listview('refresh');
}

function selectStop(value) {
    selectedStop = value;
}

function buildRouteList() {
    xmlhttp.open("GET", nextbusURL + "?command=routeList&a=" + currentAgency, false);
    xmlhttp.send();
    xmlDoc=xmlhttp.responseXML;
    
    var routeSelectionHTML = "<option>Choose one...</option>";
    var stopGroupHTML = "";

    var list = xmlDoc.getElementsByTagName("route");

    for (var i = 0; i < list.length; i++) {
        routes[i] = new Route(list[i].getAttribute("tag"), list[i].getAttribute("title"));
        routeSelectionHTML += "<option id='" + routes[i].tag + "' value='" + i + "'>" + routes[i].title + "</option>";
    }

    document.getElementById("route-list").innerHTML = routeSelectionHTML;
}

function getPredictionsForStop() {
    xmlhttp.open("GET", nextbusURL + "?command=predictions&a=" + currentAgency + "&s=" + selectedStop + "&r=" + selectedRoute, false);
    xmlhttp.send();
    xmlDoc=xmlhttp.responseXML;
    var list = xmlDoc.getElementsByTagName("predictions");
    var predictionHTML = "";
    
    var description = "<p>Predictions for route " + list[0].getAttribute("routeTitle") + ", stop " + list[0].getAttribute("stopTitle") + ":<br></p>";
    document.getElementById("prediction-text").innerHTML = description;
    
    for (var i = 0; i < list.length; i++) {
        var direction = list[i].getElementsByTagName("direction");
        for (var j = 0; j < direction.length; j++) {
            var predictions = direction[j].getElementsByTagName("prediction");
            predictionHTML += "<li data-role='list-divider'>" + direction[j].getAttribute("title") + "</li>\n";
            for (var j = 0; j < predictions.length; j++) {
                var hours = "";
                var minutes = predictions[j].getAttribute("minutes");
                var seconds = predictions[j].getAttribute("seconds") - (minutes*60);
                if (minutes >= 60) {
                    hours = Math.floor(minutes/60);
                    minutes = minutes - (hours*60);
                }
                
                if (hours != "")    hours += ":";
                if (minutes < 10)   minutes = "0" + minutes;
                if (seconds < 10)   seconds = "0" + seconds;
                
                predictionHTML += "<li><a href='#'>" + hours + minutes + ":" + seconds + "</a></li>\n";
            }
        }
    }
        
    document.getElementById("predictions-list").innerHTML = predictionHTML;
}
