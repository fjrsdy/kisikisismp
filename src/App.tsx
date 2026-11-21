import { useEffect, useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { AnalisisNilaiView } from './components/AnalisisNilaiView';
import { ArchiveView } from './components/ArchiveView';
import { CognitiveAnalyticsBar } from './components/CognitiveAnalyticsBar';
import { CognitiveMatrixView } from './components/CognitiveMatrixView';
import { ConfigPanel } from './components/ConfigPanel';
import {
  FormUjianView,
  STORAGE_CBT_SESSIONS_KEY,
} from './components/FormUjianView';
import { ItemPreviewModal } from './components/ItemPreviewModal';
import { KisiTable } from './components/KisiTable';
import { NaskahSoalView } from './components/NaskahSoalView';
import {
  INITIAL_ASSESSMENT_GUIDE,
  PedomanPenilaianView,
} from './components/PedomanPenilaianView';
import { PrintPreviewView } from './components/PrintPreviewView';
import { TopBar, type ActiveTab } from './components/TopBar';
import {
  GRADE_LABELS,
  INITIAL_BLUEPRINT,
  SEMESTER_LABELS,
  SMP_SUBJECTS,
  getSuggestedTopics,
} from './data/smpCurriculum';
import type {
  AssessmentGuidePackage,
  CbtSharedSession,
  ExamConfig,
  ExamPaperPackage,
  GeneratedSampleItem,
  GradeSMP,
  KisiBlueprint,
  KisiRow,
  Semester,
} from './types/kisiKisi';
import { postApiJson } from './utils/apiClient';
import {
  generateLocalExamPaper,
  generateLocalKisiKisi,
  generateLocalSampleItem,
} from './utils/localEvaluationEngine';
import {
  buildMarkdownTable,
  exportToCSV,
  exportToWordDoc,
} from './utils/exportBlueprint';

const STORAGE_CURRENT_KEY = 'evaluasi_smp_current_v1';
const STORAGE_ARCHIVE_KEY = 'evaluasi_smp_archive_v1';
const STORAGE_NASKAH_KEY = 'evaluasi_smp_naskah_v1';
const STORAGE_GUIDE_KEY = 'evaluasi_smp_guide_v1';

interface CbtQueryParams {
  code: string;
  mapel: string;
  kelas: GradeSMP;
  sem: Semester;
}

function readCbtQueryParams(): CbtQueryParams | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const code = params.get('cbt')?.trim() || '';
  if (!code) return null;

  const rawMapel = params.get('mapel')?.trim() || '';
  const matchedSubject =
    SMP_SUBJECTS.find((s) => s.toLowerCase() === rawMapel.toLowerCase()) ||
    rawMapel ||
    INITIAL_BLUEPRINT.config.mataPelajaran;

  const rawKelas = params.get('kelas')?.trim();
  const kelas: GradeSMP =
    rawKelas === '7' || rawKelas === '8' || rawKelas === '9' ? rawKelas : '7';

  const rawSem = params.get('sem')?.trim();
  const sem: Semester = rawSem === '2' ? '2' : '1';

  return {
    code,
    mapel: matchedSubject,
    kelas,
    sem,
  };
}

