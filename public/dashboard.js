// Check if user is logged in
let currentUser = null;

// --- Check user verification and roles on dashboard load ---
document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login first.');
        window.location.href = 'index.html';
        return;
    }
    try {
        const res = await fetch('/api/user', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('User fetch failed');
        currentUser = await res.json();
        if (!currentUser.verifiedRoles || currentUser.verifiedRoles.length === 0) {
            alert('Please verify your email roles.');
            localStorage.removeItem('token');
            window.location.href = 'index.html';
            return;
        }
        // Optionally update UI with user info and roles
        document.getElementById('userInfo').textContent = `Welcome, ${currentUser.fullName}`;
        document.getElementById('userRole').textContent = currentUser.activeRole || currentUser.verifiedRoles[0];
    } catch (err) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }

    // Populate role selector
    const roleSelector = document.getElementById('roleSelector');
    roleSelector.innerHTML = ''; // Clear existing options
    currentUser.roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role;
        option.textContent = role;
        if (role === currentUser.activeRole) option.selected = true;
        roleSelector.appendChild(option);
    });

    showDashboard(currentUser.activeRole);
    loadDashboardData();
});

// Add auth headers to all fetch requests
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    
    try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
            return null;
        }
        return response;
    } catch (err) {
        console.error('API error:', err);
        throw err;
    }
}

// Role switching
document.getElementById('roleSelector').addEventListener('change', async (e) => {
    const newRole = e.target.value;
    try {
        const response = await fetchWithAuth('/api/switch-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newRole })
        });
        
        if (!response) return;
        const result = await response.json();
        
        if (result.success) {
            currentUser.activeRole = newRole;
            showDashboard(newRole);
            loadDashboardData();
        } else {
            alert('Failed to switch role. Please try again.');
        }
    } catch (err) {
        console.error(err);
        alert('Failed to switch role. Please try again.');
    }
});

function showDashboard(role) {
    // Hide all dashboards
    document.querySelectorAll('.dashboard-section').forEach(el => el.style.display = 'none');
    
    // Show relevant dashboard
    switch (role) {
        case 'Farmer':
            document.getElementById('farmerDashboard').style.display = 'block';
            break;
        case 'Trader':
        case 'Customer':
            document.getElementById('traderDashboard').style.display = 'block';
            break;
        case 'Service Partner':
            document.getElementById('servicePartnerDashboard').style.display = 'block';
            break;
        case 'Admin':
            document.getElementById('adminDashboard').style.display = 'block';
            break;
    }
}

async function loadDashboardData() {
    switch (currentUser.activeRole) {
        case 'Farmer':
            await loadFarmerData();
            break;
        case 'Trader':
        case 'Customer':
            await searchProduce();
            break;
        case 'Service Partner':
            await loadServicePartnerData();
            break;
        case 'Admin':
            await loadAdminData();
            break;
    }
}

