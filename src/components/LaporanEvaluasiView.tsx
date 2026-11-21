import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCopy,
  FileText,
  Loader2,
  Printer,
  Sparkles,
} from 'lucide-react';
import { GRADE_LABELS, SEMESTER_LABELS } from '../data/smpCurriculum';
import type {
  KisiBlueprint,
  LearningEvaluationReport,
  TPOAchievementItem,
} from '../types/kisiKisi';
import { exportEvaluationReportToWordDoc } from '../utils/exportBlueprint';

export const INITIAL_LEARNING_REPORT: LearningEvaluationReport = {
  id: 'laporan-initial-mat8',
  judulLaporan: 'Laporan Evaluasi Pembelajaran Sumatif Akhir Semester',
  mataPelajaran: 'Matematika',
  kelasLabel: 'Kelas VIII (2 SMP)',
  semesterLabel: 'Semester 1 (Ganjil)',
  namaSekolah: 'SMP Negeri 1 Nusantara',
  tahunAjaran: '2026/2027',
  ringkasanHasilBelajar:
    'Berdasarkan hasil asesmen sumatif semester terhadap 30 peserta didik Kelas VIII pada mata pelajaran Matematika dengan KKTP 75, diperoleh nilai rata-rata kelas sebesar 79,07, median 80,5, simpangan baku 10,77, nilai tertinggi 96, dan nilai terendah 58. Sebanyak 21 peserta didik (70,0%) telah mencapai ketuntasan belajar, sedangkan 9 peserta didik (30,0%) belum mencapai KKTP sehingga memerlukan program remedial terstruktur sebelum melangkah ke kompetensi semester berikutnya.',
  ketercapaianTP: [
    {
      no: 1,
      tujuanPembelajaran:
        'Menyederhanakan operasi bilangan berpangkat bulat positif, negatif, dan bentuk akar sederhana',
      materi: 'Bilangan Berpangkat dan Bentuk Akar',
      tingkatKetercapaian: 'Tercapai Penuh',
      persentaseCapaian: '86%',
      catatanBukti:
        'Mayoritas siswa menguasai sifat perkalian dan pembagian pangkat serta penjumlahan bentuk akar sejenis pada soal C1–C3.',
    },
    {
      no: 2,
      tujuanPembelajaran:
        'Menentukan panjang sisi segitiga siku-siku dan mengidentifikasi tripel Pythagoras pada masalah bangun datar',
      materi: 'Teorema Pythagoras',
      tingkatKetercapaian: 'Tercapai Penuh',
      persentaseCapaian: '82%',
      catatanBukti:
        'Siswa mampu menerapkan rumus kuadrat sisi miring secara tepat, meski sebagian kecil masih kurang teliti pada soal cerita kontekstual.',
    },
    {
      no: 3,
      tujuanPembelajaran:
        'Menentukan gradien garis lurus dan menyusun persamaan garis melalui dua titik atau sejajar/tegak lurus garis lain',
      materi: 'Persamaan Garis Lurus',
      tingkatKetercapaian: 'Tercapai Sebagian',
      persentaseCapaian: '68%',
      catatanBukti:
        'Kesalahan umum terjadi saat menentukan gradien garis yang saling tegak lurus (m1 × m2 = -1) dan mengubah bentuk ax + by + c = 0 ke y = mx + c.',
    },
    {
      no: 4,
      tujuanPembelajaran:
        'Menyelesaikan Sistem Persamaan Linear Dua Variabel (SPLDV) dan memodelkan masalah harga/kuantitas dalam kehidupan sehari-hari',
      materi: 'Sistem Persamaan Linear Dua Variabel (SPLDV)',
      tingkatKetercapaian: 'Belum Tercapai',
      persentaseCapaian: '59%',
      catatanBukti:
        'Peserta didik pada rentang nilai 58–74 masih kesulitan menerjemahkan kalimat cerita menjadi dua model persamaan aljabar dan keliru tanda operasi saat metode eliminasi.',
    },
  ],
  materiDikuasai: [
    {
      materi: 'Sifat Operasi Bilangan Berpangkat & Bentuk Akar',
      alasanBukti:
        'Tingkat ketuntasan indikator mencapai 86%; siswa konsisten menjawab benar pada operasi pangkat dan penyederhanaan akar rutin.',
    },
    {
      materi: 'Penerapan Dasar Teorema Pythagoras',
      alasanBukti:
        'Sebanyak 82% siswa mampu menghitung panjang hipotenusa maupun sisi siku-siku segitiga menggunakan relasi kuadrat.',
    },
    {
      materi: 'Identifikasi Gradien dari Persamaan Eksplisit y = mx + c',
      alasanBukti:
        'Siswa kelompok tuntas dan batas aman sudah lancar membaca koefisien kemiringan langsung dari persamaan linear bentuk baku.',
    },
  ],
  materiPerluDiperbaiki: [
    {
      materi: 'Pemodelan Masalah Kontekstual ke SPLDV',
      alasanBukti:
        'Capaian indikator hanya 59%; siswa kerap tertukar dalam mendefinisikan variabel x dan y serta melakukan kesalahan tanda negatif saat eliminasi.',
    },
    {
      materi: 'Hubungan Gradien Garis Sejajar dan Tegak Lurus',
      alasanBukti:
        'Sebagian siswa menganggap garis tegak lurus memiliki gradien berlawanan tanda saja (-m) tanpa membalik pecahan (-1/m).',
    },
    {
      materi: 'Soal Penalaran Multi-Langkah (Level C4–C5)',
      alasanBukti:
        'Siswa pada rentang nilai 70–79 masih membutuhkan bantuan pemecahan langkah (scaffolding) untuk menghubungkan dua konsep dalam satu stimulus.',
    },
  ],
  rekomendasiRemedial: [
    {
      sasaran: 'Kelompok Intensif (Nilai < 65 · 3 Siswa)',
      strategi: 'Pembelajaran ulang terbimbing (explicit teaching) dalam kelompok sangat kecil',
      bentukAktivitas:
        'Pendampingan langkah demi langkah menerjemahkan soal cerita menjadi model SPLDV menggunakan kartu variabel dan latihan eliminasi bertahap tanpa bilangan pecahan.',
      targetKetuntasan: 'Mencapai minimal nilai KKTP 75 melalui tes ulang setara pada materi SPLDV & Gradien.',
    },
    {
      sasaran: 'Kelompok Penguatan (Nilai 65–74 · 6 Siswa)',
      strategi: 'Klinik konsep & tutor sebaya (peer tutoring)',
      bentukAktivitas:
        'Diskusi berpasangan membahas kesalahan umum tanda aljabar dan hubungan gradien tegak lurus dengan lembar kerja terstruktur berisi contoh terpecahkan (worked example).',
      targetKetuntasan: 'Mampu menyelesaikan 80% soal aplikasi C3–C4 SPLDV dan Persamaan Garis Lurus dengan tepat.',
    },
  ],
  rekomendasiPengayaan: [
    {
      sasaran: 'Kelompok Berprestasi Tinggi (Nilai ≥ 90 · 6 Siswa)',
      strategi: 'Eksplorasi masalah HOTS & peran fasilitator kelas',
      bentukAktivitas:
        'Menyelesaikan tantangan pemodelan optimasi tiga variabel sederhana/lintas topik Pythagoras–Garis Lurus setara soal kompetisi SMP serta menjadi tutor sebaya terstruktur.',
      luaranDiharapkan:
        'Menghasilkan minimal 2 alternatif strategi penyelesaian soal non-rutin dan mempresentasikan pembuktiannya.',
    },
    {
      sasaran: 'Kelompok Tuntas Baik (Nilai 75–89 · 15 Siswa)',
      strategi: 'Proyek aplikasi kontekstual berbasis data nyata',
      bentukAktivitas:
        'Merancang studi kasus perbandingan tarif paket transportasi atau paket belanja menggunakan grafik persamaan garis lurus dan titik potong SPLDV.',
      luaranDiharapkan:
        'Laporan mini pemecahan masalah berbasis grafik linear dan interpretasi titik impas.',
    },
  ],
  catatanPenutupGuru:
    'Pada siklus pembelajaran semester berikutnya, guru perlu memperkuat fase jembatan dari representasi konkret/verbal ke bentuk simbol aljabar serta menyisipkan latihan soal penalaran C4 secara bertahap di setiap akhir sub-bab melalui asesmen formatif singkat (exit ticket).',
  createdAt: new Date().toISOString(),
};

