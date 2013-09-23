"use strict";

var map, geocoder;

require([
	'esri/map', 'esri/dijit/Geocoder', 'esri/layers/FeatureLayer', 'esri/InfoTemplate', 'esri/layers/ArcGISImageServiceLayer', 'esri/layers/WebTiledLayer','esri/layers/ArcGISTiledMapServiceLayer',
	'esri/dijit/Popup',	'esri/dijit/InfoWindow',
	'dojo/dom-construct',
	'jquery', 'dojo/domReady!'], 
function(Map, Geocoder, FeatureLayer, InfoTemplate, ArcGISImageServiceLayer, WebTiledLayer, ArcGISTiledMapServiceLayer,
	Popup, InfoWindow, domConstruct, $)
{			
	map = new Map("map",{
		basemap: "satellite",
		center: [0.373, 42.382],
		zoom: 9,
	});

	var basemap = new ArcGISImageServiceLayer("http://imagery.arcgisonline.com/arcgis/rest/services/LandsatGLS/LandsatShadedBasemap/ImageServer");
	basemap.setMaxScale(150000);
	map.addLayer( basemap );

	map.addLayer( new WebTiledLayer('http://${subDomain}.tile.stamen.com/toner-lines/${level}/${col}/${row}.png',{ subDomains: ["a","b","c","d"]}) );
	map.addLayer( new WebTiledLayer('http://${subDomain}.tile.stamen.com/toner-labels/${level}/${col}/${row}.png',{ subDomains: ["a","b","c","d"]}) );
	// map.addLayer( new WebTiledLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/${level}/${row}/${col}.png'));
	// map.addLayer( new ArcGISTiledMapServiceLayer('http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer'));

	var popup = new Popup({
		popupWindow: false
	},domConstruct.create("div"));
	popup.startup();
	map.setInfoWindow(popup);

	popup.on('selection-change',function(evt)
	{
		console.log('selection-change');
		showInfo(popup.getSelectedFeature());
	});

	popup.on('clear-features',function(evt)
	{
		console.log('clear-features');
		hideInfo();
	});

	popup.on('set-features',function(evt)
	{
		console.log('set-features');
	});

	// var infoWindow = new InfoWindow({}, dojo.create("div",null,map.root));
	// infoWindow.startup();
	// map.setInfoWindow(infoWindow);

	var infoTemplate = new InfoTemplate();
	infoTemplate.setTitle("${name}");
	infoTemplate.setContent(getWeatherFor);

	var featureLayer = new FeatureLayer('http://services.arcgis.com/84aT6SlX1Oaf3c5i/arcgis/rest/services/Estaciones_de_Esqu%C3%AD_en_Espa%C3%B1a/FeatureServer/0',
	{
		outFields: ["name","logo"],
		infoTemplate: infoTemplate
	});
	map.addLayer( featureLayer );


	geocoder = new Geocoder({ 
		map: map 
	}, "search");
	geocoder.startup();

	basemap.on('load',function()
	{
		console.log('map-load');
		
		$('#map').fadeTo(1000,1);
		$('#search').delay(500).fadeTo(500,1);

		/*
		map.on('click', function(evt)
		{
			if( evt.graphic )
			{
				console.log(evt.graphic);
				$('#info').text(evt.graphic.attributes.name || 'n/a');
				$('#info').fadeTo(300,1);

				getWeatherFor(evt.graphic);
			}
			else
			{
				$('#info').fadeOut(300);
			}
		}); // map.on(click)
		*/
	}); // map.on(load)

	function showInfo(feature)
	{
		console.log('showInfo()',feature);
	}

	function hideInfo()
	{
		console.log('hideInfo()');
	}

	function getWeatherFor(feature)
	{
		var deferred = new dojo.Deferred();

		var url = 'https://api.forecast.io/forecast/12f13c507731de514e3d749a977ee3b0/';
		var latlon = [feature.geometry.getLatitude(),feature.geometry.getLongitude()].join(',');

		var req = esri.request({
			url: url + latlon,
			content: {
				units: 'si' // celsius, km/h
			},
			handleAs: "json",
			callbackParamName: "callback"
		});
		
		req.then(function(data)
		{
			//http://dribbble.com/shots/912994-Weather-Icon-Update
			console.log(data);
			var summary = $('<div>').html(data.hourly.summary);
			$('#info').append(summary).hide().slideDown('slow');

			//deferred.callback('ok');
			deferred.callback(data.hourly.summary);
		},
		function(error)
		{
			console.log(error);
			deferred.errback(error);
		});

		return deferred;
	}

});
