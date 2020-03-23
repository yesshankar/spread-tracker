var app = new Vue({
  el: "#app",
  data: {
    products: {}
  },
  computed: {
    spread: function() {
      return Object.keys(this.products).sort(
        (a, b) => this.products[b].spread - this.products[a].spread
      );
    },
    product_ids: function() {
      return Object.keys(this.products);
    }
  }
});
