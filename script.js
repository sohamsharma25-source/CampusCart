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

// -------- Firestore sync & migration helpers --------
async function loadFirestoreProducts() {
    if (!window.firestore) return;
    try {
        const snapshot = await window.firestore.collection('products').orderBy('date', 'desc').get();
        const remote = snapshot.docs.map(d => ({ firebaseDocId: d.id, ...d.data() }));
        // Append remote items after local ones but avoid exact id collisions
        const existingIds = new Set(allProducts.map(p => p.id));
        remote.forEach(r => {
            // If remote product uses numeric id that collides, keep both by not overwriting
            if (!existingIds.has(r.id)) {
                allProducts.push(r);
            }
        });
        renderAllProductPages();
        showToast('Loaded remote listings', 'success');
    } catch (err) {
        console.error('Failed loading Firestore products', err);
    }
}

function dataURLtoFile(dataurl, filename) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename || 'image.png', { type: mime });
}

async function migrateLocalProductsToFirestore() {
    if (!window.addProductToFirestore || !window.uploadImageWithProgress) return;
    const toMigrate = allProducts.filter(p => !p.firebaseDocId);
    if (!toMigrate.length) return;
    if (!confirm(`Found ${toMigrate.length} local listings. Upload them to Firebase?`)) return;
    for (const p of toMigrate) {
        try {
            const prod = Object.assign({}, p);
            // If imageDataURL is a data URL, convert and upload
            if (prod.imageDataURL && prod.imageDataURL.startsWith('data:')) {
                const file = dataURLtoFile(prod.imageDataURL, `prod_${prod.id}.png`);
                const url = await window.uploadImageAndGetURL(file, 'products/');
                prod.imageDataURL = url;
            }
            const docRef = await window.addProductToFirestore(prod);
            p.firebaseDocId = docRef.id;
            saveProductsToStorage();
        } catch (err) {
            console.error('Migration error for product', p, err);
        }
    }
    showToast('Migration complete', 'success');
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
let selectedImageFile = null;
const imageInput = document.getElementById('productImage');
const previewContainer = document.getElementById('imagePreviewContainer');

if (imageInput) {
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && (file.type.startsWith('image/'))) {
            selectedImageFile = file;
            const reader = new FileReader();
            reader.onload = function(ev) {
                selectedImageDataURL = ev.target.result;
                if (previewContainer) {
                    previewContainer.innerHTML = `<img src="${selectedImageDataURL}" alt="preview"><button type="button" id="clearPreviewBtn" style="background:#e74c3c; border:none; padding:0.2rem 0.6rem; border-radius:1rem; color:white; margin-left:0.5rem;">Remove</button>`;
                    const clearBtn = document.getElementById('clearPreviewBtn');
                    if (clearBtn) clearBtn.onclick = () => { selectedImageDataURL = null; selectedImageFile = null; imageInput.value = ''; if(previewContainer) previewContainer.innerHTML = ''; };
                }
            };
            reader.readAsDataURL(file);
        } else {
            selectedImageDataURL = null;
            selectedImageFile = null;
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
        // Always keep the local sample/products behavior: add product locally first
        addProduct(newProduct);
        alert('✅ Product listed successfully!');

        // If Firebase is configured, attempt background upload to Storage + Firestore
        if (window.firebaseConfig && window.firebaseConfig.apiKey && window.firebaseConfig.apiKey !== 'YOUR_API_KEY' && window.uploadImageWithProgress && window.addProductToFirestore) {
            // show a small progress element near submit button
            let statusEl = document.getElementById('uploadStatus');
            if (!statusEl) {
                statusEl = document.createElement('div');
                statusEl.id = 'uploadStatus';
                statusEl.style.marginTop = '0.6rem';
                statusEl.style.fontSize = '0.9rem';
                statusEl.style.color = 'var(--text-gray)';
                const submit = document.getElementById('submitProductBtn');
                if (submit && submit.parentNode) submit.parentNode.insertBefore(statusEl, submit.nextSibling);
            }
            (async () => {
                try {
                    const prodForUpload = Object.assign({}, newProduct);
                    if (selectedImageFile) {
                        statusEl.innerText = 'Uploading image: 0%';
                        const url = await window.uploadImageWithProgress(selectedImageFile, 'products/', (pct) => {
                            statusEl.innerText = `Uploading image: ${pct}%`;
                        });
                        prodForUpload.imageDataURL = url;
                    }
                    statusEl.innerText = 'Saving listing...';
                    const docRef = await window.addProductToFirestore(prodForUpload);
                    // mark local product as uploaded
                    const local = allProducts.find(p => p.id === newProduct.id);
                    if (local) local.firebaseDocId = docRef.id;
                    saveProductsToStorage();
                    statusEl.innerText = 'Uploaded to Firebase ✓';
                    setTimeout(() => statusEl && (statusEl.innerText = ''), 3000);
                    showToast('Listing uploaded to Firebase', 'success');
                } catch (err) {
                    console.error('Firebase upload error', err);
                    showToast('Firebase upload failed (kept locally)', 'error');
                }
            })();
        }
        document.getElementById('productName').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productDesc').value = '';
        document.getElementById('productCategory').selectedIndex = 0;
        document.getElementById('productCondition').selectedIndex = 0;
        if (imageInput) imageInput.value = '';
        selectedImageDataURL = null;
        selectedImageFile = null;
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

function getLoginErrorMessage(err) {
    const code = err && err.code ? err.code : '';
    const message = err && err.message ? err.message : '';

    if (code === 'auth/invalid-login-credentials' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        return 'Invalid email or password. If this is a new account, make sure it exists in Firebase Authentication and email/password sign-in is enabled.';
    }

    if (code === 'auth/operation-not-allowed') {
        return 'Email/password sign-in is disabled in Firebase Authentication. Enable it in the Firebase console.';
    }

    if (code === 'auth/invalid-email') {
        return 'Enter a valid college email address.';
    }

    if (code === 'auth/too-many-requests') {
        return 'Too many failed attempts. Please wait a moment and try again.';
    }

    return message || 'Login failed. Check your Firebase Authentication settings.';
}

function performLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pwd = document.getElementById('loginPassword').value.trim();
    if (!email || !pwd) return showLoginError('Email and password required.');
    if (!isValidCollegeEmail(email)) return showLoginError('Access restricted: Only @pccoepune.org emails can login.');
    // If Firebase auth is available and configured, use it; otherwise fallback to local login
    if (window.signInWithEmail && window.firebaseConfig && window.firebaseConfig.apiKey && window.firebaseConfig.apiKey !== 'YOUR_API_KEY') {
        window.signInWithEmail(email, pwd)
            .then(cred => {
                currentUserEmail = cred.user.email.toLowerCase();
                localStorage.setItem('campusCartUser', JSON.stringify({ email: currentUserEmail, loggedIn: true }));
                showMainApp();
            })
            .catch(err => {
                console.error('Firebase login error', err);
                showLoginError(getLoginErrorMessage(err));
            });
        return;
    }

    // Fallback local session (keeps current sample products behavior)
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
    // Sign out from Firebase if available
    if (window.signOut) {
        window.signOut().catch(() => {});
    }
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
// AUTHENTICATION SYSTEM (FRONTEND ONLY)
// ============================================

// User storage
let users = JSON.parse(localStorage.getItem('campuscart_users')) || [];

// Static OTP for testing
const STATIC_OTP = "123456";
let currentOtpEmail = null;
let otpTimer = null;
let otpTimeLeft = 0;

// ============================================
// SHOW/HIDE PASSWORD TOGGLE
// ============================================
function initPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            if (targetInput) {
                const type = targetInput.type === 'password' ? 'text' : 'password';
                targetInput.type = type;
                btn.querySelector('i').classList.toggle('fa-eye');
                btn.querySelector('i').classList.toggle('fa-eye-slash');
            }
        });
    });
}

