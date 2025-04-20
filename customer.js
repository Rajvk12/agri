// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    loadProducts();
    loadOrders();
    loadSavedSellers();
    setupModalHandlers();
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
        unit: 'kg',
        available: 500,
        rating: 4.5,
        seller: {
            id: 'S001',
            name: 'Ramesh Kumar',
            location: 'Pune Rural',
            rating: 4.8
        },
        image: 'https://example.com/tomatoes.jpg'
    },
    {
        id: 'P002',
        name: 'Organic Rice',
        category: 'grains',
        price: 60,
        unit: 'kg',
        available: 1000,
        rating: 4.7,
        seller: {
            id: 'S002',
            name: 'Suresh Patil',
            location: 'Nashik',
            rating: 4.6
        },
        image: 'https://example.com/rice.jpg'
    }
];

const orders = [
    {
        id: 'ORD001',
        date: '2025-04-20',
        status: 'active',
        items: [
            { productId: 'P001', quantity: 10, price: 40 },
            { productId: 'P002', quantity: 20, price: 60 }
        ],
        total: 1600,
        seller: {
            name: 'Ramesh Kumar',
            contact: '9876543210'
        },
        delivery: {
            address: 'Home Address, Pune',
            expected: '2025-04-22'
        }
    }
];

const savedSellers = [
    {
        id: 'S001',
        name: 'Ramesh Kumar',
        location: 'Pune Rural',
        rating: 4.8,
        products: ['Tomatoes', 'Potatoes', 'Onions'],
        avatar: 'https://example.com/seller1.jpg'
    }
];

// Load Products
function loadProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    productsGrid.innerHTML = products.map(product => `
        <div class="product-card" onclick="showProductDetails('${product.id}')">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-meta">
                    <span>₹${product.price}/${product.unit}</span>
                    <span>⭐ ${product.rating}</span>
                </div>
                <div class="seller-info">
                    <p>Seller: ${product.seller.name}</p>
                    <p>Location: ${product.seller.location}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Load Orders
function loadOrders() {
    const ordersGrid = document.getElementById('orders-grid');
    if (!ordersGrid) return;

    ordersGrid.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <h3>Order #${order.id}</h3>
                <span class="order-status ${order.status}">${order.status}</span>
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
                    <p>Expected: ${order.delivery.expected}</p>
                </div>
                <div class="order-total">
                    Total: ₹${order.total}
                </div>
            </div>
        </div>
    `).join('');
}

// Load Saved Sellers
function loadSavedSellers() {
    const sellersGrid = document.getElementById('sellers-grid');
    if (!sellersGrid) return;

    sellersGrid.innerHTML = savedSellers.map(seller => `
        <div class="seller-card">
            <img src="${seller.avatar}" alt="${seller.name}" class="seller-avatar">
            <div class="seller-info">
                <h3>${seller.name}</h3>
                <p>📍 ${seller.location}</p>
                <p>⭐ ${seller.rating}</p>
                <p>Products: ${seller.products.join(', ')}</p>
            </div>
        </div>
    `).join('');
}

// Product Modal
function showProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const modal = document.getElementById('product-modal');
    const details = document.getElementById('product-details');
    
    details.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <h2>${product.name}</h2>
        <div class="product-meta">
            <span>Price: ₹${product.price}/${product.unit}</span>
            <span>Rating: ⭐ ${product.rating}</span>
        </div>
        <div class="seller-info">
            <h3>Seller Information</h3>
            <p>Name: ${product.seller.name}</p>
            <p>Location: ${product.seller.location}</p>
            <p>Rating: ⭐ ${product.seller.rating}</p>
        </div>
        <p>Available Quantity: ${product.available} ${product.unit}</p>
    `;

    modal.style.display = 'block';
}

// Modal Handlers
function setupModalHandlers() {
    const modal = document.getElementById('product-modal');
    const closeBtn = document.querySelector('.close-modal');

    if (closeBtn) {
        closeBtn.onclick = () => modal.style.display = 'none';
    }

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Quantity Controls
function incrementQuantity() {
    const input = document.getElementById('quantity');
    input.value = parseInt(input.value) + 1;
}

function decrementQuantity() {
    const input = document.getElementById('quantity');
    const newValue = parseInt(input.value) - 1;
    if (newValue >= 1) {
        input.value = newValue;
    }
}

// Cart Management
let cart = [];

function addToCart() {
    const modal = document.getElementById('product-modal');
    const productDetails = document.getElementById('product-details');
    const quantity = parseInt(document.getElementById('quantity').value);

    // Get product name from modal
    const productName = productDetails.querySelector('h2').textContent;
    const product = products.find(p => p.name === productName);

    if (product && quantity > 0) {
        cart.push({
            productId: product.id,
            name: product.name,
            quantity: quantity,
            price: product.price
        });

        // Close modal and reset quantity
        modal.style.display = 'none';
        document.getElementById('quantity').value = 1;

        // You can add a notification here to show the item was added to cart
        alert('Item added to cart!');
    }
}

// Filter and Sort Functions
function filterProducts() {
    const search = document.getElementById('product-search').value.toLowerCase();
    const category = document.getElementById('category-filter').value;
    const sortBy = document.getElementById('sort-by').value;

    let filtered = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(search);
        const matchesCategory = !category || product.category === category;
        return matchesSearch && matchesCategory;
    });

    // Sort products
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'rating':
                return b.rating - a.rating;
            default:
                return 0;
        }
    });

    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
        productsGrid.innerHTML = filtered.map(/* ... product card HTML ... */).join('');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
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
        sortBy.addEventListener('change', filterProducts);
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
});
