/*
  HUNIKU - CATALOG & UNIT DETAIL MODULE
  Spec-aligned with Proposal PjBL & PRD:
  - Multi-Project Grouping (Grand Alessandra, Sentral Garden, Villa Permata Indah)
  - 3 Color Site Plan System (Green Available, Yellow Booked, White/Red Sold, Black-Red Sita Bank)
  - Toggle View: Grid Card vs 2D Denah Tapak (Site Plan)
  - Buyer KYC Profile Drawer & Autofill Management
  - Comprehensive Unit Specs (LB, LT, KT/KM, Utility, Foundation, Financing Rules)
*/

let currentCatalogSortMode = "DEFAULT";

/* Horizontal drag-to-scroll and mouse-wheel support for pill filters and circles */
function makeHorizontalScrollable(selector) {
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!el || el._hasDragScroll) return;
  el._hasDragScroll = true;

  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;
  let hasMoved = false;

  el.addEventListener('mousedown', (e) => {
    isDown = true;
    hasMoved = false;
    el.classList.add('is-dragging');
    startX = e.pageX - el.offsetLeft;
    scrollLeft = el.scrollLeft;
  });

  window.addEventListener('mouseup', () => {
    if (isDown) {
      isDown = false;
      el.classList.remove('is-dragging');
    }
  });

  el.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 3) {
      hasMoved = true;
      e.preventDefault();
    }
    el.scrollLeft = scrollLeft - walk;
  });

  el.addEventListener('click', (e) => {
    if (hasMoved) {
      e.stopPropagation();
      e.preventDefault();
      hasMoved = false;
    }
  }, true);

  el.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0 || e.deltaX !== 0) {
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      el.scrollLeft += delta;
      e.preventDefault();
    }
  }, { passive: false });
}

function initHorizontalScrolls() {
  makeHorizontalScrollable('.category-circles-scroll');
  makeHorizontalScrollable('.filter-pills-left');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHorizontalScrolls);
} else {
  setTimeout(initHorizontalScrolls, 50);
}

function getFavorites() {
  try {
    const raw = localStorage.getItem("huniku_favs");
    return raw ? JSON.parse(raw) : [];
  } catch(e) {
    return [];
  }
}

function isUnitFavorite(unitId) {
  return getFavorites().includes(unitId);
}

function toggleCatalogFavorite(unitId, btnEl) {
  let favs = getFavorites();
  const idx = favs.indexOf(unitId);
  const u = window.store.units.find(x => x.id === unitId);
  const unitName = u ? `${u.code} (${u.type})` : "Unit";

  if (idx > -1) {
    favs.splice(idx, 1);
    if (btnEl) {
      btnEl.classList.remove("is-fav");
      btnEl.innerHTML = "🤍";
      btnEl.title = "Simpan ke Favorit";
    }
    if (window.app && window.app.showToast) {
      window.app.showToast(`${unitName} dihapus dari daftar favorit.`);
    }
  } else {
    favs.push(unitId);
    if (btnEl) {
      btnEl.classList.add("is-fav");
      btnEl.innerHTML = "❤️";
      btnEl.title = "Hapus dari Favorit";
    }
    if (window.app && window.app.showToast) {
      window.app.showToast(`✨ ${unitName} disimpan ke favorit Anda!`);
    }
  }
  try {
    localStorage.setItem("huniku_favs", JSON.stringify(favs));
  } catch(e) {}
}

function toggleCatalogSort() {
  const lbl = document.getElementById("sortCatalogLabel");
  if (currentCatalogSortMode === "DEFAULT") {
    currentCatalogSortMode = "PRICE_ASC";
    if (lbl) lbl.innerText = "Termurah ↑";
    if (window.app && window.app.showToast) window.app.showToast("Diurutkan: Harga Termurah");
  } else if (currentCatalogSortMode === "PRICE_ASC") {
    currentCatalogSortMode = "PRICE_DESC";
    if (lbl) lbl.innerText = "Tertinggi ↓";
    if (window.app && window.app.showToast) window.app.showToast("Diurutkan: Harga Tertinggi");
  } else if (currentCatalogSortMode === "PRICE_DESC") {
    currentCatalogSortMode = "LT_DESC";
    if (lbl) lbl.innerText = "Tanah Terluas 📐";
    if (window.app && window.app.showToast) window.app.showToast("Diurutkan: Luas Tanah Terluas");
  } else {
    currentCatalogSortMode = "DEFAULT";
    if (lbl) lbl.innerText = "Urutkan";
    if (window.app && window.app.showToast) window.app.showToast("Urutan Default Katalog");
  }
  window.store.catalogSort = currentCatalogSortMode;
  renderCatalog();
}

