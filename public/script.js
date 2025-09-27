// Global state
let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentFilter = '';
let currentSort = 'name';
let currentSearch = '';
let currentPage = 1;
let productsPerPage = 12;

// DOM elements
const productsGrid = document.getElementById('productsGrid');
const categoriesGrid = document.getElementById('categoriesGrid');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const priceRange = document.getElementById('priceRange');
const cartBtn = document.getElementById('cartBtn');
const cartCount = document.getElementById('cartCount');
const cartModal = document.getElementById('cartModal');
const cartItems = document.getElementById('cartItems');
const cartEmpty = document.getElementById('cartEmpty');
const cartFooter = document.getElementById('cartFooter');
const cartTotal = document.getElementById('cartTotal');
const closeCartBtn = document.getElementById('closeCartBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const productModal = document.getElementById('productModal');
const productModalTitle = document.getElementById('productModalTitle');
const productModalBody = document.getElementById('productModalBody');
const closeProductBtn = document.getElementById('closeProductBtn');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navMenu = document.getElementById('navMenu');
const pagination = document.getElementById('pagination');
const viewButtons = document.querySelectorAll('.view-btn');
const contactForm = document.getElementById('contactForm');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
    updateCartUI();
    setupEventListeners();
    initializePage();
});

// Initialize page-specific functionality
function initializePage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Add tech animations
    addTechAnimations();
    
    // Initialize page-specific features
    if (currentPage === 'products.html') {
        initializeProductsPage();
    } else if (currentPage === 'categories.html') {
        initializeCategoriesPage();
    } else if (currentPage === 'contact.html') {
        initializeContactPage();
    }
}

// Event listeners
function setupEventListeners() {
    // Search functionality
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }
    
    // Filter functionality
    if (categoryFilter) categoryFilter.addEventListener('change', handleCategoryFilter);
    if (sortFilter) sortFilter.addEventListener('change', handleSortFilter);
    if (priceRange) priceRange.addEventListener('change', handlePriceFilter);
    
    // Cart functionality
    if (cartBtn) cartBtn.addEventListener('click', () => toggleModal(cartModal));
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleModal(cartModal));
    if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);
    
    // Product modal
    if (closeProductBtn) closeProductBtn.addEventListener('click', () => toggleModal(productModal));
    
    // Mobile menu
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // View toggle buttons
    viewButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            toggleView(view);
        });
    });
    
    // Contact form
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
    
    // Close modals when clicking outside
    if (cartModal) {
        cartModal.addEventListener('click', (e) => {
            if (e.target === cartModal) toggleModal(cartModal);
        });
    }
    
    if (productModal) {
        productModal.addEventListener('click', (e) => {
            if (e.target === productModal) toggleModal(productModal);
        });
    }
}

// API functions
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        categories = await response.json();
        renderCategories();
        populateCategoryFilter();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadProducts() {
    try {
        showLoading(true);
        const params = new URLSearchParams();
        if (currentFilter) params.append('category', currentFilter);
        if (currentSearch) params.append('search', currentSearch);
        if (currentSort) params.append('sort', currentSort);
        
        const response = await fetch(`/api/products?${params}`);
        products = await response.json();
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
    } finally {
        showLoading(false);
    }
}

async function loadProduct(id) {
    try {
        const response = await fetch(`/api/products/${id}`);
        return await response.json();
    } catch (error) {
        console.error('Error loading product:', error);
        return null;
    }
}

// Render functions
function renderCategories() {
    const categoryIcons = {
        'Desktops': 'fas fa-desktop',
        'Laptops': 'fas fa-laptop',
        'Monitors': 'fas fa-tv',
        'Cables': 'fas fa-plug',
        'Peripherals': 'fas fa-keyboard',
        'Storage': 'fas fa-hdd',
        'Components': 'fas fa-microchip'
    };
    
    categoriesGrid.innerHTML = categories.map(category => `
        <div class="category-card" onclick="filterByCategory(${category.id})">
            <div class="category-icon">
                <i class="${categoryIcons[category.name] || 'fas fa-box'}"></i>
            </div>
            <h3 class="category-name">${category.name}</h3>
            <p class="category-description">${category.description}</p>
        </div>
    `).join('');
}

