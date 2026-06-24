sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  "use strict";

  return Controller.extend("oms.orderscustom.controller.OrderSummary", {
    onInit: function () {
      console.log("OrderSummary controller onInit");
      this._loadKpis();
      this._loadChart();
      this._loadCustomerChart();
      this._loadProductChart();
    },
    _loadProductChart: function () {
      var oOwnerModel = this.getOwnerComponent().getModel();
      var oView = this.getView();

      var oItemsBinding = oOwnerModel.bindList(
        "/OrderItems",
        null,
        null,
        null,
        {
          $apply:
            "groupby((product_ID),aggregate(lineTotal with sum as total))",
        },
      );

      var oProductsBinding = oOwnerModel.bindList("/Products");

      Promise.all([
        oItemsBinding.requestContexts(0, 100),
        oProductsBinding.requestContexts(0, 200),
      ])
        .then(function (aResults) {
          var aItemTotals = aResults[0].map(function (ctx) {
            return ctx.getObject();
          });
          var aProducts = aResults[1].map(function (ctx) {
            return ctx.getObject();
          });

          var oProductNameById = {};
          aProducts.forEach(function (p) {
            oProductNameById[p.ID] = p.name;
          });

          var aChartData = aItemTotals
            .map(function (item) {
              return {
                statusName:
                  oProductNameById[item.product_ID] || "Unknown product",
                value: item.total,
                color: "Neutral",
              };
            })
            .sort(function (a, b) {
              return b.value - a.value;
            })
            .slice(0, 10);

          var oJsonModel = new sap.ui.model.json.JSONModel(aChartData);
          var oChart = oView.byId("revenueByProductChart").setModel(oJsonModel);
          oChart.bindAggregation("data", {
            path: "/",
            template: new sap.suite.ui.microchart.ComparisonMicroChartData({
              title: "{statusName}",
              value: "{value}",
              color: "{color}",
            }),
          });
        })
        .catch(function (err) {
          console.warn("Failed to load product chart data:", err);
        });
    },

    _loadCustomerChart: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oView = this.getView();

      var oBinding = oModel.bindList("/OrderSummary", null, null, null, {
        $apply:
          "groupby((customerName),aggregate(totalPrice with sum as total))",
      });

      oBinding
        .requestContexts(0, 50)
        .then(function (aContexts) {
          var aChartData = aContexts
            .map(function (ctx) {
              var data = ctx.getObject();
              return {
                statusName: data.customerName,
                value: data.total,
                color: "Neutral",
              };
            })
            .sort(function (a, b) {
              return b.value - a.value;
            })
            .slice(0, 10);

          var oJsonModel = new sap.ui.model.json.JSONModel(aChartData);
          var oChart = oView
            .byId("revenueByCustomerChart")
            .setModel(oJsonModel);
          oChart.bindAggregation("data", {
            path: "/",
            template: new sap.suite.ui.microchart.ComparisonMicroChartData({
              title: "{statusName}",
              value: "{value}",
              color: "{color}",
            }),
          });
        })
        .catch(function (err) {
          console.warn("Failed to load customer chart data:", err);
        });
    },
    _loadChart: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oView = this.getView();

      var oBinding = oModel.bindList("/OrderSummary", null, null, null, {
        $apply: "groupby((status),aggregate(totalPrice with sum as total))",
      });

      oBinding
        .requestContexts(0, 20)
        .then(function (aContexts) {
          var aChartData = aContexts.map(function (ctx) {
            var data = ctx.getObject();
            var color =
              data.status === "CONFIRMED"
                ? "Good"
                : data.status === "CANCELLED"
                  ? "Error"
                  : "Neutral";
            return {
              statusName: data.status,
              value: data.total,
              color: color,
            };
          });

          var oJsonModel = new sap.ui.model.json.JSONModel(aChartData);
          var oChart = oView.byId("revenueByStatusChart");
          oChart.setModel(oJsonModel);
          oChart.bindAggregation("data", {
            path: "/",
            template: new sap.suite.ui.microchart.ComparisonMicroChartData({
              title: "{statusName}",
              value: "{value}",
              color: "{color}",
            }),
          });
        })
        .catch(function (err) {
          console.warn("Failed to load chart data:", err);
        });
    },
    _loadKpis: function () {
      var oModel = this.getOwnerComponent().getModel();
      var oView = this.getView();

      var oRevenueBinding = oModel.bindList("/OrderSummary", null, null, null, {
        $apply: "aggregate(totalPrice with sum as total)",
      });

      oRevenueBinding
        .requestContexts(0, 1)
        .then(function (aContexts) {
          if (aContexts.length === 0) return;
          var total = aContexts[0].getObject().total;
          var formatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(total || 0);
          oView.byId("kpiRevenue").setText(formatted);
        })
        .catch(function (err) {
          console.warn("Failed to load revenue KPI:", err);
        });

      var oCountBinding = oModel.bindList("/OrderSummary", null, null, null, {
        $apply: "aggregate($count as total)",
      });

      oCountBinding
        .requestContexts(0, 1)
        .then(function (aContexts) {
          if (aContexts.length === 0) return;
          var count = aContexts[0].getObject().total;
          oView.byId("kpiOrderCount").setText(String(count));
        })
        .catch(function (err) {
          console.warn("Failed to load order count KPI:", err);
        });
    },
  });
});
