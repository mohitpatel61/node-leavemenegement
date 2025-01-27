// Initialize DataTable with default settings
const order = [[0, 'desc']];
const columns = [
    { data: 'created_at' },
    { data: 'name' },
    { data: 'email' },
    { data: 'department' },
    { data: 'role' },
    { data: 'manager' },
    {
        data: 'status',
        render: function (data, type, row) {
            return `<button class="btn btn-success">${data ? 'Active' : 'Pending'}</button>`;

        }
    },
    {
        data: 'id',
        render: function (data, type, row) {
            return `
            <a class="btn btn-sm btn-info" href="/employee/view-emp/${data}?type=view">View</a>
            <a class="btn btn-sm btn-edit" href="/employee/edit-emp/${data}?type=edit">Edit</a>
            <button class="btn btn-sm btn-danger delete-emp" data-id="${data}">Delete</button>`;
        }
    }
];
initializeDataTable('#employees-table', '/employee/emp-ajax', columns, order);
// Handle Delete Button Click
$(document).on('click', '.delete-emp', function () {
    const empId = $(this).data('id');  // Get employee ID from the button's data-id attribute

    if (confirm('Are you sure you want to mark this employee as deleted?')) {
        $.ajax({
            url: `/employee/delete-emp/${empId}`,
            method: 'PATCH',  // Use PATCH to update the employee record
            success: function (response) {
                if (response.success) {
                    alert('Employee marked as deleted successfully');
                    $('#employees-table').DataTable().ajax.reload();  // Reload the DataTable to reflect the change
                } else {
                    alert('Failed to mark the employee as deleted');
                }
            },
            error: function () {
                alert('An error occurred while marking the employee as deleted');
            }
        });
    }
});

$('#excelData').on('change' ,function(){
 console.log("hee0000");
})