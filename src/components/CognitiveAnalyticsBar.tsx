import React from 'react';
import { COGNITIVE_LEVELS } from '../data/smpCurriculum';
import type { CognitiveLevel, KisiBlueprint } from '../types/kisiKisi';

interface CognitiveAnalyticsBarProps {
  blueprint: KisiBlueprint;
  onOpenMatrix?: () => void;
}

const LEVELS: CognitiveLevel[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];

export function countQuestionNumbers(nomorSoal: string): number {
  const cleaned = nomorSoal.trim();
  if (!cleaned) return 0;
  // Handle ranges like "1-3" or "1–3" and comma lists like "1, 2, 3"
  const parts = cleaned.split(/[,;]+/).map((p) => p.trim()).filter(Boolean);
  let total = 0;
  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (end >= start) {
        total += end - start + 1;
      } else {
        total += 1;
      }
    } else if (/^\d+$/.test(part)) {
      total += 1;
    }
  }
  return total || 1;
}

export const CognitiveAnalyticsBar: React.FC<CognitiveAnalyticsBarProps> = ({
  blueprint,
  onOpenMatrix,
}) => {
  const { rows, catatanAhliEvaluasi } = blueprint;

  const countsByLevel: Record<CognitiveLevel, number> = {
    C1: 0,
    C2: 0,
    C3: 0,
    C4: 0,
    C5: 0,
    C6: 0,
  };

  let totalQuestions = 0;
  let totalWeight = 0;
  const countsByForm: Record<string, number> = {};

  for (const row of rows) {
    const qCount = countQuestionNumbers(row.nomorSoal);
    countsByLevel[row.levelKognitif] += qCount;
    totalQuestions += qCount;
    totalWeight += row.bobotSkor ?? 0;
    countsByForm[row.bentukSoal] = (countsByForm[row.bentukSoal] || 0) + qCount;
  }

  const lotsCount = countsByLevel.C1 + countsByLevel.C2;
  const motsCount = countsByLevel.C3;
  const hotsCount = countsByLevel.C4 + countsByLevel.C5 + countsByLevel.C6;

  const pct = (n: number) =>
    totalQuestions > 0 ? Math.round((n / totalQuestions) * 100) : 0;

  return (
    <section
      aria-labelledby="analytics-title"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2
            id="analytics-title"
            className="font-display text-base font-semibold text-slate-900"
          >
            Matriks Keseimbangan Taksonomi Bloom (C1–C6)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Audit proporsi soal LOTS (C1–C2), MOTS (C3), dan HOTS (C4–C6) berdasarkan jumlah butir soal aktual.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600 tabular-nums">
          <span>
            Baris Indikator: <strong className="font-mono text-slate-900">{rows.length}</strong>
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span>
            Total Butir: <strong className="font-mono text-slate-900">{totalQuestions}</strong>
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span>
            Akumulasi Bobot: <strong className="font-mono text-slate-900">{totalWeight}%</strong>
          </span>
          {onOpenMatrix && (
            <>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <button
                type="button"
                onClick={onOpenMatrix}
                className="font-medium text-blue-800 hover:underline whitespace-nowrap"
              >
                Matriks Silang C1–C6
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
            {LEVELS.map((lvl) => {
              const widthPct = totalQuestions > 0 ? (countsByLevel[lvl] / totalQuestions) * 100 : 0;
              if (widthPct <= 0) return null;
              return (
                <div
                  key={lvl}
                  style={{ width: `${widthPct}%` }}
                  className={`${COGNITIVE_LEVELS[lvl].barClass} transition-all duration-200`}
                  title={`${lvl} (${COGNITIVE_LEVELS[lvl].label}): ${countsByLevel[lvl]} soal (${Math.round(widthPct)}%)`}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
            {LEVELS.map((lvl) => {
              const meta = COGNITIVE_LEVELS[lvl];
              const count = countsByLevel[lvl];
              return (
                <div
                  key={lvl}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-xs font-semibold text-slate-900">
                      {lvl}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                      {pct(count)}%
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-600 truncate">
                    {meta.label}
                  </div>
                  <div className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                    {count} <span className="text-[11px] font-normal text-slate-500">soal</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-3 border-t border-slate-100 pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-slate-200 px-3 py-2">
              <div className="text-[11px] font-medium text-slate-500">LOTS (C1–C2)</div>
              <div className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums">
                {pct(lotsCount)}%
              </div>
              <div className="text-[11px] text-slate-500 tabular-nums">{lotsCount} butir</div>
            </div>
            <div className="rounded-lg border border-teal-200 bg-teal-50/40 px-3 py-2">
              <div className="text-[11px] font-medium text-teal-800">MOTS (C3)</div>
              <div className="mt-0.5 font-mono text-base font-semibold text-teal-900 tabular-nums">
                {pct(motsCount)}%
              </div>
              <div className="text-[11px] text-teal-700 tabular-nums">{motsCount} butir</div>
            </div>
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 px-3 py-2">
              <div className="text-[11px] font-medium text-indigo-800">HOTS (C4–C6)</div>
              <div className="mt-0.5 font-mono text-base font-semibold text-indigo-900 tabular-nums">
                {pct(hotsCount)}%
              </div>
              <div className="text-[11px] text-indigo-700 tabular-nums">{hotsCount} butir</div>
            </div>
          </div>

          {catatanAhliEvaluasi && (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-700">
              <strong className="font-semibold text-slate-900">Catatan Evaluasi: </strong>
              {catatanAhliEvaluasi}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
