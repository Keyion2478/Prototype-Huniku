/*
  HUNIKU - STORE & PERSISTENT STATE MANAGEMENT
  Spec-aligned with Proposal PjBL & PRD:
  - Multi-Project Grouping (3 Housing Projects in Lampung: Grand Alessandra, Sentral Garden, Villa Permata Indah)
  - 3 Color Statuses (Green AVAILABLE, Yellow BOOKED/HOLD, White/Red SOLD, Special Badge DI_SITA_BANK)
  - Buyer Profile KYC for Banking Ready Autofill (Name, WA, Domicile, Occupation, Age, Income)
  - Real-Time Mutex Locking & Audit Trail
*/

const DEFAULT_PROJECTS = [
  {
    id: "ALL",
    name: "Semua Kawasan",
    developer: "Mitra Pengembang Terverifikasi Huniku",
    region: "Bandar Lampung & Sekitarnya",
    totalUnits: 70,
    availableUnits: 38,
    tagline: "Eksplorasi 3 Kawasan Perumahan Unggulan Terintegrasi"
  },
  {
    id: "grand-alessandra",
    name: "Grand Alessandra Residence",
    developer: "Siger Property Group",
    region: "Sukarame, Bandar Lampung",
    totalUnits: 28,
    availableUnits: 14,
    tagline: "Hunian Tropis Modern Dekat Kampus UIN & ITERA",
    coords: "-5.3821, 105.2954",
    mapsUrl: "https://maps.google.com/?q=-5.3821,105.2954"
  },
  {
    id: "sentral-garden",
    name: "Sentral Garden Residence",
    developer: "Siger Property Group",
    region: "Natar, Lampung Selatan",
    totalUnits: 24,
    availableUnits: 12,
    tagline: "Kawasan Asri Bebas Banjir, 10 Menit ke Bandara Radin Inten II",
    coords: "-5.3211, 105.2104",
    mapsUrl: "https://maps.google.com/?q=-5.3211,105.2104"
  },
  {
    id: "villa-permata",
    name: "Villa Permata Indah",
    developer: "Siger Property Group",
    region: "Kedaton, Bandar Lampung",
    totalUnits: 18,
    availableUnits: 7,
    tagline: "Akses Eksklusif Pusat Kota & Sentra Niaga Kedaton",
    coords: "-5.3789, 105.2530",
    mapsUrl: "https://maps.google.com/?q=-5.3789,105.2530"
  }
];

const DEFAULT_BUYER_PROFILE = {
  fullName: "Rizky Pratama",
  phone: "0812-7890-1234",
  domicile: "Sukarame, Bandar Lampung",
  occupation: "Karyawan Swasta",
  age: 29,
  monthlyIncome: 7500000,
  maritalStatus: "Menikah (1 Anak)",
  residentUnit: "Kavling Blok B-05",
  residentCluster: "Sentral Garden Residence",
  warrantyDaysLeft: 142
};

