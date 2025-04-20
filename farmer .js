// Mock data for demonstration
let products = [];
let orders = [];

// Crop suggestions based on soil and season
const cropSuggestions = {
    'black-summer': ['Cotton', 'Sunflower', 'Sorghum'],
    'black-winter': ['Wheat', 'Chickpea', 'Safflower'],
    'black-monsoon': ['Soybean', 'Pigeon Pea', 'Green Gram'],
    'red-summer': ['Groundnut', 'Millet', 'Sesame'],
    'red-winter': ['Mustard', 'Barley', 'Lentils'],
    'red-monsoon': ['Rice', 'Corn', 'Black Gram'],
    'alluvial-summer': ['Sugarcane', 'Jute', 'Maize'],
    'alluvial-winter': ['Potato', 'Mustard', 'Peas'],
    'alluvial-monsoon': ['Rice', 'Cotton', 'Sugarcane'],
    'sandy-summer': ['Watermelon', 'Muskmelon', 'Cucumber'],
    'sandy-winter': ['Carrot', 'Radish', 'Turnip'],
    'sandy-monsoon': ['Groundnut', 'Bean', 'Cowpea']
};

// Tab Navigation
document.querySelectorAll('nav ul li').forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs
        document.querySelectorAll('nav ul li').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
    });
});

// AI Crop Suggestions
document.getElementById('suggestion-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const soilType = document.getElementById('soil-type').value;
    const season = document.getElementById('season').value;
    
    if (!soilType || !season) {
        alert('Please select both soil type and season');
        return;
    }
    
    const key = `${soilType}-${season}`;
    const suggestions = cropSuggestions[key] || [];
    
    const container = document.getElementById('suggestions-result');
    container.innerHTML = suggestions.map(crop => `
        <div class="suggestion-card">
            <h3>${crop}</h3>
            <p>Best suited for ${soilType} soil in ${season} season</p>
        </div>
    `).join('');
});

// Add New Product
document.getElementById('add-product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const product = {
        id: Date.now(),
        name: document.getElementById('product-name').value,
        quantity: document.getElementById('quantity').value,
        price: document.getElementById('price').value,
        availableFrom: document.getElementById('availability-date').value
    };
    
    products.push(product);
    updateProductsList();
    
    // Reset form
    e.target.reset();
    alert('Product added successfully!');
});

// Update Products List
function updateProductsList() {
    const container = document.getElementById('products-list');
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <h3>${product.name}</h3>
            <p>Quantity: ${product.quantity} kg</p>
            <p>Price: ₹${product.price}/kg</p>
            <p>Available from: ${formatDate(product.availableFrom)}</p>
        </div>
    `).join('');
}

// Generate mock orders
function generateMockOrders() {
    const mockBuyers = ['Fresh Mart', 'Organic Store', 'Wholesale Market', 'Food Processing Co.'];
    
    products.forEach(product => {
        if (Math.random() > 0.5) { // 50% chance of generating an order for each product
            orders.push({
                id: Date.now() + Math.random(),
                productId: product.id,
                productName: product.name,
                quantity: Math.floor(product.quantity * 0.5), // Order for 50% of available quantity
                buyer: mockBuyers[Math.floor(Math.random() * mockBuyers.length)],
                status: 'pending'
            });
        }
    });
    
    updateOrdersList();
}

// Update Orders List
function updateOrdersList() {
    const container = document.getElementById('orders-list');
    container.innerHTML = orders.map(order => `
        <div class="order-card" id="order-${order.id}">
            <h3>Order from ${order.buyer}</h3>
            <p>Product: ${order.productName}</p>
            <p>Quantity: ${order.quantity} kg</p>
            <div class="order-actions">
                ${order.status === 'pending' ? `
                    <button class="accept-btn" onclick="handleOrder(${order.id}, 'accept')">Accept</button>
                    <button class="reject-btn" onclick="handleOrder(${order.id}, 'reject')">Reject</button>
                ` : `
                    <p>Status: ${order.status}</p>
                `}
            </div>
        </div>
    `).join('');
}

// Handle Order Accept/Reject
function handleOrder(orderId, action) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = action === 'accept' ? 'accepted' : 'rejected';
        updateOrdersList();
    }
}

// Format date for display
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Generate mock orders every minute (simulating real-time orders)
setInterval(generateMockOrders, 60000);

// Initial setup
updateProductsList();
updateOrdersList();
