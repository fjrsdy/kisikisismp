import React, { useMemo, useState } from 'react';
import {
  Calculator,
  ClipboardCheck,
  FileText,
  Loader2,
  Printer,
  Sparkles,
} from 'lucide-react';
import { GRADE_LABELS } from '../data/smpCurriculum';
import type {
  AssessmentGuidePackage,
  ExamPaperPackage,
  KisiBlueprint,
} from '../types/kisiKisi';
import { postApiJson } from '../utils/apiClient';
import { exportAssessmentGuideToWordDoc } from '../utils/exportBlueprint';

interface PedomanPenilaianViewProps {
  blueprint: KisiBlueprint;
  examPaper: ExamPaperPackage | null;
  assessmentGuide: AssessmentGuidePackage;
  onUpdateGuide: (next: AssessmentGuidePackage) => void;
}

const SAMPLE_PASTED_EXAM = `A. PILIHAN GANDA
1. Hasil dari 2^3 × 2^4 : 2^2 adalah ...
A. 2^5
B. 2^6
C. 2^9
D. 2^10

2. Kelompok ukuran sisi segitiga berikut yang merupakan segitiga siku-siku adalah ...
A. 4 cm, 5 cm, 6 cm
B. 6 cm, 8 cm, 10 cm
C. 7 cm, 9 cm, 12 cm
D. 8 cm, 10 cm, 15 cm

3. Sebuah tangga sepanjang 10 m bersandar pada dinding vertikal. Jika jarak kaki tangga ke dinding 6 m, maka tinggi dinding yang dicapai tangga adalah ...
A. 4 m
B. 7 m
C. 8 m
D. 12 m

B. ISIAN SINGKAT
1. Bentuk baku (notasi ilmiah) dari bilangan 0,00045 adalah ...
2. Gradien garis yang memiliki persamaan 4x - 2y + 8 = 0 adalah ...

C. URAIAN
1. Harga 3 buku tulis dan 2 pensil di koperasi sekolah adalah Rp17.500,00, sedangkan harga 2 buku tulis dan 5 pensil adalah Rp19.000,00. Tentukan harga 1 buku tulis dan 1 pensil!
2. Sebuah kapal berlayar dari pelabuhan A ke arah timur sejauh 12 km, lalu berbelok ke utara sejauh 9 km menuju pulau B. Hitunglah jarak terpendek dari pelabuhan A ke pulau B!`;

