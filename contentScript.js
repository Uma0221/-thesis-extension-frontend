let errorFlag = false; // 判斷fetch時有沒有錯誤

let currentReviewsFirstIndex = -1; // 目前回傳reviewsAPI的開始index
let reviewsAPIsArr = []; // 等待預測可靠度的reviewsAPI
let oldStoreName = ""; // 舊的商家名稱
let newsReviewsAPI = ""; // 最新排序的reviewsAPI
let oldLoadReviewsCount = 0; // 上次載入的頁面總評論數
let newLoadReviewsCount = 0; // 目前載入的頁面總評論數
let callReviewsLabelShowFlag = false; // 判斷取得評論可靠度後，有沒有再次要求初始化label顯示

let targetDiv = undefined; // 所有評論的parent
let color = "#c7c7cc"; // 初始的可靠度label顏色
let reliability = "評估中..."; // 初始的可靠度label文字

let starMean = 0; // 商家平均評分
let allReviewsCount = 0; // 商家總評論數
let monthRateArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 商家一年內各月份評論比重

let reviewsAPI = ""; // 預測可靠度的reviewsAPI
let reviewsFirstIndex = -1; // 預測可靠度的reviewsAPI的開始index
let featuresArr = []; // 評論特徵內容
let reliabilityArr = []; // 評論可靠度
// -------------------------------------------------------------
let waitTargetDiv; // 等待targetDiv顯示
let waitAddReviewsLabel; // 等待初始化label顯示
let waitMonthRateArr; // 等待取得一年內各月份評論比重

// 監聽background回傳
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // 取得目前回傳reviewsAPI的開始index
  currentReviewsFirstIndex = parseInt(
    message.reviewsAPI.substring(
      message.reviewsAPI.indexOf("!2m2!") +
        message.reviewsAPI
          .slice(message.reviewsAPI.indexOf("!2m2!") + 4)
          .indexOf("!") +
        7,
      message.reviewsAPI.indexOf("!2m2!") +
        message.reviewsAPI
          .slice(message.reviewsAPI.indexOf("!2m2!") + 5)
          .indexOf("!") +
        5
    )
  );

  // 若目前回傳reviewsAPI的開始index為0，代表targetDiv內容刷新
  if (currentReviewsFirstIndex == 0) {
    // 清空預測可靠度的reviewsAPI，加入目前回傳reviewsAPI
    reviewsAPIsArr = [];
    reviewsAPIsArr.push(message.reviewsAPI);
    sendResponse({ farewell: "goodbye" });

    // 取消所有等待
    clearTimeout(waitTargetDiv);
    clearTimeout(waitAddReviewsLabel);
    clearTimeout(waitMonthRateArr);

    // 取得目前網頁URL的前段
    let currentURLFront;
    if (window.location.href.startsWith("https://www.google.com/maps/place")) {
      currentURLFront = window.location.href.slice(34);
    } else {
      currentURLFront = window.location.href.slice(37);
    }
    // 取得目前的商家名稱
    const storeName = currentURLFront.slice(0, currentURLFront.indexOf("/"));

    // console.log("oldStoreName: " + oldStoreName);
    // console.log("storeName: " + storeName);
    // 若舊的商家名稱與目前的商家名稱不同，代表目前的商家為新商家
    if (oldStoreName != storeName) {
      // 將新的商家名稱存成舊的商家名稱
      oldStoreName = storeName;

      // 取得新商家最新排序的reviewsAPI
      newsReviewsAPI =
        reviewsAPIsArr[0].substring(
          0,
          reviewsAPIsArr[0].indexOf("!2m2!") +
            reviewsAPIsArr[0]
              .slice(reviewsAPIsArr[0].indexOf("!2m2!") + 4)
              .indexOf("!") +
            16
        ) +
        "2" +
        reviewsAPIsArr[0].substring(
          reviewsAPIsArr[0].indexOf("!2m2!") +
            reviewsAPIsArr[0]
              .slice(reviewsAPIsArr[0].indexOf("!2m2!") + 5)
              .indexOf("!") +
            14,
          reviewsAPIsArr[0].length
        );
      // console.log("newsReviewsAPI: " + newsReviewsAPI);
    }

    // 將上次載入及目前載入的頁面總評論數初始化
    oldLoadReviewsCount = 0;
    newLoadReviewsCount = 0;
    // 取消要求初始化label顯示
    callReviewsLabelShowFlag = false;
  } else {
    // 加入目前回傳reviewsAPI到等待預測可靠度Arr
    reviewsAPIsArr.push(message.reviewsAPI);
    sendResponse({ farewell: "goodbye" });
  }

  console.log(reviewsAPIsArr);

  // 取得targetDiv
  targetDivShow();

  // 若現在沒有其他reviewsAPI的可靠度 且 等待的reviewsAPI為目前回傳reviewsAPI
  if (!callReviewsLabelShowFlag && reviewsAPIsArr.length == 1) {
    // 取得等待預測可靠度的評論
    getallReviewsArr();
  }
});

