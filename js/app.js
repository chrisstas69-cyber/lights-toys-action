// Lights Toys Action - Interactive E-Commerce, TikTok Video Hub & Cart Engine

(function () {
  const CART_KEY = "lta_cart_v1";
  const PROMO_KEY = "lta_promo_v1";
  const FREE_SHIP_THRESHOLD = 50.0;

  let state = {
    cart: loadCart(),
    promo: loadPromo(),
    category: "all",
    ageGroup: "all",
    search: "",
    sortBy: "featured"
  };

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
    } catch (e) {}
    updateCartUI();
  }

  function loadPromo() {
    try {
      return localStorage.getItem(PROMO_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function savePromo(code) {
    state.promo = code;
    try {
      localStorage.setItem(PROMO_KEY, code);
    } catch (e) {}
    updateCartUI();
  }

  function getProductById(id) {
    return (window.LTA_PRODUCTS || []).find((p) => p.id === id);
  }

  // ================= CART ACTIONS =================
  window.LTA = {
    addToCart: function (productId, qty = 1) {
      const product = getProductById(productId);
      if (!product) return;
      const existing = state.cart.find((item) => item.id === productId);
      if (existing) {
        existing.qty += qty;
      } else {
        state.cart.push({
          id: product.id,
          sku: product.sku,
          name: product.name,
          price: product.price,
          image: product.image,
          categoryLabel: product.categoryLabel,
          qty: qty
        });
      }
      saveCart();
      showToast(`Added "${product.name}" to your cart!`, "success");
    },

    updateQty: function (productId, delta) {
      const idx = state.cart.findIndex((item) => item.id === productId);
      if (idx === -1) return;
      state.cart[idx].qty += delta;
      if (state.cart[idx].qty <= 0) {
        state.cart.splice(idx, 1);
      }
      saveCart();
    },

    removeFromCart: function (productId) {
      state.cart = state.cart.filter((item) => item.id !== productId);
      saveCart();
    },

    clearCart: function () {
      state.cart = [];
      saveCart();
    },

    applyPromo: function (codeInput) {
      const code = (codeInput || "").trim().toUpperCase();
      if (code === "TIKTOK15" || code === "LTA15") {
        savePromo("TIKTOK15");
        showToast("Promo TIKTOK15 applied: 15% OFF your order!", "success");
      } else if (code === "NYPICKUP") {
        savePromo("NYPICKUP");
        showToast("Promo NYPICKUP applied: Free Local NY Event Pickup + 10% OFF!", "success");
      } else {
        showToast("Try code TIKTOK15 (15% off) or NYPICKUP (local tent pickup)!", "info");
      }
    },

    openCart: function () {
      const drawer = document.getElementById("cart-drawer");
      const backdrop = document.getElementById("cart-backdrop");
      if (drawer && backdrop) {
        backdrop.classList.remove("hidden");
        drawer.classList.remove("translate-x-full");
        updateCartUI();
      }
    },

    closeCart: function () {
      const drawer = document.getElementById("cart-drawer");
      const backdrop = document.getElementById("cart-backdrop");
      if (drawer && backdrop) {
        drawer.classList.add("translate-x-full");
        backdrop.classList.add("hidden");
      }
    },

    openQuickView: function (productId) {
      const p = getProductById(productId);
      if (!p) return;
      const modal = document.getElementById("quick-view-modal");
      const content = document.getElementById("quick-view-content");
      if (!modal || !content) return;

      const savings = Math.round(((p.compareAt - p.price) / p.compareAt) * 100);
      content.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-8">
          <div class="product-img-wrap rounded-2xl p-6 flex items-center justify-center border border-slate-200 relative min-h-[280px]">
            <span class="absolute top-3 left-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
              ${p.badge}
            </span>
            <span class="absolute top-3 right-3 bg-slate-900 text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-full">
              Save ${savings}%
            </span>
            <img src="${p.image}" alt="${p.name}" class="max-h-72 w-auto object-contain" />
          </div>
          <div class="flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cyan-600 mb-1">
                <span>${p.categoryLabel} • Ages ${p.ageGroup}</span>
                <span class="text-slate-400">SKU: ${p.sku}</span>
              </div>
              <h3 class="text-2xl md:text-3xl font-bold text-slate-900 mb-2">${p.name}</h3>
              <div class="flex items-center gap-2 mb-4">
                <div class="flex text-amber-400 text-sm">
                  <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                </div>
                <span class="text-sm font-semibold text-slate-700">${p.rating} (${p.reviews} verified reviews)</span>
              </div>
              <div class="flex items-baseline gap-3 mb-4">
                <span class="text-3xl font-extrabold text-slate-900">$${p.price.toFixed(2)}</span>
                <span class="text-lg text-slate-400 line-through">$${p.compareAt.toFixed(2)}</span>
                <span class="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">In Stock (NY Warehouse)</span>
              </div>
              <p class="text-slate-600 text-sm leading-relaxed mb-4">${p.description}</p>
              <ul class="space-y-1.5 mb-6">
                ${p.specs.map((s) => `<li class="text-xs md:text-sm text-slate-700 flex items-center gap-2"><i class="fas fa-check-circle text-cyan-500"></i> ${s}</li>`).join("")}
              </ul>
            </div>
            <div class="space-y-3 pt-4 border-t border-slate-200">
              <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span class="block text-[11px] font-extrabold uppercase text-slate-500 mb-2">Choose Individual Piece or Bulk Display Box:</span>
                <div class="grid grid-cols-3 gap-2 text-center text-xs">
                  <button onclick="window.LTA.addToCart('${p.id}', 1); window.LTA.closeQuickView(); window.LTA.openCart();" class="p-2 rounded-lg border-2 border-cyan-500 bg-white hover:bg-cyan-50 transition">
                    <div class="font-extrabold text-slate-900">1 Piece</div>
                    <div class="text-cyan-600 font-bold">$${p.price.toFixed(2)}</div>
                  </button>
                  <button onclick="window.LTA.addToCart('${p.id}', 3); window.LTA.applyPromo('TIKTOK15'); window.LTA.closeQuickView(); window.LTA.openCart();" class="p-2 rounded-lg border border-pink-400 bg-pink-50/40 hover:bg-pink-50 transition">
                    <div class="font-extrabold text-slate-900">3-Pack Bundle</div>
                    <div class="text-pink-600 font-bold">$${(p.price * 3 * 0.85).toFixed(2)} <span class="text-[10px]">(15% Off)</span></div>
                  </button>
                  <button onclick="window.LTA.addToCart('${p.id}', 12); window.LTA.applyPromo('TIKTOK15'); window.LTA.closeQuickView(); window.LTA.openCart();" class="p-2 rounded-lg border border-purple-400 bg-purple-50/40 hover:bg-purple-50 transition">
                    <div class="font-extrabold text-slate-900">Full 12-Pc Box</div>
                    <div class="text-purple-700 font-bold">$${(p.price * 12 * 0.75).toFixed(2)} <span class="text-[10px]">(Party Box)</span></div>
                  </button>
                </div>
              </div>
              <div class="flex gap-3">
                <button onclick="window.LTA.addToCart('${p.id}', 1); window.LTA.closeQuickView(); window.LTA.openCart();" class="flex-1 bg-lta-gradient text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2">
                  <i class="fas fa-cart-plus"></i> Add Single Piece — $${p.price.toFixed(2)}
                </button>
              </div>
              <div class="flex flex-col sm:flex-row gap-2">
                <a href="${p.tiktokUrl}" target="_blank" rel="noopener" class="flex-1 bg-slate-900 text-white text-xs font-bold py-2.5 px-4 rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2">
                  <i class="fab fa-tiktok text-pink-400"></i> Also Available on TikTok Shop
                </a>
                <button onclick="window.LTA.closeQuickView(); window.LTA.openCustomRequest('${p.name.replace(/'/g, "\\'")}');" class="flex-1 bg-slate-100 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-2">
                  <i class="fas fa-boxes text-purple-600"></i> Bulk / Party Pack Inquiry
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      modal.classList.remove("hidden");
    },

    closeQuickView: function () {
      const modal = document.getElementById("quick-view-modal");
      if (modal) modal.classList.add("hidden");
    },

    openCheckout: function () {
      if (state.cart.length === 0) {
        showToast("Your cart is empty! Add some awesome toys first.", "info");
        return;
      }
      window.LTA.closeCart();
      const modal = document.getElementById("checkout-modal");
      if (modal) {
        renderCheckoutSummary();
        modal.classList.remove("hidden");
      }
    },

    closeCheckout: function () {
      const modal = document.getElementById("checkout-modal");
      if (modal) modal.classList.add("hidden");
    },

    openCustomRequest: function (prefillToy = "") {
      const modal = document.getElementById("custom-request-modal");
      const input = document.getElementById("custom-toy-input");
      if (modal) {
        if (input && prefillToy) input.value = prefillToy;
        modal.classList.remove("hidden");
      }
    },

    closeCustomRequest: function () {
      const modal = document.getElementById("custom-request-modal");
      if (modal) modal.classList.add("hidden");
    },

    filterCategory: function (cat) {
      state.category = cat;
      document.querySelectorAll(".cat-pill").forEach((btn) => {
        if (btn.dataset.cat === cat) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
      renderProductsGrid();
    },

    filterAge: function (age) {
      state.ageGroup = age;
      const ageSelect = document.getElementById("filter-age");
      if (ageSelect && ageSelect.value !== age) ageSelect.value = age;
      renderProductsGrid();
      const gridSection = document.getElementById("shop-catalog-section");
      if (gridSection) gridSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // ================= CART UI RENDERING =================
  function calculateTotals() {
    const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    let discount = 0;
    if (state.promo === "TIKTOK15") discount = subtotal * 0.15;
    if (state.promo === "NYPICKUP") discount = subtotal * 0.10;
    const afterDiscount = Math.max(0, subtotal - discount);
    const shipping =
      state.cart.length === 0 || afterDiscount >= FREE_SHIP_THRESHOLD || state.promo === "NYPICKUP"
        ? 0
        : 5.99;
    const total = afterDiscount + shipping;
    const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
    return { subtotal, discount, afterDiscount, shipping, total, totalCount };
  }

  function updateCartUI() {
    const { subtotal, discount, afterDiscount, shipping, total, totalCount } = calculateTotals();

    // Update header badge
    document.querySelectorAll(".cart-count-badge").forEach((el) => {
      el.textContent = totalCount;
      if (totalCount > 0) {
        el.classList.add("scale-110");
        setTimeout(() => el.classList.remove("scale-110"), 200);
      }
    });

    // Free shipping bar
    const progressEl = document.getElementById("free-ship-progress");
    const msgEl = document.getElementById("free-ship-msg");
    if (progressEl && msgEl) {
      const pct = Math.min(100, Math.round((afterDiscount / FREE_SHIP_THRESHOLD) * 100));
      progressEl.style.width = `${pct}%`;
      if (state.promo === "NYPICKUP") {
        msgEl.innerHTML = `<i class="fas fa-check-circle text-emerald-500"></i> <strong>NYPICKUP Active:</strong> Free Local NY Event Pickup + 10% Off!`;
      } else if (afterDiscount >= FREE_SHIP_THRESHOLD) {
        msgEl.innerHTML = `<i class="fas fa-truck-fast text-emerald-500"></i> <strong>Congrats!</strong> You unlocked FREE US Shipping!`;
      } else {
        const diff = (FREE_SHIP_THRESHOLD - afterDiscount).toFixed(2);
        msgEl.innerHTML = `Add <strong>$${diff}</strong> more for <strong>FREE Shipping</strong>!`;
      }
    }

    // Cart items list
    const listEl = document.getElementById("cart-items-container");
    if (listEl) {
      if (state.cart.length === 0) {
        listEl.innerHTML = `
          <div class="text-center py-12 px-4">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400 text-2xl">
              <i class="fas fa-shopping-basket"></i>
            </div>
            <p class="font-bold text-slate-700 mb-1">Your Toy Box is Empty</p>
            <p class="text-xs text-slate-500 mb-4">Explore our glowing LED toys, Pokémon plushies & Sanrio backpacks!</p>
            <button onclick="window.LTA.closeCart()" class="bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-cyan-600 transition">
              Start Shopping
            </button>
          </div>
        `;
      } else {
        listEl.innerHTML = state.cart
          .map(
            (item) => `
          <div class="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-contain bg-white rounded-lg p-1 border border-slate-100" />
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-slate-800 text-sm truncate">${item.name}</h4>
              <p class="text-xs text-slate-500">$${item.price.toFixed(2)} each • SKU: ${item.sku}</p>
              <div class="flex items-center gap-2 mt-2">
                <button onclick="window.LTA.updateQty('${item.id}', -1)" class="w-6 h-6 rounded bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100">-</button>
                <span class="text-xs font-bold w-5 text-center">${item.qty}</span>
                <button onclick="window.LTA.updateQty('${item.id}', 1)" class="w-6 h-6 rounded bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100">+</button>
                <button onclick="window.LTA.removeFromCart('${item.id}')" class="ml-auto text-xs text-rose-500 hover:text-rose-700">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          </div>
        `
          )
          .join("");
      }
    }

    // Cart footer totals
    const subEl = document.getElementById("cart-subtotal");
    const discRow = document.getElementById("cart-discount-row");
    const discEl = document.getElementById("cart-discount");
    const shipEl = document.getElementById("cart-shipping");
    const totEl = document.getElementById("cart-total");

    if (subEl) subEl.textContent = `$${subtotal.toFixed(2)}`;
    if (discRow && discEl) {
      if (discount > 0) {
        discRow.classList.remove("hidden");
        discEl.textContent = `-$${discount.toFixed(2)} (${state.promo})`;
      } else {
        discRow.classList.add("hidden");
      }
    }
    if (shipEl) shipEl.textContent = shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`;
    if (totEl) totEl.textContent = `$${total.toFixed(2)}`;
  }

  function renderCheckoutSummary() {
    const { subtotal, discount, shipping, total } = calculateTotals();
    const container = document.getElementById("checkout-summary-box");
    if (!container) return;
    container.innerHTML = `
      <div class="space-y-2 text-sm">
        ${state.cart
          .map(
            (i) => `
          <div class="flex justify-between text-slate-700">
            <span>${i.qty}x ${i.name}</span>
            <span class="font-semibold">$${(i.price * i.qty).toFixed(2)}</span>
          </div>
        `
          )
          .join("")}
        <div class="border-t border-slate-200 pt-2 mt-2 flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span>$${subtotal.toFixed(2)}</span>
        </div>
        ${
          discount > 0
            ? `<div class="flex justify-between text-emerald-600 font-semibold"><span>Promo (${state.promo})</span><span>-$${discount.toFixed(2)}</span></div>`
            : ""
        }
        <div class="flex justify-between text-slate-600">
          <span>Shipping / NY Event Pickup</span>
          <span>${shipping === 0 ? "FREE" : "$" + shipping.toFixed(2)}</span>
        </div>
        <div class="border-t border-slate-300 pt-2 flex justify-between text-lg font-extrabold text-slate-900">
          <span>Total Due</span>
          <span>$${total.toFixed(2)}</span>
        </div>
      </div>
    `;
  }

  // ================= PRODUCT GRID RENDERING =================
  function renderProductsGrid() {
    const grid = document.getElementById("products-grid");
    if (!grid || !window.LTA_PRODUCTS) return;

    const limitAttr = grid.dataset.limit ? parseInt(grid.dataset.limit, 10) : null;

    let filtered = window.LTA_PRODUCTS.filter((p) => {
      if (state.category !== "all" && p.category !== state.category) return false;
      if (state.ageGroup !== "all" && p.ageGroup !== state.ageGroup) return false;
      if (state.search) {
        const q = state.search.toLowerCase();
        const match =
          p.name.toLowerCase().includes(q) ||
          p.shortDesc.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    if (state.sortBy === "price-asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (state.sortBy === "price-desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (state.sortBy === "reviews") {
      filtered.sort((a, b) => b.reviews - a.reviews);
    }

    const totalMatches = filtered.length;
    if (limitAttr && state.category === "all" && !state.search && state.ageGroup === "all") {
      filtered = filtered.slice(0, limitAttr);
    }

    const countEl = document.getElementById("product-result-count");
    if (countEl) {
      countEl.textContent = `Showing ${filtered.length} of ${totalMatches} toys`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div class="w-16 h-16 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <i class="fas fa-search"></i>
          </div>
          <h3 class="text-xl font-bold text-slate-800 mb-2">Don't see that exact toy yet?</h3>
          <p class="text-slate-600 max-w-lg mx-auto mb-6 text-sm">
            We have direct wholesale access to <strong>Happy Toys in New York</strong> (thousands of toys in stock!). Tell us what toy you're looking for and we'll source it for you!
          </p>
          <button onclick="window.LTA.openCustomRequest('${state.search.replace(/'/g, "\\'")}')" class="bg-lta-gradient text-white font-bold px-6 py-3 rounded-full shadow-lg hover:opacity-95 transition">
            <i class="fas fa-magic mr-2"></i> Request This Toy From Our NY Warehouse
          </button>
        </div>
      `;
      return;
    }

    const badgeClasses = {
      pink: "bg-gradient-to-r from-pink-500 to-rose-500 text-white",
      blue: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white",
      purple: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
    };

    grid.innerHTML = filtered
      .map((p) => {
        const bClass = badgeClasses[p.badgeColor] || badgeClasses.pink;
        return `
        <div class="product-card bg-white rounded-2xl border border-slate-200/90 overflow-hidden flex flex-col justify-between">
          <div>
            <div class="product-img-wrap h-56 p-4 flex items-center justify-center cursor-pointer" onclick="window.LTA.openQuickView('${p.id}')">
              <span class="absolute top-3 left-3 z-10 text-[11px] font-extrabold uppercase tracking-wide px-3 py-1 rounded-full shadow-sm ${bClass}">
                ${p.badge}
              </span>
              <button onclick="event.stopPropagation(); window.LTA.openQuickView('${p.id}')" title="Quick View" class="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 text-slate-700 hover:bg-slate-900 hover:text-white transition flex items-center justify-center shadow-sm">
                <i class="fas fa-eye text-xs"></i>
              </button>
              <img src="${p.image}" alt="${p.name}" loading="lazy" class="product-img max-h-48 w-auto object-contain" />
            </div>
            <div class="p-4 pb-2">
              <div class="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span class="text-cyan-600">${p.categoryLabel}</span>
                <span>Ages ${p.ageGroup}</span>
              </div>
              <h3 onclick="window.LTA.openQuickView('${p.id}')" class="font-bold text-slate-900 text-base leading-snug mb-1.5 cursor-pointer hover:text-pink-600 transition line-clamp-2">
                ${p.name}
              </h3>
              <p class="text-xs text-slate-500 line-clamp-2 mb-3">${p.shortDesc}</p>
            </div>
          </div>
          <div class="p-4 pt-2 border-t border-slate-100">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-baseline gap-2">
                <span class="text-xl font-extrabold text-slate-900">$${p.price.toFixed(2)}</span>
                <span class="text-xs text-slate-400 line-through">$${p.compareAt.toFixed(2)}</span>
              </div>
              <div class="flex items-center gap-1 text-xs font-semibold text-amber-500">
                <i class="fas fa-star"></i>
                <span class="text-slate-700">${p.rating}</span>
                <span class="text-slate-400">(${p.reviews})</span>
              </div>
            </div>
            <div class="flex gap-2">
              <button onclick="window.LTA.addToCart('${p.id}', 1)" class="flex-1 bg-slate-900 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-pink-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm">
                <i class="fas fa-cart-plus"></i> Add to Cart
              </button>
              <a href="${p.tiktokUrl}" target="_blank" rel="noopener" title="Buy or Watch on TikTok Shop" class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-pink-50 text-slate-800 hover:text-pink-600 transition flex items-center justify-center border border-slate-200">
                <i class="fab fa-tiktok"></i>
              </a>
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  // ================= VIDEO REELS RENDERING =================
  function renderVideoReels() {
    const container = document.getElementById("video-reels-grid");
    if (!container || !window.LTA_VIDEOS) return;

    container.innerHTML = window.LTA_VIDEOS.map((v) => {
      const prod = getProductById(v.featuredProductId);
      const isLocalVideo = v.type === "local-mp4";
      return `
        <div class="reel-card shadow-xl border border-slate-800 group flex flex-col justify-between">
          ${
            isLocalVideo
              ? `<video src="${v.videoSrc}" poster="${v.poster}" autoplay muted loop playsinline controls class="absolute inset-0 w-full h-full object-cover"></video>`
              : `<img src="${v.poster}" alt="${v.title}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                 <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40"></div>`
          }
          <div class="relative z-10 p-3.5 flex items-center justify-between">
            <span class="bg-pink-600/90 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <i class="fas fa-play-circle"></i> ${v.tag}
            </span>
            <span class="bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <i class="fas fa-heart text-pink-400 mr-1"></i> ${v.likes}
            </span>
          </div>

          ${
            !isLocalVideo
              ? `<a href="${v.externalUrl}" target="_blank" rel="noopener" class="relative z-10 m-auto w-14 h-14 rounded-full bg-white/25 backdrop-blur-md border border-white/60 text-white flex items-center justify-center hover:scale-110 hover:bg-pink-500 transition shadow-lg">
                   <i class="fas fa-play text-lg ml-0.5"></i>
                 </a>`
              : `<div class="relative z-10 pointer-events-none"></div>`
          }

          <div class="relative z-10 p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent text-white">
            <p class="text-[11px] text-cyan-300 font-bold uppercase tracking-wider mb-0.5">${v.views}</p>
            <h4 class="font-bold text-sm leading-snug mb-1">${v.title}</h4>
            <p class="text-xs text-slate-300 line-clamp-2 mb-3">${v.subtitle}</p>
            ${
              prod
                ? `<div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2 flex items-center gap-2 mb-2">
                     <img src="${prod.image}" alt="${prod.name}" class="w-10 h-10 rounded-lg bg-white object-contain p-0.5" />
                     <div class="flex-1 min-w-0">
                       <p class="text-xs font-bold truncate">${prod.name}</p>
                       <p class="text-xs text-yellow-300 font-extrabold">$${prod.price.toFixed(2)}</p>
                     </div>
                     <button onclick="window.LTA.addToCart('${prod.id}', 1)" class="bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-extrabold px-2.5 py-1.5 rounded-lg transition">
                       + Cart
                     </button>
                   </div>`
                : ""
            }
            <a href="${v.externalUrl}" target="_blank" rel="noopener" class="w-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5">
              <i class="fas fa-external-link-alt text-[10px]"></i> Open Full Video Clip
            </a>
          </div>
        </div>
      `;
    }).join("");
  }

  // ================= EVENTS RENDERING =================
  function renderEventsGrid() {
    const container = document.getElementById("ny-events-grid");
    if (!container || !window.LTA_EVENTS) return;
    container.innerHTML = window.LTA_EVENTS.map(
      (ev) => `
      <div class="bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-cyan-400/60 transition">
        <div>
          <div class="h-48 relative overflow-hidden">
            <img src="${ev.image}" alt="${ev.name}" class="w-full h-full object-cover hover:scale-105 transition duration-500" />
            <span class="absolute top-3 left-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
              ${ev.badge}
            </span>
          </div>
          <div class="p-5">
            <p class="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
              <i class="fas fa-calendar-alt mr-1"></i> ${ev.date}
            </p>
            <h3 class="text-lg font-bold text-white mb-1">${ev.name}</h3>
            <p class="text-xs text-slate-400 mb-3"><i class="fas fa-map-marker-alt text-pink-400 mr-1"></i> ${ev.location}</p>
            <p class="text-sm text-slate-300 leading-relaxed">${ev.highlight}</p>
          </div>
        </div>
        <div class="px-5 pb-5 pt-2 flex gap-2">
          <button onclick="window.LTA.applyPromo('NYPICKUP'); window.LTA.openCart();" class="flex-1 bg-white/10 hover:bg-cyan-500 hover:text-slate-950 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition">
            <i class="fas fa-bag-shopping mr-1"></i> Reserve Booth Pickup (10% Off)
          </button>
        </div>
      </div>
    `
    ).join("");
  }

  // ================= TOAST HELPER =================
  function showToast(message, type = "success") {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }
    const el = document.createElement("div");
    const icon = type === "success" ? "fa-check-circle text-cyan-400" : "fa-bolt text-yellow-400";
    el.className =
      "toast-item bg-slate-900 text-white border border-slate-700 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-semibold max-w-sm";
    el.innerHTML = `<i class="fas ${icon} text-lg"></i> <span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity 0.25s ease";
      setTimeout(() => el.remove(), 260);
    }, 3200);
  }

  // ================= DOM INIT =================
  document.addEventListener("DOMContentLoaded", function () {
    // Merge any custom WhatsApp drops saved via uploader.html into LTA_PRODUCTS
    try {
      const waDrops = JSON.parse(localStorage.getItem("lta_whatsapp_drops_v1") || "[]");
      if (Array.isArray(waDrops) && waDrops.length > 0 && window.LTA_PRODUCTS) {
        window.LTA_PRODUCTS = [...waDrops, ...window.LTA_PRODUCTS];
      }
    } catch (e) {}

    renderProductsGrid();
    renderVideoReels();
    renderEventsGrid();
    updateCartUI();

    // Search input listener
    const searchInput = document.getElementById("product-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        state.search = e.target.value;
        renderProductsGrid();
      });
    }

    // Age filter listener
    const ageSelect = document.getElementById("filter-age");
    if (ageSelect) {
      ageSelect.addEventListener("change", (e) => {
        state.ageGroup = e.target.value;
        renderProductsGrid();
      });
    }

    // Sort listener
    const sortSelect = document.getElementById("filter-sort");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        state.sortBy = e.target.value;
        renderProductsGrid();
      });
    }

    // Mobile menu toggle
    const mobileBtn = document.getElementById("mobile-menu-btn");
    const mobileNav = document.getElementById("mobile-nav-menu");
    if (mobileBtn && mobileNav) {
      mobileBtn.addEventListener("click", () => {
        mobileNav.classList.toggle("hidden");
      });
    }

    // Checkout form submit
    const checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
      checkoutForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const orderNum = "LTA-" + Math.floor(100000 + Math.random() * 900000);
        window.LTA.clearCart();
        window.LTA.closeCheckout();
        showToast(`Order ${orderNum} Confirmed! Check your email for tracking details.`, "success");
      });
    }

    // Custom Toy Request form submit
    const customForm = document.getElementById("custom-request-form");
    if (customForm) {
      customForm.addEventListener("submit", (e) => {
        e.preventDefault();
        window.LTA.closeCustomRequest();
        customForm.reset();
        showToast("Toy sourcing request sent to our NY Happy Toys team! We'll reply within 24 hrs.", "success");
      });
    }

    // Contact / Newsletter forms
    document.querySelectorAll(".lta-async-form").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const msg = form.dataset.successMsg || "Thanks! We've received your submission.";
        form.reset();
        showToast(msg, "success");
      });
    });

    // FAQ Accordions
    document.querySelectorAll(".faq-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const answer = btn.nextElementSibling;
        const icon = btn.querySelector(".faq-icon");
        if (answer) answer.classList.toggle("hidden");
        if (icon) icon.classList.toggle("rotate-45");
      });
    });
  });
})();
