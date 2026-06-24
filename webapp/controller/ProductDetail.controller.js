sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/core/routing/History"],
  function (Controller, History) {
    "use strict";

    console.log("INITIALIZED PRODUCT DETAILS");
    return Controller.extend("oms.orderscustom.controller.ProductDetail", {
      onInit: function () {
        console.log("Product Details controller");
        var oRouter = this.getOwnerComponent().getRouter();
        oRouter
          .getRoute("productDetail")
          .attachPatternMatched(this._onObjectMatched, this);
        console.log("Product Details controller");
      },

      _onObjectMatched: function (oEvent) {
        var sProductId = oEvent.getParameter("arguments").productId;
        this.getView().bindElement({
          path: "/Products(" + sProductId + ")",
        });
      },

      onNavBack: function () {
        var oHistory = History.getInstance();
        var sPreviousHash = oHistory.getPreviousHash();

        if (sPreviousHash !== undefined) {
          window.history.go(-1);
        } else {
          var oRouter = this.getOwnerComponent().getRouter();
          oRouter.navTo("ProductsList", {}, true);
        }
      },
    });
  },
);