// ============================================
// SWITCH BETWEEN AUTH FORMS
// ============================================
function switchAuthForm(formToShow) {
    const forms = ['loginForm', 'signupForm', 'otpForm', 'passwordForm', 'forgotPasswordForm'];
    forms.forEach(form => {
        const element = document.getElementById(form);
        if (element) element.classList.remove('active');
    });
    
    const targetForm = document.getElementById(formToShow);
    if (targetForm) targetForm.classList.add('active');
    
    // Update title and subtitle
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    
    switch(formToShow) {
        case 'loginForm':
            title.textContent = 'Welcome Back';
            subtitle.textContent = 'Sign in to continue to CampusCart';
            break;
        case 'signupForm':
            title.textContent = 'Create Account';
            subtitle.textContent = 'Join CampusCart student marketplace';
            break;
        case 'forgotPasswordForm':
            title.textContent = 'Reset Password';
            subtitle.textContent = 'Enter your email to reset password';
            break;
        default:
            title.textContent = 'CampusCart';
            subtitle.textContent = 'Secure student marketplace';
    }
}

// ============================================
// OTP TIMER FUNCTION
// ============================================
function startOtpTimer(seconds = 60) {
    otpTimeLeft = seconds;
    const timerDisplay = document.getElementById('countdown');
    const resendBtn = document.getElementById('resendOtpBtn');
    
    if (otpTimer) clearInterval(otpTimer);
    
    otpTimer = setInterval(() => {
        if (otpTimeLeft <= 0) {
            clearInterval(otpTimer);
            if (timerDisplay) timerDisplay.textContent = '00:00';
            if (resendBtn) {
                resendBtn.disabled = false;
                resendBtn.style.opacity = '1';
            }
        } else {
            otpTimeLeft--;
            const minutes = Math.floor(otpTimeLeft / 60);
            const seconds = otpTimeLeft % 60;
            if (timerDisplay) {
                timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            if (resendBtn) {
                resendBtn.disabled = true;
                resendBtn.style.opacity = '0.5';
            }
        }
    }, 1000);
}

// ============================================
// OTP INPUT AUTO-MOVE
// ============================================
function initOtpInputs() {
    const otpInputs = document.querySelectorAll('.otp-input');
    
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && index > 0 && !e.target.value) {
                otpInputs[index - 1].focus();
            }
        });
        
        // Allow only numbers
        input.addEventListener('keypress', (e) => {
            if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        });
    });
}

