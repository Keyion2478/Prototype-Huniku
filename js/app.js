/*
  HUNIKU - MAIN APPLICATION CONTROLLER
*/

class AppController {
  constructor() {
    this.initClock();
  }

  init() {
    initInterviewNotes();
    renderCatalog();
    renderResidentTickets();
    if (typeof renderGuideScreen === "function") renderGuideScreen();
    this.switchView("viewCatalog", "Katalog Kavling", false);
  }

  switchView(screenId, title = "Huniku", allowBack = false) {
    document.querySelectorAll(".view-screen").forEach(el => el.classList.remove("is-active"));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add("is-active");
      window.store.currentScreen = screenId;
    }

    const lbl = document.getElementById("headerContextLabel");
    if (lbl) lbl.innerText = title;

    const backBtn = document.getElementById("btnAppBack");
    if (backBtn) backBtn.style.display = allowBack ? "flex" : "none";

    const viewport = document.getElementById("appScrollViewport");
    if (viewport) viewport.scrollTop = 0;

    this.updateBottomTabs(screenId);
    if (screenId === "viewGuideChecklist") {
      if (typeof renderGuideScreen === "function") renderGuideScreen();
    }
    if (screenId === "viewResidentDesk") {
      if (typeof renderResidentTickets === "function") renderResidentTickets();
    }
    syncInterviewGuide(screenId);
  }

  handleBack() {
    if (window.store.currentScreen === "viewUnitDetail") {
      this.switchView("viewCatalog", "Katalog Kavling", false);
    } else if (window.store.currentScreen === "viewInAppChat") {
      if (window.store.activeChatType === "ESTATE" || window.store.role === "RESIDENT") {
        this.switchView("viewResidentDesk", "Layanan Warga", false);
      } else {
        this.switchView("viewCatalog", "Katalog Kavling", false);
      }
    } else {
      this.switchView("viewCatalog", "Katalog Kavling", false);
    }
  }

  setRole(role) {
    window.store.role = role;
    document.querySelectorAll(".role-tab-btn").forEach(b => b.classList.remove("active"));

    const roleBadge = document.getElementById("headerRoleBadge");
    const dock = document.getElementById("mainAppDock");
    const canvas = document.getElementById("deviceCanvas");
    const deviceToggleBtn = document.getElementById("btnDeviceToggle");

    if (role === "BUYER") {
      const b = document.getElementById("btnRoleBuyer");
      if (b) b.classList.add("active");
      if (roleBadge) roleBadge.innerText = "Pencarian Unit";
      if (dock) dock.style.display = "flex";
      if (canvas) canvas.classList.remove("mode-desktop");
      if (deviceToggleBtn) deviceToggleBtn.innerText = "Mode Desktop";
      renderCatalog();
      this.switchView("viewCatalog", "Katalog Kavling", false);
    } else if (role === "RESIDENT") {
      const b = document.getElementById("btnRoleResident");
      if (b) b.classList.add("active");
      if (roleBadge) roleBadge.innerText = "Portal Warga";
      if (dock) dock.style.display = "flex";
      if (canvas) canvas.classList.remove("mode-desktop");
      if (deviceToggleBtn) deviceToggleBtn.innerText = "Mode Desktop";
      renderResidentTickets();
      this.switchView("viewResidentDesk", "Layanan Warga", false);
    } else if (role === "ADMIN") {
      const b = document.getElementById("btnRoleAdmin");
      if (b) b.classList.add("active");
      if (roleBadge) roleBadge.innerText = "Admin Estate";
      if (dock) dock.style.display = "none";
      if (canvas) canvas.classList.add("mode-desktop");
      if (deviceToggleBtn) deviceToggleBtn.innerText = "Mode Mobile Frame";
      renderAdminDesk();
      this.switchView("viewAdminMaster", "Master Desk", false);
    }

    this.showToast(`Beralih ke Skenario: ${role === "BUYER" ? "Calon Pembeli" : role === "RESIDENT" ? "Warga Penghuni" : "Pengelola Perumahan"}`);
  }

  updateBottomTabs(screenId) {
    document.querySelectorAll(".nav-tab-action").forEach(tab => tab.classList.remove("active"));
    if (screenId === "viewCatalog" || screenId === "viewUnitDetail") {
      const t = document.getElementById("tabCatalog");
      if (t) t.classList.add("active");
    } else if (screenId === "viewGuideChecklist") {
      const t = document.getElementById("tabGuide");
      if (t) t.classList.add("active");
    } else if (screenId === "viewInAppChat") {
      const t = document.getElementById("tabChat");
      if (t) t.classList.add("active");
    } else if (screenId === "viewResidentDesk") {
      const t = document.getElementById("tabResident");
      if (t) t.classList.add("active");
    }
  }

  toggleDesktopMode() {
    const canvas = document.getElementById("deviceCanvas");
    const btn = document.getElementById("btnDeviceToggle");
    canvas.classList.toggle("mode-desktop");
    if (canvas.classList.contains("mode-desktop")) {
      btn.innerText = "Mode Mobile Frame";
    } else {
      btn.innerText = "Mode Desktop";
    }
  }

  toggleCompanionPanel() {
    const deck = document.getElementById("companionDeck");
    const btn = document.getElementById("btnCompanionToggle");
    const isHidden = deck.style.display === "none";
    deck.style.display = isHidden ? "flex" : "none";
    btn.classList.toggle("active-companion", isHidden);
  }

  showToast(msg) {
    const toast = document.getElementById("systemToast");
    const txt = document.getElementById("systemToastText");
    if (toast && txt) {
      txt.innerText = msg;
      
      // Hapus timeout sebelumnya jika ada yang sedang berjalan
      if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
      }
      
      toast.classList.add("is-shown");
      
      // Jeda waktu 5 detik (5000ms) sebelum notifikasi menghilang
      this.toastTimeout = setTimeout(() => {
        toast.classList.remove("is-shown");
      }, 5000);

      // Klik langsung untuk menutup tanpa menunggu 5 detik
      toast.onclick = () => {
        toast.classList.remove("is-shown");
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
      };
    }
  }

  initClock() {
    setInterval(() => {
      const d = new Date();
      const el = document.getElementById("realClock");
      if (el) {
        el.innerText = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      }
    }, 1000);
  }

  resetAllData() {
    if (confirm("Kembalikan seluruh data simulasi, booking, dan tiket ke kondisi awal?")) {
      window.store.reset();
      this.setRole("BUYER");
      this.showToast("Data simulasi di-reset ke kondisi awal");
    }
  }
}

window.app = new AppController();

document.addEventListener("DOMContentLoaded", () => {
  window.app.init();
});
