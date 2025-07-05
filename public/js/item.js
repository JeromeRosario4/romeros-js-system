$(document).ready(function () {
    const API_BASE_URL = 'http://localhost:4000/api/v1/';
    let currentItemId = null;
    let categories = []; // Store categories globally

    // Initialize DataTable
    const itemTable = $('#itable').DataTable({
        ajax: {
            url: API_BASE_URL + 'items',
            dataSrc: "rows",
            error: function(xhr, status, error) {
                console.error('AJAX Error:', status, error);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to load items. Please try again later.',
                    icon: 'error'
                });
            }
        },
        dom: 'Bfrtip',
        buttons: [
            'pdf',
            'excel',
            {
                text: '<i class="fas fa-plus"></i> Add Item',
                className: 'btn btn-primary',
                action: function () {
                    resetItemForm();
                    $('#itemModal').modal('show');
                    $('#modalTitle').text('Add New Item');
                    $('#itemSubmit').show();
                    $('#itemUpdate').hide();
                }
            }
        ],
        columns: [
            { data: 'item_id', title: 'ID' },
            { 
                data: 'image', 
                title: 'Image',
                render: function(data) {
                    return data ? `<img src="${API_BASE_URL.replace('/api/v1/', '')}${data}" class="img-thumbnail" width="50">` : 
                                 '<i class="fas fa-box-open fa-2x text-muted"></i>';
                }
            },
            { data: 'item_name', title: 'Item Name' },
            { data: 'description', title: 'Description' },
            { 
                data: 'category_id', 
                title: 'Category',
                render: function(data, type, row) {
                    // Find category name from stored categories
                    const category = categories.find(cat => cat.category_id == data);
                    return category ? category.description : 'N/A';
                }
            },
            { 
                data: 'cost_price', 
                title: 'Cost Price',
                render: function(data) {
                    return data ? `$${parseFloat(data).toFixed(2)}` : 'N/A';
                }
            },
            { 
                data: 'sell_price', 
                title: 'Sell Price',
                render: function(data) {
                    return data ? `$${parseFloat(data).toFixed(2)}` : 'N/A';
                }
            },
            { 
                data: 'quantity', 
                title: 'Stock',
                render: function(data) {
                    const badgeClass = data > 0 ? 'bg-success' : 'bg-danger';
                    return `<span class="badge ${badgeClass}">${data || 0}</span>`;
                }
            },
            {
                data: null,
                title: 'Actions',
                render: function(data) {
                    return `
                        <div class="btn-group">
                            <button class="btn btn-sm btn-warning editBtn me-1" data-id="${data.item_id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger deleteBtn" data-id="${data.item_id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                },
                orderable: false,
                searchable: false
            }
        ]
    });

    // Reset form and clear all fields
    function resetItemForm() {
        $('#iform')[0].reset();
        $('#itemId').remove();
        $('#imagePreview').empty();
        $('input[name="image"]').val('');
    }

    // Load item data for editing
    function loadItemForEdit(itemId) {
        $.ajax({
            method: "GET",
            url: API_BASE_URL + 'items/' + itemId,
            dataType: "json",
            success: function (response) {
                const item = response.result[0];
                $('#itemId').val(item.item_id);
                $('#itemName').val(item.item_name);
                $('#description').val(item.description);
                
                // Set category select value
                if (item.category_id) {
                    $('#category').val(item.category_id);
                }
                
                $('#costPrice').val(item.cost_price);
                $('#sellPrice').val(item.sell_price);
                $('#quantity').val(item.quantity);
                
                if (item.image) {
                    $('#imagePreview').html(`
                        <img src="${API_BASE_URL.replace('/api/v1/', '')}${item.image}" class="img-thumbnail" width="150">
                        <div class="form-check mt-2">
                            <input class="form-check-input" type="checkbox" id="removeImage" name="remove_image">
                            <label class="form-check-label" for="removeImage">Remove current image</label>
                        </div>
                    `);
                }
            },
            error: function (error) {
                Swal.fire('Error', 'Failed to load item data', 'error');
                console.error(error);
            }
        });
    }

    // Create new item
    $("#itemSubmit").on('click', function (e) {
        e.preventDefault();
        const formData = new FormData($('#iform')[0]);
        
        if (!formData.get('item_name') || !formData.get('cost_price') || !formData.get('sell_price')) {
            Swal.fire('Error', 'Please fill all required fields', 'error');
            return;
        }

        $.ajax({
            method: "POST",
            url: API_BASE_URL + 'items',
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            success: function (response) {
                Swal.fire('Success', 'Item created successfully', 'success');
                $("#itemModal").modal("hide");
                itemTable.ajax.reload();
            },
            error: function (xhr) {
                const errorMsg = xhr.responseJSON?.message || 'Failed to create item';
                Swal.fire('Error', errorMsg, 'error');
                console.error(xhr);
            }
        });
    });

    // Update existing item
    $("#itemUpdate").on('click', function (e) {
        e.preventDefault();
        const itemId = $('#itemId').val();
        const formData = new FormData($('#iform')[0]);
        
        if (!formData.get('item_name') || !formData.get('cost_price') || !formData.get('sell_price')) {
            Swal.fire('Error', 'Please fill all required fields', 'error');
            return;
        }

        $.ajax({
            method: "PUT",
            url: API_BASE_URL + 'items/' + itemId,
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            success: function (response) {
                Swal.fire('Success', 'Item updated successfully', 'success');
                $('#itemModal').modal("hide");
                itemTable.ajax.reload();
            },
            error: function (xhr) {
                const errorMsg = xhr.responseJSON?.message || 'Failed to update item';
                Swal.fire('Error', errorMsg, 'error');
                console.error(xhr);
            }
        });
    });

    // Edit button click handler
    $('#itable tbody').on('click', '.editBtn', function (e) {
        e.preventDefault();
        currentItemId = $(this).data('id');
        resetItemForm();
        $('#itemModal').modal('show');
        $('#modalTitle').text('Edit Item');
        $('#itemSubmit').hide();
        $('#itemUpdate').show();
        $('<input>').attr({ 
            type: 'hidden', 
            id: 'itemId', 
            name: 'item_id', 
            value: currentItemId 
        }).appendTo('#iform');
        loadItemForEdit(currentItemId);
    });

    // Delete button click handler
    $('#itable tbody').on('click', '.deleteBtn', function (e) {
        e.preventDefault();
        const itemId = $(this).data('id');
        const $row = $(this).closest('tr');

        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    method: "DELETE",
                    url: API_BASE_URL + 'items/' + itemId,
                    dataType: "json",
                    success: function (response) {
                        Swal.fire('Deleted!', response.message || 'Item deleted successfully', 'success');
                        itemTable.row($row).remove().draw();
                    },
                    error: function (xhr) {
                        const errorMsg = xhr.responseJSON?.message || 'Failed to delete item';
                        Swal.fire('Error', errorMsg, 'error');
                    }
                });
            }
        });
    });

    // Image preview handler
    $('input[name="image"]').change(function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $('#imagePreview').html(`<img src="${e.target.result}" class="img-thumbnail" width="150">`);
            }
            reader.readAsDataURL(file);
        }
    });

    // Load categories dropdown
    function loadCategories() {
        $.ajax({
            method: "GET",
            url: API_BASE_URL + 'categories',
            dataType: "json",
            success: function (response) {
                categories = response.rows || []; // Store categories globally
                const $select = $('#category');
                $select.empty();
                $select.append('<option value="">Select Category</option>');
                
                categories.forEach(category => {
                    $select.append(`<option value="${category.category_id}">${category.description}</option>`);
                });
            },
            error: function (error) {
                console.error('Failed to load categories:', error);
                Swal.fire('Error', 'Failed to load categories', 'error');
            }
        });
    }

    // Load categories when page loads
    loadCategories();
});