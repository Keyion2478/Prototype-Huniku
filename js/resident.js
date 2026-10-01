/*
  HUNIKU - RESIDENT COMPLAINTS & WARRANTY RETENTION MODULE
*/

let selectedComplaintCategory = "AIR";
let selectedVisitDay = "Hari Kerja (Senin–Jumat)";
let selectedVisitSlot = "Pagi (08:30 - 11:30)";
let activeComplaintFilter = "ALL";
let hasAttachedPhoto = false;

function openComplaintModal() {
  const modal = document.getElementById("complaintModalOverlay");
  if (modal) {
    modal.style.display = "flex";
  }

  // Inisialisasi default tanggal besok jika date picker belum terisi
  const dateInput = document.getElementById("customVisitDateField");
  if (dateInput && !dateInput.value) {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    dateInput.value = tmr.toISOString().split("T")[0];
  }
}

function closeComplaintModal() {
  const modal = document.getElementById("complaintModalOverlay");
  if (modal) {
    modal.style.display = "none";
  }
}

function setComplaintFilter(filter, el) {
  activeComplaintFilter = filter;
  document.querySelectorAll(".resident-filter-pill").forEach(p => p.classList.remove("active"));
  if (el) el.classList.add("active");
  renderResidentTickets();
}

function pickVisitDay(dayType, el) {
  selectedVisitDay = dayType;
  const chips = ["chipDayWorkday", "chipDayWeekend", "chipDayCustom"];
  chips.forEach(id => {
    const c = document.getElementById(id);
    if (c) c.classList.remove("active");
  });
  if (el) el.classList.add("active");

  const dateBox = document.getElementById("customVisitDateBox");
  if (dateBox) {
    dateBox.style.display = dayType === "Pilih Tanggal" ? "block" : "none";
  }
}

function pickVisitSlot(slotType, el) {
  selectedVisitSlot = slotType;
  const chips = ["chipVisitMorning", "chipVisitAfternoon", "chipVisitCustom"];
  chips.forEach(id => {
    const c = document.getElementById(id);
    if (c) c.classList.remove("active");
  });
  if (el) el.classList.add("active");

  const timeBox = document.getElementById("customVisitTimeBox");
  if (timeBox) {
    timeBox.style.display = slotType === "Kustom" ? "block" : "none";
    if (slotType === "Kustom") {
      const input = document.getElementById("customVisitTimeField");
      if (input) setTimeout(() => input.focus(), 100);
    }
  }
}