const SAMPLE_PASTE_ANALISIS = `Hasil Analisis Sumatif Akhir Semester Matematika Kelas VIII (KKTP = 75, Jumlah Siswa = 30):
- Rata-rata nilai: 79,07 | Median: 80,5 | Simpangan Baku: 10,77
- Nilai tertinggi: 96 (Fitri Handayani) | Nilai terendah: 58 (Joko Santoso)
- Siswa tuntas (>= 75): 21 siswa (70,0%) | Belum tuntas (< 75): 9 siswa (30,0%)
- Sebaran nilai: 90–100 (6 siswa), 80–89 (10 siswa), 75–79 (5 siswa), 65–74 (6 siswa), <65 (3 siswa).
- Temuan butir soal: Soal Bilangan Berpangkat & Bentuk Akar dijawab benar oleh 86% siswa; Teorema Pythagoras 82%; Persamaan Garis Lurus (gradien tegak lurus) 68%; SPLDV soal cerita kontekstual hanya 59% yang benar sempurna.
- Daftar siswa belum tuntas: Bagas (68), Daffa (62), Eko (72), Galih (65), Joko (58), Luthfi (74), Oktavian (69), Reza (60), Teguh (71), Vino (66).`;

interface LaporanEvaluasiViewProps {
  blueprint: KisiBlueprint;
  activeAnalisisSummary: string;
  report: LearningEvaluationReport;
  onUpdateReport: (next: LearningEvaluationReport) => void;
}

