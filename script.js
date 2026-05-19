// ============================================
// CAMPUS CART - COMPLETE SCRIPT.JS
// All Features: Login, Products, Wishlist, History, Dark Mode, etc.
// ============================================

// ============================================
// GLOBAL VARIABLES
// ============================================
let currentUserEmail = null;
let allProducts = [];
let purchaseHistory = JSON.parse(localStorage.getItem('campuscart_purchases')) || [];
let wishlist = JSON.parse(localStorage.getItem('campuscart_wishlist')) || [];

// Filter & Sort Variables
let currentFilterCategory = "all";
let currentSort = "newest";

// ============================================
// LOADING ANIMATION
// ============================================
window.addEventListener('load', function() {
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hide');
            setTimeout(() => {
                if (loader) loader.style.display = 'none';
            }, 500);
        }, 500);
    }
});

// ============================================
// DARK MODE TOGGLE
// ============================================
function initDarkMode() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const savedTheme = localStorage.getItem('campuscart_theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('campuscart_theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('campuscart_theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    });
}

// ============================================
// MOBILE MENU TOGGLE
// ============================================
function initMobileMenu() {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    
    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('show');
        });
        
        navLinks.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                navLinks.classList.remove('show');
            });
        });
    }
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const productCards = document.querySelectorAll('#allProductsGrid .product-card, #featuredGrid .product-card');
        
        productCards.forEach(card => {
            const title = card.querySelector('h3')?.innerText.toLowerCase() || '';
            const seller = card.querySelector('.seller')?.innerText.toLowerCase() || '';
            const description = card.querySelector('.product-info p')?.innerText.toLowerCase() || '';
            
            if (title.includes(searchTerm) || seller.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// ============================================
// CATEGORY FILTER FROM HOME PAGE
// ============================================
function initCategoryCards() {
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.getAttribute('data-category');
            if (category) {
                switchPage('products');
                setTimeout(() => {
                    const categoryFilter = document.getElementById('categoryFilter');
                    if (categoryFilter) {
                        categoryFilter.value = category;
                        const changeEvent = new Event('change');
                        categoryFilter.dispatchEvent(changeEvent);
                    }
                }, 100);
            }
        });
    });
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// WISHLIST FUNCTIONS
// ============================================
function toggleWishlist(productId, btnElement) {
    const index = wishlist.indexOf(productId);
    if (index === -1) {
        wishlist.push(productId);
        if (btnElement) btnElement.classList.add('active');
        showToast('Added to wishlist!', 'success');
    } else {
        wishlist.splice(index, 1);
        if (btnElement) btnElement.classList.remove('active');
        showToast('Removed from wishlist', 'info');
    }
    localStorage.setItem('campuscart_wishlist', JSON.stringify(wishlist));
    renderWishlistPage();
}

function isInWishlist(productId) {
    return wishlist.includes(productId);
}

function removeFromWishlist(productId) {
    const index = wishlist.indexOf(productId);
    if (index !== -1) {
        wishlist.splice(index, 1);
        localStorage.setItem('campuscart_wishlist', JSON.stringify(wishlist));
        renderWishlistPage();
        renderAllProductPages();
        showToast('Removed from wishlist', 'info');
    }
}

// ============================================
// PURCHASE HISTORY FUNCTIONS
// ============================================
function addToPurchaseHistory(productId) {
    const product = allProducts.find(p => p.id == productId);
    if (!product) return;
    
    const alreadyPurchased = purchaseHistory.some(p => p.id === productId);
    if (!alreadyPurchased && product.seller !== currentUserEmail) {
        purchaseHistory.unshift({
            id: product.id,
            name: product.name,
            price: product.price,
            seller: product.seller,
            imageDataURL: product.imageDataURL,
            date: new Date().toISOString()
        });
        localStorage.setItem('campuscart_purchases', JSON.stringify(purchaseHistory));
    }
}

