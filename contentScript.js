var reviewsCount = 0;
var firstReviewURL = {
  value: "",
  // letMeKnow() {
  //   console.log("The variable has changed to"+this.testVar);
  // },
  // get testVar() {
  //   return this.value;
  // },
  set testVar(value) {
    this.value = value;
    // this.letMeKnow();
    getReviews(this.value);
    return this.value;
  }
}

chrome.runtime.onMessage.addListener(function (request, sender) {
  console.log(
    sender.tab
      ? "from a content script:" + sender.tab.url
      : "from the extension"
  );

  console.log(request.greeting);

  if (request.greeting === "hello") {
    let button1 = document.getElementsByClassName("Yr7JMd-pane-hSRGPd");

    if (button1[0] != undefined) {
      var myStr = button1[0].getAttribute("aria-label").slice(0, -4);
      var newStr = myStr.replace(/,/g, "");

      console.log( newStr );  // "this-is-a-test"
      reviewsCount = Number(newStr);
      alert("reviewsCount: " + reviewsCount);

      clickReviews();
    }
  }
});

function clickReviews() {
  let reviewsBtn = document.getElementsByClassName("Yr7JMd-pane-hSRGPd");

  if (reviewsBtn[0] != undefined) {
    clearInterval(getreviewURL);

    reviewsBtn[0].click();

    var getreviewURL = setInterval(() => {
      chrome.runtime.sendMessage({ type: "getreviewURL" }, function (response) {
        if (response.reviewURL != "") {
          // firstReviewURL = response.reviewURL;
          
          firstReviewURL.testVar = response.reviewURL;
          clearInterval(getreviewURL);
          getReviews(response.reviewURL);
        }
      });
    }, 500);
  }
}

async function getReviews(firstReviewURL){
  var arr = [];
  var star = [];

  var decade = 0;
  if(reviewsCount % 10 > 0){
    decade = parseInt(reviewsCount / 10)+1;
  }else{
    decade = parseInt(reviewsCount / 10);
  }

  for (i = 0; i < decade; i++) {
    console.log(i);

    let reviewURL = firstReviewURL.substring(0,firstReviewURL.indexOf('!2m2!')+7)+(i*8).toString()+firstReviewURL.substring(firstReviewURL.indexOf('!2m2!')+8, firstReviewURL.length);
    // console.log(firstReviewURL)
    console.log(reviewURL)

    fetch(reviewURL)
    .then(function (response) {
      return response.text();
    })
    .then(function (requests_result) {
      let pretext = ")]}'";
      let text = requests_result.replace(pretext, "");
      let soup = JSON.parse(text);

      if(soup[2]){
        // console.log(reviewURL);
        // console.log(soup);
        for (j = 0; j < soup[2].length; j++) {
          arr.push(soup[2][j][3]);
          star.push(soup[2][j][4]);
        }
      }else{
        console.log(i);
        console.log(soup)
      }
    });
    
  }

  console.log(arr);
  console.log(star);

  await delay(5);
}

function delay(n){
  return new Promise(function(resolve){
      setTimeout(resolve,n*100);
  });
} 