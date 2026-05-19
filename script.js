let currentUserEmail = null;
    let allProducts = [];   // array of product objects

    // Load products from localStorage or initialize with sample data
    function loadProductsFromStorage() {
        const stored = localStorage.getItem('campuscart_products');
        if (stored) {
            allProducts = JSON.parse(stored);
        } else {
            // Sample products with placeholder images (SVG dataURLs)
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

    // Delete product by id (only if seller matches current user)
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

    // ----- FILTER & SORT LOGIC for Products Page -----
    let currentFilterCategory = "all";
    let currentSort = "newest";

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
        attachProductClickEvent(); // also for featured products
    }

    function renderAllProductPages() {
        renderFeaturedProducts();
        renderFullProductsGrid();
    }

    // Helper: create product card HTML, with delete button if current user is seller
    function createProductCardHTML(prod, isFeatured = false) {
        let imgSrc = prod.imageDataURL || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23cccccc'/%3E%3Ctext x='50' y='55' fill='white' text-anchor='middle'%3E📷 No Image%3C/text%3E%3C/svg%3E";
        const isOwner = (currentUserEmail && prod.seller === currentUserEmail);
        const deleteButtonHtml = isOwner ? `<button class="delete-btn" data-id="${prod.id}"><i class="fas fa-trash-alt"></i> Remove</button>` : '';
        return `
            <div class="product-card" data-product-id="${prod.id}">
                ${deleteButtonHtml}
                <img class="product-img" src="${imgSrc}" alt="${escapeHtml(prod.name)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect width=%27100%27 height=%27100%27 fill=%27%23ddd%27/%3E%3Ctext x=%2750%27 y=%2755%27 fill=%27gray%27 text-anchor=%27middle%27%3E📷%3C/text%3E%3C/svg%3E'">
                <div class="product-info">
                    <h3>${escapeHtml(prod.name)}</h3>
                    <div class="price">₹${prod.price}</div>
                    <p style="font-size:0.85rem; color:#4b5563;">${escapeHtml(prod.description.substring(0, 80))}${prod.description.length>80?'…':''}</p>
                    <div class="seller"><i class="fas fa-envelope"></i> ${escapeHtml(prod.seller)}</div>
                    <div><span style="background:#eef2f6; padding:0.2rem 0.6rem; border-radius:1rem; font-size:0.7rem;">${prod.condition}</span> <span style="margin-left:0.5rem; font-size:0.7rem;">${prod.category}</span></div>
                </div>
            </div>
        `;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    // Delete event listeners
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

    // Product detail modal logic
    function openProductDetail(productId) {
        const product = allProducts.find(p => p.id == productId);
        if (!product) return;
        document.getElementById('modalImg').src = product.imageDataURL || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23cccccc'/%3E%3Ctext x='50' y='55' fill='white' text-anchor='middle'%3E📷%3C/text%3E%3C/svg%3E";
        document.getElementById('modalTitle').innerText = product.name;
        document.getElementById('modalPrice').innerText = `₹${product.price}`;
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
        // Avoid triggering if click was on delete button
        if (e.target.classList && (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn'))) return;
        const productId = parseInt(this.getAttribute('data-product-id'));
        if (productId) openProductDetail(productId);
    }

    // Filter UI handlers
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

    // ---------- IMAGE UPLOAD HANDLER ----------
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
                    previewContainer.innerHTML = `<img src="${selectedImageDataURL}" alt="preview"><button type="button" id="clearPreviewBtn" style="background:#e74c3c; border:none; padding:0.2rem 0.6rem; border-radius:1rem; color:white; margin-left:0.5rem;">Remove</button>`;
                    const clearBtn = document.getElementById('clearPreviewBtn');
                    if (clearBtn) clearBtn.onclick = () => { selectedImageDataURL = null; imageInput.value = ''; previewContainer.innerHTML = ''; };
                };
                reader.readAsDataURL(file);
            } else {
                selectedImageDataURL = null;
                previewContainer.innerHTML = '<span style="color:red;">Invalid image file</span>';
            }
        });
    }

    // Sell form submission
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
                if (confirm('No photo selected. List without image? (Recommended to add photo)')) {
                    // proceed with placeholder
                } else {
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
            alert('✅ Product listed successfully! You can delete it from Products page if needed.');
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

    // ---------- LOGIC FOR LOGIN, PAGES ----------
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

    const pages = {
        home: document.getElementById('homePage'),
        products: document.getElementById('productsPage'),
        sell: document.getElementById('sellPage'),
        about: document.getElementById('aboutPage'),
        feedback: document.getElementById('feedbackPage'),
        contact: document.getElementById('contactPage')
    };

    function switchPage(pageId) {
        Object.keys(pages).forEach(pid => pages[pid].classList.remove('active-page'));
        if (pages[pageId]) pages[pageId].classList.add('active-page');
        else pages.home.classList.add('active-page');
        updateActiveNav(pageId);
        if (pageId === 'products') renderFullProductsGrid();
        if (pageId === 'home') renderFeaturedProducts();
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

    function init() {
        attachNavEvents();
        setupSellForm();
        document.getElementById('doLoginBtn').addEventListener('click', performLogin);
        document.getElementById('logoutBtnMain').addEventListener('click', logout);
        const modalClose = document.getElementById('closeModalBtn');
        if (modalClose) modalClose.addEventListener('click', () => document.getElementById('productModal').style.display = 'none');
        window.addEventListener('click', (e) => { if (e.target === document.getElementById('productModal')) document.getElementById('productModal').style.display = 'none'; });
        const passwordField = document.getElementById('loginPassword');
        const emailField = document.getElementById('loginEmail');
        const loginHandler = (e) => { if (e.key === 'Enter') performLogin(); };
        passwordField.addEventListener('keypress', loginHandler);
        emailField.addEventListener('keypress', loginHandler);
        checkSession();
    }
    init();