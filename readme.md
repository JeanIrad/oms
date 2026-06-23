<mvc:View
controllerName="oms.orderscustom.controller.App"
xmlns="sap.m"
xmlns:mvc="sap.ui.core.mvc">
<Shell>
<App>
<pages>
<Page title="Orders">
<content>
<core:Fragment
xmlns:core="sap.ui.core"
fragmentName="oms.orderscustom.view.FilterPanel"
type="XML"/>

<Table
              id="ordersTable"
              items="{path: '/Orders', parameters: {$$updateGroupId: 'auto'}}"
              growing="true"
              growingThreshold="20"
              noDataText="No orders found">
<headerToolbar>
<Toolbar>
<Title text="Orders" level="H2"/>
<ToolbarSpacer/>
<Text text="{= ${orders>/items}.length + ' result(s)' }"/>
</Toolbar>
</headerToolbar>
<columns>
<Column><Text text="Customer"/></Column>
<Column><Text text="Order date"/></Column>
<Column><Text text="Total price"/></Column>
<Column><Text text="Status"/></Column>
<Column><Text text="Actions"/></Column>
</columns>
<items>
<ColumnListItem>
<cells>
<Text text="{customer_ID}"/>
<Text text="{path: 'createdAt', type: 'sap.ui.model.type.DateTime', formatOptions: {style: 'medium'}}"/>
<Text text="{path: 'totalPrice', type: 'sap.ui.model.type.Currency', formatOptions: {showMeasure: false}} USD"/>
<ObjectStatus text="{status}" state="{= ${status} === 'CONFIRMED' ? 'Success' : ${status} === 'CANCELLED' ? 'Error' : 'Information' }"/>
<HBox>
<Button text="Confirm" type="Emphasized" press="onConfirm" class="sapUiTinyMarginEnd"/>
<Button text="Cancel" type="Reject" press="onCancel"/>
</HBox>
</cells>
</ColumnListItem>
</items>
</Table>
</content>
</Page>
</pages>
</App>
</Shell>
</mvc:View>

{
"\_version": "1.12.0",
"sap.app": {
"id": "oms.orderscustom",
"type": "application",
"title": "Orders (Custom)",
"applicationVersion": { "version": "1.0.0" },
"dataSources": {
"mainService": {
"uri": "/oms/",
"type": "OData",
"settings": { "odataVersion": "4.0" }
}
}
},
"sap.ui": {
"technology": "UI5",
"deviceTypes": { "desktop": true, "tablet": true, "phone": true }
},
"sap.ui5": {
"rootView": {
"viewName": "oms.orderscustom.view.App",
"type": "XML",
"id": "app"
},
"dependencies": {
"minUI5Version": "1.120.0",
"libs": { "sap.m": {}, "sap.ui.core": {}, "sap.f": {} }
},
"models": {
"i18n": {
"type": "sap.ui.model.resource.ResourceModel",
"settings": { "bundleName": "oms.orderscustom.i18n.i18n" }
},
"": {
"dataSource": "mainService",
"type": "sap.ui.model.odata.v4.ODataModel",
"settings": {
"synchronizationMode": "None",
"operationMode": "Server",
"autoExpandSelect": true,
"earlyRequests": false
}
}
},
"resources": {
"css": [{ "uri": "css/style.css" }]
}
}
}

// sap.ui.define(
// [
// "sap/ui/core/mvc/Controller",
// "sap/ui/model/Filter",
// "sap/ui/model/FilterOperator",
// "sap/m/MessageToast",
// "sap/m/MessageBox",
// ],
// function (Controller, Filter, FilterOperator, MessageToast, MessageBox) {
// "use strict";

// return Controller.extend("oms.orderscustom.controller.App", {
// onInit: function () {
// const oModel = this.getOwnerComponent().getModel();
// if (!oModel) {
// console.warn("OData model not available");
// return;
// }
// console.log("ODATA MODEL AVAILABLE>>>", oModel);
// console.log("App controller onInit");
// this.\_loadCustomersIntoFilter();
// },