function setCatalogCircleProject(projId, el) {
  window.store.activeProjectId = projId;
  window.store.catalogViewMode = "GRID";

  // Hide site plan if it was open
  const siteTarget = document.getElementById("catalogSitePlanSection");
  const listTarget = document.getElementById("catalogListTarget");
  if (siteTarget) siteTarget.style.display = "none";
  if (listTarget) listTarget.style.display = "flex";

  document.querySelectorAll(".cat-circle-item").forEach(c => c.classList.remove("active"));
  if (el) el.classList.add("active");

  const projectMeta = (window.store.projects || []).find(p => p.id === projId) || {
    name: "Semua Kawasan",
    region: "3 Kawasan Perumahan • Lampung"
  };

  const titleEl = document.getElementById("catalogSectionTitle");
  if (titleEl) {
    titleEl.innerText = projId === "ALL" ? "Kavling Pilihan" : projectMeta.name;
  }

  if (window.app && window.app.showToast) {
    window.app.showToast(`Kawasan: ${projectMeta.name}`);
  }

  renderCatalog();
}

function toggleSitePlanFromCircle(el) {
  const siteTarget = document.getElementById("catalogSitePlanSection");
  const listTarget = document.getElementById("catalogListTarget");
  if (!siteTarget || !listTarget) return;

  const isShowingSite = siteTarget.style.display === "block";

  if (isShowingSite) {
    // Switch back to grid
    siteTarget.style.display = "none";
    listTarget.style.display = "flex";
    if (el) el.classList.remove("active");
    const firstCircle = document.querySelector(".cat-circle-item");
    if (firstCircle) firstCircle.classList.add("active");
    const titleEl = document.getElementById("catalogSectionTitle");
    if (titleEl) titleEl.innerText = "Kavling Pilihan";
  } else {
    // Show Site Plan
    siteTarget.style.display = "block";
    listTarget.style.display = "none";
    document.querySelectorAll(".cat-circle-item").forEach(c => c.classList.remove("active"));
    if (el) el.classList.add("active");
    const titleEl = document.getElementById("catalogSectionTitle");
    if (titleEl) titleEl.innerText = "Denah Tapak (Site Plan 2D)";
    renderCatalogSitePlan();
    if (window.app && window.app.showToast) {
      window.app.showToast("Denah Tapak (Site Plan 2D)");
    }
  }
}