const DEFAULT_UNITS = [
  {
    id: "unit-1",
    code: "BLOK A-01",
    projectId: "grand-alessandra",
    cluster: "Grand Alessandra Residence",
    region: "Sukarame, Bandar Lampung",
    type: "Tipe 45 / 90",
    price: "Rp 385.000.000",
    rawPrice: 385000000,
    lb: 45,
    lt: 90,
    rooms: "2 KT / 1 KM",
    foundation: "Batu Belah & Beton Bertulang",
    utility: "PLN 1300 VA & Sumur Bor 32m",
    legal: "SHM & PBG Lengkap",
    status: "AVAILABLE",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80"
    ],
    desc: "Rumah tunggal bernuansa tropis modern dengan plafon tinggi 3.6m untuk sirkulasi udara alami. Jalan perumahan aspal hotmix row 8 meter, sistem keamanan one gate system 24 jam dengan CCTV kawasan.",
    financingRules: {
      banks: ["Bank BTN", "Bank Mandiri", "BSI Syariah"],
      promoDp: "Promo DP 0% (Subsidi Pengembang)",
      minIncome: "Rp 7.500.000 / bln (Bisa Joint Income Suami-Istri)",
      cashDiscount: "Diskon Cash Keras Rp 25.000.000",
      inhouseTenor: "In-House Developer 12–18 Bulan (Tanpa Bunga)",
      notes: "Free Biaya Notaris (AJB) & PPN 100% Ditanggung Pemerintah."
    }
  },
  {
    id: "unit-2",
    code: "BLOK B-04",
    projectId: "grand-alessandra",
    cluster: "Grand Alessandra Residence",
    region: "Sukarame, Bandar Lampung",
    type: "Tipe 36 / 78",
    price: "Rp 320.000.000",
    rawPrice: 320000000,
    lb: 36,
    lt: 78,
    rooms: "2 KT / 1 KM",
    foundation: "Batu Belah & Rangka Baja Ringan",
    utility: "PLN 1300 VA & Sumur Bor",
    legal: "SHM Pecah Per Kavling",
    status: "AVAILABLE",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"
    ],
    desc: "Pilihan tepat untuk keluarga muda. Halaman belakang luas 3.5 meter siap untuk perluasan dapur atau taman pribadi. Akses 7 menit dari Kampus UIN Raden Intan Lampung.",
    financingRules: {
      banks: ["Bank BTN", "BSI Syariah"],
      promoDp: "Promo DP 5% (Bisa Dicicil 3x)",
      minIncome: "Rp 6.000.000 / bln",
      cashDiscount: "Diskon Cash Keras Rp 18.000.000",
      inhouseTenor: "In-House 12 Bulan (DP 30%)",
      notes: "Bonus Hadiah Langsung 1 Unit AC 1/2 PK & Tandon Air 500L."
    }
  },
  {
    id: "unit-3",
    code: "BLOK C-12",
    projectId: "villa-permata",
    cluster: "Villa Permata Indah",
    region: "Kedaton, Bandar Lampung",
    type: "Tipe 54 / 105",
    price: "Rp 490.000.000",
    rawPrice: 490000000,
    lb: 54,
    lt: 105,
    rooms: "3 KT / 2 KM",
    foundation: "Beton Cakar Ayam & Dinding Bata Merah",
    utility: "PLN 2200 VA & Sumur Bor",
    legal: "SHM & PBG Siap Akad",
    status: "BOOKED",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80"
    ],
    desc: "Unit sudut (hook) dengan pencahayaan alami optimal di kawasan premium Kedaton. Saat ini dalam proses verifikasi berkas KPR oleh analis bank rekanan.",
    financingRules: {
      banks: ["Bank Mandiri", "Bank BTN Prioritas", "BCA"],
      promoDp: "DP 10% Siap Huni",
      minIncome: "Rp 11.000.000 / bln",
      cashDiscount: "Diskon Spesial Kavling Hook Rp 35.000.000",
      inhouseTenor: "In-House Bertahap Hingga 24 Bulan",
      notes: "Lokasi strategis tengah kota Kedaton, berkas sertifikat SHM & PBG siap balik nama di PPAT."
    }
  },
  {
    id: "unit-4",
    code: "BLOK D-09",
    projectId: "sentral-garden",
    cluster: "Sentral Garden Residence",
    region: "Natar, Lampung Selatan",
    type: "Tipe 36 / 72",
    price: "Rp 235.000.000",
    rawPrice: 235000000,
    lb: 36,
    lt: 72,
    rooms: "2 KT / 1 KM",
    foundation: "Batu Kali",
    utility: "PLN 1300 VA & PDAM",
    legal: "Agunan Bank - Sita Eksekusi",
    status: "DI_SITA_BANK",
    image: "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&q=80",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80"
    ],
    desc: "Unit agunan kredit macet debitur lama dalam sengketa hukum perbankan. Akses pemesanan dinonaktifkan sistem untuk perlindungan hukum calon pembeli.",
    financingRules: {
      banks: ["Tidak Tersedia"],
      promoDp: "N/A - Transaksi Dibekukan",
      minIncome: "N/A",
      cashDiscount: "N/A",
      inhouseTenor: "N/A",
      notes: "Unit agunan dalam perkara Sita Eksekusi Pengadilan Negeri Tanjung Karang No. 44/Pdt.Eks/2025/PN.Tjk. Pengajuan kredit tidak dapat diproses."
    }
  },
  {
    id: "unit-5",
    code: "BLOK B-02",
    projectId: "sentral-garden",
    cluster: "Sentral Garden Residence",
    region: "Natar, Lampung Selatan",
    type: "Tipe 45 / 84",
    price: "Rp 280.000.000",
    rawPrice: 280000000,
    lb: 45,
    lt: 84,
    rooms: "2 KT / 1 KM",
    foundation: "Batu Belah & Bata Ringan",
    utility: "PLN 1300 VA & PDAM",
    legal: "SHM Split Murni",
    status: "AVAILABLE",
    image: "https://images.unsplash.com/photo-1598228723793-52759bba239c?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1598228723793-52759bba239c?w=800&q=80"
    ],
    desc: "Hunian asri bebas banjir dengan akses cepat ke Bandara Radin Inten II dan Stasiun Rejosari Natar.",
    financingRules: {
      banks: ["Bank BTN Syariah", "BSI", "Bank Lampung"],
      promoDp: "DP Rp 0,- Cukup Booking Fee Rp 2 Juta",
      minIncome: "Rp 4.500.000 / bln (Terbuka Wiraswasta & UMKM)",
      cashDiscount: "Diskon Cash Keras Rp 15.000.000",
      inhouseTenor: "In-House Syariah 24 Bulan Tanpa Riba",
      notes: "Program Pembiayaan Syariah Mandiri, angsuran tetap (fixed) hingga lunas."
    }
  },
  {
    id: "unit-6",
    code: "BLOK A-05",
    projectId: "grand-alessandra",
    cluster: "Grand Alessandra Residence",
    region: "Sukarame, Bandar Lampung",
    type: "Tipe 54 / 108",
    price: "Rp 465.000.000",
    rawPrice: 465000000,
    lb: 54,
    lt: 108,
    rooms: "3 KT / 2 KM",
    foundation: "Beton Bertulang & Bata Merah",
    utility: "PLN 2200 VA & Sumur Bor",
    legal: "SHM & PBG Selesai Balik Nama",
    status: "SOLD",
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80"
    ],
    desc: "Unit kavling hadap timur dengan halaman asri. Telah resmi diserahterimakan (BAST selesai) dan saat ini dihuni oleh pemilik aset.",
    financingRules: {
      banks: ["Bank BTN"],
      promoDp: "Unit Telah Terjual (Sold Out)",
      minIncome: "N/A",
      cashDiscount: "N/A",
      inhouseTenor: "N/A",
      notes: "Unit berstatus Sold Out. Sedang dalam masa retensi garansi developer 180 hari."
    }
  },
  {
    id: "unit-7",
    code: "BLOK C-03",
    projectId: "sentral-garden",
    cluster: "Sentral Garden Residence",
    region: "Natar, Lampung Selatan",
    type: "Tipe 36 / 72",
    price: "Rp 225.000.000",
    rawPrice: 225000000,
    lb: 36,
    lt: 72,
    rooms: "2 KT / 1 KM",
    foundation: "Batu Kali & Rangka Baja",
    utility: "PLN 1300 VA & PDAM",
    legal: "SHM Siap Akad",
    status: "AVAILABLE",
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80"
    ],
    desc: "Unit siap huni dengan fasilitas taman depan minimalis, lingkungan tetangga ramah keluarga, dan jalan paving block lebar.",
    financingRules: {
      banks: ["Bank BTN", "Bank Mandiri", "BSI"],
      promoDp: "DP 0% Subsidi FLPP",
      minIncome: "Rp 3.800.000 / bln",
      cashDiscount: "Diskon Cash Rp 12.000.000",
      inhouseTenor: "In-House 12 Bulan",
      notes: "Sangat cocok untuk first-time buyer program KPR FLPP Tapera."
    }
  },
  {
    id: "unit-8",
    code: "BLOK B-08",
    projectId: "villa-permata",
    cluster: "Villa Permata Indah",
    region: "Kedaton, Bandar Lampung",
    type: "Tipe 45 / 90",
    price: "Rp 410.000.000",
    rawPrice: 410000000,
    lb: 45,
    lt: 90,
    rooms: "2 KT / 1 KM",
    foundation: "Batu Belah & Pasangan Bata Merah",
    utility: "PLN 1300 VA & Sumur Bor",
    legal: "SHM Split Murni",
    status: "AVAILABLE",
    image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80"
    ],
    desc: "Lokasi premium di jantung Kedaton. 5 menit ke Mall Boemi Kedaton (MBK) dan Rumah Sakit Advent.",
    financingRules: {
      banks: ["Bank Mandiri", "BCA", "BTN Prioritas"],
      promoDp: "Promo DP Ringan 5%",
      minIncome: "Rp 8.000.000 / bln",
      cashDiscount: "Diskon Cash Keras Rp 20.000.000",
      inhouseTenor: "In-House Bertahap 18 Bulan",
      notes: "Unit favorit di kawasan Kedaton dengan nilai apresiasi investasi tinggi."
    }
  }
];

