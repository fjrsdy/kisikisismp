import React, { useState } from 'react';
import { Check, Copy, Loader2, RefreshCw, X } from 'lucide-react';
import { COGNITIVE_LEVELS } from '../data/smpCurriculum';
import type { GeneratedSampleItem, KisiRow } from '../types/kisiKisi';

interface ItemPreviewModalProps {
  row: KisiRow | null;
  item: GeneratedSampleItem | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRegenerate: (row: KisiRow) => void;
}

export const ItemPreviewModal: React.FC<ItemPreviewModalProps> = ({
  row,
  item,
  isLoading,
  error,
  onClose,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);

  if (!row) return null;

  const cogMeta = COGNITIVE_LEVELS[row.levelKognitif];

  const handleCopyItem = async () => {
    if (!item) return;
    const text = [
      `Nomor Soal: ${item.nomorSoal} (${item.bentukSoal} · ${item.levelKognitif} ${cogMeta.label})`,
      item.stimulus && item.stimulus !== '-' ? `\nStimulus:\n${item.stimulus}` : '',
      `\nPertanyaan:\n${item.pertanyaan}`,
      item.pilihanJawaban && item.pilihanJawaban.length > 0
        ? `\nPilihan Jawaban:\n${item.pilihanJawaban.join('\n')}`
        : '',
      `\nKunci Jawaban: ${item.kunciJawaban}`,
      `\nPembahasan: ${item.pembahasan}`,
      `\nPedoman Penskoran: ${item.pedomanPenskoran}`,
    ]
      .filter(Boolean)
      .join('\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sample-item-title"
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3
              id="sample-item-title"
              className="font-display text-base font-semibold text-slate-900"
            >
              Contoh Butir Soal — Nomor {row.nomorSoal}
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              {row.materi}
              <span aria-hidden="true" className="mx-1.5 text-slate-300">
                ·
              </span>
              {row.bentukSoal}
              <span aria-hidden="true" className="mx-1.5 text-slate-300">
                ·
              </span>
              <span className="font-mono font-medium text-slate-800">
                {row.levelKognitif} ({cogMeta.label})
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau butir soal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700">
          <strong className="font-semibold text-slate-900">Indikator Soal: </strong>
          {row.indikatorSoal}
        </div>

        <div className="mt-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-800" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-slate-700">
                Menyusun stimulus, butir soal, dan rubrik penskoran...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              <p className="font-semibold">Gagal membuat contoh butir soal</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() => onRegenerate(row)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-red-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-900"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Coba Lagi</span>
              </button>
            </div>
          ) : item ? (
            <div className="space-y-4 text-sm text-slate-800">
              {item.stimulus && item.stimulus !== '-' && (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                    Stimulus / Konteks Soal
                  </div>
                  <p className="whitespace-pre-line leading-relaxed text-slate-800">
                    {item.stimulus}
                  </p>
                </div>
              )}

              <div>
                <div className="text-[11px] font-semibold text-slate-500 mb-1">
                  Pokok Pertanyaan
                </div>
                <p className="whitespace-pre-line font-medium leading-relaxed text-slate-900">
                  {item.pertanyaan}
                </p>
              </div>

              {item.pilihanJawaban && item.pilihanJawaban.length > 0 && (
                <ul className="space-y-1.5 pl-1">
                  {item.pilihanJawaban.map((opt, idx) => (
                    <li
                      key={idx}
                      className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs leading-relaxed text-slate-800"
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5">
                  <div className="text-[11px] font-semibold text-emerald-900 mb-1">
                    Kunci Jawaban
                  </div>
                  <p className="text-xs leading-relaxed text-emerald-950 whitespace-pre-line">
                    {item.kunciJawaban}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                  <div className="text-[11px] font-semibold text-slate-700 mb-1">
                    Pedoman Penskoran
                  </div>
                  <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                    {item.pedomanPenskoran}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                <div className="text-[11px] font-semibold text-slate-700 mb-1">
                  Pembahasan Singkat
                </div>
                <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                  {item.pembahasan}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onRegenerate(row)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Buat Variasi Baru</span>
          </button>

          <div className="flex items-center gap-2">
            {item && (
              <button
                type="button"
                onClick={handleCopyItem}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                    <span className="text-emerald-800">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Salin Butir Soal</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
