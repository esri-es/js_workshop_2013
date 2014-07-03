"use strict";

var map, draw_tb, edit_tb, handlePoints, ghostGraphic, routesLayer, kmPoints;

require([
	"esri/map", "esri/toolbars/draw", "esri/toolbars/edit",
	"esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol",
	"esri/symbols/PictureFillSymbol", "esri/symbols/CartographicLineSymbol", 
	"esri/graphic", "esri/layers/GraphicsLayer",
	"esri/geometry/Point", "esri/geometry/Polyline",
	"esri/geometry/geodesicUtils", "esri/units", "esri/geometry/webMercatorUtils", "esri/geometry/mathUtils",
	"dojo/_base/Color", "dojo/_base/event", "dojo/number", "dojo/_base/lang",
	"dojo/dom-construct", "dojo/dom-style", "dojo/promise/all",
	"dojo/dom", "dojo/on", "dojo/domReady!" ], 
	function(
		Map, Draw, Edit,
		SimpleMarkerSymbol, SimpleLineSymbol,
		PictureFillSymbol, CartographicLineSymbol, 
		Graphic, GraphicsLayer,
		Point, Polyline,
		geodesicUtils, Units, webMercatorUtils, mathUtils,
		Color, event, number, lang,
		domConstruct, domStyle, all,
		dom, on
		) 
	{		
		map = new Map("mapDiv", 
		{
			basemap: "satellite",
			center: [-3.62, 40.463],
			zoom: 15
		});
		map.on("load", init);

		var symbols = defineSymbols();

		function defineSymbols()
		{
			var symbols = {}

			// markerSymbol is used for point and multipoint, see http://raphaeljs.com/icons/#talkq for more examples
			symbols.markerSymbol = new SimpleMarkerSymbol();
			//symbols.markerSymbol.setPath("M16,4.938c-7.732,0-14,4.701-14,10.5c0,1.981,0.741,3.833,2.016,5.414L2,25.272l5.613-1.44c2.339,1.316,5.237,2.106,8.387,2.106c7.732,0,14-4.701,14-10.5S23.732,4.938,16,4.938zM16.868,21.375h-1.969v-1.889h1.969V21.375zM16.772,18.094h-1.777l-0.176-8.083h2.113L16.772,18.094z");
			symbols.markerSymbol.setPath("M16,3.5c-4.142,0-7.5,3.358-7.5,7.5c0,4.143,7.5,18.121,7.5,18.121S23.5,15.143,23.5,11C23.5,6.858,20.143,3.5,16,3.5z M16,14.584c-1.979,0-3.584-1.604-3.584-3.584S14.021,7.416,16,7.416S19.584,9.021,19.584,11S17.979,14.584,16,14.584z");
			symbols.markerSymbol.setOffset(0,15);
			symbols.markerSymbol.setColor(new Color("#3498db"));

			// lineSymbol used for freehand polyline, polyline and line. 
			symbols.lineSymbol = new CartographicLineSymbol(
			CartographicLineSymbol.STYLE_SOLID,
			new Color("#e74c3c"), 8, 
			CartographicLineSymbol.CAP_ROUND,
			CartographicLineSymbol.JOIN_ROUND, 5
			);

			// fill symbol used for extent, polygon and freehand polygon, use a picture fill symbol
			// the images folder contains additional fill images, other options: sand.png, swamp.png or stiple.png
			symbols.fillSymbol = new PictureFillSymbol(
			"mangrove.png",
			new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color('#000'), 1 ), 
			42, 42 );

			return symbols;
		}

		function init()
		{
			initDrawToolbar();
			initEditToolbar();
			initGraphics();
		}

		function initGraphics()
		{
			// handlePoints = new GraphicsLayer({id:'handlePoints', opacity:0});
			// map.addLayer(handlePoints,0);

			routesLayer = new GraphicsLayer({id: 'routesLayer'});
			map.addLayer(routesLayer,0);
			console.log('routesLayer');

			routesLayer.on('click', function(evt)
			{
				event.stop(evt); // impedimos que se lance también el map-click

				console.log("clicked on",evt.graphic);
				var options = {
					allowAddVertices: true,
					allowDeleteVertices: true,
				}
				edit_tb.activate( Edit.EDIT_VERTICES, evt.graphic, options );
			});

			map.graphics.on('mouse-over',function(evt)
			{
				console.log('mouse-over');
				// handlePoints.setOpacity(1);
			});
			map.graphics.on('mouse-out',function(evt)
			{
				console.log('mouse-out');
				// handlePoints.setOpacity(0);
			});

			// handlePoints.on('mouse-drag',function(evt)
			// {
			// 	console.log(evt.graphic);
			// })

		}


		function initDrawToolbar() 
		{
			draw_tb = new Draw(map);
			draw_tb.on("draw-end", addGraphic);

			// event delegation so a click handler is not
			// needed for each individual button
			on(dom.byId("info"), "click", function(evt) 
			{
				if ( evt.target.id === "info" ) 
				{
					return;
				}
				var tool = evt.target.id.toLowerCase();
				map.disableMapNavigation();
				draw_tb.activate(tool);
			});
		}

		function initEditToolbar()
		{
			edit_tb = new Edit(map);

			// ghostGraphic = new GraphicsLayer({id:'ghostGraphic', opacity:0.5});
			// map.addLayer(ghostGraphic);

			kmPoints = new GraphicsLayer({id:'kmPoints', opacity:0.8});
			map.addLayer(kmPoints);
			console.log('kmPoints');

			var tooltip = domConstruct.create("div", {"class": "tooltip"}, map.container);
			tooltip.style.opacity = 0;
			tooltip.style.position = "fixed";

			var prevLength = 0;

			edit_tb.on('vertex-move', function(evt)
			{
				// console.log(evt);
				//console.log('evt.graphic',evt.graphic);
				var modifiedLine = new Polyline(evt.graphic.geometry.toJson());
				var vi = evt.vertexinfo;
				var newVertex = new Point(vi.graphic.geometry.toJson());
				var screenPoint = map.toScreen(newVertex);
				screenPoint.x += evt.transform.dx;
				screenPoint.y += evt.transform.dy;
				newVertex = map.toMap(screenPoint);
				if( vi.isGhost )	
					modifiedLine.insertPoint(vi.segmentIndex, vi.pointIndex, newVertex);
				else
					modifiedLine.setPoint(vi.segmentIndex, vi.pointIndex, newVertex);

				// var g = new Graphic( modifiedLine, symbols.lineSymbol );
				// ghostGraphic.clear();
				// ghostGraphic.add(g);

				updateRouteLenght(modifiedLine,tooltip,screenPoint,prevLength);

				labelKmPoints(modifiedLine);
			});

			edit_tb.on('vertex-move-stop', function(evt)
			{
				tooltip.style.opacity = 0;

				getAdditionalInfo(evt.graphic);
			});

			edit_tb.on('vertex-move-start', function(evt)
			{
				var line_gc = webMercatorUtils.webMercatorToGeographic(evt.graphic.geometry);
				prevLength = geodesicUtils.geodesicLengths([line_gc], Units.KILOMETERS)[0];
			});

			map.on('click', function(evt)
			{
				console.log('getCurrentState()', edit_tb.getCurrentState());
				edit_tb.deactivate();
			})
		}

		function addGraphic(evt) 
		{
			//deactivate the toolbar and clear existing graphics 
			draw_tb.deactivate(); 
			map.enableMapNavigation();

			// figure out which symbol to use
			var symbol;
			if ( evt.geometry.type === "point" || evt.geometry.type === "multipoint") 
			{
				symbol = symbols.markerSymbol;
			} 
			else if ( evt.geometry.type === "line" || evt.geometry.type === "polyline") 
			{
				symbol = symbols.lineSymbol;
				// var sr = map.spatialReference;

				// evt.geometry.paths.forEach(function(path)
				// {
				// 	path.forEach(function(point)
				// 	{
				// 		console.log(point);
				// 		var g = new Graphic( new Point(point, sr), symbols.markerSymbol );
				// 		console.log(g);
				// 		handlePoints.add(g);							
				// 	})
				// });
			}
			else 
			{
				symbol = symbols.fillSymbol;
			}

			routesLayer.add(new Graphic(evt.geometry, symbol));
		}

		function updateRouteLenght(line,tooltip, pt,prevLength)
		{
			var line_gc = webMercatorUtils.webMercatorToGeographic(line);
			var lenghts = geodesicUtils.geodesicLengths([line_gc], Units.KILOMETERS);
			var delta = (lenghts[0] - prevLength) * 1000;

			var str = (delta>0? '+' : '') + number.format(delta, {places: 2}) + " m";
			str += "<br>";
			str += number.format(lenghts[0], { places: 2} ) + " km";
			dom.byId("route-length").innerHTML = str;
			domStyle.set(tooltip,{
				left: (pt.x + 20) + "px",
				top: pt.y + "px",
				width: "70px"
			});
			tooltip.style.opacity = 1;
			tooltip.innerHTML = str;
		}

		function getAdditionalInfo(graphic)
		{
			var startPoint = graphic.geometry.getPoint(0,0);
			var endPoint   = graphic.geometry.getPoint(0, graphic.geometry.paths[0].length -1);

			console.log(startPoint);
			console.log(endPoint);

			var url = 'http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode'; 

			var req1 = esri.request({
				url: url,
				content: {
					location: JSON.stringify(startPoint.toJson()),
					distance: 200,
					f: 'pjson'
				}
			});
			var req2 = esri.request({
				url: url,
				content: {
					location: JSON.stringify(endPoint.toJson()),
					distance: 200,
					f: 'pjson'
				}
			});

			all([req1,req2]).then(function(data)
			{
				console.log('data',data);
				var str = "de " + data[0].address.Address + ", " + data[0].address.City;
				str +=  "<br>";
				str += " hasta " + data[1].address.Address + ", " + data[1].address.City; 
				dom.byId('address').innerHTML = str;
			},
			function(error)
			{
				console.log('error',error);
			})
		}

		function distance(p0,p1)
		{
			// return mathUtils.getLength(p0,p1);

			var pl = new Polyline({ "paths" : [[[p0.x,p0.y],[p1.x,p1.y]]], "spatialReference": map.spatialReference });
			var pl_gc = webMercatorUtils.webMercatorToGeographic(pl);
			var lengths = geodesicUtils.geodesicLengths([pl_gc], Units.METERS);
			return lengths[0];
		}

		function labelKmPoints(modifiedLine)
		{
			console.log('labelKmPoints');

			var sr = map.spatialReference;
			var t, kmx, kmy, kmPoint;
						
			var distanceToNextKm = 1000;
			var i,npoints = modifiedLine.paths[0].length;
			var currentPoint, lastPoint = modifiedLine.getPoint(0,0);
			var currentDistance = 0;

			kmPoints.clear();
			var pk = 0;
			kmPoints.add(new Graphic( new Point(lastPoint.x,lastPoint.y, sr), symbols.markerSymbol, {pk:pk+=1} ));

			for(i=1;i<npoints;i++)
			{
				currentPoint    = modifiedLine.getPoint(0,i);
				currentDistance = distance(lastPoint,currentPoint);

				if( distanceToNextKm > currentDistance )
				{
					distanceToNextKm -= currentDistance;
				}
				else
				{
					while( distanceToNextKm <= currentDistance )
					{
						t = distanceToNextKm / currentDistance;
						kmx = lastPoint.x * (1-t) + currentPoint.x * t;
						kmy = lastPoint.y * (1-t) + currentPoint.y * t;
						kmPoint = new Point(kmx,kmy,sr);
						kmPoints.add(new Graphic( kmPoint, symbols.markerSymbol, {pk: pk+=1} ));

						currentDistance -= distanceToNextKm;
						distanceToNextKm = 1000;
						lastPoint = kmPoint;
					}
					distanceToNextKm -= currentDistance;
				}

				lastPoint = currentPoint;
			}

			kmPoints.add(new Graphic( new Point(currentPoint.x,currentPoint.y, sr), symbols.markerSymbol, {pk:pk+=1} ));
		}
	});

