const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'assets', 'screenshots_proposal');
const BRAVE_PATH = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function startServer(port = 3388) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = decodeURI(req.url.split('?')[0]);
      if (reqPath === '/') reqPath = '/index.html';
      const filePath = path.join(ROOT_DIR, reqPath);

      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function run() {
  const server = await startServer(3388);
  const browser = await puppeteer.launch({
    executablePath: BRAVE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1200']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3388/index.html', { waitUntil: 'networkidle0' });

  // CSS Global overrides for clean, unclipped proposal captures
  await page.addStyleTag({
    content: `
      .studio-bar { display: none !important; }
      #companionDeck { display: none !important; }
      .system-toast-alert { display: none !important; opacity: 0 !important; }
      .workspace-stage { padding: 16px !important; margin: 0 auto !important; }

      /* Make mobile shell crisp and clean */
      .mobile-shell {
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35) !important;
      }

      /* Desktop full width expansion */
      .device-canvas.mode-desktop .mobile-shell {
        max-width: 1320px !important;
        width: 1320px !important;
        height: auto !important;
        min-height: 840px !important;
        border-radius: 12px !important;
        overflow: visible !important;
      }
      .device-canvas.mode-desktop .screen-surface {
        height: auto !important;
        min-height: 840px !important;
        overflow: visible !important;
      }
      .admin-workspace-wrap {
        min-height: 840px !important;
      }
      .device-canvas.mode-desktop #appScrollViewport {
        height: auto !important;
        overflow: visible !important;
      }
    `
  });

  async function captureElement(selector, filename) {
    await new Promise(r => setTimeout(r, 450));
    const el = await page.$(selector);
    if (el) {
      const targetPath = path.join(OUTPUT_DIR, filename);
      await el.screenshot({ path: targetPath });
      console.log(`[SUCCESS] Saved: ${filename}`);
    } else {
      console.error(`[ERROR] Element ${selector} not found for ${filename}`);
    }
  }

  console.log('\n=== 1. CAPTURING MOBILE LAYOUTS (FULL HP MOCKUP) ===');

  // --- Gambar 2.09: Layar Welcome Splash ---
  await page.evaluate(() => {
    const auth = document.getElementById('authContainer');
    if (auth) auth.style.display = 'block';
    showAuthScreen('viewAuthWelcome');
  });
  await captureElement('.mobile-shell', 'Gambar_2.09_Layar_Welcome_Splash.png');

  // --- Gambar 2.10: Layar Login Demo Picker ---
  await page.evaluate(() => {
    showAuthScreen('viewAuthLogin');
  });
  await captureElement('.mobile-shell', 'Gambar_2.10_Layar_Login_Akses_Cepat.png');

  // Masuk sebagai Calon Pembeli Terverifikasi (Rizky Pratama)
  await page.evaluate(() => {
    loginAsDemoBuyer();
  });
  await new Promise(r => setTimeout(r, 300));

  // --- Gambar 2.11: Katalog Kavling (Buyer) ---
  await page.evaluate(() => {
    window.app.setRole('BUYER');
    window.app.switchView('viewCatalog', 'Katalog Kavling', false);
    const scroll = document.getElementById('appScrollViewport');
    if (scroll) scroll.scrollTop = 0;
  });
  await captureElement('.mobile-shell', 'Gambar_2.11_Katalog_Kavling_Buyer.png');

  // --- Gambar 2.12: Detail Spesifikasi Unit ---
  await page.evaluate(() => {
    openUnitDetail('unit-1');
    const scroll = document.getElementById('appScrollViewport');
    if (scroll) scroll.scrollTop = 0;
  });
  await captureElement('.mobile-shell', 'Gambar_2.12_Detail_Spesifikasi_Unit.png');

  // --- Gambar 2.13: Saluran Chat CS & Konsultasi Resmi ---
  await page.evaluate(() => {
    window.app.switchView('viewInAppChat', 'Obrolan Agen Resmi', true);
    window.store.activeChatType = 'BUYER';
    if (typeof renderChatMessages === 'function') {
      renderChatMessages();
    }
  });
  await captureElement('.mobile-shell', 'Gambar_2.13_Saluran_Chat_CS.png');

  // --- Gambar 2.14: Dashboard Portal Layanan Penghuni ---
  await page.evaluate(() => {
    loginAsDemoResident();
    window.app.switchView('viewResidentDesk', 'Layanan Warga', false);
    const scroll = document.getElementById('appScrollViewport');
    if (scroll) scroll.scrollTop = 0;
  });
  await captureElement('.mobile-shell', 'Gambar_2.14_Dashboard_Portal_Layanan_Penghuni.png');

  // --- Gambar 2.15: Formulir Lapor Kerusakan Bergaransi (Full HP Mockup) ---
  await page.addStyleTag({
    content: `
      #complaintModalOverlay {
        position: absolute !important;
        inset: 0 !important;
        border-radius: 32px !important;
        overflow: hidden !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: rgba(15, 23, 42, 0.65) !important;
        backdrop-filter: blur(4px) !important;
      }
      .complaint-modal-card {
        width: 95% !important;
        transform: scale(0.79) !important;
        transform-origin: center center !important;
        overflow: visible !important;
        padding: 14px 12px !important;
        border-radius: 20px !important;
        border: 1px solid rgba(255,255,255,0.4) !important;
      }
      .category-chips-matrix {
        grid-template-columns: 1fr 1fr !important;
        gap: 5px !important;
      }
      .chip-selector-btn {
        padding: 6px 8px !important;
        font-size: 0.64rem !important;
      }
      .form-field-unit {
        margin-bottom: 6px !important;
      }
      .form-field-unit label {
        font-size: 0.66rem !important;
        margin-bottom: 3px !important;
      }
      .visit-pref-chips {
        gap: 4px !important;
      }
      .visit-chip {
        padding: 5px 3px !important;
        font-size: 0.62rem !important;
      }
    `
  });

  await page.evaluate(() => {
    openComplaintModal();
  });
  await captureElement('.mobile-shell', 'Gambar_2.15_Formulir_Lapor_Kerusakan.png');
  await captureElement('#complaintModalOverlay .complaint-modal-card', 'Gambar_2.15b_Card_Formulir_Lapor_Kerusakan.png');

  // Close complaint modal
  await page.evaluate(() => {
    closeComplaintModal();
  });

  console.log('\n=== 2. CAPTURING DESKTOP LAYOUTS (FULL DESKTOP, NO CUTOFF) ===');

  // Switch to ADMIN Desk
  await page.evaluate(() => {
    window.app.setRole('ADMIN');
  });
  await new Promise(r => setTimeout(r, 400));

  // --- Gambar 2.16: Konsol Master Pengembang & Metrik Penjualan ---
  await page.evaluate(() => {
    switchAdminTab('inventory');
  });
  await captureElement('.admin-workspace-wrap', 'Gambar_2.16_Konsol_Master_Pengembang_Desktop.png');

  // --- Gambar 2.17: Modal Tambah Unit Kavling Baru (Full Modal) ---
  await page.evaluate(() => {
    openAddUnitModal();
  });
  await new Promise(r => setTimeout(r, 300));
  await captureElement('#adminAddUnitModal .admin-modal-card', 'Gambar_2.17_Modal_Tambah_Unit_Kavling.png');
  await page.evaluate(() => {
    closeAddUnitModal();
  });

  // --- Gambar 2.18: Modal Berita Acara Pengerjaan (BAP) (Full Modal) ---
  await page.evaluate(() => {
    openBapModal('TKT-2026-088');
  });
  await new Promise(r => setTimeout(r, 300));
  await captureElement('#adminBapModal .admin-modal-card', 'Gambar_2.18_Modal_Berita_Acara_Pengerjaan_BAP.png');
  await page.evaluate(() => {
    closeBapModal();
  });

  // --- Gambar 2.19: Site Plan Denah Peta Interaktif Kavling ---
  await page.evaluate(() => {
    switchAdminTab('siteplan');
  });
  await captureElement('.admin-workspace-wrap', 'Gambar_2.19_Site_Plan_Denah_Kavling_Desktop.png');

  // --- Gambar 2.20: Antrean Verifikasi Berkas Booking KPR ---
  await page.evaluate(() => {
    switchAdminTab('booking');
  });
  await captureElement('.admin-workspace-wrap', 'Gambar_2.20_Antrean_Verifikasi_Berkas_KPR_Desktop.png');

  // --- Gambar 2.21: Disposisi Teknisi & Rekam Layanan Komplain ---
  await page.evaluate(() => {
    switchAdminTab('tickets');
  });
  await captureElement('.admin-workspace-wrap', 'Gambar_2.21_Disposisi_Teknisi_Admin_Desktop.png');

  console.log('\n=== ALL SCREENSHOTS SUCCESSFULLY CAPTURED! ===\n');

  await browser.close();
  server.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
