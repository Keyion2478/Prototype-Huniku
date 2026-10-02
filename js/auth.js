/*
  HUNIKU - AUTHENTICATION & REGISTRATION CONTROLLER
  Spec-aligned with Proposal PjBL, PRD, and Post-Interview Field Discussion (01 Okt 2026):
  1. Banking KYC Standard Onboarding:
     - Calon Pembeli: Nama Lengkap (e-KTP), WhatsApp Aktif, Email & Password, Domisili Asal, Pekerjaan, Usia, Status Pernikahan/Keluarga, Estimasi Penghasilan Bulanan, Rencana Skema Transaksi (KPR Tipe 36/45/54 vs Cash).
     - Warga Penghuni: Nama Tuan Rumah, WhatsApp Aktif, Email & Password, Kawasan Perumahan Dihuni (Sentral Garden / Alessandra / Permata), Nomor Blok/Kavling, Status Kepemilikan, Status Garansi Retensi Developer.
  2. One-Click Demo Simulators for PjBL Field Research & Usability Testing.
  3. Dynamic Role Routing (Calon Pembeli vs Warga Penghuni).
  4. Guest-First Exploration Option.
*/

let selectedAuthRole = "BUYER";

function initAuth() {
  const session = localStorage.getItem("huniku_auth_session");
  const authContainer = document.getElementById("authContainer");
  const mainAppDock = document.getElementById("mainAppDock");
  const headerStrip = document.querySelector(".app-header-strip");

  if (!session) {
    // Pengguna belum login: Tampilkan welcome auth screen
    if (authContainer) authContainer.style.display = "block";
    if (mainAppDock) mainAppDock.style.display = "none";
    if (headerStrip) headerStrip.style.display = "none";
    showAuthScreen("viewAuthWelcome");
  } else {
    // Sudah login: Jalankan aplikasi utama
    if (authContainer) authContainer.style.display = "none";
    if (mainAppDock) mainAppDock.style.display = "flex";
    if (headerStrip) headerStrip.style.display = "flex";
    
    try {
      const user = JSON.parse(session);
      if (user && user.fullName) {
        window.store.buyerProfile = { ...window.store.buyerProfile, ...user };
        const greetEl = document.getElementById("userGreetingNameDisplay");
        if (greetEl) {
          if (user.role === "RESIDENT") {
            greetEl.innerText = `${user.fullName} (${user.residentUnit || 'Warga'})`;
          } else {
            greetEl.innerText = `${user.fullName} (${user.age || 29} th)`;
          }
        }
        if (typeof updateResidentProfileDisplay === "function") {
          updateResidentProfileDisplay();
        }
      }
    } catch(e) {}
  }
}

function showAuthScreen(screenId) {
  document.querySelectorAll(".auth-screen-view").forEach(view => {
    view.classList.remove("is-active");
  });

  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add("is-active");
  }
}

function selectAuthRole(role, btn) {
  selectedAuthRole = role;
  document.querySelectorAll(".btn-auth-role-choice").forEach(b => b.classList.remove("active"));
  if (btn) {
    btn.classList.add("active");
  } else {
    const el = role === "RESIDENT" ? document.getElementById("btnRoleResident") : document.getElementById("btnRoleBuyer");
    if (el) el.classList.add("active");
  }

  const buyerFields = document.getElementById("regBuyerFields");
  const residentFields = document.getElementById("regResidentFields");
  const formSubtitle = document.getElementById("regFormSubtitle");
  const nameLabel = document.getElementById("regFullNameLabel");

  if (role === "RESIDENT") {
    if (buyerFields) buyerFields.style.display = "none";
    if (residentFields) residentFields.style.display = "block";
    if (formSubtitle) formSubtitle.innerText = "Daftarkan identitas hunian resmi Anda untuk akses pelaporan perbaikan bergaransi & data riwayat fasilitas.";
    if (nameLabel) nameLabel.innerHTML = 'Nama Tuan Rumah / Penghuni (Sesuai BAP/SPK) <span class="required-star">*</span>';
  } else {
    if (buyerFields) buyerFields.style.display = "block";
    if (residentFields) residentFields.style.display = "none";
    if (formSubtitle) formSubtitle.innerText = "Lengkapi profil pendaftaran berstandar perbankan (KYC) untuk verifikasi kavling bebas double booking & pengajuan KPR.";
    if (nameLabel) nameLabel.innerHTML = 'Nama Lengkap (Sesuai e-KTP) <span class="required-star">*</span>';
  }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    btn.innerHTML = "👁️‍🗨️";
    btn.title = "Sembunyikan Kata Sandi";
  } else {
    input.type = "password";
    btn.innerHTML = "👁️";
    btn.title = "Tampilkan Kata Sandi";
  }
}

