import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Plus, Sparkles } from 'lucide-react';
import {
  CURRICULUM_OPTIONS,
  EXAM_TYPES,
  getSuggestedTopics,
  SMP_SUBJECTS,
} from '../data/smpCurriculum';
import type { CognitivePreset, ExamConfig, GradeSMP, Semester } from '../types/kisiKisi';

interface ConfigPanelProps {
  config: ExamConfig;
  onChange: (next: ExamConfig) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  errorMessage: string | null;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onChange,
  onGenerate,
  isGenerating,
  errorMessage,
}) => {
  const [showSchoolMeta, setShowSchoolMeta] = useState(false);
  const [customSubjectMode, setCustomSubjectMode] = useState(
    !SMP_SUBJECTS.includes(config.mataPelajaran)
  );

  const suggestedTopics = getSuggestedTopics(
    config.mataPelajaran,
    config.kelas,
    config.semester
  );

  const totalSoal =
    config.jumlahPG + config.jumlahPGK + config.jumlahIsian + config.jumlahUraian;

  const updateField = <K extends keyof ExamConfig>(key: K, value: ExamConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const handleAppendTopic = (topic: string) => {
    const existing = config.materiPokok.trim();
    if (!existing) {
      updateField('materiPokok', topic);
      return;
    }
    if (existing.toLowerCase().includes(topic.toLowerCase())) {
      return;
    }
    updateField('materiPokok', `${existing}, ${topic}`);
  };

  const handleReplaceWithTopic = (topic: string) => {
    updateField('materiPokok', topic);
  };

  return (
    <section
      aria-labelledby="config-panel-title"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h2
            id="config-panel-title"
            className="font-display text-base font-semibold text-slate-900"
          >
            Parameter Penyusunan Kisi-Kisi
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Tentukan mata pelajaran, jenjang SMP, semester, dan cakupan materi ujian.
          </p>
        </div>
        <span className="font-mono text-xs font-medium text-slate-600 tabular-nums">
          Total: {totalSoal} Butir Soal
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="mata-pelajaran"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Mata Pelajaran
              </label>
              {!customSubjectMode ? (
                <select
                  id="mata-pelajaran"
                  value={
                    SMP_SUBJECTS.includes(config.mataPelajaran)
                      ? config.mataPelajaran
                      : '__custom__'
                  }
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setCustomSubjectMode(true);
                      updateField('mataPelajaran', '');
                    } else {
                      updateField('mataPelajaran', e.target.value);
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                >
                  {SMP_SUBJECTS.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                  <option value="__custom__">Lainnya (Ketik Manual)...</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    id="mata-pelajaran"
                    type="text"
                    value={config.mataPelajaran}
                    onChange={(e) => updateField('mataPelajaran', e.target.value)}
                    placeholder="Misal: Bahasa Daerah / Prakarya"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCustomSubjectMode(false);
                      updateField('mataPelajaran', SMP_SUBJECTS[0]);
                    }}
                    className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap shrink-0"
                  >
                    Daftar
                  </button>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="jenis-ujian"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Jenis Ujian & Kurikulum
              </label>
              <div className="grid grid-cols-1 gap-2">
                <select
                  id="jenis-ujian"
                  value={config.jenisUjian}
                  onChange={(e) => updateField('jenisUjian', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                >
                  {EXAM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kelas (Jenjang 1–3 SMP)
              </span>
              <div
                role="group"
                aria-label="Pilih Kelas SMP"
                className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1"
              >
                {(
                  [
                    { id: '7', label: 'VII (1 SMP)' },
                    { id: '8', label: 'VIII (2 SMP)' },
                    { id: '9', label: 'IX (3 SMP)' },
                  ] as { id: GradeSMP; label: string }[]
                ).map((grade) => {
                  const active = config.kelas === grade.id;
                  return (
                    <button
                      key={grade.id}
                      type="button"
                      onClick={() => updateField('kelas', grade.id)}
                      className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {grade.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                Semester
              </span>
              <div
                role="group"
                aria-label="Pilih Semester"
                className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1"
              >
                {(
                  [
                    { id: '1', label: 'Semester 1 (Ganjil)' },
                    { id: '2', label: 'Semester 2 (Genap)' },
                  ] as { id: Semester; label: string }[]
                ).map((sem) => {
                  const active = config.semester === sem.id;
                  return (
                    <button
                      key={sem.id}
                      type="button"
                      onClick={() => updateField('semester', sem.id)}
                      className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {sem.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="materi-pokok"
                className="block text-xs font-semibold text-slate-700"
              >
                Materi Pokok / Ruang Lingkup Uji
              </label>
              <button
                type="button"
                onClick={() => handleReplaceWithTopic(suggestedTopics.join(', '))}
                className="text-xs font-medium text-blue-800 hover:text-blue-950 hover:underline whitespace-nowrap"
              >
                Isi semua topik saran
              </button>
            </div>
            <textarea
              id="materi-pokok"
              rows={3}
              value={config.materiPokok}
              onChange={(e) => updateField('materiPokok', e.target.value)}
              placeholder="Tuliskan bab atau materi pokok yang diujikan, pisahkan dengan koma..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 leading-relaxed focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
            />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500 mr-1">Saran materi:</span>
              {suggestedTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleAppendTopic(topic)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900"
                >
                  <Plus className="h-3 w-3 text-slate-400" aria-hidden="true" />
                  <span>{topic}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-4 lg:col-span-5 lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0">
          <div>
            <label
              htmlFor="kurikulum-select"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Acuan Kurikulum
            </label>
            <select
              id="kurikulum-select"
              value={config.kurikulum}
              onChange={(e) => updateField('kurikulum', e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
            >
              {CURRICULUM_OPTIONS.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-1.5">
              Komposisi Jumlah & Bentuk Soal
            </span>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2">
              <label className="block rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
                <span className="block text-[11px] font-medium text-slate-600">
                  Pilihan Ganda
                </span>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={config.jumlahPG}
                  onChange={(e) =>
                    updateField('jumlahPG', Math.max(0, Math.min(60, Number(e.target.value) || 0)))
                  }
                  className="mt-0.5 w-full bg-transparent font-mono text-sm font-semibold text-slate-900 tabular-nums focus:outline-none"
                />
              </label>
              <label className="block rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
                <span className="block text-[11px] font-medium text-slate-600">
                  PG Kompleks
                </span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={config.jumlahPGK}
                  onChange={(e) =>
                    updateField('jumlahPGK', Math.max(0, Math.min(20, Number(e.target.value) || 0)))
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
                  max={20}
                  value={config.jumlahIsian}
                  onChange={(e) =>
                    updateField(
                      'jumlahIsian',
                      Math.max(0, Math.min(20, Number(e.target.value) || 0))
                    )
                  }
                  className="mt-0.5 w-full bg-transparent font-mono text-sm font-semibold text-slate-900 tabular-nums focus:outline-none"
                />
              </label>
              <label className="block rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
                <span className="block text-[11px] font-medium text-slate-600">
                  Uraian / Esai
                </span>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={config.jumlahUraian}
                  onChange={(e) =>
                    updateField(
                      'jumlahUraian',
                      Math.max(0, Math.min(15, Number(e.target.value) || 0))
                    )
                  }
                  className="mt-0.5 w-full bg-transparent font-mono text-sm font-semibold text-slate-900 tabular-nums focus:outline-none"
                />
              </label>
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Distribusi Level Kognitif (C1–C6)
            </span>
            <div
              role="group"
              aria-label="Target Distribusi Kognitif"
              className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1"
            >
              {(
                [
                  { id: 'proporsional', label: 'Proporsional' },
                  { id: 'hots_fokus', label: 'Fokus HOTS' },
                  { id: 'dasar_penguatan', label: 'Penguatan Dasar' },
                ] as { id: CognitivePreset; label: string }[]
              ).map((preset) => {
                const active = config.proporsiKognitif === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => updateField('proporsiKognitif', preset.id)}
                    className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating || totalSoal <= 0 || !config.materiPokok.trim() || !config.mataPelajaran.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Menyusun Kisi-Kisi Sistematis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span>Susun Kisi-Kisi Ujian Semester</span>
                </>
              )}
            </button>

            {errorMessage && (
              <div
                role="alert"
                className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
              >
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => setShowSchoolMeta((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          {showSchoolMeta ? (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>Identitas Sekolah & Pengesahan (untuk Kop Cetak & Word)</span>
        </button>

        {showSchoolMeta && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="block text-[11px] font-medium text-slate-600 mb-1">
                Nama Sekolah
              </span>
              <input
                type="text"
                value={config.namaSekolah}
                onChange={(e) => updateField('namaSekolah', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-[11px] font-medium text-slate-600 mb-1">
                Tahun Ajaran
              </span>
              <input
                type="text"
                value={config.tahunAjaran}
                onChange={(e) => updateField('tahunAjaran', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-[11px] font-medium text-slate-600 mb-1">
                Alokasi Waktu
              </span>
              <input
                type="text"
                value={config.alokasiWaktu}
                onChange={(e) => updateField('alokasiWaktu', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-[11px] font-medium text-slate-600 mb-1">
                Guru Penyusun
              </span>
              <input
                type="text"
                value={config.namaPenyusun}
                onChange={(e) => updateField('namaPenyusun', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-[11px] font-medium text-slate-600 mb-1">
                NIP Penyusun
              </span>
              <input
                type="text"
                value={config.nipPenyusun}
                onChange={(e) => updateField('nipPenyusun', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-[11px] font-medium text-slate-600 mb-1">
                Kepala Sekolah
              </span>
              <input
                type="text"
                value={config.namaKepalaSekolah}
                onChange={(e) => updateField('namaKepalaSekolah', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </label>
          </div>
        )}
      </div>
    </section>
  );
};
