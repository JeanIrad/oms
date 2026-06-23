sap.ui.define(
  ["sap/ui/core/UIComponent", "sap/ui/Device"],
  function (UIComponent, Device) {
    "use strict";

    return UIComponent.extend("oms.orderscustom.Component", {
      metadata: {
        manifest: "json",
      },

      init: function () {
        UIComponent.prototype.init.apply(this, arguments);

        // Manifest-driven router is created automatically because
        // metadata.manifest === "json" and manifest.json has a
        // "routing" section under sap.ui5. It still has to be started
        // explicitly — without this call the router never reads the
        // URL hash and never injects route targets into the App's
        // "pages" aggregation, so the screen stays blank.
        this.getRouter().initialize();
      },
    });
  },
);
