sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  "use strict";

  return Controller.extend("oms.orderscustom.controller.App", {
    onInit: function () {
      // Track routing history changes to auto-select the right sidebar item
      this.getOwnerComponent()
        .getRouter()
        .attachRouteMatched(this._onRouteMatched, this);
    },

    /**
     * Collapses or expands the side navigation panel
     */
    onSideNavButtonPress: function () {
      var oToolPage = this.byId("toolPage");
      oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
    },

    /**
     * Triggers explicit navigation when clicking a menu list item
     */
    onSideNavItemSelect: function (oEvent) {
      var sKey = oEvent.getParameter("item").getKey();
      this.getOwnerComponent().getRouter().navTo(sKey);
    },

    /**
     * Automatically ensures sidebar items remain highlighted correctly
     * even when utilizing deep links or navigating to sub-detail views.
     */
    _onRouteMatched: function (oEvent) {
      var sRouteName = oEvent.getParameter("name");
      var oSideNavigation = this.byId("sideNavigation");

      // Map detail views back to their primary module keys
      if (sRouteName === "createOrder") {
        sRouteName = "orders";
      } else if (sRouteName === "productDetails") {
        sRouteName = "products";
      } else if (sRouteName === "customerDetail") {
        sRouteName = "customers";
      }

      oSideNavigation.setSelectedKey(sRouteName);
    },
  });
});
