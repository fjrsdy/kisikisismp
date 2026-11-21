import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  FileSpreadsheet,
  FileText,
  FileQuestion,
  Pencil,
  Plus,
  Printer,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { COGNITIVE_LEVELS, GRADE_LABELS, SEMESTER_LABELS } from '../data/smpCurriculum';
import type {
  CognitiveLevel,
  KisiBlueprint,
  KisiRow,
  QuestionForm,
} from '../types/kisiKisi';

interface KisiTableProps {
  blueprint: KisiBlueprint;
  onUpdateRows: (nextRows: KisiRow[]) => void;
  onInspectSampleItem: (row: KisiRow) => void;
  onOpenNaskahSoal: () => void;
  onExportCSV: () => void;
  onExportWord: () => void;
  onOpenPrintPreview: () => void;
  onCopyMarkdown: () => void;
  onSaveBlueprint: () => void;
  copiedMarkdown: boolean;
  savedNotice: boolean;
}

const QUESTION_FORMS: QuestionForm[] = [
  'Pilihan Ganda',
  'Pilihan Ganda Kompleks',
  'Menjodohkan',
  'Isian Singkat',
  'Uraian',
];

const COGNITIVE_OPTIONS: CognitiveLevel[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];

export const KisiTable: React.FC<KisiTableProps> = ({
  blueprint,
  onUpdateRows,
  onInspectSampleItem,
  onOpenNaskahSoal,
  onExportCSV,
  onExportWord,
  onOpenPrintPreview,
  onCopyMarkdown,
  onSaveBlueprint,
  copiedMarkdown,
  savedNotice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCog, setFilterCog] = useState<string>('ALL');
  const [filterForm, setFilterForm] = useState<string>('ALL');
  const [editingRow, setEditingRow] = useState<KisiRow | null>(null);
  const [isNewRow, setIsNewRow] = useState(false);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return blueprint.rows.filter((row) => {
      if (filterCog === 'HOTS') {
        if (!['C4', 'C5', 'C6'].includes(row.levelKognitif)) return false;
      } else if (filterCog !== 'ALL' && row.levelKognitif !== filterCog) {
        return false;
      }

      if (filterForm !== 'ALL' && row.bentukSoal !== filterForm) {
        return false;
      }

      if (!q) return true;
      return (
        row.capaianPembelajaran.toLowerCase().includes(q) ||
        row.tujuanPembelajaran.toLowerCase().includes(q) ||
        row.materi.toLowerCase().includes(q) ||
        row.indikatorSoal.toLowerCase().includes(q) ||
        row.nomorSoal.toLowerCase().includes(q)
      );
    });
  }, [blueprint.rows, searchQuery, filterCog, filterForm]);

  const handleDeleteRow = (id: string) => {
    const remaining = blueprint.rows
      .filter((r) => r.id !== id)
      .map((r, idx) => ({ ...r, no: idx + 1 }));
    onUpdateRows(remaining);
  };

  const handleMoveRow = (indexInAll: number, direction: -1 | 1) => {
    const target = indexInAll + direction;
    if (target < 0 || target >= blueprint.rows.length) return;
    const copy = [...blueprint.rows];
    const [moved] = copy.splice(indexInAll, 1);
    copy.splice(target, 0, moved);
    onUpdateRows(copy.map((r, idx) => ({ ...r, no: idx + 1 })));
  };

  const handleOpenAddModal = () => {
    const nextNo = blueprint.rows.length + 1;
    setIsNewRow(true);
    setEditingRow({
      id: `row-${Date.now()}`,
      no: nextNo,
      capaianPembelajaran: '',
      tujuanPembelajaran: '',
      materi: '',
      indikatorSoal: 'Disajikan ..., peserta didik dapat ... dengan tepat.',
      levelKognitif: 'C3',
      kataKerjaOperasional: 'Menentukan',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: String(nextNo),
      bobotSkor: 5,
    });
  };

  const handleSaveEditedRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;
    if (isNewRow) {
      const nextRows = [...blueprint.rows, editingRow].map((r, idx) => ({
        ...r,
        no: idx + 1,
      }));
      onUpdateRows(nextRows);
    } else {
      const nextRows = blueprint.rows.map((r) =>
        r.id === editingRow.id ? editingRow : r
      );
      onUpdateRows(nextRows);
    }
    setEditingRow(null);
    setIsNewRow(false);
  };

  const { config } = blueprint;

  return (
    <section
      aria-labelledby="kisi-table-heading"
      className="rounded-xl border border-slate-200 bg-white"
    >
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2
              id="kisi-table-heading"
              className="font-display text-lg font-semibold text-slate-900"
            >
              Tabel Kisi-Kisi Penulisan Soal
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              {config.mataPelajaran}
              <span aria-hidden="true" className="mx-1.5 text-slate-300">
                ·
              </span>
              {GRADE_LABELS[config.kelas]}
              <span aria-hidden="true" className="mx-1.5 text-slate-300">
                ·
              </span>
              {SEMESTER_LABELS[config.semester]}
              <span aria-hidden="true" className="mx-1.5 text-slate-300">
                ·
              </span>
              {config.jenisUjian}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSaveBlueprint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              {savedNotice ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                  <span className="text-emerald-800">Tersimpan</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                  <span>Simpan Arsip</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onCopyMarkdown}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              {copiedMarkdown ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                  <span className="text-emerald-800">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                  <span>Salin Tabel</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              <span>CSV / Excel</span>
            </button>

            <button
              type="button"
              onClick={onExportWord}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <FileText className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              <span>Word (.doc)</span>
            </button>

            <button
              type="button"
              onClick={onOpenPrintPreview}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              <span>Cetak PDF</span>
            </button>

            <button
              type="button"
              onClick={onOpenNaskahSoal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-900 whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Susun Naskah Soal</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari materi, CP, TP, indikator, atau nomor..."
                aria-label="Cari baris kisi-kisi"
                className="w-full rounded-lg border border-slate-300 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:bg-white focus:outline-none"
              />
            </div>

            <select
              aria-label="Filter level kognitif"
              value={filterCog}
              onChange={(e) => setFilterCog(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-700 focus:outline-none"
            >
              <option value="ALL">Semua Level (C1–C6)</option>
              <option value="HOTS">Fokus HOTS (C4–C6)</option>
              {COGNITIVE_OPTIONS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl} — {COGNITIVE_LEVELS[lvl].label}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter bentuk soal"
              value={filterForm}
              onChange={(e) => setFilterForm(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-700 focus:outline-none"
            >
              <option value="ALL">Semua Bentuk Soal</option>
              {QUESTION_FORMS.map((form) => (
                <option key={form} value={form}>
                  {form}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900 transition-colors hover:bg-blue-100 whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tambah Baris Manual</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="kisi-table w-full min-w-[1120px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
              <th className="w-12 px-3 py-3 text-center">No</th>
              <th className="w-[18%] px-3 py-3">Capaian Pembelajaran (CP)</th>
              <th className="w-[16%] px-3 py-3">Tujuan Pembelajaran (TP)</th>
              <th className="w-[13%] px-3 py-3">Materi</th>
              <th className="w-[24%] px-3 py-3">Indikator Soal</th>
              <th className="w-[11%] px-3 py-3">Level Kognitif</th>
              <th className="w-[9%] px-3 py-3">Bentuk Soal</th>
              <th className="w-[7%] px-3 py-3 text-center">Nomor Soal</th>
              <th className="no-print w-24 px-3 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-500">
                  Tidak ada baris kisi-kisi yang cocok dengan filter atau pencarian Anda.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const cogMeta = COGNITIVE_LEVELS[row.levelKognitif];
                const originalIdx = blueprint.rows.findIndex((r) => r.id === row.id);
                return (
                  <tr
                    key={row.id}
                    className="align-top transition-colors hover:bg-slate-50/75"
                  >
                    <td className="px-3 py-3.5 text-center font-mono font-medium text-slate-500 tabular-nums">
                      {row.no}
                    </td>
                    <td className="px-3 py-3.5 leading-relaxed text-slate-700">
                      {row.capaianPembelajaran}
                    </td>
                    <td className="px-3 py-3.5 leading-relaxed text-slate-800">
                      {row.tujuanPembelajaran}
                    </td>
                    <td className="px-3 py-3.5 font-medium text-slate-900">
                      {row.materi}
                    </td>
                    <td className="px-3 py-3.5 leading-relaxed text-slate-800">
                      <p>{row.indikatorSoal}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        KKO: <span className="font-medium text-slate-700">{row.kataKerjaOperasional}</span>
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
                      <div
                        className={`inline-flex flex-col rounded-md border px-2 py-1 text-[11px] leading-tight ${cogMeta.badgeClass}`}
                      >
                        <span className="font-mono font-semibold">
                          {row.levelKognitif} · {cogMeta.tier}
                        </span>
                        <span className="mt-0.5 text-[10px] opacity-90">
                          {cogMeta.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 font-medium text-slate-800">
                      {row.bentukSoal}
                    </td>
                    <td className="px-3 py-3.5 text-center font-mono font-semibold text-slate-900 tabular-nums">
                      {row.nomorSoal}
                    </td>
                    <td className="no-print px-3 py-3.5 text-right">
                      <div className="inline-flex flex-col items-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onInspectSampleItem(row)}
                          title="Buat contoh butir soal & kunci jawaban untuk indikator ini"
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50/70 px-2 py-1 text-[11px] font-medium text-blue-900 transition-colors hover:bg-blue-100 whitespace-nowrap"
                        >
                          <FileQuestion className="h-3 w-3" aria-hidden="true" />
                          <span>Butir Soal</span>
                        </button>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveRow(originalIdx, -1)}
                            disabled={originalIdx <= 0}
                            aria-label={`Pindahkan baris ${row.no} ke atas`}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveRow(originalIdx, 1)}
                            disabled={originalIdx >= blueprint.rows.length - 1}
                            aria-label={`Pindahkan baris ${row.no} ke bawah`}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewRow(false);
                              setEditingRow({ ...row });
                            }}
                            aria-label={`Edit baris ${row.no}`}
                            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-blue-800"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            aria-label={`Hapus baris ${row.no}`}
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editingRow && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-row-title"
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3
                id="edit-row-title"
                className="font-display text-base font-semibold text-slate-900"
              >
                {isNewRow ? 'Tambah Baris Kisi-Kisi' : `Edit Baris Kisi-Kisi No. ${editingRow.no}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingRow(null);
                  setIsNewRow(false);
                }}
                aria-label="Tutup editor baris"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedRow} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Capaian Pembelajaran (CP)
                </label>
                <textarea
                  required
                  rows={2}
                  value={editingRow.capaianPembelajaran}
                  onChange={(e) =>
                    setEditingRow({ ...editingRow, capaianPembelajaran: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tujuan Pembelajaran (TP)
                </label>
                <textarea
                  required
                  rows={2}
                  value={editingRow.tujuanPembelajaran}
                  onChange={(e) =>
                    setEditingRow({ ...editingRow, tujuanPembelajaran: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Materi / Sub-Materi
                  </label>
                  <input
                    required
                    type="text"
                    value={editingRow.materi}
                    onChange={(e) => setEditingRow({ ...editingRow, materi: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kata Kerja Operasional (KKO)
                  </label>
                  <input
                    required
                    type="text"
                    value={editingRow.kataKerjaOperasional}
                    onChange={(e) =>
                      setEditingRow({ ...editingRow, kataKerjaOperasional: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Indikator Soal
                </label>
                <textarea
                  required
                  rows={3}
                  value={editingRow.indikatorSoal}
                  onChange={(e) =>
                    setEditingRow({ ...editingRow, indikatorSoal: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Level Kognitif
                  </label>
                  <select
                    value={editingRow.levelKognitif}
                    onChange={(e) =>
                      setEditingRow({
                        ...editingRow,
                        levelKognitif: e.target.value as CognitiveLevel,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                  >
                    {COGNITIVE_OPTIONS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl} — {COGNITIVE_LEVELS[lvl].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bentuk Soal
                  </label>
                  <select
                    value={editingRow.bentukSoal}
                    onChange={(e) =>
                      setEditingRow({
                        ...editingRow,
                        bentukSoal: e.target.value as QuestionForm,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                  >
                    {QUESTION_FORMS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Soal
                  </label>
                  <input
                    required
                    type="text"
                    value={editingRow.nomorSoal}
                    onChange={(e) => setEditingRow({ ...editingRow, nomorSoal: e.target.value })}
                    placeholder="Misal: 1, 2"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bobot Skor (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingRow.bobotSkor ?? 5}
                    onChange={(e) =>
                      setEditingRow({
                        ...editingRow,
                        bobotSkor: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRow(null);
                    setIsNewRow(false);
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-800 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