export default function App() {
  const [cbtQuery] = useState<CbtQueryParams | null>(() => readCbtQueryParams());
  const [cbtSession, setCbtSession] = useState<CbtSharedSession | null>(null);
  const [isLoadingCbt, setIsLoadingCbt] = useState<boolean>(() =>
    Boolean(readCbtQueryParams())
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('builder');

  const [blueprint, setBlueprint] = useState<KisiBlueprint>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CURRENT_KEY);
      if (saved) {
        return JSON.parse(saved) as KisiBlueprint;
      }
    } catch {
      // Fallback to default curated blueprint
    }
    return INITIAL_BLUEPRINT;
  });

  const [savedBlueprints, setSavedBlueprints] = useState<KisiBlueprint[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_ARCHIVE_KEY);
      if (raw) {
        return JSON.parse(raw) as KisiBlueprint[];
      }
    } catch {
      // Fallback empty archive
    }
    return [];
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const [inspectRow, setInspectRow] = useState<KisiRow | null>(null);
  const [sampleItem, setSampleItem] = useState<GeneratedSampleItem | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);

  const [examPaper, setExamPaper] = useState<ExamPaperPackage | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_NASKAH_KEY);
      if (raw) {
        return JSON.parse(raw) as ExamPaperPackage;
      }
    } catch {
      // Fallback null
    }
    return null;
  });

  const [assessmentGuide, setAssessmentGuide] = useState<AssessmentGuidePackage>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_GUIDE_KEY);
      if (raw) {
        return JSON.parse(raw) as AssessmentGuidePackage;
      }
    } catch {
      // Fallback curated guide
    }
    return INITIAL_ASSESSMENT_GUIDE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(blueprint));
    } catch {
      // Ignore storage quota errors
    }
  }, [blueprint]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ARCHIVE_KEY, JSON.stringify(savedBlueprints));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedBlueprints]);

  useEffect(() => {
    if (!examPaper) return;
    try {
      localStorage.setItem(STORAGE_NASKAH_KEY, JSON.stringify(examPaper));
    } catch {
      // Ignore storage quota errors
    }
  }, [examPaper]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GUIDE_KEY, JSON.stringify(assessmentGuide));
    } catch {
      // Ignore storage quota errors
    }
  }, [assessmentGuide]);

  const handleConfigChange = (nextConfig: ExamConfig) => {
    setBlueprint((prev) => ({
      ...prev,
      config: nextConfig,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleUpdateRows = (nextRows: KisiRow[]) => {
    setBlueprint((prev) => ({
      ...prev,
      rows: nextRows,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleGenerateBlueprint = async () => {
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const data = await postApiJson<{
        rows?: Omit<KisiRow, 'id'>[];
        catatanAhliEvaluasi?: string;
      }>('/api/kisi-kisi/generate', blueprint.config, () =>
        generateLocalKisiKisi(blueprint.config)
      );

      const formattedRows: KisiRow[] = (data.rows || []).map(
        (r: Omit<KisiRow, 'id'>, idx: number) => ({
          ...r,
          id: `gen-${Date.now()}-${idx}`,
          no: idx + 1,
        })
      );

      setBlueprint((prev) => ({
        ...prev,
        id: `bp-${Date.now()}`,
        rows: formattedRows,
        catatanAhliEvaluasi: data.catatanAhliEvaluasi || '',
        updatedAt: new Date().toISOString(),
      }));
    } catch (err: unknown) {
      setGenerateError(
        err instanceof Error
          ? err.message
          : 'Terjadi gangguan jaringan saat menghubungi penyusun kisi-kisi.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInspectSampleItem = async (row: KisiRow) => {
    setInspectRow(row);
    setSampleItem(null);
    setSampleError(null);
    setIsLoadingSample(true);

    try {
      const data = await postApiJson<GeneratedSampleItem>(
        '/api/kisi-kisi/sample-item',
        {
          config: blueprint.config,
          row,
        },
        () => generateLocalSampleItem(blueprint.config, row)
      );
      setSampleItem(data);
    } catch (err: unknown) {
      setSampleError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat membuat contoh soal.'
      );
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleCopyMarkdown = async () => {
    const md = buildMarkdownTable(blueprint);
    await navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleSaveToArchive = () => {
    const snapshot: KisiBlueprint = {
      ...blueprint,
      id: blueprint.id.startsWith('saved-')
        ? blueprint.id
        : `saved-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setSavedBlueprints((prev) => {
      const filtered = prev.filter((item) => item.id !== snapshot.id);
      return [snapshot, ...filtered];
    });
    setBlueprint(snapshot);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  const handleLoadBlueprint = (bp: KisiBlueprint) => {
    setBlueprint(bp);
    setActiveTab('builder');
  };

  const handleDeleteSaved = (id: string) => {
    setSavedBlueprints((prev) => prev.filter((item) => item.id !== id));
  };

  useEffect(() => {
    if (!cbtQuery) return;
    let cancelled = false;

    const loadSharedCbt = async () => {
      setIsLoadingCbt(true);
      try {
        const resp = await fetch(
          `/api/cbt/sessions/${encodeURIComponent(cbtQuery.code)}?role=student`
        );
        if (resp.ok) {
          const data = (await resp.json()) as { session?: CbtSharedSession };
          if (!cancelled && data.session) {
            setCbtSession(data.session);
            setIsLoadingCbt(false);
            return;
          }
        }
      } catch {
        // Continue to localStorage / subject fallback
      }

      try {
        const raw = localStorage.getItem(STORAGE_CBT_SESSIONS_KEY);
        if (raw) {
          const list = JSON.parse(raw) as CbtSharedSession[];
          const found = list.find(
            (s) => s.code.toUpperCase() === cbtQuery.code.toUpperCase()
          );
          if (!cancelled && found) {
            setCbtSession(found);
            setIsLoadingCbt(false);
            return;
          }
        }
      } catch {
        // Ignore storage read error
      }

      // Subject-matched deterministic fallback so any Share Link works offline/across restarts
      const topics = getSuggestedTopics(
        cbtQuery.mapel,
        cbtQuery.kelas,
        cbtQuery.sem
      );
      const kisiSummary = topics
        .map(
          (topic, i) =>
            `| ${i + 1} | CP ${cbtQuery.mapel} | Memahami ${topic} | ${topic} | Peserta didik mampu menganalisis dan menyelesaikan masalah terkait ${topic} | C3 | Menerapkan | Pilihan Ganda | ${i + 1} | 10 |`
        )
        .join('\n');

      const fallbackPaper = generateLocalExamPaper({
        kisiKisiText: kisiSummary,
        mataPelajaran: cbtQuery.mapel,
        kelasLabel: GRADE_LABELS[cbtQuery.kelas],
        semesterLabel: SEMESTER_LABELS[cbtQuery.sem],
        jenisUjian: blueprint.config.jenisUjian,
        namaSekolah: blueprint.config.namaSekolah,
        tahunAjaran: blueprint.config.tahunAjaran,
        alokasiWaktu: blueprint.config.alokasiWaktu || '90 Menit',
        jumlahPG: 20,
        jumlahIsian: 5,
        jumlahUraian: 3,
      });

      if (!cancelled) {
        setCbtSession({
          code: cbtQuery.code.toUpperCase(),
          paper: fallbackPaper,
          kktp: 75,
          security: {
            acakSoal: true,
            acakOpsi: true,
            wajibFullscreen: true,
            blokirCopyKlikKanan: true,
            batasPelanggaranTab: 3,
            tokenUjian: '',
            tampilkanNilaiKeSiswa: true,
          },
          createdAt: new Date().toISOString(),
        });
        setIsLoadingCbt(false);
      }
    };

    loadSharedCbt();
    return () => {
      cancelled = true;
    };
  }, [
    cbtQuery,
    blueprint.config.alokasiWaktu,
    blueprint.config.jenisUjian,
    blueprint.config.namaSekolah,
    blueprint.config.tahunAjaran,
  ]);

  if (cbtQuery) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-slate-950">
                  {cbtSession?.paper.mataPelajaran || cbtQuery.mapel}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {cbtSession?.paper.kelasLabel || GRADE_LABELS[cbtQuery.kelas]}
                  <span aria-hidden="true" className="mx-1.5 text-slate-300">
                    ·
                  </span>
                  <span>Mode Peserta CBT Terkunci</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-800">
                <Lock className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
                <span>{cbtQuery.code.toUpperCase()}</span>
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6">
          {isLoadingCbt || !cbtSession ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <p className="font-display text-base font-semibold text-slate-900">
                Menyiapkan Ruang Ujian CBT...
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Memuat paket soal mata pelajaran {cbtQuery.mapel} ({GRADE_LABELS[cbtQuery.kelas]}).
              </p>
            </div>
          ) : (
            <FormUjianView
              blueprint={blueprint}
              examPaper={null}
              onSwitchToGenerator={() => {}}
              studentLockMode={true}
              sharedSession={cbtSession}
            />
          )}
        </main>
      </div>
    );
  }

  return (
    <div id="top" className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onQuickExportWord={() => exportToWordDoc(blueprint)}
      />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === 'builder' && (
          <div className="space-y-6">
            <div className="no-print flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <h1
                  style={{ textWrap: 'balance' }}
                  className="font-display text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]"
                >
                  Penyusun Kisi-Kisi Ujian Semester SMP
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  Instrumen evaluasi pendidikan untuk menyusun tabel kisi-kisi Kelas VII–IX Semester 1 dan 2 secara sistematis: Capaian Pembelajaran, Tujuan Pembelajaran, Materi, Indikator Soal, Level Kognitif C1–C6, Bentuk Soal, dan Nomor Soal.
                </p>
              </div>
              <div className="text-xs text-slate-500 shrink-0">
                <span>{blueprint.config.mataPelajaran}</span>
                <span aria-hidden="true" className="mx-1.5 text-slate-300">
                  ·
                </span>
                <span>{GRADE_LABELS[blueprint.config.kelas]}</span>
                <span aria-hidden="true" className="mx-1.5 text-slate-300">
                  ·
                </span>
                <span>{SEMESTER_LABELS[blueprint.config.semester]}</span>
              </div>
            </div>

            <div className="no-print">
              <ConfigPanel
                config={blueprint.config}
                onChange={handleConfigChange}
                onGenerate={handleGenerateBlueprint}
                isGenerating={isGenerating}
                errorMessage={generateError}
              />
            </div>

            <div className="no-print">
              <CognitiveAnalyticsBar
                blueprint={blueprint}
                onOpenMatrix={() => setActiveTab('analytics')}
              />
            </div>

            <KisiTable
              blueprint={blueprint}
              onUpdateRows={handleUpdateRows}
              onInspectSampleItem={handleInspectSampleItem}
              onOpenNaskahSoal={() => setActiveTab('naskah')}
              onExportCSV={() => exportToCSV(blueprint)}
              onExportWord={() => exportToWordDoc(blueprint)}
              onOpenPrintPreview={() => setActiveTab('preview')}
              onCopyMarkdown={handleCopyMarkdown}
              onSaveBlueprint={handleSaveToArchive}
              copiedMarkdown={copiedMarkdown}
              savedNotice={savedNotice}
            />
          </div>
        )}

        {activeTab === 'naskah' && (
          <NaskahSoalView
            blueprint={blueprint}
            examPaper={examPaper}
            onUpdateExamPaper={setExamPaper}
            onOpenAnalisis={() => setActiveTab('analisis')}
          />
        )}

        {activeTab === 'penilaian' && (
          <PedomanPenilaianView
            blueprint={blueprint}
            examPaper={examPaper}
            assessmentGuide={assessmentGuide}
            onUpdateGuide={setAssessmentGuide}
          />
        )}

        {activeTab === 'analisis' && (
          <AnalisisNilaiView blueprint={blueprint} />
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <CognitiveAnalyticsBar blueprint={blueprint} />
            <CognitiveMatrixView blueprint={blueprint} />
          </div>
        )}

        {activeTab === 'preview' && (
          <PrintPreviewView
            blueprint={blueprint}
            onExportCSV={() => exportToCSV(blueprint)}
            onExportWord={() => exportToWordDoc(blueprint)}
          />
        )}

        {activeTab === 'archive' && (
          <ArchiveView
            savedBlueprints={savedBlueprints}
            activeBlueprintId={blueprint.id}
            onLoadBlueprint={handleLoadBlueprint}
            onDeleteSaved={handleDeleteSaved}
          />
        )}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-4 text-xs text-slate-500 sm:px-6 lg:px-8">
          <span>Evaluasi SMP · Penyusun Kisi-Kisi Ujian Semester Kurikulum Merdeka Fase D</span>
          <span>Taksonomi Bloom Revisi C1–C6 · Format Dokumen Siap Cetak</span>
        </div>
      </footer>

      <ItemPreviewModal
        row={inspectRow}
        item={sampleItem}
        isLoading={isLoadingSample}
        error={sampleError}
        onClose={() => setInspectRow(null)}
        onRegenerate={handleInspectSampleItem}
      />
    </div>
  );
}
