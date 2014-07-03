"use strict";

var map, geocoder;

require([
	'esri/map', 
	'esri/dijit/Geocoder', 
	'esri/layers/FeatureLayer', 
	'esri/InfoTemplate', 
	'esri/layers/ArcGISImageServiceLayer', 
	'esri/layers/WebTiledLayer',
	'esri/layers/ArcGISTiledMapServiceLayer',
	'esri/dijit/Popup',	
	'esri/dijit/InfoWindow',
	'dojo/dom-construct',
	'jquery', 
	'dojo/domReady!'
],function(
	Map, 
	Geocoder, 
	FeatureLayer, 
	InfoTemplate, 
	ArcGISImageServiceLayer, 
	WebTiledLayer, 
	ArcGISTiledMapServiceLayer,
	Popup, 
	InfoWindow, 
	domConstruct, 
	$
){			
	map = new Map("map",{
		basemap: "satellite",
		center: [0.373, 42.382],
		zoom: 9,
	});

	var basemap = new ArcGISImageServiceLayer("http://imagery.arcgisonline.com/arcgis/rest/services/LandsatGLS/LandsatShadedBasemap/ImageServer");
	basemap.setMaxScale(150000);
	map.addLayer( basemap );

	// Añadimos dos capas proporcionadas por http://stamen.com
	map.addLayer( new WebTiledLayer('http://${subDomain}.tile.stamen.com/toner-lines/${level}/${col}/${row}.png',{ subDomains: ["a","b","c","d"]}) );
	map.addLayer( new WebTiledLayer('http://${subDomain}.tile.stamen.com/toner-labels/${level}/${col}/${row}.png',{ subDomains: ["a","b","c","d"]}) );

	// Cargamos el buscador
	geocoder = new Geocoder({ 
		map: map 
	}, "search");
	geocoder.startup();

	// Animamos el mapa y el buscador con jQuery
	basemap.on('load',function()
	{
		$('#map').fadeTo(1000,1);
		$('#search').delay(500).fadeTo(500,1);
	});

	// Gestionamos el formulario con jQuery
	$("#searchForm").submit(function(e){
		e.preventDefault();
		$(this).find("[type='submit']").attr("value", "Buscando...");
	});

	
});