async function loadFarmerData() {
    try {
        // Load produce listings
        const produceResponse = await fetchWithAuth(`/api/produce/farmer/${currentUser._id}`);
        if (!produceResponse) return;
        const produceData = await produceResponse.json();
        
        const produceList = document.getElementById('farmerProduceList');
        produceList.innerHTML = produceData.listings.map(produce => `
            <div class="col-md-6 mb-3">
                <div class="card produce-card">
                    <img src="${produce.image}" class="card-img-top" alt="${produce.cropName}">
                    <div class="card-body">
                        <h5 class="card-title">${produce.cropName}</h5>
                        <p class="card-text">
                            Quantity: ${produce.quantity} ${produce.unit}<br>
                            Price: ₹${produce.price}/${produce.unit}<br>
                            Status: ${produce.status}
                        </p>
                    </div>
                </div>
            </div>
        `).join('');

        // Load orders
        const ordersResponse = await fetchWithAuth(`/api/orders/farmer/${currentUser._id}`);
        if (!ordersResponse) return;
        const ordersData = await ordersResponse.json();
        
        const ordersList = document.getElementById('farmerOrders');
        ordersList.innerHTML = ordersData.orders.map(order => `
            <div class="card mb-3">
                <div class="card-body">
                    <h6>Order #${order._id}</h6>
                    <p>
                        Buyer: ${order.buyerId.fullName}<br>
                        Quantity: ${order.quantity} ${order.produceId.unit}<br>
                        Total: ₹${order.totalPrice}<br>
                        Status: ${order.status}
                    </p>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        alert('Failed to load farmer data');
    }
}

async function searchProduce() {
    const cropName = document.getElementById('searchCrop').value;
    const minPrice = document.getElementById('minPrice').value;
    const maxPrice = document.getElementById('maxPrice').value;
    
    try {
        const query = new URLSearchParams({
            cropName,
            minPrice,
            maxPrice
        }).toString();
        
        const response = await fetchWithAuth(`/api/produce/search?${query}`);
        if (!response) return;
        const data = await response.json();
        const produceList = document.getElementById('produceList');
        
        produceList.innerHTML = data.produce.map(item => `
            <div class="col-md-4 mb-4">
                <div class="card produce-card h-100">
                    <img src="${item.image}" class="card-img-top" alt="${item.cropName}">
                    <div class="card-body">
                        <h5 class="card-title">${item.cropName}</h5>
                        <p class="card-text">
                            Farmer: ${item.farmerId.fullName}<br>
                            Quantity: ${item.quantity} ${item.unit}<br>
                            Price: ₹${item.price}/${item.unit}
                        </p>
                        <button class="btn btn-primary" onclick="placeOrder('${item._id}')">
                            Place Order
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        alert('Failed to search produce');
    }
}

async function placeOrder(produceId) {
    const quantity = prompt('Enter quantity to order:');
    if (!quantity) return;
    
    try {
        const response = await fetchWithAuth('/api/orders/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                buyerId: currentUser._id,
                produceId,
                quantity: Number(quantity)
            })
        });
        
        if (!response) return;
        const result = await response.json();
        
        if (result.success) {
            alert('Order placed successfully!');
            await searchProduce(); // Refresh the produce list
        } else {
            alert('Failed to place order. Please try again.');
        }
    } catch (err) {
        console.error(err);
        alert('Failed to place order. Please try again.');
    }
}