const DEFAULT_COMPLAINTS = [
  {
    id: "TKT-2026-088",
    unit: "BLOK B-05",
    residentName: "Rizky Pratama",
    category: "AIR",
    notes: "Saluran pipa kran cuci piring rembes air di bawah meja wastafel.",
    date: "28 Sep 2026",
    status: "RESOLVED",
    warranty: "GARANSI_RETENSI",
    resolution: "Pipa sambungan diganti baru oleh teknisi Mas Joko. Bebas biaya (masa retensi developer 180 hari)."
  },
  {
    id: "TKT-2026-089",
    unit: "BLOK B-05",
    residentName: "Rizky Pratama",
    category: "BANGUNAN",
    notes: "Retak rambut pada plamir plafon teras depan setelah hujan deras.",
    date: "30 Sep 2026",
    status: "IN_PROGRESS",
    warranty: "GARANSI_RETENSI",
    resolution: "Teknisi Mas Yanto dijadwalkan inspeksi lapangan dan pelapisan ulang."
  }
];

const DEFAULT_AUDIT_LOGS = [
  {
    id: "LOG-101",
    time: "10:05 WIB",
    date: "01 Okt 2026",
    action: "STATUS_UPDATE",
    target: "Kavling BLOK A-01",
    actor: "Admin Pemasaran (Sdr. Doni)",
    detail: "Status kavling diubah dari AVAILABLE menjadi BOOKED (Hold 15 menit via In-App Mutex Lock).",
    badge: "BOOKED"
  },
  {
    id: "LOG-102",
    time: "09:48 WIB",
    date: "01 Okt 2026",
    action: "TICKET_NEW",
    target: "Tiket TKT-2026-089",
    actor: "Warga (Rizky Pratama Blok B-05)",
    detail: "Pelaporan kendala retak rambut plafon teras depan. Masuk antrean pemeliharaan retensi garansi.",
    badge: "PENDING"
  },
  {
    id: "LOG-103",
    time: "09:15 WIB",
    date: "01 Okt 2026",
    action: "DISPATCH_TEKNISI",
    target: "Tiket TKT-2026-088",
    actor: "Koordinator Estate (Bpk. Hendra)",
    detail: "Disposisi teknisi Mas Joko untuk perbaikan kran cuci piring. Selesai (BAP OK).",
    badge: "RESOLVED"
  },
  {
    id: "LOG-104",
    time: "08:30 WIB",
    date: "30 Sep 2026",
    action: "PRICE_UPDATE",
    target: "Kavling BLOK C-12",
    actor: "Direktur Marketing (Bpk. Irfan)",
    detail: "Penetapan promo diskon cash keras kavling hook Rp 35.000.000.",
    badge: "PROMO"
  }
];

