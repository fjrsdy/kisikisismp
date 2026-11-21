import React, { useMemo, useState } from 'react';
import {
  ClipboardList,
  FileCheck2,
  FileText,
  Loader2,
  Pencil,
  Printer,
  Sparkles,
  X,
} from 'lucide-react';
import { GRADE_LABELS, SEMESTER_LABELS } from '../data/smpCurriculum';
import type {
  DifficultyLevel,
  EssayQuestion,
  ExamPaperPackage,
  KisiBlueprint,
  MultipleChoiceQuestion,
  ShortAnswerQuestion,
} from '../types/kisiKisi';
import { postApiJson } from '../utils/apiClient';
import { buildMarkdownTable, exportExamPaperToWordDoc } from '../utils/exportBlueprint';
import { generateLocalExamPaper } from '../utils/localEvaluationEngine';
import { FormUjianView } from './FormUjianView';

interface NaskahSoalViewProps {
  blueprint: KisiBlueprint;
  examPaper: ExamPaperPackage | null;
  onUpdateExamPaper: (next: ExamPaperPackage) => void;
}

type SourceMode = 'active' | 'paste';
type PaperViewMode = 'teacher' | 'student' | 'keys';
type SectionFilter = 'all' | 'pg' | 'isian' | 'uraian';

const DIFFICULTY_STYLES: Record<DifficultyLevel, string> = {
  Mudah: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  Sedang: 'border-sky-200 bg-sky-50 text-sky-900',
  Sukar: 'border-amber-200 bg-amber-50 text-amber-900',
};

