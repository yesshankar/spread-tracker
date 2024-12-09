// ############################ SOCKET CONNECTION #####################################

let socket;
let isSocketConnected = false;
let subscribed = false;
let unsubscribeTimeout = null;
let aboutToUnsubscribe = false;

function startWebSocketConnection(product_ids) {
  // socket = new WebSocket("wss://ws-feed.pro.coinbase.com");
  socket = new WebSocket("wss://ws-feed.exchange.coinbase.com");

  let subscribeMsg = {
    type: "subscribe",
    channels: [
      {
        name: "ticker_batch",
        product_ids,
      },
    ],
  };

  socket.addEventListener("open", (event) => {
    isSocketConnected = true;
    socket.send(JSON.stringify(subscribeMsg));
    subscribed = true;
    updateConnectionStatus("connected");
    setTimeout(() => {
      app.ignoreNewData = true;
    }, 500);
    setTimeout(() => {
      app.ignoreNewData = false;
    }, 5000);
  });

  socket.addEventListener("message", (event) => {
    let data = JSON.parse(event.data);

    if (data.type == "ticker") {
      if (!app.ignoreNewData) {
        updateData(data);
      }
    }
  });

  socket.addEventListener("close", (event) => {
    updateConnectionStatus("disconnected");
    isSocketConnected = false;
    subscribed = false;
    console.log("Websocket disconnected @ " + new Date().toLocaleString());

    if (document.visibilityState === "visible") {
      console.log("Abrupt disconnection occured!! Reconnecting Websocket..");
      startWebSocketConnection(app.product_ids);
    }
  });
}

//######################### End Socket Connection #############################

document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible") {
    if (aboutToUnsubscribe) {
      clearTimeout(unsubscribeTimeout);
      aboutToUnsubscribe = false;
    }
  }

  if (document.visibilityState === "visible" && !isSocketConnected) {
    // console.log("Reconnecting Websocket... @ " + new Date().toLocaleString());
    startWebSocketConnection(app.product_ids);
  } else if (document.visibilityState === "visible" && !subscribed) {
    subscribe(app.product_ids, ["ticker"]);
    subscribed = true;
    // console.log(`subscribed`);
  } else if (document.visibilityState !== "visible" && subscribed) {
    unsubscribeTimeout = setTimeout(() => {
      unsubscribe(app.product_ids, ["ticker"]);
      subscribed = false;
      // console.log(`UNsubscribed`);
      aboutToUnsubscribe = false;
    }, 60000);
    aboutToUnsubscribe = true;
  }
});

function subscribe(product_ids, channels) {
  let subscribeMsg = {
    type: "subscribe",
    product_ids,
    channels,
  };

  socket.send(JSON.stringify(subscribeMsg));
}

function unsubscribe(product_ids, channels) {
  let subscribeMsg = {
    type: "unsubscribe",
    product_ids,
    channels,
  };

  socket.send(JSON.stringify(subscribeMsg));
}

function updateData(data) {
  let best_bid = parseFloat(data.best_bid);
  let best_ask = parseFloat(data.best_ask);
  let low_24h = parseFloat(data.low_24h);
  let high_24h = parseFloat(data.high_24h);
  let price = parseFloat(data.price);
  let volume_24h = parseFloat(data.volume_24h);

  low_24h = low_24h == 0 ? 0.001 : low_24h; // to avoid divide by zero condition

  let spread = (((best_ask - best_bid) / best_bid) * 100).toFixed(2);
  let volatility = (((high_24h - low_24h) / low_24h) * 100).toFixed(2);
  let midPrice = (high_24h + low_24h) / 2;
  let midRange = high_24h - midPrice;

  midRange = midRange == 0 ? 99999 : midRange;

  let tempObj = {};

  tempObj.best_bid = best_bid;
  tempObj.best_ask = best_ask;
  tempObj.spread = spread;
  tempObj.volatility = volatility;
  tempObj.polarity = (((price - midPrice) / midRange) * 100).toFixed(2);
  tempObj.quote_vol_24hr = volume_24h * price;

  app.holdedProducts[data.product_id] = Object.assign({}, app.holdedProducts[data.product_id], tempObj);
}

function updateConnectionStatus(con) {
  let div_connectionStatus = document.getElementById("connection-status");
  if (con === "connected") {
    div_connectionStatus.innerHTML = "&#9989;";
    div_connectionStatus.style.color = "green";
  } else {
    div_connectionStatus.innerHTML = "&#9940;";
    div_connectionStatus.style.color = "red";
  }
}
