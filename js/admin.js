/*
  HUNIKU - WEB ADMIN ENTERPRISE MASTER DESK MODULE
  Features:
  1. Multi-Tab Navigation (Inventaris, Site Plan, Verifikasi Booking, Komplain & BAP, Audit Logs)
  2. Interactive Visual Site Plan Map
  3. Booking & KPR Verification Queue with Direct Buyer Chat
  4. Complaint Dispatch with Technician Assignment, Direct Resident Chat, and BAP Generator
  5. Add New Unit Inventory Form with Real-Time Catalog Sync
  6. Real-Time Audit Trail Logging
*/

let currentAdminTab = "inventory";
let activeBapTicketId = null;
let activeBastUnitId = null;

function toggleAdminSidebar() {
  const sidebar = document.getElementById("adminSidebar");
  if (!sidebar) return;
  sidebar.classList.toggle("collapsed");
  const isCollapsed = sidebar.classList.contains("collapsed");
  try {
    localStorage.setItem("huniku_admin_sidebar_collapsed", isCollapsed ? "1" : "0");
  } catch(e) {}
}

function toggleAdminNotifPopover(e) {
  if (e) e.stopPropagation();
  const popover = document.getElementById("adminNotifPopover");
  const bell = document.getElementById("btnAdminNotifBell");
  if (!popover) return;

  const isHidden = popover.style.display === "none";
  if (isHidden) {
    if (bell) {
      const rect = bell.getBoundingClientRect();
      // Jika tombol bell berada di sebelah kiri atau dekat batas layar kiri (kurang dari 340px)
      // Buat popover membuka ke kanan (align-left) agar tidak menabrak sidebar!
      if (rect.left < 340) {
        popover.classList.add("align-left");
      } else {
        popover.classList.remove("align-left");
      }
    }
    popover.style.display = "block";
    renderAdminNotifList();
  } else {
    popover.style.display = "none";
  }
}

// Tutup popover jika pengguna mengklik di luar area popover
document.addEventListener("click", (e) => {
  const popover = document.getElementById("adminNotifPopover");
  const bell = document.getElementById("btnAdminNotifBell");
  if (popover && popover.style.display !== "none") {
    if (!popover.contains(e.target) && (!bell || !bell.contains(e.target))) {
      popover.style.display = "none";
    }
  }
});

function renderAdminNotifList() {
  const target = document.getElementById("adminNotifListTarget");
  if (!target) return;
  target.innerHTML = "";

  const units = window.store.units || [];
  const complaints = window.store.complaints || [];
  const booked = units.filter(u => u.status === "BOOKED");
  const pendingTickets = complaints.filter(c => c.status === "IN_PROGRESS");

  const notifs = [];

  booked.forEach(u => {
    notifs.push({
      title: `📑 Verifikasi Booking KPR: ${u.code}`,
      desc: `Kavling ${u.code} (${u.cluster}) menunggu approval KPR & BAST.`,
      time: "Batas 15m",
      action: () => {
        switchAdminTab("booking");
        toggleAdminNotifPopover();
      }
    });
  });

  pendingTickets.forEach(c => {
    notifs.push({
      title: `🛠️ Komplain Warga: ${c.id}`,
      desc: `Laporan di ${c.unit} (${c.category}) butuh disposisi teknisi (SLA 1x24 jam).`,
      time: c.date || "Hari ini",
      action: () => {
        switchAdminTab("tickets");
        toggleAdminNotifPopover();
      }
    });
  });

  if (notifs.length === 0) {
    target.innerHTML = `<div style="padding: 16px; text-align: center; color: #94a3b8; font-size: 0.72rem;">Tidak ada antrean pending. Semua sistem normal!</div>`;
    return;
  }

  notifs.forEach(n => {
    const item = document.createElement("div");
    item.className = "notif-popover-item";
    item.innerHTML = `
      <div class="notif-item-title">
        <span>${n.title}</span>
        <span class="notif-item-time">${n.time}</span>
      </div>
      <div class="notif-item-desc">${n.desc}</div>
    `;
    item.onclick = n.action;
    target.appendChild(item);
  });
}