// ---------------------------------------------------------------------------------label顯示

// 取得targetDiv
function targetDivShow() {
  // 取消等待targetDiv顯示
  clearTimeout(waitTargetDiv);
  // 初始化-------------------------------
  targetDiv = undefined;
  color = "#c7c7cc";
  reliability = "評估中...";
  // 初始化-------------------------------

  if (
    // 確認標題為"所有評論"
    document.getElementsByClassName("iD2gKb")[0] &&
    document.getElementsByClassName("iD2gKb")[0].innerHTML == "所有評論" &&
    // 確認有卷軸
    document.getElementsByClassName("DxyBCb")[0] &&
    document.getElementsByClassName("DxyBCb")[0].children.length > 1 &&
    document.getElementsByClassName("DxyBCb")[0].children.length <= 10 &&
    // 確認有商家評分資訊
    document.getElementsByClassName("jANrlb")[0] &&
    document.getElementsByClassName("jANrlb")[0].children.length == 4
  ) {
    // 取得所有評論的parent
    targetDiv =
      document.getElementsByClassName("DxyBCb")[0].children[
        document.getElementsByClassName("DxyBCb")[0].children.length - 2
      ];

    // 若targetDiv的children有data-review-id的attribute，代表評論已生成
    if (
      targetDiv.children.length > 1 &&
      targetDiv.children[0].getAttribute("data-review-id")
    ) {
      // 評論加入初始化的label
      addReviewsLabel();

      // 若有最新排序的reviewsAPI，代表還沒取得此商家一年內各月份評論比重
      if (newsReviewsAPI != "") {
        // 取得商家一年內各月份評論比重
        getMonthRate();
      }
    } else {
      waitTargetDiv = setTimeout(targetDivShow, 500);
    }
  } else if (
    // 跟targetDiv同階層的div數量太多，代表是飯店評論
    document.getElementsByClassName("DxyBCb")[0] &&
    document.getElementsByClassName("DxyBCb")[0].children.length > 1 &&
    document.getElementsByClassName("DxyBCb")[0].children.length > 10
  ) {
    // 初始化最新排序的reviewsAPI
    newsReviewsAPI = "";
    console.log("這是飯店");
  } else {
    waitTargetDiv = setTimeout(targetDivShow, 500);
  }
}