function fillRegisterDemoBuyer() {
  selectAuthRole("BUYER");
  const nameInput = document.getElementById("regFullName");
  const phoneInput = document.getElementById("regPhone");
  const emailInput = document.getElementById("regEmail");
  const passwordInput = document.getElementById("regPassword");
  const domicileInput = document.getElementById("regDomicile");
  const occSelect = document.getElementById("regOccupation");
  const ageInput = document.getElementById("regAge");
  const maritalSelect = document.getElementById("regMaritalStatus");
  const incomeSelect = document.getElementById("regIncome");
  const planSelect = document.getElementById("regPlanPreference");

  if (nameInput) nameInput.value = "Rizky Pratama";
  if (phoneInput) phoneInput.value = "0812-7890-1234";
  if (emailInput) emailInput.value = "rizky.pratama@example.com";
  if (passwordInput) passwordInput.value = "12345678";
  if (domicileInput) domicileInput.value = "Sukarame, Bandar Lampung";
  if (occSelect) occSelect.value = "Karyawan Swasta";
  if (ageInput) ageInput.value = 29;
  if (maritalSelect) maritalSelect.value = "Menikah (1 Kepala Keluarga)";
  if (incomeSelect) incomeSelect.value = "7500000";
  if (planSelect) planSelect.value = "KPR - Tipe 36 (Subsidi / Komersil)";

  if (window.app && window.app.showToast) {
    window.app.showToast("Data simulasi Calon Pembeli (Rizky Pratama) berhasil terisi!");
  }
}

function fillRegisterDemoResident() {
  selectAuthRole("RESIDENT");
  const nameInput = document.getElementById("regFullName");
  const phoneInput = document.getElementById("regPhone");
  const emailInput = document.getElementById("regEmail");
  const passwordInput = document.getElementById("regPassword");
  const clusterSelect = document.getElementById("regResidentCluster");
  const unitInput = document.getElementById("regResidentUnit");
  const ownershipSelect = document.getElementById("regResidentOwnership");
  const warrantySelect = document.getElementById("regResidentWarranty");

  if (nameInput) nameInput.value = "Ibu Ratna";
  if (phoneInput) phoneInput.value = "0813-6622-9988";
  if (emailInput) emailInput.value = "ratna.blokb05@example.com";
  if (passwordInput) passwordInput.value = "12345678";
  if (clusterSelect) clusterSelect.value = "Sentral Garden Residence";
  if (unitInput) unitInput.value = "Kavling Blok B-05";
  if (ownershipSelect) ownershipSelect.value = "Pemilik Utama / Tuan Rumah";
  if (warrantySelect) warrantySelect.value = "GARANSI_AKTIF";

  if (window.app && window.app.showToast) {
    window.app.showToast("Data simulasi Warga Penghuni (Ibu Ratna - Blok B-05) berhasil terisi!");
  }
}

function handleLoginSubmit(event) {
  if (event) event.preventDefault();

  const identifier = document.getElementById("loginIdentifier")?.value.trim();
  const password = document.getElementById("loginPassword")?.value.trim();

  if (!identifier) {
    if (window.app && window.app.showToast) window.app.showToast("Harap masukkan Email atau No. WhatsApp Anda.");
    return;
  }
  if (!password) {
    if (window.app && window.app.showToast) window.app.showToast("Harap masukkan kata sandi.");
    return;
  }

  // Gunakan profil tersimpan atau buat profil aktif
  const currentProfile = window.store.buyerProfile || {};
  const activeUser = {
    ...currentProfile,
    fullName: currentProfile.fullName || "Rizky Pratama",
    email: identifier.includes("@") ? identifier : (currentProfile.email || "rizky.pratama@example.com"),
    phone: !identifier.includes("@") ? identifier : (currentProfile.phone || "0812-7890-1234"),
    isLoggedIn: true
  };

  localStorage.setItem("huniku_auth_session", JSON.stringify(activeUser));
  window.store.buyerProfile = activeUser;

  // Masuk ke aplikasi utama
  completeAuthLogin(activeUser, "Selamat datang kembali di Huniku!");
}

