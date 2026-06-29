/* eslint-disable no-console */
sap.ui.define(
  [
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/HBox",
  ],
  function (ControllerExtension, Fragment, Filter, FilterOperator, HBox) {
    "use strict";

    return ControllerExtension.extend(
      "oms.orders.ext.controller.FilterExtension",
      {
        override: {
          onInit: function () {
            console.log("✅ onInit fired");
            // Wait for view to fully render before injecting
            this.base.getView().addEventDelegate({
              onAfterRendering: () => {
                this._loadCustomFilters();
              },
            });
          },
        },

        _loadCustomFilters: function () {
          const oView = this.base.getView();

          const oFilterBar = sap.ui
            .getCore()
            .byId("oms.orders::OrdersList--fe::FilterBar::Orders");

          if (!oFilterBar) {
            console.error("❌ FilterBar not found");
            return;
          }

          // The macro wrapper's parent is the real sap.m.VBox
          const oMacroWrapper = oFilterBar.getParent(); // sap.fe.macros.FilterBar
          const oVBox = oMacroWrapper.getParent(); // sap.m.VBox ← this is what we need

          console.log(
            "Macro wrapper:",
            oMacroWrapper?.getMetadata().getName(),
            oMacroWrapper?.getId(),
          );
          console.log("VBox:", oVBox?.getMetadata().getName(), oVBox?.getId());

          if (!oVBox || typeof oVBox.addItem !== "function") {
            console.error("❌ Real VBox still not found, parent chain:");
            let o = oFilterBar;
            for (let i = 0; i < 5; i++) {
              o = o?.getParent();
              console.log(
                `Level ${i + 1}:`,
                o?.getMetadata().getName(),
                "→",
                o?.getId(),
              );
            }
            return;
          }

          if (this._filtersLoaded) return;
          this._filtersLoaded = true;

          const sViewId = this.base.getView().getId();

          Promise.all([
            Fragment.load({
              id: sViewId + "--customDate",
              name: "oms.orders.ext.fragment.CustomDateFilter",
              controller: this,
            }),
            Fragment.load({
              id: sViewId + "--customCustomer",
              name: "oms.orders.ext.fragment.CustomCustomerFilter",
              controller: this,
            }),
          ])
            .then(([oDateFrag, oCustomerFrag]) => {
              console.log("✅ Both fragments loaded, injecting into VBox");
              oVBox.addItem(oDateFrag);
              oVBox.addItem(oCustomerFrag);
            })
            .catch((err) => {
              console.error("❌ Fragment load error:", err);
            });
        },

        // _loadCustomFilters: function () {
        //   const oView = this.base.getView();

        //   // Get the VBox that wraps the FilterBar — from the ID dump:
        //   // sap.m.VBox → __vbox0  (contains the FilterBar)
        //   // We find it via the FilterBar's parent
        //   const sFilterBarId = "oms.orders::OrdersList--fe::FilterBar::Orders";
        //   const oFilterBarMacro = oView.byId
        //     ? oView.byId(sFilterBarId)
        //     : sap.ui.getCore().byId(sFilterBarId);

        //   // Use getCore since this is outside the view's local ID scope
        //   const oFilterBar = sap.ui.getCore().byId(sFilterBarId);

        //   if (!oFilterBar) {
        //     console.error("❌ FilterBar still not found with full ID");
        //     return;
        //   }

        //   const oVBox = oFilterBar.getParent(); // the sap.m.VBox wrapping it
        //   if (!oVBox) {
        //     console.error("❌ VBox parent not found");
        //     return;
        //   }

        //   console.log("✅ FilterBar parent (VBox):", oVBox.getId());

        //   // Avoid double-loading on re-render
        //   if (this._filtersLoaded) return;
        //   this._filtersLoaded = true;

        //   const sViewId = this.base.getView().getId();

        //   // Load both fragments and add them to the VBox below the FilterBar
        //   Promise.all([
        //     Fragment.load({
        //       id: sViewId + "--customDate",
        //       name: "oms.orders.ext.fragment.CustomDateFilter",
        //       controller: this,
        //     }),
        //     Fragment.load({
        //       id: sViewId + "--customCustomer",
        //       name: "oms.orders.ext.fragment.CustomCustomerFilter",
        //       controller: this,
        //     }),
        //   ])
        //     .then(([oDateFrag, oCustomerFrag]) => {
        //       console.log("✅ Both fragments loaded");
        //       oVBox.addItem(oDateFrag);
        //       oVBox.addItem(oCustomerFrag);
        //     })
        //     .catch((err) => {
        //       console.error("❌ Fragment load error:", err);
        //     });
        // },

        onDateRangeChange: function (oEvent) {
          const oPicker = oEvent.getSource();
          const oDateFrom = oPicker.getDateValue();
          const oDateTo = oPicker.getSecondDateValue();

          let oFilter = null;
          if (oDateFrom && oDateTo) {
            oDateFrom.setHours(0, 0, 0, 0);
            oDateTo.setHours(23, 59, 59, 999);
            const sDateFrom = oDateFrom.toISOString();
            const sDateTo = oDateTo.toISOString();
            console.log("Date range filter:", sDateFrom, "→", sDateTo);
            oFilter = new Filter({
              path: "createdAt",
              operator: FilterOperator.BT,
              value1: sDateFrom,
              value2: sDateTo,
            });
          }
          this._applyFilter("createdAt", oFilter);
        },

        onCustomerSearch: function (oEvent) {
          const sQuery = oEvent.getParameter("newValue").trim();
          let oFilter = null;
          if (sQuery.length >= 1) {
            oFilter = new Filter({
              path: "customer/name",
              operator: FilterOperator.Contains,
              value1: sQuery,
            });
          }
          this._applyFilter("customer/name", oFilter);
        },

        _applyFilter: function (sPath, oFilter) {
          console.log("oFilter>>>>", oFilter);
          const oTable = sap.ui
            .getCore()
            .byId(
              "oms.orders::OrdersList--fe::table::Orders::LineItem-innerTable",
            );

          if (!oTable) {
            console.warn("❌ Table not found");
            return;
          }

          const oBinding = oTable.getBinding("items");
          if (!oBinding) return;

          const aFilters = (oBinding.aApplicationFilters || []).filter(
            (f) => f.sPath !== sPath,
          );

          if (oFilter) aFilters.push(oFilter);
          oBinding.filter(aFilters, "Application");
        },
      },
    );
  },
);