// 評論加入初始化的label
function addReviewsLabel() {
  // 取消等待初始化label顯示
  clearTimeout(waitAddReviewsLabel);

  // 若目前載入的頁面總評論數是整數 且 上次載入的頁面總評論數比目前載入的頁面總評論數小
  if (
    targetDiv.children &&
    Number.isInteger((targetDiv.children.length + 1) / 3) &&
    oldLoadReviewsCount < (targetDiv.children.length + 1) / 3
  ) {
    // 取得目前載入的頁面總評論數
    newLoadReviewsCount = (targetDiv.children.length + 1) / 3;

    // 若上次載入的頁面總評論數不到10筆，代表是評論尾端
    if (oldLoadReviewsCount % 10 > 0) {
      // 初始化上次載入的頁面總評論數
      oldLoadReviewsCount = 0;
    }

    console.log("oldLoadReviewsCount: " + oldLoadReviewsCount);
    console.log("newLoadReviewsCount: " + newLoadReviewsCount);

    // 此次載入的評論加入初始化的label
    for (
      reviewIndex = oldLoadReviewsCount;
      reviewIndex < newLoadReviewsCount;
      reviewIndex++
    ) {
      // 評論div的index為3的倍數
      const reviewDiv = targetDiv.children[reviewIndex * 3];

      // 若評論div存在 且 含有aria-label的attribute，代表評論div已生成
      if (reviewDiv && reviewDiv.getAttribute("aria-label")) {
        // 取得要加入label的div
        const labelParentDiv =
          reviewDiv.children[0].children[2].children[3].children[0];

        // label初始化設定
        let labelDiv = document.createElement("div");
        labelDiv.id = "add-div-" + reviewIndex.toString();
        labelDiv.className = "add-div";
        labelDiv.textContent = reliability;

        labelDiv.style.fontSize = "12px";
        labelDiv.style.color = "#ffffff";
        labelDiv.style.backgroundColor = color;
        labelDiv.style.margin = "1px 8px";
        labelDiv.style.padding = "2px 8px";
        labelDiv.style.borderRadius = "20px";

        // 若有舊的label，移除舊的label
        if (document.getElementById("add-div-" + reviewIndex.toString())) {
          document.getElementById("add-div-" + reviewIndex.toString()).remove();
          console.log("removeDiv");
        }
        // 加入初始化的label
        labelParentDiv.appendChild(labelDiv);
      } else {
        // 跳脫迴圈
        reviewIndex = newLoadReviewsCount;
        waitAddReviewsLabel = setTimeout(addReviewsLabel, 500);
      }

      // 若迴圈跑完 且 此次載入的評論都加入初始化的label
      if (
        reviewIndex == newLoadReviewsCount - 1 &&
        document.getElementById("add-div-" + reviewIndex.toString())
      ) {
        // 將目前載入的頁面總評論數存成上次載入的頁面總評論數
        oldLoadReviewsCount = newLoadReviewsCount;

        // 若已取得評論可靠度且正在等待，執行可靠度label顯示
        if (callReviewsLabelShowFlag) {
          addReliability();
        }
      }
    }
  } else {
    waitAddReviewsLabel = setTimeout(addReviewsLabel, 500);
  }
}

// ---------------------------------------------------------------------------------取得近一年的時間密度