export const INITIAL_ASSESSMENT_GUIDE: AssessmentGuidePackage = {
  id: 'default-guide-matematika-8',
  judulUjian: 'Sumatif Akhir Semester (SAS) — Matematika',
  mataPelajaran: 'Matematika',
  kelasLabel: 'Kelas VIII (2 SMP)',
  bobotPGPerSoal: 1,
  bobotIsianPerSoal: 2,
  rumusNilaiAkhir:
    'Nilai Akhir = (Skor Perolehan Total / Skor Maksimal Total) × 100',
  rumusBerbobotOpsional:
    'Alternatif Berbobot: Nilai = (50% × Nilai PG) + (20% × Nilai Isian) + (30% × Nilai Uraian)',
  catatanPenilaian:
    'Skor maksimal dihitung dari 3 soal Pilihan Ganda (bobot 1 = 3 poin), 2 soal Isian Singkat (bobot 2 = 4 poin), dan 2 soal Uraian (bobot masing-masing 6 dan 5 = 11 poin) dengan total Skor Maksimal = 18. Gunakan alternatif jawaban agar penilaian tetap objektif terhadap variasi penulisan satuan atau metode penyelesaian siswa.',
  kunciPG: [
    {
      nomor: 1,
      ringkasanSoal: 'Menyederhanakan operasi perkalian dan pembagian bilangan berpangkat 2^3 × 2^4 : 2^2.',
      kunciJawaban: 'A',
      pembahasanSingkat:
        'Gunakan sifat eksponen a^m × a^n : a^p = a^(m + n - p), sehingga 2^(3 + 4 - 2) = 2^5.',
      skorMaksimal: 1,
    },
    {
      nomor: 2,
      ringkasanSoal: 'Mengidentifikasi ukuran sisi yang membentuk segitiga siku-siku (tripel Pythagoras).',
      kunciJawaban: 'B',
      pembahasanSingkat:
        'Pada sisi 6, 8, 10 berlaku 6² + 8² = 36 + 64 = 100 = 10², sehingga memenuhi teorema Pythagoras.',
      skorMaksimal: 1,
    },
    {
      nomor: 3,
      ringkasanSoal: 'Menentukan tinggi dinding yang dicapai tangga panjang 10 m dengan jarak kaki 6 m.',
      kunciJawaban: 'C',
      pembahasanSingkat:
        't = √(10² - 6²) = √(100 - 36) = √64 = 8 m.',
      skorMaksimal: 1,
    },
  ],
  kunciIsian: [
    {
      nomor: 1,
      ringkasanSoal: 'Mengubah bilangan desimal 0,00045 ke dalam notasi ilmiah (bentuk baku).',
      kunciUtama: '4,5 × 10^-4',
      alternatifJawaban: ['4.5 × 10^-4', '4,5 x 10^(-4)', '4,5 · 10^-4'],
      pembahasanSingkat:
        'Koma digeser 4 langkah ke kanan agar koefisien berada di antara 1 dan 10, sehingga pangkat bernilai negatif (-4).',
      rubrikPenskoran: [
        { kriteria: 'Menuliskan koefisien dan pangkat negatif dengan tepat (4,5 × 10^-4)', skor: 2 },
        { kriteria: 'Koefisien benar (4,5) tetapi tanda/nilai pangkat keliru (misal 10^4 atau 10^-3)', skor: 1 },
        { kriteria: 'Jawaban salah seluruhnya atau kosong', skor: 0 },
      ],
      skorMaksimal: 2,
    },
    {
      nomor: 2,
      ringkasanSoal: 'Menentukan gradien dari persamaan garis implisit 4x - 2y + 8 = 0.',
      kunciUtama: '2',
      alternatifJawaban: ['m = 2', '+2', '2/1'],
      pembahasanSingkat:
        'Ubah ke y = mx + c: 2y = 4x + 8 → y = 2x + 4, atau gunakan m = -a/b = -4/(-2) = 2.',
      rubrikPenskoran: [
        { kriteria: 'Menuliskan nilai gradien tepat (2)', skor: 2 },
        { kriteria: 'Menuliskan nilai benar secara numerik tetapi salah tanda (-2)', skor: 1 },
        { kriteria: 'Jawaban salah seluruhnya atau kosong', skor: 0 },
      ],
      skorMaksimal: 2,
    },
  ],
  kunciUraian: [
    {
      nomor: 1,
      ringkasanSoal: 'Menentukan harga 1 buku tulis dan 1 pensil menggunakan SPLDV.',
      kunciUtama:
        'Misalkan x = harga 1 buku tulis, y = harga 1 pensil.\nModel: 3x + 2y = 17.500 (pers. 1) dan 2x + 5y = 19.000 (pers. 2).\nEliminasi x: 6x + 4y = 35.000 dan 6x + 15y = 57.000 → 11y = 22.000 → y = 2.000.\nSubstitusi ke pers. 1: 3x + 2(2.000) = 17.500 → 3x = 13.500 → x = 4.500.\nJadi, harga 1 buku tulis Rp4.500,00 dan harga 1 pensil Rp2.000,00.',
      alternatifJawaban: [
        'Menggunakan metode substitusi dari persamaan (1): y = (17.500 - 3x)/2 lalu disubstitusi ke persamaan (2).',
        'Menggunakan metode grafik atau gabungan eliminasi-substitusi.',
      ],
      pembahasanSingkat:
        'Siswa memodelkan dua variabel dengan tepat, menyamakan koefisien salah satu variabel, lalu menghitung nilai kedua variabel secara runtut.',
      rubrikPenskoran: [
        { kriteria: 'Membuat permisalan variabel dan dua model persamaan SPLDV dengan benar', skor: 2 },
        { kriteria: 'Melakukan proses eliminasi/substitusi untuk menemukan nilai variabel pertama dengan tepat', skor: 2 },
        { kriteria: 'Menemukan nilai kedua variabel secara lengkap dan menyimpulkan harga satuan', skor: 2 },
        { kriteria: 'Hanya menuliskan model persamaan tanpa proses penyelesaian', skor: 1 },
        { kriteria: 'Tidak menjawab atau jawaban tidak relevan', skor: 0 },
      ],
      skorMaksimal: 6,
    },
    {
      nomor: 2,
      ringkasanSoal: 'Menghitung jarak terpendek lintasan kapal (12 km timur, 9 km utara) dengan Teorema Pythagoras.',
      kunciUtama:
        'Lintasan membentuk segitiga siku-siku dengan sisi siku-siku 12 km dan 9 km.\nJarak terpendek AB = √(12² + 9²) = √(144 + 81) = √225 = 15 km.',
      alternatifJawaban: [
        'Menggunakan perbandingan tripel Pythagoras dasar (3, 4, 5) dikalikan faktor skala 3 → (9, 12, 15) km.',
      ],
      pembahasanSingkat:
        'Arah timur dan utara membentuk sudut siku-siku 90°, sehingga jarak langsung A ke B merupakan hipotenusa segitiga.',
      rubrikPenskoran: [
        { kriteria: 'Mengidentifikasi lintasan sebagai segitiga siku-siku / menuliskan rumus c² = a² + b²', skor: 2 },
        { kriteria: 'Mensubstitusi angka dengan tepat: √(12² + 9²) = √225', skor: 2 },
        { kriteria: 'Menentukan hasil akhir beserta satuan dengan tepat (15 km)', skor: 1 },
        { kriteria: 'Tidak menjawab atau langkah salah total', skor: 0 },
      ],
      skorMaksimal: 5,
    },
  ],
  createdAt: '2026-11-20T08:00:00.000Z',
};

