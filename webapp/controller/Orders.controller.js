sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/TextArea",
    "sap/m/Button",
    "sap/ui/core/Item",
  ],
  function (
    Controller,
    Filter,
    FilterOperator,
    MessageToast,
    MessageBox,
    Dialog,
    TextArea,
    Button,
    Item,
  ) {
    "use strict";

    return Controller.extend("oms.orderscustom.controller.Orders", {
      onInit: function () {
        var oModel = this.getOwnerComponent().getModel();
        if (!oModel) {
          console.warn("OData model not available");
          return;
        }
        // Defer until the view (including the FilterPanel fragment's
        // controls) has fully rendered. Calling byId() for fragment
        // content too early in onInit can return undefined.
        this.getView().addEventDelegate({
          onAfterRendering: function () {
            this._loadCustomersIntoFilter();
          }.bind(this),
        });
      },

      _loadCustomersIntoFilter: function () {
        var oModel = this.getView().getModel();
        var oSelect = this.byId("filterCustomerSelect");

        if (!oModel) {
          console.warn("_loadCustomersIntoFilter: no OData model found");
          return;
        }
        if (!oSelect) {
          console.warn(
            "_loadCustomersIntoFilter: filterCustomerSelect control not found via byId(). " +
              "Check that the FilterPanel fragment is being instantiated with the view as its owner.",
          );
          return;
        }

        // Avoid reloading/duplicating items if onAfterRendering fires
        // again (e.g. navigating back to this route).
        if (this._bCustomersLoaded) {
          return;
        }
        this._bCustomersLoaded = true;

        var oBinding = oModel.bindList("/Customers");
        oBinding
          .requestContexts(0, 100)
          .then(
            function (aContexts) {
              aContexts.forEach(
                function (oContext) {
                  var oData = oContext.getObject();
                  oSelect.addItem(
                    new Item({ key: oData.ID, text: oData.name }),
                  );
                }.bind(this),
              );
            }.bind(this),
          )
          .catch(
            function (oErr) {
              console.warn("Failed to load customers", oErr);
              MessageToast.show("Could not load customer list for filtering");
              this._bCustomersLoaded = false;
            }.bind(this),
          );
      },

      onFilterChange: function () {
        var sFrom = this.byId("filterFromDate").getValue();
        var sTo = this.byId("filterToDate").getValue();
        var sCustomer = this.byId("filterCustomerSelect").getSelectedKey();

        var aFilters = [];
        if (sFrom) {
          aFilters.push(
            new Filter(
              "createdAt",
              FilterOperator.GE,
              sFrom + "T00:00:00.000Z",
            ),
          );
        }
        if (sTo) {
          aFilters.push(
            new Filter("createdAt", FilterOperator.LE, sTo + "T23:59:59.999Z"),
          );
        }
        if (sCustomer) {
          aFilters.push(
            new Filter("customer_ID", FilterOperator.EQ, sCustomer),
          );
        }

        var oTable = this.byId("ordersTable");
        var oBinding = oTable.getBinding("items");
        var oCombined =
          aFilters.length > 0
            ? new Filter({ filters: aFilters, and: true })
            : null;

        oBinding.filter(oCombined);
      },

      onClearFilters: function () {
        this.byId("filterFromDate").setValue("");
        this.byId("filterToDate").setValue("");
        this.byId("filterCustomerSelect").setSelectedKey("");
        this.byId("ordersTable").getBinding("items").filter(null);
      },

      onCreateOrder: function () {
        this.getOwnerComponent().getRouter().navTo("createOrder");
      },

      onConfirm: function (oEvent) {
        var oContext = oEvent.getSource().getBindingContext();
        var sPath = oContext.getPath();
        var oModel = this.getView().getModel();

        var oOperation = oModel.bindContext(sPath + "/OmsService.confirm(...)");
        oOperation
          .execute()
          .then(function () {
            MessageToast.show("Order confirmed");
            oContext.refresh();
          })
          .catch(function (oErr) {
            MessageBox.error(oErr.message || oErr);
          });
      },

      onShip: function (oEvent) {
        var oContext = oEvent.getSource().getBindingContext();
        var sPath = oContext.getPath();
        var oModel = this.getView().getModel();

        var oOperation = oModel.bindContext(sPath + "/OmsService.ship(...)");
        oOperation
          .execute()
          .then(function () {
            MessageToast.show("Order marked as shipped");
            oContext.refresh();
          })
          .catch(function (oErr) {
            MessageBox.error(oErr.message || oErr);
          });
      },

      onCancel: function (oEvent) {
        var oContext = oEvent.getSource().getBindingContext();
        this._openCancelDialog(oContext);
      },

      _openCancelDialog: function (oContext) {
        var that = this;
        var oTextArea = new TextArea({
          placeholder: "Enter a reason for cancellation",
          width: "100%",
          rows: 3,
        });

        var oDialog = new Dialog({
          title: "Cancel Order",
          content: [oTextArea],
          beginButton: new Button({
            text: "Confirm Cancellation",
            type: "Reject",
            press: function () {
              var sReason = oTextArea.getValue().trim();
              if (!sReason) {
                MessageToast.show("A cancellation reason is required");
                return;
              }
              oDialog.close();
              that._executeCancel(oContext, sReason);
            },
          }),
          endButton: new Button({
            text: "Close",
            press: function () {
              oDialog.close();
            },
          }),
          afterClose: function () {
            oDialog.destroy();
          },
        });

        this.getView().addDependent(oDialog);
        oDialog.open();
      },

      _executeCancel: function (oContext, sReason) {
        var sPath = oContext.getPath();
        var oModel = this.getView().getModel();

        var oOperation = oModel.bindContext(sPath + "/OmsService.cancel(...)");
        oOperation.setParameter("reason", sReason);
        oOperation
          .execute()
          .then(function () {
            MessageToast.show("Order cancelled");
            oContext.refresh();
          })
          .catch(function (oErr) {
            MessageBox.error(oErr.message || oErr);
          });
      },
    });
  },
);