export const NaskahSoalView: React.FC<NaskahSoalViewProps> = ({
  blueprint,
  examPaper,
  onUpdateExamPaper,
}) => {
  const [sourceMode, setSourceMode] = useState<SourceMode>('active');
  const [pastedKisi, setPastedKisi] = useState<string>('');
  const [jumlahPG, setJumlahPG] = useState<number>(30);
  const [jumlahIsian, setJumlahIsian] = useState<number>(10);
  const [jumlahUraian, setJumlahUraian] = useState<number>(5);

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [subTab, setSubTab] = useState<'composer' | 'form'>('composer');
  const [viewMode, setViewMode] = useState<PaperViewMode>('teacher');
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');

  const [editingPG, setEditingPG] = useState<MultipleChoiceQuestion | null>(null);
  const [editingIsian, setEditingIsian] = useState<ShortAnswerQuestion | null>(null);
  const [editingUraian, setEditingUraian] = useState<EssayQuestion | null>(null);

  const totalRequested = jumlahPG + jumlahIsian + jumlahUraian;

  const activeKisiSummaryText = useMemo(
    () => buildMarkdownTable(blueprint),
    [blueprint]
  );

  const handleCopyActiveToPaste = () => {
    setPastedKisi(activeKisiSummaryText);
    setSourceMode('paste');
  };

  const handleGenerate = async () => {
    const kisiPayload =
      sourceMode === 'active' ? activeKisiSummaryText : pastedKisi.trim();

    if (kisiPayload.length < 20) {
      setErrorMsg(
        'Tempelkan kisi-kisi terlebih dahulu (minimal mencakup materi dan indikator pembelajaran).'
      );
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    const payload = {
      kisiKisiText: kisiPayload,
      mataPelajaran: blueprint.config.mataPelajaran,
      kelasLabel: GRADE_LABELS[blueprint.config.kelas],
      semesterLabel: SEMESTER_LABELS[blueprint.config.semester],
      jenisUjian: blueprint.config.jenisUjian,
      namaSekolah: blueprint.config.namaSekolah,
      tahunAjaran: blueprint.config.tahunAjaran,
      alokasiWaktu: blueprint.config.alokasiWaktu,
      jumlahPG,
      jumlahIsian,
      jumlahUraian,
    };

    try {
      const data = await postApiJson<ExamPaperPackage>(
        '/api/naskah-soal/generate',
        payload,
        () => generateLocalExamPaper(payload)
      );

      onUpdateExamPaper(data);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Terjadi gangguan saat menyusun naskah soal.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const difficultyStats = useMemo(() => {
    if (!examPaper) return null;
    const allItems = [
      ...examPaper.pilihanGanda,
      ...examPaper.isianSingkat,
      ...examPaper.uraian,
    ];
    const total = allItems.length;
    const counts: Record<DifficultyLevel, number> = {
      Mudah: 0,
      Sedang: 0,
      Sukar: 0,
    };
    for (const item of allItems) {
      counts[item.tingkatKesulitan] = (counts[item.tingkatKesulitan] || 0) + 1;
    }
    return { total, counts };
  }, [examPaper]);

  const filteredPG = useMemo(() => {
    if (!examPaper) return [];
    if (difficultyFilter === 'ALL') return examPaper.pilihanGanda;
    return examPaper.pilihanGanda.filter(
      (q) => q.tingkatKesulitan === difficultyFilter
    );
  }, [examPaper, difficultyFilter]);

  const filteredIsian = useMemo(() => {
    if (!examPaper) return [];
    if (difficultyFilter === 'ALL') return examPaper.isianSingkat;
    return examPaper.isianSingkat.filter(
      (q) => q.tingkatKesulitan === difficultyFilter
    );
  }, [examPaper, difficultyFilter]);

  const filteredUraian = useMemo(() => {
    if (!examPaper) return [];
    if (difficultyFilter === 'ALL') return examPaper.uraian;
    return examPaper.uraian.filter(
      (q) => q.tingkatKesulitan === difficultyFilter
    );
  }, [examPaper, difficultyFilter]);

  const handleSavePG = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examPaper || !editingPG) return;
    onUpdateExamPaper({
      ...examPaper,
      pilihanGanda: examPaper.pilihanGanda.map((q) =>
        q.id === editingPG.id ? editingPG : q
      ),
    });
    setEditingPG(null);
  };

  const handleSaveIsian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examPaper || !editingIsian) return;
    onUpdateExamPaper({
      ...examPaper,
      isianSingkat: examPaper.isianSingkat.map((q) =>
        q.id === editingIsian.id ? editingIsian : q
      ),
    });
    setEditingIsian(null);
  };

  const handleSaveUraian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examPaper || !editingUraian) return;
    onUpdateExamPaper({
      ...examPaper,
      uraian: examPaper.uraian.map((q) =>
        q.id === editingUraian.id ? editingUraian : q
      ),
    });
    setEditingUraian(null);
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h1
            style={{ textWrap: 'balance' }}
            className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]"
          >
            {subTab === 'composer'
              ? 'Penyusun Naskah Soal Ujian Semester'
              : 'Form Ujian Digital Interaktif'}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            {subTab === 'composer'
              ? 'Susun naskah soal lengkap (30 Pilihan Ganda, 10 Isian Singkat, dan 5 Uraian) langsung dari kisi-kisi aktif atau dengan menempelkan kisi-kisi Anda sendiri, lengkap dengan variasi tingkat kesulitan dan kunci jawaban.'
              : 'Isi dan ujicobakan naskah ujian dalam bentuk formulir digital interaktif lengkap dengan identitas peserta, timer ujian, navigasi nomor soal, koreksi otomatis, dan rekap nilai.'}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Sub-halaman Naskah Soal & Form Ujian"
          className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-100 p-1 self-start lg:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'composer'}
            onClick={() => setSubTab('composer')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              subTab === 'composer'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>1. Penyusun Naskah Soal</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'form'}
            onClick={() => setSubTab('form')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              subTab === 'form'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
            <span>2. Form Ujian Digital</span>
          </button>
        </div>
      </div>

      {subTab === 'form' ? (
        <FormUjianView
          blueprint={blueprint}
          examPaper={examPaper}
          onSwitchToGenerator={() => setSubTab('composer')}
        />
      ) : (
        <>

      <section
        aria-labelledby="naskah-config-title"
        className="no-print rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2
              id="naskah-config-title"
              className="font-display text-base font-semibold text-slate-900"
            >
              Sumber Kisi-Kisi & Komposisi Naskah Soal
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Setiap butir soal disusun sesuai indikator pembelajaran, jenjang perkembangan siswa, dan variasi tingkat kesulitan.
            </p>
          </div>

          <div
            role="group"
            aria-label="Sumber kisi-kisi"
            className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1"
          >
            <button
              type="button"
              onClick={() => setSourceMode('active')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                sourceMode === 'active'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gunakan Kisi-Kisi Aktif
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('paste')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                sourceMode === 'paste'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tempel Kisi-Kisi
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {sourceMode === 'active' ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      Kisi-Kisi Aktif: {blueprint.config.mataPelajaran}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-600">
                      {GRADE_LABELS[blueprint.config.kelas]}
                      <span aria-hidden="true" className="mx-1.5 text-slate-300">
                        ·
                      </span>
                      {SEMESTER_LABELS[blueprint.config.semester]}
                      <span aria-hidden="true" className="mx-1.5 text-slate-300">
                        ·
                      </span>
                      <span className="font-mono tabular-nums">
                        {blueprint.rows.length} baris indikator
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyActiveToPaste}
                    className="text-xs font-medium text-blue-800 hover:underline whitespace-nowrap"
                  >
                    Sunting sebagai teks
                  </button>
                </div>

                <div className="mt-3 max-h-36 overflow-y-auto border-t border-slate-200 pt-2.5 text-xs text-slate-700 space-y-1.5">
                  {blueprint.rows.map((r) => (
                    <div key={r.id} className="leading-snug">
                      <span className="font-mono font-semibold text-slate-900">
                        {r.no}. [{r.levelKognitif}]
                      </span>{' '}
                      <span className="font-medium text-slate-800">{r.materi}:</span>{' '}
                      <span>{r.indikatorSoal}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="paste-kisi-textarea"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Tempelkan Kisi-Kisi (Tabel Excel/Word, Markdown, atau Teks)
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyActiveToPaste}
                    className="text-xs font-medium text-blue-800 hover:underline whitespace-nowrap"
                  >
                    Muat dari kisi-kisi aktif
                  </button>
                </div>
                <textarea
                  id="paste-kisi-textarea"
                  rows={6}
                  value={pastedKisi}
                  onChange={(e) => setPastedKisi(e.target.value)}
                  placeholder="Tempelkan daftar Capaian Pembelajaran, Tujuan Pembelajaran, Materi, Indikator Soal, dan Level Kognitif C1–C6 di sini..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs leading-relaxed text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                />
              </div>
            )}
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-4 lg:col-span-5 lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0">
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  Komposisi Jumlah Butir Soal
                </span>
                <span className="font-mono text-xs font-medium text-slate-600 tabular-nums">
                  Total: {totalRequested} Soal
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <label className="block rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
                  <span className="block text-[11px] font-medium text-slate-600">
                    Pilihan Ganda
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={jumlahPG}
                    onChange={(e) =>
                      setJumlahPG(
                        Math.max(0, Math.min(50, Number(e.target.value) || 0))
                      )
                    }
                    className="mt-0.5 w-full bg-transparent font-mono text-sm font-semibold text-slate-900 tabular-nums focus:outline-none"
                  />
                </label>

                <label className="block rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
                  <span className="block text-[11px] font-medium text-slate-600">
                    Isian Singkat
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    value={jumlahIsian}
                    onChange={(e) =>
                      setJumlahIsian(
                        Math.max(0, Math.min(25, Number(e.target.value) || 0))
                      )
                    }
                    className="mt-0.5 w-full bg-transparent font-mono text-sm font-semibold text-slate-900 tabular-nums focus:outline-none"
                  />
                </label>

                <label className="block rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
                  <span className="block text-[11px] font-medium text-slate-600">
                    Uraian
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={jumlahUraian}
                    onChange={(e) =>
                      setJumlahUraian(
                        Math.max(0, Math.min(15, Number(e.target.value) || 0))
                      )
                    }
                    className="mt-0.5 w-full bg-transparent font-mono text-sm font-semibold text-slate-900 tabular-nums focus:outline-none"
                  />
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || totalRequested <= 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>
                    Menyusun {jumlahPG} PG, {jumlahIsian} Isian, {jumlahUraian} Uraian...
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span>Susun {totalRequested} Soal Ujian Semester</span>
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

      {!examPaper ? (
        <section className="no-print rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <FileCheck2 className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <h3 className="mt-3 font-display text-base font-semibold text-slate-900">
            Siap Menyusun Naskah Soal Ujian Semester
          </h3>
          <p className="mx-auto mt-1.5 max-w-xl text-xs leading-relaxed text-slate-600">
            Klik tombol <strong>Susun {totalRequested} Soal Ujian Semester</strong> di atas untuk menghasilkan paket naskah lengkap ({jumlahPG} Pilihan Ganda, {jumlahIsian} Isian Singkat, dan {jumlahUraian} Uraian) beserta kunci jawaban, pembahasan, pedoman penskoran, dan pemetaan tingkat kesulitan.
          </p>
        </section>
      ) : (
        <div className="space-y-6">
          {difficultyStats && (
            <section className="no-print rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900">
                    {examPaper.judulUjian}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {examPaper.kelasLabel} · {examPaper.semesterLabel} · Total{' '}
                    <span className="font-mono font-semibold text-slate-800 tabular-nums">
                      {difficultyStats.total}
                    </span>{' '}
                    Butir ({examPaper.pilihanGanda.length} PG,{' '}
                    {examPaper.isianSingkat.length} Isian, {examPaper.uraian.length}{' '}
                    Uraian)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs tabular-nums">
                  {(['Mudah', 'Sedang', 'Sukar'] as DifficultyLevel[]).map((lvl) => {
                    const count = difficultyStats.counts[lvl] || 0;
                    const pct =
                      difficultyStats.total > 0
                        ? Math.round((count / difficultyStats.total) * 100)
                        : 0;
                    return (
                      <span
                        key={lvl}
                        className={`rounded-md border px-2.5 py-1 font-medium ${DIFFICULTY_STYLES[lvl]}`}
                      >
                        {lvl}: <strong className="font-mono">{count}</strong> ({pct}%)
                      </span>
                    );
                  })}
                </div>
              </div>

              {examPaper.catatanPenyusun && (
                <p className="mt-3 text-xs leading-relaxed text-slate-700">
                  <strong className="font-semibold text-slate-900">
                    Catatan Penyusun Soal:{' '}
                  </strong>
                  {examPaper.catatanPenyusun}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    role="group"
                    aria-label="Mode tampilan naskah"
                    className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
                  >
                    {(
                      [
                        { id: 'teacher', label: 'Naskah + Kunci & Indikator' },
                        { id: 'student', label: 'Naskah Soal Siswa' },
                        { id: 'keys', label: 'Ringkasan Kunci & Rubrik' },
                      ] as { id: PaperViewMode; label: string }[]
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setViewMode(m.id)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                          viewMode === m.id
                            ? 'bg-white text-slate-900 shadow-xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {viewMode !== 'keys' && (
                    <>
                      <select
                        aria-label="Filter bagian soal"
                        value={sectionFilter}
                        onChange={(e) =>
                          setSectionFilter(e.target.value as SectionFilter)
                        }
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-700 focus:outline-none"
                      >
                        <option value="all">Semua Bagian (A, B, C)</option>
                        <option value="pg">Bagian A: Pilihan Ganda</option>
                        <option value="isian">Bagian B: Isian Singkat</option>
                        <option value="uraian">Bagian C: Uraian</option>
                      </select>

                      <select
                        aria-label="Filter tingkat kesulitan"
                        value={difficultyFilter}
                        onChange={(e) => setDifficultyFilter(e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-700 focus:outline-none"
                      >
                        <option value="ALL">Semua Kesulitan</option>
                        <option value="Mudah">Mudah</option>
                        <option value="Sedang">Sedang</option>
                        <option value="Sukar">Sukar</option>
                      </select>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSubTab('form')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100 whitespace-nowrap"
                  >
                    <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Buka Form Ujian</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportExamPaperToWordDoc(examPaper, false)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Word Naskah Siswa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportExamPaperToWordDoc(examPaper, true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Word Kunci & Rubrik</span>
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
              </div>
            </section>
          )}

          <article className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            <header className="border-b-2 border-slate-900 pb-4 text-center">
              <h2 className="font-display text-base font-bold uppercase tracking-wide text-slate-950 sm:text-lg">
                {examPaper.judulUjian}
                {viewMode === 'teacher'
                  ? ' — Naskah Guru'
                  : viewMode === 'keys'
                    ? ' — Kunci Jawaban & Rubrik'
                    : ''}
              </h2>
              <p className="mt-1 text-xs font-medium text-slate-700">
                {examPaper.namaSekolah} · Tahun Ajaran {examPaper.tahunAjaran} ·{' '}
                {examPaper.kelasLabel} · {examPaper.semesterLabel} · Alokasi Waktu:{' '}
                {examPaper.alokasiWaktu}
              </p>
            </header>

            {viewMode === 'keys' ? (
              <div className="mt-6 space-y-8">
                <div>
                  <h3 className="font-display text-sm font-semibold text-slate-900 mb-3">
                    A. Kunci Jawaban Pilihan Ganda ({examPaper.pilihanGanda.length} Soal)
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 md:grid-cols-6">
                    {examPaper.pilihanGanda.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs tabular-nums"
                      >
                        <span className="font-mono text-slate-600">No. {q.nomor}</span>
                        <span className="font-mono font-bold text-slate-950">
                          {q.kunciJawaban}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {examPaper.isianSingkat.length > 0 && (
                  <div>
                    <h3 className="font-display text-sm font-semibold text-slate-900 mb-3">
                      B. Kunci Jawaban Isian Singkat ({examPaper.isianSingkat.length} Soal)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-300 text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-left font-semibold text-slate-900">
                            <th className="border border-slate-300 px-3 py-2 w-14 text-center">
                              No
                            </th>
                            <th className="border border-slate-300 px-3 py-2 w-[28%]">
                              Kunci Jawaban
                            </th>
                            <th className="border border-slate-300 px-3 py-2">
                              Pedoman Penskoran & Indikator
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {examPaper.isianSingkat.map((q) => (
                            <tr key={q.id} className="align-top">
                              <td className="border border-slate-300 px-3 py-2 text-center font-mono tabular-nums">
                                {q.nomor}
                              </td>
                              <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-900">
                                {q.kunciJawaban}
                              </td>
                              <td className="border border-slate-300 px-3 py-2 text-slate-700">
                                <div>{q.pedomanPenskoran}</div>
                                <div className="mt-1 text-[11px] text-slate-500">
                                  {q.levelKognitif} · {q.tingkatKesulitan} · {q.indikatorTerkait}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {examPaper.uraian.length > 0 && (
                  <div>
                    <h3 className="font-display text-sm font-semibold text-slate-900 mb-3">
                      C. Kunci & Pedoman Penskoran Uraian ({examPaper.uraian.length} Soal)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-300 text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-left font-semibold text-slate-900">
                            <th className="border border-slate-300 px-3 py-2 w-14 text-center">
                              No
                            </th>
                            <th className="border border-slate-300 px-3 py-2 w-[38%]">
                              Kunci Penyelesaian
                            </th>
                            <th className="border border-slate-300 px-3 py-2">
                              Pedoman Penskoran
                            </th>
                            <th className="border border-slate-300 px-3 py-2 w-24 text-center">
                              Skor Maks
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {examPaper.uraian.map((q) => (
                            <tr key={q.id} className="align-top">
                              <td className="border border-slate-300 px-3 py-2 text-center font-mono tabular-nums">
                                {q.nomor}
                              </td>
                              <td className="border border-slate-300 px-3 py-2 text-slate-900 whitespace-pre-line">
                                {q.kunciJawaban}
                              </td>
                              <td className="border border-slate-300 px-3 py-2 text-slate-700 whitespace-pre-line">
                                {q.pedomanPenskoran}
                              </td>
                              <td className="border border-slate-300 px-3 py-2 text-center font-mono font-semibold tabular-nums">
                                {q.skorMaksimal}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 space-y-8">
                {(sectionFilter === 'all' || sectionFilter === 'pg') &&
                  filteredPG.length > 0 && (
                    <section aria-labelledby="section-pg-title">
                      <h3
                        id="section-pg-title"
                        className="border-b border-slate-300 pb-1.5 font-display text-sm font-bold uppercase tracking-wide text-slate-900"
                      >
                        A. Pilihan Ganda ({filteredPG.length} Soal)
                      </h3>
                      <p className="mt-2 mb-4 text-xs text-slate-600">
                        Pilihlah satu jawaban yang paling tepat (A, B, C, atau D).
                      </p>
                      <div className="space-y-5">
                        {filteredPG.map((q) => (
                          <div
                            key={q.id}
                            className="break-inside-avoid rounded-lg border border-slate-200/80 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-2">
                                {q.stimulus && q.stimulus !== '-' && (
                                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-800 whitespace-pre-line">
                                    {q.stimulus}
                                  </div>
                                )}
                                <p className="text-sm leading-relaxed text-slate-950">
                                  <span className="font-mono font-semibold mr-2 tabular-nums">
                                    {q.nomor}.
                                  </span>
                                  {q.pertanyaan}
                                </p>
                                <div className="grid grid-cols-1 gap-1.5 pl-6 text-xs sm:grid-cols-2">
                                  {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                                    <div
                                      key={opt}
                                      className={`rounded px-2 py-1 ${
                                        viewMode === 'teacher' && q.kunciJawaban === opt
                                          ? 'bg-emerald-50 font-semibold text-emerald-950 border border-emerald-200'
                                          : 'text-slate-800'
                                      }`}
                                    >
                                      <span className="font-mono font-semibold mr-1.5">
                                        {opt}.
                                      </span>
                                      {q.pilihan[opt]}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {viewMode === 'teacher' && (
                                <button
                                  type="button"
                                  onClick={() => setEditingPG({ ...q })}
                                  aria-label={`Edit PG nomor ${q.nomor}`}
                                  className="no-print rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-800 shrink-0"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>

                            {viewMode === 'teacher' && (
                              <div className="mt-3 border-t border-slate-100 pt-2.5 pl-6 text-[11px] text-slate-600 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-emerald-800">
                                    Kunci: {q.kunciJawaban}
                                  </span>
                                  <span aria-hidden="true" className="text-slate-300">
                                    ·
                                  </span>
                                  <span className="font-mono font-medium text-slate-800">
                                    {q.levelKognitif}
                                  </span>
                                  <span aria-hidden="true" className="text-slate-300">
                                    ·
                                  </span>
                                  <span
                                    className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${DIFFICULTY_STYLES[q.tingkatKesulitan]}`}
                                  >
                                    {q.tingkatKesulitan}
                                  </span>
                                  <span aria-hidden="true" className="text-slate-300">
                                    ·
                                  </span>
                                  <span className="text-slate-700">{q.materi}</span>
                                </div>
                                <p className="text-slate-600">
                                  <strong className="font-medium text-slate-800">
                                    Indikator:{' '}
                                  </strong>
                                  {q.indikatorTerkait}
                                </p>
                                <p className="text-slate-600">
                                  <strong className="font-medium text-slate-800">
                                    Pembahasan:{' '}
                                  </strong>
                                  {q.pembahasan}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                {(sectionFilter === 'all' || sectionFilter === 'isian') &&
                  filteredIsian.length > 0 && (
                    <section aria-labelledby="section-isian-title">
                      <h3
                        id="section-isian-title"
                        className="border-b border-slate-300 pb-1.5 font-display text-sm font-bold uppercase tracking-wide text-slate-900"
                      >
                        B. Isian Singkat ({filteredIsian.length} Soal)
                      </h3>
                      <p className="mt-2 mb-4 text-xs text-slate-600">
                        Isilah titik-titik atau jawablah pertanyaan berikut dengan singkat dan tepat.
                      </p>
                      <div className="space-y-4">
                        {filteredIsian.map((q) => (
                          <div
                            key={q.id}
                            className="break-inside-avoid rounded-lg border border-slate-200/80 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-2">
                                {q.stimulus && q.stimulus !== '-' && (
                                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-800 whitespace-pre-line">
                                    {q.stimulus}
                                  </div>
                                )}
                                <p className="text-sm leading-relaxed text-slate-950">
                                  <span className="font-mono font-semibold mr-2 tabular-nums">
                                    {q.nomor}.
                                  </span>
                                  {q.pertanyaan}
                                </p>
                              </div>

                              {viewMode === 'teacher' && (
                                <button
                                  type="button"
                                  onClick={() => setEditingIsian({ ...q })}
                                  aria-label={`Edit isian singkat nomor ${q.nomor}`}
                                  className="no-print rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-800 shrink-0"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>

                            {viewMode === 'teacher' && (
                              <div className="mt-3 border-t border-slate-100 pt-2.5 pl-6 text-[11px] text-slate-600 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-emerald-800">
                                    Kunci: {q.kunciJawaban}
                                  </span>
                                  <span aria-hidden="true" className="text-slate-300">
                                    ·
                                  </span>
                                  <span className="font-mono font-medium text-slate-800">
                                    {q.levelKognitif}
                                  </span>
                                  <span aria-hidden="true" className="text-slate-300">
                                    ·
                                  </span>
                                  <span
                                    className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${DIFFICULTY_STYLES[q.tingkatKesulitan]}`}
                                  >
                                    {q.tingkatKesulitan}
                                  </span>
                                </div>
                                <p>
                                  <strong className="font-medium text-slate-800">
                                    Indikator:{' '}
                                  </strong>
                                  {q.indikatorTerkait}
                                </p>
                                <p>
                                  <strong className="font-medium text-slate-800">
                                    Pedoman Penskoran:{' '}
                                  </strong>
                                  {q.pedomanPenskoran}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                {(sectionFilter === 'all' || sectionFilter === 'uraian') &&
                  filteredUraian.length > 0 && (
                    <section aria-labelledby="section-uraian-title">
                      <h3
                        id="section-uraian-title"
                        className="border-b border-slate-300 pb-1.5 font-display text-sm font-bold uppercase tracking-wide text-slate-900"
                      >
                        C. Uraian ({filteredUraian.length} Soal)
                      </h3>
                      <p className="mt-2 mb-4 text-xs text-slate-600">
                        Jawablah pertanyaan di bawah ini dengan langkah penyelesaian dan alasan yang jelas.
                      </p>
                      <div className="space-y-4">
                        {filteredUraian.map((q) => (
                          <div
                            key={q.id}
                            className="break-inside-avoid rounded-lg border border-slate-200/80 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-2">
                                {q.stimulus && q.stimulus !== '-' && (
                                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-800 whitespace-pre-line">
                                    {q.stimulus}
                                  </div>
                                )}
                                <p className="text-sm leading-relaxed text-slate-950">
                                  <span className="font-mono font-semibold mr-2 tabular-nums">
                                    {q.nomor}.
                                  </span>
                                  {q.pertanyaan}
                                </p>
                              </div>

                              {viewMode === 'teacher' && (
                                <button
                                  type="button"
                                  onClick={() => setEditingUraian({ ...q })}
                                  aria-label={`Edit uraian nomor ${q.nomor}`}
                                  className="no-print rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-800 shrink-0"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>

                            {viewMode === 'teacher' && (
                              <div className="mt-3 border-t border-slate-100 pt-2.5 pl-6 text-[11px] text-slate-600 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono font-medium text-slate-800">
                                    {q.levelKognitif}
                                  </span>
                                  <span aria-hidden="true" className="text-slate-300">
                                    ·
                                  </span>
                                  <span
                                    className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${DIFFICULTY_STYLES[q.tingkatKesulitan]}`}
                                  >
                                    {q.tingkatKesulitan}
                                  </span>
                                  <span aria-hidden="true" className="text-slate-300">
                                    ·
                                  </span>
                                  <span className="font-mono font-semibold text-slate-800 tabular-nums">
                                    Skor Maks: {q.skorMaksimal}
                                  </span>
                                </div>
                                <p>
                                  <strong className="font-medium text-slate-800">
                                    Indikator:{' '}
                                  </strong>
                                  {q.indikatorTerkait}
                                </p>
                                <p className="whitespace-pre-line text-emerald-950">
                                  <strong className="font-semibold text-emerald-900">
                                    Kunci Penyelesaian:{' '}
                                  </strong>
                                  {q.kunciJawaban}
                                </p>
                                <p className="whitespace-pre-line">
                                  <strong className="font-medium text-slate-800">
                                    Pedoman Penskoran:{' '}
                                  </strong>
                                  {q.pedomanPenskoran}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
              </div>
            )}
          </article>
        </div>
      )}

      {editingPG && (
        <div
          role="dialog"
          aria-modal="true"
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Edit Soal Pilihan Ganda No. {editingPG.nomor}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPG(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSavePG} className="mt-4 space-y-3 text-xs">
              <label className="block">
                <span className="font-semibold text-slate-700">Stimulus</span>
                <textarea
                  rows={2}
                  value={editingPG.stimulus}
                  onChange={(e) =>
                    setEditingPG({ ...editingPG, stimulus: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="block">
                <span className="font-semibold text-slate-700">Pertanyaan</span>
                <textarea
                  required
                  rows={2}
                  value={editingPG.pertanyaan}
                  onChange={(e) =>
                    setEditingPG({ ...editingPG, pertanyaan: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                  <label key={opt} className="block">
                    <span className="font-semibold text-slate-700">Opsi {opt}</span>
                    <input
                      required
                      type="text"
                      value={editingPG.pilihan[opt]}
                      onChange={(e) =>
                        setEditingPG({
                          ...editingPG,
                          pilihan: { ...editingPG.pilihan, [opt]: e.target.value },
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-slate-900"
                    />
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-semibold text-slate-700">Kunci Jawaban</span>
                  <select
                    value={editingPG.kunciJawaban}
                    onChange={(e) =>
                      setEditingPG({
                        ...editingPG,
                        kunciJawaban: e.target.value as 'A' | 'B' | 'C' | 'D',
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-slate-900"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </label>
                <label className="block">
                  <span className="font-semibold text-slate-700">Kesulitan</span>
                  <select
                    value={editingPG.tingkatKesulitan}
                    onChange={(e) =>
                      setEditingPG({
                        ...editingPG,
                        tingkatKesulitan: e.target.value as DifficultyLevel,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-slate-900"
                  >
                    <option value="Mudah">Mudah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Sukar">Sukar</option>
                  </select>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPG(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-800 px-4 py-2 font-semibold text-white hover:bg-blue-900"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingIsian && (
        <div
          role="dialog"
          aria-modal="true"
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Edit Isian Singkat No. {editingIsian.nomor}
              </h3>
              <button
                type="button"
                onClick={() => setEditingIsian(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveIsian} className="mt-4 space-y-3 text-xs">
              <label className="block">
                <span className="font-semibold text-slate-700">Pertanyaan</span>
                <textarea
                  required
                  rows={3}
                  value={editingIsian.pertanyaan}
                  onChange={(e) =>
                    setEditingIsian({ ...editingIsian, pertanyaan: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="block">
                <span className="font-semibold text-slate-700">Kunci Jawaban</span>
                <input
                  required
                  type="text"
                  value={editingIsian.kunciJawaban}
                  onChange={(e) =>
                    setEditingIsian({ ...editingIsian, kunciJawaban: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="block">
                <span className="font-semibold text-slate-700">Pedoman Penskoran</span>
                <textarea
                  rows={2}
                  value={editingIsian.pedomanPenskoran}
                  onChange={(e) =>
                    setEditingIsian({
                      ...editingIsian,
                      pedomanPenskoran: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </label>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingIsian(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-800 px-4 py-2 font-semibold text-white hover:bg-blue-900"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUraian && (
        <div
          role="dialog"
          aria-modal="true"
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-base font-semibold text-slate-900">
                Edit Uraian No. {editingUraian.nomor}
              </h3>
              <button
                type="button"
                onClick={() => setEditingUraian(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveUraian} className="mt-4 space-y-3 text-xs">
              <label className="block">
                <span className="font-semibold text-slate-700">Pertanyaan</span>
                <textarea
                  required
                  rows={3}
                  value={editingUraian.pertanyaan}
                  onChange={(e) =>
                    setEditingUraian({ ...editingUraian, pertanyaan: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="block">
                <span className="font-semibold text-slate-700">Kunci Penyelesaian</span>
                <textarea
                  required
                  rows={3}
                  value={editingUraian.kunciJawaban}
                  onChange={(e) =>
                    setEditingUraian({ ...editingUraian, kunciJawaban: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </label>
              <label className="block">
                <span className="font-semibold text-slate-700">Pedoman Penskoran</span>
                <textarea
                  required
                  rows={3}
                  value={editingUraian.pedomanPenskoran}
                  onChange={(e) =>
                    setEditingUraian({
                      ...editingUraian,
                      pedomanPenskoran: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </label>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUraian(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-800 px-4 py-2 font-semibold text-white hover:bg-blue-900"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