function formatExamPaperToText(paper: ExamPaperPackage): string {
  const parts: string[] = [];
  if (paper.pilihanGanda.length > 0) {
    parts.push('A. PILIHAN GANDA');
    for (const q of paper.pilihanGanda) {
      const stim = q.stimulus && q.stimulus !== '-' ? `${q.stimulus}\n` : '';
      parts.push(
        `${q.nomor}. ${stim}${q.pertanyaan}\nA. ${q.pilihan.A}\nB. ${q.pilihan.B}\nC. ${q.pilihan.C}\nD. ${q.pilihan.D}`
      );
    }
  }
  if (paper.isianSingkat.length > 0) {
    parts.push('\nB. ISIAN SINGKAT');
    for (const q of paper.isianSingkat) {
      const stim = q.stimulus && q.stimulus !== '-' ? `${q.stimulus}\n` : '';
      parts.push(`${q.nomor}. ${stim}${q.pertanyaan}`);
    }
  }
  if (paper.uraian.length > 0) {
    parts.push('\nC. URAIAN');
    for (const q of paper.uraian) {
      const stim = q.stimulus && q.stimulus !== '-' ? `${q.stimulus}\n` : '';
      parts.push(`${q.nomor}. ${stim}${q.pertanyaan}`);
    }
  }
  return parts.join('\n\n');
}

