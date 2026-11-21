import { GRADE_LABELS, SEMESTER_LABELS, COGNITIVE_LEVELS } from '../data/smpCurriculum';
import type { KisiBlueprint } from '../types/kisiKisi';

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeHtml(value: string | number): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugifyFileName(blueprint: KisiBlueprint): string {
  const mapel = blueprint.config.mataPelajaran
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `kisi-kisi-${mapel}-kelas-${blueprint.config.kelas}-sem-${blueprint.config.semester}`;
}

export function exportToCSV(blueprint: KisiBlueprint): void {
  const { config, rows } = blueprint;
  const metaLines = [
    ['KISI-KISI PENULISAN SOAL UJIAN SEMESTER'],
    ['Satuan Pendidikan', config.namaSekolah || '-'],
    ['Mata Pelajaran', config.mataPelajaran],
    ['Kelas / Semester', `${GRADE_LABELS[config.kelas]} / ${SEMESTER_LABELS[config.semester]}`],
    ['Jenis Ujian', config.jenisUjian],
    ['Kurikulum', config.kurikulum],
    ['Tahun Ajaran', config.tahunAjaran || '-'],
    ['Alokasi Waktu', config.alokasiWaktu || '-'],
    [],
  ];

  const headers = [
    'No',
    'Capaian Pembelajaran',
    'Tujuan Pembelajaran',
    'Materi',
    'Indikator Soal',
    'Level Kognitif',
    'KKO',
    'Bentuk Soal',
    'Nomor Soal',
    'Bobot (%)',
  ];

  const dataRows = rows.map((row) => [
    row.no,
    row.capaianPembelajaran,
    row.tujuanPembelajaran,
    row.materi,
    row.indikatorSoal,
    `${row.levelKognitif} (${COGNITIVE_LEVELS[row.levelKognitif].label})`,
    row.kataKerjaOperasional,
    row.bentukSoal,
    row.nomorSoal,
    row.bobotSkor ?? '',
  ]);

  const csvContent =
    '\uFEFF' +
    [...metaLines, headers, ...dataRows]
      .map((line) => line.map(escapeCsvCell).join(','))
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugifyFileName(blueprint)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToWordDoc(blueprint: KisiBlueprint): void {
  const { config, rows } = blueprint;
  const totalSoal =
    config.jumlahPG + config.jumlahPGK + config.jumlahIsian + config.jumlahUraian;

  const tableRowsHtml = rows
    .map(
      (row) => `
      <tr>
        <td style="text-align:center; width:36px;">${row.no}</td>
        <td>${escapeHtml(row.capaianPembelajaran)}</td>
        <td>${escapeHtml(row.tujuanPembelajaran)}</td>
        <td>${escapeHtml(row.materi)}</td>
        <td>${escapeHtml(row.indikatorSoal)}</td>
        <td style="text-align:center; white-space:nowrap;"><strong>${escapeHtml(row.levelKognitif)}</strong><br/><span style="font-size:8.5pt; color:#334155;">(${escapeHtml(COGNITIVE_LEVELS[row.levelKognitif].label)})</span></td>
        <td style="text-align:center;">${escapeHtml(row.bentukSoal)}</td>
        <td style="text-align:center; font-family:monospace;">${escapeHtml(row.nomorSoal)}</td>
      </tr>`
    )
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <title>Kisi-Kisi Ujian Semester - ${escapeHtml(config.mataPelajaran)}</title>
      <style>
        @page Section1 {
          size: 29.7cm 21.0cm;
          margin: 1.5cm 1.5cm 1.5cm 1.5cm;
          mso-page-orientation: landscape;
        }
        div.Section1 { page: Section1; }
        body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; color: #0f172a; }
        h2 { text-align: center; margin: 0 0 2px 0; font-size: 13pt; text-transform: uppercase; }
        h3 { text-align: center; margin: 0 0 12px 0; font-size: 11pt; font-weight: normal; }
        table.meta { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9.5pt; }
        table.meta td { padding: 2px 6px; vertical-align: top; }
        table.grid { width: 100%; border-collapse: collapse; font-size: 9pt; }
        table.grid th, table.grid td { border: 1px solid #1e293b; padding: 5px 6px; vertical-align: top; }
        table.grid th { background-color: #e2e8f0; text-align: center; font-weight: bold; }
        table.sign { width: 100%; margin-top: 24px; font-size: 9.5pt; border-collapse: collapse; }
        table.sign td { width: 50%; vertical-align: top; padding: 4px 16px; }
      </style>
    </head>
    <body>
      <div class="Section1">
        <h2>Kisi-Kisi Penulisan Soal ${escapeHtml(config.jenisUjian)}</h2>
        <h3>${escapeHtml(config.namaSekolah || 'SMP')} &bull; Tahun Ajaran ${escapeHtml(config.tahunAjaran)}</h3>

        <table class="meta">
          <tr>
            <td style="width:16%;"><strong>Mata Pelajaran</strong></td>
            <td style="width:34%;">: ${escapeHtml(config.mataPelajaran)}</td>
            <td style="width:16%;"><strong>Kurikulum</strong></td>
            <td style="width:34%;">: ${escapeHtml(config.kurikulum)}</td>
          </tr>
          <tr>
            <td><strong>Kelas / Semester</strong></td>
            <td>: ${escapeHtml(GRADE_LABELS[config.kelas])} / ${escapeHtml(SEMESTER_LABELS[config.semester])}</td>
            <td><strong>Jumlah Soal</strong></td>
            <td>: ${totalSoal} Butir (${config.jumlahPG} PG, ${config.jumlahPGK} PGK, ${config.jumlahIsian} Isian, ${config.jumlahUraian} Uraian)</td>
          </tr>
          <tr>
            <td><strong>Alokasi Waktu</strong></td>
            <td>: ${escapeHtml(config.alokasiWaktu)}</td>
            <td><strong>Materi Pokok</strong></td>
            <td>: ${escapeHtml(config.materiPokok)}</td>
          </tr>
        </table>

        <table class="grid">
          <thead>
            <tr>
              <th>No</th>
              <th>Capaian Pembelajaran (CP)</th>
              <th>Tujuan Pembelajaran (TP)</th>
              <th>Materi</th>
              <th>Indikator Soal</th>
              <th>Level Kognitif</th>
              <th>Bentuk Soal</th>
              <th>Nomor Soal</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <table class="sign">
          <tr>
            <td>
              Mengetahui,<br/>
              Kepala Sekolah<br/><br/><br/><br/>
              <strong><u>${escapeHtml(config.namaKepalaSekolah || '______________________')}</u></strong><br/>
              NIP. ${escapeHtml(config.nipKepalaSekolah || '____________________')}
            </td>
            <td style="padding-left: 140px;">
              Guru Mata Pelajaran / Penyusun<br/><br/><br/><br/><br/>
              <strong><u>${escapeHtml(config.namaPenyusun || '______________________')}</u></strong><br/>
              NIP. ${escapeHtml(config.nipPenyusun || '____________________')}
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugifyFileName(blueprint)}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildMarkdownTable(blueprint: KisiBlueprint): string {
  const { config, rows } = blueprint;
  const header = [
    `### Kisi-Kisi ${config.jenisUjian} — ${config.mataPelajaran}`,
    `**Kelas:** ${GRADE_LABELS[config.kelas]} | **Semester:** ${SEMESTER_LABELS[config.semester]} | **Kurikulum:** ${config.kurikulum}`,
    '',
    '| No | Capaian Pembelajaran | Tujuan Pembelajaran | Materi | Indikator Soal | Level Kognitif | Bentuk Soal | Nomor Soal |',
    '| :---: | :--- | :--- | :--- | :--- | :---: | :---: | :---: |',
  ];

  const sanitize = (s: string) => s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

  const lines = rows.map(
    (r) =>
      `| ${r.no} | ${sanitize(r.capaianPembelajaran)} | ${sanitize(r.tujuanPembelajaran)} | ${sanitize(r.materi)} | ${sanitize(r.indikatorSoal)} | ${r.levelKognitif} (${COGNITIVE_LEVELS[r.levelKognitif].label}) | ${r.bentukSoal} | ${r.nomorSoal} |`
  );

  return [...header, ...lines].join('\n');
}

export function exportExamPaperToWordDoc(
  paper: import('../types/kisiKisi').ExamPaperPackage,
  includeAnswerKey: boolean
): void {
  const pgHtml = paper.pilihanGanda
    .map(
      (q) => `
      <div style="margin-bottom: 12px; page-break-inside: avoid;">
        ${
          q.stimulus && q.stimulus !== '-'
            ? `<div style="background:#f8fafc; border:1px solid #cbd5e1; padding:6px 8px; margin-bottom:4px; font-size:9.5pt;">${escapeHtml(q.stimulus)}</div>`
            : ''
        }
        <p style="margin:0 0 4px 0;"><strong>${q.nomor}.</strong> ${escapeHtml(q.pertanyaan)}</p>
        <table style="width:100%; border-collapse:collapse; margin-left:16px; font-size:10pt;">
          <tr><td style="width:50%; padding:1px 6px;">A. ${escapeHtml(q.pilihan.A)}</td><td style="width:50%; padding:1px 6px;">C. ${escapeHtml(q.pilihan.C)}</td></tr>
          <tr><td style="padding:1px 6px;">B. ${escapeHtml(q.pilihan.B)}</td><td style="padding:1px 6px;">D. ${escapeHtml(q.pilihan.D)}</td></tr>
        </table>
        ${
          includeAnswerKey
            ? `<div style="margin-top:4px; margin-left:16px; font-size:9pt; color:#1e3a8a;"><strong>Kunci: ${escapeHtml(q.kunciJawaban)}</strong> | ${escapeHtml(q.levelKognitif)} · ${escapeHtml(q.tingkatKesulitan)} | Indikator: ${escapeHtml(q.indikatorTerkait)}<br/>Pembahasan: ${escapeHtml(q.pembahasan)}</div>`
            : ''
        }
      </div>`
    )
    .join('');

  const isianHtml = paper.isianSingkat
    .map(
      (q) => `
      <div style="margin-bottom: 10px; page-break-inside: avoid;">
        ${
          q.stimulus && q.stimulus !== '-'
            ? `<div style="background:#f8fafc; border:1px solid #cbd5e1; padding:6px 8px; margin-bottom:4px; font-size:9.5pt;">${escapeHtml(q.stimulus)}</div>`
            : ''
        }
        <p style="margin:0;"><strong>${q.nomor}.</strong> ${escapeHtml(q.pertanyaan)}</p>
        ${
          includeAnswerKey
            ? `<div style="margin-top:3px; margin-left:16px; font-size:9pt; color:#1e3a8a;"><strong>Kunci:</strong> ${escapeHtml(q.kunciJawaban)} (${escapeHtml(q.levelKognitif)} · ${escapeHtml(q.tingkatKesulitan)})<br/>Penskoran: ${escapeHtml(q.pedomanPenskoran)}</div>`
            : ''
        }
      </div>`
    )
    .join('');

  const uraianHtml = paper.uraian
    .map(
      (q) => `
      <div style="margin-bottom: 12px; page-break-inside: avoid;">
        ${
          q.stimulus && q.stimulus !== '-'
            ? `<div style="background:#f8fafc; border:1px solid #cbd5e1; padding:6px 8px; margin-bottom:4px; font-size:9.5pt;">${escapeHtml(q.stimulus)}</div>`
            : ''
        }
        <p style="margin:0;"><strong>${q.nomor}.</strong> ${escapeHtml(q.pertanyaan)} ${includeAnswerKey ? `<span style="font-size:9pt;">(Skor Maks: ${q.skorMaksimal})</span>` : ''}</p>
        ${
          includeAnswerKey
            ? `<div style="margin-top:4px; margin-left:16px; font-size:9pt; color:#1e3a8a;"><strong>Kunci / Penyelesaian:</strong> ${escapeHtml(q.kunciJawaban)}<br/><strong>Pedoman Penskoran:</strong> ${escapeHtml(q.pedomanPenskoran)} (${escapeHtml(q.levelKognitif)} · ${escapeHtml(q.tingkatKesulitan)})</div>`
            : ''
        }
      </div>`
    )
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(paper.judulUjian)}</title>
      <style>
        @page Section1 { size: 21.0cm 29.7cm; margin: 1.8cm; }
        div.Section1 { page: Section1; }
        body { font-family: Calibri, Arial, sans-serif; font-size: 10.5pt; color: #0f172a; line-height: 1.4; }
        h2 { text-align: center; margin: 0 0 2px 0; font-size: 13pt; text-transform: uppercase; }
        h3 { text-align: center; margin: 0 0 10px 0; font-size: 11pt; font-weight: normal; }
        h4 { margin: 14px 0 8px 0; font-size: 11pt; border-bottom: 1px solid #1e293b; padding-bottom: 2px; }
        table.meta { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9.5pt; border-bottom: 2px solid #0f172a; padding-bottom: 6px; }
        table.meta td { padding: 2px 4px; }
      </style>
    </head>
    <body>
      <div class="Section1">
        <h2>${escapeHtml(paper.judulUjian)}${includeAnswerKey ? ' (KUNCI &amp; RUBRIK)' : ''}</h2>
        <h3>${escapeHtml(paper.namaSekolah)} &bull; Tahun Ajaran ${escapeHtml(paper.tahunAjaran)}</h3>
        <table class="meta">
          <tr>
            <td><strong>Mata Pelajaran:</strong> ${escapeHtml(paper.mataPelajaran)}</td>
            <td><strong>Kelas / Semester:</strong> ${escapeHtml(paper.kelasLabel)} / ${escapeHtml(paper.semesterLabel)}</td>
            <td><strong>Waktu:</strong> ${escapeHtml(paper.alokasiWaktu)}</td>
          </tr>
        </table>

        ${paper.pilihanGanda.length > 0 ? `<h4>A. Pilihan Ganda (${paper.pilihanGanda.length} Soal)</h4>${pgHtml}` : ''}
        ${paper.isianSingkat.length > 0 ? `<h4>B. Isian Singkat (${paper.isianSingkat.length} Soal)</h4>${isianHtml}` : ''}
        ${paper.uraian.length > 0 ? `<h4>C. Uraian (${paper.uraian.length} Soal)</h4>${uraianHtml}` : ''}
      </div>
    </body>
    </html>
  `;

  const slug = paper.mataPelajaran.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const suffix = includeAnswerKey ? 'kunci-rubrik' : 'naskah-siswa';
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `soal-${slug}-${suffix}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAssessmentGuideToWordDoc(
  guide: import('../types/kisiKisi').AssessmentGuidePackage
): void {
  const maxPG = guide.kunciPG.reduce((s, item) => s + item.skorMaksimal, 0);
  const maxIsian = guide.kunciIsian.reduce((s, item) => s + item.skorMaksimal, 0);
  const maxUraian = guide.kunciUraian.reduce((s, item) => s + item.skorMaksimal, 0);
  const maxTotal = maxPG + maxIsian + maxUraian;

  const pgRows = guide.kunciPG
    .map(
      (item) => `
      <tr>
        <td style="text-align:center; font-family:monospace;">${item.nomor}</td>
        <td>${escapeHtml(item.ringkasanSoal)}</td>
        <td style="text-align:center; font-weight:bold;">${escapeHtml(item.kunciJawaban)}</td>
        <td>${escapeHtml(item.pembahasanSingkat)}</td>
        <td style="text-align:center; font-family:monospace;">${item.skorMaksimal}</td>
      </tr>`
    )
    .join('');

  const isianRows = guide.kunciIsian
    .map(
      (item) => `
      <tr>
        <td style="text-align:center; font-family:monospace;">${item.nomor}</td>
        <td>${escapeHtml(item.ringkasanSoal)}</td>
        <td>
          <strong>Kunci Utama:</strong> ${escapeHtml(item.kunciUtama)}<br/>
          <strong>Alternatif Jawaban:</strong> ${escapeHtml(item.alternatifJawaban.join(' | ') || '-')}<br/>
          <span style="color:#334155;">${escapeHtml(item.pembahasanSingkat)}</span>
        </td>
        <td>
          ${item.rubrikPenskoran
            .map((r) => `&bull; ${escapeHtml(r.kriteria)} (<strong>Skor ${r.skor}</strong>)`)
            .join('<br/>')}
        </td>
        <td style="text-align:center; font-family:monospace;">${item.skorMaksimal}</td>
      </tr>`
    )
    .join('');

  const uraianRows = guide.kunciUraian
    .map(
      (item) => `
      <tr>
        <td style="text-align:center; font-family:monospace;">${item.nomor}</td>
        <td>${escapeHtml(item.ringkasanSoal)}</td>
        <td>
          <strong>Kunci Utama:</strong> ${escapeHtml(item.kunciUtama)}<br/>
          <strong>Alternatif Penyelesaian:</strong> ${escapeHtml(item.alternatifJawaban.join(' | ') || '-')}<br/>
          <span style="color:#334155;">${escapeHtml(item.pembahasanSingkat)}</span>
        </td>
        <td>
          ${item.rubrikPenskoran
            .map((r) => `&bull; ${escapeHtml(r.kriteria)} (<strong>Skor ${r.skor}</strong>)`)
            .join('<br/>')}
        </td>
        <td style="text-align:center; font-family:monospace;">${item.skorMaksimal}</td>
      </tr>`
    )
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <title>Kunci Jawaban dan Pedoman Penilaian - ${escapeHtml(guide.judulUjian)}</title>
      <style>
        @page Section1 { size: 21.0cm 29.7cm; margin: 1.6cm; }
        div.Section1 { page: Section1; }
        body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; color: #0f172a; }
        h2 { text-align: center; margin: 0 0 2px 0; font-size: 13pt; text-transform: uppercase; }
        h3 { text-align: center; margin: 0 0 12px 0; font-size: 10.5pt; font-weight: normal; }
        h4 { margin: 14px 0 6px 0; font-size: 10.5pt; }
        table.grid { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9pt; }
        table.grid th, table.grid td { border: 1px solid #1e293b; padding: 5px 6px; vertical-align: top; }
        table.grid th { background-color: #e2e8f0; text-align: center; }
        .formula { border: 1px solid #1e293b; background: #f8fafc; padding: 8px 10px; margin-bottom: 14px; font-size: 9.5pt; }
      </style>
    </head>
    <body>
      <div class="Section1">
        <h2>Kunci Jawaban, Pembahasan, dan Pedoman Penilaian</h2>
        <h3>${escapeHtml(guide.judulUjian)} &bull; ${escapeHtml(guide.mataPelajaran)} (${escapeHtml(guide.kelasLabel)})</h3>

        <div class="formula">
          <strong>Rekapitulasi Skor Maksimal:</strong> PG = ${maxPG} (${guide.kunciPG.length} soal) | Isian Singkat = ${maxIsian} (${guide.kunciIsian.length} soal) | Uraian = ${maxUraian} (${guide.kunciUraian.length} soal) | <strong>Skor Maksimal Total = ${maxTotal}</strong><br/>
          <strong>Rumus Nilai Akhir:</strong> ${escapeHtml(guide.rumusNilaiAkhir)}<br/>
          <strong>Alternatif Berbobot:</strong> ${escapeHtml(guide.rumusBerbobotOpsional)}
        </div>

        ${
          guide.kunciPG.length > 0
            ? `<h4>A. Kunci Jawaban &amp; Pembahasan Singkat Pilihan Ganda</h4>
               <table class="grid">
                 <thead><tr><th style="width:36px;">No</th><th style="width:28%;">Ringkasan Soal</th><th style="width:46px;">Kunci</th><th>Pembahasan Singkat</th><th style="width:48px;">Skor</th></tr></thead>
                 <tbody>${pgRows}</tbody>
               </table>`
            : ''
        }

        ${
          guide.kunciIsian.length > 0
            ? `<h4>B. Kunci, Alternatif Jawaban, &amp; Rubrik Penskoran Isian Singkat</h4>
               <table class="grid">
                 <thead><tr><th style="width:36px;">No</th><th style="width:24%;">Ringkasan Soal</th><th style="width:36%;">Kunci, Alternatif &amp; Pembahasan</th><th>Rubrik Penskoran</th><th style="width:52px;">Skor Maks</th></tr></thead>
                 <tbody>${isianRows}</tbody>
               </table>`
            : ''
        }

        ${
          guide.kunciUraian.length > 0
            ? `<h4>C. Kunci, Alternatif Penyelesaian, &amp; Rubrik Penskoran Uraian</h4>
               <table class="grid">
                 <thead><tr><th style="width:36px;">No</th><th style="width:22%;">Ringkasan Soal</th><th style="width:36%;">Kunci, Alternatif &amp; Pembahasan</th><th>Rubrik Penskoran</th><th style="width:52px;">Skor Maks</th></tr></thead>
                 <tbody>${uraianRows}</tbody>
               </table>`
            : ''
        }
      </div>
    </body>
    </html>
  `;

  const slug = guide.mataPelajaran.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pedoman-penilaian-${slug}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportScoreAnalysisToCSV(params: {
  mataPelajaran: string;
  kelasLabel: string;
  kktp: number;
  records: import('../types/kisiKisi').StudentScoreRecord[];
  stats: import('../types/kisiKisi').ScoreStatistics;
}): void {
  const { mataPelajaran, kelasLabel, kktp, records, stats } = params;
  const summary = [
    ['LAPORAN ANALISIS HASIL UJIAN SISWA'],
    ['Mata Pelajaran', mataPelajaran],
    ['Kelas', kelasLabel],
    ['KKTP / KKM', kktp],
    ['Jumlah Siswa', stats.totalSiswa],
    ['Nilai Rata-Rata', stats.rataRata],
    ['Nilai Tertinggi', stats.nilaiTertinggi],
    ['Nilai Terendah', stats.nilaiTerendah],
    ['Jumlah Tuntas', stats.jumlahTuntas],
    ['Jumlah Belum Tuntas', stats.jumlahBelumTuntas],
    ['Persentase Ketuntasan (%)', stats.persentaseKetuntasan],
    [],
    ['No', 'Nama Siswa', 'Nilai', 'Status Ketuntasan', 'Tindak Lanjut'],
  ];

  const rows = records.map((r) => [
    r.no,
    r.nama,
    r.nilai,
    r.nilai >= kktp ? 'Tuntas' : 'Belum Tuntas',
    r.nilai >= kktp ? 'Pengayaan' : 'Remedial',
  ]);

  const csvContent =
    '\uFEFF' +
    [...summary, ...rows]
      .map((line) => line.map(escapeCsvCell).join(','))
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const slug = mataPelajaran.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  link.download = `analisis-nilai-${slug}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportScoreAnalysisToWordDoc(params: {
  mataPelajaran: string;
  kelasLabel: string;
  namaSekolah: string;
  kktp: number;
  records: import('../types/kisiKisi').StudentScoreRecord[];
  stats: import('../types/kisiKisi').ScoreStatistics;
  narrative: import('../types/kisiKisi').ScoreAnalysisNarrative;
}): void {
  const { mataPelajaran, kelasLabel, namaSekolah, kktp, records, stats, narrative } = params;

  const studentRowsHtml = records
    .map((r) => {
      const tuntas = r.nilai >= kktp;
      return `
      <tr>
        <td style="text-align:center; font-family:monospace;">${r.no}</td>
        <td>${escapeHtml(r.nama)}</td>
        <td style="text-align:center; font-family:monospace; font-weight:bold;">${r.nilai}</td>
        <td style="text-align:center; color:${tuntas ? '#065f46' : '#991b1b'}; font-weight:bold;">${tuntas ? 'Tuntas' : 'Belum Tuntas'}</td>
        <td>${tuntas ? (r.nilai >= 90 ? 'Pengayaan Mandiri / Tutor Sebaya' : 'Pengayaan Terstruktur') : 'Program Remedial'}</td>
      </tr>`;
    })
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <title>Laporan Analisis Hasil Ujian - ${escapeHtml(mataPelajaran)}</title>
      <style>
        @page Section1 { size: 21.0cm 29.7cm; margin: 1.6cm; }
        div.Section1 { page: Section1; }
        body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; color: #0f172a; line-height: 1.4; }
        h2 { text-align: center; margin: 0 0 2px 0; font-size: 13pt; text-transform: uppercase; }
        h3 { text-align: center; margin: 0 0 12px 0; font-size: 10.5pt; font-weight: normal; }
        h4 { margin: 14px 0 6px 0; font-size: 10.5pt; }
        table.grid { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9pt; }
        table.grid th, table.grid td { border: 1px solid #1e293b; padding: 4px 6px; vertical-align: top; }
        table.grid th { background-color: #e2e8f0; text-align: center; }
        ul { margin: 4px 0 10px 18px; padding: 0; }
      </style>
    </head>
    <body>
      <div class="Section1">
        <h2>Laporan Analisis Hasil Ujian Semester</h2>
        <h3>${escapeHtml(namaSekolah)} &bull; ${escapeHtml(mataPelajaran)} (${escapeHtml(kelasLabel)})</h3>

        <h4>1. Rekapitulasi Statistik Ketuntasan (KKTP = ${kktp})</h4>
        <table class="grid">
          <tr>
            <th>Jumlah Siswa</th>
            <th>Rata-Rata</th>
            <th>Nilai Tertinggi</th>
            <th>Nilai Terendah</th>
            <th>Tuntas</th>
            <th>Belum Tuntas</th>
            <th>Ketuntasan (%)</th>
          </tr>
          <tr>
            <td style="text-align:center; font-family:monospace;">${stats.totalSiswa}</td>
            <td style="text-align:center; font-family:monospace;">${stats.rataRata}</td>
            <td style="text-align:center; font-family:monospace;">${stats.nilaiTertinggi}</td>
            <td style="text-align:center; font-family:monospace;">${stats.nilaiTerendah}</td>
            <td style="text-align:center; font-family:monospace;">${stats.jumlahTuntas}</td>
            <td style="text-align:center; font-family:monospace;">${stats.jumlahBelumTuntas}</td>
            <td style="text-align:center; font-family:monospace; font-weight:bold;">${stats.persentaseKetuntasan}%</td>
          </tr>
        </table>

        <h4>2. Interpretasi Hasil Evaluasi</h4>
        <p><strong>Status Ketuntasan Klasikal:</strong> ${escapeHtml(narrative.statusKetuntasanKlasikal)}</p>
        <p>${escapeHtml(narrative.interpretasiHasil)}</p>
        <p>${escapeHtml(narrative.analisisSebaranNilai)}</p>

        <h4>3. Rekomendasi Tindak Lanjut Pembelajaran</h4>
        <p><strong>Program Remedial (Siswa Belum Tuntas):</strong></p>
        <ul>${narrative.rekomendasiRemedial.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
        <p><strong>Program Pengayaan (Siswa Tuntas):</strong></p>
        <ul>${narrative.rekomendasiPengayaan.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
        <p><strong>Refleksi &amp; Perbaikan Pembelajaran Guru:</strong></p>
        <ul>${narrative.tindakLanjutPembelajaranGuru.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>

        <h4>4. Daftar Nilai &amp; Status Ketuntasan Siswa</h4>
        <table class="grid">
          <thead>
            <tr>
              <th style="width:36px;">No</th>
              <th>Nama Siswa</th>
              <th style="width:60px;">Nilai</th>
              <th style="width:100px;">Status</th>
              <th>Rencana Tindak Lanjut</th>
            </tr>
          </thead>
          <tbody>${studentRowsHtml}</tbody>
        </table>
      </div>
    </body>
    </html>
  `;

  const slug = mataPelajaran.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `analisis-hasil-ujian-${slug}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportEvaluationReportToWordDoc(
  report: import('../types/kisiKisi').LearningEvaluationReport,
  config?: import('../types/kisiKisi').ExamConfig
): void {
  const tpRowsHtml = report.ketercapaianTP
    .map(
      (tp) => `
      <tr>
        <td style="text-align:center; font-family:monospace;">${tp.no}</td>
        <td>${escapeHtml(tp.tujuanPembelajaran)}</td>
        <td>${escapeHtml(tp.materi)}</td>
        <td style="text-align:center; font-weight:bold;">${escapeHtml(tp.tingkatKetercapaian)}<br/><span style="font-weight:normal; font-size:8.5pt;">(${escapeHtml(tp.persentaseCapaian)})</span></td>
        <td>${escapeHtml(tp.catatanBukti)}</td>
      </tr>`
    )
    .join('');

  const masteredHtml = report.materiDikuasai
    .map(
      (m) => `<li><strong>${escapeHtml(m.materi)}:</strong> ${escapeHtml(m.alasanBukti)}</li>`
    )
    .join('');

  const improveHtml = report.materiPerluDiperbaiki
    .map(
      (m) => `<li><strong>${escapeHtml(m.materi)}:</strong> ${escapeHtml(m.alasanBukti)}</li>`
    )
    .join('');

  const remedialHtml = report.rekomendasiRemedial
    .map(
      (r) => `
      <tr>
        <td><strong>${escapeHtml(r.sasaran)}</strong></td>
        <td>${escapeHtml(r.strategi)}</td>
        <td>${escapeHtml(r.bentukAktivitas)}</td>
        <td>${escapeHtml(r.targetKetuntasan)}</td>
      </tr>`
    )
    .join('');

  const pengayaanHtml = report.rekomendasiPengayaan
    .map(
      (p) => `
      <tr>
        <td><strong>${escapeHtml(p.sasaran)}</strong></td>
        <td>${escapeHtml(p.strategi)}</td>
        <td>${escapeHtml(p.bentukAktivitas)}</td>
        <td>${escapeHtml(p.luaranDiharapkan)}</td>
      </tr>`
    )
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(report.judulLaporan)}</title>
      <style>
        @page Section1 { size: 21.0cm 29.7cm; margin: 1.7cm; }
        div.Section1 { page: Section1; }
        body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; color: #0f172a; line-height: 1.45; }
        h2 { text-align: center; margin: 0 0 2px 0; font-size: 13pt; text-transform: uppercase; }
        h3 { text-align: center; margin: 0 0 12px 0; font-size: 10.5pt; font-weight: normal; }
        h4 { margin: 14px 0 6px 0; font-size: 10.5pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; }
        table.grid { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9pt; }
        table.grid th, table.grid td { border: 1px solid #1e293b; padding: 5px 6px; vertical-align: top; }
        table.grid th { background-color: #e2e8f0; text-align: center; }
        ul { margin: 4px 0 10px 18px; padding: 0; }
        table.sign { width: 100%; margin-top: 24px; font-size: 9.5pt; border-collapse: collapse; }
        table.sign td { width: 50%; vertical-align: top; padding: 4px 12px; }
      </style>
    </head>
    <body>
      <div class="Section1">
        <h2>${escapeHtml(report.judulLaporan)}</h2>
        <h3>${escapeHtml(report.namaSekolah)} &bull; ${escapeHtml(report.mataPelajaran)} (${escapeHtml(report.kelasLabel)} · ${escapeHtml(report.semesterLabel)}) &bull; TA ${escapeHtml(report.tahunAjaran)}</h3>

        <h4>1. Ringkasan Hasil Belajar</h4>
        <p>${escapeHtml(report.ringkasanHasilBelajar)}</p>

        <h4>2. Ketercapaian Tujuan Pembelajaran</h4>
        <table class="grid">
          <thead>
            <tr>
              <th style="width:32px;">No</th>
              <th style="width:30%;">Tujuan Pembelajaran</th>
              <th style="width:18%;">Materi</th>
              <th style="width:18%;">Ketercapaian</th>
              <th>Catatan / Bukti Evaluasi</th>
            </tr>
          </thead>
          <tbody>${tpRowsHtml}</tbody>
        </table>

        <h4>3. Materi yang Sudah Dikuasai</h4>
        <ul>${masteredHtml}</ul>

        <h4>4. Materi yang Perlu Diperbaiki</h4>
        <ul>${improveHtml}</ul>

        <h4>5. Rekomendasi Program Remedial (Siswa Belum Tuntas)</h4>
        <table class="grid">
          <thead>
            <tr>
              <th style="width:20%;">Kelompok Sasaran</th>
              <th style="width:25%;">Strategi</th>
              <th>Bentuk Aktivitas</th>
              <th style="width:22%;">Target Ketuntasan</th>
            </tr>
          </thead>
          <tbody>${remedialHtml}</tbody>
        </table>

        <h4>6. Rekomendasi Program Pengayaan (Siswa Sudah Tuntas)</h4>
        <table class="grid">
          <thead>
            <tr>
              <th style="width:20%;">Kelompok Sasaran</th>
              <th style="width:25%;">Strategi</th>
              <th>Bentuk Aktivitas</th>
              <th style="width:22%;">Luaran Diharapkan</th>
            </tr>
          </thead>
          <tbody>${pengayaanHtml}</tbody>
        </table>

        <h4>7. Catatan Penutup &amp; Rencana Siklus Berikutnya</h4>
        <p>${escapeHtml(report.catatanPenutupGuru)}</p>

        <table class="sign">
          <tr>
            <td>
              Mengetahui,<br/>
              Kepala Sekolah<br/><br/><br/><br/>
              <strong><u>${escapeHtml(config?.namaKepalaSekolah || '______________________')}</u></strong><br/>
              NIP. ${escapeHtml(config?.nipKepalaSekolah || '____________________')}
            </td>
            <td style="padding-left: 110px;">
              Guru Mata Pelajaran<br/><br/><br/><br/><br/>
              <strong><u>${escapeHtml(config?.namaPenyusun || '______________________')}</u></strong><br/>
              NIP. ${escapeHtml(config?.nipPenyusun || '____________________')}
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  const slug = report.mataPelajaran.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `laporan-evaluasi-pembelajaran-${slug}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportExamSubmissionToWordDoc(
  paper: import('../types/kisiKisi').ExamPaperPackage,
  submission: import('../types/kisiKisi').ExamFormSubmission,
  kktp = 75
): void {
  const pgRows = paper.pilihanGanda
    .map((q) => {
      const ans = submission.pgAnswers[q.nomor] || '-';
      const ok = ans === q.kunciJawaban;
      return `
        <tr>
          <td style="text-align:center;">${q.nomor}</td>
          <td>${escapeHtml(q.pertanyaan)}</td>
          <td style="text-align:center; font-weight:bold;">${escapeHtml(ans)}</td>
          <td style="text-align:center; font-weight:bold;">${escapeHtml(q.kunciJawaban)}</td>
          <td style="text-align:center;">${ok ? 'Benar (1)' : 'Salah (0)'}</td>
        </tr>`;
    })
    .join('');

  const isianRows = paper.isianSingkat
    .map((q) => {
      const ans = submission.isianAnswers[q.nomor] || '-';
      return `
        <tr>
          <td style="text-align:center;">${q.nomor}</td>
          <td>${escapeHtml(q.pertanyaan)}</td>
          <td>${escapeHtml(ans)}</td>
          <td>${escapeHtml(q.kunciJawaban)}</td>
        </tr>`;
    })
    .join('');

  const uraianRows = paper.uraian
    .map((q) => {
      const ans = submission.uraianAnswers[q.nomor] || '-';
      return `
        <tr>
          <td style="text-align:center;">${q.nomor}</td>
          <td>${escapeHtml(q.pertanyaan)}</td>
          <td style="white-space:pre-line;">${escapeHtml(ans)}</td>
          <td style="white-space:pre-line;">${escapeHtml(q.kunciJawaban)}</td>
        </tr>`;
    })
    .join('');

  const statusText = submission.nilaiAkhir >= kktp ? 'TUNTAS' : 'BELUM TUNTAS';

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <title>Lembar Jawaban - ${escapeHtml(submission.namaSiswa)}</title>
      <style>
        @page Section1 { size: 21.0cm 29.7cm; margin: 1.7cm; }
        div.Section1 { page: Section1; }
        body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; color: #0f172a; line-height: 1.4; }
        h2 { text-align: center; margin: 0 0 2px 0; font-size: 13pt; text-transform: uppercase; }
        h3 { text-align: center; margin: 0 0 12px 0; font-size: 10pt; font-weight: normal; }
        h4 { margin: 14px 0 6px 0; font-size: 10.5pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; }
        table.meta { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9.5pt; }
        table.meta td { border: 1px solid #cbd5e1; padding: 5px 8px; }
        table.grid { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9pt; }
        table.grid th, table.grid td { border: 1px solid #1e293b; padding: 5px 6px; vertical-align: top; }
        table.grid th { background-color: #e2e8f0; text-align: center; }
      </style>
    </head>
    <body>
      <div class="Section1">
        <h2>HASIL PENGERJAAN FORM UJIAN DIGITAL</h2>
        <h3>${escapeHtml(paper.namaSekolah)} &bull; ${escapeHtml(paper.judulUjian)} (${escapeHtml(paper.kelasLabel)})</h3>

        <table class="meta">
          <tr>
            <td><strong>Nama Peserta:</strong> ${escapeHtml(submission.namaSiswa)}</td>
            <td><strong>NIS / Absen:</strong> ${escapeHtml(submission.nis || '-')}</td>
            <td><strong>Kelas:</strong> ${escapeHtml(submission.kelas)}</td>
          </tr>
          <tr>
            <td><strong>Skor PG:</strong> ${submission.skorPG} / ${submission.maksPG}</td>
            <td><strong>Skor Isian:</strong> ${submission.skorIsian} / ${submission.maksIsian}</td>
            <td><strong>Skor Uraian:</strong> ${submission.skorUraian} / ${submission.maksUraian}</td>
          </tr>
          <tr>
            <td colspan="2"><strong>Nilai Akhir (Skala 100):</strong> ${submission.nilaiAkhir}</td>
            <td><strong>Status (KKTP ${kktp}):</strong> ${statusText}</td>
          </tr>
        </table>

        ${
          paper.pilihanGanda.length > 0
            ? `<h4>A. Jawaban Pilihan Ganda</h4>
               <table class="grid">
                 <thead><tr><th style="width:36px;">No</th><th>Pertanyaan</th><th style="width:60px;">Jawaban</th><th style="width:60px;">Kunci</th><th style="width:80px;">Hasil</th></tr></thead>
                 <tbody>${pgRows}</tbody>
               </table>`
            : ''
        }

        ${
          paper.isianSingkat.length > 0
            ? `<h4>B. Jawaban Isian Singkat</h4>
               <table class="grid">
                 <thead><tr><th style="width:36px;">No</th><th style="width:42%;">Pertanyaan</th><th>Jawaban Siswa</th><th>Kunci Jawaban</th></tr></thead>
                 <tbody>${isianRows}</tbody>
               </table>`
            : ''
        }

        ${
          paper.uraian.length > 0
            ? `<h4>C. Jawaban Uraian</h4>
               <table class="grid">
                 <thead><tr><th style="width:36px;">No</th><th style="width:32%;">Pertanyaan</th><th>Jawaban Siswa</th><th>Kunci Penyelesaian</th></tr></thead>
                 <tbody>${uraianRows}</tbody>
               </table>`
            : ''
        }
      </div>
    </body>
    </html>
  `;

  const slug = submission.namaSiswa.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `lembar-jawaban-${slug || 'peserta'}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
