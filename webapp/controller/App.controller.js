sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  "use strict";

  return Controller.extend("oms.orderscustom.controller.App", {
    onInit: function () {
      // Shell-level controller. All data/view logic now lives in
      // Orders.controller.js and CreateOrder.controller.js, which are
      // wired up as route targets in manifest.json.
    },
  });
});
