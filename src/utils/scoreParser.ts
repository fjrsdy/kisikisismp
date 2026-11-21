import type { ScoreDistributionBucket, ScoreStatistics, StudentScoreRecord } from '../types/kisiKisi';

function parseNumericToken(token: string): number | null {
  const cleaned = token.trim().replace(/\s+/g, '');
  if (!cleaned) return null;
  // Convert Indonesian decimal comma (e.g., 78,5) to dot
  const normalized = cleaned.replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const num = Number(normalized);
  if (Number.isNaN(num) || num < 0 || num > 1000) return null;
  return num;
}

export function parseStudentScores(rawText: string): StudentScoreRecord[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  // Check if single-line or space/comma-separated list of bare numbers (e.g. "78, 85, 92, 64")
  if (lines.length === 1 && !/[a-zA-Z]/.test(lines[0])) {
    const tokens = lines[0]
      .split(/[\s,;|\t]+/)
      .map((t) => parseNumericToken(t))
      .filter((n): n is number => n !== null);
    return tokens.map((nilai, idx) => ({
      id: `std-${idx + 1}`,
      no: idx + 1,
      nama: `Siswa ${idx + 1}`,
      nilai,
    }));
  }

  const records: StudentScoreRecord[] = [];
  let autoIndex = 1;

  for (const line of lines) {
    // Skip common header lines
    if (/^(no|nomor|nama|siswa|nilai|skor)/i.test(line) && !/\d+$/.test(line)) {
      continue;
    }

    // Case 1: Tab-separated (Excel / Google Sheets paste): "1\tAhmad Fauzi\t84" or "Ahmad Fauzi\t84"
    if (line.includes('\t')) {
      const cols = line.split('\t').map((c) => c.trim()).filter(Boolean);
      if (cols.length >= 2) {
        const lastNum = parseNumericToken(cols[cols.length - 1]);
        if (lastNum !== null) {
          const nameCols = cols.slice(0, -1);
          // Drop leading index column if purely numeric
          const nama =
            nameCols.length > 1 && /^\d+\.?$/.test(nameCols[0])
              ? nameCols.slice(1).join(' ')
              : nameCols.join(' ');
          records.push({
            id: `std-${autoIndex}`,
            no: autoIndex++,
            nama: nama || `Siswa ${autoIndex - 1}`,
            nilai: lastNum,
          });
          continue;
        }
      }
    }

    // Case 2: Semicolon or pipe CSV: "Ahmad Fauzi; 84" or "1; Ahmad Fauzi; 84"
    if (line.includes(';') || line.includes('|')) {
      const cols = line.split(/[;|]/).map((c) => c.trim()).filter(Boolean);
      if (cols.length >= 2) {
        const lastNum = parseNumericToken(cols[cols.length - 1]);
        if (lastNum !== null) {
          const nameCols = cols.slice(0, -1);
          const nama =
            nameCols.length > 1 && /^\d+\.?$/.test(nameCols[0])
              ? nameCols.slice(1).join(' ')
              : nameCols.join(' ');
          records.push({
            id: `std-${autoIndex}`,
            no: autoIndex++,
            nama: nama || `Siswa ${autoIndex - 1}`,
            nilai: lastNum,
          });
          continue;
        }
      }
    }

    // Case 3: Comma-separated with letters (e.g. "Ahmad Fauzi, 84" or "1, Ahmad Fauzi, 84,5")
    if (line.includes(',') && /[a-zA-Z]/.test(line)) {
      const cols = line.split(',').map((c) => c.trim()).filter(Boolean);
      // Handle Indonesian decimal at end like "Ahmad, 84,5" -> join last two if both digits
      if (cols.length >= 3 && /^\d+$/.test(cols[cols.length - 2]) && /^\d+$/.test(cols[cols.length - 1])) {
        const combined = parseNumericToken(`${cols[cols.length - 2]}.${cols[cols.length - 1]}`);
        if (combined !== null) {
          const nameCols = cols.slice(0, -2);
          const nama =
            nameCols.length > 1 && /^\d+\.?$/.test(nameCols[0])
              ? nameCols.slice(1).join(' ')
              : nameCols.join(' ');
          records.push({
            id: `std-${autoIndex}`,
            no: autoIndex++,
            nama: nama || `Siswa ${autoIndex - 1}`,
            nilai: combined,
          });
          continue;
        }
      }
      const lastNum = parseNumericToken(cols[cols.length - 1]);
      if (lastNum !== null) {
        const nameCols = cols.slice(0, -1);
        const nama =
          nameCols.length > 1 && /^\d+\.?$/.test(nameCols[0])
            ? nameCols.slice(1).join(' ')
            : nameCols.join(' ');
        records.push({
          id: `std-${autoIndex}`,
          no: autoIndex++,
          nama: nama || `Siswa ${autoIndex - 1}`,
          nilai: lastNum,
        });
        continue;
      }
    }

    // Case 4: Delimiter "-", ":", "=" -> e.g. "Ahmad Fauzi: 84" or "1. Ahmad Fauzi - 84"
    const delimMatch = line.match(/^(?:\d+[.)]\s*)?(.+?)\s*[-:=]\s*(\d+(?:[.,]\d+)?)$/);
    if (delimMatch) {
      const val = parseNumericToken(delimMatch[2]);
      if (val !== null) {
        records.push({
          id: `std-${autoIndex}`,
          no: autoIndex++,
          nama: delimMatch[1].trim(),
          nilai: val,
        });
        continue;
      }
    }

    // Case 5: Name followed by whitespace and trailing number -> "Ahmad Fauzi 84"
    const spaceMatch = line.match(/^(?:\d+[.)]\s*)?([a-zA-ZÀ-ÿ'.\s]+?)\s+(\d+(?:[.,]\d+)?)$/);
    if (spaceMatch) {
      const val = parseNumericToken(spaceMatch[2]);
      if (val !== null) {
        records.push({
          id: `std-${autoIndex}`,
          no: autoIndex++,
          nama: spaceMatch[1].trim(),
          nilai: val,
        });
        continue;
      }
    }

    // Case 6: Purely numbers on a line
    if (!/[a-zA-Z]/.test(line)) {
      const nums = line
        .split(/[\s,;]+/)
        .map((t) => parseNumericToken(t))
        .filter((n): n is number => n !== null);
      for (const val of nums) {
        records.push({
          id: `std-${autoIndex}`,
          no: autoIndex++,
          nama: `Siswa ${autoIndex - 1}`,
          nilai: val,
        });
      }
    }
  }

  return records;
}

export function computeScoreStatistics(
  records: StudentScoreRecord[],
  kktp: number
): ScoreStatistics {
  if (records.length === 0) {
    return {
      totalSiswa: 0,
      rataRata: 0,
      median: 0,
      simpanganBaku: 0,
      nilaiTertinggi: 0,
      nilaiTerendah: 0,
      siswaTertinggi: [],
      siswaTerendah: [],
      jumlahTuntas: 0,
      jumlahBelumTuntas: 0,
      persentaseKetuntasan: 0,
      persentaseBelumTuntas: 0,
      distribusi: [],
    };
  }

  const values = records.map((r) => r.nilai);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / values.length;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  const variance =
    values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);

  const siswaTertinggi = records
    .filter((r) => r.nilai === maxVal)
    .map((r) => r.nama);
  const siswaTerendah = records
    .filter((r) => r.nilai === minVal)
    .map((r) => r.nama);

  const tuntas = records.filter((r) => r.nilai >= kktp).length;
  const belumTuntas = records.length - tuntas;

  const buckets: ScoreDistributionBucket[] = [
    { label: '0–54', min: 0, max: 54.999, count: 0 },
    { label: '55–69', min: 55, max: 69.999, count: 0 },
    { label: '70–79', min: 70, max: 79.999, count: 0 },
    { label: '80–89', min: 80, max: 89.999, count: 0 },
    { label: '90–100', min: 90, max: 1000, count: 0 },
  ];

  for (const val of values) {
    const bucket = buckets.find((b) => val >= b.min && val <= b.max);
    if (bucket) bucket.count += 1;
  }

  return {
    totalSiswa: records.length,
    rataRata: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    simpanganBaku: Math.round(stdDev * 100) / 100,
    nilaiTertinggi: maxVal,
    nilaiTerendah: minVal,
    siswaTertinggi,
    siswaTerendah,
    jumlahTuntas: tuntas,
    jumlahBelumTuntas: belumTuntas,
    persentaseKetuntasan: Math.round((tuntas / records.length) * 1000) / 10,
    persentaseBelumTuntas: Math.round((belumTuntas / records.length) * 1000) / 10,
    distribusi: buckets,
  };
}
