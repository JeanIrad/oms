/* eslint-disable no-console */
/* eslint-disable quotes */
/* eslint-disable no-alert */
// sap.ui.define(
//   [
//     'sap/ui/core/mvc/ControllerExtension',
//     'sap/ui/model/Filter',
//     'sap/ui/model/FilterOperator',
//     'sap/m/MessageToast',
//   ],
//   function (ControllerExtension, Filter, FilterOperator, MessageToast) {
//     'use strict';
//     // eslint-disable-next-line no-console
//     console.log('LOADING CONTROLLER EXTENSION FUNCTION.....');
//     // alert('Hello world!');
//     return ControllerExtension.extend(
//       'oms.orders.ext.controller.OrdersListReportExt',
//       {
//         // No more onInit/_loadFilterPanel — the fragment is now rendered
//         // automatically by the ListReport.BeforeTable extension point
//         // declared in manifest.json. We only need the event handlers
//         // the fragment's buttons call.
//         onInit() {
//           console.log('Instantiating controller');
//         },
//         onDateRangeChange: function (oEvent) {
//           console.log('PICKING DATE....');
//           const source = oEvent.getSource();
//           const from = source.getDateValue();
//           const to = source.getSecondDateValue();
//           const extensionAPI = this.base.getExtensionAPI();

//           if (from) {
//             extensionAPI.setFilterValues('createdAt', 'GE', from.toISOString());
//           }
//           if (to) {
//             extensionAPI.setFilterValues('createdAt', 'LE', to.toISOString());
//           }
//         },
//         onCustomerFilterChange: function (oEvent) {
//           console.log('CUSTOMER CHANGED.....');
//           const selectedKey = oEvent.getSource().getSelectedKey();
//           const extensionAPI = this.base.getExtensionAPI();

//           if (selectedKey) {
//             extensionAPI.setFilterValues('customer_ID', 'EQ', selectedKey);
//           } else {
//             extensionAPI.setFilterValues('customer_ID', 'EQ', null);
//           }
//         },
//       },
//     );
//   },
// );.

sap.ui.define(
  ['sap/ui/core/mvc/ControllerExtension', 'sap/ui/model/json/JSONModel'],
  function (ControllerExtension, JSONModel) {
    'use strict';
    console.log('CALLING FROM CONTROLLER');

    return ControllerExtension.extend(
      'oms.orders.ext.controller.OrdersListReportExt',
      {
        onInit() {
          // Load customers into a named JSON model so the Select can have
          // an "All customers" entry that isn't wiped by OData binding.
          const oModel = this.base.getView().getModel();
          oModel
            .requestContexts('/Customers', { $$patchWithoutSideEffects: true })
            .then((aCtx) => {
              const aItems = [{ ID: '', name: 'All customers' }].concat(
                aCtx.map((ctx) => ctx.getObject()),
              );
              this.base
                .getView()
                .setModel(new JSONModel({ customers: aItems }), 'customerList');
            });
        },

        // onDateRangeChange: function (oEvent) {
        //   const oSource = oEvent.getSource();
        //   const oFrom = oSource.getDateValue();
        //   const oTo = oSource.getSecondDateValue();
        //   const api = this.base.getExtensionAPI();

        //   // BT (Between) sets both bounds as one condition on the filter bar.
        //   api.setFilterValues(
        //     'createdAt',
        //     'BT',
        //     oFrom || undefined,
        //     oTo || undefined,
        //   );
        //   api.rebind();
        // },
        onBeforeRebindTable: function (oEvent) {
          const bindingParams = oEvent.getParameter('bindingParams');

          const fromInput = this.base.getView().byId('customDateFrom');
          const toInput = this.base.getView().byId('customDateTo');
          const custSelect = this.base.getView().byId('customCustomerSelect');

          const extraFilters = [];

          if (fromInput?.getValue()) {
            extraFilters.push(
              new Filter(
                'createdAt',
                FilterOperator.GE,
                `${fromInput.getValue()}T00:00:00.000Z`,
              ),
            );
          }
          if (toInput?.getValue()) {
            extraFilters.push(
              new Filter(
                'createdAt',
                FilterOperator.LE,
                `${toInput.getValue()}T23:59:59.999Z`,
              ),
            );
          }
          if (custSelect?.getSelectedKey()) {
            extraFilters.push(
              new Filter(
                'customer_ID',
                FilterOperator.EQ,
                custSelect.getSelectedKey(),
              ),
            );
          }

          if (extraFilters.length > 0) {
            bindingParams.filters.push(
              new Filter({ filters: extraFilters, and: true }),
            );
          }
        },
        onCustomerFilterChange: function (oEvent) {
          const sKey = oEvent.getSource().getSelectedKey();
          const api = this.base.getExtensionAPI();

          api.setFilterValues('customer_ID', 'EQ', sKey || undefined);
          api.rebind();
        },
      },
    );
  },
);
