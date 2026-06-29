sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"oms/ordersummary/test/integration/pages/OrderSummaryList",
	"oms/ordersummary/test/integration/pages/OrderSummaryObjectPage"
], function (JourneyRunner, OrderSummaryList, OrderSummaryObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('oms/ordersummary') + '/test/flp.html#app-preview',
        pages: {
			onTheOrderSummaryList: OrderSummaryList,
			onTheOrderSummaryObjectPage: OrderSummaryObjectPage
        },
        async: true
    });

    return runner;
});