function renderPurchaseHistory() {
    const container = document.getElementById('purchasesList');
    if (!container) return;
    
    if (purchaseHistory.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-shopping-bag"></i>
                <h3>No purchases yet</h3>
                <p>When you buy products from other students, they'll appear here.</p>
                <button onclick="switchPage('products')" class="submit-sell" style="margin-top: 1rem; width: auto; padding: 0.75rem 2rem;">
                    <i class="fas fa-store"></i> Browse Products
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = purchaseHistory.map(item => `
        <div class="history-card">
            <img class="history-card-img" src="${item.imageDataURL || 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect width=%27100%27 height=%27100%27 fill=%27%23ddd%27/%3E%3Ctext x=%2750%27 y=%2755%27 fill=%27gray%27 text-anchor=%27middle%27%3E📷%3C/text%3E%3C/svg%3E'}" alt="${escapeHtml(item.name)}">
            <div class="history-card-info">
                <h4>${escapeHtml(item.name)}</h4>
                <div class="history-price">₹${item.price}</div>
                <div class="history-seller"><i class="fas fa-user"></i> ${escapeHtml(item.seller.split('@')[0])}</div>
                <div class="history-date"><i class="fas fa-calendar"></i> ${new Date(item.date).toLocaleDateString()}</div>
            </div>
        </div>
    `).join('');
}

function renderUserUploads() {
    const container = document.getElementById('uploadsList');
    if (!container) return;
    
    const userProducts = allProducts.filter(p => p.seller === currentUserEmail);
    
    if (userProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-cloud-upload-alt"></i>
                <h3>No products uploaded yet</h3>
                <p>Start selling your academic essentials by listing an item.</p>
                <button onclick="switchPage('sell')" class="submit-sell" style="margin-top: 1rem; width: auto; padding: 0.75rem 2rem;">
                    <i class="fas fa-plus-circle"></i> List an Item
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userProducts.map(product => {
        const wishlistCount = wishlist.filter(id => id === product.id).length;
        
        return `
            <div class="history-card" data-product-id="${product.id}">
                <img class="history-card-img" src="${product.imageDataURL || 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect width=%27100%27 height=%27100%27 fill=%27%23ddd%27/%3E%3Ctext x=%2750%27 y=%2755%27 fill=%27gray%27 text-anchor=%27middle%27%3E📷%3C/text%3E%3C/svg%3E'}" alt="${escapeHtml(product.name)}">
                <div class="history-card-info">
                    <h4>${escapeHtml(product.name)}</h4>
                    <div class="history-price">₹${product.price}</div>
                    <div class="likes-count"><i class="fas fa-heart" style="color: #ef4444;"></i> ${wishlistCount} people liked this</div>
                    <div class="history-date"><i class="fas fa-calendar"></i> Listed on ${new Date(product.date).toLocaleDateString()}</div>
                    <span class="history-status status-available">Available</span>
                    <div>
                        <button class="history-delete-btn" onclick="deleteUserUpload(${product.id})">
                            <i class="fas fa-trash-alt"></i> Delete Product
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function deleteUserUpload(productId) {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        const productIndex = allProducts.findIndex(p => p.id == productId);
        if (productIndex !== -1 && allProducts[productIndex].seller === currentUserEmail) {
            allProducts.splice(productIndex, 1);
            saveProductsToStorage();
            renderAllProductPages();
            renderUserUploads();
            showToast('Product deleted successfully', 'success');
        }
    }
}

// ============================================
// HISTORY TAB SWITCHING
// ============================================
function initHistoryTabs() {
    const tabBtns = document.querySelectorAll('.history-tab-btn');
    const tabContents = document.querySelectorAll('.history-tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            tabContents.forEach(content => content.classList.remove('active'));
            
            if (tabId === 'purchases') {
                document.getElementById('purchasesTab').classList.add('active');
                renderPurchaseHistory();
            } else if (tabId === 'uploads') {
                document.getElementById('uploadsTab').classList.add('active');
                renderUserUploads();
            }
        });
    });
}

// ============================================
// RENDER WISHLIST PAGE
// ============================================
function renderWishlistPage() {
    const container = document.getElementById('wishlistGrid');
    const emptyState = document.getElementById('emptyWishlist');
    
    if (!container) return;
    
    const wishlistProducts = allProducts.filter(p => wishlist.includes(p.id));
    
    if (wishlistProducts.length === 0) {
        container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';
    
    container.innerHTML = wishlistProducts.map(prod => {
        const isOwner = (currentUserEmail && prod.seller === currentUserEmail);
        return `
            <div class="product-card" data-product-id="${prod.id}">
                ${isOwner ? `<button class="delete-btn" data-id="${prod.id}"><i class="fas fa-trash-alt"></i></button>` : ''}
                <div class="product-image-container">
                    <img class="product-img" src="${prod.imageDataURL || 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect width=%27100%27 height=%27100%27 fill=%27%23ddd%27/%3E%3Ctext x=%2750%27 y=%2755%27 fill=%27gray%27 text-anchor=%27middle%27%3E📷%3C/text%3E%3C/svg%3E'}" alt="${escapeHtml(prod.name)}">
                    <button class="wishlist-btn active" onclick="event.stopPropagation(); toggleWishlist(${prod.id}, this)">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div class="product-info">
                    <h3>${escapeHtml(prod.name)}</h3>
                    <div class="price">₹${prod.price}</div>
                    <div class="seller"><i class="fas fa-envelope"></i> ${escapeHtml(prod.seller.split('@')[0])}</div>
                    <div class="product-actions">
                        <button class="view-details-btn" onclick="event.stopPropagation(); openProductDetail(${prod.id})">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        <button class="delete-btn" onclick="event.stopPropagation(); removeFromWishlist(${prod.id})" style="background: rgba(239,68,68,0.1); color: #ef4444;">
                            <i class="fas fa-trash-alt"></i> Remove
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    attachProductClickEvent();
}

// ============================================
// PRODUCT STORAGE FUNCTIONS
// ============================================
function loadProductsFromStorage() {
    const stored = localStorage.getItem('campuscart_products');
    if (stored) {
        allProducts = JSON.parse(stored);
    } else {
        allProducts = [
            {
                id: Date.now() + 101,
                name: "Lab Coat (Medium)",
                category: "Lab Coats / Uniforms",
                price: 450,
                condition: "Like New",
                description: "Perfect for chemistry labs, barely used. Breathable fabric, size medium. Ideal for first-year practicals.",
                seller: "alumni@pccoepune.org",
                date: new Date().toISOString(),
                imageDataURL: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%233b82f6'/%3E%3Ctext x='50' y='55' font-size='14' fill='white' text-anchor='middle' dominant-baseline='middle'%3E🥼 Lab Coat%3C/text%3E%3C/svg%3E"
            },
            {
                id: Date.now() + 102,
                name: "Casio FX-991EX Calculator",
                category: "Calculators",
                price: 800,
                condition: "Very Good",
                description: "Scientific calculator, box included. Perfect for engineering exams. Solar powered.",
                seller: "senior@pccoepune.org",
                date: new Date().toISOString(),
                imageDataURL: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%234caf50'/%3E%3Ctext x='50' y='55' font-size='14' fill='white' text-anchor='middle'%3E🧮 Calculator%3C/text%3E%3C/svg%3E"
            },
            {
                id: Date.now() + 103,
                name: "Engineering Mathematics - III",
                category: "Books",
                price: 250,
                condition: "Good",
                description: "Latest edition, few highlights. Includes solved problems.",
                seller: "batchmate@pccoepune.org",
                date: new Date().toISOString(),
                imageDataURL: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23ff9800'/%3E%3Ctext x='50' y='55' font-size='14' fill='white' text-anchor='middle'%3E📘 Book%3C/text%3E%3C/svg%3E"
            },
            {
                id: Date.now() + 104,
                name: "Engineering Drawing Kit",
                category: "Stationery",
                price: 300,
                condition: "Very Good",
                description: "Compass, scale, set squares. Like new condition.",
                seller: "designer@pccoepune.org",
                date: new Date().toISOString(),
                imageDataURL: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%239c27b0'/%3E%3Ctext x='50' y='55' font-size='14' fill='white' text-anchor='middle'%3E✏️ Drawing Kit%3C/text%3E%3C/svg%3E"
            }
        ];
        saveProductsToStorage();
    }
    renderAllProductPages();
}

function saveProductsToStorage() {
    localStorage.setItem('campuscart_products', JSON.stringify(allProducts));
}

function deleteProductById(productId) {
    const productIndex = allProducts.findIndex(p => p.id == productId);
    if (productIndex === -1) return false;
    const product = allProducts[productIndex];
    if (product.seller !== currentUserEmail) {
        alert("You can only delete your own listings.");
        return false;
    }
    if (confirm(`Are you sure you want to remove "${product.name}"?`)) {
        allProducts.splice(productIndex, 1);
        saveProductsToStorage();
        renderAllProductPages();
        return true;
    }
    return false;
}

// ============================================
// FILTER & SORT FUNCTIONS
// ============================================
function getFilteredSortedProducts() {
    let filtered = [...allProducts];
    if (currentFilterCategory !== "all") {
        filtered = filtered.filter(p => p.category === currentFilterCategory);
    }
    if (currentSort === "priceLowHigh") {
        filtered.sort((a,b) => a.price - b.price);
    } else if (currentSort === "priceHighLow") {
        filtered.sort((a,b) => b.price - a.price);
    } else if (currentSort === "newest") {
        filtered.sort((a,b) => new Date(b.date) - new Date(a.date));
    }
    return filtered;
}

function renderFullProductsGrid() {
    const productsContainer = document.getElementById('allProductsGrid');
    if (!productsContainer) return;
    const filteredSorted = getFilteredSortedProducts();
    if (filteredSorted.length === 0) {
        productsContainer.innerHTML = '<div style="text-align:center; padding:2rem;">No products match the filter. Try resetting.</div>';
        return;
    }
    productsContainer.innerHTML = filteredSorted.map(prod => createProductCardHTML(prod, false)).join('');
    attachDeleteEventListeners();
    attachProductClickEvent();
}

function renderFeaturedProducts() {
    const featuredContainer = document.getElementById('featuredGrid');
    if (!featuredContainer) return;
    const featuredItems = allProducts.slice(0, 4);
    featuredContainer.innerHTML = featuredItems.map(prod => createProductCardHTML(prod, true)).join('');
    attachProductClickEvent();
}

function renderAllProductPages() {
    renderFeaturedProducts();
    renderFullProductsGrid();
    renderWishlistPage();
    if (document.getElementById('purchasesTab') && document.getElementById('purchasesTab').classList.contains('active')) {
        renderPurchaseHistory();
    }
    if (document.getElementById('uploadsTab') && document.getElementById('uploadsTab').classList.contains('active')) {
        renderUserUploads();
    }
}

// ============================================
// PRODUCT CARD HTML GENERATOR
// ============================================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function createProductCardHTML(prod, isFeatured = false) {
    let imgSrc = prod.imageDataURL || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23cccccc'/%3E%3Ctext x='50' y='55' fill='white' text-anchor='middle'%3E📷 No Image%3C/text%3E%3C/svg%3E";
    const isOwner = (currentUserEmail && prod.seller === currentUserEmail);
    const isWished = isInWishlist(prod.id);
    const wishlistIconClass = isWished ? 'active' : '';
    
    // No delete button here - delete only appears in History > My Uploaded Products
    return `
        <div class="product-card" data-product-id="${prod.id}">
            <div class="product-image-container">
                <img class="product-img" src="${imgSrc}" alt="${escapeHtml(prod.name)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect width=%27100%27 height=%27100%27 fill=%27%23ddd%27/%3E%3Ctext x=%2750%27 y=%2755%27 fill=%27gray%27 text-anchor=%27middle%27%3E📷%3C/text%3E%3C/svg%3E'">
                <button class="wishlist-btn ${wishlistIconClass}" onclick="event.stopPropagation(); toggleWishlist(${prod.id}, this)">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
            <div class="product-info">
                <h3>${escapeHtml(prod.name)}</h3>
                <div class="price">
                    ₹${prod.price}
                    <span class="original-price">₹${Math.round(prod.price * 1.3)}</span>
                    <span class="discount">${Math.round((prod.price * 0.3 / (prod.price * 1.3)) * 100)}% off</span>
                </div>
                <div class="seller">
                    <i class="fas fa-envelope"></i> ${escapeHtml(prod.seller.split('@')[0])}
                </div>
                <p style="font-size:0.8rem; color:var(--text-gray); margin: 0.5rem 0;">${escapeHtml(prod.description.substring(0, 60))}${prod.description.length>60?'…':''}</p>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                    <span style="background:var(--bg-light); padding:0.2rem 0.6rem; border-radius:1rem; font-size:0.7rem;">${prod.condition}</span>
                    <span style="background:var(--bg-light); padding:0.2rem 0.6rem; border-radius:1rem; font-size:0.7rem;">${prod.category}</span>
                </div>
                <div class="product-actions">
                    <button class="view-details-btn" onclick="event.stopPropagation(); openProductDetail(${prod.id})">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// DELETE EVENT LISTENERS
// ============================================
function attachDeleteEventListeners() {
    const deleteBtns = document.querySelectorAll('.delete-btn');
    deleteBtns.forEach(btn => {
        btn.removeEventListener('click', handleDeleteClick);
        btn.addEventListener('click', handleDeleteClick);
    });
}

function handleDeleteClick(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const productId = parseInt(btn.getAttribute('data-id'));
    if (productId) deleteProductById(productId);
}

// ============================================
// PRODUCT DETAIL MODAL
// ============================================
function openProductDetail(productId) {
    const product = allProducts.find(p => p.id == productId);
    if (!product) return;
    
    if (product.seller !== currentUserEmail) {
        addToPurchaseHistory(productId);
    }
    
    document.getElementById('modalImg').src = product.imageDataURL || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23cccccc'/%3E%3Ctext x='50' y='55' fill='white' text-anchor='middle'%3E📷%3C/text%3E%3C/svg%3E";
    document.getElementById('modalTitle').innerText = product.name;
    document.getElementById('modalPrice').innerHTML = `₹${product.price}`;
    document.getElementById('modalCategory').innerText = product.category;
    document.getElementById('modalCondition').innerText = product.condition;
    document.getElementById('modalSeller').innerText = product.seller;
    document.getElementById('modalDate').innerText = new Date(product.date).toLocaleDateString();
    document.getElementById('modalDesc').innerText = product.description;
    document.getElementById('productModal').style.display = 'flex';
}

function attachProductClickEvent() {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.removeEventListener('click', cardClickHandler);
        card.addEventListener('click', cardClickHandler);
    });
}

function cardClickHandler(e) {
    if (e.target.classList && (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn'))) return;
    if (e.target.classList && (e.target.classList.contains('wishlist-btn') || e.target.closest('.wishlist-btn'))) return;
    if (e.target.classList && (e.target.classList.contains('view-details-btn') || e.target.closest('.view-details-btn'))) return;
    const productId = parseInt(this.getAttribute('data-product-id'));
    if (productId) openProductDetail(productId);
}

// ============================================
// FILTER UI HANDLERS
// ============================================
function setupFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const sortSelect = document.getElementById('sortSelect');
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (categoryFilter) categoryFilter.addEventListener('change', (e) => {
        currentFilterCategory = e.target.value;
        renderFullProductsGrid();
    });
    if (sortSelect) sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderFullProductsGrid();
    });
    if (resetBtn) resetBtn.addEventListener('click', () => {
        currentFilterCategory = "all";
        currentSort = "newest";
        if (categoryFilter) categoryFilter.value = "all";
        if (sortSelect) sortSelect.value = "newest";
        renderFullProductsGrid();
    });
}

// ============================================
// IMAGE UPLOAD HANDLER
// ============================================
let selectedImageDataURL = null;
const imageInput = document.getElementById('productImage');
const previewContainer = document.getElementById('imagePreviewContainer');

if (imageInput) {
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && (file.type.startsWith('image/'))) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                selectedImageDataURL = ev.target.result;
                if (previewContainer) {
                    previewContainer.innerHTML = `<img src="${selectedImageDataURL}" alt="preview"><button type="button" id="clearPreviewBtn" style="background:#e74c3c; border:none; padding:0.2rem 0.6rem; border-radius:1rem; color:white; margin-left:0.5rem;">Remove</button>`;
                    const clearBtn = document.getElementById('clearPreviewBtn');
                    if (clearBtn) clearBtn.onclick = () => { selectedImageDataURL = null; imageInput.value = ''; if(previewContainer) previewContainer.innerHTML = ''; };
                }
            };
            reader.readAsDataURL(file);
        } else {
            selectedImageDataURL = null;
            if (previewContainer) previewContainer.innerHTML = '<span style="color:red;">Invalid image file</span>';
        }
    });
}

function setupSellForm() {
    const submitBtn = document.getElementById('submitProductBtn');
    if (!submitBtn) return;
    submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const name = document.getElementById('productName').value.trim();
        const price = document.getElementById('productPrice').value.trim();
        const desc = document.getElementById('productDesc').value.trim();
        const category = document.getElementById('productCategory').value;
        const condition = document.getElementById('productCondition').value;

        if (!name || !price || !desc) {
            alert('Please fill product name, price and description.');
            return;
        }
        if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            alert('Enter valid price.');
            return;
        }
        if (!selectedImageDataURL) {
            if (!confirm('No photo selected. List without image? (Recommended to add photo)')) {
                return;
            }
        }
        const newProduct = {
            id: Date.now(),
            name: name,
            category: category,
            price: parseFloat(price),
            condition: condition,
            description: desc,
            seller: currentUserEmail,
            date: new Date().toISOString(),
            imageDataURL: selectedImageDataURL || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23b0bec5'/%3E%3Ctext x='50' y='55' fill='white' text-anchor='middle'%3E📷 No Photo%3C/text%3E%3C/svg%3E"
        };
        addProduct(newProduct);
        alert('✅ Product listed successfully!');
        document.getElementById('productName').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productDesc').value = '';
        document.getElementById('productCategory').selectedIndex = 0;
        document.getElementById('productCondition').selectedIndex = 0;
        if (imageInput) imageInput.value = '';
        selectedImageDataURL = null;
        if (previewContainer) previewContainer.innerHTML = '';
        switchPage('products');
    });
}

function addProduct(product) {
    allProducts.unshift(product);
    saveProductsToStorage();
    renderAllProductPages();
}

// ============================================
// LOGIN & AUTHENTICATION FUNCTIONS
// ============================================
function isValidCollegeEmail(email) {
    return email && email.trim().toLowerCase().endsWith('@pccoepune.org');
}

function showLoginError(msg) {
    const errDiv = document.getElementById('loginErrorMsg');
    errDiv.textContent = msg;
    errDiv.style.display = 'block';
    setTimeout(() => errDiv.style.display = 'none', 2800);
}

function performLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pwd = document.getElementById('loginPassword').value.trim();
    if (!email || !pwd) return showLoginError('Email and password required.');
    if (!isValidCollegeEmail(email)) return showLoginError('Access restricted: Only @pccoepune.org emails can login.');
    currentUserEmail = email.toLowerCase();
    localStorage.setItem('campusCartUser', JSON.stringify({ email: currentUserEmail, loggedIn: true }));
    showMainApp();
}

function showMainApp() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('userEmailDisplay').innerText = currentUserEmail;
    switchPage('home');
    updateActiveNav('home');
    loadProductsFromStorage();
    setupFilters();
}

function logout() {
    localStorage.removeItem('campusCartUser');
    currentUserEmail = null;
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
}

// ============================================
// PAGE NAVIGATION
// ============================================
const pages = {
    home: document.getElementById('homePage'),
    products: document.getElementById('productsPage'),
    sell: document.getElementById('sellPage'),
    history: document.getElementById('historyPage'),
    wishlist: document.getElementById('wishlistPage'),
    about: document.getElementById('aboutPage'),
    feedback: document.getElementById('feedbackPage'),
    contact: document.getElementById('contactPage')
};

function switchPage(pageId) {
    Object.keys(pages).forEach(pid => {
        if (pages[pid]) pages[pid].classList.remove('active-page');
    });
    if (pages[pageId]) pages[pageId].classList.add('active-page');
    else pages.home.classList.add('active-page');
    updateActiveNav(pageId);
    
    if (pageId === 'products') renderFullProductsGrid();
    if (pageId === 'home') renderFeaturedProducts();
    if (pageId === 'wishlist') renderWishlistPage();
    if (pageId === 'history') {
        const purchasesTab = document.getElementById('purchasesTab');
        const uploadsTab = document.getElementById('uploadsTab');
        const purchasesBtn = document.querySelector('.history-tab-btn[data-tab="purchases"]');
        const uploadsBtn = document.querySelector('.history-tab-btn[data-tab="uploads"]');
        
        if (purchasesTab && uploadsTab) {
            purchasesTab.classList.add('active');
            uploadsTab.classList.remove('active');
        }
        if (purchasesBtn && uploadsBtn) {
            purchasesBtn.classList.add('active');
            uploadsBtn.classList.remove('active');
        }
        renderPurchaseHistory();
        renderUserUploads();
    }
}

function updateActiveNav(active) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.getAttribute('data-page') === active) btn.classList.add('active-tab');
        else btn.classList.remove('active-tab');
    });
}

function attachNavEvents() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.getAttribute('data-page');
            if (page && pages[page]) switchPage(page);
        });
    });
}

function checkSession() {
    const stored = localStorage.getItem('campusCartUser');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            if (data.loggedIn && data.email && isValidCollegeEmail(data.email)) {
                currentUserEmail = data.email;
                showMainApp();
                return;
            }
        } catch(e) {}
    }
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

// ============================================
// ADD ANIMATION KEYFRAMES
// ============================================
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .view-all-btn:hover {
        transform: translateX(5px);
    }
    .category-card {
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(styleSheet);

// ============================================
// CONTACT SELLER FUNCTION
// ============================================

function contactSeller(sellerEmail, productName) {
    if (!sellerEmail) {
        showToast('Seller email not available', 'error');
        return;
    }
    
    const subject = encodeURIComponent(`Interested in your product: ${productName} on CampusCart`);
    const body = encodeURIComponent(`Hello,\n\nI'm interested in your product "${productName}" listed on CampusCart. Could you please share more details?\n\nThank you!\n\n- From CampusCart Buyer`);
    
    window.location.href = `mailto:${sellerEmail}?subject=${subject}&body=${body}`;
    
    showToast('Opening your email app...', 'success');
}

// ============================================
// INITIALIZATION
// ============================================
function init() {
    attachNavEvents();
    setupSellForm();
    initHistoryTabs();
    initDarkMode();
    initMobileMenu();
    initSearch();
    initCategoryCards();
    
    document.getElementById('doLoginBtn').addEventListener('click', performLogin);
    document.getElementById('logoutBtnMain').addEventListener('click', logout);
    
    const modalClose = document.getElementById('closeModalBtn');
    if (modalClose) modalClose.addEventListener('click', () => document.getElementById('productModal').style.display = 'none');
    
    window.addEventListener('click', (e) => { 
        if (e.target === document.getElementById('productModal')) 
            document.getElementById('productModal').style.display = 'none'; 
    });
    
    const passwordField = document.getElementById('loginPassword');
    const emailField = document.getElementById('loginEmail');
    const loginHandler = (e) => { if (e.key === 'Enter') performLogin(); };
    if (passwordField) passwordField.addEventListener('keypress', loginHandler);
    if (emailField) emailField.addEventListener('keypress', loginHandler);
    
    checkSession();
}

// Start the application
init();