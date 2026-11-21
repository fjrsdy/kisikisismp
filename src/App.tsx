import { useEffect, useState } from 'react';
import { AnalisisNilaiView } from './components/AnalisisNilaiView';
import { ArchiveView } from './components/ArchiveView';
import { CognitiveAnalyticsBar } from './components/CognitiveAnalyticsBar';
import { CognitiveMatrixView } from './components/CognitiveMatrixView';
import { ConfigPanel } from './components/ConfigPanel';
import { ItemPreviewModal } from './components/ItemPreviewModal';
import { KisiTable } from './components/KisiTable';
import { NaskahSoalView } from './components/NaskahSoalView';
import {
  INITIAL_ASSESSMENT_GUIDE,
  PedomanPenilaianView,
} from './components/PedomanPenilaianView';
import { PrintPreviewView } from './components/PrintPreviewView';
import { TopBar, type ActiveTab } from './components/TopBar';
import { GRADE_LABELS, INITIAL_BLUEPRINT, SEMESTER_LABELS } from './data/smpCurriculum';
import type {
  AssessmentGuidePackage,
  ExamConfig,
  ExamPaperPackage,
  GeneratedSampleItem,
  KisiBlueprint,
  KisiRow,
} from './types/kisiKisi';
import { postApiJson } from './utils/apiClient';
import {
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

export default function App() {
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
