import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCopy,
  Clock,
  FileText,
  Flag,
  Pause,
  Play,
  Printer,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { GRADE_LABELS } from '../data/smpCurriculum';
import { SAMPLE_EXAM_PAPER } from '../data/sampleExamPaper';
import type {
  ExamFormSubmission,
  ExamPaperPackage,
  KisiBlueprint,
} from '../types/kisiKisi';
import { exportExamSubmissionToWordDoc } from '../utils/exportBlueprint';

export const STORAGE_FORM_SUBMISSIONS_KEY = 'evaluasi_smp_form_submissions_v1';

interface FormUjianViewProps {
  blueprint: KisiBlueprint;
  examPaper: ExamPaperPackage | null;
  onSwitchToGenerator: () => void;
}

function parseMinutesFromAlokasi(alokasi: string): number {
  const match = alokasi.match(/\d+/);
  const mins = match ? parseInt(match[0], 10) : 90;
  return Number.isFinite(mins) && mins > 0 ? mins : 90;
}

function normalizeShortAnswer(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/×/g, 'x')
    .replace(/,/g, '.');
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const FormUjianView: React.FC<FormUjianViewProps> = ({
  blueprint,
  examPaper,
  onSwitchToGenerator,
}) => {
  const [useSamplePaper, setUseSamplePaper] = useState<boolean>(!examPaper);

  useEffect(() => {
    if (examPaper) {
      setUseSamplePaper(false);
    }
  }, [examPaper]);

  const activePaper: ExamPaperPackage =
    !useSamplePaper && examPaper ? examPaper : SAMPLE_EXAM_PAPER;

  const initialSeconds = useMemo(
    () => parseMinutesFromAlokasi(activePaper.alokasiWaktu) * 60,
    [activePaper.alokasiWaktu]
  );

  // Student identity & session config
  const [namaSiswa, setNamaSiswa] = useState<string>('');
  const [nis, setNis] = useState<string>('');
  const [kelasPeserta, setKelasPeserta] = useState<string>(
    GRADE_LABELS[blueprint.config.kelas]
  );
  const [kktp, setKktp] = useState<number>(75);

  // Timer state
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setTimerRunning(false);
  }, [initialSeconds, activePaper.id]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  // Answers & flags
  const [pgAnswers, setPgAnswers] = useState<
    Record<number, 'A' | 'B' | 'C' | 'D' | ''>
  >({});
  const [isianAnswers, setIsianAnswers] = useState<Record<number, string>>({});
  const [uraianAnswers, setUraianAnswers] = useState<Record<number, string>>({});
  const [flaggedKeys, setFlaggedKeys] = useState<Record<string, boolean>>({});

  // Section filter while taking exam
  const [sectionTab, setSectionTab] = useState<'all' | 'pg' | 'isian' | 'uraian'>(
    'all'
  );

  // Submission & review state
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmSubmitPrompt, setConfirmSubmitPrompt] = useState<boolean>(false);
  const [submittedRecord, setSubmittedRecord] =
    useState<ExamFormSubmission | null>(null);
  const [isianScores, setIsianScores] = useState<Record<number, number>>({});
  const [uraianScores, setUraianScores] = useState<Record<number, number>>({});

  // Persisted submissions list
  const [submissions, setSubmissions] = useState<ExamFormSubmission[]>(() => {
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

  const [copiedRecap, setCopiedRecap] = useState<boolean>(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_FORM_SUBMISSIONS_KEY,
        JSON.stringify(submissions)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [submissions]);

  const progressStats = useMemo(() => {
    const totalPG = activePaper.pilihanGanda.length;
    const totalIsian = activePaper.isianSingkat.length;
    const totalUraian = activePaper.uraian.length;
    const totalAll = totalPG + totalIsian + totalUraian;

    const answeredPG = activePaper.pilihanGanda.filter(
      (q) => Boolean(pgAnswers[q.nomor])
    ).length;
    const answeredIsian = activePaper.isianSingkat.filter(
      (q) => Boolean((isianAnswers[q.nomor] || '').trim())
    ).length;
    const answeredUraian = activePaper.uraian.filter(
      (q) => Boolean((uraianAnswers[q.nomor] || '').trim())
    ).length;

    const answeredTotal = answeredPG + answeredIsian + answeredUraian;
    const flaggedCount = Object.values(flaggedKeys).filter(Boolean).length;
    const unansweredTotal = Math.max(0, totalAll - answeredTotal);
    const pct = totalAll > 0 ? Math.round((answeredTotal / totalAll) * 100) : 0;

    return {
      totalAll,
      answeredTotal,
      unansweredTotal,
      flaggedCount,
      pct,
    };
  }, [activePaper, pgAnswers, isianAnswers, uraianAnswers, flaggedKeys]);

  const toggleFlag = (key: string) => {
    setFlaggedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const scrollToQuestion = (elementId: string) => {
    setSectionTab('all');
    window.requestAnimationFrame(() => {
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  };

  const finalizeSubmit = () => {
    const maksPG = activePaper.pilihanGanda.length;
    const skorPG = activePaper.pilihanGanda.reduce((acc, q) => {
      return acc + (pgAnswers[q.nomor] === q.kunciJawaban ? 1 : 0);
    }, 0);

    const initialIsianScores: Record<number, number> = {};
    const maksIsian = activePaper.isianSingkat.length * 2;
    let skorIsian = 0;
    for (const q of activePaper.isianSingkat) {
      const studentNorm = normalizeShortAnswer(isianAnswers[q.nomor] || '');
      const keyNorm = normalizeShortAnswer(q.kunciJawaban);
      const pts = studentNorm && studentNorm === keyNorm ? 2 : 0;
      initialIsianScores[q.nomor] = pts;
      skorIsian += pts;
    }

    const initialUraianScores: Record<number, number> = {};
    const maksUraian = activePaper.uraian.reduce(
      (acc, q) => acc + (q.skorMaksimal || 5),
      0
    );
    for (const q of activePaper.uraian) {
      const hasText = Boolean((uraianAnswers[q.nomor] || '').trim());
      initialUraianScores[q.nomor] = hasText
        ? Math.ceil((q.skorMaksimal || 5) / 2)
        : 0;
    }
    const skorUraian = Object.values(initialUraianScores).reduce(
      (a, b) => a + b,
      0
    );

    const maksTotal = maksPG + maksIsian + maksUraian;
    const totalSkor = skorPG + skorIsian + skorUraian;
    const nilaiAkhir =
      maksTotal > 0 ? Math.round((totalSkor / maksTotal) * 1000) / 10 : 0;

    const record: ExamFormSubmission = {
      id: `sub-${Date.now()}`,
      namaSiswa: namaSiswa.trim(),
      nis: nis.trim(),
      kelas: kelasPeserta.trim() || activePaper.kelasLabel,
      judulUjian: activePaper.judulUjian,
      mataPelajaran: activePaper.mataPelajaran,
      pgAnswers: { ...pgAnswers },
      isianAnswers: { ...isianAnswers },
      uraianAnswers: { ...uraianAnswers },
      skorPG,
      maksPG,
      skorIsian,
      maksIsian,
      skorUraian,
      maksUraian,
      nilaiAkhir,
      durasiDetik: Math.max(0, initialSeconds - secondsLeft),
      submittedAt: new Date().toISOString(),
    };

    setIsianScores(initialIsianScores);
    setUraianScores(initialUraianScores);
    setSubmittedRecord(record);
    setSubmissions((prev) => [record, ...prev]);
    setTimerRunning(false);
    setConfirmSubmitPrompt(false);
    setValidationError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequestSubmit = () => {
    if (!namaSiswa.trim()) {
      setValidationError(
        'Masukkan Nama Lengkap Peserta terlebih dahulu sebelum mengumpulkan ujian.'
      );
      nameInputRef.current?.focus();
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setValidationError(null);

    if (progressStats.unansweredTotal > 0 && !confirmSubmitPrompt) {
      setConfirmSubmitPrompt(true);
      return;
    }

    finalizeSubmit();
  };

  const syncAdjustedScores = (
    nextIsianScores: Record<number, number>,
    nextUraianScores: Record<number, number>
  ) => {
    if (!submittedRecord) return;
    const skorIsian = Object.values(nextIsianScores).reduce((a, b) => a + b, 0);
    const skorUraian = Object.values(nextUraianScores).reduce((a, b) => a + b, 0);
    const maksTotal =
      submittedRecord.maksPG +
      submittedRecord.maksIsian +
      submittedRecord.maksUraian;
    const totalSkor = submittedRecord.skorPG + skorIsian + skorUraian;
    const nilaiAkhir =
      maksTotal > 0 ? Math.round((totalSkor / maksTotal) * 1000) / 10 : 0;

    const updated: ExamFormSubmission = {
      ...submittedRecord,
      skorIsian,
      skorUraian,
      nilaiAkhir,
    };

    setSubmittedRecord(updated);
    setSubmissions((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const handleResetForNewStudent = () => {
    setNamaSiswa('');
    setNis('');
    setPgAnswers({});
    setIsianAnswers({});
    setUraianAnswers({});
    setFlaggedKeys({});
    setSubmittedRecord(null);
    setConfirmSubmitPrompt(false);
    setValidationError(null);
    setSecondsLeft(initialSeconds);
    setTimerRunning(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyRecapForAnalysis = async () => {
    const lines = submissions.map(
      (s, idx) => `${idx + 1}\t${s.namaSiswa}\t${s.nilaiAkhir}`
    );
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopiedRecap(true);
    setTimeout(() => setCopiedRecap(false), 2000);
  };

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="form-ujian-header"
        className="no-print rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2
              id="form-ujian-header"
              className="font-display text-base font-semibold text-slate-900"
            >
              {activePaper.judulUjian} — Lembar Form Ujian Digital
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {activePaper.namaSekolah} · {activePaper.kelasLabel} ·{' '}
              {activePaper.semesterLabel} · Alokasi {activePaper.alokasiWaktu} ·{' '}
              <span className="font-mono tabular-nums">
                {activePaper.pilihanGanda.length} PG,{' '}
                {activePaper.isianSingkat.length} Isian, {activePaper.uraian.length}{' '}
                Uraian
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {examPaper ? (
              <div
                role="group"
                aria-label="Pilih paket soal form"
                className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1"
              >
                <button
                  type="button"
                  onClick={() => {
                    setUseSamplePaper(false);
                    handleResetForNewStudent();
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                    !useSamplePaper
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Naskah Soal Aktif
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseSamplePaper(true);
                    handleResetForNewStudent();
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                    useSamplePaper
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paket Contoh (18 Soal)
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSwitchToGenerator}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100 whitespace-nowrap"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Susun 45 Soal Kisi-Kisi</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap Peserta <span className="text-red-600">*</span>
            </span>
            <input
              ref={nameInputRef}
              type="text"
              value={namaSiswa}
              disabled={Boolean(submittedRecord)}
              onChange={(e) => {
                setNamaSiswa(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Contoh: Aditya Pratama"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none disabled:bg-slate-50 disabled:text-slate-600"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 mb-1">
              NIS / Nomor Absen
            </span>
            <input
              type="text"
              value={nis}
              disabled={Boolean(submittedRecord)}
              onChange={(e) => setNis(e.target.value)}
              placeholder="Contoh: 01 / 2026001"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none disabled:bg-slate-50 disabled:text-slate-600"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 mb-1">
              Kelas / Rombel
            </span>
            <input
              type="text"
              value={kelasPeserta}
              disabled={Boolean(submittedRecord)}
              onChange={(e) => setKelasPeserta(e.target.value)}
              placeholder="Contoh: VIII-A"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none disabled:bg-slate-50 disabled:text-slate-600"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-slate-700 mb-1">
              Batas Ketuntasan (KKTP)
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={kktp}
              onChange={(e) =>
                setKktp(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
            />
          </label>
        </div>

        {validationError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800"
          >
            {validationError}
          </div>
        )}
      </section>

      {submittedRecord ? (
        <div className="space-y-6">
          <section
            aria-labelledby="exam-result-heading"
            className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-900">
                  Bukti Pengumpulan & Koreksi Form Ujian
                </p>
                <h3
                  id="exam-result-heading"
                  className="mt-1 font-display text-xl font-bold text-slate-950"
                >
                  {submittedRecord.namaSiswa}
                  {submittedRecord.nis ? ` · ${submittedRecord.nis}` : ''}
                </h3>
                <p className="mt-0.5 text-xs text-slate-600">
                  {submittedRecord.kelas} · {activePaper.judulUjian} · Durasi
                  pengerjaan:{' '}
                  <span className="font-mono tabular-nums">
                    {formatClock(submittedRecord.durasiDetik)}
                  </span>
                </p>
              </div>

              <div className="no-print flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    exportExamSubmissionToWordDoc(activePaper, submittedRecord, kktp)
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Unduh Lembar Jawaban (.doc)</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Cetak Bukti PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetForNewStudent}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-900 whitespace-nowrap"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Peserta Baru / Ulangi Form</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-[11px] font-medium text-slate-500">
                  Skor Pilihan Ganda
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-slate-950 tabular-nums">
                  {submittedRecord.skorPG} / {submittedRecord.maksPG}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-[11px] font-medium text-slate-500">
                  Skor Isian Singkat
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-slate-950 tabular-nums">
                  {submittedRecord.skorIsian} / {submittedRecord.maksIsian}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-[11px] font-medium text-slate-500">
                  Skor Uraian
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-slate-950 tabular-nums">
                  {submittedRecord.skorUraian} / {submittedRecord.maksUraian}
                </div>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3">
                <div className="text-[11px] font-semibold text-blue-900">
                  Nilai Akhir
                </div>
                <div className="mt-1 font-mono text-2xl font-bold text-blue-950 tabular-nums">
                  {submittedRecord.nilaiAkhir}
                </div>
              </div>
              <div
                className={`rounded-lg border p-3 ${
                  submittedRecord.nilaiAkhir >= kktp
                    ? 'border-emerald-200 bg-emerald-50/60'
                    : 'border-red-200 bg-red-50/60'
                }`}
              >
                <div
                  className={`text-[11px] font-semibold ${
                    submittedRecord.nilaiAkhir >= kktp
                      ? 'text-emerald-900'
                      : 'text-red-900'
                  }`}
                >
                  Status (KKTP {kktp})
                </div>
                <div
                  className={`mt-1 text-base font-bold ${
                    submittedRecord.nilaiAkhir >= kktp
                      ? 'text-emerald-950'
                      : 'text-red-950'
                  }`}
                >
                  {submittedRecord.nilaiAkhir >= kktp
                    ? 'Tuntas'
                    : 'Belum Tuntas'}
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-2">
              {activePaper.pilihanGanda.length > 0 && (
                <div>
                  <h4 className="border-b border-slate-200 pb-2 font-display text-sm font-bold text-slate-900 mb-3">
                    A. Koreksi Otomatis Pilihan Ganda
                  </h4>
                  <div className="space-y-3">
                    {activePaper.pilihanGanda.map((q) => {
                      const chosen = submittedRecord.pgAnswers[q.nomor] || '';
                      const isCorrect = chosen === q.kunciJawaban;
                      return (
                        <div
                          key={q.id}
                          className="rounded-lg border border-slate-200 p-4 text-xs space-y-2"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="text-sm font-medium text-slate-900 flex-1">
                              <span className="font-mono font-bold mr-2 tabular-nums">
                                {q.nomor}.
                              </span>
                              {q.pertanyaan}
                            </p>
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
                                isCorrect
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                  : 'border-red-200 bg-red-50 text-red-900'
                              }`}
                            >
                              {isCorrect ? 'Benar (+1)' : 'Salah (0)'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs">
                            <span>
                              Jawaban Peserta:{' '}
                              <strong className="font-mono text-slate-950">
                                {chosen ? `${chosen}. ${q.pilihan[chosen]}` : 'Tidak dijawab'}
                              </strong>
                            </span>
                            <span className="text-emerald-900">
                              Kunci:{' '}
                              <strong className="font-mono">
                                {q.kunciJawaban}. {q.pilihan[q.kunciJawaban]}
                              </strong>
                            </span>
                          </div>
                          <p className="text-slate-600">
                            <strong className="text-slate-800">Pembahasan:</strong>{' '}
                            {q.pembahasan}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activePaper.isianSingkat.length > 0 && (
                <div>
                  <h4 className="border-b border-slate-200 pb-2 font-display text-sm font-bold text-slate-900 mb-3">
                    B. Koreksi & Verifikasi Skor Isian Singkat (Maks 2/soal)
                  </h4>
                  <div className="space-y-3">
                    {activePaper.isianSingkat.map((q) => {
                      const ans = submittedRecord.isianAnswers[q.nomor] || '';
                      const score = isianScores[q.nomor] ?? 0;
                      return (
                        <div
                          key={q.id}
                          className="rounded-lg border border-slate-200 p-4 text-xs space-y-2"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <p className="text-sm font-medium text-slate-900 flex-1">
                              <span className="font-mono font-bold mr-2 tabular-nums">
                                {q.nomor}.
                              </span>
                              {q.pertanyaan}
                            </p>
                            <div className="no-print flex items-center gap-1.5 shrink-0">
                              <span className="text-[11px] font-semibold text-slate-600">
                                Skor:
                              </span>
                              {[0, 1, 2].map((pts) => (
                                <button
                                  key={pts}
                                  type="button"
                                  onClick={() => {
                                    const next = { ...isianScores, [q.nomor]: pts };
                                    setIsianScores(next);
                                    syncAdjustedScores(next, uraianScores);
                                  }}
                                  className={`h-7 w-7 rounded border font-mono text-xs font-semibold tabular-nums ${
                                    score === pts
                                      ? 'border-blue-800 bg-blue-800 text-white'
                                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  {pts}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                              <span className="font-semibold text-slate-700">
                                Jawaban Peserta:
                              </span>{' '}
                              <span className="font-mono text-slate-950">
                                {ans.trim() || '(Kosong)'}
                              </span>
                            </div>
                            <div className="rounded border border-emerald-200 bg-emerald-50/50 px-3 py-2">
                              <span className="font-semibold text-emerald-900">
                                Kunci Jawaban:
                              </span>{' '}
                              <span className="font-mono font-semibold text-emerald-950">
                                {q.kunciJawaban}
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-600">{q.pedomanPenskoran}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activePaper.uraian.length > 0 && (
                <div>
                  <h4 className="border-b border-slate-200 pb-2 font-display text-sm font-bold text-slate-900 mb-3">
                    C. Penilaian Rubrik Uraian (Sesuaikan Skor Guru)
                  </h4>
                  <div className="space-y-3">
                    {activePaper.uraian.map((q) => {
                      const ans = submittedRecord.uraianAnswers[q.nomor] || '';
                      const maxPts = q.skorMaksimal || 5;
                      const score = uraianScores[q.nomor] ?? 0;
                      return (
                        <div
                          key={q.id}
                          className="rounded-lg border border-slate-200 p-4 text-xs space-y-2.5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <p className="text-sm font-medium text-slate-900 flex-1">
                              <span className="font-mono font-bold mr-2 tabular-nums">
                                {q.nomor}.
                              </span>
                              {q.pertanyaan}
                            </p>
                            <label className="no-print flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-semibold text-slate-700">
                                Skor (0–{maxPts}):
                              </span>
                              <input
                                type="number"
                                min={0}
                                max={maxPts}
                                value={score}
                                onChange={(e) => {
                                  const val = Math.max(
                                    0,
                                    Math.min(maxPts, Number(e.target.value) || 0)
                                  );
                                  const next = { ...uraianScores, [q.nomor]: val };
                                  setUraianScores(next);
                                  syncAdjustedScores(isianScores, next);
                                }}
                                className="w-16 rounded-md border border-slate-300 px-2 py-1 text-center font-mono text-xs font-bold text-slate-950 tabular-nums focus:border-blue-700 focus:outline-none"
                              />
                            </label>
                          </div>

                          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                            <div className="rounded border border-slate-200 bg-slate-50 p-3">
                              <div className="font-semibold text-slate-800 mb-1">
                                Jawaban Peserta:
                              </div>
                              <p className="whitespace-pre-line text-slate-900">
                                {ans.trim() || '(Tidak menjawab)'}
                              </p>
                            </div>
                            <div className="rounded border border-emerald-200 bg-emerald-50/40 p-3">
                              <div className="font-semibold text-emerald-900 mb-1">
                                Kunci Penyelesaian:
                              </div>
                              <p className="whitespace-pre-line text-emerald-950">
                                {q.kunciJawaban}
                              </p>
                            </div>
                          </div>

                          <p className="whitespace-pre-line text-slate-600">
                            <strong className="text-slate-800">
                              Pedoman Penskoran:
                            </strong>{' '}
                            {q.pedomanPenskoran}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div
                role="tablist"
                aria-label="Filter bagian form ujian"
                className="flex flex-wrap items-center gap-1"
              >
                {(
                  [
                    { id: 'all', label: 'Semua Bagian' },
                    {
                      id: 'pg',
                      label: `A. Pilihan Ganda (${activePaper.pilihanGanda.length})`,
                    },
                    {
                      id: 'isian',
                      label: `B. Isian (${activePaper.isianSingkat.length})`,
                    },
                    {
                      id: 'uraian',
                      label: `C. Uraian (${activePaper.uraian.length})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={sectionTab === tab.id}
                    onClick={() => setSectionTab(tab.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      sectionTab === tab.id
                        ? 'bg-blue-800 text-white font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <span className="font-mono text-xs text-slate-600 tabular-nums">
                Terjawab: <strong>{progressStats.answeredTotal}</strong> /{' '}
                {progressStats.totalAll}
              </span>
            </div>

            {(sectionTab === 'all' || sectionTab === 'pg') &&
              activePaper.pilihanGanda.length > 0 && (
                <section
                  aria-labelledby="form-pg-title"
                  className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5"
                >
                  <div className="border-b border-slate-100 pb-3">
                    <h3
                      id="form-pg-title"
                      className="font-display text-base font-bold text-slate-950"
                    >
                      Bagian A. Pilihan Ganda ({activePaper.pilihanGanda.length}{' '}
                      Soal)
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Pilih satu jawaban yang paling tepat (A, B, C, atau D).
                    </p>
                  </div>

                  <div className="space-y-6">
                    {activePaper.pilihanGanda.map((q) => {
                      const selected = pgAnswers[q.nomor] || '';
                      const flagKey = `pg-${q.nomor}`;
                      const isFlagged = Boolean(flaggedKeys[flagKey]);
                      return (
                        <fieldset
                          key={q.id}
                          id={`soal-pg-${q.nomor}`}
                          className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <legend className="text-sm font-medium leading-relaxed text-slate-950">
                              <span className="font-mono font-bold mr-2 tabular-nums">
                                {q.nomor}.
                              </span>
                              {q.stimulus && q.stimulus !== '-' && (
                                <span className="mb-2 block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-normal leading-relaxed text-slate-800 whitespace-pre-line">
                                  {q.stimulus}
                                </span>
                              )}
                              {q.pertanyaan}
                            </legend>
                            <button
                              type="button"
                              onClick={() => toggleFlag(flagKey)}
                              aria-pressed={isFlagged}
                              className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                                isFlagged
                                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                                  : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <Flag className="h-3 w-3" aria-hidden="true" />
                              <span>{isFlagged ? 'Ragu-ragu' : 'Tandai'}</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                              const checked = selected === opt;
                              return (
                                <label
                                  key={opt}
                                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs transition-colors ${
                                    checked
                                      ? 'border-blue-800 bg-blue-50/70 text-blue-950 font-semibold'
                                      : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`pg-${q.nomor}`}
                                    value={opt}
                                    checked={checked}
                                    onChange={() =>
                                      setPgAnswers((prev) => ({
                                        ...prev,
                                        [q.nomor]: opt,
                                      }))
                                    }
                                    className="mt-0.5 h-4 w-4 shrink-0 accent-blue-800"
                                  />
                                  <span className="leading-relaxed">
                                    <span className="font-mono font-bold mr-1.5">
                                      {opt}.
                                    </span>
                                    {q.pilihan[opt]}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </fieldset>
                      );
                    })}
                  </div>
                </section>
              )}

            {(sectionTab === 'all' || sectionTab === 'isian') &&
              activePaper.isianSingkat.length > 0 && (
                <section
                  aria-labelledby="form-isian-title"
                  className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5"
                >
                  <div className="border-b border-slate-100 pb-3">
                    <h3
                      id="form-isian-title"
                      className="font-display text-base font-bold text-slate-950"
                    >
                      Bagian B. Isian Singkat ({activePaper.isianSingkat.length}{' '}
                      Soal)
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Ketikkan jawaban singkat yang paling tepat pada kolom yang tersedia.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {activePaper.isianSingkat.map((q) => {
                      const val = isianAnswers[q.nomor] || '';
                      const flagKey = `isian-${q.nomor}`;
                      const isFlagged = Boolean(flaggedKeys[flagKey]);
                      return (
                        <div
                          key={q.id}
                          id={`soal-isian-${q.nomor}`}
                          className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <label
                              htmlFor={`input-isian-${q.nomor}`}
                              className="text-sm font-medium leading-relaxed text-slate-950 flex-1"
                            >
                              <span className="font-mono font-bold mr-2 tabular-nums">
                                {q.nomor}.
                              </span>
                              {q.stimulus && q.stimulus !== '-' && (
                                <span className="mb-2 block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-normal leading-relaxed text-slate-800 whitespace-pre-line">
                                  {q.stimulus}
                                </span>
                              )}
                              {q.pertanyaan}
                            </label>
                            <button
                              type="button"
                              onClick={() => toggleFlag(flagKey)}
                              aria-pressed={isFlagged}
                              className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                                isFlagged
                                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                                  : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <Flag className="h-3 w-3" aria-hidden="true" />
                              <span>{isFlagged ? 'Ragu-ragu' : 'Tandai'}</span>
                            </button>
                          </div>

                          <input
                            id={`input-isian-${q.nomor}`}
                            type="text"
                            value={val}
                            onChange={(e) =>
                              setIsianAnswers((prev) => ({
                                ...prev,
                                [q.nomor]: e.target.value,
                              }))
                            }
                            placeholder="Tulis jawaban singkat Anda di sini..."
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

            {(sectionTab === 'all' || sectionTab === 'uraian') &&
              activePaper.uraian.length > 0 && (
                <section
                  aria-labelledby="form-uraian-title"
                  className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5"
                >
                  <div className="border-b border-slate-100 pb-3">
                    <h3
                      id="form-uraian-title"
                      className="font-display text-base font-bold text-slate-950"
                    >
                      Bagian C. Uraian ({activePaper.uraian.length} Soal)
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Tuliskan langkah penyelesaian dan kesimpulan secara runtut dan jelas.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {activePaper.uraian.map((q) => {
                      const val = uraianAnswers[q.nomor] || '';
                      const flagKey = `uraian-${q.nomor}`;
                      const isFlagged = Boolean(flaggedKeys[flagKey]);
                      return (
                        <div
                          key={q.id}
                          id={`soal-uraian-${q.nomor}`}
                          className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <label
                              htmlFor={`input-uraian-${q.nomor}`}
                              className="text-sm font-medium leading-relaxed text-slate-950 flex-1"
                            >
                              <span className="font-mono font-bold mr-2 tabular-nums">
                                {q.nomor}.
                              </span>
                              {q.stimulus && q.stimulus !== '-' && (
                                <span className="mb-2 block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-normal leading-relaxed text-slate-800 whitespace-pre-line">
                                  {q.stimulus}
                                </span>
                              )}
                              {q.pertanyaan}
                              <span className="ml-2 font-mono text-xs font-normal text-slate-500 tabular-nums">
                                (Skor Maks: {q.skorMaksimal})
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => toggleFlag(flagKey)}
                              aria-pressed={isFlagged}
                              className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                                isFlagged
                                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                                  : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <Flag className="h-3 w-3" aria-hidden="true" />
                              <span>{isFlagged ? 'Ragu-ragu' : 'Tandai'}</span>
                            </button>
                          </div>

                          <textarea
                            id={`input-uraian-${q.nomor}`}
                            rows={4}
                            value={val}
                            onChange={(e) =>
                              setUraianAnswers((prev) => ({
                                ...prev,
                                [q.nomor]: e.target.value,
                              }))
                            }
                            placeholder="Tuliskan langkah pengerjaan atau uraian jawaban Anda di sini..."
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
          </div>

          <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Clock className="h-4 w-4 text-blue-800" aria-hidden="true" />
                  <span>Sisa Waktu Ujian</span>
                </div>
                <span
                  className={`font-mono text-lg font-bold tabular-nums ${
                    secondsLeft <= 300 ? 'text-red-700' : 'text-slate-950'
                  }`}
                >
                  {formatClock(secondsLeft)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimerRunning((r) => !r)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {timerRunning ? (
                    <>
                      <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Jeda Timer</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Jalankan Timer</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setSecondsLeft(initialSeconds);
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Reset</span>
                </button>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">
                    Progres Pengerjaan
                  </span>
                  <span className="font-mono font-semibold text-blue-900 tabular-nums">
                    {progressStats.answeredTotal}/{progressStats.totalAll} ({progressStats.pct}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    style={{ width: `${progressStats.pct}%` }}
                    className="h-full bg-blue-800 transition-all duration-200"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 tabular-nums">
                  <span>Terjawab: {progressStats.answeredTotal}</span>
                  <span>Ragu: {progressStats.flaggedCount}</span>
                  <span>Kosong: {progressStats.unansweredTotal}</span>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div className="text-xs font-semibold text-slate-800">
                  Navigasi Nomor Soal
                </div>

                {activePaper.pilihanGanda.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-[11px] font-medium text-slate-500">
                      Pilihan Ganda
                    </div>
                    <div className="grid grid-cols-6 gap-1.5">
                      {activePaper.pilihanGanda.map((q) => {
                        const answered = Boolean(pgAnswers[q.nomor]);
                        const flagged = Boolean(flaggedKeys[`pg-${q.nomor}`]);
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => scrollToQuestion(`soal-pg-${q.nomor}`)}
                            className={`h-8 rounded border font-mono text-xs font-semibold tabular-nums transition-colors ${
                              flagged
                                ? 'border-amber-400 bg-amber-50 text-amber-950'
                                : answered
                                  ? 'border-blue-800 bg-blue-800 text-white'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {q.nomor}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activePaper.isianSingkat.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-[11px] font-medium text-slate-500">
                      Isian Singkat
                    </div>
                    <div className="grid grid-cols-6 gap-1.5">
                      {activePaper.isianSingkat.map((q) => {
                        const answered = Boolean(
                          (isianAnswers[q.nomor] || '').trim()
                        );
                        const flagged = Boolean(flaggedKeys[`isian-${q.nomor}`]);
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() =>
                              scrollToQuestion(`soal-isian-${q.nomor}`)
                            }
                            className={`h-8 rounded border font-mono text-xs font-semibold tabular-nums transition-colors ${
                              flagged
                                ? 'border-amber-400 bg-amber-50 text-amber-950'
                                : answered
                                  ? 'border-blue-800 bg-blue-800 text-white'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            I{q.nomor}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activePaper.uraian.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-[11px] font-medium text-slate-500">
                      Uraian
                    </div>
                    <div className="grid grid-cols-6 gap-1.5">
                      {activePaper.uraian.map((q) => {
                        const answered = Boolean(
                          (uraianAnswers[q.nomor] || '').trim()
                        );
                        const flagged = Boolean(
                          flaggedKeys[`uraian-${q.nomor}`]
                        );
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() =>
                              scrollToQuestion(`soal-uraian-${q.nomor}`)
                            }
                            className={`h-8 rounded border font-mono text-xs font-semibold tabular-nums transition-colors ${
                              flagged
                                ? 'border-amber-400 bg-amber-50 text-amber-950'
                                : answered
                                  ? 'border-blue-800 bg-blue-800 text-white'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            U{q.nomor}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-xs bg-blue-800" />
                    Terjawab
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-xs border border-amber-400 bg-amber-50" />
                    Ragu-ragu
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-xs border border-slate-300 bg-white" />
                    Kosong
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2.5">
                {confirmSubmitPrompt && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 space-y-2">
                    <p className="font-medium">
                      Masih terdapat{' '}
                      <strong className="font-mono tabular-nums">
                        {progressStats.unansweredTotal}
                      </strong>{' '}
                      soal yang belum diisi. Kumpulkan jawaban sekarang?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={finalizeSubmit}
                        className="flex-1 rounded-md bg-blue-800 px-3 py-1.5 font-semibold text-white hover:bg-blue-900"
                      >
                        Ya, Kumpulkan
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmSubmitPrompt(false)}
                        className="rounded-md border border-amber-300 bg-white px-3 py-1.5 font-medium text-amber-950 hover:bg-amber-100"
                      >
                        Periksa Lagi
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRequestSubmit}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-900"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  <span>Kumpulkan Jawaban Ujian</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {submissions.length > 0 && (
        <section
          aria-labelledby="rekap-peserta-heading"
          className="no-print rounded-xl border border-slate-200 bg-white overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
            <div>
              <h3
                id="rekap-peserta-heading"
                className="font-display text-base font-semibold text-slate-900"
              >
                Rekap Hasil Pengumpulan Form Ujian ({submissions.length} Peserta)
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Nilai yang terkumpul tersimpan otomatis dan dapat disalin atau dimuat ke menu Evaluasi Hasil.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyRecapForAnalysis}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                {copiedRecap ? (
                  <>
                    <CheckCircle2
                      className="h-3.5 w-3.5 text-emerald-700"
                      aria-hidden="true"
                    />
                    <span>Tersalin (Format Excel)</span>
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Salin Nilai (Excel/Analisis)</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSubmissions([])}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Kosongkan Rekap</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
                  <th className="w-12 px-3 py-2.5 text-center">No</th>
                  <th className="px-3 py-2.5">Nama Peserta</th>
                  <th className="px-3 py-2.5">NIS</th>
                  <th className="px-3 py-2.5">Kelas</th>
                  <th className="px-3 py-2.5 text-right">PG</th>
                  <th className="px-3 py-2.5 text-right">Isian</th>
                  <th className="px-3 py-2.5 text-right">Uraian</th>
                  <th className="px-3 py-2.5 text-right">Nilai Akhir</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="w-16 px-3 py-2.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {submissions.map((sub, idx) => {
                  const isTuntas = sub.nilaiAkhir >= kktp;
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/75">
                      <td className="px-3 py-2.5 text-center font-mono text-slate-500 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-900">
                        {sub.namaSiswa}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-600 tabular-nums">
                        {sub.nis || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">{sub.kelas}</td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                        {sub.skorPG}/{sub.maksPG}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                        {sub.skorIsian}/{sub.maksIsian}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                        {sub.skorUraian}/{sub.maksUraian}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-950 tabular-nums">
                        {sub.nilaiAkhir}
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
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          aria-label={`Hapus hasil ${sub.namaSiswa}`}
                          onClick={() =>
                            setSubmissions((prev) =>
                              prev.filter((item) => item.id !== sub.id)
                            )
                          }
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
