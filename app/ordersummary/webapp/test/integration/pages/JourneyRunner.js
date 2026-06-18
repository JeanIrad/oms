sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"ordersummary/test/integration/pages/OrderSummaryList",
	"ordersummary/test/integration/pages/OrderSummaryObjectPage"
], function (JourneyRunner, OrderSummaryList, OrderSummaryObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('ordersummary') + '/test/flp.html#app-preview',
        pages: {
			onTheOrderSummaryList: OrderSummaryList,
			onTheOrderSummaryObjectPage: OrderSummaryObjectPage
        },
        async: true
    });

    return runner;
});

