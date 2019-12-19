'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function(){
	buildTabs();
	buildTable();
}, false);

function buildTable() {
	// Prepare the table data
	var controllerUrl = jQuery('[id="transactionsControllerUrl"]');

	// Instantiate the table
	getTransactionData(controllerUrl);
}

function buildTabs() {
	// Get the active tab id
	var activeId = '[id="' + getCookie('ckoTabs') + '"]';
		
	// Activate current
	jQuery(activeId).removeClass('table_tabs_dis').addClass('table_tabs_en');
	jQuery(activeId).parent('td').removeClass('table_tabs_dis_background').addClass('table_tabs_en_background');
}

function setNavigationstate(path) {
	// Get the path members
	var members = path.split('/');
		
	// Set the cookie with controller name
	document.cookie = 'ckoTabs=' + members[members.length-1];
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function getTransactionData(controllerUrl) {
	jQuery.ajax({
		type: 'POST',
		url: controllerUrl,
		success: function (data) {
			initTable(data);
		},
		error: function (request, status, error) {
			console.log(error);
		}
	});
}

function initTable(tableData) {
	// Build the table instance
	var table = new Tabulator('#transactions-table', {
		height: 205,
		data: tableData, 
		layout: 'fitColumns',
		columns: getTableColumns()
	});
}

function getTableColumns() {
	return [
		{title: 'Order No', field: 'order_no', width: 150},
		{title: 'Transaction Id', field:'transaction_id'},
		{title: 'Amount', field: 'amount'},
		{title: 'Date', field: 'creation_date'},
		{title: 'Type', field: 'type'},
		{title: 'Processor', field: 'processor'},
	];
}