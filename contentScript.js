let storeName = "";
let reviewsAPI = "";

let starMean = 0;
let allReviewsCount = 0;

let newsReviewsAPI = "";
let reviewsArr = [];
let reliabilityArr = [];

// 監聽評論API
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  sendResponse({});
  // 初始化-------------------------------
  reviewsAPI = "";
  starMean = 0;
  allReviewsCount = 0;

  newsReviewsAPI = "";
  reviewsArr = [];
  reliabilityArr = [];
  // 初始化-------------------------------
  // console.log(message.storeName);
  reviewsAPI = message.reviewsAPI;
  console.log("reviewsAPI: " + reviewsAPI);

  if (storeName != message.storeName) {
    storeName = message.storeName;
    newsReviewsAPI =
      reviewsAPI.substring(0, reviewsAPI.indexOf("!2m2!") + 16) +
      "2" +
      reviewsAPI.substring(reviewsAPI.indexOf("!2m2!") + 17, reviewsAPI.length);

    console.log("newsReviewsAPI: " + newsReviewsAPI);
  }

  reviewsDivShow();
});

// 等待評論顯示
function reviewsDivShow() {
  // clearInterval(waitReviewsDivShow);

  const waitReviewsDivShow = setInterval(() => {
    if (
      // 確認標題為"所有評論"
      document.getElementsByClassName("iD2gKb")[0] &&
      document.getElementsByClassName("iD2gKb")[0].innerHTML == "所有評論" &&
      // 確認有卷軸
      document.getElementsByClassName("section-scrollbox")[0] &&
      document.getElementsByClassName("section-scrollbox")[0].children.length <=
        10 &&
      // 確認有商家評分資訊
      document.getElementsByClassName("jANrlb")[0] &&
      document.getElementsByClassName("jANrlb")[0].children.length == 4
    ) {
      const targetDiv =
        document.getElementsByClassName("section-scrollbox")[0].children[
          document.getElementsByClassName("section-scrollbox")[0].children
            .length - 2
        ];

      let loadReviewsCount = 0;
      if (allReviewsCount < 10) {
        loadReviewsCount = allReviewsCount * 3 - 1;
      } else {
        loadReviewsCount = 29;
      }

      if (targetDiv.children.length >= loadReviewsCount) {
        clearInterval(waitReviewsDivShow);

        starMean = parseFloat(
          document.getElementsByClassName("jANrlb")[0].children[0].innerHTML
        );
        allReviewsCount = parseInt(
          document
            .getElementsByClassName("jANrlb")[0]
            .children[3].innerHTML.slice(0, -4)
            .replace(/,/g, "")
        );

        if (newsReviewsAPI != "") {
          getAllNewsReviews();
          console.log(
            "starMean: " + starMean + ", allReviewsCount: " + allReviewsCount
          );
        }

        getReviewsArr(targetDiv);
      }
    } else if (
      document.getElementsByClassName("section-scrollbox")[0] &&
      document.getElementsByClassName("section-scrollbox")[0].children.length >
        10
    ) {
      clearInterval(waitReviewsDivShow);
      console.log("這是飯店");
    }
  }, 500);
}

// 取得最新的評論時間
function getAllNewsReviews() {
  let APIReturnCount = 0;
  let time = [];

  let reviewsDecimal = 0;
  if (allReviewsCount > 2000) {
    console.log("太多評論了！");
    reviewsDecimal = 200;
  } else if (allReviewsCount % 10 > 0) {
    reviewsDecimal = parseInt(allReviewsCount / 10) + 1;
  } else {
    reviewsDecimal = parseInt(allReviewsCount / 10);
  }

  for (i = 0; i < reviewsDecimal; i++) {
    const otherNewsReviewsAPI =
      newsReviewsAPI.substring(0, newsReviewsAPI.indexOf("!2m2!") + 7) +
      (i * 10).toString() +
      newsReviewsAPI.substring(
        newsReviewsAPI.indexOf("!2m2!") + 8,
        newsReviewsAPI.length
      );

    // console.log(otherNewsReviewsAPI); // 後續載入的API

    fetch(otherNewsReviewsAPI)
      .then(function (response) {
        chrome.runtime.sendMessage({ type: "getReviewsAPI" });
        return response.text();
      })
      .then(function (requests_result) {
        const pretext = ")]}'";
        const text = requests_result.replace(pretext, "");
        const soup = JSON.parse(text);

        if (soup[2]) {
          for (j = 0; j < soup[2].length; j++) {
            time.push(soup[2][j][1]);
          }
        }

        if (APIReturnCount == reviewsDecimal - 1) {
          APIReturnCount = 0;
          newsReviewsAPI = "";

          console.log(time);
        } else {
          APIReturnCount++;
        }
      })
      .catch((rejected) => {
        console.log(rejected);
        time = [];

        getAllNewsReviews();
      });
  }
}

// ---------------------------------------------------------------------------------畫面顯示

// 取得評論內容
function getReviewsArr(targetDiv) {
  reviewsArr = [];

  fetch(reviewsAPI)
    .then(function (response) {
      chrome.runtime.sendMessage({ type: "getReviewsAPI" });
      return response.text();
    })
    .then(function (requests_result) {
      // console.log("reviewsAPI: " + reviewsAPI);
      const pretext = ")]}'";
      const text = requests_result.replace(pretext, "");
      const soup = JSON.parse(text);

      if (soup[2]) {
        for (j = 0; j < soup[2].length; j++) {
          reviewsArr.push(dataProcessing(soup[2][j]));

          if (reviewsArr.length == soup[2].length) {
            console.log(reviewsArr);
            modelPredict(targetDiv);
          }
        }
      }
    })
    .catch((rejected) => {
      console.log(rejected);
      reviewsArr = [];

      getReviewsArr(targetDiv);
    });
}

