// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    loadProducts();
    loadOrders();
    setupEventListeners();
});

// Tab Switching
function initializeTabs() {
    const tabLinks = document.querySelectorAll('nav ul li');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(tab => {
        tab.addEventListener('click', () => {
            tabLinks.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Mock Data
const products = [
    {
        id: 'P001',
        name: 'Fresh Tomatoes',
        category: 'vegetables',
        price: 40,
        quantity: 500,
        unit: 'kg',
        farmer: {
            id: 'F001',
            name: 'Ramesh Kumar',
            location: 'Pune Rural'
        },
        image: 'https://example.com/tomatoes.jpg'
    },
    {
        id: 'P002',
        name: 'Organic Rice',
        category: 'grains',
        price: 60,
        quantity: 1000,
        unit: 'kg',
        farmer: {
            id: 'F002',
            name: 'Suresh Patil',
            location: 'Nashik'
        },
        image: 'https://example.com/rice.jpg'
    }
];

const orders = [
    {
        id: 'ORD001',
        status: 'processing',
        items: [
            { productId: 'P001', quantity: 200, price: 40 },
            { productId: 'P002', quantity: 500, price: 60 }
        ],
        total: 38000,
        farmer: {
            id: 'F001',
            name: 'Ramesh Kumar',
            location: 'Pune Rural'
        },
        delivery: {
            address: 'City Market, Pune',
            date: '2025-04-25'
        }
    }
];

// Load Products
function loadProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    productsGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-meta">
                    <span>${product.quantity} ${product.unit} available</span>
                    <span>₹${product.price}/${product.unit}</span>
                </div>
                <div class="farmer-info">
                    <small>Farmer: ${product.farmer.name}</small>
                    <small>Location: ${product.farmer.location}</small>
                </div>
                <button class="primary-btn" onclick="addToCart('${product.id}')">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// Load Orders
function loadOrders() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    ordersList.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <h3>Order #${order.id}</h3>
                <span class="status-badge ${order.status}">${order.status}</span>
            </div>
            <div class="order-items">
                ${order.items.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    return `
                        <div class="order-item">
                            <span>${product.name}</span>
                            <span>${item.quantity} ${product.unit} × ₹${item.price}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="order-footer">
                <div class="delivery-info">
                    <p>Delivery to: ${order.delivery.address}</p>
                    <p>Expected: ${order.delivery.date}</p>
                </div>
                <div class="order-total">
                    Total: ₹${order.total}
                </div>
            </div>
        </div>
    `).join('');
}

// Cart Management
let cart = [];

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const cartItem = cart.find(item => item.productId === productId);
    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        cart.push({
            productId: productId,
            quantity: 1,
            price: product.price
        });
    }

    updateCart();
}

function updateCart() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    if (!cartItems || !cartTotal) return;

    cartItems.innerHTML = cart.map(item => {
        const product = products.find(p => p.id === item.productId);
        return `
            <div class="cart-item">
                <div class="item-info">
                    <h4>${product.name}</h4>
                    <p>${item.quantity} ${product.unit} × ₹${item.price}</p>
                </div>
                <div class="item-total">
                    ₹${item.quantity * item.price}
                </div>
            </div>
        `;
    }).join('');

    const total = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    cartTotal.textContent = total;
}

// Event Listeners
function setupEventListeners() {
    // Product Search
    const productSearch = document.getElementById('product-search');
    if (productSearch) {
        productSearch.addEventListener('input', filterProducts);
    }

    // Category Filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }

    // Sort Products
    const sortBy = document.getElementById('sort-by');
    if (sortBy) {
        sortBy.addEventListener('change', sortProducts);
    }

    // Order Status Tabs
    const statusTabs = document.querySelectorAll('.status-tab');
    statusTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            statusTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filterOrders(tab.getAttribute('data-status'));
        });
    });
}

// Filter and Sort Functions
function filterProducts() {
    const search = document.getElementById('product-search').value.toLowerCase();
    const category = document.getElementById('category-filter').value;

    const filtered = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(search);
        const matchesCategory = !category || product.category === category;
        return matchesSearch && matchesCategory;
    });

    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
        productsGrid.innerHTML = filtered.map(/* ... product card HTML ... */).join('');
    }
}

function sortProducts() {
    const sortBy = document.getElementById('sort-by').value;
    const sorted = [...products].sort((a, b) => {
        switch (sortBy) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'quantity':
                return b.quantity - a.quantity;
            default:
                return 0;
        }
    });

    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
        productsGrid.innerHTML = sorted.map(/* ... product card HTML ... */).join('');
    }
}

function filterOrders(status) {
    const filtered = orders.filter(order => 
        status === 'all' || order.status === status
    );

    const ordersList = document.getElementById('orders-list');
    if (ordersList) {
        ordersList.innerHTML = filtered.map(/* ... order card HTML ... */).join('');
    }
}