// ============================================
// GET OTP VALUE
// ============================================
function getOtpValue() {
    const otpInputs = document.querySelectorAll('.otp-input');
    let otp = '';
    otpInputs.forEach(input => {
        otp += input.value;
    });
    return otp;
}

// ============================================
// CLEAR OTP INPUTS
// ============================================
function clearOtpInputs() {
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach(input => {
        input.value = '';
    });
    if (otpInputs[0]) otpInputs[0].focus();
}

// ============================================
// SHOW ERROR MESSAGE
// ============================================
function showAuthError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    }
}

// ============================================
// SHOW SUCCESS MODAL
// ============================================
function showSuccessModal(message, callback) {
    const modal = document.getElementById('successModal');
    const messageSpan = document.getElementById('successMessage');
    if (messageSpan) messageSpan.textContent = message;
    if (modal) modal.style.display = 'flex';
    
    const closeBtn = document.getElementById('successModalClose');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
            if (callback) callback();
        };
    }
}

// ============================================
// SIGNUP - SEND OTP
// ============================================
function sendOtp() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    
    if (!name) {
        showAuthError('signupErrorMsg', 'Please enter your full name');
        return;
    }
    
    if (!email || !email.endsWith('@pccoepune.org')) {
        showAuthError('signupErrorMsg', 'Please enter a valid @pccoepune.org email');
        return;
    }
    
    // Check if user already exists
    const userExists = users.some(u => u.email === email);
    if (userExists) {
        showAuthError('signupErrorMsg', 'Account already exists with this email. Please login.');
        return;
    }
    
    currentOtpEmail = email;
    document.getElementById('otpEmailDisplay').textContent = email;
    
    // Simulate OTP sending
    showAuthError('signupErrorMsg', '');
    showAuthError('otpErrorMsg', '');
    
    // Show success message
    const tempMsg = document.createElement('div');
    tempMsg.style.cssText = 'background: #10b98120; color: #10b981; padding: 0.75rem; border-radius: 0.75rem; margin-bottom: 1rem; text-align: center; font-size: 0.85rem;';
    tempMsg.innerHTML = '<i class="fas fa-check-circle"></i> OTP sent successfully! (Test OTP: 123456)';
    document.getElementById('otpForm').insertBefore(tempMsg, document.getElementById('otpForm').firstChild);
    setTimeout(() => tempMsg.remove(), 3000);
    
    // Switch to OTP form
    switchAuthForm('otpForm');
    clearOtpInputs();
    startOtpTimer(60);
}