// \_loadCustomersIntoFilter: function () {
// var oModel = this.getView().getModel();
// var oSelect = this.byId("filterCustomerSelect");
// console.log("O MODEL>>>>", oModel);
// var oBinding = oModel?.bindList("/Customers");
// oBinding
// ?.requestContexts(0, 100)
// ?.then(function (aContexts) {
// aContexts.forEach(function (ctx) {
// var data = ctx.getObject();
// oSelect.addItem(
// new sap.ui.core.Item({ key: data.ID, text: data.name }),
// );
// });
// console.log("Customers loaded into filter:", aContexts.length);
// })
// .catch(function (err) {
// console.warn("Failed to load customers", err);
// });
// },

// onFilterChange: function () {
// var sFrom = this.byId("filterFromDate").getValue();
// var sTo = this.byId("filterToDate").getValue();
// var sCustomer = this.byId("filterCustomerSelect").getSelectedKey();

// console.log(
// "Filter changed — from:",
// sFrom,
// "to:",
// sTo,
// "customer:",
// sCustomer,
// );

// var aFilters = [];
// if (sFrom) {
// aFilters.push(
// new Filter(
// "createdAt",
// FilterOperator.GE,
// sFrom + "T00:00:00.000Z",
// ),
// );
// }
// if (sTo) {
// aFilters.push(
// new Filter("createdAt", FilterOperator.LE, sTo + "T23:59:59.999Z"),
// );
// }
// if (sCustomer) {
// aFilters.push(
// new Filter("customer_ID", FilterOperator.EQ, sCustomer),
// );
// }

// var oTable = this.byId("ordersTable");
// var oBinding = oTable.getBinding("items");
// var oCombined =
// aFilters.length > 0
// ? new Filter({ filters: aFilters, and: true })
// : null;

// oBinding.filter(oCombined);
// console.log("Applied filter, table will refresh");
// },

// onClearFilters: function () {
// this.byId("filterFromDate").setValue("");
// this.byId("filterToDate").setValue("");
// this.byId("filterCustomerSelect").setSelectedKey("");
// this.byId("ordersTable").getBinding("items").filter(null);
// },

// onConfirm: function (oEvent) {
// var oContext = oEvent.getSource().getBindingContext();
// var sPath = oContext.getPath();
// var sId = oContext.getProperty("ID");
// var oModel = this.getView().getModel();

// var oOperation = oModel.bindContext(sPath + "/OmsService.confirm(...)");
// oOperation
// .execute()
// .then(function () {
// MessageToast.show("Order confirmed");
// })
// .catch(function (err) {
// MessageBox.error(
// "Could not confirm order: " + (err.message || err),
// );
// });
// },

// onCancel: function (oEvent) {
// var oContext = oEvent.getSource().getBindingContext();
// var sPath = oContext.getPath();
// var oModel = this.getView().getModel();

// MessageBox.confirm("Are you sure you want to cancel this order?", {
// onClose: function (sAction) {
// if (sAction !== MessageBox.Action.OK) return;

// var oOperation = oModel.bindContext(
// sPath + "/OmsService.cancel(...)",
// );
// oOperation.setParameter("reason", "Cancelled via custom UI");
// oOperation
// .execute()
// .then(function () {
// MessageToast.show("Order cancelled");
// })
// .catch(function (err) {
// MessageBox.error(
// "Could not cancel order: " + (err.message || err),
// );
// });
// },
// });
// },
// });
// },
// );

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
              this.getOwnerComponent().getRouter().navTo("orders");
            }.bind(this),
          )
          .catch(function (oErr) {
            MessageBox.error(
              "Could not create order: " + (oErr.message || oErr),
            );
          });
      },

      onNavBack: function () {
        this.getOwnerComponent().getRouter().navTo("orders");
      },
    });

},
);
