const order = [[0, 'desc']];
// Initialize DataTable with default settings
const searchData = [$('#fromDate').val(), $('#toDate').val()];
const currentDate = new Date();
const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1);

// Format dates to YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Set default values for date inputs without affecting AJAX search
$('#fromDate').val(formatDate(firstDayOfYear));
$('#toDate').val(formatDate(currentDate));
const options = 'Bfrtip'; // Position of buttons (B for Buttons, f for filter, r for processing)
const buttons = [
    'copy',       // Copy to clipboard
    'csv',        // Export to CSV
    'excel',      // Export to Excel
    'pdf',        // Export to PDF
    'print'       // Print the table
];

const columns = [
    { data: 'created_at' },
    { data: 'department' },
    { data: 'requestername' },
    { data: 'leave_type' },
    {
        data: 'status',
        render: function (data) {
            if (data === 'Pending') {
                return `<button class="btn btn-warning btn-sm">Pending</button>`;
            } else if (data === 'Approved') {
                return `<button class="btn btn-success btn-sm">Approved</button>`;
            } else if (data === 'Rejected') {
                return `<button class="btn btn-danger btn-sm">Rejected</button>`;
            } else {
                return `<button class="btn btn-secondary btn-sm">Unknown</button>`;
            }
        }
    },
    {
        data: 'id',
        render: function (data) {
            return `<a class="btn btn-sm btn-info" href="/leaves/leave-req-detail/${data}">View</a>`;
        }
    }
];

// Save the DataTable instance
const leaveRequestsTable = initializeDataTable('#leave-reqs-table', '/leaves/leave-req-ajax', columns, order, searchData, options, buttons);

// Apply filter button click event
$('#applyFilter').on('click', function () {
    const fromDate = $('#fromDate').val();
    const toDate = $('#toDate').val();

    // Update the searchData array with new values
    searchData[0] = fromDate;
    searchData[1] = toDate;

    // Reload the DataTable with updated filters
    leaveRequestsTable.ajax.reload();
});

