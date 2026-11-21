import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';
import { GRADE_LABELS } from '../data/smpCurriculum';
import type {
  ExamFormSubmission,
  KisiBlueprint,
  LearningEvaluationReport,
  ScoreAnalysisNarrative,
  StudentScoreRecord,
} from '../types/kisiKisi';
import { postApiJson } from '../utils/apiClient';
import {
  exportScoreAnalysisToCSV,
  exportScoreAnalysisToWordDoc,
} from '../utils/exportBlueprint';
import { generateLocalScoreInterpretation } from '../utils/localEvaluationEngine';
import { computeScoreStatistics, parseStudentScores } from '../utils/scoreParser';
import { STORAGE_FORM_SUBMISSIONS_KEY } from './FormUjianView';
import { LaporanEvaluasiView } from './LaporanEvaluasiView';

interface AnalisisNilaiViewProps {
  blueprint: KisiBlueprint;
}

const STORAGE_REPORT_KEY = 'evaluasi_smp_report_v1';

const SAMPLE_STUDENT_SCORES = `1\tAditya Pratama\t88
2\tAisyah Rahma\t94
3\tBagas Saputra\t68
4\tBunga Lestari\t82
5\tCahyo Nugroho\t76
6\tCitra Dewi\t91
7\tDaffa Ramadhan\t62
8\tDina Permata\t79
9\tEko Prasetyo\t72
10\tFajar Hidayat\t85
11\tFitri Handayani\t96
12\tGalih Kusuma\t65
13\tGita Anggraini\t84
14\tHafiz Maulana\t75
15\tIntan Sari\t89
16\tJoko Santoso\t58
17\tKartika Putri\t81
18\tLuthfi Hakim\t74
19\tMelati Puspita\t90
20\tNabilah Azzahra\t86
21\tOktavian Putra\t69
22\tPutri Maharani\t78
23\tRafi Akbar\t83
24\tRani Wulandari\t92
25\tReza Pahlevi\t60
26\tSalsa Nabila\t87
27\tTeguh Wibowo\t71
28\tUmi Kalsum\t80
29\tVino Alfarizi\t66
30\tZahra Khairunnisa\t93`;

