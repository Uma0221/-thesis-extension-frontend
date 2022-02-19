var reviewURL = "";

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if(details.url.startsWith('https://www.google.com/maps/preview/review/')){
            reviewURL = details.url;
        }
    }, 
    {
        urls: ["https://www.google.com/maps/*"]
    }
);


chrome.runtime.onMessage.addListener(function (message, sender, response) {
    switch (message.type) {
    
        //回傳評論的URL
        case "getreviewURL":
            // console.log(reviewURL);
            response({ "reviewURL": reviewURL});
            
            reviewURL = "";
            // console.log(reviewURL);
            break;
    
        default:
            console.error("Unrecognised message: ", message);
    }
});