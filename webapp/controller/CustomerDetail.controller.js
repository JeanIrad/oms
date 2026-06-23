sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/core/routing/History"],
  function (Controller, History) {
    "use strict";

    return Controller.extend("oms.orderscustom.controller.CustomerDetail", {
      onInit: function () {
        var oRouter = this.getOwnerComponent().getRouter();
        oRouter
          .getRoute("CustomerDetail")
          .attachPatternMatched(this._onObjectMatched, this);
      },

      _onObjectMatched: function (oEvent) {
        var sCustomerId = oEvent.getParameter("arguments").customerId;
        this.getView().bindElement({
          path: "/Customers(" + sCustomerId + ")",
        });
      },

      onNavBack: function () {
        var oHistory = History.getInstance();
        var sPreviousHash = oHistory.getPreviousHash();

        if (sPreviousHash !== undefined) {
          window.history.go(-1);
        } else {
          var oRouter = this.getOwnerComponent().getRouter();
          oRouter.navTo("CustomersList", {}, true);
        }
      },
    });
  },
);
