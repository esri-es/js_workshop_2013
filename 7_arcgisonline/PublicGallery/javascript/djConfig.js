// host path regular expression
var pathRegex = new RegExp(/\/[^\/]+$/);
var locationPath = location.pathname.replace(pathRegex, '');

// Dojo Config
var dojoConfig = {
    parseOnLoad: true,
    //locale: 'ar',
    packages: [{
        name: "esriTemplate",
        location: locationPath
    }, {
        name: "application",
        location: locationPath + '/javascript'
    }, {
        name: "config",
        location: locationPath + '/config'
    }]
};