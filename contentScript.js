var reviewsCount = 0;
var firstReviewURL = "";
var reviewsURL = "";
var apiReturnCount = 0;
var lastVisibleReviewIndex = 0;

chrome.runtime.onMessage.addListener(function (request, sender, response) {
  // console.log(
  //   sender.tab
  //     ? "from a content script:" + sender.tab.url
  //     : "from the extension"
  // );

  // console.log(request.greeting);

  if (request.greeting === "hello") {
    var getClickBtn = setInterval(() => {
      let reviewsBtn = document.getElementsByClassName("Yr7JMd-pane-hSRGPd");

      if (reviewsBtn[0] != undefined) {
        clearInterval(getClickBtn);

        var myStr = reviewsBtn[0].getAttribute("aria-label").slice(0, -4);
        var newStr = myStr.replace(/,/g, "");

        console.log(newStr); // 評論數量
        reviewsCount = Number(newStr);
        alert("reviewsCount: " + reviewsCount);

        if (reviewsCount > 3) {
          reviewsBtn[0].click();
          loadReviews();
        }
      } else {
        console.log("等待按鈕生成");
      }
    }, 500);
  } else if (request.currentURL) {
    console.log("reviewsURL: " + reviewsURL);
    console.log("currentURL: " + request.currentURL);
    lastVisibleReviewIndex = 0;

    // if (reviewsURL != "") {
    //   console.log("換頁");
    //   reviewsURL = "";
    //   observer.disconnect();
    // }
  }

  response({});
});

function loadReviews() {
  clearInterval(getFirstReviewURL);

  var getFirstReviewURL = setInterval(() => {
    chrome.runtime.sendMessage({ type: "getreviewURL" }, function (response) {
      if (response.reviewURL == "error") {
        clearInterval(getFirstReviewURL);
        console.log("回傳錯誤");
        firstReviewURL = "";
        window.location.reload();

        loadReviews();
      } else if (response.reviewURL != "") {
        firstReviewURL = response.reviewURL;
        reviewsURL = response.currentURL;
        clearInterval(getFirstReviewURL);
        console.log(firstReviewURL);
        console.log(reviewsURL);

        ReviewsShow();
        getALLReviews();
      }
    });
  }, 500);
}

// 頁面顯示

function ReviewsShow() {
  clearInterval(waitReviewsShow);

  var waitReviewsShow = setInterval(() => {
    if (
      document.getElementsByClassName("section-scrollbox")[0] &&
      document.getElementsByClassName("section-scrollbox")[0].children.length >
        1
    ) {
      console.log(
        "目前div數量: " +
          document.getElementsByClassName("section-scrollbox")[0].children[
            document.getElementsByClassName("section-scrollbox")[0].children
              .length - 2
          ].children.length
      );

      var waitCount = 0;
      if (reviewsCount < 10) {
        waitCount = reviewsCount * 3 - 1;
      } else {
        waitCount = 29;
      }
      if (
        document.getElementsByClassName("section-scrollbox")[0].children[
          document.getElementsByClassName("section-scrollbox")[0].children
            .length - 2
        ].children.length >= waitCount
      ) {
        clearInterval(waitReviewsShow);
        let targetDiv =
          document.getElementsByClassName("section-scrollbox")[0].children[
            document.getElementsByClassName("section-scrollbox")[0].children
              .length - 2
          ];

        createReviewsObserver();
        changeColor(targetDiv);
      }
    } else {
      console.log("目前沒有div");
    }
  }, 500);
}

function createReviewsObserver() {
  // try{
  //   observer.disconnect();
  //   console.log("have observer");
  // }catch(e){
  //   console.log(e);
  //   console.log("don't have observer");
  // }

  let reviewsDiv = document.getElementsByClassName("section-scrollbox");

  const targetNode = reviewsDiv[0].children[reviewsDiv[0].children.length - 2];

  const config = { childList: true };

  // Callback function to execute when mutations are observed
  const callback = function (mutationsList, observer) {
    // Use traditional 'for loops' for IE 11
    for (const mutation of mutationsList) {
      if (
        mutation.type === "childList" &&
        mutation.target.children.length - 1 != lastVisibleReviewIndex
      ) {
        changeColor(mutation.target);
      }
    }
  };

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(callback);

  // Start observing the target node for configured mutations
  observer.observe(targetNode, config);

  // Later, you can stop observing
  // observer.disconnect();
}

function changeColor(targetDiv) {
  for (
    reviewIndex = lastVisibleReviewIndex;
    reviewIndex < targetDiv.children.length - 1;
    reviewIndex++
  ) {
    let currentReview = targetDiv.children[reviewIndex];

    if (currentReview.getAttribute("aria-label")) {
      let reviewDiv =
        currentReview.children[0].children[2].children[3].children[0];

      // console.log(reviewDiv);

      let reviewStar = reviewDiv.children[1].getAttribute("aria-label");

      // console.log(reviewStar);

      let color = "#ffcc00";
      let reliability = "中立";

      switch (Number(reviewStar[1])) {
        case 1:
          color = "#ff3a30";
          reliability = "非常不可靠";
          break;
        case 2:
          color = "#ff9500";
          reliability = "不可靠";
          break;
        case 4:
          color = "#00c7be";
          reliability = "可靠";
          break;
        case 5:
          color = "#34c759";
          reliability = "非常可靠";
          break;
        default:
          break;
      }

      var innerDiv = document.createElement("div");
      innerDiv.className = "add-div";
      innerDiv.textContent = reliability;

      innerDiv.style.fontSize = "12px";
      innerDiv.style.color = "#ffffff";
      innerDiv.style.backgroundColor = color;
      innerDiv.style.margin = "1px 8px";
      innerDiv.style.padding = "2px 8px";
      innerDiv.style.borderRadius = "20px";

      reviewDiv.appendChild(innerDiv);
    }
  }
  lastVisibleReviewIndex = targetDiv.children.length - 1;
  console.log("目前div數量: " + lastVisibleReviewIndex);
}

// 背景取得

function getALLReviews() {
  var arr = [];
  var star = [];

  var decade = 0;
  if (reviewsCount % 10 > 0) {
    decade = parseInt(reviewsCount / 10) + 1;
  } else {
    decade = parseInt(reviewsCount / 10);
  }

  for (i = 0; i < decade; i++) {
    let reviewURL =
      firstReviewURL.substring(0, firstReviewURL.indexOf("!2m2!") + 7) +
      (i * 10).toString() +
      firstReviewURL.substring(
        firstReviewURL.indexOf("!2m2!") + 8,
        firstReviewURL.length
      );

    // console.log(reviewURL); // 後續載入的URL

    fetch(reviewURL)
      .then(function (response) {
        return response.text();
      })
      .then(function (requests_result) {
        let pretext = ")]}'";
        let text = requests_result.replace(pretext, "");
        let soup = JSON.parse(text);

        if (soup[2]) {
          for (j = 0; j < soup[2].length; j++) {
            arr.push(soup[2][j][3]);
            star.push(soup[2][j][1]);
          }
        }

        if (apiReturnCount == decade - 1) {
          apiReturnCount = 0;

          console.log(arr);
          console.log(star);

          firstReviewURL = "";
        } else {
          apiReturnCount++;
        }
      })
      .catch((rejected) => {
        console.log(rejected);

        var arr = [];
        var star = [];
        firstReviewURL = "";
        loadReviews();
      });
  }
}

// function delay(n){
//   return new Promise(function(resolve){
//       setTimeout(resolve,n*100);
//   });
// }