function getAchievementStyle(status: TPOAchievementItem['tingkatKetercapaian']) {
  if (status === 'Tercapai Penuh') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  }
  if (status === 'Tercapai Sebagian') {
    return 'border-amber-200 bg-amber-50 text-amber-900';
  }
  return 'border-red-200 bg-red-50 text-red-900';
}

export const LaporanEvaluasiView: React.FC<LaporanEvaluasiViewProps> = ({
  blueprint,
  activeAnalisisSummary,
  report,
  onUpdateReport,
}) => {
  const [sourceMode, setSourceMode] = useState<'active' | 'paste'>('active');
  const [pastedAnalisis, setPastedAnalisis] = useState<string>('');
  const [includeKisiTP, setIncludeKisiTP] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  const tpListFromBlueprint = useMemo(
    () =>
      blueprint.rows.map((r) => ({
        materi: r.materi,
        tujuanPembelajaran: r.tujuanPembelajaran,
      })),
    [blueprint.rows]
  );

  const tpCounts = useMemo(() => {
    const penuh = report.ketercapaianTP.filter(
      (t) => t.tingkatKetercapaian === 'Tercapai Penuh'
    ).length;
    const sebagian = report.ketercapaianTP.filter(
      (t) => t.tingkatKetercapaian === 'Tercapai Sebagian'
    ).length;
    const belum = report.ketercapaianTP.filter(
      (t) => t.tingkatKetercapaian === 'Belum Tercapai'
    ).length;
    return { penuh, sebagian, belum };
  }, [report.ketercapaianTP]);

  const handleGenerateReport = async () => {
    const sourceText =
      sourceMode === 'active' ? activeAnalisisSummary : pastedAnalisis;

    if (!sourceText || sourceText.trim().length < 20) {
      setErrorMsg(
        sourceMode === 'active'
          ? 'Data analisis hasil ujian aktif belum mencukupi. Pastikan data nilai siswa sudah dimuat pada tab Analisis Statistik Nilai.'
          : 'Tempelkan teks hasil analisis ujian minimal 20 karakter terlebih dahulu.'
      );
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/laporan-evaluasi/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analisisText: sourceText,
          mataPelajaran: blueprint.config.mataPelajaran,
          kelasLabel: GRADE_LABELS[blueprint.config.kelas],
          semesterLabel: SEMESTER_LABELS[blueprint.config.semester],
          namaSekolah: blueprint.config.namaSekolah,
          tahunAjaran: blueprint.config.tahunAjaran,
          tujuanPembelajaranList: includeKisiTP ? tpListFromBlueprint : [],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.error || 'Gagal menyusun laporan evaluasi pembelajaran.'
        );
      }

      onUpdateReport(data as LearningEvaluationReport);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Terjadi gangguan jaringan saat menyusun laporan evaluasi pembelajaran.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPlainReport = async () => {
    const lines: string[] = [
      `${report.judulLaporan.toUpperCase()}`,
      `${report.namaSekolah} | ${report.mataPelajaran} | ${report.kelasLabel} | ${report.semesterLabel} | TA ${report.tahunAjaran}`,
      '',
      '1. RINGKASAN HASIL BELAJAR',
      report.ringkasanHasilBelajar,
      '',
      '2. KETERCAPAIAN TUJUAN PEMBELAJARAN',
      ...report.ketercapaianTP.map(
        (tp) =>
          `${tp.no}. [${tp.materi}] ${tp.tujuanPembelajaran} -> ${tp.tingkatKetercapaian} (${tp.persentaseCapaian}). Bukti: ${tp.catatanBukti}`
      ),
      '',
      '3. MATERI YANG SUDAH DIKUASAI',
      ...report.materiDikuasai.map((m) => `- ${m.materi}: ${m.alasanBukti}`),
      '',
      '4. MATERI YANG PERLU DIPERBAIKI',
      ...report.materiPerluDiperbaiki.map(
        (m) => `- ${m.materi}: ${m.alasanBukti}`
      ),
      '',
      '5. REKOMENDASI REMEDIAL (SISWA BELUM TUNTAS)',
      ...report.rekomendasiRemedial.map(
        (r) =>
          `- ${r.sasaran} | Strategi: ${r.strategi} | Aktivitas: ${r.bentukAktivitas} | Target: ${r.targetKetuntasan}`
      ),
      '',
      '6. REKOMENDASI PENGAYAAN (SISWA SUDAH TUNTAS)',
      ...report.rekomendasiPengayaan.map(
        (p) =>
          `- ${p.sasaran} | Strategi: ${p.strategi} | Aktivitas: ${p.bentukAktivitas} | Luaran: ${p.luaranDiharapkan}`
      ),
      '',
      '7. CATATAN PENUTUP & RENCANA SIKLUS BERIKUTNYA',
      report.catatanPenutupGuru,
    ];

    await navigator.clipboard.writeText(lines.join('\n'));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="report-generator-title"
        className="no-print rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2
              id="report-generator-title"
              className="font-display text-base font-semibold text-slate-900"
            >
              Sumber Data Laporan Evaluasi Pembelajaran
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Susun laporan evaluasi pembelajaran resmi dari hasil analisis statistik aktif atau tempelkan ringkasan analisis ujian dari dokumen lain.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Pilih sumber hasil analisis"
            className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={sourceMode === 'active'}
              onClick={() => setSourceMode('active')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                sourceMode === 'active'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gunakan Hasil Analisis Aktif
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sourceMode === 'paste'}
              onClick={() => setSourceMode('paste')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                sourceMode === 'paste'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tempel Hasil Analisis
            </button>
          </div>
        </div>

        {sourceMode === 'active' ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800">
                Ringkasan Hasil Analisis Aktif yang Akan Diproses
              </span>
              <span className="font-mono text-[11px] text-slate-600 tabular-nums">
                {blueprint.config.mataPelajaran} · {GRADE_LABELS[blueprint.config.kelas]} ·{' '}
                {SEMESTER_LABELS[blueprint.config.semester]}
              </span>
            </div>
            <pre className="max-h-44 overflow-y-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-white p-3 font-mono text-xs leading-relaxed text-slate-700">
              {activeAnalisisSummary}
            </pre>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="paste-analysis-textarea"
                className="text-xs font-semibold text-slate-700"
              >
                Tempelkan Hasil Analisis Ujian [TEMPELKAN HASIL ANALISIS]
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPastedAnalisis(activeAnalisisSummary)}
                  className="text-xs font-medium text-blue-800 hover:underline"
                >
                  Muat dari hasil analisis aktif
                </button>
                <button
                  type="button"
                  onClick={() => setPastedAnalisis(SAMPLE_PASTE_ANALISIS)}
                  className="text-xs font-medium text-slate-700 hover:text-blue-800"
                >
                  Muat contoh hasil analisis
                </button>
                {pastedAnalisis && (
                  <button
                    type="button"
                    onClick={() => setPastedAnalisis('')}
                    className="text-xs font-medium text-slate-500 hover:text-red-700"
                  >
                    Kosongkan
                  </button>
                )}
              </div>
            </div>
            <textarea
              id="paste-analysis-textarea"
              rows={7}
              value={pastedAnalisis}
              onChange={(e) => setPastedAnalisis(e.target.value)}
              placeholder="Tempelkan ringkasan hasil analisis ujian di sini (rata-rata, nilai tertinggi/terendah, jumlah & persentase tuntas/belum tuntas, sebaran nilai, serta temuan butir soal/materi yang sering salah)..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs leading-relaxed text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={includeKisiTP}
              onChange={(e) => setIncludeKisiTP(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-blue-800"
            />
            <span>
              Sertakan <strong>{tpListFromBlueprint.length} Tujuan Pembelajaran</strong> dari Kisi-Kisi aktif sebagai acuan pemetaan ketercapaian TP
            </span>
          </label>

          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Menyusun Laporan Evaluasi...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>Susun Laporan Evaluasi Pembelajaran</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
          >
            {errorMsg}
          </div>
        )}
      </section>

      <article className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-7 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-900">
              {report.namaSekolah} · Tahun Ajaran {report.tahunAjaran}
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-slate-950 sm:text-2xl">
              {report.judulLaporan}
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              {report.mataPelajaran} · {report.kelasLabel} · {report.semesterLabel}
            </p>
          </div>

          <div className="no-print flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPlainReport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              {copiedSummary ? (
                <>
                  <CheckCircle2
                    className="h-3.5 w-3.5 text-emerald-700"
                    aria-hidden="true"
                  />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() =>
                exportEvaluationReportToWordDoc(report, blueprint.config)
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Unduh Word Laporan (.doc)</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </header>

        <section aria-labelledby="sec-ringkasan" className="space-y-2.5">
          <h3
            id="sec-ringkasan"
            className="font-display text-sm font-bold text-slate-900"
          >
            1. Ringkasan Hasil Belajar
          </h3>
          <p className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-sm leading-relaxed text-slate-800">
            {report.ringkasanHasilBelajar}
          </p>
        </section>

        <section aria-labelledby="sec-ketercapaian-tp" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3
              id="sec-ketercapaian-tp"
              className="font-display text-sm font-bold text-slate-900"
            >
              2. Ketercapaian Tujuan Pembelajaran (TP)
            </h3>
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs tabular-nums">
              <span className="text-emerald-800">
                Tercapai Penuh: <strong>{tpCounts.penuh}</strong>
              </span>
              <span className="text-amber-800">
                Tercapai Sebagian: <strong>{tpCounts.sebagian}</strong>
              </span>
              <span className="text-red-800">
                Belum Tercapai: <strong>{tpCounts.belum}</strong>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[740px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
                  <th className="w-12 px-3 py-3 text-center">No</th>
                  <th className="w-[28%] px-3 py-3">Tujuan Pembelajaran</th>
                  <th className="w-[18%] px-3 py-3">Materi</th>
                  <th className="w-40 px-3 py-3 text-center">Ketercapaian</th>
                  <th className="w-24 px-3 py-3 text-right">Capaian</th>
                  <th className="px-3 py-3">Catatan / Bukti Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {report.ketercapaianTP.map((tp) => (
                  <tr key={tp.no} className="align-top hover:bg-slate-50/60">
                    <td className="px-3 py-3 text-center font-mono text-slate-500 tabular-nums">
                      {tp.no}
                    </td>
                    <td className="px-3 py-3 font-medium leading-relaxed text-slate-900">
                      {tp.tujuanPembelajaran}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{tp.materi}</td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${getAchievementStyle(
                          tp.tingkatKetercapaian
                        )}`}
                      >
                        {tp.tingkatKetercapaian}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {tp.persentaseCapaian}
                    </td>
                    <td className="px-3 py-3 leading-relaxed text-slate-700">
                      {tp.catatanBukti}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section
          aria-labelledby="sec-analisis-materi"
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          <h3 id="sec-analisis-materi" className="sr-only">
            Analisis Penguasaan Materi
          </h3>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/35 p-4 space-y-3">
            <h4 className="font-display text-sm font-bold text-emerald-950">
              3. Materi yang Sudah Dikuasai
            </h4>
            <ul className="space-y-2.5 text-xs leading-relaxed text-slate-800">
              {report.materiDikuasai.map((item, idx) => (
                <li key={idx} className="border-t border-emerald-200/70 pt-2 first:border-t-0 first:pt-0">
                  <p className="font-semibold text-slate-900">{item.materi}</p>
                  <p className="mt-0.5 text-slate-700">{item.alasanBukti}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50/35 p-4 space-y-3">
            <h4 className="font-display text-sm font-bold text-red-950">
              4. Materi yang Perlu Diperbaiki
            </h4>
            <ul className="space-y-2.5 text-xs leading-relaxed text-slate-800">
              {report.materiPerluDiperbaiki.map((item, idx) => (
                <li key={idx} className="border-t border-red-200/70 pt-2 first:border-t-0 first:pt-0">
                  <p className="font-semibold text-slate-900">{item.materi}</p>
                  <p className="mt-0.5 text-slate-700">{item.alasanBukti}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="sec-remedial" className="space-y-3">
          <h3
            id="sec-remedial"
            className="font-display text-sm font-bold text-slate-900"
          >
            5. Rekomendasi Remedial bagi Siswa yang Belum Tuntas
          </h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[700px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-red-50/60 text-[11px] font-semibold text-red-950">
                  <th className="w-[22%] px-3 py-3">Kelompok Sasaran</th>
                  <th className="w-[24%] px-3 py-3">Strategi Pedagogis</th>
                  <th className="px-3 py-3">Bentuk Aktivitas Remedial</th>
                  <th className="w-[22%] px-3 py-3">Target Ketuntasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {report.rekomendasiRemedial.map((rem, idx) => (
                  <tr key={idx} className="align-top hover:bg-slate-50/60">
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      {rem.sasaran}
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-800">
                      {rem.strategi}
                    </td>
                    <td className="px-3 py-3 leading-relaxed text-slate-700">
                      {rem.bentukAktivitas}
                    </td>
                    <td className="px-3 py-3 leading-relaxed text-slate-800">
                      {rem.targetKetuntasan}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="sec-pengayaan" className="space-y-3">
          <h3
            id="sec-pengayaan"
            className="font-display text-sm font-bold text-slate-900"
          >
            6. Rekomendasi Pengayaan bagi Siswa yang Sudah Tuntas
          </h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[700px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-emerald-50/60 text-[11px] font-semibold text-emerald-950">
                  <th className="w-[22%] px-3 py-3">Kelompok Sasaran</th>
                  <th className="w-[24%] px-3 py-3">Strategi Pedagogis</th>
                  <th className="px-3 py-3">Bentuk Aktivitas Pengayaan</th>
                  <th className="w-[22%] px-3 py-3">Luaran Diharapkan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {report.rekomendasiPengayaan.map((enr, idx) => (
                  <tr key={idx} className="align-top hover:bg-slate-50/60">
                    <td className="px-3 py-3 font-semibold text-slate-900">
                      {enr.sasaran}
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-800">
                      {enr.strategi}
                    </td>
                    <td className="px-3 py-3 leading-relaxed text-slate-700">
                      {enr.bentukAktivitas}
                    </td>
                    <td className="px-3 py-3 leading-relaxed text-slate-800">
                      {enr.luaranDiharapkan}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="sec-penutup" className="space-y-2.5">
          <h3
            id="sec-penutup"
            className="font-display text-sm font-bold text-slate-900"
          >
            7. Catatan Penutup & Rencana Siklus Pembelajaran Berikutnya
          </h3>
          <p className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-sm leading-relaxed text-slate-800">
            {report.catatanPenutupGuru}
          </p>
        </section>

        <footer className="hidden print:grid print:grid-cols-2 print:gap-12 print:pt-8 print:text-xs print:text-slate-900">
          <div>
            <p>Mengetahui,</p>
            <p>Kepala Sekolah</p>
            <div className="h-16" />
            <p className="font-bold underline">
              {blueprint.config.namaKepalaSekolah || '______________________'}
            </p>
            <p>NIP. {blueprint.config.nipKepalaSekolah || '____________________'}</p>
          </div>
          <div className="pl-12">
            <p>&nbsp;</p>
            <p>Guru Mata Pelajaran</p>
            <div className="h-16" />
            <p className="font-bold underline">
              {blueprint.config.namaPenyusun || '______________________'}
            </p>
            <p>NIP. {blueprint.config.nipPenyusun || '____________________'}</p>
          </div>
        </footer>
      </article>
    </div>
  );
};
