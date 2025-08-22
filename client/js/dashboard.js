import { BASE_PRODUCT_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Check if user is logged in
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Set user greeting
    document.getElementById('userGreeting').textContent = `Welcome, ${user.firstName || 'User'}!`;

    // Load products and dashboard data on page load
    loadProducts();
    loadDashboardStats();

    // Event listeners
    document.getElementById('productForm').addEventListener('submit', handleCreateProduct);
    document.getElementById('editProductForm').addEventListener('submit', handleEditProduct);
    document.getElementById('saveProductBtn').addEventListener('click', handleEditProduct);
    document.getElementById('stockUpdateForm').addEventListener('submit', handleStockUpdate);
    document.getElementById('updateStockBtn').addEventListener('click', handleStockUpdate);
    document.getElementById('refreshProducts').addEventListener('click', loadProducts);
    document.getElementById('viewReorderProducts').addEventListener('click', viewReorderProducts);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    async function loadProducts() {
        try {
            const response = await fetch(BASE_PRODUCT_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                displayProducts(data.data);
                updateDashboardStats(data.data);
            } else {
                console.error('Failed to load products');
                if (response.status === 401) {
                    handleLogout();
                }
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    async function loadDashboardStats() {
        try {
            const response = await fetch(`${BASE_PRODUCT_URL}/all`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                updateDashboardStats(data.data);
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    function updateDashboardStats(products) {
        const totalProducts = products.length;
        const lowStockItems = products.filter(p => p.stockQuantity <= p.reorderLevel).length;
        const totalStockValue = products.reduce((sum, p) => sum + (p.stockQuantity * p.price), 0);
        const uniqueCategories = new Set(products.map(p => p.category)).size;

        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('lowStockItems').textContent = lowStockItems;
        document.getElementById('totalStockValue').textContent = `$${totalStockValue.toFixed(2)}`;
        document.getElementById('totalCategories').textContent = uniqueCategories;
    }

    function displayProducts(products) {
        const container = document.getElementById('productsContainer');
        
        if (products.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No products yet. Add your first product!</p>';
            return;
        }

        const productsHTML = products.map(product => {
            const stockStatus = product.stockQuantity <= product.reorderLevel ? 'warning' : 'success';
            const stockText = product.stockQuantity <= product.reorderLevel ? 'Low Stock' : 'In Stock';
            
            return `
                <div class="card mb-3 ${!product.isActive ? 'opacity-75' : ''}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <h6 class="card-title ${!product.isActive ? 'text-decoration-line-through' : ''}">
                                    ${product.name} <small class="text-muted">(${product.sku})</small>
                                </h6>
                                <p class="card-text text-muted">${product.description || 'No description'}</p>
                                <div class="row">
                                    <div class="col-md-6">
                                        <small class="text-muted">Price: <strong>$${product.price}</strong></small><br>
                                        <small class="text-muted">Stock: <strong>${product.stockQuantity} units</strong></small>
                                    </div>
                                    <div class="col-md-6">
                                        <small class="text-muted">Category: <strong>${product.category}</strong></small><br>
                                        <small class="text-muted">Reorder Level: <strong>${product.reorderLevel}</strong></small>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex flex-column align-items-end">
                                <span class="badge bg-${stockStatus} mb-2">${stockText}</span>
                                <span class="badge bg-secondary mb-2">${product.category}</span>
                                <div class="btn-group-vertical btn-group-sm">
                                    <button class="btn btn-outline-primary btn-sm" onclick="editProduct('${product.id}')">
                                        Edit
                                    </button>
                                    <button class="btn btn-outline-info btn-sm" onclick="updateStock('${product.id}', '${product.name}', ${product.stockQuantity})">
                                        Update Stock
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm" onclick="deleteProduct('${product.id}')">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                        ${!product.isActive ? 
                            '<div class="mt-2"><span class="badge bg-danger">Inactive</span></div>' : ''
                        }
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = productsHTML;
    }

    async function handleCreateProduct(e) {
        e.preventDefault();

        const productData = {
            name: document.getElementById('productName').value,
            sku: document.getElementById('productSku').value,
            description: document.getElementById('productDescription').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stockQuantity: parseInt(document.getElementById('productStock').value),
            reorderLevel: parseInt(document.getElementById('productReorderLevel').value),
            category: document.getElementById('productCategory').value
        };

        try {
            const response = await fetch(BASE_PRODUCT_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });

            if (response.ok) {
                showToast('Product created successfully!', 'success');
                document.getElementById('productForm').reset();
                loadProducts();
            } else {
                const data = await response.json();
                showToast(data.message || 'Failed to create product', 'danger');
            }
        } catch (error) {
            showToast('An error occurred', 'danger');
            console.error('Create product error:', error);
        }
    }

    async function handleEditProduct(e) {
        e.preventDefault();

        const productId = document.getElementById('editProductId').value;
        const productData = {
            name: document.getElementById('editProductName').value,
            sku: document.getElementById('editProductSku').value,
            description: document.getElementById('editProductDescription').value,
            price: parseFloat(document.getElementById('editProductPrice').value),
            stockQuantity: parseInt(document.getElementById('editProductStock').value),
            reorderLevel: parseInt(document.getElementById('editProductReorderLevel').value),
            category: document.getElementById('editProductCategory').value,
            isActive: document.getElementById('editProductActive').checked
        };

        try {
            const response = await fetch(`${BASE_PRODUCT_URL}/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });

            if (response.ok) {
                showToast('Product updated successfully!', 'success');
                bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
                loadProducts();
            } else {
                const data = await response.json();
                showToast(data.message || 'Failed to update product', 'danger');
            }
        } catch (error) {
            showToast('An error occurred', 'danger');
            console.error('Update product error:', error);
        }
    }

    async function handleStockUpdate(e) {
        e.preventDefault();

        const productId = document.getElementById('stockUpdateProductId').value;
        const quantity = parseInt(document.getElementById('stockQuantity').value);
        const operation = document.getElementById('stockOperation').value;

        try {
            const response = await fetch(`${BASE_PRODUCT_URL}/${productId}/stock`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ quantity, operation })
            });

            if (response.ok) {
                showToast('Stock updated successfully!', 'success');
                bootstrap.Modal.getInstance(document.getElementById('stockUpdateModal')).hide();
                loadProducts();
            } else {
                const data = await response.json();
                showToast(data.message || 'Failed to update stock', 'danger');
            }
        } catch (error) {
            showToast('An error occurred', 'danger');
            console.error('Update stock error:', error);
        }
    }

    async function viewReorderProducts() {
        try {
            const response = await fetch(`${BASE_PRODUCT_URL}/reorder`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                displayProducts(data.data);
                showToast(`Showing ${data.data.length} products that need reordering`, 'info');
            } else {
                showToast('Failed to load reorder list', 'danger');
            }
        } catch (error) {
            showToast('An error occurred', 'danger');
            console.error('Reorder products error:', error);
        }
    }

    // Make functions global for onclick handlers
    window.editProduct = async function(productId) {
        try {
            const response = await fetch(`${BASE_PRODUCT_URL}/${productId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const product = data.data;

                document.getElementById('editProductId').value = product.id;
                document.getElementById('editProductName').value = product.name;
                document.getElementById('editProductSku').value = product.sku;
                document.getElementById('editProductDescription').value = product.description || '';
                document.getElementById('editProductPrice').value = product.price;
                document.getElementById('editProductStock').value = product.stockQuantity;
                document.getElementById('editProductReorderLevel').value = product.reorderLevel;
                document.getElementById('editProductCategory').value = product.category;
                document.getElementById('editProductActive').checked = product.isActive;

                new bootstrap.Modal(document.getElementById('editProductModal')).show();
            }
        } catch (error) {
            console.error('Error loading product for edit:', error);
        }
    };

    window.updateStock = function(productId, productName, currentStock) {
        document.getElementById('stockUpdateProductId').value = productId;
        document.getElementById('stockUpdateProductName').textContent = productName;
        document.getElementById('stockUpdateCurrentStock').textContent = currentStock;
        document.getElementById('stockQuantity').value = '';
        document.getElementById('stockOperation').value = 'add';

        new bootstrap.Modal(document.getElementById('stockUpdateModal')).show();
    };

    window.deleteProduct = async function(productId) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            const response = await fetch(`${BASE_PRODUCT_URL}/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                showToast('Product deleted successfully!', 'success');
                loadProducts();
            } else {
                const data = await response.json();
                showToast(data.message || 'Failed to delete product', 'danger');
            }
        } catch (error) {
            showToast('An error occurred', 'danger');
            console.error('Delete product error:', error);
        }
    };

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }

    function showToast(message, type) {
        const toastContainer = document.getElementById('message');
        const toastHTML = `
            <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        toastContainer.innerHTML = toastHTML;
        const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'));
        toast.show();
    }
}); 