function handleRegisterSubmit(event) {
  if (event) event.preventDefault();

  const fullName = document.getElementById("regFullName")?.value.trim();
  const phone = document.getElementById("regPhone")?.value.trim();
  const email = document.getElementById("regEmail")?.value.trim();
  const password = document.getElementById("regPassword")?.value.trim();
  const agreeCheck = document.getElementById("regAgreeConsent")?.checked;

  if (!fullName) {
    if (window.app && window.app.showToast) window.app.showToast("Nama lengkap / nama tuan rumah wajib diisi.");
    return;
  }
  if (!phone) {
    if (window.app && window.app.showToast) window.app.showToast("Nomor WhatsApp aktif wajib diisi.");
    return;
  }
  if (!email) {
    if (window.app && window.app.showToast) window.app.showToast("Alamat email wajib diisi.");
    return;
  }
  if (!password || password.length < 6) {
    if (window.app && window.app.showToast) window.app.showToast("Kata sandi minimal 6 karakter.");
    return;
  }
  if (!agreeCheck) {
    if (window.app && window.app.showToast) window.app.showToast("Harap centang persetujuan pemrosesan data.");
    return;
  }

  let newUser = {
    fullName: fullName,
    phone: phone,
    email: email,
    role: selectedAuthRole,
    isLoggedIn: true
  };

  if (selectedAuthRole === "BUYER") {
    const domicile = document.getElementById("regDomicile")?.value.trim() || "Bandar Lampung";
    const occupation = document.getElementById("regOccupation")?.value || "Karyawan Swasta";
    const age = parseInt(document.getElementById("regAge")?.value) || 29;
    const maritalStatus = document.getElementById("regMaritalStatus")?.value || "Menikah (1 Kepala Keluarga)";
    const income = parseInt(document.getElementById("regIncome")?.value) || 7500000;
    const planPreference = document.getElementById("regPlanPreference")?.value || "KPR - Tipe 36 (Subsidi / Komersil)";

    newUser = {
      ...newUser,
      domicile: domicile,
      occupation: occupation,
      age: age,
      maritalStatus: maritalStatus,
      monthlyIncome: income,
      preferredPlan: planPreference,
      residentUnit: "Belum Ada Unit",
      residentCluster: "Semua Kawasan",
      warrantyDaysLeft: 0
    };
  } else {
    const residentCluster = document.getElementById("regResidentCluster")?.value || "Sentral Garden Residence";
    const residentUnit = document.getElementById("regResidentUnit")?.value.trim() || "Kavling Blok B-05";
    const ownership = document.getElementById("regResidentOwnership")?.value || "Pemilik Utama / Tuan Rumah";
    const warrantyStatus = document.getElementById("regResidentWarranty")?.value || "GARANSI_AKTIF";
    const warrantyDays = warrantyStatus === "GARANSI_AKTIF" ? 142 : 0;

    newUser = {
      ...newUser,
      domicile: residentCluster,
      occupation: ownership,
      age: 38,
      maritalStatus: "Menikah (Keluarga)",
      monthlyIncome: 8000000,
      residentUnit: residentUnit,
      residentCluster: residentCluster,
      ownershipStatus: ownership,
      warrantyStatus: warrantyStatus,
      warrantyDaysLeft: warrantyDays
    };
  }

  // Simpan ke store & session
  window.store.updateBuyerProfile(newUser);
  localStorage.setItem("huniku_auth_session", JSON.stringify(newUser));

  const roleName = selectedAuthRole === "RESIDENT" ? "Warga Penghuni" : "Calon Pembeli";
  completeAuthLogin(newUser, `Pendaftaran berhasil! Akun Anda aktif sebagai ${roleName}.`);
}

