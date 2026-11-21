import React from 'react';
import { COGNITIVE_LEVELS } from '../data/smpCurriculum';
import type { CognitiveLevel, KisiBlueprint, QuestionForm } from '../types/kisiKisi';
import { countQuestionNumbers } from './CognitiveAnalyticsBar';

interface CognitiveMatrixViewProps {
  blueprint: KisiBlueprint;
}

const LEVELS: CognitiveLevel[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
const FORMS: QuestionForm[] = [
  'Pilihan Ganda',
  'Pilihan Ganda Kompleks',
  'Menjodohkan',
  'Isian Singkat',
  'Uraian',
];

export const CognitiveMatrixView: React.FC<CognitiveMatrixViewProps> = ({
  blueprint,
}) => {
  const matrix: Record<QuestionForm, Record<CognitiveLevel, number>> = {
    'Pilihan Ganda': { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0 },
    'Pilihan Ganda Kompleks': { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0 },
    Menjodohkan: { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0 },
    'Isian Singkat': { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0 },
    Uraian: { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0 },
  };

  for (const row of blueprint.rows) {
    const count = countQuestionNumbers(row.nomorSoal);
    matrix[row.bentukSoal][row.levelKognitif] += count;
  }

  const activeForms = FORMS.filter((f) =>
    LEVELS.some((l) => matrix[f][l] > 0)
  );

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="cross-matrix-heading"
        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div className="pb-4 border-b border-slate-100">
          <h2
            id="cross-matrix-heading"
            className="font-display text-base font-semibold text-slate-900"
          >
            Matriks Silang Bentuk Soal × Level Kognitif (C1–C6)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Menunjukkan jumlah butir soal pada setiap kombinasi bentuk asesmen dan jenjang kognitif Taksonomi Bloom Revisi.
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <th className="px-3 py-2.5 text-left font-semibold">Bentuk Soal</th>
                {LEVELS.map((lvl) => (
                  <th key={lvl} className="px-3 py-2.5 text-center font-mono font-semibold">
                    {lvl}
                    <span className="block font-sans text-[10px] font-normal text-slate-500">
                      {COGNITIVE_LEVELS[lvl].label}
                    </span>
                  </th>
                ))}
                <th className="px-3 py-2.5 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {activeForms.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Belum ada butir soal pada kisi-kisi aktif.
                  </td>
                </tr>
              ) : (
                activeForms.map((form) => {
                  const rowSum = LEVELS.reduce((acc, l) => acc + matrix[form][l], 0);
                  return (
                    <tr key={form} className="hover:bg-slate-50/75">
                      <td className="px-3 py-3 font-medium text-slate-900">{form}</td>
                      {LEVELS.map((lvl) => {
                        const val = matrix[form][lvl];
                        return (
                          <td
                            key={lvl}
                            className={`px-3 py-3 text-center font-mono tabular-nums ${
                              val > 0 ? 'font-semibold text-slate-900' : 'text-slate-300'
                            }`}
                          >
                            {val > 0 ? val : '0'}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {rowSum}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section
        aria-labelledby="bloom-guide-heading"
        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div className="pb-4 border-b border-slate-100">
          <h2
            id="bloom-guide-heading"
            className="font-display text-base font-semibold text-slate-900"
          >
            Panduan Kata Kerja Operasional (KKO) Taksonomi Bloom Revisi C1–C6
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Rujukan ahli evaluasi pendidikan dalam merumuskan indikator soal SMP agar selaras antara stimulus dan tingkat berpikir.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((lvl) => {
            const meta = COGNITIVE_LEVELS[lvl];
            return (
              <div
                key={lvl}
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-sm font-semibold text-slate-900">
                    {meta.code} · {meta.label}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    {meta.tier}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  {meta.description}
                </p>
                <p className="mt-2.5 text-[11px] text-slate-700">
                  <strong className="font-semibold text-slate-900">Contoh KKO: </strong>
                  {meta.kkoExamples.join(', ')}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
