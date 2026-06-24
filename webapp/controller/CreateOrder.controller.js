sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Item",
  ],
  function (Controller, JSONModel, MessageToast, MessageBox, Item) {
    "use strict";

    return Controller.extend("oms.orderscustom.controller.CreateOrder", {
      onInit: function () {
        this.getView().setModel(new JSONModel({ items: [] }), "newOrder");
        this._loadCustomers();
        this._loadProducts();
      },

      _loadCustomers: function () {
        var oModel = this.getOwnerComponent().getModel();
        var oSelect = this.byId("customerSelect");
        var oBinding = oModel.bindList("/Customers");

        oBinding
          .requestContexts(0, 200)
          .then(function (aContexts) {
            aContexts.forEach(function (oContext) {
              var oData = oContext.getObject();
              oSelect.addItem(new Item({ key: oData.ID, text: oData.name }));
            });
          })
          .catch(function (oErr) {
            console.warn("Failed to load customers", oErr);
            MessageToast.show("Could not load customers");
          });
      },

      _loadProducts: function () {
        var oModel = this.getOwnerComponent().getModel();
        var oBinding = oModel.bindList("/Products");

        oBinding
          .requestContexts(0, 500)
          .then(
            function (aContexts) {
              var aProducts = aContexts.map(function (oContext) {
                return oContext.getObject();
              });
              this.getView().setModel(
                new JSONModel({ Products: aProducts }),
                "products",
              );
            }.bind(this),
          )
          .catch(function (oErr) {
            console.warn("Failed to load products", oErr);
            MessageToast.show("Could not load products");
          });
      },

      onAddItem: function () {
        var oNewOrderModel = this.getView().getModel("newOrder");
        var aItems = oNewOrderModel.getProperty("/items");
        aItems.push({ productId: "", quantity: 1, unitPrice: 0 });
        oNewOrderModel.setProperty("/items", aItems);
      },

      onRemoveItem: function (oEvent) {
        var oItem = oEvent.getSource().getParent();
        var oNewOrderModel = this.getView().getModel("newOrder");
        var sPath = oItem.getBindingContext("newOrder").getPath();
        var iIndex = parseInt(sPath.split("/").pop(), 10);

        var aItems = oNewOrderModel.getProperty("/items");
        aItems.splice(iIndex, 1);
        oNewOrderModel.setProperty("/items", aItems);
      },

      onItemProductChange: function (oEvent) {
        var oSelect = oEvent.getSource();
        var sProductId = oSelect.getSelectedKey();
        var oProductsModel = this.getView().getModel("products");
        var aProducts = oProductsModel.getProperty("/Products");
        var oProduct = aProducts.find(function (p) {
          return p.ID === sProductId;
        });

        if (oProduct) {
          var oItemContext = oSelect.getBindingContext("newOrder");
          var oNewOrderModel = this.getView().getModel("newOrder");
          oNewOrderModel.setProperty(
            oItemContext.getPath() + "/unitPrice",
            oProduct.price,
          );
        }
      },

      onSaveOrder: function () {
        var sCustomerId = this.byId("customerSelect").getSelectedKey();
        var sNotes = this.byId("notesInput").getValue();
        var aItems = this.getView().getModel("newOrder").getProperty("/items");

        if (!sCustomerId) {
          MessageToast.show("Please select a customer");
          return;
        }
        if (!aItems.length) {
          MessageToast.show("Add at least one order item");
          return;
        }
        for (var i = 0; i < aItems.length; i++) {
          if (!aItems[i].productId || !aItems[i].quantity) {
            MessageToast.show("Each item needs a product and quantity");
            return;
          }
        }

        var oModel = this.getOwnerComponent().getModel();
        var oListBinding = oModel.bindList("/Orders");

        var oNewContext = oListBinding.create({
          customer_ID: sCustomerId,
          notes: sNotes,
          items: aItems.map(function (oItem) {
            return {
              product_ID: oItem.productId,
              quantity: oItem.quantity,
              unitPrice: oItem.unitPrice,
            };
          }),
        });

        oNewContext
          .created()
          .then(
            function () {
              MessageToast.show("Order created");

              this.getOwnerComponent().getModel().refresh();
              this.getOwnerComponent().getRouter().navTo("orders");
            }.bind(this),
          )
          .catch(function (oErr) {
            MessageBox.error(oErr.message || oErr);
          });
      },

      onNavBack: function () {
        this.getOwnerComponent().getRouter().navTo("orders");
      },
    });
  },
);