// 取得一年內各月份評論比重
function getMonthRate() {
  // 初始化-------------------------------
  starMean = 0;
  allReviewsCount = 0;
  monthRateArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  // 初始化-------------------------------

  let reviewsDecimal = 0; // 商家總評論10個1數
  let APIReturnCount = 0; // 回傳的API數量
  let inOneYearCount = 0; // 一年內的評論數

  // 取得商家平均評分
  starMean = parseFloat(
    document.getElementsByClassName("jANrlb")[0].children[0].innerHTML
  );
  // 商家總評論數
  allReviewsCount = parseInt(
    document
      .getElementsByClassName("jANrlb")[0]
      .children[3].innerHTML.slice(0, -4)
      .replace(/,/g, "")
  );
  console.log(
    "starMean: " + starMean + ", allReviewsCount: " + allReviewsCount
  );

  // 若商家總評論數大於2000時，僅取前2000筆
  if (allReviewsCount > 2000) {
    console.log("太多評論了！");
    reviewsDecimal = 200;
    // 商家總評論數10個1數有餘數，則將商家總評論數10個1數加1
  } else if (allReviewsCount % 10 > 0) {
    reviewsDecimal = parseInt(allReviewsCount / 10) + 1;
  } else {
    reviewsDecimal = parseInt(allReviewsCount / 10);
  }

  // 每秒印newsgeting...，代表還沒取完所有最新評論
  console.log("newsgeting...");
  const newsgeting = setInterval(() => console.log("newsgeting..."), 1000);

  for (i = 0; i < reviewsDecimal; i++) {
    // 依序取得最新排序的reviewsAPI
    const otherNewsReviewsAPI =
      newsReviewsAPI.substring(
        0,
        newsReviewsAPI.indexOf("!2m2!") +
          newsReviewsAPI
            .slice(newsReviewsAPI.indexOf("!2m2!") + 4)
            .indexOf("!") +
          7
      ) +
      (i * 10).toString() +
      newsReviewsAPI.substring(
        newsReviewsAPI.indexOf("!2m2!") +
          newsReviewsAPI
            .slice(newsReviewsAPI.indexOf("!2m2!") + 5)
            .indexOf("!") +
          5,
        newsReviewsAPI.length
      );

    // console.log("otherNewsReviewsAPI: " + otherNewsReviewsAPI);

    // 依序取得最新排序的評論
    fetch(otherNewsReviewsAPI + "&extension")
      .then(function (response) {
        return response.text();
      })
      // 取得錯誤時，取消每秒印newsgeting...
      .catch((error) => {
        clearInterval(newsgeting);
        errorFlag = true;

        console.log("newsget error");
        console.error("error: " + error);

        // 初始化
        starMean = 0;
        allReviewsCount = 0;
        monthRateArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      })
      .then(function (requests_result) {
        // 確認fetch沒錯
        if (!errorFlag) {
          // 清理回傳資料，並轉成json格式
          const pretext = ")]}'";
          const text = requests_result.replace(pretext, "");
          const soup = JSON.parse(text);

          // 取得所有評論
          if (soup[2]) {
            for (j = 0; j < soup[2].length; j++) {
              // 若該評論時間沒有年，表示為1年內的評論
              if (soup[2][j][1].indexOf("年") < 0) {
                inOneYearCount++;
                // 若該評論時間沒有月，表示為1個月內的評論
                if (soup[2][j][1].indexOf("月") < 0) {
                  monthRateArr[0]++;
                } else {
                  // 取得該評論時間的月份，並加到monthRateArr該月份中
                  monthRateArr[parseInt(soup[2][j][1].slice(0, -4))]++;
                }
              }
            }
          }

          // 若回傳的API數量等於商家總評論數10個1數減1，代表的迴圈跑完，取消每秒印newsgeting...
          if (APIReturnCount == reviewsDecimal - 1) {
            clearInterval(newsgeting);
            console.log("newsget complete");

            // 初始化最新排序的reviewsAPI
            newsReviewsAPI = "";

            // 將每月的評論數除以總數，算出一年內各月份評論比重
            for (i = 0; i < monthRateArr.length; i++) {
              monthRateArr[i] = (monthRateArr[i] / inOneYearCount).toFixed(2);
            }
            console.log(monthRateArr);
          } else {
            // 回傳的API數量加1
            APIReturnCount++;
          }
        }
      });
  }
}

// ---------------------------------------------------------------------------------predict顯示