// ============================================
// VERIFY OTP
// ============================================
function verifyOtp() {
    const enteredOtp = getOtpValue();
    
    if (enteredOtp.length !== 6) {
        showAuthError('otpErrorMsg', 'Please enter complete 6-digit OTP');
        return;
    }
    
    if (enteredOtp === STATIC_OTP) {
        // OTP verified - move to password creation
        clearInterval(otpTimer);
        switchAuthForm('passwordForm');
        showAuthError('otpErrorMsg', '');
    } else {
        showAuthError('otpErrorMsg', 'Invalid OTP. Please try again. (Test OTP: 123456)');
    }
}

// ============================================
// RESEND OTP
// ============================================
function resendOtp() {
    if (otpTimeLeft > 0) {
        showAuthError('otpErrorMsg', `Please wait ${otpTimeLeft} seconds before resending`);
        return;
    }
    
    // Simulate resend
    const tempMsg = document.createElement('div');
    tempMsg.style.cssText = 'background: #10b98120; color: #10b981; padding: 0.75rem; border-radius: 0.75rem; margin-bottom: 1rem; text-align: center; font-size: 0.85rem;';
    tempMsg.innerHTML = '<i class="fas fa-check-circle"></i> OTP resent successfully! (Test OTP: 123456)';
    document.getElementById('otpForm').insertBefore(tempMsg, document.getElementById('otpForm').firstChild);
    setTimeout(() => tempMsg.remove(), 2000);
    
    startOtpTimer(60);
    clearOtpInputs();
}

// ============================================
// CREATE PASSWORD (Complete Signup)
// ============================================
function createPassword() {
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const name = document.getElementById('signupName').value.trim();
    
    if (!password || password.length < 4) {
        showAuthError('passwordErrorMsg', 'Password must be at least 4 characters');
        return;
    }
    
    if (password !== confirmPassword) {
        showAuthError('passwordErrorMsg', 'Passwords do not match');
        return;
    }
    
    // Save user to localStorage
    const newUser = {
        id: Date.now(),
        name: name,
        email: currentOtpEmail,
        password: password, // In real app, this would be hashed
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('campuscart_users', JSON.stringify(users));
    
    // Clear forms
    document.getElementById('signupName').value = '';
    document.getElementById('signupEmail').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    // Show success and redirect to login
    showSuccessModal('Account Created Successfully!', () => {
        switchAuthForm('loginForm');
    });
}

// ============================================
// LOGIN FUNCTION
// ============================================
function performLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!email || !password) {
        showAuthError('loginErrorMsg', 'Please enter email and password');
        return;
    }
    
    if (!email.endsWith('@pccoepune.org')) {
        showAuthError('loginErrorMsg', 'Only @pccoepune.org emails are allowed');
        return;
    }
    
    // Check if user exists (for demo, allow any password with @pccoepune.org)
    const userExists = users.some(u => u.email === email && u.password === password);
    
    // For demo: also accept any @pccoepune.org email with any password (fallback)
    if (userExists || (email.endsWith('@pccoepune.org') && password.length > 0)) {
        currentUserEmail = email;
        
        if (rememberMe) {
            localStorage.setItem('campusCartUser', JSON.stringify({ email: currentUserEmail, loggedIn: true }));
        } else {
            sessionStorage.setItem('campusCartUser', JSON.stringify({ email: currentUserEmail, loggedIn: true }));
        }
        
        showMainApp();
    } else {
        showAuthError('loginErrorMsg', 'Invalid email or password. Please sign up first.');
    }
}

