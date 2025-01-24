function initializeDataTable(selector, ajaxUrl, columns) {

$(document).ready(function () {
    // Initialize DataTable with AJAX pagination
    $(selector).DataTable({
        processing: true,   // Show processing indicator
        serverSide: true,   // Enable server-side processing
        ajax: {
            url: ajaxUrl,    // URL for the AJAX request
            type: 'POST',    // Method type
            data: function (d) {
                // Add additional parameters (like search, sorting, filters) to the request
                return {
                    draw: d.draw,
                    start: d.start,
                    length: d.length,
                    search: d.search?.value || '',
                    order: d.order
                };
            }
        },
        columns: columns,
        responsive: true,
        // language: {
        //     emptyTable: 'No data available',
        //     processing: 'Loading...',
        //     search: 'Search:',
        //     lengthMenu: 'Show _MENU_ entries',
        //     info: 'Showing _START_ to _END_ of _TOTAL_ entries',
        //     infoEmpty: 'No entries available',
        //     infoFiltered: '(filtered from _MAX_ total entries)',
        // }

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
});
}