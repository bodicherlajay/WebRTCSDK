({
	
	baseUrl: "../src",
    out: "../builds/att-phonegap-require-min-1.0.js",
    has: {
    	phonegap: true,
        XMLHttpRequest: true,
        
        //Use this value for debuging
        DEBUG: false,
        IMMN: false,
        IMMNv2: true
    },
    
    //To remove minimizing, uncomment this next line:
    optimize: 'none',
    
    name: "../lib/almond",
    include: ['extensions/phonegap', 'wrappers/wrapper-1.0'], 
    wrap: {
    	start: 'define("att",["exports"],function(e){',
    	end: 'var r=require;r("extensions/phonegap");e.ATT=r("wrappers/wrapper-1.0");});'
    }
})