function renderProducts() {
    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #6b7280;">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; color: #d1d5db;"></i>
                <p>No products found matching your criteria.</p>
            </div>
        `;
        return;
    }
    
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card" onclick="showProductDetails(${product.id})" role="button" tabindex="0" aria-label="View details for ${product.name}">
            <div class="product-image" aria-hidden="true">
                <i class="fas fa-box"></i>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price" aria-label="Price: $${product.price}">$${product.price}</div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); addToCart(${product.id})" aria-label="Add ${product.name} to cart">
                        <i class="fas fa-cart-plus" aria-hidden="true"></i> Add to Cart
                    </button>
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); showProductDetails(${product.id})" aria-label="View details for ${product.name}">
                        <i class="fas fa-eye" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCartItems() {
    if (cart.length === 0) {
        cartEmpty.style.display = 'block';
        cartItems.style.display = 'none';
        cartFooter.style.display = 'none';
        return;
    }
    
    cartEmpty.style.display = 'none';
    cartItems.style.display = 'block';
    cartFooter.style.display = 'flex';
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <i class="fas fa-box"></i>
            </div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price}</div>
            </div>
            <div class="cart-item-controls">
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    updateCartTotal();
}

// Cart functions
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    showCartAnimation();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        updateCartUI();
    }
}

function updateCartTotal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toFixed(2);
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    renderCartItems();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Filter and search functions
function filterByCategory(categoryId) {
    currentFilter = categoryId;
    categoryFilter.value = categoryId;
    loadProducts();
    
    // Scroll to products section
    document.querySelector('.products-section').scrollIntoView({ behavior: 'smooth' });
}

function handleCategoryFilter() {
    currentFilter = categoryFilter.value;
    loadProducts();
}

function handleSortFilter() {
    currentSort = sortFilter.value;
    loadProducts();
}

function handleSearch() {
    currentSearch = searchInput.value.trim();
    loadProducts();
}

// Modal functions
function toggleModal(modal) {
    modal.classList.toggle('show');
    if (modal === cartModal) {
        renderCartItems();
    }
}

async function showProductDetails(productId) {
    const product = await loadProduct(productId);
    if (!product) return;
    
    productModalTitle.textContent = product.name;
    productModalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;">
            <div class="product-image" style="height: 300px;">
                <i class="fas fa-box" style="font-size: 4rem;"></i>
            </div>
            <div>
                <div class="product-price" style="font-size: 2rem; margin-bottom: 1rem;">$${product.price}</div>
                <p style="color: #6b7280; margin-bottom: 2rem; line-height: 1.6;">${product.description}</p>
                
                ${product.specifications ? `
                    <div style="margin-bottom: 2rem;">
                        <h4 style="margin-bottom: 1rem; color: #1f2937;">Specifications</h4>
                        <div style="display: grid; gap: 0.5rem;">
                            ${Object.entries(product.specifications).map(([key, value]) => `
                                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
                                    <span style="font-weight: 500; color: #374151;">${key.replace(/_/g, ' ').toUpperCase()}:</span>
                                    <span style="color: #6b7280;">${value}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div style="display: flex; gap: 1rem;">
                    <button class="btn btn-primary" onclick="addToCart(${product.id}); toggleModal(productModal);" style="flex: 1;">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                    <button class="btn btn-secondary" onclick="toggleModal(productModal);">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    toggleModal(productModal);
}

function populateCategoryFilter() {
    categoryFilter.innerHTML = '<option value="">All Categories</option>' +
        categories.map(category => 
            `<option value="${category.id}">${category.name}</option>`
        ).join('');
}

// Utility functions
function showLoading(show) {
    loading.classList.toggle('show', show);
}

function showCartAnimation() {
    cartBtn.style.transform = 'scale(1.1)';
    setTimeout(() => {
        cartBtn.style.transform = 'scale(1)';
    }, 200);
}

function handleCheckout() {
    if (cart.length === 0) return;
    
    // In a real application, this would redirect to a checkout page
    alert(`Checkout functionality would be implemented here.\n\nTotal: $${cartTotal.textContent}\nItems: ${cart.length}`);
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add some visual feedback for interactions
document.addEventListener('click', function(e) {
    if (e.target.matches('.btn, .category-card, .product-card')) {
        e.target.style.transform = 'scale(0.98)';
        setTimeout(() => {
            e.target.style.transform = '';
        }, 150);
    }
});

// Page-specific initialization functions
function initializeProductsPage() {
    // Initialize view toggle
    const currentView = localStorage.getItem('productView') || 'grid';
    toggleView(currentView);
    
    // Initialize pagination
    renderPagination();
}

function initializeCategoriesPage() {
    // Add category preview functionality
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const categoryId = e.currentTarget.dataset.categoryId;
            if (categoryId) {
                showCategoryPreview(categoryId);
            }
        });
    });
}

function initializeContactPage() {
    // Add form validation and submission
    const formInputs = document.querySelectorAll('.contact-form input, .contact-form select, .contact-form textarea');
    formInputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
}

// Tech animations
function addTechAnimations() {
    // Add floating animation to tech elements
    const techElements = document.querySelectorAll('.floating-icon, .circuit-line');
    techElements.forEach((element, index) => {
        element.style.animationDelay = `${index * 0.5}s`;
    });
    
    // Add scroll-triggered animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.category-card, .product-card, .feature-card, .value-card');
    animateElements.forEach(el => observer.observe(el));
}

// Mobile menu functionality
function toggleMobileMenu() {
    if (navMenu) {
        navMenu.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    }
}

// View toggle functionality
function toggleView(view) {
    // Update active button
    viewButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Update grid layout
    if (productsGrid) {
        productsGrid.className = `products-grid ${view}-view`;
    }
    
    // Save preference
    localStorage.setItem('productView', view);
}

// Price filter functionality
function handlePriceFilter() {
    if (!priceRange) return;
    
    const priceRangeValue = priceRange.value;
    if (priceRangeValue) {
        const [min, max] = priceRangeValue.split('-').map(p => p === '+' ? Infinity : parseInt(p));
        products = products.filter(product => {
            const price = parseFloat(product.price);
            return price >= min && (max === undefined || price <= max);
        });
    }
    
    renderProducts();
}

// Pagination functionality
function renderPagination() {
    if (!pagination) return;
    
    const totalPages = Math.ceil(products.length / productsPerPage);
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="pagination-controls">';
    
    // Previous button
    paginationHTML += `
        <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                onclick="changePage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                        onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<span class="pagination-ellipsis">...</span>';
        }
    }
    
    // Next button
    paginationHTML += `
        <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                onclick="changePage(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationHTML += '</div>';
    pagination.innerHTML = paginationHTML;
}

function changePage(page) {
    const totalPages = Math.ceil(products.length / productsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderProducts();
    renderPagination();
    
    // Scroll to top of products
    if (productsGrid) {
        productsGrid.scrollIntoView({ behavior: 'smooth' });
    }
}

// Category preview functionality
async function showCategoryPreview(categoryId) {
    try {
        const response = await fetch(`/api/products?category=${categoryId}&limit=6`);
        const categoryProducts = await response.json();
        
        const category = categories.find(c => c.id == categoryId);
        const previewTitle = document.getElementById('previewTitle');
        const previewProducts = document.getElementById('previewProducts');
        const categoryPreview = document.getElementById('categoryPreview');
        
        if (previewTitle) previewTitle.textContent = `${category.name} Products`;
        if (previewProducts) {
            previewProducts.innerHTML = categoryProducts.map(product => `
                <div class="product-card" onclick="showProductDetails(${product.id})">
                    <div class="product-image">
                        <i class="fas fa-box"></i>
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-price">$${product.price}</div>
                        <button class="btn btn-primary" onclick="event.stopPropagation(); addToCart(${product.id})">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        if (categoryPreview) {
            categoryPreview.style.display = 'block';
            categoryPreview.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error loading category products:', error);
    }
}

