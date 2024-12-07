var app = new Vue({
  el: "#app",
  data: {
    quotes: [],
    checkedQuotes: ["USD"],
    products: {},
    holdedProducts: {},
    ignoreNewData: false,
    sort_by: "spread",
    showChart: false,
  },
  computed: {
    product_ids: function () {
      let filteredProducts = Object.keys(this.products).filter((pid) => {
        let asset = pid.split("-")[1];
        return this.checkedQuotes.includes(asset);
        // return this.checkedAssets[asset];
      });

      if (this.sort_by === "spread") {
        return filteredProducts.sort((a, b) => this.products[b].spread - this.products[a].spread);
      } else if (this.sort_by === "volatility") {
        return filteredProducts.sort((a, b) => this.products[b].volatility - this.products[a].volatility);
      } else if (this.sort_by === "polarity") {
        return filteredProducts.sort((a, b) => this.products[b].polarity - this.products[a].polarity);
      } else if (this.sort_by === "quote_vol_24hr") {
        return filteredProducts.sort((a, b) => this.products[b].quote_vol_24hr - this.products[a].quote_vol_24hr);
      } else {
        return filteredProducts.sort();
      }
    },
  },
  methods: {
    changeSortBy: function (sort_by) {
      this.sort_by = sort_by;
    },
    poleSide: function (value) {
      return value >= 0 ? "green" : "red";
    },
    getDisplayNum: function (num) {
      let stringNum = typeof num == "number" ? num.toFixed() : Number(num).toFixed(); // toFixed is to get rid of number after decimal.
      if (stringNum.length > 9) {
        return `${stringNum.slice(0, -9)}.${stringNum.slice(-9, -7)}B`;
      } else if (stringNum.length > 6) {
        return `${stringNum.slice(0, -6)}.${stringNum.slice(-6, -4)}M`;
      } else if (stringNum.length > 3) {
        return `${stringNum.slice(0, -3)}.${stringNum.slice(-3, -1)}K`;
      } else {
        return stringNum;
      }
    },
    loadTvWidget: function (pid) {
      this.showChart = true;
      tvWidget.options.symbol = `COINBASE:${pid.split("-").join("")}`;
      tvWidget.reload();
    },
  },
  mounted: async function () {
    try {
      let response = await fetch("https://api.coinbase.com/api/v3/brokerage/market/products");
      let data = await response.json();
      let products = data.products;
      let product_ids = [];
      let quoteCurrencies = new Set();

      // let product_ids = data.map((item) => item.id);
      for (const p of products) {
        if (p.status == "online") {
          product_ids.push(p.product_id);
          quoteCurrencies.add(p.quote_currency_id);
        }
      }

      let obj = {};

      for (const product_id of product_ids) {
        obj[product_id] = {
          best_bid: 0,
          best_ask: 0,
          spread: 0,
          volatility: 0,
          polarity: 0,
          quote_vol_24hr: 0,
        };
      }

      this.products = obj;
      this.holdedProducts = Object.assign({}, obj);
      this.quotes = Array.from(quoteCurrencies);

      startWebSocketConnection(product_ids);
    } catch (e) {
      console.log(e);
    }

    setInterval(() => {
      this.products = Object.assign({}, this.holdedProducts);
    }, 2000);
  },
});
