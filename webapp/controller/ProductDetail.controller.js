sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/core/routing/History"],
  function (Controller, History) {
    "use strict";

    return Controller.extend("oms.orderscustom.controller.ProductDetail", {
      onInit: function () {
        var oRouter = this.getOwnerComponent().getRouter();
        oRouter
          .getRoute("ProductDetail")
          .attachPatternMatched(this._onObjectMatched, this);
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
