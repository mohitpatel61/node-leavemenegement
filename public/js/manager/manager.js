const order = [[0, 'desc']];
const columns = [
    { data: 'created_at' },
    { data: 'name' },
    { data: 'email' },
    { data: 'department' },
    { data: 'role' },
    {
        data: 'status',
        render: function (data, type, row) {
            return `<button class="btn btn-success">${data ? 'Active' : 'Pending'}</button>`;
        }
    },
    {
        data: 'id',
        render: function (data, type, row) {

            return `<a class="btn btn-sm btn-info" href="/manager/view-manager/${data}?type=view">View</a>
                    <a class="btn btn-sm btn-info" href="/manager/edit-manager/${data}?type=edit">Edit</a>
                            <button class="btn btn-sm btn-danger delete-manager" data-id="${data}">Delete</button>`;
        }
    }
];
initializeDataTable("#manager-table", '/manager/manager-ajax', columns, order);

// Handle Delete Button Click
$(document).on('click', '.delete-manager', function () {
    const managerId = $(this).data('id');  // Get employee ID from the button's data-id attribute

    if (confirm('Are you sure you want to mark this user as deleted?')) {
        $.ajax({
            url: `/manager/delete-manager/${managerId}`,
            method: 'PATCH',  // Use PATCH to update the employee record
            success: function (response) {
                if (response.success) {
                    // alert('User marked as deleted successfully');
                    $('#manager-table').DataTable().ajax.reload();  // Reload the DataTable to reflect the change
                } else {
                    alert('Failed to mark the user as deleted');
                }
            },
            error: function () {
                alert('An error occurred while marking the user as deleted');
            }
        });
    }
});