class AppStore {
  constructor() {
    this.role = "BUYER";
    this.currentScreen = "viewCatalog";
    this.activeFilter = "ALL";
    this.activeProjectId = "ALL";
    this.activeUnit = null;
    this.selectedScheme = "KPR";
    this.catalogViewMode = "GRID"; // "GRID" or "SITEPLAN"
    this.projects = DEFAULT_PROJECTS;
    
    // Buyer KYC profile
    this.buyerProfile = JSON.parse(localStorage.getItem("huniku_store_buyer_profile")) || JSON.parse(JSON.stringify(DEFAULT_BUYER_PROFILE));

    this.latestBooking = JSON.parse(localStorage.getItem("huniku_store_booking")) || null;
    this.auditLogs = JSON.parse(localStorage.getItem("huniku_store_logs")) || DEFAULT_AUDIT_LOGS;

    // Load units and sync financingRules
    const savedUnits = JSON.parse(localStorage.getItem("huniku_store_units"));
    if (savedUnits && savedUnits.length) {
      this.units = savedUnits.map(u => {
        const def = DEFAULT_UNITS.find(d => d.id === u.id);
        return def ? { ...def, status: u.status } : u;
      });
      // If any new units exist in DEFAULT_UNITS not in savedUnits, append them
      DEFAULT_UNITS.forEach(du => {
        if (!this.units.some(u => u.id === du.id)) {
          this.units.push(du);
        }
      });
    } else {
      this.units = JSON.parse(JSON.stringify(DEFAULT_UNITS));
    }

    this.complaints = JSON.parse(localStorage.getItem("huniku_store_complaints")) || DEFAULT_COMPLAINTS;
    if (this.complaints && this.complaints.length) {
      const activeName = (this.buyerProfile && this.buyerProfile.fullName) ? this.buyerProfile.fullName : "Rizky Pratama";
      this.complaints.forEach(c => {
        if (c.residentName === "Ibu Ratna" || !c.residentName) {
          c.residentName = activeName;
        }
      });
    }

    this.chatHistory = [
      {
        sender: "agent",
        text: "Halo Bapak/Ibu! Selamat datang di Meja Customer Service Resmi Pengembang Huniku Lampung. Silakan tanyakan informasi ketersediaan kavling, harga resmi, atau jadwalkan survei fisik lapangan bersama sales kami.",
        time: "09:42"
      }
    ];
  }

