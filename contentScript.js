var reviewsCount = 0;
var firstReviewURL = "";
var apiReturnCount = 0;
var starMean = 4.3;

// 監聽popup
chrome.runtime.onMessage.addListener(function (request, sender, response) {
  if (request.greeting === "hello") {
    // 初始化
    reviewsCount = 0;
    firstReviewURL = "";
    apiReturnCount = 0;
    clearInterval(getClickBtn);

    var getClickBtn = setInterval(() => {
      let reviewsBtn = document.getElementsByClassName("Yr7JMd-pane-hSRGPd");

      if (reviewsBtn[0] != undefined) {
        clearInterval(getClickBtn);

        var countStr = reviewsBtn[0]
          .getAttribute("aria-label")
          .slice(0, -4)
          .replace(/,/g, "");

        console.log(countStr); // 評論數量
        reviewsCount = parseInt(countStr);
        alert("reviewsCount: " + reviewsCount);

        if (reviewsCount > 3) {
          reviewsBtn[0].click();
          saveFirstReviewURL();
        }
      } else {
        console.log("等待按鈕生成");
      }
    }, 500);
  }

  response({});
});

// 讀取api
function saveFirstReviewURL() {
  clearInterval(getFirstReviewURL);

  var getFirstReviewURL = setInterval(() => {
    chrome.runtime.sendMessage({ type: "getreviewURL" }, function (response) {
      if (response.reviewURL == "error") {
        clearInterval(getFirstReviewURL);
        console.log("回傳錯誤");
        firstReviewURL = "";
        window.location.reload();

        saveFirstReviewURL();
      } else if (response.reviewURL != "") {
        firstReviewURL = response.reviewURL;
        clearInterval(getFirstReviewURL);
        console.log(firstReviewURL);

        console.log(reviewsCount);

        getALLReviews();
      }
    });
  }, 500);
}

function arrayTocsv(csvData) {
  // var _headers = [
  //   "content_length",
  //   "photos_count",
  //   "content",
  //   "star_gap",
  //   "date",
  //   "like_count",
  //   "reply",
  //   "reviewer_rank",
  // ];

  var lineArray = [];
  csvData.forEach(function (infoArray, index) {
    var line = infoArray.join(",");
    lineArray.push(index == 0 ? "\uFEFF" + line : line); // 為了讓Excel開啟csv，需加上BOM：\uFEFF
  });
  var csvContent = lineArray.join("\n");

  // console.log(csvContent);

  // download stuff
  var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  var link = document.createElement("a");

  if (link.download !== undefined) {
    // feature detection
    // Browsers that support HTML5 download attribute
    link.setAttribute("href", window.URL.createObjectURL(blob));
    link.setAttribute("download", "data.csv");
    link.setAttribute("hidden", true);
  } else {
    // it needs to implement server side export
    console.log("error");
    link.setAttribute("href", "#");
  }
  //link.innerHTML = "Export to CSV";
  //document.body.appendChild(link);
  link.click();
}

// 取得最新的評論時間
function getALLReviews() {
  var arr = [];

  var decade = 0;
  if (reviewsCount > 2000) {
    console.log("太多評論了！");
    decade = 200;
  } else if (reviewsCount % 10 > 0) {
    decade = parseInt(reviewsCount / 10) + 1;
  } else {
    decade = parseInt(reviewsCount / 10);
  }

  for (i = 0; i < decade; i++) {
    let otherReviewURL =
      firstReviewURL.substring(0, firstReviewURL.indexOf("!2m2!") + 7) +
      (i * 10).toString() +
      firstReviewURL.substring(
        firstReviewURL.indexOf("!2m2!") + 8,
        firstReviewURL.length
      );

    // console.log(otherReviewURL); // 後續載入的URL

    fetch(otherReviewURL)
      .then(function (response) {
        return response.text();
      })
      .then(function (requests_result) {
        let pretext = ")]}'";
        let text = requests_result.replace(pretext, "");
        let soup = JSON.parse(text);

        if (soup[2]) {
          for (j = 0; j < soup[2].length; j++) {
            if (soup[2][j][1].indexOf("年") < 0) {
              var content_length = 0;
              var photos_count = 0;
              var content = "";
              var reply = false;
              var reviewer_rank = 0;

              let star_gap =
                Math.abs(parseInt(soup[2][j][4]) * 10 - starMean * 10) / 10;
              let date = soup[2][j][1];
              let like_count = soup[2][j][16];
              // let reviewer_count = soup[2][j][12][1][1]

              if (soup[2][j][3]) {
                content_length = soup[2][j][3].length;
                content = soup[2][j][3];
              }
              if (Array.isArray(soup[2][j][14])) {
                photos_count = soup[2][j][14].length;
              }
              if (soup[2][j][9]) {
                reply = true;
              }
              if (soup[2][j][12][1][0]) {
                reviewer_rank = soup[2][j][12][1][0][0];
              }

              arr.push([
                content_length,
                photos_count,
                `"${content}"`,
                star_gap,
                date,
                like_count,
                reply,
                reviewer_rank,
              ]);
            } else {
              // console.log(soup[2][j][1]);
            }
          }
        }

        if (apiReturnCount == decade - 1) {
          apiReturnCount = 0;

          console.log(arr);
          arrayTocsv(arr);

          firstReviewURL = "";
        } else {
          apiReturnCount++;
        }
      })
      .catch((rejected) => {
        console.log(rejected);

        var arr = [];
        firstReviewURL = "";
        saveFirstReviewURL();
      });
  }
}