function switchAdminTab(tabName) {
  currentAdminTab = tabName;

  // Update Sidebar active state
  document.querySelectorAll(".admin-nav-btn").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.getElementById({
    inventory: "btnAdminNavInventory",
    siteplan: "btnAdminNavSitePlan",
    booking: "btnAdminNavBooking",
    tickets: "btnAdminNavTickets",
    logs: "btnAdminNavLogs"
  }[tabName]);
  if (activeBtn) activeBtn.classList.add("active");

  // Update Tab Pane visibility
  document.querySelectorAll(".admin-tab-pane").forEach(pane => pane.classList.remove("active"));
  const targetPane = document.getElementById({
    inventory: "paneAdminInventory",
    siteplan: "paneAdminSitePlan",
    booking: "paneAdminBooking",
    tickets: "paneAdminTickets",
    logs: "paneAdminLogs"
  }[tabName]);
  if (targetPane) targetPane.classList.add("active");

  // Update Page Header Titles
  const titleEl = document.getElementById("adminPageHeaderTitle");
  const subtitleEl = document.getElementById("adminPageHeaderSubtitle");

  const meta = {
    inventory: {
      title: "Manajemen Inventaris Kavling",
      subtitle: "Kontrol ketersediaan unit real-time, spesifikasi, dan skema pembiayaan perumahan."
    },
    siteplan: {
      title: "Site Plan Interaktif Kawasan",
      subtitle: "Peta tata letak kavling perumahan. Klik pada blok untuk mengubah status ketersediaan secara langsung."
    },
    booking: {
      title: "Antrean Verifikasi Booking & KPR",
      subtitle: "Verifikasi kelengkapan berkas KPR pemohon dan validasi setoran tanda jadi resmi."
    },
    tickets: {
      title: "Disposisi Penanganan Komplain Warga",
      subtitle: "Penugasan teknisi lapangan, koordinasi chat dua arah dengan penghuni, dan penerbitan BAP."
    },
    logs: {
      title: "Log Riwayat Aktivitas & Audit Trail",
      subtitle: "Rekam jejak real-time seluruh mutasi status kavling, pemesanan, dan pekerjaan pemeliharaan."
    }
  }[tabName];

  if (titleEl && meta) titleEl.innerText = meta.title;
  if (subtitleEl && meta) subtitleEl.innerText = meta.subtitle;

  renderAdminDesk();
}

function renderAdminDesk() {
  const units = window.store.units || [];
  const complaints = window.store.complaints || [];
  const logs = window.store.auditLogs || [];

  const countAvail = units.filter(u => u.status === "AVAILABLE").length;
  const countBooked = units.filter(u => u.status === "BOOKED").length;
  const countSold = units.filter(u => u.status === "SOLD").length;
  const countSita = units.filter(u => u.status === "DI_SITA_BANK").length;
  const countActiveTickets = complaints.filter(c => c.status === "IN_PROGRESS").length;

  // Update KPI counters
  const statAvail = document.getElementById("adminStatAvail");
  const statBooked = document.getElementById("adminStatBooked");
  const statSita = document.getElementById("adminStatSita");
  const statTickets = document.getElementById("adminStatTickets");

  if (statAvail) statAvail.innerText = `${countAvail} Unit`;
  if (statBooked) statBooked.innerText = `${countBooked} Unit`;
  if (statSita) statSita.innerText = `${countSita} Unit`;
  if (statTickets) statTickets.innerText = `${countActiveTickets} Tiket`;

  // Update Sidebar Badges
  const badgeUnits = document.getElementById("badgeNavUnits");
  const badgeBookings = document.getElementById("badgeNavBookings");
  const badgeTickets = document.getElementById("badgeNavTickets");

  if (badgeUnits) badgeUnits.innerText = units.length;
  if (badgeBookings) badgeBookings.innerText = countBooked;
  if (badgeTickets) badgeTickets.innerText = countActiveTickets;

  // Update Lonceng Notifikasi Badge
  const notifBadge = document.getElementById("adminNotifBadge");
  const notifTag = document.getElementById("adminNotifCountTag");
  const totalNotif = countBooked + countActiveTickets;
  if (notifBadge) {
    notifBadge.innerText = totalNotif;
    notifBadge.style.display = totalNotif > 0 ? "flex" : "none";
  }
  if (notifTag) {
    notifTag.innerText = `${totalNotif} Baru`;
  }

  // Restore collapsed sidebar state
  try {
    const isCollapsed = localStorage.getItem("huniku_admin_sidebar_collapsed") === "1";
    const sidebar = document.getElementById("adminSidebar");
    if (sidebar) {
      sidebar.classList.toggle("collapsed", isCollapsed);
    }
  } catch(e) {}

  // Render Sub-Views
  renderAdminUnitsTable();
  renderSitePlanMap();
  renderBookingQueue();
  renderAdminTicketsTable();
  renderAuditLogs();
}

