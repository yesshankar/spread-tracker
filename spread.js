var app = new Vue({
  el: "#app",
  data: {
    products: {},
    sort_by: "spread"
  },
  computed: {
    product_ids: function() {
      if (this.sort_by === "spread") {
        return Object.keys(this.products).sort(
          (a, b) => this.products[b].spread - this.products[a].spread
        );
      } else if (this.sort_by === "volatility") {
        return Object.keys(this.products).sort(
          (a, b) => this.products[b].volatility - this.products[a].volatility
        );
      } else {
        return Object.keys(this.products).sort();
      }
    }
  },
  methods: {
    changeSortBy: function(sort_by) {
      this.sort_by = sort_by;
    }
  }
});
