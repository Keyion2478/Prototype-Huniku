/*
  HUNIKU - IN-APP BOOKING & REAL-TIME MUTEX LOCKING MODULE
*/

let bookingTimerInterval = null;
let bookingTimerSeconds = 900; // 15:00 minutes
let pendingSwitchUnit = null;

function openBookingDialog() {
  const u = window.store.activeUnit;
  if (!u || u.status !== "AVAILABLE") {
    if (window.app && window.app.showToast) {
      window.app.showToast("Unit ini sedang tidak tersedia untuk dipesan.");
    } else {
      alert("Unit ini sedang tidak tersedia untuk dipesan.");
    }
    return;
  }

  // Validasi Kebijakan: 1 Akun 1 Pemesanan Aktif (Single Active Hold Policy)
  if (window.store.latestBooking && window.store.latestBooking.unit !== u.code) {
    const prev = window.store.latestBooking;
    pendingSwitchUnit = u;

    // Isi data komparasi ke dalam In-App Modal (Bukan browser confirm!)
    const oldTitleEl = document.getElementById("switchOldUnitText");
    const oldMetaEl = document.getElementById("switchOldUnitMeta");
    const newTitleEl = document.getElementById("switchNewUnitText");
    const newMetaEl = document.getElementById("switchNewUnitMeta");

    if (oldTitleEl) oldTitleEl.innerText = `${prev.unit} • ${prev.cluster}`;
    if (oldMetaEl) oldMetaEl.innerText = `${prev.type || 'Kavling'} • ${prev.scheme === 'KPR' ? 'Pengajuan KPR' : 'Pembayaran Tunai'} (Aktif)`;
    if (newTitleEl) newTitleEl.innerText = `${u.code} • ${u.cluster}`;
    if (newMetaEl) newMetaEl.innerText = `${u.type} • ${u.price}`;

    // Tampilkan custom in-app modal
    const switchModal = document.getElementById("switchUnitModalOverlay");
    if (switchModal) {
      switchModal.style.display = "flex";
    }
    return;
  }

  // Jika belum ada booking aktif, langsung buka form booking
  proceedOpenBookingForm(u);
}

function proceedOpenBookingForm(u) {
  document.getElementById("modalUnitBadge").innerText = `${u.code} • ${u.cluster}`;
  document.getElementById("modalUnitTitle").innerText = `${u.type} (${u.price})`;

  // Reset steps
  document.getElementById("modalFormBlock").style.display = "block";
  document.getElementById("modalLockingProgress").style.display = "none";
  document.getElementById("modalSuccessBlock").style.display = "none";

  // Provide initial values if empty so respondent can test immediately
  const nameInput = document.getElementById("buyerNameField");
  const phoneInput = document.getElementById("buyerPhoneField");
  if (!nameInput.value) nameInput.value = "Rizky Pratama";
  if (!phoneInput.value) phoneInput.value = "0812-7890-1234";

  // Ensure selected scheme is synced visually
  selectScheme(window.store.selectedScheme || "KPR");

  document.getElementById("bookingModalOverlay").style.display = "flex";
}

function closeBookingDialog() {
  document.getElementById("bookingModalOverlay").style.display = "none";
}

function closeSwitchUnitDialog() {
  pendingSwitchUnit = null;
  const switchModal = document.getElementById("switchUnitModalOverlay");
  if (switchModal) {
    switchModal.style.display = "none";
  }
}

