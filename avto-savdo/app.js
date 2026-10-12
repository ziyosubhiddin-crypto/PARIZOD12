// ========================================================
// AVTO SAVDO PRO - ASOSIY ILOVA LOGIKASI (APP.JS)
// ========================================================

const USD_TO_UZS_RATE = 12850;
const STORAGE_KEYS = {
  CARS: 'avto_savdo_cars_v1',
  FAVORITES: 'avto_savdo_favorites_v1',
  MY_LISTINGS: 'avto_savdo_my_listings_v1',
  THEME: 'avto_savdo_theme_v1',
  CURRENCY: 'avto_savdo_currency_v1',
  OFFERS: 'avto_savdo_offers_v1'
};

class AvtoBozorApp {
  constructor() {
    this.cars = this.loadCars();
    this.favorites = this.loadFavorites();
    this.myListingIds = this.loadMyListingIds();
    this.offers = this.loadOffers();
    this.currency = localStorage.getItem(STORAGE_KEYS.CURRENCY) || 'USD';
    this.theme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    this.currentView = 'showroom';
    this.viewMode = 'grid'; // 'grid' | 'list'

    // Filtrlar holati
    this.filters = {
      brand: 'ALL',
      priceMax: 100000,
      transmission: 'ALL',
      fuel: 'ALL',
      yearMin: 'ALL',
      search: '',
      sort: 'newest'
    };

    this.selectedCarForDetails = null;
    this.uploadedImageDataUrl = '';

    this.init();
  }

  init() {
    this.applyTheme(this.theme);
    this.setupCurrency();
    this.bindEvents();
    this.initCalculator();
    this.renderShowroom();
    this.updateStats();
  }