// ============================================
// FORGOT PASSWORD - SEND RESET OTP
// ============================================
function sendResetOtp() {
    const email = document.getElementById('forgotEmail').value.trim();
    
    if (!email || !email.endsWith('@pccoepune.org')) {
        showAuthError('forgotErrorMsg', 'Please enter a valid @pccoepune.org email');
        return;
    }
    
    const userExists = users.some(u => u.email === email);
    
    if (userExists) {
        // Simulate OTP send
        showAuthError('forgotErrorMsg', '');
        const tempMsg = document.createElement('div');
        tempMsg.style.cssText = 'background: #10b98120; color: #10b981; padding: 0.75rem; border-radius: 0.75rem; margin-bottom: 1rem; text-align: center; font-size: 0.85rem;';
        tempMsg.innerHTML = '<i class="fas fa-check-circle"></i> Password reset OTP sent! (Test OTP: 123456)';
        document.getElementById('forgotPasswordForm').insertBefore(tempMsg, document.getElementById('forgotPasswordForm').firstChild);
        setTimeout(() => tempMsg.remove(), 3000);
        
        // In a real app, you'd show OTP verification here
        alert('Demo: Password reset link would be sent. For testing, you can login with any password for @pccoepune.org emails.');
    } else {
        showAuthError('forgotErrorMsg', 'No account found with this email. Please sign up first.');
    }
}

// ============================================
// MODIFIED CHECK SESSION
// ============================================
function checkSession() {
    const stored = localStorage.getItem('campusCartUser') || sessionStorage.getItem('campusCartUser');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            if (data.loggedIn && data.email && data.email.endsWith('@pccoepune.org')) {
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
// MODIFIED LOGOUT
// ============================================
function logout() {
    localStorage.removeItem('campusCartUser');
    sessionStorage.removeItem('campusCartUser');
    currentUserEmail = null;
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    
    // Reset login form
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('rememberMe').checked = false;
    
    // Reset all auth forms
    switchAuthForm('loginForm');
}
// ============================================
// FEEDBACK PAGE FUNCTIONALITY
// ============================================

// Sample reviews data
let sampleReviews = [
    {
        id: 1,
        name: "Rahul Sharma",
        rating: 5,
        review: "CampusCart is amazing! I found all my engineering books at affordable prices. The platform is very easy to use.",
        question: "",
        date: "2024-01-15",
        avatar: "RS"
    },
    {
        id: 2,
        name: "Priya Patel",
        rating: 5,
        review: "Great platform for students. I sold my old calculator within 2 days. Highly recommended!",
        question: "When will the mobile app launch?",
        date: "2024-01-20",
        avatar: "PP"
    },
    {
        id: 3,
        name: "Amit Kumar",
        rating: 4,
        review: "Very useful marketplace. Found my lab coat at half price. The interface is clean and professional.",
        question: "",
        date: "2024-01-25",
        avatar: "AK"
    },
    {
        id: 4,
        name: "Neha Gupta",
        rating: 5,
        review: "Love the concept! Student-only marketplace is a great idea. Transaction was smooth and secure.",
        question: "Will there be a bidding feature?",
        date: "2024-02-01",
        avatar: "NG"
    }
];

// Star rating functionality
function initStarRating() {
    const stars = document.querySelectorAll('.star-rating i');
    const ratingInput = document.getElementById('selectedRating');
    
    stars.forEach(star => {
        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            highlightStars(rating, 'hover');
        });
        
        star.addEventListener('mouseleave', function() {
            const currentRating = parseInt(ratingInput.value) || 0;
            highlightStars(currentRating, 'active');
            removeHoverClass();
        });
        
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            ratingInput.value = rating;
            highlightStars(rating, 'active');
            showToast(`Selected ${rating} star${rating > 1 ? 's' : ''}`, 'success');
        });
    });
}