function pickComplaintCategory(cat, btn) {
  selectedComplaintCategory = cat;
  document.querySelectorAll(".chip-selector-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

function togglePhotoAttachment() {
  const thumb = document.getElementById("complaintPhotoPreviewThumb");
  hasAttachedPhoto = !hasAttachedPhoto;
  if (thumb) {
    thumb.style.display = hasAttachedPhoto ? "flex" : "none";
  }
  if (window.app && window.app.showToast) {
    window.app.showToast(hasAttachedPhoto ? "Foto bukti fisik berhasil dilampirkan." : "Foto lampiran dibatalkan.");
  }
}

function submitComplaintForm() {
  const area = document.getElementById("complaintNotesArea");
  const text = area ? area.value.trim() : "";
  if (!text) {
    if (window.app && window.app.showToast) {
      window.app.showToast("Mohon tuliskan rincian kendala kerusakan fasilitas.");
    } else {
      alert("Mohon isi deskripsi rincian kendala kerusakan fasilitas.");
    }
    return;
  }

  // 1. Tentukan Hari / Tanggal Kunjungan
  let finalDay = selectedVisitDay;
  if (selectedVisitDay === "Pilih Tanggal") {
    const dateVal = document.getElementById("customVisitDateField").value;
    if (dateVal) {
      const d = new Date(dateVal);
      finalDay = `Tgl ${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    } else {
      finalDay = "Tanggal Khusus";
    }
  }

  // 2. Tentukan Slot Jam Kunjungan
  let finalSlot = selectedVisitSlot;
  if (selectedVisitSlot === "Kustom") {
    const customTimeVal = document.getElementById("customVisitTimeField").value.trim();
    finalSlot = customTimeVal ? `Jam: ${customTimeVal}` : "Jam Kustom (Konfirmasi via WA)";
  }

  const visitPreferenceCombined = `${finalDay} • ${finalSlot}`;

  const id = `TKT-2026-${Math.floor(100 + Math.random() * 900)}`;
  const newReport = {
    id: id,
    unit: "BLOK B-05",
    category: selectedComplaintCategory,
    notes: text,
    visitPreference: visitPreferenceCombined,
    hasPhoto: hasAttachedPhoto,
    date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: "IN_PROGRESS",
    warranty: "GARANSI_RETENSI",
    resolution: `Pengaduan masuk ke antrean pengembang. Jadwal kunjungan teknisi: ${visitPreferenceCombined}.`
  };

  window.store.complaints.unshift(newReport);
  window.store.save();

  // Reset inputs
  if (area) area.value = "";
  hasAttachedPhoto = false;
  const thumb = document.getElementById("complaintPhotoPreviewThumb");
  if (thumb) thumb.style.display = "none";

  // Tutup modal pelaporan
  closeComplaintModal();

  // Update UI & re-render
  renderResidentTickets();
  if (window.app && window.app.showToast) {
    window.app.showToast(`Pengaduan ${id} berhasil dikirim ke pengelola.`);
  }
}

function renderResidentTickets() {
  const container = document.getElementById("residentTicketsFeed");
  if (!container) return;

  const all = window.store.complaints || [];
  const inProgressCount = all.filter(c => c.status === "IN_PROGRESS").length;
  const resolvedCount = all.filter(c => c.status === "RESOLVED").length;

  // Update KPI counters
  const statTotal = document.getElementById("statTotalComplaints");
  const statProgress = document.getElementById("statProgressComplaints");
  const statResolved = document.getElementById("statResolvedComplaints");
  if (statTotal) statTotal.innerText = all.length;
  if (statProgress) statProgress.innerText = inProgressCount;
  if (statResolved) statResolved.innerText = resolvedCount;

  // Filter complaints based on active filter tab
  let filtered = all;
  if (activeComplaintFilter === "IN_PROGRESS") {
    filtered = all.filter(c => c.status === "IN_PROGRESS");
  } else if (activeComplaintFilter === "RESOLVED") {
    filtered = all.filter(c => c.status === "RESOLVED");
  }

  container.innerHTML = "";

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="resident-empty-state">
        <div class="icon">📋</div>
        <div class="title">Tidak Ada Laporan Pengaduan</div>
        <div class="sub">Belum ada tiket pada kategori ini. Tekan tombol <strong>+ Lapor Baru</strong> jika Anda mengalami kerusakan fasilitas kavling.</div>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "resident-ticket-card";

    const isResolved = item.status === "RESOLVED";
    const statusTag = isResolved
      ? `<span class="badge-available" style="padding: 3px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 700;">✓ Selesai Diperbaiki</span>`
      : `<span class="badge-booked" style="padding: 3px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 700;">⏳ Sedang Dikerjakan</span>`;

    const categoryLabel = {
      AIR: "🚰 Fasilitas Air",
      BANGUNAN: "🏠 Struktur Bangunan",
      LINGKUNGAN: "💡 Lingkungan & Fasum",
      LAINNYA: "⚙️ Kendala Lainnya"
    }[item.category] || item.category;

    const stepper = isResolved
      ? `<div class="stepper-bar-wrap">
           <div class="stepper-segments">
             <div class="step-segment done"></div>
             <div class="step-segment done"></div>
             <div class="step-segment done"></div>
           </div>
           <div class="stepper-labels" style="color: #2b8a3e; font-weight: 700;">
             <span>1. Dilaporkan</span><span>2. Teknisi Ditugaskan</span><span>3. Selesai (BAP OK)</span>
           </div>
         </div>`
      : `<div class="stepper-bar-wrap">
           <div class="stepper-segments">
             <div class="step-segment done"></div>
             <div class="step-segment active"></div>
             <div class="step-segment"></div>
           </div>
           <div class="stepper-labels">
             <span style="color: #2b8a3e; font-weight: 700;">1. Dilaporkan</span>
             <span style="color: #e67700; font-weight: 700;">2. Disposisi Teknisi</span>
             <span>3. Serah Terima</span>
           </div>
         </div>`;

    const techInfoRow = `
      <div style="display: flex; gap: 8px; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; margin: 8px 0; font-size: 0.68rem;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span>👷</span>
          <span style="font-weight: 700; color: #0f172a;">Teknisi: ${item.assignedTechnician || 'Mas Yanto (Sipil/Plafon)'}</span>
        </div>
        <div style="color: ${isResolved ? '#15803d' : '#1d4ed8'}; font-weight: 700; font-size: 0.65rem;">
          ⏱️ Target SLA 1x24 Jam: ${isResolved ? 'Selesai Tepat Waktu' : 'Sedang Berjalan (On-Track)'}
        </div>
      </div>
    `;

    card.innerHTML = `
      <div class="ticket-header-row">
        <div class="ticket-id">${item.id}</div>
        ${statusTag}
      </div>
      <div class="ticket-desc">${item.notes}</div>
      <div class="ticket-resolution">${item.resolution}</div>
      ${techInfoRow}
      ${stepper}
      <div class="ticket-footer-row">
        <span>Kategori: ${categoryLabel} • ${item.date}</span>
        <span style="font-weight: 700; color: var(--brand-accent);">Bebas Biaya (Masa Retensi)</span>
      </div>
      <div class="ticket-action-bar">
        <div class="ticket-action-hint">
          <span>🛠️</span>
          <span>${isResolved ? 'Perbaikan selesai diverifikasi' : 'Disposisi teknisi siap koordinasi'}</span>
        </div>
        <button type="button" class="btn-ticket-chat" onclick="openChatWithEstateAdmin('${item.id}')" title="Hubungi admin pengelola terkait perbaikan ${item.id}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Chat Admin Pengelola</span>
          <span class="ticket-chat-badge">Online</span>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}
