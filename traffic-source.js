(function(){
    "use strict"

    var traffic_source_COOKIE_TOKEN_SEPARATOR = "--"; //separating between concatenated lead source
    var NONE = "(none)";

    function getCookie(cookieName){
        var name = cookieName + "=";
        var cookieArray = document.cookie.split(';'); //break cookie into array
        for(var i = 0; i < cookieArray.length; i++){
          var cookie = cookieArray[i].replace(/^\s+|\s+$/g, ''); //replace all space with '' = delete it
          if (cookie.indexOf(name)==0){
             return cookie.substring(name.length,cookie.length); //
          }
        }
        return null;
    }

	/*
       Checks whether a certain parameter exist in the current browser URL. If it does, it returns its name. 
	   It will receive "src" later in the main function
    */
	
    function getURLParameter(param){
        var pageURL = window.location.search.substring(1); //get the query string parameters without the "?"
        var URLVariables = pageURL.split('&'); //break the parameters and values attached together to an array
        for (var i = 0; i < URLVariables.length; i++) {
            var parameterName = URLVariables[i].split('='); //break the parameters from the values
            if (parameterName[0] == param) {
                return parameterName[1];
            }
        }
        return null;
    }

	/*
       Gets the first (latest) token from a cookie: THIS__ONE--NOT__THIS__ONE--AND__NOT__THIS__ONE
    */
	
    function getFirstTokenFromCookie(cookie){
        var result = "";
        var firstSeparatorIndex = cookie.indexOf(traffic_source_COOKIE_TOKEN_SEPARATOR);
        result = firstSeparatorIndex !== -1 ? cookie.substring(0, firstSeparatorIndex) : cookie; //if there is a separator, provide the newest value no the cookie  
        return result;
    }

	/*
       Set the cookie if it doesn't exist.
    */
	
    function setCookie(cookie, value){
        var expires = new Date();
        expires.setTime(expires.getTime() + 62208000000); //1000*60*60*24*30*24 (2 years)
        document.cookie = cookie + "=" + value + "; expires=" + expires.toGMTString() + "; domain=.backbase.com; path=/";
    }
	
	/*
       Boolean, whether or not it's not NULL or Empty
    */
	
    function isNotNullOrEmpty(string){
        return string !== null && string !== "";
    }
	
	/*
       Remove the protocol for the referral token
    */
    function removeProtocol(href) {
        return href.replace(/.*?:\/\//g, "");
    }

    /*
       Find lead source by checking cookie, url param "src" or referrer(that order) and set new cookie traffic_source.
       Do this only if cookie do not exist. This value will be used for contact form.
       If cookie exist add url "src" param on the beginning of the cookie if it exists and it is not already at the beginning of the cookie.
       This way "tokens" are made in traffic_source cookie. Token separator is "--" (see above traffic_source_COOKIE_TOKEN_SEPARATOR)
    */

    var urlParamSRC = getURLParameter("src"); //take the SRC value
    if(document.cookie.indexOf("traffic_source") === -1) { // if there is no cookie traffic_source set yet, check if there is an existing UTMZ campaign name.
        var traffic_source = ""; //reset lead source value
        var utmzCookie = getCookie("__utmz"); //get GA cookie
        var cookieCampaignName = "";  //reset lead source value
        if(utmzCookie != null) {
            var UTMSRC = "utmccn=";
            var start = utmzCookie.indexOf(UTMSRC);
            var end = utmzCookie.indexOf("|", start); 
            if(start > -1) {
                if(end === -1) {
                    end = utmzCookie.length; 
                }
                cookieCampaignName = utmzCookie.substring((start + UTMSRC.length), end); //get the value of the UTMZ, without the parameter name
            }
        }
        if(cookieCampaignName != "" && isNotNullOrEmpty(urlParamSRC)){ //if there is a campaign name AND there is SRC value
             traffic_source = urlParamSRC + traffic_source_COOKIE_TOKEN_SEPARATOR + cookieCampaignName; //concateane the SRC with the existing campaign name
        } else if(cookieCampaignName != ""){ //if there is campaign name
             traffic_source = cookieCampaignName;  //just use it for the new cookie
        } else if(urlParamSRC != null) { //if there is not campaign name but we have SRC
            traffic_source = decodeURI(urlParamSRC); // decode URI of the SRC parameter
        } else if(document.referrer != ""){ //if there is not campaign, and no src, check if there is a referrer,
            var referrerHostName = removeProtocol(document.referrer);
            var GOOGLE = /www.google/; //google?
            var YAHOO = /search.yahoo/; //yahoo?
            var BING = /www.bing/; ..being?
            if(GOOGLE.test(referrerHostName)){
                traffic_source = "Google Search";
            } else if(YAHOO.test(referrerHostName)){
                traffic_source = "Yahoo Search";
            } else if(BING.test(referrerHostName)){
                traffic_source = "Bing Search";
            } else {
                traffic_source = referrerHostName;
            }
        } else {
            traffic_source = NONE;
        }
        setCookie("traffic_source", traffic_source); //build the cookie
		
    } else if(isNotNullOrEmpty(urlParamSRC)){ //if there is a cookie, add the SRC to the cookie, unless the same src already exists
        var firstToken = getFirstTokenFromCookie(getCookie("traffic_source"));
        if(firstToken !== "" && urlParamSRC !== firstToken) {
            var newLeadSourceCookie = urlParamSRC + traffic_source_COOKIE_TOKEN_SEPARATOR + getCookie("traffic_source");
            setCookie("traffic_source", newLeadSourceCookie);
        }
    }

 })();
