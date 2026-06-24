sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/m/MessageToast", "sap/m/MessageBox"],
  function (Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("oms.orderscustom.controller.OrderDetail", {
      onInit: function () {
        console.log("OrderDetail controller onInit");
        this.getOwnerComponent()
          .getRouter()
          .getRoute("orderDetail")
          .attachPatternMatched(this._onRouteMatched, this);
      },

      _onRouteMatched: function (oEvent) {
        var sOrderId = oEvent.getParameter("arguments").orderId;
        console.log("OrderDetail route matched, orderId:", sOrderId);

        var oModel = this.getOwnerComponent().getModel();
        this.getView().bindElement({
          path: "/Orders('" + sOrderId + "')",
          model: undefined,
          parameters: {
            $expand: "customer,items($expand=product)",
          },
        });
      },

      onNavBack: function () {
        this.getOwnerComponent().getRouter().navTo("orders");
      },

      onConfirm: function () {
        this._callAction("confirm", {});
      },

      onShip: function () {
        this._callAction("ship", {});
      },

      onCancel: function () {
        var that = this;
        MessageBox.confirm("Are you sure you want to cancel this order?", {
          onClose: function (sAction) {
            if (sAction !== MessageBox.Action.OK) return;
            that._callAction("cancel", {
              reason: "Cancelled from order details",
            });
          },
        });
      },

      _callAction: function (sActionName, mParams) {
        var oContext = this.getView().getBindingContext();
        var sPath = oContext.getPath();
        var oModel = this.getOwnerComponent().getModel();

        var oOperation = oModel.bindContext(
          sPath + "/OmsService." + sActionName + "(...)",
        );
        Object.keys(mParams).forEach(function (key) {
          oOperation.setParameter(key, mParams[key]);
        });

        oOperation
          .execute()
          .then(function () {
            MessageToast.show("Order " + sActionName + "ed");
            oContext.refresh();
          })
          .catch(function (err) {
            MessageBox.error(err.message || err);
          });
      },
    });
  },
);