// 取得等待預測可靠度的評論
function getallReviewsArr() {
  // 初始化-------------------------------
  reviewsFirstIndex = -1;
  reviewsAPI = "";
  featuresArr = [];
  reliabilityArr = [];
  // 初始化-------------------------------

  // 取得等待預測可靠度的reviewsAPI
  reviewsAPI = reviewsAPIsArr[0];
  // 取得預測可靠度reviewsAPI的開始index
  reviewsFirstIndex = parseInt(
    reviewsAPI.substring(
      reviewsAPI.indexOf("!2m2!") +
        reviewsAPI.slice(reviewsAPI.indexOf("!2m2!") + 4).indexOf("!") +
        7,
      reviewsAPI.indexOf("!2m2!") +
        reviewsAPI.slice(reviewsAPI.indexOf("!2m2!") + 5).indexOf("!") +
        5
    )
  );

  console.log("reviewsAPI: " + reviewsAPI);
  console.log("reviewsFirstIndex: " + reviewsFirstIndex);
  console.log(reviewsAPIsArr);

  // 若目前回傳reviewsAPI的開始index為0 且 預測可靠度reviewsAPI的開始index不為0，代表targetDiv刷新，不用處理舊資料
  if (
    !(
      currentReviewsFirstIndex == 0 &&
      currentReviewsFirstIndex != reviewsFirstIndex
    )
  ) {
    // 每秒印currentgeting...，代表還沒取得預測可靠度的評論
    console.log("currentgeting...");
    const currentgeting = setInterval(
      () => console.log("currentgeting..."),
      1000
    );

    // 取得預測可靠度的評論
    fetch(reviewsAPI + "&extension")
      .then(function (response) {
        return response.text();
      })
      // 取得錯誤時，取消每秒印currentgeting...
      .catch((error) => {
        clearInterval(currentgeting);
        errorFlag = true;
        // 可靠度labels顯示
        addReliability();

        console.log("currentget error");
        console.error("error: " + error);

        // 初始化
        reviewsFirstIndex = -1;
        reviewsAPI = "";
        featuresArr = [];
        reliabilityArr = [];
      })
      .then(function (requests_result) {
        // 取消每秒印currentgeting...
        clearInterval(currentgeting);
        console.log("currentget complete");

        // 若目前回傳reviewsAPI的開始index為0 且 預測可靠度reviewsAPI的開始index不為0，代表targetDiv刷新，不用處理舊資料
        if (
          !(
            currentReviewsFirstIndex == 0 &&
            currentReviewsFirstIndex != reviewsFirstIndex
          )
        ) {
          // 清理回傳資料，並轉成json格式
          const pretext = ")]}'";
          const text = requests_result.replace(pretext, "");
          const soup = JSON.parse(text);

          // 取得預測可靠度的評論特徵內容
          if (soup[2]) {
            getFeaturesArr(soup[2]);
          }
        }
      });
  }
}

// 取得預測可靠度的評論特徵內容
function getFeaturesArr(allReviewsArr) {
  // 取消等待取得一年內各月份評論比重
  clearTimeout(waitMonthRateArr);

  // 若目前回傳reviewsAPI的開始index為0 且 預測可靠度reviewsAPI的開始index不為0，代表targetDiv刷新，不用處理舊資料
  if (
    !(
      currentReviewsFirstIndex == 0 &&
      currentReviewsFirstIndex != reviewsFirstIndex
    )
  ) {
    // 取得錯誤時，可靠度labels顯示
    if (errorFlag) {
      addReliability();
    }
    // 若monthRateArr[0]為字串，代表已取得一年內各月份評論比重
    else if (typeof monthRateArr[0] == "string") {
      for (j = 0; j < allReviewsArr.length; j++) {
        // 將處理過的評論特徵內容加入featuresArr
        featuresArr.push(featuresProcessing(allReviewsArr[j]));

        // 若featuresArr長度與預測可靠度的評論長度相同，代表迴圈跑完
        if (featuresArr.length == allReviewsArr.length) {
          // 預測評論內容情緒
          getContentSentiment();
          console.log(featuresArr);
        }
      }
    } else {
      waitMonthRateArr = setTimeout(getFeaturesArr, 500, allReviewsArr);
    }
  }
}

