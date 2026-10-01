/*
  HUNIKU - INTERVIEW COMPANION PANEL & RESEARCH INSTRUMENT MODULE
*/

const SCENARIO_GUIDES = {
  viewCatalog: {
    title: "1. Eksplorasi Katalog & Status Kavling (Calon Pembeli)",
    desc: "Minta responden membuka katalog, memfilter tipe kavling, dan mengamati keterbukaan status ketersediaan (Available, Booked, Sita Bank) serta estimasi cicilan KPR.",
    questions: [
      "Bagaimana pendapat Anda mengenai kartu kavling yang langsung menampilkan rincian sertifikat (SHM/PBG) & estimasi cicilan per bulan?",
      "Apakah label 'Di Sita Bank' yang transparan meningkatkan rasa aman Anda terhadap platform ini?",
      "Apakah filter berbasis tipe unit memudahkan Anda dibanding pencarian teks biasa?"
    ]
  },
  viewUnitDetail: {
    title: "2. Verifikasi Spesifikasi & Lokasi (Calon Pembeli)",
    desc: "Ajak responden memeriksa kelengkapan spesifikasi fisik (fondasi, daya PLN, sumber air) dan denah posisi kavling di dalam blok.",
    questions: [
      "Apakah tabel spesifikasi teknis ala gadget ini membantu Anda menilai kualitas bangunan tanpa harus bertanya berulang kali?",
      "Bagaimana respon Anda terhadap ketersediaan denah posisi kavling di dalam blok perumahan?",
      "Apakah tombol navigasi rute Google Maps terasa membantu rencana survei fisik Anda?"
    ]
  },
  viewGuideChecklist: {
    title: "3. Edukasi Berkas Mandiri (KPR vs Tunai)",
    desc: "Uji apakah responden memahami persyaratan dokumen dan SOP 4 tahap sebelum mendatangi kantor pemasaran atau bank.",
    questions: [
      "Apakah checklist interaktif berkas KPR mempermudah Anda mempersiapkan dokumen mandiri?",
      "Apakah penjelasan alur SOP 4 tahap transaksi tunai memberikan kejelasan tahapan akad?"
    ]
  },
  viewInAppChat: {
    title: "4. Komunikasi In-App Chat (Tanpa WhatsApp)",
    desc: "Uji pengalaman calon pembeli berkonsultasi langsung di dalam aplikasi dengan kartu booking dan rincian unit tersemat otomatis.",
    questions: [
      "Bagaimana perasaan Anda ketika dapat berkonsultasi langsung di dalam aplikasi tanpa terlempar ke WhatsApp pribadi?",
      "Apakah penyematan otomatis Kartu Kode Booking memudahkan percakapan dengan perwakilan resmi pengembang?",
      "Apakah tombol saran cepat (Quick-Chips pertanyaan) mempercepat konsultasi Anda?"
    ]
  },
  viewResidentDesk: {
    title: "5. Layanan Pengaduan & Masa Retensi (Penghuni)",
    desc: "Minta responden bersimulasi sebagai warga yang melaporkan atap bocor atau kran rusak, lalu memantau linimasa perbaikan bergaransi.",
    questions: [
      "Apakah formulir satu layar dengan autofill data kavling terasa praktis saat terjadi kendala darurat?",
      "Bagaimana respon Anda terhadap linimasa progres 3 tahap (Dilaporkan ➔ Pengerjaan ➔ Selesai BAP)?",
      "Apakah penegasan status Garansi Retensi (Bebas Biaya) memberikan ketenangan bagi pemilik rumah baru?"
    ]
  },
  viewAdminMaster: {
    title: "6. Tata Kelola Inventaris & Tiket (Pengelola Developer)",
    desc: "Simulasikan peran sebagai admin kantor pemasaran yang memperbarui status ketersediaan kavling dan mendisposisikan tiket teknisi.",
    questions: [
      "Apakah kemudahan mengubah status unit seketika (Available / Booked / Sita Bank) membantu operasional kantor pemasaran?",
      "Apakah antrean tiket komplain warga yang terintegrasi mempermudah pengawasan mandor lapangan?"
    ]
  }
};

function syncInterviewGuide(screenId) {
  const guide = SCENARIO_GUIDES[screenId] || SCENARIO_GUIDES.viewCatalog;
  const titleEl = document.getElementById("guideStepTitle");
  const descEl = document.getElementById("guideStepDesc");
  const listEl = document.getElementById("evalQuestionsList");

  if (titleEl) titleEl.innerText = guide.title;
  if (descEl) descEl.innerText = guide.desc;

  if (listEl) {
    listEl.innerHTML = "";
    guide.questions.forEach(q => {
      const li = document.createElement("li");
      li.innerHTML = `"${q}"`;
      listEl.appendChild(li);
    });
  }
}

function initInterviewNotes() {
  const notesArea = document.getElementById("interviewerNotesArea");
  if (!notesArea) return;

  notesArea.value = localStorage.getItem("huniku_companion_notes") || "";
  notesArea.addEventListener("input", () => {
    localStorage.setItem("huniku_companion_notes", notesArea.value);
    const st = document.getElementById("notesSavedStatus");
    if (st) st.innerText = "Tersimpan";
  });
}

function copyInterviewNotes() {
  const notesArea = document.getElementById("interviewerNotesArea");
  if (!notesArea || !notesArea.value.trim()) {
    alert("Catatan wawancara masih kosong.");
    return;
  }
  navigator.clipboard.writeText(notesArea.value).then(() => {
    window.app.showToast("Catatan wawancara disalin ke clipboard");
  });
}

function exportInterviewNotes() {
  const notesArea = document.getElementById("interviewerNotesArea");
  if (!notesArea || !notesArea.value.trim()) {
    alert("Catatan wawancara masih kosong.");
    return;
  }

  const content = `NOTULENSI RISALAH WAWANCARA LAPANGAN - HUNIKU LAMPUNG\nTanggal: ${new Date().toLocaleDateString('id-ID')}\n----------------------------------------------------\n\n` + notesArea.value;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Notulensi_Wawancara_Huniku_${Date.now()}.txt`;
  a.click();
  window.app.showToast("File notulensi berhasil diunduh");
}
