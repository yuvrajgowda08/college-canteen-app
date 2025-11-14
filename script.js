// Main JavaScript for the canteen ordering system

// DOM Ready function
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize any global functionality
    console.log('Canteen app initialized');
    
    // Add event listeners for dynamic elements
    if (document.getElementById('orderForm')) {
        initializeOrderForm();
    }
}

// Order Form functionality
function initializeOrderForm() {
    updateOrderSummary();
    
    // Add event listeners for quantity changes
    document.querySelectorAll('.qty-btn').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.getAttribute('data-item-id');
            const change = parseInt(this.getAttribute('data-change'));
            updateQuantity(itemId, change);
        });
    });
}

// Update item quantity
function updateQuantity(itemId, change) {
    const input = document.getElementById('qty-' + itemId);
    let currentValue = parseInt(input.value) || 0;
    currentValue += change;
    
    if (currentValue < 0) currentValue = 0;
    input.value = currentValue;
    
    updateOrderSummary();
}

// Update order summary
function updateOrderSummary() {
    const formData = new FormData(document.getElementById('orderForm'));
    let total = 0;
    let summaryHTML = '';
    let hasItems = false;
    
    // Get all quantity inputs
    const quantityInputs = document.querySelectorAll('input[name^="items["]');
    
    quantityInputs.forEach(input => {
        const quantity = parseInt(input.value) || 0;
        if (quantity > 0) {
            const itemId = input.name.match(/\[(.*?)\]/)[1];
            const menuItem = document.querySelector(`[data-item-id="${itemId}"]`);
            
            if (menuItem) {
                const itemName = menuItem.getAttribute('data-item-name');
                const itemPrice = parseFloat(menuItem.getAttribute('data-item-price'));
                const itemTotal = itemPrice * quantity;
                total += itemTotal;
                
                summaryHTML += `
                    <div class="summary-item">
                        <span class="item-name">${itemName}</span>
                        <span class="item-quantity">${quantity} x ₹${itemPrice}</span>
                        <span class="item-total">₹${itemTotal.toFixed(2)}</span>
                    </div>
                `;
                hasItems = true;
            }
        }
    });
    
    if (!hasItems) {
        summaryHTML = '<p class="empty-cart">Your cart is empty</p>';
    }
    
    document.getElementById('summaryItems').innerHTML = summaryHTML;
    document.getElementById('totalAmount').textContent = total.toFixed(2);
    
    // Enable/disable order button based on items
    const orderButton = document.querySelector('#orderForm button[type="submit"]');
    if (orderButton) {
        orderButton.disabled = !hasItems;
    }
}

// Place order function
function placeOrder(event) {
    event.preventDefault();
    
    const formData = new FormData(document.getElementById('orderForm'));
    const items = {};
    let hasItems = false;
    
    for (const [key, value] of formData.entries()) {
        if (key.startsWith('items[')) {
            const itemId = key.match(/\[(.*?)\]/)[1];
            const quantity = parseInt(value);
            if (quantity > 0) {
                items[itemId] = quantity;
                hasItems = true;
            }
        }
    }
    
    if (!hasItems) {
        showMessage('Please add items to your order', 'error');
        return;
    }
    
    // Show loading state
    const orderButton = document.querySelector('#orderForm button[type="submit"]');
    const originalText = orderButton.textContent;
    orderButton.textContent = 'Placing Order...';
    orderButton.disabled = true;
    
    fetch('/order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: items }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage(`Order placed successfully! Order ID: ${data.orderId}`, 'success');
            // Reset form
            document.getElementById('orderForm').reset();
            updateOrderSummary();
            
            // Optional: Redirect to order confirmation page
            // setTimeout(() => {
            //     window.location.href = '/order-confirmation?id=' + data.orderId;
            // }, 2000);
        } else {
            showMessage(data.error || 'Failed to place order. Please try again.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    })
    .finally(() => {
        // Restore button state
        orderButton.textContent = originalText;
        orderButton.disabled = false;
    });
}

// Show message to user
function showMessage(message, type) {
    const messageEl = document.getElementById('orderMessage');
    if (!messageEl) {
        // Create message element if it doesn't exist
        const newMessageEl = document.createElement('div');
        newMessageEl.id = 'orderMessage';
        newMessageEl.className = `alert ${type}`;
        newMessageEl.textContent = message;
        newMessageEl.style.display = 'block';
        
        const form = document.getElementById('orderForm');
        if (form) {
            form.parentNode.insertBefore(newMessageEl, form.nextSibling);
        }
    } else {
        messageEl.textContent = message;
        messageEl.className = `alert ${type}`;
        messageEl.style.display = 'block';
    }
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
}

// Tab switching for login/register
function showTab(tabName) {
    // Hide all forms
    document.querySelectorAll('.form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected form and activate button
    document.getElementById(tabName + 'Form').classList.add('active');
    event.currentTarget.classList.add('active');
}

// Admin order status update
function updateOrderStatus(orderId) {
    const selectElement = document.getElementById('status-' + orderId);
    const status = selectElement.value;
    
    // Show loading state
    const updateButton = event.target;
    const originalText = updateButton.textContent;
    updateButton.textContent = 'Updating...';
    updateButton.disabled = true;
    
    fetch('/admin/update-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            orderId: orderId, 
            status: status 
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAdminMessage('Order status updated successfully!', 'success');
            
            // Visual feedback
            const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
            orderCard.classList.add('status-updated');
            
            setTimeout(() => {
                orderCard.classList.remove('status-updated');
            }, 2000);
        } else {
            showAdminMessage('Failed to update order status: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAdminMessage('Failed to update order status', 'error');
    })
    .finally(() => {
        // Restore button state
        updateButton.textContent = originalText;
        updateButton.disabled = false;
    });
}

// Admin message display
function showAdminMessage(message, type) {
    // Create or update message element
    let messageEl = document.getElementById('adminMessage');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'adminMessage';
        document.querySelector('main').insertBefore(messageEl, document.querySelector('main').firstChild);
    }
    
    messageEl.textContent = message;
    messageEl.className = `alert ${type}`;
    messageEl.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}

// Search functionality for menu
function searchMenu() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const itemName = item.querySelector('h4').textContent.toLowerCase();
        const itemDescription = item.querySelector('p').textContent.toLowerCase();
        
        if (itemName.includes(searchTerm) || itemDescription.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Filter menu by category
function filterCategory(category) {
    const categorySections = document.querySelectorAll('.category-section');
    
    categorySections.forEach(section => {
        const sectionCategory = section.querySelector('h3').textContent.toLowerCase();
        
        if (category === 'all' || sectionCategory.includes(category.toLowerCase())) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
}