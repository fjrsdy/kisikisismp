import React from 'react';
import { FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { COGNITIVE_LEVELS, GRADE_LABELS, SEMESTER_LABELS } from '../data/smpCurriculum';
import type { KisiBlueprint } from '../types/kisiKisi';

interface PrintPreviewViewProps {
  blueprint: KisiBlueprint;
  onExportCSV: () => void;
  onExportWord: () => void;
}

export const PrintPreviewView: React.FC<PrintPreviewViewProps> = ({
  blueprint,
  onExportCSV,
  onExportWord,
}) => {
  const { config, rows } = blueprint;
  const totalSoal =
    config.jumlahPG + config.jumlahPGK + config.jumlahIsian + config.jumlahUraian;

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:px-6">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Pratinjau Dokumen Resmi (Format Cetak A4 Lanskap)
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Siap dicetak menjadi PDF atau diunduh sebagai dokumen Word (.doc) untuk administrasi MGMP dan kurikulum sekolah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Unduh CSV</span>
          </button>
          <button
            type="button"
            onClick={onExportWord}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Unduh Word (.doc)</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-800 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 whitespace-nowrap"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      <article className="print-table-container rounded-xl border border-slate-300 bg-white p-6 sm:p-10 text-slate-950">
        <header className="border-b-2 border-slate-900 pb-3 text-center">
          <h1 className="font-display text-base font-bold uppercase tracking-wide text-slate-950 sm:text-lg">
            Kisi-Kisi Penulisan Soal {config.jenisUjian}
          </h1>
          <p className="mt-0.5 text-sm font-medium text-slate-800">
            {config.namaSekolah || 'Satuan Pendidikan SMP'} · Tahun Ajaran {config.tahunAjaran}
          </p>
        </header>

        <div className="my-4 grid grid-cols-1 gap-x-8 gap-y-1.5 text-xs sm:grid-cols-2">
          <div className="flex">
            <span className="w-36 shrink-0 font-semibold">Mata Pelajaran</span>
            <span>: {config.mataPelajaran}</span>
          </div>
          <div className="flex">
            <span className="w-36 shrink-0 font-semibold">Kurikulum</span>
            <span>: {config.kurikulum}</span>
          </div>
          <div className="flex">
            <span className="w-36 shrink-0 font-semibold">Kelas / Semester</span>
            <span>
              : {GRADE_LABELS[config.kelas]} / {SEMESTER_LABELS[config.semester]}
            </span>
          </div>
          <div className="flex">
            <span className="w-36 shrink-0 font-semibold">Jumlah Soal</span>
            <span className="tabular-nums">
              : {totalSoal} Butir ({config.jumlahPG} PG, {config.jumlahPGK} PGK,{' '}
              {config.jumlahIsian} Isian, {config.jumlahUraian} Uraian)
            </span>
          </div>
          <div className="flex">
            <span className="w-36 shrink-0 font-semibold">Alokasi Waktu</span>
            <span>: {config.alokasiWaktu}</span>
          </div>
          <div className="flex">
            <span className="w-36 shrink-0 font-semibold">Materi Pokok</span>
            <span>: {config.materiPokok}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="kisi-table w-full border-collapse border border-slate-800 text-[11px]">
            <thead>
              <tr className="bg-slate-100 text-center font-semibold text-slate-900">
                <th className="border border-slate-800 px-2 py-2 w-9">No</th>
                <th className="border border-slate-800 px-2.5 py-2 w-[18%]">
                  Capaian Pembelajaran
                </th>
                <th className="border border-slate-800 px-2.5 py-2 w-[17%]">
                  Tujuan Pembelajaran
                </th>
                <th className="border border-slate-800 px-2.5 py-2 w-[13%]">Materi</th>
                <th className="border border-slate-800 px-2.5 py-2 w-[26%]">
                  Indikator Soal
                </th>
                <th className="border border-slate-800 px-2 py-2 w-[10%]">
                  Level Kognitif
                </th>
                <th className="border border-slate-800 px-2 py-2 w-[9%]">Bentuk Soal</th>
                <th className="border border-slate-800 px-2 py-2 w-[7%]">Nomor Soal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="align-top">
                  <td className="border border-slate-800 px-2 py-2 text-center font-mono tabular-nums">
                    {row.no}
                  </td>
                  <td className="border border-slate-800 px-2.5 py-2 leading-snug">
                    {row.capaianPembelajaran}
                  </td>
                  <td className="border border-slate-800 px-2.5 py-2 leading-snug">
                    {row.tujuanPembelajaran}
                  </td>
                  <td className="border border-slate-800 px-2.5 py-2 font-medium">
                    {row.materi}
                  </td>
                  <td className="border border-slate-800 px-2.5 py-2 leading-snug">
                    {row.indikatorSoal}
                  </td>
                  <td className="border border-slate-800 px-2 py-2 text-center">
                    <span className="font-mono font-semibold">{row.levelKognitif}</span>
                    <div className="text-[10px] text-slate-700">
                      ({COGNITIVE_LEVELS[row.levelKognitif].label})
                    </div>
                  </td>
                  <td className="border border-slate-800 px-2 py-2 text-center">
                    {row.bentukSoal}
                  </td>
                  <td className="border border-slate-800 px-2 py-2 text-center font-mono font-semibold tabular-nums">
                    {row.nomorSoal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="mt-8 grid grid-cols-2 gap-8 text-xs">
          <div>
            <p>Mengetahui,</p>
            <p>Kepala Sekolah</p>
            <div className="h-16" />
            <p className="font-semibold underline">
              {config.namaKepalaSekolah || '___________________________'}
            </p>
            <p className="font-mono text-[11px]">
              NIP. {config.nipKepalaSekolah || '____________________'}
            </p>
          </div>
          <div className="pl-8 sm:pl-24">
            <p>Penyusun Soal,</p>
            <p>Guru Mata Pelajaran</p>
            <div className="h-16" />
            <p className="font-semibold underline">
              {config.namaPenyusun || '___________________________'}
            </p>
            <p className="font-mono text-[11px]">
              NIP. {config.nipPenyusun || '____________________'}
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
};
