'use strict';


/* Site controller */
var SiteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');

/* API Includes */
var Transaction = require('dw/system/Transaction');
var Cart = require(SiteControllerName + '/cartridge/scripts/models/CartModel');
var app = require(SiteControllerName + '/cartridge/scripts/app');

/* Utility */
var apmUtility = require('~/cartridge/scripts/helpers/apmUtility');

/* APM Configuration */
var apmConfig = require('~/cartridge/scripts/config/ckoApmConfig');

/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields.
 * If the verification was successful a credit card payment instrument is created.
 */
function Handle(args) {

	
	// proceed with transaction
	var cart = Cart.get(args.Basket);
	var paymentMethod = args.PaymentMethodID;
	
	// proceed with transact
	Transaction.wrap(function(){
		cart.removeExistingPaymentInstruments(paymentMethod);
		
		var paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
	});
	
	return {success: true};

}


/**
 * Authorises a payment using a credit card. The payment is authorised by using the BASIC_CREDIT processor
 * only and setting the order no as the transaction ID. Customisations may use other processors and custom
 * logic to authorise credit card payment.
 */
function Authorize(args) {
	
	// Add order Number to session
	session.privacy.ckoOrderId = args.OrderNo;
	
	// get apms form
	var paymentForm = app.getForm('alternativePaymentForm');
	
	// get apm type chosen
	var apm = paymentForm.get('alternative_payments').value();	
	
	var func = apm + "PayAuthorization";
	
	// Get the required apm pay config object
	var payObject = apmConfig[func](args);
	
	
	apmUtility.apmAuthorization(payObject, args);
	
	return {success: false};

}




/*
 * Local methods
 */
exports.Handle = Handle;
exports.Authorize = Authorize;