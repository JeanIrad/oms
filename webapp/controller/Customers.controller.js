sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  "use strict";

  return Controller.extend("oms.orderscustom.controller.Customers", {
    onCustomerPress: function (oEvent) {
      var oItem = oEvent.getSource();
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("customerDetail", {
        customerId: oItem.getBindingContext().getProperty("ID"),
      });
    },
  });
});