// 預測可靠度的評論資料特徵處理
function featuresProcessing(reviewsArr) {
  // 若目前回傳reviewsAPI的開始index為0 且 預測可靠度reviewsAPI的開始index不為0，代表targetDiv刷新，不用處理舊資料
  if (
    !(
      currentReviewsFirstIndex == 0 &&
      currentReviewsFirstIndex != reviewsFirstIndex
    )
  ) {
    // 若該評論時間沒有年，表示為1年內的評論
    if (reviewsArr[1].indexOf("年") < 0) {
      // 初始化特徵-------------------------------
      let content = "";
      let content_length = 0;
      let photos_count = 0;
      let month = 0;
      let month_rate = 0;
      let reply = false;
      let reviewer_rank = 0;

      const content_positive = 0;
      const content_negative = 0;
      const star = parseInt(reviewsArr[4]);
      // 評分間距為評論評分與平均評分的標準差
      const star_gap =
        Math.abs(parseInt(reviewsArr[4]) * 10 - starMean * 10) / 10;
      const like_count = reviewsArr[16];
      // const reviewer_count = reviewsArr[12][1][1]
      // 初始化特徵-------------------------------

      if (reviewsArr[3]) {
        // 若有google翻譯，只取翻譯文字內容
        if (
          reviewsArr[3].indexOf("(由 Google 提供翻譯)") == 0 &&
          reviewsArr[3].indexOf("(原始評論)") > 0
        ) {
          content_length = reviewsArr[3].length;
          content = reviewsArr[3].substring(
            16,
            reviewsArr[3].indexOf("(原始評論)") - 2
          );
        } else {
          content = reviewsArr[3];
        }
        // 取得評論文字長度
        content_length = content.length;
      }
      // 取得評論照片數量
      if (Array.isArray(reviewsArr[14])) {
        photos_count = reviewsArr[14].length;
      }
      // 若該評論時間沒有月，表示為1個月內的評論，取得當月比重
      if (reviewsArr[1].indexOf("月") < 0) {
        month = 0;
        month_rate = parseFloat(monthRateArr[0]);
      } else {
        month = parseInt(reviewsArr[1].slice(0, -4));
        month_rate = parseFloat(
          monthRateArr[parseInt(reviewsArr[1].slice(0, -4))]
        );
      }
      // 確認是否有商家回復
      if (reviewsArr[9]) {
        reply = true;
      }
      // 取得評論者在地嚮導等級
      if (reviewsArr[12][1][0]) {
        reviewer_rank = reviewsArr[12][1][0][0];
      }

      // 回傳評論特徵資料
      return [
        content_length,
        photos_count,
        `"${content}"`,
        content_positive,
        content_negative,
        star,
        star_gap,
        month,
        month_rate,
        like_count,
        reply,
        reviewer_rank,
      ];
    } else {
      // 若評論為一年以上，回傳空陣列
      return [];
    }
  } else {
    return null;
  }
}

