// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    loadServiceRequests();
    loadActiveJobs();
    loadMyServices();
    updateSchedule();
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
const serviceRequests = [
    {
        id: 'REQ001',
        type: 'transport',
        client: {
            name: 'Ramesh Kumar',
            type: 'Farmer',
            phone: '9876543210',
            location: 'Pune Rural'
        },
        details: {
            pickup: 'Farm Location, Pune',
            delivery: 'City Market',
            distance: '15 km',
            load: '500 kg',
            product: 'Fresh Vegetables'
        },
        timing: '2025-04-21 09:00',
        status: 'pending'
    }
];

const activeJobs = [
    {
        id: 'JOB001',
        type: 'transport',
        client: 'Ramesh Kumar',
        status: 'in-progress',
        timeline: [
            { time: '09:00', location: 'Farm Location, Pune', status: 'completed' },
            { time: '10:30', location: 'City Market', status: 'pending' }
        ]
    }
];

const myServices = [
    {
        id: 'SRV001',
        type: 'transport',
        name: 'Mini Truck',
        capacity: '1000 kg',
        rate: 1500,
        area: 20
    }
];

// Load Service Requests
function loadServiceRequests() {
    const requestsGrid = document.getElementById('requests-grid');
    if (!requestsGrid) return;

    requestsGrid.innerHTML = serviceRequests.map(request => `
        <div class="request-card">
            <div class="request-header">
                <span class="request-type ${request.type}">${request.type}</span>
                <span class="request-id">#${request.id}</span>
            </div>
            <div class="client-info">
                <h3>${request.client.name}</h3>
                <p>${request.client.type} - ${request.client.location}</p>
                <p>📞 ${request.client.phone}</p>
            </div>
            <div class="request-details">
                <p><strong>Pickup:</strong> ${request.details.pickup}</p>
                <p><strong>Delivery:</strong> ${request.details.delivery}</p>
                <p><strong>Distance:</strong> ${request.details.distance}</p>
                <p><strong>Load:</strong> ${request.details.load}</p>
                <p><strong>Product:</strong> ${request.details.product}</p>
            </div>
            <div class="request-actions">
                <button class="primary-btn" onclick="acceptRequest('${request.id}')">
                    Accept Request
                </button>
            </div>
        </div>
    `).join('');
}

// Load Active Jobs
function loadActiveJobs() {
    const timelineContainer = document.getElementById('timeline-container');
    const jobsGrid = document.getElementById('jobs-grid');
    if (!timelineContainer || !jobsGrid) return;

    // Timeline View
    timelineContainer.innerHTML = activeJobs.map(job => `
        <div class="timeline-container">
            ${job.timeline.map(point => `
                <div class="timeline-point ${point.status}">
                    <span class="time">${point.time}</span>
                    <span class="location">${point.location}</span>
                </div>
            `).join('')}
        </div>
    `).join('');

    // Jobs Grid
    jobsGrid.innerHTML = activeJobs.map(job => `
        <div class="job-card">
            <div class="job-header">
                <h3>Job #${job.id}</h3>
                <span class="status-badge ${job.status}">${job.status}</span>
            </div>
            <div class="job-details">
                <p><strong>Client:</strong> ${job.client}</p>
                <p><strong>Type:</strong> ${job.type}</p>
            </div>
            <div class="job-actions">
                <button class="primary-btn" onclick="updateJobStatus('${job.id}')">
                    Update Status
                </button>
            </div>
        </div>
    `).join('');
}

// Load My Services
function loadMyServices() {
    const servicesGrid = document.getElementById('services-grid');
    if (!servicesGrid) return;

    servicesGrid.innerHTML = myServices.map(service => `
        <div class="service-card">
            <div class="service-icon">
                <i class="fas ${getServiceIcon(service.type)}"></i>
            </div>
            <h3>${service.name}</h3>
            <div class="service-details">
                <p><strong>Type:</strong> ${service.type}</p>
                <p><strong>Capacity:</strong> ${service.capacity}</p>
                <p><strong>Rate:</strong> ₹${service.rate}/trip</p>
                <p><strong>Service Area:</strong> ${service.area} km radius</p>
            </div>
            <button class="primary-btn" onclick="editService('${service.id}')">
                <i class="fas fa-edit"></i> Edit
            </button>
        </div>
    `).join('');
}

// Schedule Management
let currentDate = new Date();

function updateSchedule() {
    const dateDisplay = document.getElementById('current-date');
    const scheduleTimeline = document.getElementById('schedule-timeline');
    if (!dateDisplay || !scheduleTimeline) return;

    dateDisplay.textContent = currentDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Filter jobs for current date
    const todaysJobs = activeJobs.filter(job => {
        // Add date filtering logic here
        return true;
    });

    scheduleTimeline.innerHTML = todaysJobs.map(job => `
        <div class="schedule-item">
            <div class="time-slot">${job.timeline[0].time}</div>
            <div class="schedule-details">
                <h4>Job #${job.id}</h4>
                <p>${job.client}</p>
                <p>${job.timeline[0].location}</p>
            </div>
        </div>
    `).join('');
}

function previousDay() {
    currentDate.setDate(currentDate.getDate() - 1);
    updateSchedule();
}

function nextDay() {
    currentDate.setDate(currentDate.getDate() + 1);
    updateSchedule();
}

// Modal Handlers
function setupModalHandlers() {
    const modal = document.getElementById('add-service-modal');
    const closeBtn = document.querySelector('.close-modal');
    const form = document.getElementById('add-service-form');

    if (closeBtn) {
        closeBtn.onclick = () => modal.style.display = 'none';
    }

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const newService = {
                id: 'SRV' + (myServices.length + 1).toString().padStart(3, '0'),
                type: document.getElementById('service-type').value,
                name: document.getElementById('service-name').value,
                capacity: document.getElementById('service-capacity').value + ' kg',
                rate: parseInt(document.getElementById('service-rate').value),
                area: parseInt(document.getElementById('service-area').value)
            };
            myServices.push(newService);
            loadMyServices();
            modal.style.display = 'none';
        };
    }
}

function showAddServiceModal() {
    const modal = document.getElementById('add-service-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Utility Functions
function getServiceIcon(type) {
    switch (type) {
        case 'transport':
            return 'fa-truck';
        case 'storage':
            return 'fa-warehouse';
        case 'equipment':
            return 'fa-tools';
        default:
            return 'fa-cube';
    }
}

// Action Handlers
function acceptRequest(requestId) {
    const request = serviceRequests.find(r => r.id === requestId);
    if (request) {
        request.status = 'accepted';
        activeJobs.push({
            id: 'JOB' + (activeJobs.length + 1).toString().padStart(3, '0'),
            type: request.type,
            client: request.client.name,
            status: 'in-progress',
            timeline: [
                { time: request.timing, location: request.details.pickup, status: 'pending' },
                { time: '', location: request.details.delivery, status: 'pending' }
            ]
        });
        loadServiceRequests();
        loadActiveJobs();
    }
}

function updateJobStatus(jobId) {
    const job = activeJobs.find(j => j.id === jobId);
    if (job) {
        // Update job status logic here
        loadActiveJobs();
    }
}

function editService(serviceId) {
    const service = myServices.find(s => s.id === serviceId);
    if (service) {
        showAddServiceModal();
        document.getElementById('service-type').value = service.type;
        document.getElementById('service-name').value = service.name;
        document.getElementById('service-capacity').value = parseInt(service.capacity);
        document.getElementById('service-rate').value = service.rate;
        document.getElementById('service-area').value = service.area;
    }
}