// 目前評論資料特徵處理
function dataProcessing(soupArr) {
  if (soupArr[1].indexOf("年") < 0) {
    let content_length = 0;
    let photos_count = 0;
    let content = "";
    let reply = false;
    let reviewer_rank = 0;

    const star_gap = Math.abs(parseInt(soupArr[4]) * 10 - starMean * 10) / 10;
    const date = soupArr[1];
    const like_count = soupArr[16];
    // const reviewer_count = soupArr[12][1][1]

    if (soupArr[3]) {
      if (
        soupArr[3].indexOf("(由 Google 提供翻譯)") == 0 &&
        soupArr[3].indexOf("(原始評論)") > 0
      ) {
        content_length = soupArr[3].length;
        content = soupArr[3].substring(
          16,
          soupArr[3].indexOf("(原始評論)") - 2
        );
      } else {
        content = soupArr[3];
      }

      content_length = content.length;
    }
    if (Array.isArray(soupArr[14])) {
      photos_count = soupArr[14].length;
    }
    if (soupArr[9]) {
      reply = true;
    }
    if (soupArr[12][1][0]) {
      reviewer_rank = soupArr[12][1][0][0];
    }

    return [
      content_length,
      photos_count,
      `"${content}"`,
      star_gap,
      date,
      like_count,
      reply,
      reviewer_rank,
    ];
  } else {
    return [];
  }
}

// 回傳模型預測可靠度
function modelPredict(targetDiv) {
  reliabilityArr = [];
  for (i = 0; i < reviewsArr.length; i++) {
    if (reviewsArr[i].length == 0) {
      reliabilityArr.push([i, -1]);

      if (reliabilityArr.length == reviewsArr.length) {
        console.log(reliabilityArr);
        showReliability(targetDiv);
      }
    } else {
      // model測試--------------------------------------
      const url = "https://thesis-model-backend.herokuapp.com/predict";
      const data = {
        index: i,
        content_length: reviewsArr[i][0],
        photos_count: reviewsArr[i][1],
        star_gap: reviewsArr[i][3],
        like_count: reviewsArr[i][5],
        reply: reviewsArr[i][6],
        reviewer_rank: reviewsArr[i][7],
      };

      // console.log(data);
      fetch(url, {
        method: "POST", // or 'PUT'
        body: JSON.stringify(data), // data can be `string` or {object}!
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      })
        .then((res) => res.json())
        .catch((error) => console.error("Error:", error))
        .then((response) => {
          // console.log("Success:", response);
          reliabilityArr.push([
            parseInt(response.index),
            parseInt(response.predict),
          ]);

          if (reliabilityArr.length == reviewsArr.length) {
            console.log(reliabilityArr);
            showReliability(targetDiv);
          }
        });
      // model測試--------------------------------------
    }
  }
}

// 顯示可靠度標籤
function showReliability(targetDiv) {
  let oldReviewsCount = 0;
  if (((targetDiv.children.length + 1) / 3) % 10 > 0) {
    oldReviewsCount = parseInt((targetDiv.children.length + 1) / 30) * 10;
  } else {
    oldReviewsCount = (targetDiv.children.length + 1) / 3 - 10;
  }
  currentReviewsCount = (targetDiv.children.length + 1) / 3;

  console.log("oldReviewsCount: " + oldReviewsCount);
  console.log("currentReviewsCount: " + currentReviewsCount);

  if (Number.isInteger(currentReviewsCount)) {
    for (
      reviewIndex = oldReviewsCount;
      reviewIndex < currentReviewsCount;
      reviewIndex++
    ) {
      const targetReview = targetDiv.children[reviewIndex * 3];

      if (targetReview && targetReview.getAttribute("aria-label")) {
        const reviewDiv =
          targetReview.children[0].children[2].children[3].children[0];

        // console.log(reviewDiv);

        // const reviewStar = reviewDiv.children[1].getAttribute("aria-label");
        // console.log(reviewStar);

        let color = "#ffcc00";
        let reliability = "中立";

        for (
          predictElement = 0;
          predictElement < reliabilityArr.length;
          predictElement++
        ) {
          if (
            reliabilityArr[predictElement][0] ==
            reviewIndex - oldReviewsCount
          ) {
            // console.log(reliabilityArr[predictElement]);
            switch (reliabilityArr[predictElement][1]) {
              case -1:
                color = "#ff3a30";
                reliability = "一年前的資料";
                break;
              case 1:
                color = "#ff9500";
                reliability = "不可靠";
                break;
              case 2:
                color = "#00c7be";
                reliability = "可靠";
                break;
              // case 5:
              //   color = "#34c759";
              //   reliability = "非常可靠";
              //   break;
              default:
                break;
            }

            let innerDiv = document.createElement("div");
            innerDiv.className = "add-div";
            innerDiv.textContent = reliability;

            innerDiv.style.fontSize = "12px";
            innerDiv.style.color = "#ffffff";
            innerDiv.style.backgroundColor = color;
            innerDiv.style.margin = "1px 8px";
            innerDiv.style.padding = "2px 8px";
            innerDiv.style.borderRadius = "20px";

            reviewDiv.appendChild(innerDiv);
            predictElement = reliabilityArr.length;

            if (reviewIndex == currentReviewsCount.length - 1) {
              reliabilityArr = [];
            }
          }
        }
      } else {
        reviewIndex = currentReviewsCount.length;
        reliabilityArr = [];
        setTimeout(showReliability(targetDiv), 500);
      }
    }
  } else {
    setTimeout(showReliability(targetDiv), 500);
  }
}
