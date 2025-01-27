function initializeDataTable(selector, ajaxUrl, columns, order = "", searchData = [],options="", buttons="") {
    return $(selector).DataTable({
        processing: true,   // Show processing indicator
        serverSide: true,   // Enable server-side processing
        ajax: {
            url: ajaxUrl,    // URL for the AJAX request
            type: 'POST',    // Method type
            data: function (d) {
                // Add additional parameters (like search, sorting, filters) to the request
                d.searchData = searchData; // Pass searchData to the server
                d.draw = d.draw;
                d.start = d.start;
                d.length = d.length;
                d.search = d.search?.value || '';
                d.order = d.order;
            }
        },
        columns: columns,
        responsive: true,

        order: order,
        dom: options, // Position of buttons (B for Buttons, f for filter, r for processing)
        buttons: buttons,
        language: {
            emptyTable: 'No data available',
            processing: 'Loading...',
            search: 'Search:',
            lengthMenu: 'Show _MENU_ entries',
            info: 'Showing _START_ to _END_ of _TOTAL_ entries',
            infoEmpty: 'No entries available',
            infoFiltered: '(filtered from _MAX_ total entries)',
            paginate: {
                first: 'First',
                last: 'Last',
                next: '>',
                previous: '<'
            }
        }
    });
}
