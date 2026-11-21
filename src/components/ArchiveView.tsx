import React from 'react';
import { FolderOpen, Trash2 } from 'lucide-react';
import { CURATED_TEMPLATES, GRADE_LABELS, SEMESTER_LABELS } from '../data/smpCurriculum';
import type { KisiBlueprint } from '../types/kisiKisi';

interface ArchiveViewProps {
  savedBlueprints: KisiBlueprint[];
  activeBlueprintId: string;
  onLoadBlueprint: (blueprint: KisiBlueprint) => void;
  onDeleteSaved: (id: string) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  savedBlueprints,
  activeBlueprintId,
  onLoadBlueprint,
  onDeleteSaved,
}) => {
  const renderCard = (bp: KisiBlueprint, isUserSaved: boolean) => {
    const isActive = bp.id === activeBlueprintId;
    const totalQuestions =
      bp.config.jumlahPG +
      bp.config.jumlahPGK +
      bp.config.jumlahIsian +
      bp.config.jumlahUraian;

    return (
      <div
        key={bp.id}
        className={`flex flex-col justify-between rounded-xl border p-5 transition-colors ${
          isActive
            ? 'border-blue-700 bg-blue-50/30'
            : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
      >
        <div>
          <h3 className="font-display text-base font-semibold text-slate-900">
            {bp.config.mataPelajaran}
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            {GRADE_LABELS[bp.config.kelas]}
            <span aria-hidden="true" className="mx-1.5 text-slate-300">
              ·
            </span>
            {SEMESTER_LABELS[bp.config.semester]}
            <span aria-hidden="true" className="mx-1.5 text-slate-300">
              ·
            </span>
            <span className="font-mono tabular-nums">{bp.rows.length} baris</span>
            <span aria-hidden="true" className="mx-1.5 text-slate-300">
              ·
            </span>
            <span className="font-mono tabular-nums">{totalQuestions} soal</span>
          </p>
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-600">
            {bp.config.materiPokok}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => onLoadBlueprint(bp)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap"
          >
            <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isActive ? 'Sedang Dibuka' : 'Buka Kisi-Kisi'}</span>
          </button>

          {isUserSaved && (
            <button
              type="button"
              onClick={() => onDeleteSaved(bp.id)}
              aria-label={`Hapus arsip ${bp.config.mataPelajaran}`}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <section aria-labelledby="saved-archive-heading">
        <div className="mb-4">
          <h2
            id="saved-archive-heading"
            className="font-display text-lg font-semibold text-slate-900"
          >
            Arsip Kisi-Kisi Tersimpan
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Kisi-kisi yang Anda simpan secara lokal di peramban ini.
          </p>
        </div>

        {savedBlueprints.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              Belum ada kisi-kisi yang disimpan di arsip pribadi.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Klik tombol &ldquo;Simpan Arsip&rdquo; pada tabel kisi-kisi untuk menyimpannya di sini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedBlueprints.map((bp) => renderCard(bp, true))}
          </div>
        )}
      </section>

      <section aria-labelledby="curated-examples-heading">
        <div className="mb-4">
          <h2
            id="curated-examples-heading"
            className="font-display text-lg font-semibold text-slate-900"
          >
            Contoh Rujukan Ahli Evaluasi (SMP Kelas VII–IX)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Model kisi-kisi Kurikulum Merdeka Fase D siap pakai untuk jenjang SMP Semester 1 dan 2.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CURATED_TEMPLATES.map((bp) => renderCard(bp, false))}
        </div>
      </section>
    </div>
  );
};
