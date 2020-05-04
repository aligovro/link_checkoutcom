'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var applePayHelper = require('~/cartridge/scripts/helpers/applePayHelper');

/**
 * Verifies that the payment data is valid.
 */
function Handle(basket, paymentInformation, processorId) {
    var currentBasket = basket;
    var cardErrors = {};
    var serverErrors = [];

    // Prepare the payment data
    session.custom.paymentData = paymentInformation.ckoApplePayData.value;

    // Verify the payload
    if (!paymentInformation.ckoApplePayData || paymentInformation.ckoApplePayData.length == 0) {
        serverErrors.push(
            Resource.msg('error.card.information.error', 'creditCard', null)
        );

        return {
            fieldErrors: [cardErrors],
            serverErrors: serverErrors,
            error: true
        };
    }

    Transaction.wrap(function () {
        // Remove existing payment instruments
        var paymentInstruments = currentBasket.getPaymentInstruments(
            processorId
        );

        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        // Create a new payment instrument
        var paymentInstrument = currentBasket.createPaymentInstrument(
            processorId, currentBasket.totalGrossPrice
        );
    });

    return {
        fieldErrors: cardErrors,
        serverErrors: serverErrors,
        error: false
    };
}

/**
 * Authorizes a payment using an Apple Pay card token
 */
function Authorize(orderNumber, processorId) {
    var serverErrors = [];
    var fieldErrors = {};

    // Payment request
    var success = applePayHelper.handleRequest(orderNumber, processorId);

    return {
        fieldErrors: fieldErrors,
        serverErrors: serverErrors,
        error: !success
    };
}

exports.Handle = Handle;
exports.Authorize = Authorize;