function highlightStars(rating, type) {
    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach((star, index) => {
        const starRating = parseInt(star.getAttribute('data-rating'));
        if (starRating <= rating) {
            star.className = 'fas fa-star';
            if (type === 'hover') star.classList.add('hover');
        } else {
            star.className = 'far fa-star';
        }
    });
}

function removeHoverClass() {
    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach(star => {
        star.classList.remove('hover');
    });
}

// Load and display reviews
function loadReviews() {
    const reviewsContainer = document.getElementById('reviewsList');
    if (!reviewsContainer) return;
    
    if (sampleReviews.length === 0) {
        reviewsContainer.innerHTML = '<div class="placeholder-card">No reviews yet. Be the first to review!</div>';
        return;
    }
    
    reviewsContainer.innerHTML = sampleReviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-avatar">${review.avatar}</div>
                <div class="review-user-info">
                    <h4>${escapeHtml(review.name)}</h4>
                    <div class="review-stars">
                        ${renderStars(review.rating)}
                    </div>
                    <div class="review-date">${new Date(review.date).toLocaleDateString()}</div>
                </div>
            </div>
            <p class="review-text">"${escapeHtml(review.review)}"</p>
            ${review.question ? `<div class="review-question"><i class="fas fa-question-circle"></i> Q: ${escapeHtml(review.question)}</div>` : ''}
        </div>
    `).join('');
}

function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// Submit feedback
function submitFeedback() {
    const rating = parseInt(document.getElementById('selectedRating').value);
    const reviewText = document.getElementById('reviewText').value.trim();
    const question = document.getElementById('askQuestion').value.trim();
    
    if (rating === 0) {
        showToast('Please select a rating', 'error');
        return;
    }
    
    if (!reviewText) {
        showToast('Please write your review', 'error');
        return;
    }
    
    // Create new review
    const newReview = {
        id: Date.now(),
        name: currentUserEmail ? currentUserEmail.split('@')[0] : "Student User",
        rating: rating,
        review: reviewText,
        question: question || "",
        date: new Date().toISOString(),
        avatar: (currentUserEmail ? currentUserEmail.split('@')[0].substring(0, 2).toUpperCase() : "SU")
    };
    
    // Add to sample reviews
    sampleReviews.unshift(newReview);
    
    // Clear form
    document.getElementById('selectedRating').value = 0;
    document.getElementById('reviewText').value = '';
    document.getElementById('askQuestion').value = '';
    
    // Reset stars
    highlightStars(0, 'active');
    
    // Reload reviews
    loadReviews();
    
    // Show success message
    showToast('Thank you for your feedback! 🎉', 'success');
}

// ============================================
// CONTACT PAGE - Copy email/phone functionality
// ============================================

function initContactCopy() {
    const contactLinks = document.querySelectorAll('.contact-link');
    contactLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const text = link.textContent;
            navigator.clipboard.writeText(text).then(() => {
                showToast(`${text} copied to clipboard!`, 'success');
            });
        });
    });
}

// ============================================
// Update init function to include new features
// ============================================

// Add these lines to your existing init() function
// Find your init() function and add these inside it:

/*
// Inside init() function, add:
initStarRating();
loadReviews();
initContactCopy();

document.getElementById('submitFeedbackBtn')?.addEventListener('click', submitFeedback);
*/

// ============================================
// INITIALIZATION
// ============================================
function init() {
    // Navigation Events
    attachNavEvents();
    
    // Sell Form Setup
    setupSellForm();
    
    // History Page Tabs
    initHistoryTabs();
    
    // Dark Mode
    initDarkMode();
    
    // Mobile Menu
    initMobileMenu();
    
    // Search Functionality
    initSearch();
    
    // Category Cards
    initCategoryCards();
    
    // Password Toggles (Auth)
    initPasswordToggles();
    
    // OTP Inputs (Auth)
    initOtpInputs();
    
    // Star Rating (Feedback Page)
    initStarRating();
    
    // Load Reviews (Feedback Page)
    loadReviews();
    
    // Contact Page Copy Functionality
    initContactCopy();
    
    // ============================================
    // AUTHENTICATION EVENT LISTENERS
    // ============================================
    const loginBtn = document.getElementById('doLoginBtn');
    if (loginBtn) loginBtn.addEventListener('click', performLogin);
    
    const showSignupBtn = document.getElementById('showSignupBtn');
    if (showSignupBtn) showSignupBtn.addEventListener('click', () => switchAuthForm('signupForm'));
    
    const showLoginFromSignupBtn = document.getElementById('showLoginFromSignupBtn');
    if (showLoginFromSignupBtn) showLoginFromSignupBtn.addEventListener('click', () => switchAuthForm('loginForm'));
    
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    if (sendOtpBtn) sendOtpBtn.addEventListener('click', sendOtp);
    
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    if (verifyOtpBtn) verifyOtpBtn.addEventListener('click', verifyOtp);
    
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    if (resendOtpBtn) resendOtpBtn.addEventListener('click', resendOtp);
    
    const createPasswordBtn = document.getElementById('createPasswordBtn');
    if (createPasswordBtn) createPasswordBtn.addEventListener('click', createPassword);
    
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', () => switchAuthForm('forgotPasswordForm'));
    
    const backToLoginFromForgotBtn = document.getElementById('backToLoginFromForgotBtn');
    if (backToLoginFromForgotBtn) backToLoginFromForgotBtn.addEventListener('click', () => switchAuthForm('loginForm'));
    
    const sendResetOtpBtn = document.getElementById('sendResetOtpBtn');
    if (sendResetOtpBtn) sendResetOtpBtn.addEventListener('click', sendResetOtp);
    
    // ============================================
    // FEEDBACK SUBMIT BUTTON
    // ============================================
    const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');
    if (submitFeedbackBtn) {
        submitFeedbackBtn.addEventListener('click', submitFeedback);
    }
    
    // ============================================
    // LOGOUT BUTTON
    // ============================================
    const logoutBtn = document.getElementById('logoutBtnMain');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    // ============================================
    // PRODUCT MODAL
    // ============================================
    const modalClose = document.getElementById('closeModalBtn');
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            const modal = document.getElementById('productModal');
            if (modal) modal.style.display = 'none';
        });
    }
    
    // Contact Seller Button in Modal
    const contactSellerBtn = document.getElementById('contactSellerBtn');
    if (contactSellerBtn) {
        contactSellerBtn.addEventListener('click', () => {
            if (window.currentModalProduct) {
                contactSeller(window.currentModalProduct.seller, window.currentModalProduct.name);
            } else {
                showToast('Product information not available', 'error');
            }
        });
    }
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('productModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // ============================================
    // LOGIN FORM ENTER KEY HANDLER
    // ============================================
    const passwordField = document.getElementById('loginPassword');
    const emailField = document.getElementById('loginEmail');
    const loginHandler = (e) => {
        if (e.key === 'Enter') performLogin();
    };
    
    if (passwordField) passwordField.addEventListener('keypress', loginHandler);
    if (emailField) emailField.addEventListener('keypress', loginHandler);
    
    // ============================================
    // CHECK USER SESSION
    // ============================================
    checkSession();
}
// Start the application
init();