// 取得評論內容情緒特徵
function getContentSentiment() {
  if (
    !(
      currentReviewsFirstIndex == 0 &&
      currentReviewsFirstIndex != reviewsFirstIndex
    )
  ) {
    let sendAzureArr = [];
    const azureUrl =
      "https://thesis-sentiment-analysis-2.cognitiveservices.azure.com/text/analytics/v3.0/sentiment";
    let data = {};
    let idCount = 1;

    // 處理傳給Azure的資料格式
    for (i = 0; i < featuresArr.length; i++) {
      // 若評論不為空陣列，表示評論為1年內；若評論文字長度大於0，表示有評論內容
      if (featuresArr[i].length > 0 && featuresArr[i][0] > 0) {
        data = {
          language: "zh-hant",
          id: idCount.toString(),
          text: featuresArr[i][2],
        };
        // 評論內容情緒改為id編號
        featuresArr[i][3] = idCount;
        featuresArr[i][4] = idCount;
        idCount++;

        // 儲存格式化後的評論內容
        sendAzureArr.push(data);
      }
    }
    // console.log(sendAzureArr); //傳給Azure的資料

    // 每秒印azureing...，代表還沒取得評論內容情緒回傳結果
    console.log("azureing...");
    const azureing = setInterval(() => console.log("azureing..."), 1000);

    if (sendAzureArr.length > 0) {
      // header設定為json格式傳遞
      fetch(azureUrl, {
        method: "POST", // or 'PUT'
        body: JSON.stringify({ documents: sendAzureArr }), // data can be `string` or {object}!
        headers: new Headers({
          "Content-Type": "application/json",
          "Ocp-apim-subscription-key": "85dce20ab946498cb5dd09a5ce6553ef",
        }),
      })
        .then((res) => res.json())
        // 取得錯誤時，取消每秒印azureing...
        .catch((error) => {
          clearInterval(azureing);
          errorFlag = true;
          // 可靠度labels顯示
          addReliability();

          console.log("azure error");
          console.error("Error:", error);
        })
        .then((response) => {
          clearInterval(azureing);
          // 若目前回傳reviewsAPI的開始index為0 且 預測可靠度reviewsAPI的開始index不為0，代表targetDiv刷新，不用處理舊資料
          if (
            !(
              currentReviewsFirstIndex == 0 &&
              currentReviewsFirstIndex != reviewsFirstIndex
            )
          ) {
            console.log("azure complete");
            // 取得評論內容情緒
            console.log(response);

            for (j = 0; j < featuresArr.length; j++) {
              if (featuresArr[j].length > 0 && featuresArr[j][3] > 0) {
                featuresArr[j][3] =
                  response.documents[
                    featuresArr[j][3] - 1
                  ].confidenceScores.positive;

                featuresArr[j][4] =
                  response.documents[
                    featuresArr[j][4] - 1
                  ].confidenceScores.negative;
              }
            }
            console.log(featuresArr);
            // 模型預測可靠度
            modelPredict();
          }
        });
    } else {
      clearInterval(azureing);
      console.log("azure complete");
      console.log(featuresArr);
      // 模型預測可靠度
      modelPredict();
    }
  }
}

// 模型預測可靠度
function modelPredict() {
  // 若目前回傳reviewsAPI的開始index為0 且 預測可靠度reviewsAPI的開始index不為0，代表targetDiv刷新，不用處理舊資料
  if (
    !(
      currentReviewsFirstIndex == 0 &&
      currentReviewsFirstIndex != reviewsFirstIndex
    )
  ) {
    let sendModelArr = [];
    const url = "https://thesis-model-backend.herokuapp.com/predict";
    let data = {};

    // 處理傳給Model的資料格式
    for (i = 0; i < featuresArr.length; i++) {
      // 若評論為空陣列，表示評論為1年以上
      if (featuresArr[i].length == 0) {
        data = {
          // index設為預測可靠度的評論index
          index: reviewsFirstIndex + i,
        };
      } else {
        data = {
          index: reviewsFirstIndex + i,
          content_length: featuresArr[i][0],
          photos_count: featuresArr[i][1],
          content_positive: featuresArr[i][3],
          content_negative: featuresArr[i][4],
          star: featuresArr[i][5],
          month: featuresArr[i][7],
          month_rate: featuresArr[i][8],
          like_count: featuresArr[i][9],
          reviewer_rank: featuresArr[i][11],
        };
      }

      // 儲存資料格式化後的預測可靠度的評論特徵內容
      sendModelArr.push(data);
    }
    // console.log("sendModelArr: "+sendModelArr); //傳給模型的資料

    // 每秒印predicting...，代表還沒取得評論可靠度回傳結果
    console.log("predicting...");
    const predicting = setInterval(() => console.log("predicting..."), 1000);

    // header設定為json格式傳遞
    fetch(url, {
      method: "POST", // or 'PUT'
      body: JSON.stringify(sendModelArr), // data can be `string` or {object}!
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    })
      .then((res) => res.json())
      // 取得錯誤時，取消每秒印predicting...
      .catch((error) => {
        clearInterval(predicting);
        errorFlag = true;
        // 可靠度labels顯示
        addReliability();

        console.log("predict error");
        console.error("Error:", error);
      })
      .then((response) => {
        clearInterval(predicting);
        // 若目前回傳reviewsAPI的開始index為0 且 預測可靠度reviewsAPI的開始index不為0，代表targetDiv刷新，不用處理舊資料
        if (
          !(
            currentReviewsFirstIndex == 0 &&
            currentReviewsFirstIndex != reviewsFirstIndex
          )
        ) {
          console.log("predict complete");
          // 取得評論可靠度
          reliabilityArr = response;
          console.log(reliabilityArr);
          // 可靠度label顯示
          addReliability();
        }
      });
  }
}

