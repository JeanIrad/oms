sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  function (Controller, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("oms.orderscustom.controller.Products", {
      onInit: function () {},

      onProductPress: function (oEvent) {
        var oItem = oEvent.getSource();
        var oContext = oItem.getBindingContext();
        var sProductId = oContext.getProperty("ID");
        console.log("Navigating to Product:", sProductId);
        this.getOwnerComponent()
          .getRouter()
          .navTo("productDetail", { productId: sProductId });
        // var oItem = oEvent.getSource();
        // var oRouter = this.getOwnerComponent().getRouter();
        // oRouter.navTo("productDetail", {
        //   productId: oItem.getBindingContext().getProperty("ID"),
        // });
      },

      onSearch: function (oEvent) {
        var aFilters = [];
        var sQuery = oEvent.getSource().getValue();
        if (sQuery && sQuery.length > 0) {
          var filter = new Filter("name", FilterOperator.Contains, sQuery);
          aFilters.push(filter);
        }
        var oTable = this.byId("productsTable");
        var oBinding = oTable.getBinding("items");
        oBinding.filter(aFilters);
      },
    });
  },
);