function completeAuthLogin(user, message) {
  const authContainer = document.getElementById("authContainer");
  const mainAppDock = document.getElementById("mainAppDock");
  const headerStrip = document.querySelector(".app-header-strip");

  if (authContainer) authContainer.style.display = "none";
  if (mainAppDock) mainAppDock.style.display = "flex";
  if (headerStrip) headerStrip.style.display = "flex";

  // Sinkronisasi sapaan pengguna di topbar
  const greetEl = document.getElementById("userGreetingNameDisplay");
  if (greetEl) {
    if (user.role === "RESIDENT") {
      greetEl.innerText = `${user.fullName} (${user.residentUnit || 'Warga'})`;
    } else {
      greetEl.innerText = `${user.fullName} (${user.age || 29} th)`;
    }
  }

  // Sinkronisasi profil warga di portal penghuni
  if (typeof updateResidentProfileDisplay === "function") {
    updateResidentProfileDisplay();
  }

  // Arahkan ke screen yang relevan
  if (user.role === "RESIDENT" || selectedAuthRole === "RESIDENT") {
    if (window.app && window.app.setRole) window.app.setRole("RESIDENT");
  } else {
    if (window.app && window.app.setRole) window.app.setRole("BUYER");
  }

  if (window.app && window.app.showToast) {
    window.app.showToast(message || `Selamat datang, ${user.fullName}!`);
  }
}

function loginAsDemoBuyer() {
  const demoBuyer = {
    fullName: "Rizky Pratama",
    phone: "0812-7890-1234",
    email: "rizky.pratama@example.com",
    domicile: "Sukarame, Bandar Lampung",
    occupation: "Karyawan Swasta",
    age: 29,
    monthlyIncome: 7500000,
    maritalStatus: "Menikah (1 Kepala Keluarga)",
    preferredPlan: "KPR - Tipe 36 (Subsidi / Komersil)",
    residentUnit: "Belum Ada Unit",
    residentCluster: "Semua Kawasan",
    warrantyDaysLeft: 0,
    role: "BUYER",
    isLoggedIn: true
  };

  window.store.updateBuyerProfile(demoBuyer);
  localStorage.setItem("huniku_auth_session", JSON.stringify(demoBuyer));
  selectedAuthRole = "BUYER";
  completeAuthLogin(demoBuyer, "Login Cepat: Masuk sebagai Calon Pembeli (Rizky Pratama • 29 th)");
}

function loginAsDemoResident() {
  const demoResident = {
    fullName: "Ibu Ratna",
    phone: "0813-6622-9988",
    email: "ratna.blokb05@example.com",
    domicile: "Natar, Lampung Selatan",
    occupation: "Ibu Rumah Tangga & Pemilik Unit",
    age: 38,
    monthlyIncome: 8000000,
    maritalStatus: "Menikah (2 Anak)",
    residentUnit: "Kavling Blok B-05",
    residentCluster: "Sentral Garden Residence",
    ownershipStatus: "Pemilik Utama / Tuan Rumah",
    warrantyStatus: "GARANSI_AKTIF",
    warrantyDaysLeft: 142,
    role: "RESIDENT",
    isLoggedIn: true
  };

  window.store.updateBuyerProfile(demoResident);
  localStorage.setItem("huniku_auth_session", JSON.stringify(demoResident));
  selectedAuthRole = "RESIDENT";
  completeAuthLogin(demoResident, "Login Cepat: Masuk sebagai Warga Penghuni (Ibu Ratna • Blok B-05)");
}

function continueAsGuest() {
  const guestUser = {
    fullName: "Tamu Penjelajah",
    phone: "-",
    email: "tamu@huniku.id",
    domicile: "Bandar Lampung",
    occupation: "Pengunjung Web",
    age: 28,
    monthlyIncome: 6000000,
    maritalStatus: "Lajang",
    residentUnit: "Belum Ada Unit",
    residentCluster: "Semua Kawasan",
    warrantyDaysLeft: 0,
    role: "BUYER",
    isLoggedIn: true
  };

  localStorage.setItem("huniku_auth_session", JSON.stringify(guestUser));
  window.store.buyerProfile = guestUser;
  completeAuthLogin(guestUser, "Mode Tamu: Anda dapat menjelajahi katalog unit.");
}

function handleUserLogout() {
  localStorage.removeItem("huniku_auth_session");

  const authContainer = document.getElementById("authContainer");
  const mainAppDock = document.getElementById("mainAppDock");
  const headerStrip = document.querySelector(".app-header-strip");

  if (authContainer) authContainer.style.display = "block";
  if (mainAppDock) mainAppDock.style.display = "none";
  if (headerStrip) headerStrip.style.display = "none";

  showAuthScreen("viewAuthWelcome");

  // Tutup modal profil KYC jika sedang terbuka
  const kycModal = document.getElementById("buyerKycModalOverlay");
  if (kycModal) kycModal.style.display = "none";

  if (window.app && window.app.showToast) {
    window.app.showToast("Anda telah keluar dari akun Huniku.");
  }
}