// 可靠度label顯示
function addReliability() {
  // 取消等待可靠度label顯示
  const reviewsFirstIndex2 = parseInt(reliabilityArr[0].index);
  // 若目前回傳reviewsAPI的開始index為0 且 預測可靠度reviewsAPI的開始index不為0，代表targetDiv刷新，不用處理舊資料
  // 且預測可靠度的評論都加入初始化的label
  if (
    !(
      currentReviewsFirstIndex == 0 &&
      currentReviewsFirstIndex != reviewsFirstIndex2
    )
  ) {
    // 若目前載入的頁面總評論數是整數 且 預測可靠度reviewsAPI的開始index加上評論可靠度數量小於等於目前載入的頁面總評論數
    // 代表要預測可靠度的評論已載入畫面
    if (
      Number.isInteger(newLoadReviewsCount) &&
      reviewsFirstIndex2 + reliabilityArr.length <= newLoadReviewsCount &&
      document.getElementById(
        "add-div-" + (reviewsFirstIndex2 + reliabilityArr.length - 1).toString()
      )
    ) {
      // 完成初始化label顯示
      callReviewsLabelShowFlag = false;

      // 若fetch沒錯，將預測的可靠度加入label
      if (!errorFlag) {
        for (
          reviewIndex = reviewsFirstIndex2;
          reviewIndex < reviewsFirstIndex2 + reliabilityArr.length;
          reviewIndex++
        ) {
          const labelDiv = document.getElementById(
            "add-div-" + reviewIndex.toString()
          );

          switch (
            parseInt(reliabilityArr[reviewIndex - reviewsFirstIndex2].predict)
          ) {
            case -1:
              color = "#636366";
              reliability = "一年前的資料";
              break;

            case 2:
              color = "#ffcc00";
              reliability = "不可靠";
              break;
            case 5:
              color = "#ffcc00";
              reliability = "不可靠";
              break;

            case 3:
              color = "#00c7be";
              reliability = "可靠";
              break;
            case 7:
              color = "#00c7be";
              reliability = "可靠";
              break;
            // case 5:
            //   color = "#34c759";
            //   reliability = "非常可靠";
            //   break;
            default:
              color = "#ff9500";
              reliability = "中立";
              break;
          }

          labelDiv.textContent = reliability;
          labelDiv.style.backgroundColor = color;

          if (reviewIndex == reviewsFirstIndex2 + reliabilityArr.length - 1) {
            // 將等待預測可靠度中最前面的reviewsAPI移除（也就是目前預測的reviewsAPI）
            reviewsAPIsArr.shift();

            // 若等待預測可靠度的reviewsAPI不為0
            if (reviewsAPIsArr.length > 0) {
              // 取得等待的評論
              getallReviewsArr();
            }
          }
        }
        // 若fetch有錯，將所有label設為評估失敗
      } else {
        color = "#ff3a30";
        reliability = "評估失敗";

        for (
          reviewIndex = 0;
          reviewIndex < newLoadReviewsCount;
          reviewIndex++
        ) {
          const labelDiv = document.getElementById(
            "add-div-" + reviewIndex.toString()
          );
          labelDiv.textContent = reliability;
          labelDiv.style.backgroundColor = color;
        }
      }
      // 要求初始化label顯示
    } else {
      console.log("要求初始化label顯示");
      callReviewsLabelShowFlag = true;
      // 取得targetDiv
      targetDivShow();
    }
  }
}