function setCatalogFilter(filterVal, btnEl) {
  window.store.activeFilter = filterVal;
  document.querySelectorAll(".filter-segment-pill").forEach(b => b.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");

  renderCatalog();
}

function filterCatalogByKeyword(kw) {
  window.store.catalogKeyword = (kw || "").trim().toLowerCase();
  renderCatalog();
}

function resetCatalogFilters() {
  window.store.activeFilter = "ALL";
  window.store.activeProjectId = "ALL";
  window.store.catalogKeyword = "";
  window.store.catalogSort = "DEFAULT";
  currentCatalogSortMode = "DEFAULT";

  const searchInput = document.getElementById("buyerCatalogSearch");
  if (searchInput) searchInput.value = "";
  const sortLabel = document.getElementById("sortCatalogLabel");
  if (sortLabel) sortLabel.innerText = "Urutkan";

  document.querySelectorAll(".project-selector-chip").forEach((c, idx) => {
    if (idx === 0) c.classList.add("active");
    else c.classList.remove("active");
  });
  document.querySelectorAll(".pill-filter").forEach((p, idx) => {
    if (idx === 0) p.classList.add("is-active");
    else p.classList.remove("is-active");
  });

  const heroRegionEl = document.getElementById("catalogHeroRegionTag");
  const heroTitleEl = document.getElementById("catalogHeroTitleTag");
  if (heroRegionEl) heroRegionEl.innerText = "Kawasan Percontohan Lampung";
  if (heroTitleEl) heroTitleEl.innerText = "Pilih Hunian Asri Bebas Risiko Double Booking.";

  renderCatalog();
}

function openBuyerProfileModal() {
  const p = window.store.buyerProfile || {};
  const nameEl = document.getElementById("kycModalFullName");
  const phoneEl = document.getElementById("kycModalPhone");
  const domEl = document.getElementById("kycModalDomicile");
  const occEl = document.getElementById("kycModalOccupation");
  const ageEl = document.getElementById("kycModalAge");
  const incEl = document.getElementById("kycModalIncome");
  const maritalEl = document.getElementById("kycModalMarital");

  if (nameEl) nameEl.value = p.fullName || "";
  if (phoneEl) phoneEl.value = p.phone || "";
  if (domEl) domEl.value = p.domicile || "";
  if (occEl) occEl.value = p.occupation || "";
  if (ageEl) ageEl.value = p.age || 29;
  if (incEl) incEl.value = p.monthlyIncome || 7500000;
  if (maritalEl) maritalEl.value = p.maritalStatus || "Menikah (1 Kepala Keluarga)";

  const modal = document.getElementById("buyerKycModalOverlay");
  if (modal) modal.style.display = "flex";
}

function closeBuyerProfileModal() {
  const modal = document.getElementById("buyerKycModalOverlay");
  if (modal) modal.style.display = "none";
}

function saveBuyerProfileFromModal() {
  const nameEl = document.getElementById("kycModalFullName");
  const phoneEl = document.getElementById("kycModalPhone");
  const domEl = document.getElementById("kycModalDomicile");
  const occEl = document.getElementById("kycModalOccupation");
  const ageEl = document.getElementById("kycModalAge");
  const incEl = document.getElementById("kycModalIncome");
  const maritalEl = document.getElementById("kycModalMarital");

  const name = nameEl?.value.trim();
  const phone = phoneEl?.value.trim();
  if (!name || !phone) {
    if (window.app && window.app.showToast) window.app.showToast("Nama dan No. WhatsApp wajib diisi.");
    return;
  }

  window.store.updateBuyerProfile({
    fullName: name,
    phone: phone,
    domicile: domEl?.value.trim() || "",
    occupation: occEl?.value.trim() || "",
    age: parseInt(ageEl?.value) || 29,
    maritalStatus: maritalEl?.value || "Menikah (1 Kepala Keluarga)",
    monthlyIncome: parseInt(incEl?.value) || 7500000
  });

  // Update greeting name in header
  const greetEl = document.getElementById("userGreetingNameDisplay");
  if (greetEl) greetEl.innerText = `${name} (${ageEl?.value || 29} th)`;

  // Synchronize resident portal profile display
  if (typeof updateResidentProfileDisplay === "function") {
    updateResidentProfileDisplay();
  }

  // Update resident name in complaints store
  if (window.store && window.store.complaints) {
    window.store.complaints.forEach(c => c.residentName = name);
    window.store.save();
  }

  closeBuyerProfileModal();
  if (window.app && window.app.showToast) {
    window.app.showToast("✨ Profil KYC berhasil disimpan. Identitas login & data booking tersinkronisasi!");
  }
}

function openCompareDialog(unitId) {
  const current = window.store.units.find(x => x.id === unitId);
  if (!current) return;

  const other = window.store.units.find(x => x.id !== unitId && x.status === "AVAILABLE") || window.store.units.find(x => x.id !== unitId);
  if (!other) {
    if (window.app && window.app.showToast) window.app.showToast("Tidak ada unit pembanding lain.");
    return;
  }

  let modal = document.getElementById("unitCompareModalOverlay");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "unitCompareModalOverlay";
    modal.className = "admin-modal-overlay";
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };
    document.body.appendChild(modal);
  }

  const cicilan1 = (Math.round((current.rawPrice * 0.9 * 0.0072) / 100000) / 10).toFixed(1);
  const cicilan2 = (Math.round((other.rawPrice * 0.9 * 0.0072) / 100000) / 10).toFixed(1);

  modal.innerHTML = `
    <div class="admin-modal-card" style="max-width: 520px; border-radius: 20px;">
      <button type="button" onclick="document.getElementById('unitCompareModalOverlay').style.display='none'" class="modal-close-cross-btn">&times;</button>
      
      <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;">
        <span style="font-size: 0.7rem; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em;">⚖️ Perbandingan Unit Kavling</span>
        <h4 style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin-top: 2px;">Komparasi Spesifikasi & Cicilan</h4>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 14px; padding: 12px;">
          <div style="font-size: 0.68rem; font-weight: 800; color: #1d4ed8; text-transform: uppercase;">Unit Pilihan Anda</div>
          <div style="font-size: 0.88rem; font-weight: 800; color: #0f172a; margin: 4px 0 2px;">${current.code}</div>
          <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 8px;">${current.type}</div>
          <div style="font-size: 0.98rem; font-weight: 800; color: #2563eb; margin-bottom: 4px;">${current.price}</div>
          <div style="font-size: 0.68rem; color: #1e40af; font-weight: 700; background: #dbeafe; padding: 2px 6px; border-radius: 4px; display: inline-block;">KPR Rp ${cicilan1} Jt/bln</div>
          
          <div style="margin-top: 10px; font-size: 0.7rem; color: #334155; line-height: 1.6; border-top: 1px solid #bfdbfe; padding-top: 8px;">
            <div>📐 <strong>L. Bangunan [LB]:</strong> ${current.lb} m²</div>
            <div>📏 <strong>L. Tanah [LT]:</strong> ${current.lt} m²</div>
            <div>🛏️ <strong>Ruang:</strong> ${current.rooms}</div>
            <div>⚡ <strong>Listrik:</strong> ${current.utility.split('&')[0]}</div>
          </div>
          <button type="button" class="btn-promo-action" style="width: 100%; margin-top: 10px; background: #2563eb; color: #ffffff; text-align: center;" onclick="document.getElementById('unitCompareModalOverlay').style.display='none'; openUnitDetail('${current.id}')">
            Buka Detail
          </button>
        </div>

        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 12px;">
          <div style="font-size: 0.68rem; font-weight: 800; color: #64748b; text-transform: uppercase;">Unit Pembanding</div>
          <div style="font-size: 0.88rem; font-weight: 800; color: #0f172a; margin: 4px 0 2px;">${other.code}</div>
          <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 8px;">${other.type}</div>
          <div style="font-size: 0.98rem; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${other.price}</div>
          <div style="font-size: 0.68rem; color: #475569; font-weight: 700; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; display: inline-block;">KPR Rp ${cicilan2} Jt/bln</div>
          
          <div style="margin-top: 10px; font-size: 0.7rem; color: #334155; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 8px;">
            <div>📐 <strong>L. Bangunan [LB]:</strong> ${other.lb} m²</div>
            <div>📏 <strong>L. Tanah [LT]:</strong> ${other.lt} m²</div>
            <div>🛏️ <strong>Ruang:</strong> ${other.rooms}</div>
            <div>⚡ <strong>Listrik:</strong> ${other.utility.split('&')[0]}</div>
          </div>
          <button type="button" class="btn-promo-action" style="width: 100%; margin-top: 10px; background: #0f172a; color: #ffffff; text-align: center;" onclick="document.getElementById('unitCompareModalOverlay').style.display='none'; openUnitDetail('${other.id}')">
            Buka Detail
          </button>
        </div>
      </div>

      <div style="text-align: right;">
        <button type="button" class="btn-switch-secondary" style="font-size: 0.75rem;" onclick="document.getElementById('unitCompareModalOverlay').style.display='none'">
          Tutup Komparasi
        </button>
      </div>
    </div>
  `;
  modal.style.display = "flex";
}

