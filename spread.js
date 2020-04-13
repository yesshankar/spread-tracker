var app = new Vue({
  el: "#app",
  data: {
    products: {},
    sort_by: "spread",
    checkedAssets: {
      ALL: true,
      USD: true,
      USDC: true,
      BTC: true,
      EUR: true,
      GBP: true,
      DAI: true,
      ETH: true,
    },
  },
  computed: {
    product_ids: function () {
      let filteredProducts = Object.keys(this.products).filter((pid) => {
        let asset = pid.split("-")[1];
        return this.checkedAssets[asset];
      });

      if (this.sort_by === "spread") {
        return filteredProducts.sort(
          (a, b) => this.products[b].spread - this.products[a].spread
        );
      } else if (this.sort_by === "volatility") {
        return filteredProducts.sort(
          (a, b) => this.products[b].volatility - this.products[a].volatility
        );
      } else if (this.sort_by === "polarity") {
        return filteredProducts.sort(
          (a, b) => this.products[b].polarity - this.products[a].polarity
        );
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
    toggleCheckboxes: function () {
      for (const key in this.checkedAssets) {
        if (this.checkedAssets.hasOwnProperty(key)) {
          this.checkedAssets[key] = this.checkedAssets.ALL;
        }
      }
    },
    toggleAll: function () {
      for (const key in this.checkedAssets) {
        if (!this.checkedAssets[key] && key != "ALL") {
          this.checkedAssets.ALL = false;
          return;
        }
      }
      this.checkedAssets.ALL = true;
    },
  },
});
