const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'assets', 'proposal_docx_images');
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

function startServer(port = 3399) {
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
  const server = await startServer(3399);
  const browser = await puppeteer.launch({
    executablePath: BRAVE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1200']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3399/index.html', { waitUntil: 'networkidle0' });

  // CSS Global overrides for clean unclipped captures
  await page.addStyleTag({
    content: `
      .studio-bar { display: none !important; }
      #companionDeck { display: none !important; }
      .system-toast-alert { display: none !important; opacity: 0 !important; }
      .workspace-stage { padding: 16px !important; margin: 0 auto !important; }

      /* Mobile shell visual elevation */
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
      console.log(`[SUCCESS] Captured: ${filename}`);
    } else {
      console.error(`[ERROR] Element ${selector} not found for ${filename}`);
    }
  }

  console.log('\n=== CAPTURING 16 IMAGES FOR PROPOSAL DOCX ===');

  // 1. image5.png (Gambar 2.3 Antarmuka Welcome Splash Huniku)
  await page.evaluate(() => {
    const auth = document.getElementById('authContainer');
    if (auth) auth.style.display = 'block';
    showAuthScreen('viewAuthWelcome');
  });
  await captureElement('.mobile-shell', 'image5.png');

  // 2. image6.png (Gambar 2.4 Antarmuka Login Multi-Peran)
  await page.evaluate(() => {
    showAuthScreen('viewAuthLogin');
  });
  await captureElement('.mobile-shell', 'image6.png');

  // 3. image7.png (Gambar 2.5 Formulir Registrasi Buyer (KYC))
  await page.evaluate(() => {
    showAuthScreen('viewAuthRegister');
    fillRegisterDemoBuyer();
  });
  await captureElement('.mobile-shell', 'image7.png');

  // 4. image8.png (Gambar 2.6 Formulir Registrasi Warga Hunian)
  await page.evaluate(() => {
    showAuthScreen('viewAuthRegister');
    fillRegisterDemoResident();
  });
  await captureElement('.mobile-shell', 'image8.png');

  // Masuk sebagai Calon Pembeli Terverifikasi (Rizky Pratama)
  await page.evaluate(() => {
    loginAsDemoBuyer();
  });
  await new Promise(r => setTimeout(r, 300));

  // 5. image9.png (Gambar 2.7 Beranda Eksplorasi Multi-Kawasan)
  await page.evaluate(() => {
    window.app.setRole('BUYER');
    window.app.switchView('viewCatalog', 'Katalog Kavling', false);
    const scroll = document.getElementById('appScrollViewport');
    if (scroll) scroll.scrollTop = 0;
  });
  await captureElement('.mobile-shell', 'image9.png');

  // 6. image10.png (Gambar 2.8 Denah Tapak Interaktif 3 Warna)
  await page.evaluate(() => {
    window.app.switchView('viewCatalog', 'Katalog Kavling', false);
    const circles = document.querySelectorAll('.cat-circle-item');
    const siteBtn = circles[circles.length - 1];
    if (typeof toggleSitePlanFromCircle === 'function') {
      toggleSitePlanFromCircle(siteBtn);
    }
    const scroll = document.getElementById('appScrollViewport');
    if (scroll) scroll.scrollTop = 380;
  });
  await captureElement('.mobile-shell', 'image10.png');

  // 7. image11.png (Gambar 2.9 Informasi Detail & Spesifikasi Kavling)
  await page.evaluate(() => {
    openUnitDetail('unit-1');
    const scroll = document.getElementById('appScrollViewport');
    if (scroll) scroll.scrollTop = 0;
  });
  await captureElement('.mobile-shell', 'image11.png');

  // 8. image12.png (Gambar 2.10 Formulir Pemesanan Unit In-App)
  await page.addStyleTag({
    content: `
      #bookingModalOverlay {
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
      #bookingModalOverlay .sheet-card {
        width: 95% !important;
        transform: scale(0.82) !important;
        transform-origin: center center !important;
        overflow: visible !important;
        padding: 14px 12px !important;
        border-radius: 20px !important;
      }
    `
  });
  await page.evaluate(() => {
    const modal = document.getElementById('bookingModalOverlay');
    if (modal) modal.style.display = 'flex';
    proceedOpenBookingForm(window.store.units[0]);
  });
  await captureElement('.mobile-shell', 'image12.png');

  // 9. image13.png (Gambar 2.11 Tiket Tanda Booking Ber-barcode)
  await page.evaluate(() => {
    const prog = document.getElementById('modalLockingProgress');
    const form = document.getElementById('modalFormBlock');
    const succ = document.getElementById('modalSuccessBlock');
    if (prog) prog.style.display = 'none';
    if (form) form.style.display = 'none';
    if (succ) succ.style.display = 'block';
    const passCode = document.getElementById('passCodeDisplay');
    const passDet = document.getElementById('passDetailDisplay');
    if (passCode) passCode.innerText = 'BKG-20261001-A01';
    if (passDet) passDet.innerText = 'Grand Alessandra - Blok A-01 • KPR';
  });
  await captureElement('.mobile-shell', 'image13.png');
  await page.evaluate(() => {
    closeBookingDialog();
  });

  // 10. image14.png (Gambar 2.12 Panduan Kelengkapan Berkas KPR/Cash)
  await page.evaluate(() => {
    window.app.switchView('viewGuideChecklist', 'Panduan Berkas', false);
    const scroll = document.getElementById('appScrollViewport');
    if (scroll) scroll.scrollTop = 0;
  });
  await captureElement('.mobile-shell', 'image14.png');

  // 11. image15.png (Gambar 2.13 Saluran Chat CS & Konsultasi)
  await page.evaluate(() => {
    window.app.switchView('viewInAppChat', 'Obrolan Agen Resmi', true);
    window.store.activeChatType = 'BUYER';
    if (typeof renderChatMessages === 'function') {
      renderChatMessages();
    }
  });
  await captureElement('.mobile-shell', 'image15.png');

  // 12. image16.png (Gambar 2.14 Dashboard Portal Layanan Penghuni)
  await page.evaluate(() => {
    loginAsDemoResident();
    window.app.switchView('viewResidentDesk', 'Layanan Warga', false);
    const scroll = document.getElementById('appScrollViewport');
    if (scroll) scroll.scrollTop = 0;
  });
  await captureElement('.mobile-shell', 'image16.png');

  // 13. image17.png (Gambar 2.15 Formulir Lapor Kerusakan Bergaransi)
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
  await captureElement('.mobile-shell', 'image17.png');
  await page.evaluate(() => {
    closeComplaintModal();
  });

  // --- DESKTOP IMAGES ---
  await page.evaluate(() => {
    window.app.setRole('ADMIN');
  });
  await new Promise(r => setTimeout(r, 400));

  // 14. image18.png (Gambar 2.16 Konsol Master Pengembang & Metrik Penjualan)
  await page.evaluate(() => {
    switchAdminTab('inventory');
  });
  await captureElement('.admin-workspace-wrap', 'image18.png');

  // 15. image19.png (Gambar 2.17 Pengelolaan Data Kavling & Modal Tambah Unit)
  await page.evaluate(() => {
    openAddUnitModal();
  });
  await new Promise(r => setTimeout(r, 300));
  await captureElement('#adminAddUnitModal .admin-modal-card', 'image19.png');
  await page.evaluate(() => {
    closeAddUnitModal();
  });

  // 16. image20.png (Gambar 2.18 Berita Acara Perbaikan (BAP) Digital & Timeline)
  await page.evaluate(() => {
    openBapModal('TKT-2026-088');
  });
  await new Promise(r => setTimeout(r, 300));
  await captureElement('#adminBapModal .admin-modal-card', 'image20.png');
  await page.evaluate(() => {
    closeBapModal();
  });

  console.log('\n=== ALL 16 PROPOSAL IMAGES CAPTURED PERFECTLY! ===\n');

  await browser.close();
  server.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
