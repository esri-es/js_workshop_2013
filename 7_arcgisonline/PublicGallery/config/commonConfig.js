define([], function() {
    var config = {
        bingMapsKey: "",
        helperServices: {
            geometry: {
                url: location.protocol + "//utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer"
            },
            printTask: {
                url: location.protocol + "//utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
            },
            geocode: {
                url: location.protocol + "//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
            }
        }
    };
    return config;
});