function renderCatalog() {
  const container = document.getElementById("catalogListTarget");
  if (!container) return;
  container.innerHTML = "";

  let items = [...(window.store.units || [])];
  const project = window.store.activeProjectId || "ALL";
  const filter = window.store.activeFilter || "ALL";
  const kw = window.store.catalogKeyword || "";
  const sort = window.store.catalogSort || "DEFAULT";

  // 1. Multi-Project Grouping Filter
  if (project !== "ALL") {
    items = items.filter(u => u.projectId === project);
  }

  // 2. Category / Status Filter
  if (filter === "AVAILABLE") {
    items = items.filter(u => u.status === "AVAILABLE");
  } else if (filter === "TIPE_36") {
    items = items.filter(u => u.type.includes("36"));
  } else if (filter === "TIPE_45") {
    items = items.filter(u => u.type.includes("45"));
  } else if (filter === "TIPE_54") {
    items = items.filter(u => u.type.includes("54"));
  } else if (filter === "SIAP_HUNI") {
    items = items.filter(u => (u.tags && u.tags.some(t => t.toLowerCase().includes("huni"))) || (u.cert && u.cert.toLowerCase().includes("huni")));
  } else if (filter === "SITA_BANK") {
    items = items.filter(u => u.status === "SITA_BANK" || (u.tags && u.tags.some(t => t.toLowerCase().includes("sita"))));
  }

  // 3. Keyword Search
  if (kw) {
    items = items.filter(u => {
      const matchCode = u.code && u.code.toLowerCase().includes(kw);
      const matchCluster = u.cluster && u.cluster.toLowerCase().includes(kw);
      const matchRegion = u.region && u.region.toLowerCase().includes(kw);
      const matchType = u.type && u.type.toLowerCase().includes(kw);
      const matchDesc = u.desc && u.desc.toLowerCase().includes(kw);
      return matchCode || matchCluster || matchRegion || matchType || matchDesc;
    });
  }

  // 4. Sorting
  if (sort === "PRICE_ASC") {
    items.sort((a, b) => a.rawPrice - b.rawPrice);
  } else if (sort === "PRICE_DESC") {
    items.sort((a, b) => b.rawPrice - a.rawPrice);
  } else if (sort === "LT_DESC") {
    items.sort((a, b) => b.lt - a.lt);
  }

  // Update counter badge if element exists
  const countBadge = document.getElementById("catalogAvailableCountBadge");
  if (countBadge) {
    const availCount = items.filter(u => u.status === "AVAILABLE").length;
    countBadge.innerText = `${availCount} Unit Tersedia`;
  }

  // Empty State if no units match
  if (items.length === 0) {
    container.innerHTML = `
      <div style="background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 18px; padding: 36px 20px; text-align: center; margin: 12px 0;">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">🏘️</div>
        <h4 style="font-size: 0.95rem; font-weight: 800; color: #1e293b; margin-bottom: 4px;">Tidak Ada Kavling yang Cocok</h4>
        <p style="font-size: 0.72rem; color: #64748b; margin-bottom: 16px; line-height: 1.4;">
          Kriteria filter atau kata kunci "${kw || filter}" tidak menemukan unit di kawasan ini.
        </p>
        <button type="button" class="btn-promo-action" style="background: #2563eb; color: #ffffff;" onclick="resetCatalogFilters()">
          Reset Filter Katalog
        </button>
      </div>
    `;
    return;
  }

  items.forEach(u => {
    let badgeClass = "badge-available";
    let badgeText = "Tersedia";
    if (u.status === "BOOKED") {
      badgeClass = "badge-booked";
      badgeText = "Dalam Pemesanan";
    } else if (u.status === "SOLD") {
      badgeClass = "badge-sold";
      badgeText = "Terjual";
    } else if (u.status === "DI_SITA_BANK") {
      badgeClass = "badge-sita";
      badgeText = "Di Sita Bank";
    }

    const cicilanBln = (Math.round((u.rawPrice * 0.9 * 0.0072) / 100000) / 10).toFixed(1);
    const isFav = isUnitFavorite(u.id);
    const promoText = u.financingRules?.promoDp ? u.financingRules.promoDp.split('(')[0].trim() : 'DP Ringan';

    const card = document.createElement("div");
    card.className = "house-item-card modern-after-card";
    card.onclick = () => openUnitDetail(u.id);
    card.innerHTML = `
      <div class="house-image-wrapper">
        <img src="${u.image}" alt="${u.code}" loading="lazy">
        
        <!-- Left Floating Badges -->
        <div class="image-top-badges-left">
          <div class="status-badge-chip ${badgeClass}">${badgeText}</div>
          <div class="floating-legal-badge">SHM • Siap Huni</div>
        </div>

        <!-- Right Floating Action Buttons -->
        <div class="image-top-actions-right">
          <button type="button" class="btn-img-circle-action ${isFav ? 'is-fav' : ''}" onclick="event.stopPropagation(); toggleCatalogFavorite('${u.id}', this)" title="${isFav ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}">
            ${isFav ? '❤️' : '🤍'}
          </button>
          <button type="button" class="btn-img-circle-action" onclick="event.stopPropagation(); openCompareDialog('${u.id}')" title="Bandingkan Spesifikasi">
            ⚖️
          </button>
        </div>
      </div>

      <div class="house-info-body">
        <div class="card-price-primary-row">
          <div class="card-big-price">${u.price}</div>
          <div class="card-kpr-monthly">KPR Rp ${cicilanBln} Jt/bln</div>
        </div>

        <div class="card-location-line">
          <svg width="13" height="13" fill="none" stroke="#2563eb" stroke-width="2.2" viewBox="0 0 24 24"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
          <span><strong>${u.code}</strong> • ${u.cluster}, ${u.region}</span>
        </div>

        <div class="modern-specs-chips-row">
          <span class="spec-pill-item" title="Kamar Tidur & Kamar Mandi">🛏️ ${u.rooms}</span>
          <span class="spec-pill-item" title="Luas Bangunan: total luas lantai fisik rumah">📐 L. Bangunan [LB] ${u.lb} m²</span>
          <span class="spec-pill-item" title="Luas Tanah: total luas lahan bidang kavling">📏 L. Tanah [LT] ${u.lt} m²</span>
          <span class="spec-pill-item promo-tag" title="Promo Khusus Unit">✨ ${promoText}</span>
        </div>

        <div class="card-actions-dock-row" style="margin-top: 6px;">
          <button type="button" class="btn-card-action btn-subtle" onclick="event.stopPropagation(); openUnitDetail('${u.id}')">
            Detail Spesifikasi
          </button>
          <button type="button" class="btn-card-action btn-solid" onclick="event.stopPropagation(); startQuickChat('${u.id}')">
            Chat CS Resmi
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  // Always sync interactive site plan
  renderCatalogSitePlan();
}

/* ======================================================== */
/* 2D INTERACTIVE SITE PLAN FOR BUYER CATALOG (PROPOSAL 2.3) */
/* ======================================================== */
function renderCatalogSitePlan() {
  const container = document.getElementById("catalogSitePlanTarget");
  if (!container) return;
  container.innerHTML = "";

  let units = [...(window.store.units || [])];
  const project = window.store.activeProjectId || "ALL";
  if (project !== "ALL") {
    units = units.filter(u => u.projectId === project);
  }

  const projMeta = (window.store.projects || []).find(p => p.id === project) || {
    name: "Semua Kawasan (Lampung)",
    region: "Sukarame & Natar & Kedaton"
  };

  const northLots = [];
  const southLots = [];

  units.forEach((u, idx) => {
    let colorBg = "#ebfbee";
    let colorBorder = "#b2f2bb";
    let colorText = "#1b6d33";
    let badgeText = "TERSEDIA";

    if (u.status === "BOOKED") {
      colorBg = "#fff9db";
      colorBorder = "#ffec99";
      colorText = "#b05c00";
      badgeText = "DIPESAN";
    } else if (u.status === "SOLD") {
      colorBg = "#f1f3f5";
      colorBorder = "#ced4da";
      colorText = "#495057";
      badgeText = "TERJUAL";
    } else if (u.status === "DI_SITA_BANK") {
      colorBg = "#fff5f5";
      colorBorder = "#ffc9c9";
      colorText = "#c92a2a";
      badgeText = "SITA BANK";
    }

    const lotHtml = `
      <div class="site-lot-node" onclick="openUnitDetail('${u.id}')" style="background: ${colorBg}; border: 1.5px solid ${colorBorder}; border-radius: 8px; padding: 10px 8px; text-align: center; cursor: pointer; transition: all 0.2s ease;">
        <div style="font-family: var(--font-mono); font-size: 0.78rem; font-weight: 800; color: #0f172a;">${u.code}</div>
        <div style="font-size: 0.65rem; color: #64748b; margin: 2px 0;">${u.type}</div>
        <span style="font-size: 0.6rem; font-weight: 800; color: ${colorText}; text-transform: uppercase;">${badgeText}</span>
      </div>
    `;

    if (idx % 2 === 0) northLots.push(lotHtml);
    else southLots.push(lotHtml);
  });

  container.innerHTML = `
    <div style="background: #ffffff; border: 1px solid var(--border-mid); border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-light); padding-bottom: 10px;">
        <div>
          <div style="font-size: 0.68rem; font-weight: 800; color: #2563eb; text-transform: uppercase;">Denah Tapak Kawasan (Site Plan 2D)</div>
          <div style="font-size: 0.9rem; font-weight: 800; color: #0f172a;">${projMeta.name}</div>
        </div>
        <div style="font-size: 0.68rem; color: #64748b;">${units.length} Kavling Terpetakan</div>
      </div>

      <!-- 3 Colors Legend (Proposal 3.4) -->
      <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; font-size: 0.68rem; font-weight: 700;">
        <div style="display: flex; align-items: center; gap: 4px;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: #22c55e;"></div>
          <span style="color: #166534;">Hijau: Tersedia (AVAILABLE)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: #eab308;"></div>
          <span style="color: #854d0e;">Kuning: Dipesan / Hold (BOOKED)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: #94a3b8;"></div>
          <span style="color: #334155;">Putih/Abu: Terjual (SOLD)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: #ef4444;"></div>
          <span style="color: #991b1b;">Merah: Sita Bank (DIBEKUKAN)</span>
        </div>
      </div>

      <!-- North Lots -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; margin-bottom: 10px;">
        ${northLots.join("")}
      </div>

      <!-- Main Boulevard Road -->
      <div style="background: #1e293b; color: #94a3b8; font-family: var(--font-mono); font-size: 0.62rem; font-weight: 700; text-align: center; padding: 6px 12px; border-radius: 4px; letter-spacing: 0.08em; margin: 10px 0;">
        ═════ JALAN BOULEVARD UTAMA ROW 8 METER (ASPAL HOTMIX) ═════
      </div>

      <!-- South Lots -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px; margin-top: 10px;">
        ${southLots.join("")}
      </div>

      <div style="font-size: 0.65rem; color: #64748b; text-align: center; margin-top: 12px;">
        💡 <em>Klik pada kotak kavling di atas untuk memeriksa spesifikasi lengkap atau melakukan booking online.</em>
      </div>
    </div>
  `;
}

function openUnitDetail(unitId) {
  const u = window.store.units.find(x => x.id === unitId);
  if (!u) return;
  window.store.activeUnit = u;

  document.getElementById("detailHeroImage").src = u.image;
  document.getElementById("detailClusterCode").innerText = `${u.code} • ${u.cluster}`;
  document.getElementById("detailName").innerText = `${u.type} Tropis`;
  document.getElementById("detailPrice").innerText = u.price;
  document.getElementById("specDim").innerText = u.type;
  document.getElementById("specLB").innerText = `${u.lb} m²`;
  document.getElementById("specLT").innerText = `${u.lt} m²`;
  document.getElementById("specRooms").innerText = u.rooms;
  document.getElementById("specFoundation").innerText = u.foundation;
  document.getElementById("specUtility").innerText = u.utility;
  document.getElementById("detailLocationText").innerText = u.region;
  document.getElementById("detailDescription").innerText = u.desc;

  // Financing installment teaser
  const cicilanBln = (Math.round((u.rawPrice * 0.9 * 0.0072) / 100000) / 10).toFixed(1);
  document.getElementById("detailKprInstallment").innerText = `Mulai Rp ${cicilanBln} Jt / bln`;
  document.getElementById("detailBlockPositionTag").innerText = `${u.code} (${u.cluster})`;

  // Mini lot map highlight
  const miniCells = [
    { id: "miniCell1", code: "A-01" },
    { id: "miniCell2", code: "B-04" },
    { id: "miniCell3", code: "C-12" },
    { id: "miniCell4", code: "D-09" }
  ];
  miniCells.forEach(mc => {
    const el = document.getElementById(mc.id);
    if (el) {
      if (u.code.includes(mc.code)) {
        el.style.background = "#2563eb";
        el.style.color = "#ffffff";
        el.style.borderColor = "#2563eb";
      } else {
        el.style.background = "#ffffff";
        el.style.color = "var(--text-main)";
        el.style.borderColor = "var(--border-mid)";
      }
    }
  });

  // Gallery Thumbnails
  const thumbStrip = document.getElementById("detailThumbStrip");
  thumbStrip.innerHTML = "";
  u.gallery.forEach(imgUrl => {
    const t = document.createElement("div");
    t.className = "gallery-thumb-item";
    t.onclick = (e) => {
      e.stopPropagation();
      document.getElementById("detailHeroImage").src = imgUrl;
    };
    t.innerHTML = `<img src="${imgUrl}">`;
    thumbStrip.appendChild(t);
  });

  // Sita bank & booking button validation
  const sitaNotice = document.getElementById("detailSitaNotice");
  const bookBtn = document.getElementById("btnLaunchBooking");

  if (u.status === "DI_SITA_BANK") {
    sitaNotice.style.display = "block";
    bookBtn.disabled = true;
    bookBtn.innerText = "Unit Tidak Dapat Dipesan (Sita Bank)";
  } else if (u.status === "BOOKED") {
    sitaNotice.style.display = "none";
    bookBtn.disabled = true;
    bookBtn.innerText = "Unit Sedang Dalam Pemesanan (BOOKED)";
  } else if (u.status === "SOLD") {
    sitaNotice.style.display = "none";
    bookBtn.disabled = true;
    bookBtn.innerText = "Unit Telah Terjual (SOLD)";
  } else {
    sitaNotice.style.display = "none";
    bookBtn.disabled = false;
    bookBtn.innerText = "Booking Unit Ini";
  }

  // Populate financing rules for this unit
  const f = u.financingRules || {
    banks: ["Bank BTN", "Bank Mandiri"],
    promoDp: "DP 10%",
    minIncome: "Rp 7.000.000 / bln",
    cashDiscount: "Diskon Cash Rp 15.000.000",
    inhouseTenor: "In-House 12 Bulan",
    notes: "Syarat standar pengajuan KPR / Tunai."
  };

  const banksContainer = document.getElementById("detailPartnerBanksRow");
  if (banksContainer) {
    banksContainer.innerHTML = f.banks.map(b => `<span class="bank-pill-item">${b}</span>`).join("");
  }
  const dpEl = document.getElementById("detailPromoDpVal");
  if (dpEl) dpEl.innerText = f.promoDp;

  const minIncEl = document.getElementById("detailMinIncomeVal");
  if (minIncEl) minIncEl.innerText = f.minIncome;

  const cashDiscEl = document.getElementById("detailCashDiscountVal");
  if (cashDiscEl) cashDiscEl.innerText = f.cashDiscount;

  const inhouseEl = document.getElementById("detailInhouseTenorVal");
  if (inhouseEl) inhouseEl.innerText = f.inhouseTenor;

  const notesEl = document.getElementById("detailSpecialNotesBox");
  if (notesEl) notesEl.innerText = f.notes;

  window.app.switchView("viewUnitDetail", "Spesifikasi Unit", true);
}

function simulateOpenMaps() {
  const u = window.store.activeUnit;
  const loc = u ? `${u.cluster}, ${u.region}` : "Bandar Lampung";
  window.open(`https://maps.google.com/?q=${encodeURIComponent(loc)}`, "_blank");
}

function toggleCheckRow(el) {
  el.classList.toggle("is-checked");
}

function switchGuideSection(scheme) {
  window.store.selectedScheme = scheme;
  const btnKpr = document.getElementById("btnGuideKpr");
  const btnCash = document.getElementById("btnGuideCash");
  const secKpr = document.getElementById("guideSectionKpr");
  const secCash = document.getElementById("guideSectionCash");

  if (scheme === "KPR") {
    if (btnKpr) btnKpr.classList.add("is-active");
    if (btnCash) btnCash.classList.remove("is-active");
    if (secKpr) secKpr.style.display = "block";
    if (secCash) secCash.style.display = "none";
  } else {
    if (btnKpr) btnKpr.classList.remove("is-active");
    if (btnCash) btnCash.classList.add("is-active");
    if (secKpr) secKpr.style.display = "none";
    if (secCash) secCash.style.display = "block";
  }
}

function renderGuideScreen() {
  const b = window.store.latestBooking;
  const emptyState = document.getElementById("guideEmptyState");
  const activeContent = document.getElementById("guideActiveContent");

  if (!emptyState || !activeContent) return;

  if (!b) {
    emptyState.style.display = "flex";
    activeContent.style.display = "none";
  } else {
    emptyState.style.display = "none";
    activeContent.style.display = "block";

    const ticketEl = document.getElementById("guideTicketCode");
    if (ticketEl) ticketEl.innerText = b.code;

    const titleEl = document.getElementById("guideBookedTitle");
    if (titleEl) titleEl.innerText = `${b.cluster} - ${b.unit}`;

    const metaEl = document.getElementById("guideBookedMeta");
    if (metaEl) metaEl.innerText = `${b.type || 'Unit Pilihan'} (${b.price || ''}) • Skema: ${b.scheme === 'KPR' ? 'Pengajuan KPR Bank' : 'Pembayaran Tunai'}`;

    switchGuideSection(b.scheme || "KPR");
  }
}
