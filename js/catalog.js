/*
  HUNIKU - CATALOG & UNIT DETAIL MODULE
*/

function renderCatalog() {
  const container = document.getElementById("catalogListTarget");
  if (!container) return;
  container.innerHTML = "";

  let items = window.store.units;
  const filter = window.store.activeFilter;

  if (filter === "AVAILABLE") {
    items = items.filter(u => u.status === "AVAILABLE");
  } else if (filter === "TIPE_36") {
    items = items.filter(u => u.type.includes("36"));
  } else if (filter === "TIPE_45") {
    items = items.filter(u => u.type.includes("45"));
  } else if (filter === "TIPE_54") {
    items = items.filter(u => u.type.includes("54"));
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

    const card = document.createElement("div");
    card.className = "house-item-card";
    card.onclick = () => openUnitDetail(u.id);
    card.innerHTML = `
      <div class="house-image-wrapper">
        <img src="${u.image}" alt="${u.code}">
        <div class="image-top-overlay-bar">
          <div class="status-badge-chip ${badgeClass}">${badgeText}</div>
          <div class="floating-legal-badge">SHM • PBG Siap</div>
        </div>
      </div>
      <div class="house-info-body">
        <div class="house-cluster-tag">${u.code} • ${u.cluster}</div>
        <div class="house-title-row">
          <div class="house-name">${u.type}</div>
          <div class="house-price">${u.price}</div>
        </div>
        
        <div class="kpr-installment-teaser">
          <span class="teaser-lbl">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Simulasi Cicilan KPR
          </span>
          <span class="teaser-val">Mulai Rp ${cicilanBln} Jt / bln</span>
        </div>

        <div class="specs-grid-inline">
          <div class="spec-cell"><span class="lbl">Bangunan</span><span class="val">${u.lb} m²</span></div>
          <div class="spec-cell"><span class="lbl">Tanah</span><span class="val">${u.lt} m²</span></div>
          <div class="spec-cell"><span class="lbl">Kamar</span><span class="val">${u.rooms}</span></div>
        </div>
        <div class="address-line">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/></svg>
          ${u.region}
        </div>

        <div class="card-actions-dock-row">
          <button class="btn-card-action btn-subtle" onclick="event.stopPropagation(); openUnitDetail('${u.id}')">
            Detail & Spesifikasi
          </button>
          <button class="btn-card-action btn-solid" onclick="event.stopPropagation(); startQuickChat('${u.id}')">
            Chat Agen Resmi
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function setCatalogFilter(filterVal, btnEl) {
  window.store.activeFilter = filterVal;
  document.querySelectorAll(".pill-filter").forEach(b => b.classList.remove("is-active"));
  if (btnEl) btnEl.classList.add("is-active");
  renderCatalog();
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
        el.style.background = "var(--brand-primary)";
        el.style.color = "#ffffff";
        el.style.borderColor = "var(--brand-primary)";
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
    bookBtn.innerText = "Unit Sedang Dalam Pemesanan";
  } else if (u.status === "SOLD") {
    sitaNotice.style.display = "none";
    bookBtn.disabled = true;
    bookBtn.innerText = "Unit Telah Terjual";
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
  const loc = u ? u.region : "Bandar Lampung";
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
