"use strict"

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var CustomerMgr = require('dw/customer/CustomerMgr');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/*
* Utility functions for my cartridge integration.
*/
var cardHelper = {
    /*
     * Handle the payment request.
     */
    handleRequest: function (paymentData, processorId, orderNumber, req) {  
        // Order number
        orderNumber = orderNumber || null;

        // Build the request data
        var gatewayRequest = this.buildRequest(paymentData, processorId, orderNumber);

        // Log the payment request data
        ckoHelper.doLog(processorId + ' ' + ckoHelper._('cko.request.data', 'cko'), gatewayRequest);

        // Perform the request to the payment gateway
        var gatewayResponse = ckoHelper.gatewayClientRequest(
            "cko.card.charge." + ckoHelper.getValue('ckoMode') + ".service",
            gatewayRequest
        );

        // Log the payment response data
        ckoHelper.doLog(processorId + ' ' + ckoHelper._('cko.response.data', 'cko'), gatewayResponse);

        // Process the response
        return this.handleResponse(gatewayResponse, paymentData, processorId, req);
    },

    /*
     * Handle the payment response
     */
    handleResponse: function (gatewayResponse, paymentData, processorId, req) {
        // Prepare the result
        var result = {
            error: !ckoHelper.paymentSuccess(gatewayResponse),
            redirectUrl: false
        }

        // Handle the response
        if (gatewayResponse) {
            // Update customer data
            ckoHelper.updateCustomerData(gatewayResponse);

            // Handle the save card request
            var condition1 = paymentData.creditCardFields.saveCard.value;
            var condition2 = ckoHelper.paymentSuccess(gatewayResponse);
            if (condition1 && condition2) {
                // Save the card
                this.saveCard(
                    paymentData,
                    req,
                    gatewayResponse,
                    processorId
                );
            }
        
            // Add 3DS redirect URL to session if exists
            var condition3 = gatewayResponse.hasOwnProperty('_links');
            var condition4 = condition1 && gatewayResponse._links.hasOwnProperty('redirect');
            if (condition3 && condition4) {
                result.error = false;
                result.redirectUrl = gatewayResponse._links.redirect.href;
            }
        }

        return result;
    },

    /*
     * Build the gateway request
     */
    buildRequest: function (paymentData, processorId, orderNumber) {
        //  Load the order
        var order = OrderMgr.getOrder(orderNumber);
      
        // Prepare the charge data
        var chargeData = {
            'source'                : this.getCardSource(paymentData, order, processorId),
            'amount'                : ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), order.getCurrencyCode()),
            'currency'              : order.getCurrencyCode(),
            'reference'             : order.orderNo,
            'capture'               : ckoHelper.getValue('ckoAutoCapture'),
            'capture_on'            : ckoHelper.getCaptureTime(),
            'customer'              : ckoHelper.getCustomer(order),
            'billing_descriptor'    : ckoHelper.getBillingDescriptor(),
            'shipping'              : ckoHelper.getShipping(order),
            '3ds'                   : this.get3Ds(),
            'risk'                  : {enabled: true},
            'metadata'              : ckoHelper.getMetadata({}, processorId)
        };   
    
        return chargeData;
    },


    /*
     * Get a card source
     */
    getCardSource: function (paymentData, order, processorId) {              
        // Replace selectedCardUuid by get saved card token from selectedCardUuid
        var cardSource;
        var selectedCardUuid = paymentData.savedCardForm.selectedCardUuid.value;
        var selectedCardCvv = paymentData.savedCardForm.selectedCardCvv.value;

        // If the saved card data is valid
        var condition1 = selectedCardCvv && selectedCardCvv.length > 0;
        var condition2 = selectedCardUuid && selectedCardUuid.length > 0;
        if (condition1 && condition2) {
            // Get the saved card
            var savedCard = this.getSavedCard(
                selectedCardUuid.toString(),
                order.getCustomerNo(),
                processorId
            );
           
            cardSource = {
                type: 'id',
                id: savedCard.getCreditCardToken(),
                cvv: selectedCardCvv.toString()
            };
        }
        else {
            cardSource = {
                type                : 'card',
                number              : ckoHelper.getFormattedNumber(paymentData.creditCardFields.cardNumber.value.toString()),
                expiry_month        : paymentData.creditCardFields.expirationMonth.value.toString(),
                expiry_year         : paymentData.creditCardFields.expirationYear.value.toString(),
                cvv                 : paymentData.creditCardFields.securityCode.value.toString()
            };
        }

        return cardSource;
    },

    /*
     * Build 3ds object
     */
    get3Ds: function () {
        return {
            'enabled' : ckoHelper.getValue('cko3ds'),
            'attempt_n3d' : ckoHelper.getValue('ckoN3ds')
        }
    },

    /*
     * Get a customer saved card
     */
    getSavedCard: function (cardUuid, customerNo, processorId) {
        // Get the customer
        var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);

        // Get the customer wallet
        var wallet = customer.getProfile().getWallet();

        // Get the existing payment instruments
        var paymentInstruments = wallet.getPaymentInstruments(processorId);

        // Match the saved card
        for (var i = 0; i < paymentInstruments.length; i++) {
            var card = paymentInstruments[i];
            if (card.getUUID() == cardUuid) {
                return card;
            }
        } 
        
        return null;
    },

    /*
     * Save a card in customer account
     */
    saveCard: function (paymentData, req, authResponse, processorId) {
        // Get the customer profile
        var customerNo = req.currentCustomer.profile.customerNo;
        var customerProfile = CustomerMgr.getCustomerByCustomerNumber(customerNo).getProfile();
    
        // Build the customer full name
        var fullName = this.getCustomerFullName(customerProfile); 
    
        // Get the customer wallet
        var wallet = customerProfile.getWallet();
    
        // Get the existing payment instruments
        var paymentInstruments = wallet.getPaymentInstruments(processorId);
    
        // Check for duplicates
        var cardExists = false;
        for (var i = 0; i < paymentInstruments.length; i++) {
            var card = paymentInstruments[i];
            if (card.getCreditCardToken() == authResponse.source.id) {
                cardExists = true;
                break;
            }
        }       
    
        // Create a stored payment instrument
        if (!cardExists) {
            Transaction.wrap(function () {
                var storedPaymentInstrument = wallet.createPaymentInstrument(processorId);
                storedPaymentInstrument.setCreditCardHolder(fullName);
                storedPaymentInstrument.setCreditCardNumber(paymentData.creditCardFields.cardNumber.value);
                storedPaymentInstrument.setCreditCardType(authResponse.source.scheme.toLowerCase());
                storedPaymentInstrument.setCreditCardExpirationMonth(paymentData.creditCardFields.expirationMonth.value);
                storedPaymentInstrument.setCreditCardExpirationYear(paymentData.creditCardFields.expirationYear.value);
                storedPaymentInstrument.setCreditCardToken(authResponse.source.id);
            });
        }
    },

    getCustomerFullName: function(customerProfile) { 
        var customerName = '';
        customerName += customerProfile.firstName;
        customerName += ' ' + customerProfile.lastName;
        
        return customerName;
    }
}

/*
* Module exports
*/
module.exports = cardHelper;