  updateBuyerProfile(data) {
    this.buyerProfile = { ...this.buyerProfile, ...data };
    this.save();
  }

  addAuditLog(action, target, actor, detail, badge = "INFO") {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " WIB";
    const date = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const log = {
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      time: time,
      date: date,
      action: action,
      target: target,
      actor: actor,
      detail: detail,
      badge: badge
    };
    this.auditLogs.unshift(log);
    this.save();
    return log;
  }

  save() {
    localStorage.setItem("huniku_store_units", JSON.stringify(this.units));
    localStorage.setItem("huniku_store_complaints", JSON.stringify(this.complaints));
    localStorage.setItem("huniku_store_booking", JSON.stringify(this.latestBooking));
    localStorage.setItem("huniku_store_logs", JSON.stringify(this.auditLogs));
    localStorage.setItem("huniku_store_buyer_profile", JSON.stringify(this.buyerProfile));
  }

  reset() {
    localStorage.removeItem("huniku_store_units");
    localStorage.removeItem("huniku_store_complaints");
    localStorage.removeItem("huniku_store_booking");
    localStorage.removeItem("huniku_store_logs");
    localStorage.removeItem("huniku_store_buyer_profile");
    this.units = JSON.parse(JSON.stringify(DEFAULT_UNITS));
    this.complaints = JSON.parse(JSON.stringify(DEFAULT_COMPLAINTS));
    this.auditLogs = JSON.parse(JSON.stringify(DEFAULT_AUDIT_LOGS));
    this.buyerProfile = JSON.parse(JSON.stringify(DEFAULT_BUYER_PROFILE));
    this.latestBooking = null;
    this.activeProjectId = "ALL";
    this.activeFilter = "ALL";
    this.save();
  }
}

window.store = new AppStore();