export const PedomanPenilaianView: React.FC<PedomanPenilaianViewProps> = ({
  blueprint,
  examPaper,
  assessmentGuide,
  onUpdateGuide,
}) => {
  const [sourceMode, setSourceMode] = useState<'paste' | 'active'>('paste');
  const [rawExamText, setRawExamText] = useState<string>(SAMPLE_PASTED_EXAM);
  const [bobotPG, setBobotPG] = useState<number>(1);
  const [bobotIsian, setBobotIsian] = useState<number>(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'all' | 'pg' | 'isian' | 'uraian'>('all');

  // Interactive Student Score Calculator
  const [pgCorrectInput, setPgCorrectInput] = useState<number>(0);
  const [isianScoreInput, setIsianScoreInput] = useState<number>(0);
  const [uraianScoreInput, setUraianScoreInput] = useState<number>(0);

  const scoreSummary = useMemo(() => {
    const maxPG = assessmentGuide.kunciPG.reduce((acc, q) => acc + q.skorMaksimal, 0);
    const maxIsian = assessmentGuide.kunciIsian.reduce((acc, q) => acc + q.skorMaksimal, 0);
    const maxUraian = assessmentGuide.kunciUraian.reduce((acc, q) => acc + q.skorMaksimal, 0);
    const maxTotal = maxPG + maxIsian + maxUraian;
    return { maxPG, maxIsian, maxUraian, maxTotal };
  }, [assessmentGuide]);

  const calcResult = useMemo(() => {
    const pgScore =
      Math.min(pgCorrectInput, assessmentGuide.kunciPG.length) *
      assessmentGuide.bobotPGPerSoal;
    const isianScore = Math.min(isianScoreInput, scoreSummary.maxIsian);
    const uraianScore = Math.min(uraianScoreInput, scoreSummary.maxUraian);
    const totalObtained = pgScore + isianScore + uraianScore;
    const finalGrade =
      scoreSummary.maxTotal > 0
        ? Math.round((totalObtained / scoreSummary.maxTotal) * 1000) / 10
        : 0;

    let predicate = 'Perlu Bimbingan (D)';
    if (finalGrade >= 90) predicate = 'Sangat Baik (A)';
    else if (finalGrade >= 80) predicate = 'Baik (B)';
    else if (finalGrade >= 70) predicate = 'Cukup (C)';

    return { totalObtained, finalGrade, predicate };
  }, [
    pgCorrectInput,
    isianScoreInput,
    uraianScoreInput,
    assessmentGuide.kunciPG.length,
    assessmentGuide.bobotPGPerSoal,
    scoreSummary,
  ]);

  const handleGenerateFromText = async () => {
    const textToAnalyze =
      sourceMode === 'active' && examPaper
        ? formatExamPaperToText(examPaper)
        : rawExamText.trim();

    if (textToAnalyze.length < 15) {
      setErrorMsg('Tempelkan soal ujian terlebih dahulu sebelum menyusun pedoman penilaian.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const data = await postApiJson<AssessmentGuidePackage>(
        '/api/pedoman-penilaian/generate',
        {
          rawExamText: textToAnalyze,
          mataPelajaran:
            sourceMode === 'active' && examPaper
              ? examPaper.mataPelajaran
              : blueprint.config.mataPelajaran,
          kelasLabel:
            sourceMode === 'active' && examPaper
              ? examPaper.kelasLabel
              : GRADE_LABELS[blueprint.config.kelas],
          bobotPGPerSoal: bobotPG,
          bobotIsianPerSoal: bobotIsian,
        }
      );

      onUpdateGuide(data);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Terjadi gangguan jaringan saat menyusun pedoman penilaian.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConvertDirectlyFromExamPaper = () => {
    if (!examPaper) return;
    const kunciPG = examPaper.pilihanGanda.map((q) => ({
      nomor: q.nomor,
      ringkasanSoal: q.pertanyaan,
      kunciJawaban: q.kunciJawaban,
      pembahasanSingkat: q.pembahasan,
      skorMaksimal: bobotPG,
    }));

    const kunciIsian = examPaper.isianSingkat.map((q) => ({
      nomor: q.nomor,
      ringkasanSoal: q.pertanyaan,
      kunciUtama: q.kunciJawaban,
      alternatifJawaban: ['Variasi penulisan setara / ekuivalen sesuai konteks'],
      pembahasanSingkat: q.pedomanPenskoran,
      rubrikPenskoran: [
        { kriteria: 'Menuliskan jawaban tepat sesuai kunci atau alternatif benar', skor: bobotIsian },
        { kriteria: 'Jawaban mendekati benar namun kurang lengkap/tanpa satuan', skor: Math.max(1, Math.floor(bobotIsian / 2)) },
        { kriteria: 'Jawaban salah atau tidak menjawab', skor: 0 },
      ],
      skorMaksimal: bobotIsian,
    }));

    const kunciUraian = examPaper.uraian.map((q) => ({
      nomor: q.nomor,
      ringkasanSoal: q.pertanyaan,
      kunciUtama: q.kunciJawaban,
      alternatifJawaban: ['Metode/langkah penyelesaian lain yang sahih secara konseptual'],
      pembahasanSingkat: q.pedomanPenskoran,
      rubrikPenskoran: [
        { kriteria: 'Menuliskan langkah penyelesaian lengkap dan hasil akhir tepat', skor: q.skorMaksimal },
        { kriteria: 'Langkah benar namun terdapat kekeliruan hitung/penulisan akhir', skor: Math.max(1, Math.round(q.skorMaksimal * 0.6)) },
        { kriteria: 'Hanya menuliskan sebagian konsep awal dengan benar', skor: Math.max(1, Math.round(q.skorMaksimal * 0.25)) },
        { kriteria: 'Tidak menjawab atau langkah keliru seluruhnya', skor: 0 },
      ],
      skorMaksimal: q.skorMaksimal,
    }));

    const maxPG = kunciPG.reduce((s, i) => s + i.skorMaksimal, 0);
    const maxIsian = kunciIsian.reduce((s, i) => s + i.skorMaksimal, 0);
    const maxUraian = kunciUraian.reduce((s, i) => s + i.skorMaksimal, 0);
    const maxTotal = maxPG + maxIsian + maxUraian;

    onUpdateGuide({
      id: `guide-direct-${Date.now()}`,
      judulUjian: examPaper.judulUjian,
      mataPelajaran: examPaper.mataPelajaran,
      kelasLabel: examPaper.kelasLabel,
      bobotPGPerSoal: bobotPG,
      bobotIsianPerSoal: bobotIsian,
      rumusNilaiAkhir: `Nilai Akhir = (Skor Perolehan Total / ${maxTotal}) × 100`,
      rumusBerbobotOpsional:
        'Alternatif Berbobot: Nilai = (50% × Skor PG) + (20% × Skor Isian) + (30% × Skor Uraian)',
      catatanPenilaian:
        'Pedoman penilaian disusun otomatis dari Naskah Soal aktif dengan pembobotan proporsional per bentuk soal.',
      kunciPG,
      kunciIsian,
      kunciUraian,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <h1
            style={{ textWrap: 'balance' }}
            className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]"
          >
            Kunci Jawaban, Rubrik & Pedoman Penilaian
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Susun kunci jawaban lengkap dan pembahasan singkat untuk Pilihan Ganda, alternatif jawaban dan rubrik penskoran untuk Isian Singkat serta Uraian, lengkap dengan skor maksimal dan rumus nilai akhir.
          </p>
        </div>
      </div>

      <section
        aria-labelledby="input-soal-title"
        className="no-print rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2
              id="input-soal-title"
              className="font-display text-base font-semibold text-slate-900"
            >
              Sumber Soal Ujian untuk Dikoreksi & Dibuat Rubrik
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Tempelkan daftar soal ujian Anda atau tarik langsung dari naskah soal yang sudah disusun.
            </p>
          </div>

          <div
            role="group"
            aria-label="Pilih sumber soal"
            className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1"
          >
            <button
              type="button"
              onClick={() => setSourceMode('paste')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                sourceMode === 'paste'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tempel Soal Ujian
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('active')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                sourceMode === 'active'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dari Naskah Aktif
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {sourceMode === 'paste' ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="raw-exam-textarea"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Daftar Soal Ujian (Pilihan Ganda, Isian Singkat, dan Uraian)
                  </label>
                  <button
                    type="button"
                    onClick={() => setRawExamText(SAMPLE_PASTED_EXAM)}
                    className="text-xs font-medium text-blue-800 hover:underline whitespace-nowrap"
                  >
                    Muat contoh soal SMP
                  </button>
                </div>
                <textarea
                  id="raw-exam-textarea"
                  rows={7}
                  value={rawExamText}
                  onChange={(e) => setRawExamText(e.target.value)}
                  placeholder="Tempelkan naskah soal Pilihan Ganda, Isian Singkat, dan Uraian di sini..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs leading-relaxed text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                {examPaper ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-900">
                          {examPaper.judulUjian}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-600 font-mono tabular-nums">
                          {examPaper.pilihanGanda.length} PG ·{' '}
                          {examPaper.isianSingkat.length} Isian ·{' '}
                          {examPaper.uraian.length} Uraian
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleConvertDirectlyFromExamPaper}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100 whitespace-nowrap"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Konversi Instan</span>
                      </button>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">
                      Gunakan <strong>Konversi Instan</strong> untuk membentuk pedoman penilaian langsung dari kunci naskah aktif, atau klik tombol <strong>Susun Kunci & Rubrik Lengkap</strong> di samping untuk memperkaya alternatif jawaban dan rubrik bertahap melalui AI.
                    </p>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-600">
                    Belum ada Naskah Soal aktif yang dibuat. Silakan susun soal pada tab <strong>Naskah Soal</strong> terlebih dahulu atau gunakan mode <strong>Tempel Soal Ujian</strong>.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-4 lg:col-span-4 lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0">
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                Standar Bobot Skor Dasar
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <label className="block rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
                  <span className="block text-[11px] font-medium text-slate-600">
                    Skor PG / Soal
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={bobotPG}
                    onChange={(e) =>
                      setBobotPG(Math.max(1, Math.min(10, Number(e.target.value) || 1)))
                    }
                    className="mt-0.5 w-full bg-transparent font-mono text-sm font-semibold text-slate-900 tabular-nums focus:outline-none"
                  />
                </label>

                <label className="block rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
                  <span className="block text-[11px] font-medium text-slate-600">
                    Skor Isian / Soal
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={bobotIsian}
                    onChange={(e) =>
                      setBobotIsian(
                        Math.max(1, Math.min(10, Number(e.target.value) || 2))
                      )
                    }
                    className="mt-0.5 w-full bg-transparent font-mono text-sm font-semibold text-slate-900 tabular-nums focus:outline-none"
                  />
                </label>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Skor maksimal Uraian disesuaikan otomatis menurut kompleksitas langkah penyelesaian.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateFromText}
              disabled={isGenerating || (sourceMode === 'active' && !examPaper)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Menyusun Kunci & Rubrik...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span>Susun Kunci & Pedoman Penilaian</span>
                </>
              )}
            </button>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
              >
                {errorMsg}
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="formula-summary-title"
        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2
              id="formula-summary-title"
              className="font-display text-lg font-semibold text-slate-900"
            >
              Pedoman Penilaian & Rumus Nilai Akhir
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              {assessmentGuide.judulUjian} · {assessmentGuide.mataPelajaran} ·{' '}
              {assessmentGuide.kelasLabel}
            </p>
          </div>

          <div className="no-print flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exportAssessmentGuideToWordDoc(assessmentGuide)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Unduh Word (.doc)</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-slate-500">
              Pilihan Ganda ({assessmentGuide.kunciPG.length} soal)
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-slate-900 tabular-nums">
              {scoreSummary.maxPG} <span className="text-xs font-normal text-slate-500">poin maks</span>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-slate-500">
              Isian Singkat ({assessmentGuide.kunciIsian.length} soal)
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-slate-900 tabular-nums">
              {scoreSummary.maxIsian} <span className="text-xs font-normal text-slate-500">poin maks</span>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-slate-500">
              Uraian ({assessmentGuide.kunciUraian.length} soal)
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-slate-900 tabular-nums">
              {scoreSummary.maxUraian} <span className="text-xs font-normal text-slate-500">poin maks</span>
            </div>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50/60 px-3.5 py-2.5">
            <div className="text-[11px] font-semibold text-blue-900">
              Skor Maksimal Total
            </div>
            <div className="mt-0.5 font-mono text-base font-bold text-blue-950 tabular-nums">
              {scoreSummary.maxTotal} <span className="text-xs font-normal text-blue-800">poin</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 lg:col-span-7 space-y-2">
            <div className="text-xs font-semibold text-slate-900">
              Rumus Perhitungan Nilai Akhir
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-900">
              {assessmentGuide.rumusNilaiAkhir}
            </div>
            <div className="text-xs text-slate-700">
              <strong className="font-medium text-slate-900">Skema Berbobot: </strong>
              {assessmentGuide.rumusBerbobotOpsional}
            </div>
            {assessmentGuide.catatanPenilaian && (
              <p className="text-xs leading-relaxed text-slate-600 pt-1">
                {assessmentGuide.catatanPenilaian}
              </p>
            )}
          </div>

          <div className="no-print rounded-lg border border-slate-200 bg-white p-4 lg:col-span-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-2.5">
              <Calculator className="h-3.5 w-3.5 text-blue-800" aria-hidden="true" />
              <span>Simulasi Kalkulator Nilai Siswa</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="block text-[11px] text-slate-600">
                  PG Benar (/{assessmentGuide.kunciPG.length})
                </span>
                <input
                  type="number"
                  min={0}
                  max={assessmentGuide.kunciPG.length}
                  value={pgCorrectInput}
                  onChange={(e) =>
                    setPgCorrectInput(
                      Math.max(0, Math.min(assessmentGuide.kunciPG.length, Number(e.target.value) || 0))
                    )
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-900 tabular-nums"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] text-slate-600">
                  Skor Isian (/{scoreSummary.maxIsian})
                </span>
                <input
                  type="number"
                  min={0}
                  max={scoreSummary.maxIsian}
                  value={isianScoreInput}
                  onChange={(e) =>
                    setIsianScoreInput(
                      Math.max(0, Math.min(scoreSummary.maxIsian, Number(e.target.value) || 0))
                    )
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-900 tabular-nums"
                />
              </label>
              <label className="block">
                <span className="block text-[11px] text-slate-600">
                  Skor Uraian (/{scoreSummary.maxUraian})
                </span>
                <input
                  type="number"
                  min={0}
                  max={scoreSummary.maxUraian}
                  value={uraianScoreInput}
                  onChange={(e) =>
                    setUraianScoreInput(
                      Math.max(0, Math.min(scoreSummary.maxUraian, Number(e.target.value) || 0))
                    )
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-900 tabular-nums"
                />
              </label>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
              <span className="text-slate-600 tabular-nums">
                Skor: <strong className="font-mono text-slate-900">{calcResult.totalObtained}/{scoreSummary.maxTotal}</strong>
              </span>
              <span className="tabular-nums">
                Nilai Akhir:{' '}
                <strong className="font-mono text-sm text-blue-900">
                  {calcResult.finalGrade}
                </strong>{' '}
                <span className="text-slate-600">· {calcResult.predicate}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="no-print flex items-center gap-1 rounded-lg bg-slate-200/70 p-1 w-fit">
        {(
          [
            { id: 'all', label: 'Semua Bagian' },
            { id: 'pg', label: `Pilihan Ganda (${assessmentGuide.kunciPG.length})` },
            { id: 'isian', label: `Isian Singkat (${assessmentGuide.kunciIsian.length})` },
            { id: 'uraian', label: `Uraian (${assessmentGuide.kunciUraian.length})` },
          ] as { id: typeof activeSection; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeSection === tab.id
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(activeSection === 'all' || activeSection === 'pg') &&
        assessmentGuide.kunciPG.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                A. Kunci Jawaban & Pembahasan Singkat Pilihan Ganda
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-700">
                    <th className="w-14 px-3 py-2.5 text-center">No</th>
                    <th className="w-[32%] px-3 py-2.5">Ringkasan Soal</th>
                    <th className="w-20 px-3 py-2.5 text-center">Kunci</th>
                    <th className="px-3 py-2.5">Pembahasan Singkat</th>
                    <th className="w-20 px-3 py-2.5 text-center">Skor Maks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {assessmentGuide.kunciPG.map((item) => (
                    <tr key={item.nomor} className="align-top hover:bg-slate-50/70">
                      <td className="px-3 py-3 text-center font-mono font-semibold text-slate-700 tabular-nums">
                        {item.nomor}
                      </td>
                      <td className="px-3 py-3 text-slate-800 leading-relaxed">
                        {item.ringkasanSoal}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-block rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono font-bold text-emerald-900">
                          {item.kunciJawaban}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-700 leading-relaxed">
                        {item.pembahasanSingkat}
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-slate-800 tabular-nums">
                        {item.skorMaksimal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      {(activeSection === 'all' || activeSection === 'isian') &&
        assessmentGuide.kunciIsian.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                B. Kunci, Alternatif Jawaban & Rubrik Penskoran Isian Singkat
              </h3>
            </div>
            <div className="divide-y divide-slate-200">
              {assessmentGuide.kunciIsian.map((item) => (
                <div key={item.nomor} className="p-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-6 space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                        Isian No. {item.nomor}
                      </span>
                      <span className="font-mono text-xs font-semibold text-blue-900 tabular-nums">
                        Skor Maks: {item.skorMaksimal}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-900 leading-relaxed">
                      {item.ringkasanSoal}
                    </p>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-xs">
                      <span className="font-semibold text-emerald-950">Kunci Utama: </span>
                      <span className="font-mono font-semibold text-emerald-900">
                        {item.kunciUtama}
                      </span>
                    </div>
                    {item.alternatifJawaban.length > 0 && (
                      <div className="text-xs text-slate-700">
                        <strong className="font-semibold text-slate-900">
                          Alternatif Jawaban Diterima:{' '}
                        </strong>
                        {item.alternatifJawaban.join(' · ')}
                      </div>
                    )}
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong className="font-semibold text-slate-800">Pembahasan: </strong>
                      {item.pembahasanSingkat}
                    </p>
                  </div>

                  <div className="lg:col-span-6">
                    <div className="text-[11px] font-semibold text-slate-700 mb-1.5">
                      Rubrik Penskoran
                    </div>
                    <table className="w-full border-collapse border border-slate-200 text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700">
                          <th className="border border-slate-200 px-3 py-1.5 text-left font-semibold">
                            Kriteria Jawaban
                          </th>
                          <th className="border border-slate-200 px-3 py-1.5 w-16 text-center font-semibold">
                            Skor
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.rubrikPenskoran.map((r, idx) => (
                          <tr key={idx}>
                            <td className="border border-slate-200 px-3 py-1.5 text-slate-700">
                              {r.kriteria}
                            </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center font-mono font-semibold text-slate-900 tabular-nums">
                              {r.skor}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      {(activeSection === 'all' || activeSection === 'uraian') &&
        assessmentGuide.kunciUraian.length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                C. Kunci, Alternatif Penyelesaian & Rubrik Penskoran Uraian
              </h3>
            </div>
            <div className="divide-y divide-slate-200">
              {assessmentGuide.kunciUraian.map((item) => (
                <div key={item.nomor} className="p-5 grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-6 space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                        Uraian No. {item.nomor}
                      </span>
                      <span className="font-mono text-xs font-semibold text-blue-900 tabular-nums">
                        Skor Maks: {item.skorMaksimal}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-900 leading-relaxed">
                      {item.ringkasanSoal}
                    </p>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-xs whitespace-pre-line leading-relaxed text-emerald-950">
                      <strong className="font-semibold">Kunci Penyelesaian:</strong>
                      {'\n'}
                      {item.kunciUtama}
                    </div>
                    {item.alternatifJawaban.length > 0 && (
                      <div className="text-xs text-slate-700 leading-relaxed">
                        <strong className="font-semibold text-slate-900">
                          Alternatif Penyelesaian:{' '}
                        </strong>
                        {item.alternatifJawaban.join(' · ')}
                      </div>
                    )}
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong className="font-semibold text-slate-800">Pembahasan: </strong>
                      {item.pembahasanSingkat}
                    </p>
                  </div>

                  <div className="lg:col-span-6">
                    <div className="text-[11px] font-semibold text-slate-700 mb-1.5">
                      Rubrik Penskoran Bertahap
                    </div>
                    <table className="w-full border-collapse border border-slate-200 text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700">
                          <th className="border border-slate-200 px-3 py-1.5 text-left font-semibold">
                            Aspek / Langkah Pencapaian
                          </th>
                          <th className="border border-slate-200 px-3 py-1.5 w-16 text-center font-semibold">
                            Skor
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.rubrikPenskoran.map((r, idx) => (
                          <tr key={idx}>
                            <td className="border border-slate-200 px-3 py-1.5 text-slate-700">
                              {r.kriteria}
                            </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center font-mono font-semibold text-slate-900 tabular-nums">
                              {r.skor}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
    </div>
  );
};
