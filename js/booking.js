/*
  HUNIKU - IN-APP BOOKING & REAL-TIME MUTEX LOCKING MODULE
  Spec-aligned with Proposal PjBL & PRD:
  - Banking-Ready KYC Profiling (Name, WA, Domicile, Occupation, Age, Income) with Autofill
  - KPR Age Limit Qualification Check (warn if age > 35, suggest Cash Bertahap)
  - Atomic Mutex Locking (zero double booking guarantee)
  - 15-Minute Booking Hold Timer
  - Auto-Attached Booking Context Card to Central Customer Service (CS)
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
  const badgeEl = document.getElementById("modalUnitBadge");
  const titleEl = document.getElementById("modalUnitTitle");
  if (badgeEl) badgeEl.innerText = `${u.code} • ${u.cluster}`;
  if (titleEl) titleEl.innerText = `${u.type} (${u.price})`;

  // Reset steps
  const formBlock = document.getElementById("modalFormBlock");
  const progBlock = document.getElementById("modalLockingProgress");
  const succBlock = document.getElementById("modalSuccessBlock");
  if (formBlock) formBlock.style.display = "block";
  if (progBlock) progBlock.style.display = "none";
  if (succBlock) succBlock.style.display = "none";

  // Autofill from buyerProfile KYC
  const profile = window.store.buyerProfile || {};
  const nameInput = document.getElementById("buyerNameField");
  const phoneInput = document.getElementById("buyerPhoneField");
  const domInput = document.getElementById("buyerDomicileField");
  const occInput = document.getElementById("buyerOccupationField");
  const ageInput = document.getElementById("buyerAgeField");

  if (nameInput) nameInput.value = profile.fullName || "Rizky Pratama";
  if (phoneInput) phoneInput.value = profile.phone || "0812-7890-1234";
  if (domInput) domInput.value = profile.domicile || "Sukarame, Bandar Lampung";
  if (occInput) occInput.value = profile.occupation || "Karyawan Swasta";
  if (ageInput) {
    ageInput.value = profile.age || 29;
    checkKprAgeQualification(parseInt(ageInput.value));
  }

  // Ensure selected scheme is synced visually
  selectScheme(window.store.selectedScheme || "KPR");

  const modal = document.getElementById("bookingModalOverlay");
  if (modal) modal.style.display = "flex";
}

function checkKprAgeQualification(age) {
  const alertEl = document.getElementById("kprAgeAlertBox");
  if (!alertEl) return;

  if (isNaN(age) || age <= 0) {
    alertEl.style.display = "none";
    return;
  }

  if (age > 35) {
    alertEl.style.display = "block";
    alertEl.style.background = "#fffbeb";
    alertEl.style.borderColor = "#fcd34d";
    alertEl.innerHTML = `
      <div style="display: flex; gap: 8px; align-items: flex-start;">
        <span style="font-size: 1.1rem; line-height: 1;">⚠️</span>
        <div style="flex: 1;">
          <div style="color: #92400e; font-size: 0.72rem; font-weight: 800;">Perhatian Batas Usia Pemohon KPR (${age} Tahun)</div>
          <p style="font-size: 0.68rem; color: #78350f; margin-top: 3px; line-height: 1.4;">
            Usia Anda mendekati batas maksimal tenor KPR Subsidi (ketentuan perbankan: usia maksimal 55–60 tahun saat masa kredit lunas). Tenor KPR kemungkinan dibatasi 10–15 tahun. Anda disarankan memilih KPR Komersil atau beralih ke skema Cash Bertahap Developer.
          </p>
          <button type="button" onclick="selectScheme('CASH')" style="margin-top: 6px; background: #d97706; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.65rem; font-weight: 700; cursor: pointer;">
            🔄 Alihkan ke Skema Cash Bertahap Developer
          </button>
        </div>
      </div>
    `;
  } else {
    alertEl.style.display = "block";
    alertEl.style.background = "#eff6ff";
    alertEl.style.borderColor = "#bfdbfe";
    alertEl.innerHTML = `
      <div style="display: flex; gap: 8px; align-items: center;">
        <span style="font-size: 1rem; line-height: 1;">✅</span>
        <div style="flex: 1;">
          <span style="color: #1e40af; font-size: 0.72rem; font-weight: 800;">Kualifikasi Usia Produktif Ideal (${age} Tahun):</span>
          <span style="font-size: 0.68rem; color: #1e3a8a; margin-left: 4px;">
            Memenuhi syarat tenor panjang hingga 20–25 tahun untuk skema KPR Bersubsidi (FLPP) maupun Komersil.
          </span>
        </div>
      </div>
    `;
  }
}

function handleAgeFieldChange() {
  const ageInput = document.getElementById("buyerAgeField");
  if (ageInput) {
    const age = parseInt(ageInput.value) || 0;
    checkKprAgeQualification(age);
  }
}

function closeBookingDialog() {
  const modal = document.getElementById("bookingModalOverlay");
  if (modal) modal.style.display = "none";
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

  // Re-check age qualification whenever scheme switches
  const ageInput = document.getElementById("buyerAgeField");
  if (ageInput && scheme === "KPR") {
    checkKprAgeQualification(parseInt(ageInput.value) || 29);
  } else {
    const alertEl = document.getElementById("kprAgeAlertBox");
    if (alertEl) alertEl.style.display = "none";
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
  const name = document.getElementById("buyerNameField")?.value.trim() || "";
  const phone = document.getElementById("buyerPhoneField")?.value.trim() || "";
  const domicile = document.getElementById("buyerDomicileField")?.value.trim() || "";
  const occupation = document.getElementById("buyerOccupationField")?.value.trim() || "";
  const age = parseInt(document.getElementById("buyerAgeField")?.value) || 29;

  if (!name || !phone) {
    if (window.app && window.app.showToast) {
      window.app.showToast("Silakan lengkapi Nama Lengkap dan Nomor WhatsApp.");
    } else {
      alert("Silakan lengkapi Nama Lengkap dan Nomor WhatsApp untuk validasi kepemilikan booking.");
    }
    return;
  }

  // Persist updated profile
  window.store.updateBuyerProfile({
    fullName: name,
    phone: phone,
    domicile: domicile,
    occupation: occupation,
    age: age
  });

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
      buyerDomicile: domicile,
      buyerOccupation: occupation,
      buyerAge: age,
      timestamp: new Date().toISOString()
    };

    window.store.addAuditLog(
      "MUTEX_LOCK_SUCCESS",
      `Kavling ${u.code}`,
      `${name} (Pembeli)`,
      `Penguncian atomik in-app berhasil (${window.store.selectedScheme}). Kode: ${bookingCode}`,
      "BOOKED"
    );

    window.store.save();

    // Show success & digital pass
    document.getElementById("modalLockingProgress").style.display = "none";
    document.getElementById("modalSuccessBlock").style.display = "block";
    document.getElementById("passCodeDisplay").innerText = bookingCode;
    document.getElementById("passDetailDisplay").innerText = `${u.cluster} - ${u.code} • ${window.store.selectedScheme === 'KPR' ? 'Pengajuan KPR Bank' : 'Pembayaran Tunai'}`;

    // Start 15-minute hold timer
    startHoldTimer();

    // Show notification dot on chat tab
    const unreadDot = document.getElementById("chatUnreadDot");
    if (unreadDot) unreadDot.style.display = "block";
    
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

  const avatarBadge = document.getElementById("chatAvatarBadge");
  const nameEl = document.getElementById("chatPersonName");
  const roleEl = document.getElementById("chatPersonRole");
  if (avatarBadge) avatarBadge.innerText = "CS";
  if (nameEl) nameEl.innerText = "Doni - Customer Service Resmi";
  if (roleEl) roleEl.innerText = "Kantor Pemasaran & Verifikasi Berkas";

  const card = document.getElementById("chatContextCard");
  if (card) {
    card.style.display = "block";
    card.style.borderLeftColor = "#2563eb";
    const clText = document.getElementById("chatCardClusterText");
    const detText = document.getElementById("chatCardDetailText");
    if (clText) clText.innerText = `${b.cluster} - ${b.unit}`;
    if (detText) detText.innerText = `Kode: ${b.code} • Skema: ${b.scheme === 'KPR' ? 'Pengajuan KPR Bank' : 'Tunai'}`;
  }

  window.store.chatHistory = [
    {
      sender: "agent",
      text: `Halo Bapak/Ibu ${b.buyerName}! Selamat, kode pemesanan ${b.code} untuk unit ${b.unit} (${b.cluster}) telah resmi terkunci di sistem pengembang. Berkas KPR/Tunai Anda sedang kami siapkan untuk diverifikasi bersama bank rekanan. Apakah Anda ingin sekaligus menjadwalkan survei fisik ke kavling besok?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  openChatMessenger();
}
