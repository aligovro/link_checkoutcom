/* API Includes */
var svc = require('dw/svc');

/* Utility */
var util = require('~/cartridge/scripts/helpers/ckoUtility');

/**
 * Initialize HTTP service for the Checkout.com sandbox full card charge.
 */
svc.ServiceRegistry.configure("cko.payment.actions.sandbox.service", {
    createRequest: function (svc, args) {
        // Prepare the http service
        svc.addHeader("Authorization", util.getAccountKeys().secretKey);
        svc.addHeader("User-Agent", util.getCartridgeMeta());
        svc.addHeader("Content-Type", 'application/json;charset=UTF-8');
        
        return (args) ? JSON.stringify(args) : null;
    },

    parseResponse: function (svc, resp) {
        return JSON.parse(resp.text);
    }
});

/**
 * Initialize HTTP service for the Checkout.com live full card charge.
 */
svc.ServiceRegistry.configure("cko.payment.actions.live.service", {
    createRequest: function (svc, args) {
        // Prepare the http service
        svc.addHeader("Authorization", util.getAccountKeys().secretKey);
        svc.addHeader("User-Agent", util.getCartridgeMeta());
        svc.addHeader("Content-Type", 'application/json;charset=UTF-8');
       
        return (args) ? JSON.stringify(args) : null;
    },

    parseResponse: function (svc, resp) {
        return JSON.parse(resp.text);
    }
});
