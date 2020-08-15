'use strict';

/* API Includes */
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

/**
 * Payment helper module.
 */
var paymentHelper = {
    /**
     * Get the confirmation page redirection.
     * @param {Object} res The HTTP response object
     * @param {Object} order The order instance
     */
    getConfirmationPageRedirect: function(res, order) {
        res.redirect(
            URLUtils.url(
                'Order-Confirm',
                'ID',
                order.orderNo,
                'token',
                order.orderToken
            ).toString()
        );
    },

    /**
     * Get the failure page redirection.
     * @param {Object} res The HTTP response object
     */
    getFailurePageRedirect: function(res) {

        var logger = require('dw/system/Logger').getLogger('ckodebug');
        logger.debug('bbbz {0}', URLUtils.url(
            'Checkout-Begin',
            'stage',
            'payment',
            'paymentError',
            Resource.msg('error.payment.not.valid', 'checkout', null)
        ).toString());
        
        res.redirect(
            URLUtils.url(
                'Checkout-Begin',
                'stage',
                'payment',
                'paymentError',
                Resource.msg('error.payment.not.valid', 'checkout', null)
            ).toString()
        );
    },
};

/**
 * Module exports
 */
module.exports = paymentHelper;
