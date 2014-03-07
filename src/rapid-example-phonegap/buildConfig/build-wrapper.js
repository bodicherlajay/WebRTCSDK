({
    baseUrl: "../src",
    name: "../lib/almond",
    out: "../builds/att-min-2.0.js",
    has: {
        //Packages to import
        ADS: true,
        CMS: true,
        DC: true,
        IMMN: true,
        PAYMENT: true,
        MMS: true,
        SMS: true,
        SPEECH: true,
        TTS: true,
        TL: true,
        WAP: true
    },
    //To remove minimizing, un-comment this next line:
    //optimize: 'none', 
    deps: [
        'att/main', 'att/util', 'att/ajax', 'att/constants'
    ],
    wrap: {
    	start: 'define("att", function(require, exports, module) { exports.ATT = (function(){',
    	end: 'return require("wrappers/wrapper")})(); });'
    }
})