function confirmSwitchUnit() {
  if (!pendingSwitchUnit) {
    closeSwitchUnitDialog();
    return;
  }

  const prev = window.store.latestBooking;
  const targetUnit = pendingSwitchUnit;

  // 1. Auto-release unit lama kembali menjadi AVAILABLE
  if (prev) {
    const oldUnit = window.store.units.find(x => x.code === prev.unit);
    if (oldUnit && oldUnit.status === "BOOKED") {
      oldUnit.status = "AVAILABLE";
    }
    // Hentikan timer penguncian lama
    if (bookingTimerInterval) {
      clearInterval(bookingTimerInterval);
      bookingTimerInterval = null;
    }
  }

  // 2. Kosongkan booking lama
  window.store.latestBooking = null;
  window.store.save();
  renderCatalog();
  if (typeof renderGuideScreen === "function") renderGuideScreen();

  // 3. Tutup switch modal
  closeSwitchUnitDialog();

  // 4. Feedback ramah
  if (window.app && window.app.showToast) {
    window.app.showToast(`Unit ${prev ? prev.unit : 'lama'} telah dilepas. Silakan lengkapi pemesanan ${targetUnit.code}.`);
  }

  // 5. Buka formulir booking untuk unit baru
  window.store.activeUnit = targetUnit;
  proceedOpenBookingForm(targetUnit);
}

function selectScheme(scheme) {
  window.store.selectedScheme = scheme;
  const kprEl = document.getElementById("schemeOptionKpr");
  const cashEl = document.getElementById("schemeOptionCash");
  const boxKpr = document.getElementById("schemeDetailBoxKpr");
  const boxCash = document.getElementById("schemeDetailBoxCash");

  if (kprEl && cashEl) {
    if (scheme === "KPR") {
      kprEl.classList.add("active");
      cashEl.classList.remove("active");
      if (boxKpr) boxKpr.style.display = "block";
      if (boxCash) boxCash.style.display = "none";
    } else {
      cashEl.classList.add("active");
      kprEl.classList.remove("active");
      if (boxKpr) boxKpr.style.display = "none";
      if (boxCash) boxCash.style.display = "block";
    }
  }
}

function goToGuideScreen(scheme) {
  closeBookingDialog();
  if (typeof switchGuideSection === "function") {
    switchGuideSection(scheme);
  }
  window.app.switchView("viewGuideChecklist", "Panduan & Syarat Beli", false);
}

function executeAtomicLock() {
  const name = document.getElementById("buyerNameField").value.trim();
  const phone = document.getElementById("buyerPhoneField").value.trim();

  if (!name || !phone) {
    if (window.app && window.app.showToast) {
      window.app.showToast("Silakan lengkapi Nama Lengkap dan Nomor WhatsApp.");
    } else {
      alert("Silakan lengkapi Nama Lengkap dan Nomor WhatsApp untuk validasi kepemilikan booking.");
    }
    return;
  }

  const u = window.store.activeUnit;
  if (!u || u.status !== "AVAILABLE") {
    if (window.app && window.app.showToast) {
      window.app.showToast("Maaf, unit ini baru saja dipesan oleh calon pembeli lain!");
    } else {
      alert("Maaf, unit ini baru saja dipesan oleh calon pembeli lain!");
    }
    closeBookingDialog();
    renderCatalog();
    return;
  }

  // Step 2: Concurrency Mutex Locking simulation
  document.getElementById("modalFormBlock").style.display = "none";
  document.getElementById("modalLockingProgress").style.display = "block";

  setTimeout(() => {
    // Acquire lock and flip status to BOOKED
    u.status = "BOOKED";
    window.store.save();

    const cleanCode = u.code.replace(/[^A-Z0-9]/g, "");
    const bookingCode = `BKG-20261001-${cleanCode}`;
    
    window.store.latestBooking = {
      code: bookingCode,
      unit: u.code,
      cluster: u.cluster,
      type: u.type,
      price: u.price,
      rawPrice: u.rawPrice,
      scheme: window.store.selectedScheme,
      buyerName: name,
      buyerPhone: phone,
      timestamp: new Date().toISOString()
    };

    // Show success & digital pass
    document.getElementById("modalLockingProgress").style.display = "none";
    document.getElementById("modalSuccessBlock").style.display = "block";
    document.getElementById("passCodeDisplay").innerText = bookingCode;
    document.getElementById("passDetailDisplay").innerText = `${u.cluster} - ${u.code} • ${window.store.selectedScheme === 'KPR' ? 'Pengajuan KPR Bank' : 'Pembayaran Tunai'}`;

    // Start 15-minute hold timer
    startHoldTimer();

    // Show notification dot on chat tab
    document.getElementById("chatUnreadDot").style.display = "block";
    window.app.showToast(`Kavling ${u.code} berhasil dikunci secara atomik (BOOKED)!`);
    renderCatalog();
    if (typeof renderGuideScreen === "function") {
      renderGuideScreen();
    }
  }, 1000);
}