async function loadServicePartnerData() {
    try {
        // Load fleet
        const fleetResponse = await fetchWithAuth(`/api/fleet/${currentUser._id}`);
        if (!fleetResponse) return;
        const fleetData = await fleetResponse.json();
        
        const fleetList = document.getElementById('fleetList');
        fleetList.innerHTML = fleetData.fleet.map(vehicle => `
            <div class="card mb-3">
                <div class="card-body">
                    <h6>${vehicle.vehicleType.toUpperCase()}</h6>
                    <p>
                        Capacity: ${vehicle.capacity} tons<br>
                        Status: ${vehicle.status}
                    </p>
                </div>
            </div>
        `).join('');

        // Load available jobs
        const jobsResponse = await fetchWithAuth('/api/jobs/available');
        if (!jobsResponse) return;
        const jobsData = await jobsResponse.json();
        
        const jobsList = document.getElementById('jobsList');
        jobsList.innerHTML = jobsData.jobs.map(job => `
            <div class="card mb-3">
                <div class="card-body">
                    <h6>Delivery Job #${job._id}</h6>
                    <p>
                        From: ${job.pickupLocation}<br>
                        To: ${job.dropLocation}<br>
                        Price: ₹${job.price}
                    </p>
                    <button class="btn btn-sm btn-primary" onclick="acceptJob('${job._id}')">
                        Accept Job
                    </button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        alert('Failed to load service partner data');
    }
}

async function addFleet() {
    const form = document.getElementById('addFleetForm');
    const formData = new FormData(form);
    
    try {
        const response = await fetchWithAuth('/api/fleet/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                servicePartnerId: currentUser._id,
                vehicleType: formData.get('vehicleType'),
                capacity: Number(formData.get('capacity'))
            })
        });
        
        if (!response) return;
        const result = await response.json();
        
        if (result.success) {
            bootstrap.Modal.getInstance(document.getElementById('addFleetModal')).hide();
            form.reset();
            await loadServicePartnerData();
            alert('Vehicle registered successfully!');
        } else {
            alert('Failed to register vehicle. Please try again.');
        }
    } catch (err) {
        console.error(err);
        alert('Failed to register vehicle. Please try again.');
    }
}

async function loadAdminData() {
    try {
        // Load users
        const usersResponse = await fetchWithAuth('/api/admin/users');
        if (!usersResponse) return;
        const usersData = await usersResponse.json();
        
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = usersData.users.map(user => `
            <div class="card mb-3">
                <div class="card-body">
                    <h6>${user.fullName}</h6>
                    <p>
                        Roles: ${user.roles.join(', ')}<br>
                        Status: ${user.isVerified ? 'Verified' : 'Unverified'}
                    </p>
                    ${!user.isVerified ? `
                        <button class="btn btn-sm btn-success" onclick="verifyUser('${user._id}')">
                            Verify User
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Load disputes
        const disputesResponse = await fetchWithAuth('/api/admin/disputes');
        if (!disputesResponse) return;
        const disputesData = await disputesResponse.json();
        
        const disputesList = document.getElementById('disputesList');
        disputesList.innerHTML = disputesData.disputes.map(dispute => `
            <div class="card mb-3">
                <div class="card-body">
                    <h6>Dispute #${dispute._id}</h6>
                    <p>
                        Reporter: ${dispute.reporterId.fullName}<br>
                        Against: ${dispute.againstId.fullName}<br>
                        Reason: ${dispute.reason}<br>
                        Status: ${dispute.status}
                    </p>
                    ${dispute.status === 'open' ? `
                        <button class="btn btn-sm btn-primary" onclick="reviewDispute('${dispute._id}')">
                            Review
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        alert('Failed to load admin data');
    }
}

async function verifyUser(userId) {
    try {
        const response = await fetchWithAuth('/api/admin/verify-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, isVerified: true })
        });
        
        if (!response) return;
        const result = await response.json();
        
        if (result.success) {
            await loadAdminData();
            alert('User verified successfully!');
        } else {
            alert('Failed to verify user. Please try again.');
        }
    } catch (err) {
        console.error(err);
        alert('Failed to verify user. Please try again.');
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// Image preview function
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        const preview = document.getElementById('imagePreview');
        
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        
        reader.readAsDataURL(file);
    }
}

// Farmer functions
async function addProduce() {
    const form = document.getElementById('addProduceForm');
    const formData = new FormData(form);
    
    try {
        // First upload the image
        const imageFile = formData.get('image');
        const imageData = new FormData();
        imageData.append('image', imageFile);
        
        const imageUploadResponse = await fetchWithAuth('/api/upload-image', {
            method: 'POST',
            body: imageData
        });
        
        if (!imageUploadResponse) return;
        const { imageUrl } = await imageUploadResponse.json();
        
        // Then create the produce listing
        const produceData = {
            farmerId: currentUser._id,
            cropName: formData.get('cropName'),
            quantity: Number(formData.get('quantity')),
            unit: formData.get('unit'),
            price: Number(formData.get('price')),
            dispatchDate: formData.get('dispatchDate'),
            image: imageUrl,
            description: formData.get('description')
        };
        
        const response = await fetchWithAuth('/api/produce/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(produceData)
        });
        
        if (!response) return;
        const result = await response.json();
        
        if (result.success) {
            bootstrap.Modal.getInstance(document.getElementById('addProduceModal')).hide();
            form.reset();
            document.getElementById('imagePreview').style.display = 'none';
            await loadFarmerData();
            alert('Produce listing created successfully!');
        } else {
            alert('Failed to create produce listing. Please try again.');
        }
    } catch (err) {
        console.error(err);
        alert('Failed to create produce listing. Please try again.');
    }
}
