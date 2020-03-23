async function fetchProductsAndSubscribe() {
  try {
    let response = await fetch("https://api.pro.coinbase.com/products");
    let data = await response.json();
    let product_ids = data.map(item => item.id);

    let obj = {};

    for (const product_id of product_ids) {
      obj[product_id] = { best_bid: 0, best_ask: 0, spread: 0 };
    }

    app.products = obj;

    startWebSocketConnection(product_ids);
  } catch (e) {
    console.log(e);
  }
}

// ############################ SOCKET CONNECTION #####################################

let socket;
let isSocketConnected = false;
let subscribed = false;

function startWebSocketConnection(product_ids) {
  socket = new WebSocket("wss://ws-feed.pro.coinbase.com");

  let subscribeMsg = {
    type: "subscribe",
    channels: [
      {
        name: "ticker",
        product_ids
      }
    ]
  };

  socket.addEventListener("open", event => {
    isSocketConnected = true;
    socket.send(JSON.stringify(subscribeMsg));
    subscribed = true;
    updateConnectionStatus("connected");
  });

  socket.addEventListener("message", event => {
    let data = JSON.parse(event.data);

    if (data.type == "ticker") {
      updateData(data);
    }
  });

  socket.addEventListener("close", event => {
    updateConnectionStatus("disconnected");
    isSocketConnected = false;
    subscribed = false;
    console.log("Websocket disconnected @ " + new Date().toLocaleString());

    if (document.visibilityState === "visible") {
      console.log("Abrupt disconnection occured!! Reconnecting Websocket..");
      startWebSocketConnection();
    }
  });
}

//######################### End Socket Connection #############################

document.addEventListener("visibilitychange", function() {
  if (document.visibilityState === "visible" && !isSocketConnected) {
    console.log("Reconnecting Websocket... @ " + new Date().toLocaleString());
    startWebSocketConnection();
  } else if (document.visibilityState === "visible" && !subscribed) {
    subscribe(app.product_ids, ["ticker"]);
    subscribed = true;
    console.log(`subscribed`);
  } else if (document.visibilityState !== "visible" && subscribed) {
    unsubscribe(app.product_ids, ["ticker"]);
    subscribed = false;
    console.log(`UNsubscribed`);
  }
});

function subscribe(product_ids, channels) {
  let subscribeMsg = {
    type: "subscribe",
    product_ids,
    channels
  };

  socket.send(JSON.stringify(subscribeMsg));
}

function unsubscribe(product_ids, channels) {
  let subscribeMsg = {
    type: "unsubscribe",
    product_ids,
    channels
  };

  socket.send(JSON.stringify(subscribeMsg));
}

function updateData(data) {
  let best_bid = parseFloat(data.best_bid);
  let best_ask = parseFloat(data.best_ask);
  let spread = (((best_ask - best_bid) / best_bid) * 100).toFixed(2);

  app.products[data.product_id].best_bid = best_bid;
  app.products[data.product_id].best_ask = best_ask;
  app.products[data.product_id].spread = spread;
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

fetchProductsAndSubscribe();