function startHoldTimer() {
  if (bookingTimerInterval) clearInterval(bookingTimerInterval);
  bookingTimerSeconds = 900;
  
  bookingTimerInterval = setInterval(() => {
    bookingTimerSeconds--;
    const mins = Math.floor(bookingTimerSeconds / 60);
    const secs = bookingTimerSeconds % 60;
    const str = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    const timerEl = document.getElementById("bookingHoldTimer");
    if (timerEl) timerEl.innerText = `Sisa Waktu Kunci: ${str}`;

    const guideTimerEl = document.getElementById("guideHoldTimerText");
    if (guideTimerEl) guideTimerEl.innerText = `Batas Kunci: ${str}`;

    if (bookingTimerSeconds <= 0) {
      clearInterval(bookingTimerInterval);
      if (window.app && window.app.showToast) {
        window.app.showToast("Batas waktu penguncian 15 menit telah habis. Status unit dikembalikan ke ketersediaan awal.");
      }
      if (window.store.activeUnit && window.store.activeUnit.status === "BOOKED") {
        window.store.activeUnit.status = "AVAILABLE";
        window.store.latestBooking = null;
        window.store.save();
        renderCatalog();
        if (typeof renderGuideScreen === "function") renderGuideScreen();
      }
    }
  }, 1000);
}

function cancelCurrentBooking() {
  const b = window.store.latestBooking;
  const titleEl = document.getElementById("cancelModalUnitTitle");
  if (titleEl) {
    titleEl.innerText = b ? `${b.unit} (${b.cluster})` : "unit ini";
  }
  const modal = document.getElementById("cancelUnitModalOverlay");
  if (modal) {
    modal.style.display = "flex";
  }
}

function closeCancelUnitDialog() {
  const modal = document.getElementById("cancelUnitModalOverlay");
  if (modal) {
    modal.style.display = "none";
  }
}

function confirmCancelActiveBooking() {
  if (window.store.latestBooking) {
    const unitCode = window.store.latestBooking.unit;
    const found = window.store.units.find(x => x.code === unitCode);
    if (found && found.status === "BOOKED") {
      found.status = "AVAILABLE";
    }
  }

  if (bookingTimerInterval) {
    clearInterval(bookingTimerInterval);
    bookingTimerInterval = null;
  }

  window.store.latestBooking = null;
  window.store.save();

  closeCancelUnitDialog();
  renderCatalog();
  if (typeof renderGuideScreen === "function") renderGuideScreen();
  window.app.showToast("Penguncian unit telah dibatalkan. Kavling kembali berstatus Tersedia.");
}

function forwardToAgentChat() {
  closeBookingDialog();
  const b = window.store.latestBooking;
  if (!b) return;

  document.getElementById("chatAvatarBadge").innerText = "AR";
  document.getElementById("chatPersonName").innerText = "Sarah Amelia - Agen Resmi";
  document.getElementById("chatPersonRole").innerText = "Verifikasi Berkas & Jadwal Akad";

  const card = document.getElementById("chatContextCard");
  card.style.display = "block";
  document.getElementById("chatCardClusterText").innerText = `${b.cluster} - ${b.unit}`;
  document.getElementById("chatCardDetailText").innerText = `Kode: ${b.code} • Skema: ${b.scheme === 'KPR' ? 'Pengajuan KPR Bank' : 'Tunai'}`;

  window.store.chatHistory = [
    {
      sender: "agent",
      text: `Halo Bapak/Ibu ${b.buyerName}. Kode pemesanan ${b.code} untuk unit ${b.unit} telah resmi tercatat di sistem pengembang. Berkas apa saja yang sudah siap untuk verifikasi dokumen fisik?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  openChatMessenger();
}