// Contact form functionality
function handleContactSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData);
    
    // Basic validation
    if (!data.name || !data.email || !data.subject || !data.message) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Simulate form submission
    showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
    contactForm.reset();
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    // Remove existing error
    clearFieldError(e);
    
    // Validate based on field type
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(field, 'Please enter a valid email address');
        return false;
    }
    
    return true;
}

function clearFieldError(e) {
    const field = e.target;
    const errorMsg = field.parentNode.querySelector('.field-error');
    if (errorMsg) {
        errorMsg.remove();
    }
    field.classList.remove('error');
}

function showFieldError(field, message) {
    field.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Enhanced product rendering with pagination
function renderProducts() {
    if (!productsGrid) return;
    
    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; color: var(--border-color);"></i>
                <p>No products found matching your criteria.</p>
            </div>
        `;
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = products.slice(startIndex, endIndex);
    
    productsGrid.innerHTML = paginatedProducts.map(product => `
        <div class="product-card" onclick="showProductDetails(${product.id})" role="button" tabindex="0" aria-label="View details for ${product.name}">
            <div class="product-image" aria-hidden="true">
                <i class="fas fa-box"></i>
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price" aria-label="Price: $${product.price}">$${product.price}</div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); addToCart(${product.id})" aria-label="Add ${product.name} to cart">
                        <i class="fas fa-cart-plus" aria-hidden="true"></i> Add to Cart
                    </button>
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); showProductDetails(${product.id})" aria-label="View details for ${product.name}">
                        <i class="fas fa-eye" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Initialize cart count on page load
updateCartUI();