export const AnalisisNilaiView: React.FC<AnalisisNilaiViewProps> = ({
  blueprint,
}) => {
  const [rawInput, setRawInput] = useState<string>('');
  const [kktp, setKktp] = useState<number>(75);
  const [mataPelajaran, setMataPelajaran] = useState<string>(
    blueprint.config.mataPelajaran
  );
  const [kelasLabel, setKelasLabel] = useState<string>(
    GRADE_LABELS[blueprint.config.kelas]
  );

  const [narrative, setNarrative] = useState<ScoreAnalysisNarrative | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'tuntas' | 'belum'>('all');
  const [sortBy, setSortBy] = useState<'no' | 'desc' | 'asc'>('no');

  const [subTab, setSubTab] = useState<'statistik' | 'laporan'>('statistik');

  const [evaluationReport, setEvaluationReport] =
    useState<LearningEvaluationReport | null>(() => {
      try {
        const raw = localStorage.getItem(STORAGE_REPORT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as LearningEvaluationReport;
          if (parsed.id !== 'laporan-initial-mat8') {
            return parsed;
          }
        }
      } catch {
        // Fallback null
      }
      return null;
    });

  const [formSubmissions, setFormSubmissions] = useState<ExamFormSubmission[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_FORM_SUBMISSIONS_KEY);
      if (raw) {
        return JSON.parse(raw) as ExamFormSubmission[];
      }
    } catch {
      // Fallback empty
    }
    return [];
  });
  const [selectedCbtGroup, setSelectedCbtGroup] = useState<string>('ALL');
  const [isSyncingCbt, setIsSyncingCbt] = useState<boolean>(false);
  const [cbtSyncNote, setCbtSyncNote] = useState<string | null>(null);

  const userEditedRawRef = useRef<boolean>(false);

  const cbtGroups = useMemo(() => {
    const map = new Map<string, { key: string; label: string; count: number; mataPelajaran: string; kelas: string }>();
    for (const sub of formSubmissions) {
      const codePart = sub.cbtSessionCode || 'LOKAL';
      const key = `${codePart}::${sub.mataPelajaran}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          key,
          label: sub.cbtSessionCode
            ? `${sub.mataPelajaran} (${sub.cbtSessionCode})`
            : `${sub.mataPelajaran} (CBT Lokal)`,
          count: 1,
          mataPelajaran: sub.mataPelajaran,
          kelas: sub.kelas,
        });
      }
    }
    return Array.from(map.values());
  }, [formSubmissions]);

  const applyCbtSubmissionsToInput = (
    list: ExamFormSubmission[],
    groupKey: string,
    announce = false
  ) => {
    const filtered =
      groupKey === 'ALL'
        ? list
        : list.filter(
            (s) => `${s.cbtSessionCode || 'LOKAL'}::${s.mataPelajaran}` === groupKey
          );
    if (filtered.length === 0) return false;

    const lines = filtered.map(
      (s, idx) => `${idx + 1}\t${s.namaSiswa}\t${s.nilaiAkhir}`
    );
    setRawInput(lines.join('\n'));
    setNarrative(null);

    const uniqueSubjects = Array.from(new Set(filtered.map((s) => s.mataPelajaran)));
    if (uniqueSubjects.length === 1 && uniqueSubjects[0]) {
      setMataPelajaran(uniqueSubjects[0]);
    }
    const uniqueKelas = Array.from(new Set(filtered.map((s) => s.kelas).filter(Boolean)));
    if (uniqueKelas.length === 1 && uniqueKelas[0]) {
      setKelasLabel(uniqueKelas[0]);
    }

    if (announce) {
      setCbtSyncNote(`Memuat ${filtered.length} hasil ujian CBT ke Analisis Hasil Ujian.`);
      window.setTimeout(() => setCbtSyncNote(null), 3500);
    }
    return true;
  };

  const syncCbtSubmissionsFromServer = async (forceApplyToInput = false) => {
    setIsSyncingCbt(true);
    let localList: ExamFormSubmission[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_FORM_SUBMISSIONS_KEY);
      if (raw) {
        localList = JSON.parse(raw) as ExamFormSubmission[];
      }
    } catch {
      localList = [];
    }

    let merged = [...localList];
    try {
      const resp = await fetch('/api/cbt/submissions');
      if (resp.ok) {
        const data = (await resp.json()) as { submissions?: ExamFormSubmission[] };
        const serverList = data.submissions || [];
        const byId = new Map<string, ExamFormSubmission>();
        for (const item of [...serverList, ...localList]) {
          if (item?.id && !byId.has(item.id)) {
            byId.set(item.id, item);
          }
        }
        merged = Array.from(byId.values()).sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
        try {
          localStorage.setItem(STORAGE_FORM_SUBMISSIONS_KEY, JSON.stringify(merged));
        } catch {
          // ignore storage quota errors
        }
      }
    } catch {
      // keep localList fallback
    }

    setFormSubmissions(merged);

    if (merged.length > 0 && (forceApplyToInput || !userEditedRawRef.current)) {
      applyCbtSubmissionsToInput(merged, selectedCbtGroup, forceApplyToInput);
    } else if (forceApplyToInput && merged.length === 0) {
      setCbtSyncNote('Belum ada peserta yang mengumpulkan ujian CBT.');
      window.setTimeout(() => setCbtSyncNote(null), 3500);
    }
    setIsSyncingCbt(false);
  };

  useEffect(() => {
    // Auto-load local CBT results immediately on mount, then merge server CBT submissions
    if (formSubmissions.length > 0 && !userEditedRawRef.current) {
      applyCbtSubmissionsToInput(formSubmissions, 'ALL', false);
    }
    syncCbtSubmissionsFromServer(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      if (evaluationReport) {
        localStorage.setItem(
          STORAGE_REPORT_KEY,
          JSON.stringify(evaluationReport)
        );
      } else {
        localStorage.removeItem(STORAGE_REPORT_KEY);
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [evaluationReport]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const records: StudentScoreRecord[] = useMemo(
    () => parseStudentScores(rawInput),
    [rawInput]
  );

  const stats = useMemo(
    () => computeScoreStatistics(records, kktp),
    [records, kktp]
  );

  const resolvedNarrative: ScoreAnalysisNarrative | null = useMemo(() => {
    if (stats.totalSiswa === 0) return null;
    if (narrative) return narrative;
    return generateLocalScoreInterpretation({
      mataPelajaran,
      kelasLabel,
      materiPokok: blueprint.config.materiPokok,
      kktp,
      stats,
      daftarBelumTuntas: records
        .filter((r) => r.nilai < kktp)
        .map((r) => ({ nama: r.nama, nilai: r.nilai })),
    });
  }, [
    narrative,
    stats,
    mataPelajaran,
    kelasLabel,
    blueprint.config.materiPokok,
    kktp,
    records,
  ]);

  const activeAnalisisSummary = useMemo(() => {
    if (stats.totalSiswa === 0) {
      return '';
    }
    const belumTuntasList = records
      .filter((r) => r.nilai < kktp)
      .map((r) => `${r.nama} (${r.nilai})`)
      .join(', ');
    const distribusiText = stats.distribusi
      .map((d) => `${d.label}: ${d.count} siswa`)
      .join(' | ');

    return [
      `Hasil Analisis Ujian ${mataPelajaran} (${kelasLabel}) · KKTP: ${kktp}`,
      `- Jumlah Peserta: ${stats.totalSiswa} siswa`,
      `- Rata-rata: ${stats.rataRata} | Median: ${stats.median} | Simpangan Baku: ${stats.simpanganBaku}`,
      `- Nilai Tertinggi: ${stats.nilaiTertinggi} (${stats.siswaTertinggi.join(', ')})`,
      `- Nilai Terendah: ${stats.nilaiTerendah} (${stats.siswaTerendah.join(', ')})`,
      `- Siswa Tuntas (>= ${kktp}): ${stats.jumlahTuntas} siswa (${stats.persentaseKetuntasan}%)`,
      `- Siswa Belum Tuntas (< ${kktp}): ${stats.jumlahBelumTuntas} siswa (${stats.persentaseBelumTuntas}%)`,
      `- Distribusi Rentang Nilai: ${distribusiText}`,
      belumTuntasList ? `- Daftar Siswa Belum Tuntas: ${belumTuntasList}` : '',
      resolvedNarrative
        ? `- Status Ketuntasan Klasikal: ${resolvedNarrative.statusKetuntasanKlasikal}`
        : '',
      resolvedNarrative
        ? `- Ringkasan & Interpretasi: ${resolvedNarrative.ringkasanEksekutif} ${resolvedNarrative.interpretasiHasil}`
        : '',
      resolvedNarrative
        ? `- Analisis Sebaran: ${resolvedNarrative.analisisSebaranNilai}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
  }, [stats, records, kktp, mataPelajaran, kelasLabel, resolvedNarrative]);

  const filteredRecords = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const filtered = records.filter((r) => {
      if (statusFilter === 'tuntas' && r.nilai < kktp) return false;
      if (statusFilter === 'belum' && r.nilai >= kktp) return false;
      if (q && !r.nama.toLowerCase().includes(q) && !String(r.nilai).includes(q)) {
        return false;
      }
      return true;
    });

    if (sortBy === 'desc') {
      return [...filtered].sort((a, b) => b.nilai - a.nilai);
    }
    if (sortBy === 'asc') {
      return [...filtered].sort((a, b) => a.nilai - b.nilai);
    }
    return filtered;
  }, [records, kktp, searchTerm, statusFilter, sortBy]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') {
        setRawInput(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleGenerateInterpretation = async () => {
    if (stats.totalSiswa === 0) {
      setErrorMsg('Tempelkan minimal satu data nilai siswa yang valid terlebih dahulu.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const daftarBelumTuntas = records
        .filter((r) => r.nilai < kktp)
        .map((r) => ({ nama: r.nama, nilai: r.nilai }));

      const payload = {
        mataPelajaran,
        kelasLabel,
        materiPokok: blueprint.config.materiPokok,
        kktp,
        stats,
        daftarBelumTuntas,
      };

      const data = await postApiJson<ScoreAnalysisNarrative>(
        '/api/analisis-hasil/interpretasi',
        payload,
        () => generateLocalScoreInterpretation(payload)
      );

      setNarrative(data);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Terjadi gangguan jaringan saat menyusun interpretasi evaluasi.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h1
            style={{ textWrap: 'balance' }}
            className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]"
          >
            {subTab === 'statistik'
              ? 'Analisis Hasil Ujian & Tindak Lanjut Pembelajaran'
              : 'Laporan Evaluasi Pembelajaran Semester'}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            {subTab === 'statistik'
              ? 'Tempelkan data nilai siswa dari Excel, CSV, atau teks untuk menghitung statistik ketuntasan secara akurat, menyajikan tabel status belajar, serta menyusun interpretasi dan rekomendasi remedial maupun pengayaan.'
              : 'Susun laporan evaluasi pembelajaran komprehensif mencakup ringkasan hasil belajar, ketercapaian tujuan pembelajaran, pemetaan materi dikuasai & perlu diperbaiki, serta program remedial dan pengayaan.'}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Sub-halaman Evaluasi Hasil"
          className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-100 p-1 self-start lg:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'statistik'}
            onClick={() => setSubTab('statistik')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              subTab === 'statistik'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>1. Analisis Statistik Nilai</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'laporan'}
            onClick={() => setSubTab('laporan')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              subTab === 'laporan'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>2. Laporan Evaluasi Pembelajaran</span>
          </button>
        </div>
      </div>

      {subTab === 'laporan' ? (
        <LaporanEvaluasiView
          blueprint={blueprint}
          activeAnalisisSummary={activeAnalisisSummary}
          report={evaluationReport}
          onUpdateReport={setEvaluationReport}
        />
      ) : (
        <>

      <section
        aria-labelledby="score-input-title"
        className="no-print rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2
              id="score-input-title"
              className="font-display text-base font-semibold text-slate-900"
            >
              Input Data Nilai Siswa
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Mendukung salin-tempel langsung dari Excel/Google Sheets, format CSV (Nama, Nilai), atau daftar angka nilai.
            </p>
          </div>
          <span className="font-mono text-xs font-medium text-slate-700 tabular-nums">
            Terbaca: <strong>{stats.totalSiswa}</strong> Siswa
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="raw-scores-textarea"
                className="text-xs font-semibold text-slate-700"
              >
                Data Nilai Ujian Siswa
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-blue-800"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Impor CSV</span>
                </button>
                {formSubmissions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      userEditedRawRef.current = false;
                      applyCbtSubmissionsToInput(formSubmissions, selectedCbtGroup, true);
                    }}
                    className="text-xs font-semibold text-emerald-800 hover:underline"
                  >
                    Muat Hasil CBT ({formSubmissions.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    userEditedRawRef.current = true;
                    setRawInput(SAMPLE_STUDENT_SCORES);
                    setNarrative(null);
                  }}
                  className="text-xs font-medium text-blue-800 hover:underline"
                >
                  Muat contoh 30 siswa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    userEditedRawRef.current = true;
                    setRawInput('');
                    setNarrative(null);
                    setErrorMsg(null);
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-red-700"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2">
              <div className="text-xs text-slate-700">
                <span className="font-semibold text-blue-950">Hasil Ujian CBT:</span>{' '}
                {formSubmissions.length > 0 ? (
                  <span className="font-mono font-semibold text-emerald-900 tabular-nums">
                    {formSubmissions.length} peserta siap dianalisis
                  </span>
                ) : (
                  <span className="text-slate-600">
                    Belum ada kiriman CBT (klik sinkronkan setelah siswa mengumpulkan)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {cbtGroups.length > 1 && (
                  <select
                    aria-label="Filter sesi atau mata pelajaran CBT"
                    value={selectedCbtGroup}
                    onChange={(e) => {
                      const nextKey = e.target.value;
                      setSelectedCbtGroup(nextKey);
                      userEditedRawRef.current = false;
                      applyCbtSubmissionsToInput(formSubmissions, nextKey, true);
                    }}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800"
                  >
                    <option value="ALL">Semua Sesi CBT ({formSubmissions.length})</option>
                    {cbtGroups.map((g) => (
                      <option key={g.key} value={g.key}>
                        {g.label} ({g.count})
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => {
                    userEditedRawRef.current = false;
                    syncCbtSubmissionsFromServer(true);
                  }}
                  disabled={isSyncingCbt}
                  className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-white px-2.5 py-1 text-xs font-semibold text-blue-900 hover:bg-blue-100 whitespace-nowrap"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isSyncingCbt ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>Sinkronkan &amp; Muat CBT</span>
                </button>
              </div>
            </div>

            {cbtSyncNote && (
              <div className="mb-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900">
                {cbtSyncNote}
              </div>
            )}

            <textarea
              id="raw-scores-textarea"
              rows={8}
              value={rawInput}
              onChange={(e) => {
                userEditedRawRef.current = true;
                setRawInput(e.target.value);
                setNarrative(null);
              }}
              placeholder={`Contoh format yang didukung:\n1\tAhmad Fauzi\t84\n2\tBunga Lestari\t72\natau: Budi Santoso, 85\natau: 78, 85, 92, 64`}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs leading-relaxed text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
            />
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-4 lg:col-span-5 lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="block text-xs font-semibold text-slate-700 mb-1">
                  Mata Pelajaran
                </span>
                <input
                  type="text"
                  value={mataPelajaran}
                  onChange={(e) => setMataPelajaran(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-semibold text-slate-700 mb-1">
                  Kelas
                </span>
                <input
                  type="text"
                  value={kelasLabel}
                  onChange={(e) => setKelasLabel(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="kktp-input"
                  className="text-xs font-semibold text-slate-700"
                >
                  Batas Ketuntasan Minimal (KKTP / KKM)
                </label>
                <span className="font-mono text-xs font-semibold text-blue-900 tabular-nums">
                  {kktp}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="kktp-input"
                  type="range"
                  min={50}
                  max={90}
                  step={1}
                  value={kktp}
                  onChange={(e) => setKktp(Number(e.target.value))}
                  className="w-full accent-blue-800"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  aria-label="Nilai KKTP"
                  value={kktp}
                  onChange={(e) =>
                    setKktp(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                  }
                  className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-center font-mono text-xs font-semibold text-slate-900 tabular-nums"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateInterpretation}
              disabled={isGenerating || stats.totalSiswa === 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Menganalisis & Menyusun Rekomendasi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span>Analisis & Susun Rekomendasi Evaluasi</span>
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

      {stats.totalSiswa === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-700">
            Belum ada data nilai siswa yang terbaca.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Tempelkan data nilai pada kolom di atas atau klik &ldquo;Muat contoh 30 siswa&rdquo; untuk melihat analisis lengkap.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          <section
            aria-labelledby="stat-summary-heading"
            className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2
                  id="stat-summary-heading"
                  className="font-display text-base font-semibold text-slate-900"
                >
                  Ringkasan Statistik Hasil Ujian ({mataPelajaran} · {kelasLabel})
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Perhitungan eksak berdasarkan {stats.totalSiswa} peserta didik dengan batas ketuntasan KKTP {kktp}.
                </p>
              </div>

              <div className="no-print flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    exportScoreAnalysisToCSV({
                      mataPelajaran,
                      kelasLabel,
                      kktp,
                      records,
                      stats,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>CSV / Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!resolvedNarrative) return;
                    exportScoreAnalysisToWordDoc({
                      mataPelajaran,
                      kelasLabel,
                      namaSekolah: blueprint.config.namaSekolah,
                      kktp,
                      records,
                      stats,
                      narrative: resolvedNarrative,
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Word Laporan (.doc)</span>
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

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-[11px] font-medium text-slate-500">Nilai Rata-Rata</div>
                <div className="mt-1 font-mono text-xl font-bold text-slate-950 tabular-nums">
                  {stats.rataRata}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                  Median {stats.median} · SD {stats.simpanganBaku}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-[11px] font-medium text-slate-500">Nilai Tertinggi</div>
                <div className="mt-1 font-mono text-xl font-bold text-slate-950 tabular-nums">
                  {stats.nilaiTertinggi}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-slate-600" title={stats.siswaTertinggi.join(', ')}>
                  {stats.siswaTertinggi.join(', ')}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-[11px] font-medium text-slate-500">Nilai Terendah</div>
                <div className="mt-1 font-mono text-xl font-bold text-slate-950 tabular-nums">
                  {stats.nilaiTerendah}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-slate-600" title={stats.siswaTerendah.join(', ')}>
                  {stats.siswaTerendah.join(', ')}
                </div>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                <div className="text-[11px] font-medium text-emerald-800">Siswa Tuntas</div>
                <div className="mt-1 font-mono text-xl font-bold text-emerald-950 tabular-nums">
                  {stats.jumlahTuntas}
                </div>
                <div className="mt-0.5 text-[11px] text-emerald-800 tabular-nums">
                  Nilai ≥ {kktp}
                </div>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                <div className="text-[11px] font-medium text-red-800">Belum Tuntas</div>
                <div className="mt-1 font-mono text-xl font-bold text-red-950 tabular-nums">
                  {stats.jumlahBelumTuntas}
                </div>
                <div className="mt-0.5 text-[11px] text-red-800 tabular-nums">
                  Nilai &lt; {kktp}
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3">
                <div className="text-[11px] font-semibold text-blue-900">Ketuntasan Kelas</div>
                <div className="mt-1 font-mono text-xl font-bold text-blue-950 tabular-nums">
                  {stats.persentaseKetuntasan}%
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
                  <div
                    style={{ width: `${stats.persentaseKetuntasan}%` }}
                    className="h-full bg-blue-800 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 border-t border-slate-100 pt-5 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <h3 className="text-xs font-semibold text-slate-800 mb-2.5">
                  Tabel Rekapitulasi Statistik Evaluasi
                </h3>
                <table className="w-full border-collapse border border-slate-200 text-xs">
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="bg-slate-50 px-3 py-2 font-medium text-slate-700">
                        Jumlah Peserta Ujian
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {stats.totalSiswa} siswa
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-slate-50 px-3 py-2 font-medium text-slate-700">
                        Nilai Rata-Rata (Mean)
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {stats.rataRata}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-slate-50 px-3 py-2 font-medium text-slate-700">
                        Nilai Tertinggi / Nilai Terendah
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {stats.nilaiTertinggi} / {stats.nilaiTerendah}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-slate-50 px-3 py-2 font-medium text-slate-700">
                        Tuntas (≥ {kktp}) / Belum Tuntas (&lt; {kktp})
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {stats.jumlahTuntas} siswa / {stats.jumlahBelumTuntas} siswa
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-slate-50 px-3 py-2 font-medium text-slate-700">
                        Persentase Ketuntasan Klasikal
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-blue-900 tabular-nums">
                        {stats.persentaseKetuntasan}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="lg:col-span-6">
                <h3 className="text-xs font-semibold text-slate-800 mb-2.5">
                  Distribusi Rentang Nilai Siswa
                </h3>
                <div className="space-y-2.5">
                  {stats.distribusi.map((bucket) => {
                    const pct =
                      stats.totalSiswa > 0
                        ? Math.round((bucket.count / stats.totalSiswa) * 100)
                        : 0;
                    return (
                      <div key={bucket.label} className="flex items-center gap-3 text-xs">
                        <span className="w-16 shrink-0 font-mono font-medium text-slate-700 tabular-nums">
                          {bucket.label}
                        </span>
                        <div className="flex-1 h-4 overflow-hidden rounded bg-slate-100">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-slate-800 transition-all duration-200"
                          />
                        </div>
                        <span className="w-24 shrink-0 text-right font-mono text-slate-700 tabular-nums">
                          {bucket.count} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {resolvedNarrative && (
            <section
              aria-labelledby="interpretation-heading"
              className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2
                    id="interpretation-heading"
                    className="font-display text-base font-semibold text-slate-900"
                  >
                    Interpretasi Hasil Evaluasi & Rekomendasi Tindak Lanjut
                  </h2>
                  <p className="mt-1 text-xs font-medium text-slate-700">
                    Status Klasikal:{' '}
                    <span className="text-blue-900 font-semibold">
                      {resolvedNarrative.statusKetuntasanKlasikal}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSubTab('laporan')}
                  className="no-print inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100 transition-colors whitespace-nowrap"
                >
                  <span>Susun Laporan Evaluasi Pembelajaran</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-2">
                  <h3 className="text-xs font-semibold text-slate-900">
                    Interpretasi Hasil Evaluasi
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-700">
                    {resolvedNarrative.ringkasanEksekutif}
                  </p>
                  <p className="text-xs leading-relaxed text-slate-700">
                    {resolvedNarrative.interpretasiHasil}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-2">
                  <h3 className="text-xs font-semibold text-slate-900">
                    Analisis Sebaran & Heterogenitas Kelas
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-700">
                    {resolvedNarrative.analisisSebaranNilai}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-lg border border-red-200 bg-red-50/35 p-4">
                  <h3 className="text-xs font-semibold text-red-950 mb-2">
                    Program Remedial ({stats.jumlahBelumTuntas} Siswa Belum Tuntas)
                  </h3>
                  <ul className="space-y-1.5 text-xs leading-relaxed text-slate-800 list-disc pl-4">
                    {resolvedNarrative.rekomendasiRemedial.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50/35 p-4">
                  <h3 className="text-xs font-semibold text-emerald-950 mb-2">
                    Program Pengayaan ({stats.jumlahTuntas} Siswa Tuntas)
                  </h3>
                  <ul className="space-y-1.5 text-xs leading-relaxed text-slate-800 list-disc pl-4">
                    {resolvedNarrative.rekomendasiPengayaan.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                  <h3 className="text-xs font-semibold text-slate-900 mb-2">
                    Refleksi & Perbaikan Pembelajaran Guru
                  </h3>
                  <ul className="space-y-1.5 text-xs leading-relaxed text-slate-700 list-disc pl-4">
                    {resolvedNarrative.tindakLanjutPembelajaranGuru.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          <section
            aria-labelledby="student-table-heading"
            className="rounded-xl border border-slate-200 bg-white overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
              <div>
                <h2
                  id="student-table-heading"
                  className="font-display text-base font-semibold text-slate-900"
                >
                  Tabel Nilai & Status Ketuntasan Peserta Didik
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Menampilkan {filteredRecords.length} dari {records.length} siswa (KKTP: {kktp}).
                </p>
              </div>

              <div className="no-print flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari nama atau nilai..."
                    aria-label="Cari siswa"
                    className="rounded-lg border border-slate-300 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-blue-700 focus:bg-white focus:outline-none"
                  />
                </div>

                <select
                  aria-label="Filter status ketuntasan"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as 'all' | 'tuntas' | 'belum')
                  }
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                >
                  <option value="all">Semua Status</option>
                  <option value="tuntas">Tuntas (≥ {kktp})</option>
                  <option value="belum">Belum Tuntas (&lt; {kktp})</option>
                </select>

                <select
                  aria-label="Urutkan daftar siswa"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'no' | 'desc' | 'asc')}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700"
                >
                  <option value="no">Urutan Nomor</option>
                  <option value="desc">Nilai Tertinggi</option>
                  <option value="asc">Nilai Terendah</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
                    <th className="w-14 px-3 py-3 text-center">No</th>
                    <th className="px-3 py-3">Nama Siswa</th>
                    <th className="w-24 px-3 py-3 text-right">Nilai</th>
                    <th className="w-28 px-3 py-3 text-right">Selisih KKTP</th>
                    <th className="w-36 px-3 py-3 text-center">Status Ketuntasan</th>
                    <th className="px-3 py-3">Rencana Tindak Lanjut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRecords.map((student) => {
                    const isTuntas = student.nilai >= kktp;
                    const diff = Math.round((student.nilai - kktp) * 10) / 10;
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/75">
                        <td className="px-3 py-2.5 text-center font-mono text-slate-500 tabular-nums">
                          {student.no}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-900">
                          {student.nama}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-950 tabular-nums">
                          {student.nilai}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-right font-mono tabular-nums ${
                            diff >= 0 ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {diff >= 0 ? `+${diff}` : diff}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                              isTuntas
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                : 'border-red-200 bg-red-50 text-red-900'
                            }`}
                          >
                            {isTuntas ? 'Tuntas' : 'Belum Tuntas'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          {isTuntas
                            ? student.nilai >= 90
                              ? 'Pengayaan Mandiri & Tutor Sebaya'
                              : 'Pengayaan Terstruktur'
                            : student.nilai >= kktp - 10
                              ? 'Bimbingan Kelompok & Tes Ulang'
                              : 'Remedial Intensif & Pendampingan Khusus'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
        </>
      )}
    </div>
  );
};