  // --- LOCAL STORAGE BOSHQARUVI ---
  loadCars() {
    const saved = localStorage.getItem(STORAGE_KEYS.CARS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Ma'lumotlarni o'qishda xato:", e);
      }
    }
    // Agar mavjud bo'lmasa, dastlabki ma'lumotlarni saqlaymiz
    localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(INITIAL_CARS));
    return [...INITIAL_CARS];
  }

  saveCars() {
    localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(this.cars));
  }

  loadFavorites() {
    const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return saved ? new Set(JSON.parse(saved)) : new Set(['car-1', 'car-2']);
  }

  saveFavorites() {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([...this.favorites]));
    this.updateStats();
  }

  loadMyListingIds() {
    const saved = localStorage.getItem(STORAGE_KEYS.MY_LISTINGS);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  }

  saveMyListingIds() {
    localStorage.setItem(STORAGE_KEYS.MY_LISTINGS, JSON.stringify([...this.myListingIds]));
    this.updateStats();
  }

  loadOffers() {
    const saved = localStorage.getItem(STORAGE_KEYS.OFFERS);
    return saved ? JSON.parse(saved) : [];
  }

  saveOffers() {
    localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(this.offers));
  }

  // --- VALYUTA VA FORMATLASH ---
  setupCurrency() {
    const buttons = document.querySelectorAll('.currency-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.currency === this.currency);
      btn.addEventListener('click', () => {
        this.currency = btn.dataset.currency;
        localStorage.setItem(STORAGE_KEYS.CURRENCY, this.currency);
        buttons.forEach(b => b.classList.toggle('active', b.dataset.currency === this.currency));
        this.renderShowroom();
        if (this.currentView === 'favorites') this.renderFavorites();
        if (this.currentView === 'my-listings') this.renderMyListings();
        this.updateStats();
        this.showToast(`Valyuta ${this.currency} ga o'zgartirildi`, 'info');
      });
    });
  }

  formatPrice(priceUsd, withSecondary = true) {
    if (this.currency === 'UZS') {
      const uzs = Math.round(priceUsd * USD_TO_UZS_RATE);
      const formattedUzs = uzs.toLocaleString('uz-UZ') + " so'm";
      if (!withSecondary) return formattedUzs;
      return {
        primary: formattedUzs,
        secondary: `$${priceUsd.toLocaleString('en-US')}`
      };
    } else {
      const formattedUsd = `$${priceUsd.toLocaleString('en-US')}`;
      if (!withSecondary) return formattedUsd;
      const uzs = Math.round(priceUsd * USD_TO_UZS_RATE).toLocaleString('uz-UZ') + " so'm";
      return {
        primary: formattedUsd,
        secondary: `≈ ${uzs}`
      };
    }
  }

  // --- MAVZU (DARK / LIGHT) ---
  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  toggleTheme() {
    const newTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    this.showToast(`${newTheme === 'dark' ? 'Tun' : 'Kun'} rejimi yoqildi`, 'info');
  }

  // --- STATISTIKA VA BADGELARNI YANGILASH ---
  updateStats() {
    const totalCount = this.cars.length;
    const favCount = this.favorites.size;
    const myListingsCount = this.myListingIds.size;

    const totalCarsBadge = document.getElementById('totalCarsBadge');
    if (totalCarsBadge) totalCarsBadge.textContent = totalCount;

    const favCountBadge = document.getElementById('favCountBadge');
    if (favCountBadge) favCountBadge.textContent = favCount;

    const myListingsBadge = document.getElementById('myListingsBadge');
    if (myListingsBadge) myListingsBadge.textContent = myListingsCount;

    const statTotalCars = document.getElementById('statTotalCars');
    if (statTotalCars) statTotalCars.textContent = `${totalCount} ta`;

    if (totalCount > 0) {
      const avgPrice = Math.round(this.cars.reduce((sum, c) => sum + c.price, 0) / totalCount);
      const statAvgPrice = document.getElementById('statAvgPrice');
      if (statAvgPrice) statAvgPrice.textContent = `$${avgPrice.toLocaleString('en-US')}`;
    }
  }

  // --- VOQEALARNI BOG'LASH (EVENT LISTENERS) ---
  bindEvents() {
    // Mavzu tugmasi
    document.getElementById('themeToggleBtn')?.addEventListener('click', () => this.toggleTheme());

    // Navigatsiya menyusi
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        this.switchView(view);
      });
    });

    // Hero tugmalari
    document.getElementById('btnHeroSell')?.addEventListener('click', () => this.openAddModal());
    document.getElementById('btnHeroCalc')?.addEventListener('click', () => this.switchView('calculator'));
    document.getElementById('btnOpenAddModal')?.addEventListener('click', () => this.openAddModal());
    document.getElementById('btnOpenAddModalFromMyListings')?.addEventListener('click', () => this.openAddModal());
    document.getElementById('btnEmptyAddCar')?.addEventListener('click', () => this.openAddModal());

    // Logo bosilganda asosiy oynaga
    document.getElementById('brandLogo')?.addEventListener('click', () => this.switchView('showroom'));

    // Global qidiruv
    const searchInput = document.getElementById('globalSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    searchInput?.addEventListener('input', (e) => {
      this.filters.search = e.target.value.trim().toLowerCase();
      if (clearSearchBtn) {
        clearSearchBtn.style.display = this.filters.search ? 'block' : 'none';
      }
      this.renderShowroom();
    });

    clearSearchBtn?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      this.filters.search = '';
      clearSearchBtn.style.display = 'none';
      this.renderShowroom();
    });

    // Markalar baridan tezkor tanlash
    const brandChips = document.querySelectorAll('.brand-chip');
    brandChips.forEach(chip => {
      chip.addEventListener('click', () => {
        brandChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const brand = chip.dataset.brand;
        this.filters.brand = brand;
        const brandSelect = document.getElementById('filterBrandSelect');
        if (brandSelect) brandSelect.value = brand;
        this.renderShowroom();
      });
    });

    // Sidebar marka selekti
    document.getElementById('filterBrandSelect')?.addEventListener('change', (e) => {
      this.filters.brand = e.target.value;
      const chip = document.querySelector(`.brand-chip[data-brand="${this.filters.brand}"]`);
      if (chip) {
        brandChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      }
      this.renderShowroom();
    });

    // Narx oralig'i (Price slider)
    const priceRangeInput = document.getElementById('priceRangeInput');
    const priceDisplayValue = document.getElementById('priceDisplayValue');
    priceRangeInput?.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      this.filters.priceMax = val;
      if (priceDisplayValue) priceDisplayValue.textContent = `$${val.toLocaleString('en-US')}`;
      this.renderShowroom();
    });

    // Uzatma qutisi (Pills)
    const transPills = document.querySelectorAll('#transmissionPills .pill-btn');
    transPills.forEach(pill => {
      pill.addEventListener('click', () => {
        transPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.filters.transmission = pill.dataset.val;
        this.renderShowroom();
      });
    });

    // Yoqilg'i va Yil selektlari
    document.getElementById('filterFuelSelect')?.addEventListener('change', (e) => {
      this.filters.fuel = e.target.value;
      this.renderShowroom();
    });
    document.getElementById('filterYearSelect')?.addEventListener('change', (e) => {
      this.filters.yearMin = e.target.value;
      this.renderShowroom();
    });

    // Filtrlarni tozalash
    document.getElementById('btnResetFilters')?.addEventListener('click', () => this.resetFilters());
    document.getElementById('btnEmptyReset')?.addEventListener('click', () => this.resetFilters());

    // Saralash
    document.getElementById('sortSelect')?.addEventListener('change', (e) => {
      this.filters.sort = e.target.value;
      this.renderShowroom();
    });

    // Ko'rinish formati: Grid / List
    const btnGrid = document.getElementById('viewModeGrid');
    const btnList = document.getElementById('viewModeList');
    btnGrid?.addEventListener('click', () => {
      this.viewMode = 'grid';
      btnGrid.classList.add('active');
      btnList?.classList.remove('active');
      document.getElementById('carsContainer')?.classList.remove('list-view');
    });
    btnList?.addEventListener('click', () => {
      this.viewMode = 'list';
      btnList.classList.add('active');
      btnGrid?.classList.remove('active');
      document.getElementById('carsContainer')?.classList.add('list-view');
    });

    // Sevimlilarni tozalash
    document.getElementById('btnClearAllFavorites')?.addEventListener('click', () => {
      if (confirm("Haqiqatan ham barcha saqlangan mashinalarni o'chirmoqchimisiz?")) {
        this.favorites.clear();
        this.saveFavorites();
        this.renderFavorites();
        this.renderShowroom();
        this.showToast("Sevimlilar ro'yxati tozalandi", 'info');
      }
    });

    // Sevimlilar sahifasidagi "Vitrinaga qaytish" tugmasi
    document.querySelectorAll('[data-go-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchView(btn.dataset.goView);
      });
    });

    // Modallarni yopish
    this.setupModalDismissers();

    // Rasm yuklash va preview
    this.setupImageUpload();

    // Yangi e'lon formasi submit
    document.getElementById('addCarForm')?.addEventListener('submit', (e) => this.handleAddCarSubmit(e));

    // Narx taklif qilish formasi submit
    document.getElementById('offerForm')?.addEventListener('submit', (e) => this.handleOfferSubmit(e));
  }

  // --- SAHIFALARNI ALMASHTIRISH (ROUTING / VIEWS) ---
  switchView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    const targetPanel = document.getElementById(`view${viewName.charAt(0).toUpperCase() + viewName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}`);
    if (targetPanel) {
      targetPanel.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (viewName === 'showroom') this.renderShowroom();
    else if (viewName === 'favorites') this.renderFavorites();
    else if (viewName === 'my-listings') this.renderMyListings();
  }

  resetFilters() {
    this.filters = {
      brand: 'ALL',
      priceMax: 100000,
      transmission: 'ALL',
      fuel: 'ALL',
      yearMin: 'ALL',
      search: '',
      sort: 'newest'
    };

    // UI elementlarini qayta o'rnatish
    const brandSelect = document.getElementById('filterBrandSelect');
    if (brandSelect) brandSelect.value = 'ALL';

    document.querySelectorAll('.brand-chip').forEach(c => c.classList.toggle('active', c.dataset.brand === 'ALL'));

    const priceRangeInput = document.getElementById('priceRangeInput');
    if (priceRangeInput) priceRangeInput.value = '100000';

    const priceDisplayValue = document.getElementById('priceDisplayValue');
    if (priceDisplayValue) priceDisplayValue.textContent = '$100,000';

    document.querySelectorAll('#transmissionPills .pill-btn').forEach(p => p.classList.toggle('active', p.dataset.val === 'ALL'));

    const filterFuelSelect = document.getElementById('filterFuelSelect');
    if (filterFuelSelect) filterFuelSelect.value = 'ALL';

    const filterYearSelect = document.getElementById('filterYearSelect');
    if (filterYearSelect) filterYearSelect.value = 'ALL';

    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) searchInput.value = '';

    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn) clearSearchBtn.style.display = 'none';

    this.renderShowroom();
    this.showToast("Barcha filtrlar tozalandi", 'info');
  }

  // --- FILTRLASH VA SARALASH ---
  getFilteredCars() {
    return this.cars.filter(car => {
      // Marka
      if (this.filters.brand !== 'ALL' && car.brand !== this.filters.brand) {
        return false;
      }
      // Narx
      if (car.price > this.filters.priceMax) {
        return false;
      }
      // Uzatma
      if (this.filters.transmission !== 'ALL' && !car.transmission.toLowerCase().includes(this.filters.transmission.toLowerCase())) {
        return false;
      }
      // Yoqilg'i
      if (this.filters.fuel !== 'ALL' && !car.fuel.toLowerCase().includes(this.filters.fuel.toLowerCase())) {
        return false;
      }
      // Yili
      if (this.filters.yearMin !== 'ALL' && car.year < Number(this.filters.yearMin)) {
        return false;
      }
      // Qidiruv
      if (this.filters.search) {
        const query = this.filters.search;
        const matches = 
          car.title.toLowerCase().includes(query) ||
          car.brand.toLowerCase().includes(query) ||
          car.model.toLowerCase().includes(query) ||
          car.location.toLowerCase().includes(query) ||
          car.description.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    }).sort((a, b) => {
      if (this.filters.sort === 'newest') return 0; // saqlangan tartib
      if (this.filters.sort === 'price-asc') return a.price - b.price;
      if (this.filters.sort === 'price-desc') return b.price - a.price;
      if (this.filters.sort === 'mileage-asc') return a.mileage - b.mileage;
      if (this.filters.sort === 'year-desc') return b.year - a.year;
      return 0;
    });
  }

  // --- VITRINANI CHIZISH (RENDER SHOWROOM) ---
  renderShowroom() {
    const container = document.getElementById('carsContainer');
    const emptyState = document.getElementById('emptyState');
    const resultsCount = document.getElementById('resultsCount');
    if (!container) return;

    const filteredCars = this.getFilteredCars();

    if (resultsCount) {
      resultsCount.innerHTML = `Natijalar: <strong>${filteredCars.length} ta</strong> mashina`;
    }

    if (filteredCars.length === 0) {
      container.innerHTML = '';
      emptyState?.classList.remove('hidden');
      return;
    }

    emptyState?.classList.add('hidden');
    container.innerHTML = filteredCars.map(car => this.createCarCardHtml(car)).join('');
    this.attachCardEventListeners(container);
  }

  // --- SEVIMLILARNI CHIZISH ---
  renderFavorites() {
    const container = document.getElementById('favoritesContainer');
    const emptyState = document.getElementById('favEmptyState');
    if (!container) return;

    const favCars = this.cars.filter(car => this.favorites.has(car.id));

    if (favCars.length === 0) {
      container.innerHTML = '';
      emptyState?.classList.remove('hidden');
      return;
    }

    emptyState?.classList.add('hidden');
    container.innerHTML = favCars.map(car => this.createCarCardHtml(car)).join('');
    this.attachCardEventListeners(container);
  }

  // --- MENING E'LONLARIMNI CHIZISH ---
  renderMyListings() {
    const container = document.getElementById('myListingsContainer');
    const emptyState = document.getElementById('myListingsEmptyState');
    if (!container) return;

    const myCars = this.cars.filter(car => this.myListingIds.has(car.id));

    if (myCars.length === 0) {
      container.innerHTML = '';
      emptyState?.classList.remove('hidden');
      return;
    }

    emptyState?.classList.add('hidden');
    container.innerHTML = myCars.map(car => this.createCarCardHtml(car, true)).join('');
    this.attachCardEventListeners(container);
  }

  // --- MASHINA KARTASI HTML SHABLONI ---
  createCarCardHtml(car, isOwner = false) {
    const isFav = this.favorites.has(car.id);
    const priceObj = this.formatPrice(car.price);
    
    // Taxminiy kredit: narxning 70% miqdori 36 oyga ~ 22%
    const monthlyEst = Math.round((car.price * 0.7 * (1 + 0.22 * 3)) / 36);
    const creditEstText = this.currency === 'UZS' 
      ? `oyiga ≈ ${Math.round(monthlyEst * USD_TO_UZS_RATE).toLocaleString('uz-UZ')} so'mdan`
      : `oyiga $${monthlyEst} dan`;

    return `
      <div class="car-card" data-car-id="${car.id}">
        <div class="card-media">
          <img src="${car.image}" alt="${car.title}" class="card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80'">
          ${car.featured ? '<span class="card-badge vip">VIP</span>' : ''}
          ${car.year >= 2024 ? '<span class="card-badge new">Yangi</span>' : ''}
          <button class="btn-fav-card ${isFav ? 'favorited' : ''}" data-fav-id="${car.id}" title="Sevimlilarga qo'shish">
            <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>

        <div class="card-body">
          <div class="card-header-info">
            <div class="card-brand-model">${car.brand} • ${car.model}</div>
            <h3 class="card-title" title="${car.title}">${car.title}</h3>
          </div>

          <div class="card-specs">
            <div class="spec-item">
              <span class="spec-label">Yili</span>
              <span class="spec-value">${car.year}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Probeg</span>
              <span class="spec-value">${car.mileage.toLocaleString('uz-UZ')} km</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Yoqilg'i</span>
              <span class="spec-value">${car.fuel}</span>
            </div>
          </div>

          <div class="card-price-area">
            <div>
              <div class="card-price-primary">${priceObj.primary}</div>
              <div class="card-price-secondary">${priceObj.secondary}</div>
            </div>
            <div class="card-credit-est">${creditEstText}</div>
          </div>

          <div class="card-meta">
            <span>📍 ${car.location}</span>
            <span>🕒 ${car.date}</span>
          </div>

          <div class="card-actions">
            <button class="btn btn-primary btn-sm btn-view-details" data-detail-id="${car.id}">
              Batafsil
            </button>
            <button class="btn-offer-price" data-offer-id="${car.id}" title="Sotuvchiga o'z narxingizni taklif qiling">
              🤝 Taklif
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // --- KARTA TUGMALARI BOSILGANDA ---
  attachCardEventListeners(container) {
    // Sevimlilarga qo'shish / o'chirish
    container.querySelectorAll('.btn-fav-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const carId = btn.dataset.favId;
        this.toggleFavorite(carId);
      });
    });

    // Batafsil ko'rish
    container.querySelectorAll('.btn-view-details').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const carId = btn.dataset.detailId;
        this.openCarDetails(carId);
      });
    });

    // Taklif berish (Torg)
    container.querySelectorAll('.btn-offer-price').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const carId = btn.dataset.offerId;
        this.openOfferModal(carId);
      });
    });

    // Butun kartani bosganda ham batafsil oyna ochiladi
    container.querySelectorAll('.car-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        const carId = card.dataset.carId;
        this.openCarDetails(carId);
      });
    });
  }

  // --- SEVIMLILARNI ALMASHTIRISH ---
  toggleFavorite(carId) {
    if (this.favorites.has(carId)) {
      this.favorites.delete(carId);
      this.showToast("Mashina sevimlilardan olib tashlandi", 'info');
    } else {
      this.favorites.add(carId);
      this.showToast("Mashina sevimlilarga qo'shildi! ❤️", 'success');
    }
    this.saveFavorites();

    // DOM-dagi barcha mos keluvchi yurakchalarni yangilaymiz
    document.querySelectorAll(`.btn-fav-card[data-fav-id="${carId}"]`).forEach(btn => {
      btn.classList.toggle('favorited', this.favorites.has(carId));
    });

    if (this.currentView === 'favorites') {
      this.renderFavorites();
    }
  }

  // --- BATAFSIL MA'LUMOT MODALI (CAR DETAILS MODAL) ---
  openCarDetails(carId) {
    const car = this.cars.find(c => c.id === carId);
    if (!car) return;

    this.selectedCarForDetails = car;
    car.views = (car.views || 0) + 1;
    this.saveCars();

    const modal = document.getElementById('modalCarDetails');
    const content = document.getElementById('detailsModalContent');
    if (!modal || !content) return;

    const priceObj = this.formatPrice(car.price);
    const images = (car.images && car.images.length > 0) ? car.images : [car.image];

    content.innerHTML = `
      <div class="details-grid">
        <div class="details-gallery">
          <img src="${images[0]}" alt="${car.title}" id="galleryMainImg" class="gallery-main-img">
          <div class="gallery-thumbs">
            ${images.map((img, idx) => `
              <img src="${img}" class="gallery-thumb ${idx === 0 ? 'active' : ''}" data-img-src="${img}" alt="Thumbnail ${idx + 1}">
            `).join('')}
          </div>
        </div>

        <div class="details-info-col">
          <div class="details-content-header">
            <span class="details-tag-badge">${car.brand} • ${car.model} (${car.year})</span>
            <h2 class="details-title">${car.title}</h2>
          </div>

          <div class="details-price-card">
            <div>
              <div class="dp-usd">${priceObj.primary}</div>
              <div class="dp-uzs">${priceObj.secondary}</div>
            </div>
            <button class="btn btn-primary btn-sm" id="btnDetailsOffer">
              🤝 Narx taklif qilish
            </button>
          </div>

          <div class="details-spec-table">
            <div class="dst-row">
              <span class="dst-label">Ishlab chiqarilgan yili</span>
              <span class="dst-val">${car.year}</span>
            </div>
            <div class="dst-row">
              <span class="dst-label">Yurgan masofasi (Probeg)</span>
              <span class="dst-val">${car.mileage.toLocaleString('uz-UZ')} km</span>
            </div>
            <div class="dst-row">
              <span class="dst-label">Uzatma qutisi</span>
              <span class="dst-val">${car.transmission}</span>
            </div>
            <div class="dst-row">
              <span class="dst-label">Yoqilg'i turi</span>
              <span class="dst-val">${car.fuel}</span>
            </div>
            <div class="dst-row">
              <span class="dst-label">Rangi</span>
              <span class="dst-val">${car.color || "Ko'rsatilmagan"}</span>
            </div>
            <div class="dst-row">
              <span class="dst-label">Dvigatel parametri</span>
              <span class="dst-val">${car.engine || "Standart"}</span>
            </div>
            <div class="dst-row">
              <span class="dst-label">Holati</span>
              <span class="dst-val">${car.condition || "A'lo"}</span>
            </div>
            <div class="dst-row">
              <span class="dst-label">Ko'rishlar soni</span>
              <span class="dst-val">👁️ ${car.views} marta</span>
            </div>
          </div>

          <div class="details-desc-box">
            <h5>Avtomobil haqida batafsil ma'lumot:</h5>
            <p>${car.description}</p>
          </div>

          <div class="details-seller-card">
            <div class="seller-avatar">${car.sellerName ? car.sellerName.charAt(0) : 'S'}</div>
            <div class="seller-meta">
              <div class="seller-name">${car.sellerName}</div>
              <div class="seller-loc">📍 ${car.location}</div>
            </div>
            <a href="tel:${car.sellerPhone}" class="seller-phone-btn" id="btnCallSeller">
              📞 ${car.sellerPhone}
            </a>
          </div>
        </div>
      </div>
    `;

    // Galereya rasmlarini almashtirish
    content.querySelectorAll('.gallery-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        content.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        const main = document.getElementById('galleryMainImg');
        if (main) main.src = thumb.dataset.imgSrc;
      });
    });

    // Taklif berish tugmasi
    document.getElementById('btnDetailsOffer')?.addEventListener('click', () => {
      modal.classList.add('hidden');
      this.openOfferModal(car.id);
    });

    modal.classList.remove('hidden');
  }

  // --- TAKLIF BERISH MODALI (OFFER / TORG) ---
  openOfferModal(carId) {
    const car = this.cars.find(c => c.id === carId);
    if (!car) return;

    const modal = document.getElementById('modalOffer');
    if (!modal) return;

    const carSubtitle = document.getElementById('offerCarSubtitle');
    const currentPriceDisplay = document.getElementById('offerCurrentPriceDisplay');
    const carIdInput = document.getElementById('offerCarId');
    const priceInput = document.getElementById('offerPriceInput');

    if (carSubtitle) carSubtitle.textContent = `${car.title} (${car.year})`;
    if (currentPriceDisplay) currentPriceDisplay.textContent = `$${car.price.toLocaleString('en-US')}`;
    if (carIdInput) carIdInput.value = car.id;
    if (priceInput) {
      priceInput.value = Math.round(car.price * 0.95); // 5% chegirma taklif bilan boshlanadi
    }

    modal.classList.remove('hidden');
  }

  handleOfferSubmit(e) {
    e.preventDefault();
    const carId = document.getElementById('offerCarId').value;
    const price = Number(document.getElementById('offerPriceInput').value);
    const message = document.getElementById('offerMessage').value.trim();
    const phone = document.getElementById('offerPhone').value.trim();

    const car = this.cars.find(c => c.id === carId);
    if (!car) return;

    const newOffer = {
      id: 'offer-' + Date.now(),
      carId,
      carTitle: car.title,
      offeredPrice: price,
      message,
      phone,
      date: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    };

    this.offers.push(newOffer);
    this.saveOffers();

    document.getElementById('modalOffer')?.classList.add('hidden');
    document.getElementById('offerForm')?.reset();

    this.showToast(`Sizning $${price.toLocaleString('en-US')} taklifingiz sotuvchiga yuborildi! 🤝`, 'success');
  }

  // --- YANGI E'LON BERISH (MASHINA SOTISH) ---
  openAddModal() {
    const modal = document.getElementById('modalAddCar');
    if (modal) modal.classList.remove('hidden');
  }

  setupImageUpload() {
    const fileInput = document.getElementById('addImageFile');
    const urlInput = document.getElementById('addImageUrl');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImg = document.getElementById('imagePreview');
    const btnRemove = document.getElementById('btnRemovePreview');

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.uploadedImageDataUrl = evt.target.result;
          if (previewImg) previewImg.src = this.uploadedImageDataUrl;
          previewContainer?.classList.remove('hidden');
          if (urlInput) urlInput.value = '';
        };
        reader.readAsDataURL(file);
      }
    });

    urlInput?.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        this.uploadedImageDataUrl = val;
        if (previewImg) previewImg.src = val;
        previewContainer?.classList.remove('hidden');
        if (fileInput) fileInput.value = '';
      }
    });

    btnRemove?.addEventListener('click', () => {
      this.uploadedImageDataUrl = '';
      if (fileInput) fileInput.value = '';
      if (urlInput) urlInput.value = '';
      previewContainer?.classList.add('hidden');
    });
  }

  handleAddCarSubmit(e) {
    e.preventDefault();

    const brand = document.getElementById('addBrand').value;
    const model = document.getElementById('addModel').value.trim();
    const year = Number(document.getElementById('addYear').value);
    const price = Number(document.getElementById('addPrice').value);
    const mileage = Number(document.getElementById('addMileage').value);
    const transmission = document.getElementById('addTransmission').value;
    const fuel = document.getElementById('addFuel').value;
    const color = document.getElementById('addColor').value.trim();
    const engine = document.getElementById('addEngine').value.trim() || "1.5L Standart";
    const location = document.getElementById('addLocation').value.trim();
    const description = document.getElementById('addDescription').value.trim();
    const sellerName = document.getElementById('addSellerName').value.trim();
    const sellerPhone = document.getElementById('addSellerPhone').value.trim();

    // Rasm
    let image = this.uploadedImageDataUrl;
    if (!image) {
      // Agar rasm tanlanmagan bo'lsa, mos markaga ko'ra chiroyli avtomobil rasmi
      image = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80";
    }

    const newCar = {
      id: 'car-' + Date.now(),
      title: `${brand} ${model} (${year})`,
      brand,
      model,
      year,
      price,
      mileage,
      transmission,
      fuel,
      color,
      engine,
      location,
      description,
      sellerName,
      sellerPhone,
      date: "Hozirgina",
      views: 1,
      featured: false,
      condition: "Yaxshi",
      image,
      images: [image]
    };

    // Ro'yxat boshiga qo'shamiz
    this.cars.unshift(newCar);
    this.saveCars();

    // Mening e'lonlarimga qo'shamiz
    this.myListingIds.add(newCar.id);
    this.saveMyListingIds();

    // Modallarni yopish va formani tozalash
    document.getElementById('modalAddCar')?.classList.add('hidden');
    document.getElementById('addCarForm')?.reset();
    document.getElementById('btnRemovePreview')?.click();

    this.renderShowroom();
    this.updateStats();
    this.showToast("E'loningiz muvaffaqiyatli joylashtirildi! 🎉", 'success');

    // Yangi yaratilgan mashinani ochib ko'rsatamiz
    setTimeout(() => {
      this.openCarDetails(newCar.id);
    }, 600);
  }

  // --- KREDIT KALKULYATORI ---
  initCalculator() {
    const inputPrice = document.getElementById('calcCarPrice');
    const inputDownPercent = document.getElementById('calcDownPaymentPercent');
    const inputTermMonths = document.getElementById('calcTermMonths');
    const inputInterestRate = document.getElementById('calcInterestRate');

    const updateCalc = () => {
      const price = Math.max(1000, Number(inputPrice.value) || 20000);
      const downPercent = Number(inputDownPercent.value) || 30;
      const termMonths = Number(inputTermMonths.value) || 36;
      const annualRate = Number(inputInterestRate.value) || 22;

      // Label yangilanishlari
      const downPercentLabel = document.getElementById('calcDownPercentLabel');
      const downAmountLabel = document.getElementById('calcDownAmountLabel');
      const termLabel = document.getElementById('calcTermLabel');
      const termYearsLabel = document.getElementById('calcTermYearsLabel');
      const interestLabel = document.getElementById('calcInterestLabel');

      const downPayment = Math.round(price * (downPercent / 100));
      const loanAmount = price - downPayment;

      if (downPercentLabel) downPercentLabel.textContent = downPercent;
      if (downAmountLabel) downAmountLabel.textContent = `$${downPayment.toLocaleString('en-US')}`;
      if (termLabel) termLabel.textContent = termMonths;
      if (termYearsLabel) {
        const years = (termMonths / 12).toFixed(1).replace('.0', '');
        termYearsLabel.textContent = `${years} yil`;
      }
      if (interestLabel) interestLabel.textContent = annualRate;

      // Kredit hisob-kitobi (Differensial/Annuitet aralash formulasi)
      const monthlyRate = (annualRate / 100) / 12;
      // Annuitet oylik to'lov formulasi
      let monthlyPayment = 0;
      if (loanAmount > 0) {
        if (monthlyRate > 0) {
          monthlyPayment = Math.round(
            loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1)
          );
        } else {
          monthlyPayment = Math.round(loanAmount / termMonths);
        }
      }

      const totalPayment = Math.round(downPayment + (monthlyPayment * termMonths));
      const totalInterest = Math.max(0, totalPayment - price);

      const resMonthlyPayment = document.getElementById('resMonthlyPayment');
      const resMonthlyPaymentUzs = document.getElementById('resMonthlyPaymentUzs');
      const resLoanAmount = document.getElementById('resLoanAmount');
      const resDownPayment = document.getElementById('resDownPayment');
      const resTotalInterest = document.getElementById('resTotalInterest');
      const resTotalPayment = document.getElementById('resTotalPayment');

      if (resMonthlyPayment) resMonthlyPayment.textContent = `$${monthlyPayment.toLocaleString('en-US')}`;
      if (resMonthlyPaymentUzs) {
        const uzs = Math.round(monthlyPayment * USD_TO_UZS_RATE).toLocaleString('uz-UZ');
        resMonthlyPaymentUzs.textContent = `≈ ${uzs} so'm / oyiga`;
      }
      if (resLoanAmount) resLoanAmount.textContent = `$${loanAmount.toLocaleString('en-US')}`;
      if (resDownPayment) resDownPayment.textContent = `$${downPayment.toLocaleString('en-US')}`;
      if (resTotalInterest) resTotalInterest.textContent = `$${totalInterest.toLocaleString('en-US')}`;
      if (resTotalPayment) resTotalPayment.textContent = `$${totalPayment.toLocaleString('en-US')}`;
    };

    [inputPrice, inputDownPercent, inputTermMonths, inputInterestRate].forEach(el => {
      el?.addEventListener('input', updateCalc);
    });

    // Tezkor narx tugmalari
    document.querySelectorAll('.btn-quick-val').forEach(btn => {
      btn.addEventListener('click', () => {
        if (inputPrice) {
          inputPrice.value = btn.dataset.val;
          updateCalc();
        }
      });
    });

    updateCalc();
  }

  // --- MODALLARNI YOPISH NAZORATI ---
  setupModalDismissers() {
    const modals = [
      { id: 'modalCarDetails', closeBtn: 'btnCloseDetailsModal' },
      { id: 'modalAddCar', closeBtn: 'btnCloseAddModal', cancelBtn: 'btnCancelAdd' },
      { id: 'modalOffer', closeBtn: 'btnCloseOfferModal', cancelBtn: 'btnCancelOffer' }
    ];

    modals.forEach(({ id, closeBtn, cancelBtn }) => {
      const modalEl = document.getElementById(id);
      const closeBtnEl = document.getElementById(closeBtn);
      const cancelBtnEl = cancelBtn ? document.getElementById(cancelBtn) : null;

      const hide = () => modalEl?.classList.add('hidden');

      closeBtnEl?.addEventListener('click', hide);
      cancelBtnEl?.addEventListener('click', hide);

      modalEl?.addEventListener('click', (e) => {
        if (e.target === modalEl) hide();
      });
    });

    // Esc klavishi bosilganda modallarni yopish
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
      }
    });
  }

  // --- TOAST XABARNOMALAR ---
  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : 'ℹ️';

    toast.innerHTML = `
      <span>${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

// Ilovani ishga tushirish
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AvtoBozorApp();
});
