'use strict';

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/**
 * Utility functions.
 */
var applePayHelper = {
    /**
     * Handle the payment request.
     * @param {Object} paymentData The payment data
     * @param {string} processorId The processor ID
     * @param {string} orderNumber The order number
     * @returns {boolean} The request success or failure
     */
    handleRequest: function(paymentData, processorId, orderNumber) {
        // Load the order information
        var order = OrderMgr.getOrder(orderNumber);

        // Prepare the parameters
        var tokenRequest = {
            type: 'applepay',
            token_data: JSON.parse(paymentData),
        };

        // Log the payment token request data
        ckoHelper.log(processorId + ' ' + ckoHelper._('cko.tokenrequest.data', 'cko'), tokenRequest);

        // Perform the request to the payment gateway
        var tokenResponse = ckoHelper.gatewayClientRequest(
            'cko.network.token.' + ckoHelper.getValue('ckoMode') + '.service',
            JSON.stringify(tokenRequest)
        );

        // Log the payment token response data
        ckoHelper.log(processorId + ' ' + ckoHelper._('cko.tokenresponse.data', 'cko'), tokenResponse);

        // If the request is valid, process the response
        if (tokenResponse && Object.prototype.hasOwnProperty.call(tokenResponse, 'token')) {
            var gatewayRequest = {
                source: {
                    type: 'token',
                    token: tokenResponse.token,
                },
                amount: ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), order.getCurrencyCode()),
                currency: order.getCurrencyCode(),
                reference: order.orderNo,
                capture: ckoHelper.getValue('ckoAutoCapture'),
                capture_on: ckoHelper.getCaptureTime(),
                customer: ckoHelper.getCustomer(order),
                billing_descriptor: ckoHelper.getBillingDescriptor(),
                shipping: ckoHelper.getShipping(order),
                metadata: ckoHelper.getMetadata({}, processorId),
            };

            // Log the payment request data
            ckoHelper.log(processorId + ' ' + ckoHelper._('cko.request.data', 'cko'), gatewayRequest);

            // Perform the request to the payment gateway
            var gatewayResponse = ckoHelper.gatewayClientRequest(
                'cko.card.charge.' + ckoHelper.getValue('ckoMode') + '.service',
                gatewayRequest
            );

            // Log the payment response data
            ckoHelper.log(processorId + ' ' + ckoHelper._('cko.response.data', 'cko'), gatewayRequest);

            // Process the response
            return gatewayResponse && this.handleResponse(gatewayResponse);
        }
    },

    /**
     * Handle the payment response.
     * @param {Object} gatewayResponse The gateway response data
     * @returns {boolean} The payment success or failure
     */
    handleResponse: function(gatewayResponse) {
        // Update customer data
        ckoHelper.updateCustomerData(gatewayResponse);

        return ckoHelper.paymentSuccess(gatewayResponse);
    },
};

/**
 * Module exports
 */
module.exports = applePayHelper;
