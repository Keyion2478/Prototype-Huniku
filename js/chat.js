/*
  HUNIKU - IN-APP LIVE CHAT & MESSENGER MODULE
  Features: Text Chat, WhatsApp-Style Attachment Menu (Document, Photos, Location, Camera), and Auto-Reply
*/

function startQuickChat(unitId) {
  const u = window.store.units.find(x => x.id === unitId);
  if (u) {
    window.store.activeUnit = u;
    openChatWithSales();
  }
}

function openChatWithSales() {
  window.store.activeChatType = "CS";
  restoreBuyerQuickSuggestions();

  const u = window.store.activeUnit;
  const avatarEl = document.getElementById("chatAvatarBadge");
  const nameEl = document.getElementById("chatPersonName");
  const roleEl = document.getElementById("chatPersonRole");
  if (avatarEl) avatarEl.innerText = "CS";
  if (nameEl) nameEl.innerText = "Doni - CS Resmi Kantor Pemasaran";
  if (roleEl) roleEl.innerText = "Pusat Verifikasi Unit & Jadwal Survei";
  const contextCard = document.getElementById("chatContextCard");
  if (contextCard) contextCard.style.display = "none";

  window.store.chatHistory = [
    {
      sender: "agent",
      text: `Halo Bapak/Ibu! Saya Doni dari Customer Service Resmi Pengembang Huniku (${u ? u.cluster : 'Lampung'}). Kami melayani standarisasi informasi harga resmi, legalitas sertifikat SHM, serta penjadwalan survei fisik lapangan bersama sales pendamping kami. Ada yang ingin Anda konsultasikan?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  openChatMessenger();
}

/* CHAT LANGSUNG DENGAN ADMIN PENGELOLA ESTATE (UNTUK PENGADUAN WARGA) */
function openChatWithEstateAdmin(ticketId) {
  window.store.activeChatType = "ESTATE";

  const allComplaints = window.store.complaints || [];
  const ticket = allComplaints.find(c => c.id === ticketId) || {
    id: ticketId || "TKT-2026-UMUM",
    notes: "Pengaduan kendala fasilitas perumahan",
    category: "BANGUNAN",
    status: "IN_PROGRESS",
    resolution: "Jadwal kunjungan teknisi sedang dikoordinasikan.",
    date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  };

  window.store.activeComplaintTicket = ticket;

  // Nama teknisi / admin spesifik sesuai jenis kerusakan
  let adminName = "Bpk. Hendra - Pengelola Estate";
  let adminRole = "Koordinator Pemeliharaan & Retensi";
  let avatarBadge = "EP";
  let techOfficer = "Mas Yanto (Teknisi Lapangan)";

  if (ticket.category === "AIR") {
    adminName = "Mas Joko - Tim Plumbing & Air";
    adminRole = "Teknisi Khusus Instalasi Pipa & Sanitasi";
    avatarBadge = "PL";
    techOfficer = "Mas Joko (Spesialis Saluran)";
  } else if (ticket.category === "BANGUNAN") {
    adminName = "Bpk. Hendra - Pengelola Estate";
    adminRole = "Koordinator Teknisi Sipil & Retensi Garansi";
    avatarBadge = "EP";
    techOfficer = "Mas Yanto (Sipil & Plafon)";
  } else if (ticket.category === "LINGKUNGAN") {
    adminName = "Pak Asep - Keamanan & Fasum";
    adminRole = "Divisi Sarana Prasarana Kawasan";
    avatarBadge = "FS";
    techOfficer = "Tim Penerangan & Fasum";
  }

  // Update Avatar & Nama Interlocutor di Header Chat
  const badgeEl = document.getElementById("chatAvatarBadge");
  const nameEl = document.getElementById("chatPersonName");
  const roleEl = document.getElementById("chatPersonRole");
  if (badgeEl) badgeEl.innerText = avatarBadge;
  if (nameEl) nameEl.innerText = adminName;
  if (roleEl) roleEl.innerText = adminRole;

  // Pasang Kartu Tiket Pengaduan di Atas Ruang Obrolan
  const contextCard = document.getElementById("chatContextCard");
  const clusterText = document.getElementById("chatCardClusterText");
  const detailText = document.getElementById("chatCardDetailText");
  const timerText = document.getElementById("bookingHoldTimer");

  if (contextCard && clusterText && detailText) {
    contextCard.style.display = "block";
    contextCard.style.borderLeftColor = "#0ca678";
    if (timerText) {
      const isResolved = ticket.status === "RESOLVED";
      timerText.innerText = isResolved ? "STATUS: SELESAI (BAP OK)" : "STATUS: SEDANG DIKERJAKAN";
      timerText.style.color = isResolved ? "#16a34a" : "#d97706";
    }
    clusterText.innerText = `TIKET: ${ticket.id} • Kavling Blok B-05`;
    detailText.innerText = `Kendala: "${ticket.notes}" (${ticket.resolution || 'Sedang proses teknisi'})`;
  }

  // Perbarui tombol quick suggestion agar relevan dengan pengaduan warga
  updateQuickSuggestionsForResident(ticket);

  const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isResolved = ticket.status === "RESOLVED";

  const userName = (window.store.buyerProfile && window.store.buyerProfile.fullName) ? window.store.buyerProfile.fullName : "Rizky Pratama";
  let greetingText = "";
  if (isResolved) {
    greetingText = `Halo Bapak/Ibu ${userName}! Saya ${adminName}. Terkait laporan [${ticket.id}] mengenai "${ticket.notes}", status di sistem kami sudah selesai diperbaiki. Apakah ada kendala susulan yang perlu kami cek kembali?`;
  } else {
    greetingText = `Halo Bapak/Ibu ${userName}! Saya ${adminName}. Laporan kendala [${ticket.id}] mengenai "${ticket.notes}" sudah kami terima dan didisposisikan ke ${techOfficer}. Seluruh perbaikan ditanggung garansi developer (Bebas Biaya). Apakah ada catatan khusus terkait akses atau jam kedatangan teknisi?`;
  }

  window.store.chatHistory = [
    {
      sender: "agent",
      text: greetingText,
      time: timeNow,
      type: "text"
    }
  ];

  openChatMessenger();
}

function updateQuickSuggestionsForResident(ticket) {
  const container = document.querySelector(".chat-quick-suggestions");
  if (!container) return;

  container.innerHTML = `
    <div class="quick-suggestion-item" onclick="submitQuickPrompt('Kapan teknisi dijadwalkan tiba di Blok B-05?')">Jadwal Kedatangan Teknisi</div>
    <div class="quick-suggestion-item" onclick="submitQuickPrompt('Apakah perbaikan untuk tiket ini 100% bebas biaya garansi?')">Bebas Biaya Garansi?</div>
    <div class="quick-suggestion-item" onclick="submitQuickPrompt('Saya ingin mengirimkan foto rincian kerusakan tambahan.')">Kirim Foto Tambahan</div>
    <div class="quick-suggestion-item" onclick="submitQuickPrompt('Mohon konfirmasi setelah perbaikan selesai untuk tanda tangan BAP.')">Konfirmasi Selesai / BAP</div>
  `;
}

function restoreBuyerQuickSuggestions() {
  const container = document.querySelector(".chat-quick-suggestions");
  if (!container) return;

  container.innerHTML = `
    <div class="quick-suggestion-item" onclick="submitQuickPrompt('Mohon jadwal survei fisik lokasi kavling bersama sales lapangan.')">📅 Jadwal Survei Lapangan</div>
    <div class="quick-suggestion-item" onclick="submitQuickPrompt('Apakah sertifikat SHM dan PBG sudah pecah per kavling?')">Status Legalitas SHM</div>
    <div class="quick-suggestion-item" onclick="submitQuickPrompt('Bagaimana syarat kelayakan KPR bank rekanan?')">Syarat Berkas KPR</div>
    <div class="quick-suggestion-item" onclick="submitQuickPrompt('Apakah tersedia skema Cash Bertahap langsung ke developer?')">Cash Bertahap Developer</div>
  `;
}

function openChatMessenger() {
  renderChatMessages();
  document.getElementById("chatUnreadDot").style.display = "none";
  const viewTitle = window.store.activeChatType === "ESTATE" ? "Chat Pengelola Estate" : "Obrolan Agen Resmi";
  window.app.switchView("viewInAppChat", viewTitle, true);
}

function renderChatMessages() {
  const container = document.getElementById("chatStreamTarget");
  const attachCard = document.getElementById("chatContextCard");
  container.innerHTML = "";
  
  if (attachCard && attachCard.style.display !== "none") {
    container.appendChild(attachCard);
  }

  window.store.chatHistory.forEach(m => {
    const bubble = document.createElement("div");
    bubble.className = `msg-bubble ${m.sender}`;

    let contentHtml = "";

    // 1. Tipe Pesan Dokumen (PDF)
    if (m.type === "document") {
      contentHtml = `
        <div class="msg-doc-card">
          <div class="msg-doc-icon">📑</div>
          <div class="msg-doc-info">
            <div class="msg-doc-name">${m.fileName}</div>
            <div class="msg-doc-size">${m.fileSize} • Dokumen Terverifikasi</div>
          </div>
        </div>
        ${m.text ? `<div class="msg-doc-caption" style="margin-top: 4px;">${m.text}</div>` : ''}
      `;
    }
    // 2. Tipe Pesan Foto
    else if (m.type === "photo") {
      contentHtml = `
        <div class="msg-photo-wrap">
          <img src="${m.photoUrl}" alt="Lampiran Foto" class="msg-photo-img" onclick="window.open('${m.photoUrl}', '_blank')">
          ${m.text ? `<div class="msg-photo-caption">${m.text}</div>` : ''}
        </div>
      `;
    }
    // 3. Tipe Pesan Lokasi (GPS)
    else if (m.type === "location") {
      contentHtml = `
        <div class="msg-location-wrap">
          <div class="msg-map-preview">
            <span>📍</span>
          </div>
          <div class="msg-loc-details">
            <div class="msg-loc-title">${m.locTitle}</div>
            <div class="msg-loc-address">${m.locAddress}</div>
            <div class="msg-loc-action" onclick="window.app.showToast('Membuka rute di Google Maps...')">Buka di Google Maps ↗</div>
          </div>
        </div>
        ${m.text ? `<div style="font-size: 0.72rem; margin-top: 4px;">${m.text}</div>` : ''}
      `;
    }
    // 4. Pesan Teks Biasa
    else {
      contentHtml = `<div>${m.text}</div>`;
    }

    bubble.innerHTML = `
      ${contentHtml}
      <div class="timestamp">${m.time} ${m.sender === 'user' ? '✓✓' : ''}</div>
    `;
    container.appendChild(bubble);
  });

  container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
  const input = document.getElementById("chatInputMessage");
  const text = input.value.trim();
  if (!text) return;

  closeChatAttachMenu();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  window.store.chatHistory.push({ sender: "user", text: text, time: time, type: "text" });
  input.value = "";
  renderChatMessages();

  // Intelligent agent auto-reply
  setTimeout(() => {
    let reply = "Pesan Anda telah diterima oleh tim pengembang. Kami sedang memproses informasi terkait unit Anda.";
    const lower = text.toLowerCase();

    if (window.store.activeChatType === "ESTATE") {
      const ticket = window.store.activeComplaintTicket || {};
      if (lower.includes("kapan") || lower.includes("jadwal") || lower.includes("tiba") || lower.includes("jam")) {
        reply = `Teknisi kami dijadwalkan tiba sesuai preferensi waktu: ${ticket.visitPreference || 'Sesuai antrean kerja (08:30–11:30 WIB)'}. Tim kami akan menghubungi nomor kontak Anda 30 menit sebelum menuju ke Kavling Blok B-05.`;
      } else if (lower.includes("biaya") || lower.includes("gratis") || lower.includes("bayar") || lower.includes("tarif")) {
        reply = "Kavling Blok B-05 masih dalam masa retensi garansi developer aktif (142 hari tersisa). Seluruh jasa pengerjaan dan penggantian material/suku cadang 100% BEBAS BIAYA (Gratis).";
      } else if (lower.includes("bap") || lower.includes("selesai") || lower.includes("serah terima")) {
        const userName = (window.store.buyerProfile && window.store.buyerProfile.fullName) ? window.store.buyerProfile.fullName : "Bapak/Ibu";
        reply = `Betul ${userName}. Setelah perbaikan fisik tuntas dan diuji coba bersama Anda, mohon tanda tangani lembar Berita Acara Pengerjaan (BAP) sebagai verifikasi bahwa keluhan telah terselesaikan dengan baik.`;
      } else if (lower.includes("foto") || lower.includes("rusak") || lower.includes("gambar")) {
        reply = "Silakan lampirkan foto fisik melalui tombol klip kertas (📎) di samping kiri. Foto tersebut langsung kami teruskan ke koordinator teknisi untuk penyiapan material yang presisi.";
      } else {
        const userName = (window.store.buyerProfile && window.store.buyerProfile.fullName) ? window.store.buyerProfile.fullName : "Bapak/Ibu";
        reply = `Pesan Anda mengenai tiket [${ticket.id || 'pengaduan'}] telah dicatat oleh sistem pengelola estate. Kami terus memantau proses perbaikan agar kavling ${userName} kembali nyaman dan terawat.`;
      }
    } else {
      if (lower.includes("kpr") || lower.includes("berkas") || lower.includes("syarat")) {
        reply = "Tentu! Untuk pengajuan KPR, berkas wajib meliputi e-KTP, KK, NPWP, Slip Gaji 3 bulan, Rekening Koran 3 bulan, dan SK Kerja aktif. Anda dapat melampirkan file dokumen via tombol klip kertas (📎) di samping kiri kolom chat ini untuk pra-verifikasi CS sebelum ke bank.";
      } else if (lower.includes("survei") || lower.includes("lokasi") || lower.includes("besok")) {
        reply = "Baik Bapak/Ibu! Tim CS telah mencatat permintaan survei Anda. Kami telah mendisposisikan Sdr. Hendra (Sales Lapangan Resmi) untuk mendampingi Anda di lokasi kavling besok pukul 09:30 WIB. Titik temu di Kantor Pemasaran Gerbang Utama. Informasi unit dijamin akurat sesuai standar kantor pengembang.";
      } else if (lower.includes("shm") || lower.includes("sertifikat") || lower.includes("pbg")) {
        reply = "Legalitas kavling kami 100% tervalidasi: Sertifikat Hak Milik (SHM) sudah pecah murni per kavling (bukan sertifikat induk) dan Persetujuan Bangunan Gedung (PBG) resmi diterbitkan Pemda. Berkas asli dapat dicek langsung di kantor notaris rekanan kami.";
      } else if (lower.includes("bertahap") || lower.includes("developer") || lower.includes("in-house") || lower.includes("inhouse")) {
        reply = "Tersedia skema Cash Bertahap Developer (In-House) dengan tenor 12–24 bulan tanpa bunga (0%) dan tanpa proses BI Checking. Cukup membayar DP 30% dan menandatangani PPJB di hadapan Notaris resmi pengembang.";
      } else if (lower.includes("dp") || lower.includes("cicilan") || lower.includes("uang muka")) {
        reply = "Uang muka (DP) mulai dari 0%–10% dan dapat dicicil hingga 3 kali selama masa pembangunan unit berlangsung. Promo bulan ini juga free biaya notaris & PPN ditanggung pemerintah!";
      }
    }

    window.store.chatHistory.push({
      sender: "agent",
      text: reply,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "text"
    });
    renderChatMessages();
  }, 750);
}

/* ======================================================== */
/* WHATSAPP-STYLE ATTACHMENT MENU LOGIC                     */
/* ======================================================== */

let lastAttachToggleTime = 0;

function toggleChatAttachMenu(e) {
  if (e) {
    if (e.stopPropagation) e.stopPropagation();
  }
  const now = Date.now();
  if (now - lastAttachToggleTime < 300) return; // Prevent double toggle on mobile touch devices
  lastAttachToggleTime = now;

  const menu = document.getElementById("chatAttachMenu");
  const btn = document.getElementById("btnChatAttach");
  if (!menu) return;

  const isHidden = menu.style.display === "none" || !menu.style.display;
  menu.style.display = isHidden ? "flex" : "none";
  if (btn) {
    if (isHidden) btn.classList.add("active");
    else btn.classList.remove("active");
  }
}

function closeChatAttachMenu() {
  const menu = document.getElementById("chatAttachMenu");
  const btn = document.getElementById("btnChatAttach");
  if (menu) menu.style.display = "none";
  if (btn) btn.classList.remove("active");
}

// Tutup menu lampiran saat pengguna mengetuk di luar menu (Mobile & Desktop)
document.addEventListener("click", function(e) {
  const menu = document.getElementById("chatAttachMenu");
  const btn = document.getElementById("btnChatAttach");
  if (!menu || menu.style.display === "none") return;
  if (btn && (btn === e.target || btn.contains(e.target))) return;
  if (menu === e.target || menu.contains(e.target)) return;
  closeChatAttachMenu();
});

document.addEventListener("touchend", function(e) {
  const menu = document.getElementById("chatAttachMenu");
  const btn = document.getElementById("btnChatAttach");
  if (!menu || menu.style.display === "none") return;
  if (btn && (btn === e.target || btn.contains(e.target))) return;
  if (menu === e.target || menu.contains(e.target)) return;
  closeChatAttachMenu();
}, { passive: true });

function openAttachPicker(type) {
  closeChatAttachMenu();
  const modal = document.getElementById("chatAttachmentModalOverlay");
  const badge = document.getElementById("attachModalBadge");
  const tag = document.getElementById("attachModalCategoryTag");
  const title = document.getElementById("attachModalTitle");
  const desc = document.getElementById("attachModalDesc");
  const container = document.getElementById("attachModalListContainer");

  if (!modal || !container) return;

  if (type === "DOCUMENT") {
    badge.innerText = "📄";
    badge.style.background = "#f3e8ff";
    badge.style.borderColor = "#d8b4fe";
    badge.style.color = "#7e22ce";
    tag.innerText = "LAMPIRAN DOKUMEN BERKAS";
    tag.style.color = "#7e22ce";
    title.innerText = "Pilih Berkas KPR (PDF)";
    desc.innerText = "Pilih dokumen berkas administrasi siap kirim untuk diverifikasi oleh analis bank & pengembang:";

    container.innerHTML = `
      <div class="attach-preset-list">
        <div class="attach-preset-card" onclick="sendDocumentAttachment('e-KTP_Pemohon_Valid.pdf', '1.2 MB', 'Ini berkas e-KTP asli pemohon untuk pengajuan kredit ya.')">
          <div style="font-size: 1.5rem;">📑</div>
          <div style="flex: 1;">
            <div class="p-title">e-KTP_Pemohon_Valid.pdf</div>
            <div class="p-meta">Ukuran 1.2 MB • Dokumen Kependudukan</div>
          </div>
          <span style="font-size: 0.72rem; color: var(--brand-accent); font-weight: 700;">Kirim →</span>
        </div>

        <div class="attach-preset-card" onclick="sendDocumentAttachment('Kartu_Keluarga_KK_Resmi.pdf', '1.8 MB', 'Lampiran salinan Kartu Keluarga (KK).')">
          <div style="font-size: 1.5rem;">📑</div>
          <div style="flex: 1;">
            <div class="p-title">Kartu_Keluarga_KK_Resmi.pdf</div>
            <div class="p-meta">Ukuran 1.8 MB • Dokumen Keluarga Legalisir</div>
          </div>
          <span style="font-size: 0.72rem; color: var(--brand-accent); font-weight: 700;">Kirim →</span>
        </div>

        <div class="attach-preset-card" onclick="sendDocumentAttachment('Slip_Gaji_3_Bulan_Terakhir.pdf', '2.4 MB', 'Slip gaji resmi 3 bulan terakhir dengan stempel basah kantor.')">
          <div style="font-size: 1.5rem;">📑</div>
          <div style="flex: 1;">
            <div class="p-title">Slip_Gaji_3_Bulan_Terakhir.pdf</div>
            <div class="p-meta">Ukuran 2.4 MB • Bukti Penghasilan Tetap</div>
          </div>
          <span style="font-size: 0.72rem; color: var(--brand-accent); font-weight: 700;">Kirim →</span>
        </div>

        <div class="attach-preset-card" onclick="sendDocumentAttachment('Rekening_Koran_Mandiri_3Bln.pdf', '3.1 MB', 'Mutasi rekening koran operasional 3 bulan terakhir.')">
          <div style="font-size: 1.5rem;">📑</div>
          <div style="flex: 1;">
            <div class="p-title">Rekening_Koran_Mandiri_3Bln.pdf</div>
            <div class="p-meta">Ukuran 3.1 MB • Rekap Arus Kas Perbankan</div>
          </div>
          <span style="font-size: 0.72rem; color: var(--brand-accent); font-weight: 700;">Kirim →</span>
        </div>

        <label class="attach-preset-card" style="border-style: dashed; background: #fafafa; cursor: pointer;">
          <input type="file" accept=".pdf,.doc,.docx" style="display:none" onchange="handleCustomFileUpload(this, 'DOCUMENT')">
          <div style="font-size: 1.5rem;">📁</div>
          <div style="flex: 1;">
            <div class="p-title">Unggah File PDF dari Perangkat...</div>
            <div class="p-meta">Pilih dokumen fisik langsung dari penyimpanan HP/Laptop</div>
          </div>
          <span style="font-size: 0.72rem; color: #2563eb; font-weight: 700;">Pilih File</span>
        </label>
      </div>
    `;
  } else if (type === "PHOTO") {
    badge.innerText = "🖼️";
    badge.style.background = "#e0f2fe";
    badge.style.borderColor = "#bae6fd";
    badge.style.color = "#0369a1";
    tag.innerText = "LAMPIRAN FOTO & BUKTI FISIK";
    tag.style.color = "#0369a1";
    title.innerText = "Pilih Foto Lapangan / Bukti Bayar";
    desc.innerText = "Kirim foto bukti pembayaran booking fee atau dokumentasi survei lapangan:";

    container.innerHTML = `
      <div class="attach-preset-list">
        <div class="attach-preset-card" onclick="sendPhotoAttachment('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80', 'Berikut bukti slip transfer tanda jadi booking fee Rp 2.000.000 via Mandiri.')">
          <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=100&q=80" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover;">
          <div style="flex: 1;">
            <div class="p-title">Bukti_Transfer_Booking_Fee.jpg</div>
            <div class="p-meta">Slip setoran tanda jadi resmi rekening PT</div>
          </div>
          <span style="font-size: 0.72rem; color: var(--brand-accent); font-weight: 700;">Kirim →</span>
        </div>

        <div class="attach-preset-card" onclick="sendPhotoAttachment('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80', 'Foto patok tanah kavling Blok A-01 saat survei kemarin sore.')">
          <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=100&q=80" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover;">
          <div style="flex: 1;">
            <div class="p-title">Foto_Patok_Kavling_Survei.jpg</div>
            <div class="p-meta">Dokumentasi fisik batas kavling perumahan</div>
          </div>
          <span style="font-size: 0.72rem; color: var(--brand-accent); font-weight: 700;">Kirim →</span>
        </div>

        <div class="attach-preset-card" onclick="sendPhotoAttachment('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80', 'Fasad depan rumah contoh tipe 45 yang kami minati.')">
          <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=100&q=80" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover;">
          <div style="flex: 1;">
            <div class="p-title">Foto_Rumah_Contoh_Tipe_45.jpg</div>
            <div class="p-meta">Foto fisik unit display di galeri pemasaran</div>
          </div>
          <span style="font-size: 0.72rem; color: var(--brand-accent); font-weight: 700;">Kirim →</span>
        </div>

        <label class="attach-preset-card" style="border-style: dashed; background: #fafafa; cursor: pointer;">
          <input type="file" accept="image/*" style="display:none" onchange="handleCustomFileUpload(this, 'PHOTO')">
          <div style="font-size: 1.5rem;">📷</div>
          <div style="flex: 1;">
            <div class="p-title">Pilih Foto dari Galeri HP...</div>
            <div class="p-meta">Format gambar JPG, PNG, atau WEBP</div>
          </div>
          <span style="font-size: 0.72rem; color: #0284c7; font-weight: 700;">Pilih Gambar</span>
        </label>
      </div>
    `;
  } else if (type === "LOCATION") {
    badge.innerText = "📍";
    badge.style.background = "#dcfce7";
    badge.style.borderColor = "#bbf7d0";
    badge.style.color = "#15803d";
    tag.innerText = "BAGIKAN LOKASI & TITIK TEMU";
    tag.style.color = "#15803d";
    title.innerText = "Bagi Lokasi Pertemuan Survei";
    desc.innerText = "Kirim koordinat lokasi akurat agar sales lapangan dapat memandu rute perjalanan:";

    container.innerHTML = `
      <div class="attach-preset-list">
        <div class="attach-preset-card" onclick="sendLocationAttachment('Marketing Gallery & Kantor Pemasaran', 'Jl. Ryacudu No. 88, Sukarame, Bandar Lampung', 'Saya sekarang sedang dalam perjalanan ke kantor pemasaran ya.')">
          <div style="font-size: 1.5rem;">🏢</div>
          <div style="flex: 1;">
            <div class="p-title">Marketing Gallery Kantor Pemasaran</div>
            <div class="p-meta">Jl. Ryacudu No. 88, Sukarame, Bandar Lampung</div>
          </div>
          <span style="font-size: 0.72rem; color: var(--brand-accent); font-weight: 700;">Kirim Lokasi →</span>
        </div>

        <div class="attach-preset-card" onclick="sendLocationAttachment('Gerbang Utama Grand Alessandra Residence', 'Akses Hotmix Row 8m, Kawasan Sukarame Baru', 'Posisi saya sudah di gerbang utama perumahan, mohon diarahkan ke blok kavling.')">
          <div style="font-size: 1.5rem;">🚪</div>
          <div style="flex: 1;">
            <div class="p-title">Gerbang Utama Grand Alessandra</div>
            <div class="p-meta">One Gate System, Pos Keamanan Kawasan Sukarame</div>
          </div>
          <span style="font-size: 0.72rem; color: var(--brand-accent); font-weight: 700;">Kirim Lokasi →</span>
        </div>

        <div class="attach-preset-card" onclick="sendLocationAttachment('Sentral Garden Residence (Natar)', 'Jl. Raya Lintas Sumatera Km 21, Hajimena', 'Saya menunggu sales di titik gerbang Sentral Garden.')">
          <div style="font-size: 1.5rem;">🏡</div>
          <div style="flex: 1;">
            <div class="p-title">Sentral Garden Residence</div>
            <div class="p-meta">Jl. Raya Lintas Sumatera Km 21, Natar, Lampung Selatan</div>
          </div>
          <span style="font-size: 0.72rem; color: var(--brand-accent); font-weight: 700;">Kirim Lokasi →</span>
        </div>

        <div class="attach-preset-card" onclick="sendLocationAttachment('Titik Lokasi Saya Saat Ini (Live GPS)', 'Akurasi GPS 5m • Sukarame, Bandar Lampung', 'Ini titik koordinat real-time posisi saya saat ini.')">
          <div style="font-size: 1.5rem;">📍</div>
          <div style="flex: 1;">
            <div class="p-title">Bagikan Lokasi Terkini Saya (Live GPS)</div>
            <div class="p-meta">Koordinat GPS Real-Time (Akurasi Presisi)</div>
          </div>
          <span style="font-size: 0.72rem; color: #16a34a; font-weight: 700;">Bagi GPS →</span>
        </div>
      </div>
    `;
  } else if (type === "CAMERA") {
    // Quick camera capture simulation
    closeAttachPicker();
    window.app.showToast("Membuka kamera... Mengambil foto lapangan");
    setTimeout(() => {
      sendPhotoAttachment(
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80",
        "Foto hasil tangkapan kamera langsung di lokasi kavling perumahan."
      );
    }, 600);
    return;
  }

  modal.style.display = "flex";
}

function closeAttachPicker() {
  const modal = document.getElementById("chatAttachmentModalOverlay");
  if (modal) modal.style.display = "none";
}

function sendDocumentAttachment(fileName, fileSize, caption) {
  closeAttachPicker();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  window.store.chatHistory.push({
    sender: "user",
    type: "document",
    fileName: fileName,
    fileSize: fileSize,
    text: caption,
    time: time
  });

  renderChatMessages();
  window.app.showToast(`Dokumen ${fileName} terkirim.`);

  // Auto-reply cerdas agen
  setTimeout(() => {
    const userName = (window.store.buyerProfile && window.store.buyerProfile.fullName) ? window.store.buyerProfile.fullName : "Bapak/Ibu";
    const replyText = isEstate
      ? `Terima kasih ${userName}! Dokumen berkas "${fileName}" telah kami terima dan disematkan ke berkas perbaikan tiket ini.`
      : `Terima kasih ${userName}! Dokumen berkas fisik "${fileName}" telah kami terima dengan baik. Tim administrasi kami akan segera memverifikasi kelengkapan syarat KPR ini ke analis perbankan rekanan.`;

    window.store.chatHistory.push({
      sender: "agent",
      type: "text",
      text: replyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    renderChatMessages();
  }, 1000);
}

function sendPhotoAttachment(photoUrl, caption) {
  closeAttachPicker();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  window.store.chatHistory.push({
    sender: "user",
    type: "photo",
    photoUrl: photoUrl,
    text: caption,
    time: time
  });

  renderChatMessages();
  window.app.showToast("Foto berhasil dikirim ke agen.");

  // Auto-reply cerdas agen
  setTimeout(() => {
    const isEstate = window.store.activeChatType === "ESTATE";
    const replyText = isEstate
      ? `Foto bukti kerusakan telah kami terima dengan jelas! Dokumentasi ini langsung kami teruskan ke teknisi lapangan agar membawa material pengganti yang sesuai.`
      : `Foto lampiran telah kami terima dan diverifikasi. Bukti visual ini sudah kami sematkan ke catatan berkas pemesanan unit kavling Anda di sistem pengembang.`;

    window.store.chatHistory.push({
      sender: "agent",
      type: "text",
      text: replyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    renderChatMessages();
  }, 1000);
}

function sendLocationAttachment(locTitle, locAddress, caption) {
  closeAttachPicker();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  window.store.chatHistory.push({
    sender: "user",
    type: "location",
    locTitle: locTitle,
    locAddress: locAddress,
    text: caption,
    time: time
  });

  renderChatMessages();
  window.app.showToast("Titik lokasi berhasil dibagikan.");

  // Auto-reply cerdas agen
  setTimeout(() => {
    const isEstate = window.store.activeChatType === "ESTATE";
    const replyText = isEstate
      ? `Titik lokasi "${locTitle}" terkonfirmasi! Teknisi lapangan kami akan menuju ke lokasi tersebut sesuai jadwal perbaikan.`
      : `Titik lokasi "${locTitle}" terkonfirmasi! Sales lapangan kami siap menunggu kedatangan Anda di lokasi tersebut. Jika ada kendala rute jalan, silakan kabari kami kembali.`;

    window.store.chatHistory.push({
      sender: "agent",
      type: "text",
      text: replyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    renderChatMessages();
  }, 1000);
}

function handleCustomFileUpload(input, type) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + " MB";

  if (type === "DOCUMENT") {
    sendDocumentAttachment(file.name, sizeMb, `Lampiran dokumen: ${file.name}`);
  } else if (type === "PHOTO") {
    const reader = new FileReader();
    reader.onload = function(e) {
      sendPhotoAttachment(e.target.result, `Foto lampiran: ${file.name}`);
    };
    reader.readAsDataURL(file);
  }
}

function submitQuickPrompt(txt) {
  document.getElementById("chatInputMessage").value = txt;
  sendChatMessage();
}

function clearChatHistory() {
  window.store.chatHistory = [
    { sender: "agent", text: "Ruang obrolan internal siap digunakan. Anda dapat mengirimkan dokumen KPR, foto bukti transfer, atau lokasi titik temu survei via tombol klip kertas (📎).", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: "text" }
  ];
  const c = document.getElementById("chatContextCard");
  if (c) c.style.display = "none";
  renderChatMessages();
  window.app.showToast("Riwayat obrolan dibersihkan");
}
