"use strict";

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function () {
    // Initialize the APM accordion
    initApmAccordion();
}, false);

/*
 * Set APM Forms
 */
function initApmAccordion()
{
    // List item radio click action
    $('.cko-apm-accordion input[type="radio"]').on('click touch', function(e) {
        e.stopPropagation();

        $(this).parents('.cko-apm-accordion').trigger('click');
    });

    // List item click action
    $('.cko-apm-accordion').on('click touch', function(e) {
        // Prevent the form submission
        e.preventDefault();

        // Uncheck all radio buttons
        $('.cko-apm-accordion input[type="radio"]').prop('checked', false);
        
        // Activate the input
        $(this).children('input[type="radio"]').prop('checked', true);

        // Remove all active classes
        $('.cko-apm-accordion').removeClass('cko-apm-active');

        // Close all items
        $('.cko-apm-panel').css('maxHeight', '0px');
        $('.cko-apm-panel').removeClass('cko-apm-panel-opened');

        // Set the active element
        $(this).addClass('cko-apm-active');

        // Set the selected APM fields
        var apmId = $(this).parents('.apm-list-item').attr('id');
        $('input[name="dwfrm_billing_apmForm_ckoSelectedApm"]').val(apmId);

        // Run the validation event
        initCheckoutcomApmValidation();

        // Open the sibling panel
        var panel = $(this).next();
        panel.addClass('cko-apm-panel-opened');
        if (panel.css('maxHeight') != '0px') {
            panel.css('maxHeight', '0px');
        } else {
            panel.css('maxHeight', (panel.prop('scrollHeight') + 20) + 'px');
        } 
    });
}

/*
 * Get the APMs filter
 */
function filterApm()
{   
    // Get the APM controller URL
    var controllerUrl = $('#ckoApmFilterUrl').val();

    // Send the APM filter AJAX request
    var xhttpFilter = new XMLHttpRequest();
    xhttpFilter.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            // Get the APM countries and currencies list
            var apmList = JSON.parse(this.responseText);

            // Get the user country and currency
            var userData = apmList.filterObject;

            // Display only the allowed APM for the user
            var dataArray = apmList.ckoApmFilterConfig;
            for (var item in dataArray) {            
                var condition1 = dataArray[item].countries.includes(userData.country.toUpperCase()) && dataArray[item].currencies.includes(userData.currency);
                var condition2 = dataArray[item].countries.includes('*') && dataArray[item].currencies.includes('*');
                //if (condition1 || condition2) {
                    $('#'+ item).css('display', 'block');
                //}
            }
        }
    };
    
    xhttpFilter.open('GET', controllerUrl, true);
    xhttpFilter.send();
}

function initCheckoutcomApmValidation() {
    // Submit event
    $('button.submit-payment').off('click touch').one('click touch', function (e) {
        if ($('input[name="dwfrm_billing_paymentMethod"]').val() == 'CHECKOUTCOM_APM') {
            // Errors count
            var errors = {};

            // Get the APM container id
            var apmId = $('.cko-apm-active').parents('.apm-list-item').attr('id');

            // Build the form validation function name
            var func = apmId + 'FormValidation';
            
            // Run the form validation
            if (typeof window[func] === "function") {
                errors = window[func]();
                if (errors.length > 0) {
                    // Prevent the default button click behaviour
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    // Add the invalid UI elements
                    $(errors[0]).addClass('is-invalid');
                    $(errors[0]).next('.invalid-field-message').show();
                    $(errors[0]).next('.invalid-field-message').text(
                        window.ckoLang.apmFieldInvalid
                    );

                    // Scroll back to the error
                    var scrollTarget = $(errors[0]).parent().closest('div');
                    $('html, body').animate({
                        scrollTop: parseInt(scrollTarget.offset().top)
                    }, 500);
                }
            }
        }
    }); 
}