/* ======================================================== */
/* 1. INVENTARIS UNITS TABLE                                */
/* ======================================================== */
function renderAdminUnitsTable() {
  const tableBody = document.getElementById("adminUnitRowsTarget");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  const units = window.store.units || [];

  units.forEach(u => {
    const tr = document.createElement("tr");

    const statusBadgeStyle = {
      AVAILABLE: "background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;",
      BOOKED: "background: #fffbeb; color: #92400e; border: 1px solid #fde68a;",
      SOLD: "background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1;",
      DI_SITA_BANK: "background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;"
    }[u.status] || "";

    tr.innerHTML = `
      <td>
        <div style="font-weight: 800; font-family: var(--font-mono); color: #0f172a;">${u.code}</div>
        <div style="font-size: 0.65rem; color: #64748b;">${u.legal || 'SHM Lengkap'}</div>
      </td>
      <td>
        <div style="font-weight: 700;">${u.cluster}</div>
        <div style="font-size: 0.65rem; color: #64748b;">${u.region}</div>
      </td>
      <td>
        <div>${u.type}</div>
        <div style="font-size: 0.65rem; color: #64748b;">LB: ${u.lb}m² • LT: ${u.lt}m²</div>
      </td>
      <td>
        <div style="font-weight: 800; color: #0f172a;">${u.price}</div>
        <div style="font-size: 0.65rem; color: #10b981; font-weight: 600;">${u.financingRules ? u.financingRules.promoDp : 'Promo DP'}</div>
      </td>
      <td>
        <select class="status-select-control" onchange="updateUnitStatusFromAdmin('${u.id}', this.value)">
          <option value="AVAILABLE" ${u.status === 'AVAILABLE' ? 'selected' : ''}>Tersedia (AVAILABLE)</option>
          <option value="BOOKED" ${u.status === 'BOOKED' ? 'selected' : ''}>Dipesan (BOOKED)</option>
          <option value="SOLD" ${u.status === 'SOLD' ? 'selected' : ''}>Terjual (SOLD)</option>
          <option value="DI_SITA_BANK" ${u.status === 'DI_SITA_BANK' ? 'selected' : ''}>Di Sita Bank</option>
        </select>
      </td>
      <td>
        <button type="button" class="btn-admin-action" onclick="quickEditPrice('${u.id}')" title="Ubah harga dasar kavling">
          ✏️ Edit Harga
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function filterAdminUnitsTable() {
  const query = (document.getElementById("adminSearchUnitInput").value || "").toLowerCase();
  const rows = document.querySelectorAll("#adminUnitRowsTarget tr");
  rows.forEach(r => {
    const text = r.innerText.toLowerCase();
    r.style.display = text.includes(query) ? "" : "none";
  });
}

function updateUnitStatusFromAdmin(unitId, newStatus) {
  const u = window.store.units.find(x => x.id === unitId);
  if (u) {
    const oldStatus = u.status;
    u.status = newStatus;
    window.store.save();

    // Catat ke Audit Trail
    window.store.addAuditLog(
      "STATUS_UPDATE",
      `Kavling ${u.code}`,
      "Admin Developer",
      `Status diubah dari ${oldStatus} menjadi ${newStatus}.`,
      newStatus
    );

    window.app.showToast(`Status kavling ${u.code} diubah menjadi ${newStatus}`);
    renderAdminDesk();
    renderCatalog();
  }
}

function quickEditPrice(unitId) {
  const u = window.store.units.find(x => x.id === unitId);
  if (!u) return;

  const newPrice = prompt(`Ubah harga resmi untuk kavling ${u.code} (${u.cluster}):`, u.price);
  if (newPrice && newPrice.trim() !== "") {
    const oldPrice = u.price;
    u.price = newPrice.trim();
    window.store.save();

    window.store.addAuditLog(
      "PRICE_UPDATE",
      `Kavling ${u.code}`,
      "Admin Pemasaran",
      `Harga jual disesuaikan dari ${oldPrice} menjadi ${u.price}.`,
      "PROMO"
    );

    window.app.showToast(`Harga ${u.code} berhasil diperbarui: ${u.price}`);
    renderAdminDesk();
    renderCatalog();
  }
}

/* ======================================================== */
/* 2. INTERACTIVE SITE PLAN (MAP)                           */
/* ======================================================== */
function renderSitePlanMap() {
  const northRow = document.getElementById("sitePlanNorthRow");
  const southRow = document.getElementById("sitePlanSouthRow");
  if (!northRow || !southRow) return;

  northRow.innerHTML = "";
  southRow.innerHTML = "";

  const units = window.store.units || [];

  units.forEach((u, idx) => {
    const card = document.createElement("div");
    card.className = `site-lot-card ${u.status}`;
    card.title = `Klik untuk ganti status ${u.code}`;
    card.onclick = () => cycleLotStatus(u.id);

    const statusLabel = {
      AVAILABLE: "Tersedia",
      BOOKED: "Dipesan",
      SOLD: "Terjual",
      DI_SITA_BANK: "Sita Bank"
    }[u.status] || u.status;

    card.innerHTML = `
      <div class="lot-num">${u.code}</div>
      <div class="lot-type">${u.type}</div>
      <div class="lot-status">${statusLabel}</div>
    `;

    // Distribusikan ke sisi utara atau selatan jalan
    if (idx % 2 === 0) {
      northRow.appendChild(card);
    } else {
      southRow.appendChild(card);
    }
  });
}

function cycleLotStatus(unitId) {
  const u = window.store.units.find(x => x.id === unitId);
  if (!u) return;

  const cycle = {
    AVAILABLE: "BOOKED",
    BOOKED: "SOLD",
    SOLD: "DI_SITA_BANK",
    DI_SITA_BANK: "AVAILABLE"
  };

  const nextStatus = cycle[u.status] || "AVAILABLE";
  updateUnitStatusFromAdmin(unitId, nextStatus);
}

/* ======================================================== */
/* 3. BOOKING VERIFICATION QUEUE & DIRECT BUYER CHAT        */
/* ======================================================== */
function renderBookingQueue() {
  const container = document.getElementById("adminBookingQueueTarget");
  if (!container) return;
  container.innerHTML = "";

  const bookedUnits = (window.store.units || []).filter(u => u.status === "BOOKED");

  if (bookedUnits.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 32px 16px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
        <div style="font-size: 1.8rem; margin-bottom: 6px;">☕</div>
        <div style="font-size: 0.82rem; font-weight: 800; color: #0f172a;">Tidak Ada Antrean Verifikasi Booking</div>
        <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">Seluruh kavling berstatus Tersedia (AVAILABLE) atau sudah Terjual (SOLD).</div>
      </div>
    `;
    return;
  }

  bookedUnits.forEach(u => {
    const card = document.createElement("div");
    card.className = "booking-verify-card";

    card.innerHTML = `
      <div class="verify-card-header">
        <span style="font-size: 0.65rem; font-weight: 800; color: #b45309; background: #fef3c7; padding: 2px 7px; border-radius: 4px;">
          ⏱️ BATAS HOLD 15 MENIT AKTIF
        </span>
        <span style="font-size: 0.7rem; font-weight: 700; color: #0f172a; font-family: var(--font-mono);">${u.code}</span>
      </div>
      <div class="verify-buyer-name">Calon Pembeli Terverifikasi</div>
      <div class="verify-unit-info">
        <div><strong>Kavling:</strong> ${u.code} • ${u.cluster}</div>
        <div><strong>Harga:</strong> ${u.price} • Skema KPR Bank</div>
        <div style="color: #10b981; font-weight: 700; margin-top: 2px;">✓ Tanda Jadi Booking Fee Rp 2.000.000 (Tervalidasi)</div>
      </div>
      <div class="verify-actions-row">
        <button type="button" class="btn-admin-action primary" onclick="approveBuyerBooking('${u.id}')" title="Sahkan berkas KPR dan ubah kavling menjadi SOLD">
          ✓ Lolos KPR
        </button>
        <button type="button" class="btn-admin-action" style="background: #166534; color: #ffffff;" onclick="openBastVerifyModal('${u.id}')" title="Verifikasi BAST & KTP untuk aktivasi Portal Warga">
          📜 Validasi BAST & KTP
        </button>
        <button type="button" class="btn-admin-action chat" onclick="openChatFromAdminWithBuyer('${u.id}')" title="Buka obrolan langsung dengan calon pembeli">
          💬 Chat Pembeli
        </button>
        <button type="button" class="btn-admin-action danger" onclick="rejectBuyerBooking('${u.id}')" title="Batalkan pemesanan dan kembalikan unit ke AVAILABLE">
          ✕ Batalkan Hold
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function approveBuyerBooking(unitId) {
  const u = window.store.units.find(x => x.id === unitId);
  if (!u) return;

  u.status = "SOLD";
  window.store.save();

  window.store.addAuditLog(
    "BOOKING_APPROVED",
    `Kavling ${u.code}`,
    "Analis Kredit & Admin Developer",
    `Pengajuan KPR disetujui bank rekanan. Status unit resmi TERJUAL (SOLD).`,
    "RESOLVED"
  );

  window.app.showToast(`Pemesanan ${u.code} Lolos KPR! Status diubah menjadi TERJUAL.`);
  renderAdminDesk();
  renderCatalog();
}

function rejectBuyerBooking(unitId) {
  const u = window.store.units.find(x => x.id === unitId);
  if (!u) return;

  if (confirm(`Lepas kunci pemesanan untuk kavling ${u.code} dan kembalikan status ke TERSEDIA?`)) {
    u.status = "AVAILABLE";
    window.store.save();

    window.store.addAuditLog(
      "BOOKING_CANCELLED",
      `Kavling ${u.code}`,
      "Admin Developer",
      `Pemesanan hold dibatalkan. Kavling kembali dibuka untuk umum.`,
      "INFO"
    );

    window.app.showToast(`Pemesanan ${u.code} dibatalkan. Kavling kembali Tersedia.`);
    renderAdminDesk();
    renderCatalog();
  }
}

function openChatFromAdminWithBuyer(unitId) {
  const u = window.store.units.find(x => x.id === unitId);
  if (u) {
    window.store.activeUnit = u;
    window.store.activeChatType = "SALES";

    document.getElementById("chatAvatarBadge").innerText = "ADM";
    document.getElementById("chatPersonName").innerText = "Admin Pusat - Verifikasi KPR";
    document.getElementById("chatPersonRole").innerText = "Kantor Pemasaran Pengembang";

    const contextCard = document.getElementById("chatContextCard");
    const clusterText = document.getElementById("chatCardClusterText");
    const detailText = document.getElementById("chatCardDetailText");
    const timerText = document.getElementById("bookingHoldTimer");

    if (contextCard && clusterText && detailText) {
      contextCard.style.display = "block";
      contextCard.style.borderLeftColor = "#f59e0b";
      if (timerText) timerText.innerText = "VERIFIKASI BERKAS AKTIF";
      clusterText.innerText = `${u.cluster} - ${u.code}`;
      detailText.innerText = `Harga: ${u.price} • Skema KPR Bank Rekanan`;
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    window.store.chatHistory.push({
      sender: "agent",
      text: `Halo Bapak/Ibu! Tim administrasi pengembang sedang memeriksa berkas KPR untuk unit ${u.code}. Mohon pastikan slip gaji dan rekening koran 3 bulan terakhir sudah lengkap agar dapat kami teruskan ke analis bank hari ini.`,
      time: time,
      type: "text"
    });

    openChatMessenger();
    window.app.showToast(`Membuka ruang chat langsung dengan pembeli ${u.code}`);
  }
}

/* ======================================================== */
/* 4. COMPLAINT DISPATCH & DIRECT RESIDENT CHAT             */
/* ======================================================== */
function renderAdminTicketsTable() {
  const ticketBody = document.getElementById("adminTicketRowsTarget");
  if (!ticketBody) return;
  ticketBody.innerHTML = "";

  const complaints = window.store.complaints || [];

  complaints.forEach(c => {
    const tr = document.createElement("tr");

    const isResolved = c.status === "RESOLVED";
    const slaBadge = isResolved
      ? `<span class="sla-badge-done">✓ SLA Terpenuhi<br><span style="font-size: 0.6rem; color:#15803d; font-weight:600;">Pengerjaan Tuntas</span></span>`
      : `<span class="sla-badge-ontrack">⏱️ Target 1x24 Jam<br><span style="font-size: 0.6rem; color:#1d4ed8; font-weight:600;">Sisa 16 Jam (On-track)</span></span>`;

    tr.innerHTML = `
      <td>
        <div style="font-weight: 800; font-family: var(--font-mono); color: #0f172a;">${c.id}</div>
        <div style="font-size: 0.65rem; color: #64748b;">${c.date}</div>
      </td>
      <td>
        <div style="font-weight: 700;">Ibu Ratna (${c.unit})</div>
        <div style="font-size: 0.65rem; color: #10b981; font-weight: 600;">Kategori: ${c.category}</div>
      </td>
      <td style="max-width: 200px;">
        <div style="font-weight: 600; color: #1e293b; font-size: 0.74rem;">${c.notes}</div>
        <div style="font-size: 0.66rem; color: #64748b; margin-top: 2px;">
          Preferensi: ${c.visitPreference || 'Hari Kerja (08:30–11:30)'}
        </div>
      </td>
      <td>
        ${slaBadge}
      </td>
      <td>
        <select class="status-select-control" onchange="dispatchTechnicianFromAdmin('${c.id}', this.value)">
          <option value="Mas Yanto (Teknisi Sipil/Plafon)" ${c.assignedTechnician && c.assignedTechnician.includes('Yanto') ? 'selected' : ''}>Mas Yanto (Sipil/Plafon)</option>
          <option value="Mas Joko (Teknisi Plumbing)" ${c.assignedTechnician && c.assignedTechnician.includes('Joko') ? 'selected' : ''}>Mas Joko (Plumbing/Air)</option>
          <option value="Pak Asep (Teknisi Fasum/Listrik)" ${c.assignedTechnician && c.assignedTechnician.includes('Asep') ? 'selected' : ''}>Pak Asep (Fasum/Listrik)</option>
        </select>
      </td>
      <td>
        <select class="status-select-control" onchange="updateTicketStatusFromAdmin('${c.id}', this.value)">
          <option value="IN_PROGRESS" ${c.status === 'IN_PROGRESS' ? 'selected' : ''}>⏳ Sedang Dikerjakan</option>
          <option value="RESOLVED" ${c.status === 'RESOLVED' ? 'selected' : ''}>✓ Selesai (BAP OK)</option>
        </select>
      </td>
      <td>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn-admin-action chat" onclick="openChatFromAdminWithResident('${c.id}')" title="Chat dua arah langsung dengan warga">
            💬 Chat Warga
          </button>
          <button type="button" class="btn-admin-action" onclick="openBapModal('${c.id}')" title="Terbitkan lembar BAP resmi">
            📄 Terbitkan BAP
          </button>
        </div>
      </td>
    `;
    ticketBody.appendChild(tr);
  });
}

function dispatchTechnicianFromAdmin(ticketId, techName) {
  const t = window.store.complaints.find(x => x.id === ticketId);
  if (t) {
    t.assignedTechnician = techName;
    window.store.save();

    window.store.addAuditLog(
      "DISPATCH_TEKNISI",
      `Tiket ${t.id}`,
      "Koordinator Pemeliharaan",
      `Teknisi lapangan ${techName} ditugaskan untuk menangani komplain di ${t.unit} (Target SLA 1x24 jam).`,
      "PENDING"
    );

    window.app.showToast(`Teknisi ${techName} ditugaskan! SLA 1x24 jam aktif.`);
    renderAdminDesk();
    if (typeof renderResidentTickets === "function") {
      renderResidentTickets();
    }
  }
}

function updateTicketStatusFromAdmin(ticketId, newStatus) {
  const t = window.store.complaints.find(x => x.id === ticketId);
  if (t) {
    t.status = newStatus;
    if (newStatus === "RESOLVED") {
      t.resolution = "Pekerjaan tuntas dan telah disahkan Berita Acara Pengerjaan (BAP).";
    }
    window.store.save();

    window.store.addAuditLog(
      "TICKET_STATUS",
      `Tiket ${t.id}`,
      "Admin Estate",
      `Status penanganan komplain diperbarui menjadi ${newStatus}.`,
      newStatus
    );

    window.app.showToast(`Tiket ${t.id} diperbarui: ${newStatus}`);
    renderAdminDesk();
    renderResidentTickets();
  }
}

function openChatFromAdminWithResident(ticketId) {
  // Panggil fungsi chat pengelola estate yang sudah ada
  if (typeof openChatWithEstateAdmin === "function") {
    openChatWithEstateAdmin(ticketId);
    window.app.showToast(`Membuka ruang chat langsung dengan warga pelapor (${ticketId})`);
  }
}

/* ======================================================== */
/* 5. ADD UNIT MODAL LOGIC                                  */
/* ======================================================== */
function openAddUnitModal() {
  const modal = document.getElementById("adminAddUnitModal");
  if (modal) modal.style.display = "flex";
}

function closeAddUnitModal() {
  const modal = document.getElementById("adminAddUnitModal");
  if (modal) modal.style.display = "none";
}

function submitNewUnitForm() {
  const code = document.getElementById("newUnitCode").value.trim();
  const cluster = document.getElementById("newUnitCluster").value;
  const type = document.getElementById("newUnitType").value.trim() || "Tipe 45 / 90";
  const price = document.getElementById("newUnitPrice").value.trim() || "Rp 385.000.000";
  const rooms = document.getElementById("newUnitRooms").value.trim() || "2 KT / 1 KM";
  const utility = document.getElementById("newUnitUtility").value.trim() || "PLN 1300 VA & Sumur Bor";
  const promo = document.getElementById("newUnitPromo").value.trim() || "Promo DP 0% Subsidi Pengembang";
  const desc = document.getElementById("newUnitDesc").value.trim() || "Kavling siap huni dengan struktur beton bertulang dan akses jalan aspal hotmix.";

  if (!code) {
    window.app.showToast("Mohon masukkan kode blok kavling (misal: BLOK A-05)");
    return;
  }

  const newUnit = {
    id: `unit-${Date.now()}`,
    code: code.toUpperCase(),
    cluster: cluster,
    region: cluster.includes("Sukarame") ? "Sukarame, Bandar Lampung" : cluster.includes("Kedaton") ? "Kedaton, Bandar Lampung" : "Natar, Lampung Selatan",
    type: type,
    price: price,
    rawPrice: 385000000,
    lb: parseInt(type.replace(/\D/g, '').substring(0, 2)) || 45,
    lt: 90,
    rooms: rooms,
    foundation: "Batu Belah & Beton Bertulang",
    utility: utility,
    legal: "SHM Pecah & PBG Lengkap",
    status: "AVAILABLE",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80"
    ],
    desc: desc,
    financingRules: {
      banks: ["Bank BTN", "Bank Mandiri", "BSI Syariah"],
      promoDp: promo,
      minIncome: "Rp 7.500.000 / bln",
      cashDiscount: "Diskon Cash Keras Rp 20.000.000",
      inhouseTenor: "In-House 12–18 Bulan (Tanpa Bunga)",
      notes: "Free Biaya Notaris (AJB) & PPN Ditanggung Pemerintah."
    }
  };

  window.store.units.unshift(newUnit);
  window.store.save();

  window.store.addAuditLog(
    "UNIT_ADDED",
    `Kavling ${newUnit.code}`,
    "Admin Master Developer",
    `Penambahan kavling baru ${newUnit.code} di kawasan ${cluster} seharga ${price}.`,
    "AVAILABLE"
  );

  closeAddUnitModal();
  renderAdminDesk();
  renderCatalog();
  window.app.showToast(`Kavling ${newUnit.code} berhasil ditambahkan ke inventaris!`);
}

/* ======================================================== */
/* 6. BAP MODAL LOGIC                                       */
/* ======================================================== */
function openBapModal(ticketId) {
  const t = window.store.complaints.find(x => x.id === ticketId);
  if (!t) return;

  activeBapTicketId = ticketId;
  const target = document.getElementById("bapContentTarget");
  const modal = document.getElementById("adminBapModal");

  if (target) {
    target.innerHTML = `
      <div><strong>Nomor Berkas BAP:</strong> BAP/ESTATE/${t.id}/2026</div>
      <div><strong>Tanggal Pengerjaan:</strong> ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      <div><strong>Unit Kavling:</strong> ${t.unit} (Ibu Ratna) • Sentral Garden Residence</div>
      <div style="margin-top: 8px; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
        <strong>Uraian Pekerjaan Fisik:</strong><br>
        "${t.notes}"<br>
        <span style="color: #10b981; font-weight: 700;">Status Tindakan:</span> ${t.resolution || 'Material pengganti terpasang dan berfungsi baik.'}
      </div>
      <div style="margin-top: 8px; color: #166534; font-size: 0.68rem; font-weight: 700;">
        🛡️ Klaim Garansi Retensi Pengembang: DISETUJUI (BEBAS BIAYA 100%)
      </div>
    `;
  }

  if (modal) modal.style.display = "flex";
}

function closeBapModal() {
  const modal = document.getElementById("adminBapModal");
  if (modal) modal.style.display = "none";
  activeBapTicketId = null;
}

function confirmBapResolution() {
  if (activeBapTicketId) {
    updateTicketStatusFromAdmin(activeBapTicketId, "RESOLVED");
    closeBapModal();
    window.app.showToast("BAP berhasil disahkan dan keluhan ditandai selesai.");
  }
}

/* ======================================================== */
/* 6B. BAST & RESIDENT VERIFICATION MODAL                   */
/* ======================================================== */
function openBastVerifyModal(unitId) {
  const u = window.store.units.find(x => x.id === unitId);
  if (!u) return;

  activeBastUnitId = unitId;
  const target = document.getElementById("bastVerifyContentTarget");
  const modal = document.getElementById("adminBastVerifyModal");

  if (target) {
    target.innerHTML = `
      <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 12px;">
        <div style="font-size: 0.8rem; font-weight: 800; color: #0f172a; margin-bottom: 4px;">Kavling: ${u.code} (${u.cluster})</div>
        <div><strong>Tipe Bangunan:</strong> ${u.type} • Luas ${u.landSize}</div>
        <div><strong>Nilai Transaksi:</strong> ${u.price} (Skema Pembiayaan Bank)</div>
        <div style="margin-top: 4px; color: #166534; font-weight: 700;">Status Saat Ini: HOLD (Dipesan Tanda Jadi)</div>
      </div>
      <div style="font-size: 0.72rem; color: #64748b; margin-bottom: 8px; line-height: 1.45;">
        Verifikasi fisik Berita Acara Serah Terima (BAST) dan KTP konsumen wajib dilakukan sebelum kavling dialihkan ke status <strong>TERJUAL (SOLD)</strong> dan akun pembeli diizinkan mengakses <strong>Portal Layanan Warga (Resident Desk)</strong>.
      </div>
    `;
  }

  if (modal) modal.style.display = "flex";
}

function closeBastVerifyModal() {
  const modal = document.getElementById("adminBastVerifyModal");
  if (modal) modal.style.display = "none";
  activeBastUnitId = null;
}

function confirmBastApproval() {
  if (!activeBastUnitId) return;

  const chkKtp = document.getElementById("chkKtpValid");
  const chkBast = document.getElementById("chkBastValid");

  if ((chkKtp && !chkKtp.checked) || (chkBast && !chkBast.checked)) {
    alert("Harap centang validasi KTP Asli dan Lembar BAST Fisik terlebih dahulu!");
    return;
  }

  const u = window.store.units.find(x => x.id === activeBastUnitId);
  if (u) {
    u.status = "SOLD";
    window.store.save();

    window.store.addAuditLog(
      "BAST_VERIFIED",
      `Kavling ${u.code}`,
      "Legal & Estate Manager",
      `Dokumen BAST fisik & KTP penghuni resmi disahkan. Unit ${u.code} diserahterimakan dan akses Portal Warga diaktifkan.`,
      "RESOLVED"
    );

    closeBastVerifyModal();
    window.app.showToast(`BAST & KTP ${u.code} Disahkan! Portal Warga resmi diaktifkan.`);
    renderAdminDesk();
    renderCatalog();
  }
}

/* ======================================================== */
/* 7. AUDIT LOGS TIMELINE RENDERER                          */
/* ======================================================== */
function renderAuditLogs() {
  const container = document.getElementById("adminAuditLogTarget");
  if (!container) return;
  container.innerHTML = "";

  const logs = window.store.auditLogs || [];

  if (logs.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px;">Belum ada log aktivitas tercatat.</div>`;
    return;
  }

  logs.forEach(item => {
    const el = document.createElement("div");
    el.className = "audit-log-item";

    el.innerHTML = `
      <div class="audit-time-col">
        <div>${item.time}</div>
        <div style="font-size: 0.62rem; color: #94a3b8;">${item.date}</div>
      </div>
      <div class="audit-body-col">
        <div class="audit-title-row">
          <span class="audit-action-badge ${item.badge || 'INFO'}">${item.action}</span>
          <strong style="font-size: 0.76rem; color: #0f172a;">${item.target}</strong>
        </div>
        <div class="audit-detail-text">${item.detail}</div>
        <div class="audit-actor-text">Oleh: ${item.actor}</div>
      </div>
    `;
    container.appendChild(el);
  });
}
