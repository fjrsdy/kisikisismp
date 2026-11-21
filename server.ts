import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '2mb' }));

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY belum terkonfigurasi pada environment server. Periksa panel Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 1,
  timeoutMs = 45000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.race<T>([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  'Permintaan ke layanan AI melewati batas waktu (45 detik). Silakan coba lagi.'
                )
              ),
            timeoutMs
          )
        ),
      ]);
      return result;
    } catch (error) {
      lastError = error;
      const msg = error instanceof Error ? error.message.toLowerCase() : '';
      const isTransient =
        msg.includes('429') ||
        msg.includes('503') ||
        msg.includes('overloaded') ||
        msg.includes('econnreset') ||
        msg.includes('fetch failed');
      if (attempt < maxRetries && isTransient) {
        const delayMs = 600 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        break;
      }
    }
  }
  throw lastError;
}

app.post('/api/kisi-kisi/generate', async (req, res) => {
  try {
    const {
      mataPelajaran,
      kelas,
      semester,
      jenisUjian,
      kurikulum,
      materiPokok,
      jumlahPG = 20,
      jumlahPGK = 0,
      jumlahIsian = 5,
      jumlahUraian = 5,
      proporsiKognitif = 'proporsional',
    } = req.body ?? {};

    if (!mataPelajaran || !kelas || !semester || !materiPokok) {
      res.status(400).json({
        error: 'Mata pelajaran, kelas SMP (7/8/9), semester (1/2), dan materi wajib diisi.',
      });
      return;
    }

    const totalSoal =
      Number(jumlahPG) + Number(jumlahPGK) + Number(jumlahIsian) + Number(jumlahUraian);
    if (totalSoal <= 0 || totalSoal > 80) {
      res.status(400).json({
        error: 'Total jumlah soal harus di antara 1 sampai 80 butir.',
      });
      return;
    }

    const ai = getAiClient();

    const kelasLabel =
      kelas === '7' ? 'VII (1 SMP)' : kelas === '8' ? 'VIII (2 SMP)' : 'IX (3 SMP)';
    const semesterLabel = semester === '1' ? 'Semester 1 (Ganjil)' : 'Semester 2 (Genap)';

    const cognitiveGuidance =
      proporsiKognitif === 'hots_fokus'
        ? 'Tekankan proporsi HOTS (C4, C5, C6) sekitar 50–60%, MOTS (C3) sekitar 25–30%, dan LOTS (C1–C2) sekitar 15–20%.'
        : proporsiKognitif === 'dasar_penguatan'
          ? 'Tekankan penguatan konsep dasar: LOTS (C1–C2) sekitar 40–45%, MOTS (C3) sekitar 35%, dan HOTS (C4–C6) sekitar 20–25%.'
          : 'Gunakan proporsi seimbang standar evaluasi pendidikan SMP: LOTS (C1–C2) ~25–30%, MOTS (C3) ~35–40%, dan HOTS (C4–C6) ~30–40%, dengan keterwakilan menyeluruh dari C1 hingga C6 bila memungkinkan.';

    const bentukSummaryParts: string[] = [];
    let cursor = 1;
    if (Number(jumlahPG) > 0) {
      const end = cursor + Number(jumlahPG) - 1;
      bentukSummaryParts.push(`Pilihan Ganda: ${jumlahPG} soal (nomor ${cursor} s.d. ${end})`);
      cursor = end + 1;
    }
    if (Number(jumlahPGK) > 0) {
      const end = cursor + Number(jumlahPGK) - 1;
      bentukSummaryParts.push(
        `Pilihan Ganda Kompleks: ${jumlahPGK} soal (nomor ${cursor} s.d. ${end})`
      );
      cursor = end + 1;
    }
    if (Number(jumlahIsian) > 0) {
      const end = cursor + Number(jumlahIsian) - 1;
      bentukSummaryParts.push(`Isian Singkat: ${jumlahIsian} soal (nomor ${cursor} s.d. ${end})`);
      cursor = end + 1;
    }
    if (Number(jumlahUraian) > 0) {
      const end = cursor + Number(jumlahUraian) - 1;
      bentukSummaryParts.push(`Uraian: ${jumlahUraian} soal (nomor ${cursor} s.d. ${end})`);
    }

    const prompt = `
Susunlah Kisi-Kisi Penulisan Soal Ujian Semester yang sistematis, autentik, dan siap pakai untuk guru SMP di Indonesia.

Spesifikasi Ujian:
- Mata Pelajaran: ${mataPelajaran}
- Kelas / Jenjang: Kelas ${kelasLabel}
- Semester: ${semesterLabel}
- Jenis Ujian: ${jenisUjian || 'Sumatif Akhir Semester (SAS)'}
- Kurikulum: ${kurikulum || 'Kurikulum Merdeka (Fase D)'}
- Materi Pokok yang Diujikan: ${materiPokok}
- Total Soal: ${totalSoal} butir dengan alokasi nomor berurutan tepat sebagai berikut:
  ${bentukSummaryParts.join('\n  ')}
- Arahan Distribusi Level Kognitif: ${cognitiveGuidance}

Aturan Penulisan Ahli Evaluasi Pendidikan:
1. Setiap baris kisi-kisi dapat mencakup 1 sampai 3 nomor soal yang serumpun materinya dalam bentuk soal yang sama (atau 1 nomor untuk soal Uraian/HOTS kompleks), sehingga seluruh nomor soal dari 1 sampai ${totalSoal} tercantum lengkap, berurutan, tidak tumpang tindih, dan tidak ada yang terlewat!
2. Capaian Pembelajaran (CP) harus selaras dengan standar Fase D (${kurikulum || 'Kurikulum Merdeka'}) untuk mata pelajaran ${mataPelajaran}.
3. Tujuan Pembelajaran (TP) harus terukur dan spesifik sesuai tingkat perkembangan kognitif siswa Kelas ${kelasLabel}.
4. Indikator Soal wajib ditulis dengan pola evaluasi standar Indonesia (mengandung kondisi/stimulus, audiens "peserta didik", perilaku/KKO terukur, dan derajat ketepatan), misalnya: "Disajikan ..., peserta didik dapat ... dengan tepat."
5. Kata Kerja Operasional (KKO) dalam indikator soal HARUS sinkron dengan levelKognitif yang dipilih (C1: Mengingat, C2: Memahami, C3: Menerapkan, C4: Menganalisis, C5: Mengevaluasi, C6: Mencipta).
6. Pastikan seluruh materi yang diminta pada "Materi Pokok" terdistribusi secara proporsional.
7. Jumlah bobotSkor seluruh baris jika dijumlahkan kira-kira mendekati 100.
8. Gunakan Bahasa Indonesia akademik yang baku, rapi, dan jelas.
`;

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Anda adalah Ahli Evaluasi Pendidikan dan Pengembang Instrumen Asesmen Kurikulum Merdeka SMP (Fase D) Kementerian Pendidikan Indonesia. Seluruh keluaran harus akurat secara pedagogis, konsisten antar-kolom, dan menggunakan Taksonomi Bloom Revisi (C1–C6).',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            required: ['catatanAhliEvaluasi', 'rows'],
            properties: {
              catatanAhliEvaluasi: {
                type: Type.STRING,
                description:
                  'Ringkasan analisis pakar evaluasi pendidikan (2–3 kalimat) mengenai keseimbangan materi, validitas isi, dan sebaran level kognitif C1–C6 pada kisi-kisi yang dihasilkan.',
              },
              rows: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: [
                    'no',
                    'capaianPembelajaran',
                    'tujuanPembelajaran',
                    'materi',
                    'indikatorSoal',
                    'levelKognitif',
                    'kataKerjaOperasional',
                    'bentukSoal',
                    'nomorSoal',
                    'bobotSkor',
                  ],
                  properties: {
                    no: { type: Type.INTEGER },
                    capaianPembelajaran: { type: Type.STRING },
                    tujuanPembelajaran: { type: Type.STRING },
                    materi: { type: Type.STRING },
                    indikatorSoal: { type: Type.STRING },
                    levelKognitif: {
                      type: Type.STRING,
                      enum: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'],
                    },
                    kataKerjaOperasional: { type: Type.STRING },
                    bentukSoal: {
                      type: Type.STRING,
                      enum: [
                        'Pilihan Ganda',
                        'Pilihan Ganda Kompleks',
                        'Menjodohkan',
                        'Isian Singkat',
                        'Uraian',
                      ],
                    },
                    nomorSoal: {
                      type: Type.STRING,
                      description:
                        'Nomor soal berurutan, misal "1", "2, 3", atau "28". Wajib mencakup 1 s.d. totalSoal tanpa duplikasi atau celah.',
                    },
                    bobotSkor: { type: Type.INTEGER },
                  },
                },
              },
            },
          },
        },
      })
    );

    const text = (response.text ?? '').trim();
    if (!text) {
      res.status(502).json({ error: 'Model tidak mengembalikan respons JSON.' });
      return;
    }

    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err: unknown) {
    console.error('Error generating kisi-kisi:', err);
    const message =
      err instanceof Error ? err.message : 'Terjadi kesalahan saat menyusun kisi-kisi.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/kisi-kisi/sample-item', async (req, res) => {
  try {
    const { config, row } = req.body ?? {};
    if (!config || !row) {
      res.status(400).json({ error: 'Data konfigurasi dan baris kisi-kisi wajib dikirim.' });
      return;
    }

    const ai = getAiClient();
    const kelasLabel =
      config.kelas === '7' ? 'VII (1 SMP)' : config.kelas === '8' ? 'VIII (2 SMP)' : 'IX (3 SMP)';

    const prompt = `
Buatlah 1 contoh butir soal Ujian Semester SMP yang benar-benar selaras dengan baris kisi-kisi berikut:
- Mata Pelajaran: ${config.mataPelajaran}
- Kelas: ${kelasLabel} (Semester ${config.semester})
- Materi: ${row.materi}
- Capaian Pembelajaran: ${row.capaianPembelajaran}
- Tujuan Pembelajaran: ${row.tujuanPembelajaran}
- Indikator Soal: ${row.indikatorSoal}
- Level Kognitif: ${row.levelKognitif} (KKO: ${row.kataKerjaOperasional})
- Bentuk Soal: ${row.bentukSoal}
- Nomor Soal: ${row.nomorSoal}

Ketentuan:
- Jika Pilihan Ganda: berikan 4 pilihan jawaban (A, B, C, D) dengan pengecoh (distractor) yang homogen dan logis.
- Jika Pilihan Ganda Kompleks: berikan 4 pernyataan/opsi dan jelaskan lebih dari satu jawaban benar.
- Jika Isian Singkat atau Uraian: kosongkan pilihanJawaban (array kosong) dan berikan kunci serta pedoman penskoran yang terperinci.
- Stimulus harus kontekstual, autentik, dan sesuai usia siswa SMP.
`;

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Anda adalah penulis soal ujian standar SMP Indonesia yang ahli menyusun stimulus kontekstual dan pedoman penskoran objektif sesuai level Taksonomi Bloom Revisi.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            required: [
              'stimulus',
              'pertanyaan',
              'pilihanJawaban',
              'kunciJawaban',
              'pembahasan',
              'pedomanPenskoran',
            ],
            properties: {
              stimulus: {
                type: Type.STRING,
                description:
                  'Teks bacaan singkat, data tabel teks, atau konteks situasi masalah sebelum pertanyaan (isi "-" jika tidak diperlukan).',
              },
              pertanyaan: { type: Type.STRING },
              pilihanJawaban: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Daftar opsi A, B, C, D untuk PG/PGK, atau array kosong untuk Isian/Uraian.',
              },
              kunciJawaban: { type: Type.STRING },
              pembahasan: { type: Type.STRING },
              pedomanPenskoran: { type: Type.STRING },
            },
          },
        },
      })
    );

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json({
      nomorSoal: row.nomorSoal,
      bentukSoal: row.bentukSoal,
      levelKognitif: row.levelKognitif,
      ...parsed,
    });
  } catch (err: unknown) {
    console.error('Error generating sample item:', err);
    const message =
      err instanceof Error ? err.message : 'Gagal membuat contoh butir soal.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/naskah-soal/generate', async (req, res) => {
  try {
    const {
      kisiKisiText,
      mataPelajaran = 'Mata Pelajaran SMP',
      kelasLabel = 'Kelas VIII (2 SMP)',
      semesterLabel = 'Semester 1 (Ganjil)',
      jenisUjian = 'Sumatif Akhir Semester (SAS)',
      namaSekolah = 'SMP Negeri 1 Nusantara',
      tahunAjaran = '2026/2027',
      alokasiWaktu = '120 Menit',
      jumlahPG = 30,
      jumlahIsian = 10,
      jumlahUraian = 5,
    } = req.body ?? {};

    if (!kisiKisiText || String(kisiKisiText).trim().length < 20) {
      res.status(400).json({
        error:
          'Konten kisi-kisi wajib tersedia atau ditempelkan minimal 20 karakter agar soal dapat disusun sesuai indikator.',
      });
      return;
    }

    const pgCount = Math.max(0, Math.min(50, Number(jumlahPG) || 0));
    const isianCount = Math.max(0, Math.min(25, Number(jumlahIsian) || 0));
    const uraianCount = Math.max(0, Math.min(15, Number(jumlahUraian) || 0));

    if (pgCount + isianCount + uraianCount <= 0) {
      res.status(400).json({
        error: 'Jumlah total soal minimal 1 butir.',
      });
      return;
    }

    const ai = getAiClient();

    const baseContext = `
Konteks Ujian:
- Jenis Ujian: ${jenisUjian}
- Mata Pelajaran: ${mataPelajaran}
- Jenjang / Tingkat Perkembangan Siswa: ${kelasLabel} (${semesterLabel})
- Bahasa: Bahasa Indonesia akademik yang komunikatif, lugas, bebas bias, dan sesuai tingkat perkembangan kognitif siswa ${kelasLabel}.
- Acuan Kisi-Kisi Wajib:
"""
${String(kisiKisiText).trim()}
"""

Kaidah Penyusunan Soal Profesional:
1. Setiap soal WAJIB merujuk langsung pada indikator pembelajaran dan materi yang ada dalam kisi-kisi di atas (distribusikan merata ke seluruh indikator/materi dalam kisi-kisi).
2. Variasikan tingkat kesulitan secara proporsional: Mudah (~25-30%), Sedang (~45-50%), dan Sukar (~20-25%), selaras dengan level kognitif C1–C6.
3. Untuk Pilihan Ganda: wajib memiliki 4 opsi (A, B, C, D) yang homogen, logis, panjang opsi seimbang, tanpa "semua jawaban benar/salah", serta hanya ada 1 kunci jawaban pasti.
4. Untuk Isian Singkat: jawaban harus pasti, singkat (1–4 kata atau nilai numerik), tidak multitafsir.
5. Untuk Uraian: menuntut penalaran/pemecahan masalah bertahap dan dilengkapi pedoman penskoran yang jelas.
6. Bila soal tidak memerlukan bacaan/tabel panjang, isi kolom stimulus dengan "-". Bila memerlukan konteks/data/teks bacaan, tuliskan stimulus secara ringkas dan jelas.
`;

    const pgSchema = {
      type: Type.OBJECT,
      required: ['items'],
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: [
              'nomor',
              'indikatorTerkait',
              'materi',
              'levelKognitif',
              'tingkatKesulitan',
              'stimulus',
              'pertanyaan',
              'pilihan',
              'kunciJawaban',
              'pembahasan',
            ],
            properties: {
              nomor: { type: Type.INTEGER },
              indikatorTerkait: { type: Type.STRING },
              materi: { type: Type.STRING },
              levelKognitif: {
                type: Type.STRING,
                enum: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'],
              },
              tingkatKesulitan: {
                type: Type.STRING,
                enum: ['Mudah', 'Sedang', 'Sukar'],
              },
              stimulus: { type: Type.STRING },
              pertanyaan: { type: Type.STRING },
              pilihan: {
                type: Type.OBJECT,
                required: ['A', 'B', 'C', 'D'],
                properties: {
                  A: { type: Type.STRING },
                  B: { type: Type.STRING },
                  C: { type: Type.STRING },
                  D: { type: Type.STRING },
                },
              },
              kunciJawaban: { type: Type.STRING, enum: ['A', 'B', 'C', 'D'] },
              pembahasan: { type: Type.STRING },
            },
          },
        },
      },
    };

    const isianUraianSchema = {
      type: Type.OBJECT,
      required: ['catatanPenyusun', 'isianSingkat', 'uraian'],
      properties: {
        catatanPenyusun: {
          type: Type.STRING,
          description:
            'Ringkasan profesional 2-3 kalimat mengenai pemenuhan indikator kisi-kisi dan variasi tingkat kesulitan soal.',
        },
        isianSingkat: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: [
              'nomor',
              'indikatorTerkait',
              'materi',
              'levelKognitif',
              'tingkatKesulitan',
              'stimulus',
              'pertanyaan',
              'kunciJawaban',
              'pedomanPenskoran',
            ],
            properties: {
              nomor: { type: Type.INTEGER },
              indikatorTerkait: { type: Type.STRING },
              materi: { type: Type.STRING },
              levelKognitif: {
                type: Type.STRING,
                enum: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'],
              },
              tingkatKesulitan: {
                type: Type.STRING,
                enum: ['Mudah', 'Sedang', 'Sukar'],
              },
              stimulus: { type: Type.STRING },
              pertanyaan: { type: Type.STRING },
              kunciJawaban: { type: Type.STRING },
              pedomanPenskoran: { type: Type.STRING },
            },
          },
        },
        uraian: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: [
              'nomor',
              'indikatorTerkait',
              'materi',
              'levelKognitif',
              'tingkatKesulitan',
              'stimulus',
              'pertanyaan',
              'kunciJawaban',
              'pedomanPenskoran',
              'skorMaksimal',
            ],
            properties: {
              nomor: { type: Type.INTEGER },
              indikatorTerkait: { type: Type.STRING },
              materi: { type: Type.STRING },
              levelKognitif: {
                type: Type.STRING,
                enum: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'],
              },
              tingkatKesulitan: {
                type: Type.STRING,
                enum: ['Mudah', 'Sedang', 'Sukar'],
              },
              stimulus: { type: Type.STRING },
              pertanyaan: { type: Type.STRING },
              kunciJawaban: { type: Type.STRING },
              pedomanPenskoran: { type: Type.STRING },
              skorMaksimal: { type: Type.INTEGER },
            },
          },
        },
      },
    };

    const generatePGBatch = async (startNo: number, endNo: number, focusHint: string) => {
      const count = endNo - startNo + 1;
      if (count <= 0) return [];
      const resp = await withRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `${baseContext}\nTugas Khusus:\nBuatlah TEPAT ${count} soal PILIHAN GANDA bernomor ${startNo} sampai ${endNo} (${focusHint}). Pastikan setiap nomor dari ${startNo} hingga ${endNo} lengkap berurutan dan bervariasi tingkat kesulitannya.`,
          config: {
            systemInstruction:
              'Anda adalah penyusun soal ujian profesional standar SMP Indonesia. Hasilkan butir soal pilihan ganda bermutu tinggi yang selaras dengan kisi-kisi.',
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: pgSchema,
          },
        })
      );
      const parsed = JSON.parse((resp.text ?? '{"items":[]}').trim());
      return parsed.items ?? [];
    };

    const generateIsianUraian = async () => {
      if (isianCount === 0 && uraianCount === 0) {
        return {
          catatanPenyusun:
            'Naskah soal pilihan ganda telah disusun sesuai indikator dan variasi tingkat kesulitan pada kisi-kisi.',
          isianSingkat: [],
          uraian: [],
        };
      }
      const resp = await withRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `${baseContext}\nTugas Khusus:\n1. Buatlah TEPAT ${isianCount} soal ISIAN SINGKAT bernomor 1 sampai ${isianCount}.\n2. Buatlah TEPAT ${uraianCount} soal URAIAN bernomor 1 sampai ${uraianCount} (fokus level MOTS/HOTS C3–C6 dengan pedoman penskoran terperinci dan skorMaksimal antara 4–10 per soal).\nPastikan seluruh nomor lengkap berurutan dan selaras dengan indikator pada kisi-kisi.`,
          config: {
            systemInstruction:
              'Anda adalah penyusun soal ujian profesional standar SMP Indonesia. Susun soal isian singkat dan uraian beserta kunci jawaban dan pedoman penskoran yang objektif.',
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: isianUraianSchema,
          },
        })
      );
      return JSON.parse((resp.text ?? '{}').trim());
    };

    const pgTasks: Promise<unknown[]>[] = [];
    const batchSize = 8;
    for (let start = 1; start <= pgCount; start += batchSize) {
      const end = Math.min(pgCount, start + batchSize - 1);
      const hint =
        start === 1
          ? 'fokus pada indikator awal kisi-kisi'
          : end === pgCount
            ? 'fokus pada indikator akhir kisi-kisi'
            : 'fokus pada indikator tengah kisi-kisi';
      pgTasks.push(generatePGBatch(start, end, hint));
    }

    const [pgBatches, isianUraianResult] = await Promise.all([
      Promise.all(pgTasks),
      generateIsianUraian(),
    ]);

    const allPG = pgBatches.flat().map((item: any, idx: number) => ({
      ...item,
      id: `pg-${Date.now()}-${idx}`,
      nomor: idx + 1,
    }));

    const allIsian = (isianUraianResult.isianSingkat ?? []).map(
      (item: any, idx: number) => ({
        ...item,
        id: `isian-${Date.now()}-${idx}`,
        nomor: idx + 1,
      })
    );

    const allUraian = (isianUraianResult.uraian ?? []).map(
      (item: any, idx: number) => ({
        ...item,
        id: `uraian-${Date.now()}-${idx}`,
        nomor: idx + 1,
      })
    );

    res.json({
      id: `naskah-${Date.now()}`,
      judulUjian: `${jenisUjian} — ${mataPelajaran}`,
      mataPelajaran,
      kelasLabel,
      semesterLabel,
      alokasiWaktu,
      namaSekolah,
      tahunAjaran,
      catatanPenyusun:
        isianUraianResult.catatanPenyusun ||
        'Naskah soal disusun mengacu pada indikator kisi-kisi dengan variasi tingkat kesulitan Mudah, Sedang, dan Sukar.',
      pilihanGanda: allPG,
      isianSingkat: allIsian,
      uraian: allUraian,
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('Error generating exam paper:', err);
    const message =
      err instanceof Error ? err.message : 'Gagal menyusun naskah soal ujian.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/pedoman-penilaian/generate', async (req, res) => {
  try {
    const {
      rawExamText,
      mataPelajaran = 'Mata Pelajaran SMP',
      kelasLabel = 'Kelas VIII (2 SMP)',
      bobotPGPerSoal = 1,
      bobotIsianPerSoal = 2,
    } = req.body ?? {};

    if (!rawExamText || String(rawExamText).trim().length < 15) {
      res.status(400).json({
        error:
          'Tempelkan soal ujian atau gunakan naskah soal aktif terlebih dahulu (minimal 15 karakter).',
      });
      return;
    }

    const pgWeight = Math.max(1, Math.min(10, Number(bobotPGPerSoal) || 1));
    const isianWeight = Math.max(1, Math.min(10, Number(bobotIsianPerSoal) || 2));

    const ai = getAiClient();

    const prompt = `
Bertindaklah sebagai ahli evaluasi pendidikan dan korektor ujian profesional SMP di Indonesia.
Analisis seluruh soal ujian berikut dan susunlah **Kunci Jawaban Lengkap, Pembahasan Singkat, Alternatif Jawaban, Rubrik Penskoran, Skor Maksimal, dan Rumus Nilai Akhir**.

Konteks:
- Mata Pelajaran: ${mataPelajaran}
- Jenjang: ${kelasLabel}
- Bobot Skor Pilihan Ganda per soal: ${pgWeight} poin
- Bobot Skor Maksimal Isian Singkat per soal: ${isianWeight} poin
- Bobot Skor Maksimal Uraian: tentukan secara proporsional sesuai kompleksitas langkah (misal 4 sampai 10 poin per soal) dan rinci ke dalam rubrik bertahap yang jumlah poin tertingginya sama dengan skorMaksimal.

Daftar Soal Ujian yang Harus Dianalisis:
"""
${String(rawExamText).trim()}
"""

Aturan Wajib:
1. Untuk setiap soal Pilihan Ganda: identifikasi nomor soal, buat ringkasan singkat inti soal (1 kalimat pendek), berikan kunciJawaban huruf yang benar (misal "A", "B", "C", atau "D"), berikan pembahasanSingkat yang jelas dan padat, dan skorMaksimal = ${pgWeight}.
2. Untuk setiap soal Isian Singkat: berikan kunciUtama, alternatifJawaban (daftar variasi jawaban ekuivalen yang tetap dianggap benar, misalnya penulisan dengan/tanpa satuan, sinonim, atau angka desimal/pecahan), pembahasanSingkat, rubrikPenskoran bertahap (misal skor penuh ${isianWeight}, setengah benar 1, salah/kosong 0), dan skorMaksimal = ${isianWeight}.
3. Untuk setiap soal Uraian: berikan kunciUtama (langkah penyelesaian lengkap), alternatifJawaban (cara/metode atau formulasi jawaban lain yang tetap benar secara ilmiah/matematis/bahasa), pembahasanSingkat, rubrikPenskoran bertahap dari skor 0 hingga skorMaksimal dengan deskripsi kriteria per tingkat pencapaian, dan skorMaksimal (integer, pastikan kriteria tertinggi pada rubrik sama dengan skorMaksimal).
4. Berikan rumusNilaiAkhir yang eksplisit menggunakan Skor Maksimal Total aktual, serta rumusBerbobotOpsional (misal pembobotan proporsi 50% PG, 20% Isian, 30% Uraian atau sesuai komposisi soal yang ada).
5. Jika suatu bagian soal (misal Isian atau Uraian) tidak ada di teks soal yang ditempel, kembalikan array kosong [] untuk bagian tersebut.
`;

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Anda adalah ahli evaluasi pendidikan SMP Indonesia. Susun kunci jawaban yang akurat 100%, pembahasan ringkas, alternatif jawaban yang adil, rubrik penskoran objektif, serta rumus perhitungan nilai akhir yang tepat.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            required: [
              'judulUjian',
              'catatanPenilaian',
              'rumusNilaiAkhir',
              'rumusBerbobotOpsional',
              'kunciPG',
              'kunciIsian',
              'kunciUraian',
            ],
            properties: {
              judulUjian: { type: Type.STRING },
              catatanPenilaian: { type: Type.STRING },
              rumusNilaiAkhir: { type: Type.STRING },
              rumusBerbobotOpsional: { type: Type.STRING },
              kunciPG: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: [
                    'nomor',
                    'ringkasanSoal',
                    'kunciJawaban',
                    'pembahasanSingkat',
                    'skorMaksimal',
                  ],
                  properties: {
                    nomor: { type: Type.INTEGER },
                    ringkasanSoal: { type: Type.STRING },
                    kunciJawaban: { type: Type.STRING },
                    pembahasanSingkat: { type: Type.STRING },
                    skorMaksimal: { type: Type.INTEGER },
                  },
                },
              },
              kunciIsian: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: [
                    'nomor',
                    'ringkasanSoal',
                    'kunciUtama',
                    'alternatifJawaban',
                    'pembahasanSingkat',
                    'rubrikPenskoran',
                    'skorMaksimal',
                  ],
                  properties: {
                    nomor: { type: Type.INTEGER },
                    ringkasanSoal: { type: Type.STRING },
                    kunciUtama: { type: Type.STRING },
                    alternatifJawaban: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    pembahasanSingkat: { type: Type.STRING },
                    rubrikPenskoran: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        required: ['kriteria', 'skor'],
                        properties: {
                          kriteria: { type: Type.STRING },
                          skor: { type: Type.INTEGER },
                        },
                      },
                    },
                    skorMaksimal: { type: Type.INTEGER },
                  },
                },
              },
              kunciUraian: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: [
                    'nomor',
                    'ringkasanSoal',
                    'kunciUtama',
                    'alternatifJawaban',
                    'pembahasanSingkat',
                    'rubrikPenskoran',
                    'skorMaksimal',
                  ],
                  properties: {
                    nomor: { type: Type.INTEGER },
                    ringkasanSoal: { type: Type.STRING },
                    kunciUtama: { type: Type.STRING },
                    alternatifJawaban: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    pembahasanSingkat: { type: Type.STRING },
                    rubrikPenskoran: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        required: ['kriteria', 'skor'],
                        properties: {
                          kriteria: { type: Type.STRING },
                          skor: { type: Type.INTEGER },
                        },
                      },
                    },
                    skorMaksimal: { type: Type.INTEGER },
                  },
                },
              },
            },
          },
        },
      })
    );

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json({
      id: `guide-${Date.now()}`,
      mataPelajaran,
      kelasLabel,
      bobotPGPerSoal: pgWeight,
      bobotIsianPerSoal: isianWeight,
      ...parsed,
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('Error generating assessment guide:', err);
    const message =
      err instanceof Error ? err.message : 'Gagal menyusun kunci dan pedoman penilaian.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/analisis-hasil/interpretasi', async (req, res) => {
  try {
    const {
      mataPelajaran = 'Mata Pelajaran SMP',
      kelasLabel = 'Kelas VIII (2 SMP)',
      materiPokok = '',
      kktp = 75,
      stats,
      daftarBelumTuntas = [],
    } = req.body ?? {};

    if (!stats || !stats.totalSiswa) {
      res.status(400).json({
        error: 'Statistik hasil ujian wajib tersedia sebelum menyusun interpretasi.',
      });
      return;
    }

    const ai = getAiClient();

    const prompt = `
Bertindaklah sebagai analis evaluasi pendidikan SMP di Indonesia.
Analisis hasil ujian berikut dan susunlah **Interpretasi Hasil Evaluasi** serta **Rekomendasi Tindak Lanjut Pembelajaran** yang konkret, terstruktur, dan sesuai kaidah penilaian Kurikulum Merdeka / K13.

Data Terhitung (Akurat):
- Mata Pelajaran: ${mataPelajaran}
- Jenjang: ${kelasLabel}
- Materi Pokok: ${materiPokok || 'Materi Ujian Semester'}
- Batas Ketuntasan (KKTP / KKM): ${kktp}
- Total Siswa: ${stats.totalSiswa}
- Nilai Rata-Rata (Mean): ${stats.rataRata}
- Nilai Tengah (Median): ${stats.median}
- Simpangan Baku (Standar Deviasi): ${stats.simpanganBaku}
- Nilai Tertinggi: ${stats.nilaiTertinggi} (diraih: ${(stats.siswaTertinggi || []).join(', ') || '-'})
- Nilai Terendah: ${stats.nilaiTerendah} (diraih: ${(stats.siswaTerendah || []).join(', ') || '-'})
- Jumlah Siswa Tuntas (>= ${kktp}): ${stats.jumlahTuntas} siswa (${stats.persentaseKetuntasan}%)
- Jumlah Siswa Belum Tuntas (< ${kktp}): ${stats.jumlahBelumTuntas} siswa (${stats.persentaseBelumTuntas}%)
- Distribusi Nilai: ${(stats.distribusi || []).map((d: any) => `${d.label}: ${d.count} siswa`).join(' | ')}
- Daftar Siswa Belum Tuntas: ${(daftarBelumTuntas || []).slice(0, 15).map((s: any) => `${s.nama} (${s.nilai})`).join(', ') || 'Tidak ada'}

Ketentuan Analisis:
1. Tentukan statusKetuntasanKlasikal berdasarkan standar ketuntasan klasikal (umumnya >= 85% atau >= 75% sesuai konteks sekolah, jelaskan kategorinya: Tercapai Baik / Cukup / Perlu Intervensi Klasikal).
2. Jelaskan interpretasiHasil secara mendalam (membandingkan mean terhadap KKTP, ketimpangan nilai tertinggi vs terendah, serta implikasi simpangan baku terhadap homogenitas/heterogenitas kemampuan kelas).
3. Berikan analisisSebaranNilai yang mengaitkan distribusi kelompok rendah, menengah, dan tinggi.
4. Susun 3–4 butir rekomendasiRemedial yang disesuaikan dengan proporsi siswa belum tuntas (misal bila > 50% disarankan pembelajaran ulang klasikal, bila 20–50% bimbingan kelompok, bila < 20% bimbingan individual/tutor sebaya).
5. Susun 3 butir rekomendasiPengayaan bagi siswa tuntas/berprestasi tinggi.
6. Susun 3 butir tindakLanjutPembelajaranGuru untuk perbaikan strategi mengajar dan penyusunan instrumen asesmen berikutnya.
`;

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Anda adalah analis evaluasi pendidikan SMP Indonesia. Berikan interpretasi berbasis bukti statistik dan rekomendasi pedagogis yang praktis diterapkan guru di kelas.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            required: [
              'statusKetuntasanKlasikal',
              'ringkasanEksekutif',
              'interpretasiHasil',
              'analisisSebaranNilai',
              'rekomendasiRemedial',
              'rekomendasiPengayaan',
              'tindakLanjutPembelajaranGuru',
            ],
            properties: {
              statusKetuntasanKlasikal: { type: Type.STRING },
              ringkasanEksekutif: { type: Type.STRING },
              interpretasiHasil: { type: Type.STRING },
              analisisSebaranNilai: { type: Type.STRING },
              rekomendasiRemedial: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              rekomendasiPengayaan: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              tindakLanjutPembelajaranGuru: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
          },
        },
      })
    );

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json(parsed);
  } catch (err: unknown) {
    console.error('Error generating score interpretation:', err);
    const message =
      err instanceof Error
        ? err.message
        : 'Gagal menyusun interpretasi hasil evaluasi.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/laporan-evaluasi/generate', async (req, res) => {
  try {
    const {
      analisisText,
      mataPelajaran = 'Mata Pelajaran SMP',
      kelasLabel = 'Kelas VIII (2 SMP)',
      semesterLabel = 'Semester 1 (Ganjil)',
      namaSekolah = 'SMP Negeri 1 Nusantara',
      tahunAjaran = '2026/2027',
      tujuanPembelajaranList = [],
    } = req.body ?? {};

    if (!analisisText || String(analisisText).trim().length < 20) {
      res.status(400).json({
        error:
          'Hasil analisis ujian wajib tersedia atau ditempelkan minimal 20 karakter untuk menyusun laporan evaluasi pembelajaran.',
      });
      return;
    }

    const ai = getAiClient();

    const tpContext =
      Array.isArray(tujuanPembelajaranList) && tujuanPembelajaranList.length > 0
        ? `\nDaftar Tujuan Pembelajaran (TP) & Materi Acuan dari Kisi-Kisi:\n${tujuanPembelajaranList
            .map((t: any, i: number) => `${i + 1}. [${t.materi}] ${t.tujuanPembelajaran}`)
            .join('\n')}`
        : '';

    const prompt = `
Bertindaklah sebagai ahli evaluasi pembelajaran dan pengawas kurikulum SMP di Indonesia.
Susunlah **Laporan Evaluasi Pembelajaran** yang sistematis, berbasis data, dan siap diserahkan ke kepala sekolah/MGMP berdasarkan hasil analisis ujian berikut.

Identitas Dokumen:
- Mata Pelajaran: ${mataPelajaran}
- Kelas / Semester: ${kelasLabel} / ${semesterLabel}
- Satuan Pendidikan: ${namaSekolah}
- Tahun Ajaran: ${tahunAjaran}
${tpContext}

Data Hasil Analisis Ujian yang Ditempelkan:
"""
${String(analisisText).trim()}
"""

Komponen Wajib Laporan:
1. ringkasanHasilBelajar: Paragraf komprehensif (3–5 kalimat) merangkum performa kelas secara kuantitatif (rata-rata, rentang nilai, ketuntasan) dan kualitatif.
2. ketercapaianTP: Daftar evaluasi ketercapaian setiap Tujuan Pembelajaran (minimal 4–6 poin utama, sesuaikan dengan daftar TP atau ekstrak topik dari hasil analisis). Tiap item berisi: no, tujuanPembelajaran, materi, tingkatKetercapaian ('Tercapai Penuh' | 'Tercapai Sebagian' | 'Belum Tercapai'), persentaseCapaian (misal "86%" atau "72%"), dan catatanBukti.
3. materiDikuasai: Daftar 3–4 materi yang sudah dikuasai baik oleh siswa beserta alasan/bukti capaiannya.
4. materiPerluDiperbaiki: Daftar 2–4 materi yang masih lemah/perlu perbaikan beserta analisis letak miskonsepsi atau kesulitan siswa.
5. rekomendasiRemedial: Daftar 2–3 rencana remedial konkret bagi siswa yang belum tuntas (sasaran kelompok, strategi pedagogis, bentuk aktivitas, target ketuntasan).
6. rekomendasiPengayaan: Daftar 2–3 rencana pengayaan bagi siswa yang sudah tuntas (sasaran kelompok, strategi, bentuk aktivitas HOTS/proyek, luaran diharapkan).
7. catatanPenutupGuru: Rekomendasi refleksi siklus pembelajaran berikutnya (2–3 kalimat).
`;

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Anda adalah ahli evaluasi pembelajaran SMP Indonesia. Hasilkan laporan evaluasi pembelajaran resmi yang akurat, terstruktur, dan langsung dapat ditindaklanjuti oleh guru mata pelajaran.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            required: [
              'judulLaporan',
              'ringkasanHasilBelajar',
              'ketercapaianTP',
              'materiDikuasai',
              'materiPerluDiperbaiki',
              'rekomendasiRemedial',
              'rekomendasiPengayaan',
              'catatanPenutupGuru',
            ],
            properties: {
              judulLaporan: { type: Type.STRING },
              ringkasanHasilBelajar: { type: Type.STRING },
              ketercapaianTP: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: [
                    'no',
                    'tujuanPembelajaran',
                    'materi',
                    'tingkatKetercapaian',
                    'persentaseCapaian',
                    'catatanBukti',
                  ],
                  properties: {
                    no: { type: Type.INTEGER },
                    tujuanPembelajaran: { type: Type.STRING },
                    materi: { type: Type.STRING },
                    tingkatKetercapaian: {
                      type: Type.STRING,
                      enum: ['Tercapai Penuh', 'Tercapai Sebagian', 'Belum Tercapai'],
                    },
                    persentaseCapaian: { type: Type.STRING },
                    catatanBukti: { type: Type.STRING },
                  },
                },
              },
              materiDikuasai: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ['materi', 'alasanBukti'],
                  properties: {
                    materi: { type: Type.STRING },
                    alasanBukti: { type: Type.STRING },
                  },
                },
              },
              materiPerluDiperbaiki: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ['materi', 'alasanBukti'],
                  properties: {
                    materi: { type: Type.STRING },
                    alasanBukti: { type: Type.STRING },
                  },
                },
              },
              rekomendasiRemedial: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: [
                    'sasaran',
                    'strategi',
                    'bentukAktivitas',
                    'targetKetuntasan',
                  ],
                  properties: {
                    sasaran: { type: Type.STRING },
                    strategi: { type: Type.STRING },
                    bentukAktivitas: { type: Type.STRING },
                    targetKetuntasan: { type: Type.STRING },
                  },
                },
              },
              rekomendasiPengayaan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: [
                    'sasaran',
                    'strategi',
                    'bentukAktivitas',
                    'luaranDiharapkan',
                  ],
                  properties: {
                    sasaran: { type: Type.STRING },
                    strategi: { type: Type.STRING },
                    bentukAktivitas: { type: Type.STRING },
                    luaranDiharapkan: { type: Type.STRING },
                  },
                },
              },
              catatanPenutupGuru: { type: Type.STRING },
            },
          },
        },
      })
    );

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json({
      id: `laporan-${Date.now()}`,
      mataPelajaran,
      kelasLabel,
      semesterLabel,
      namaSekolah,
      tahunAjaran,
      ...parsed,
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('Error generating learning evaluation report:', err);
    const message =
      err instanceof Error
        ? err.message
        : 'Gagal menyusun laporan evaluasi pembelajaran.';
    res.status(500).json({ error: message });
  }
});

app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Endpoint API tidak ditemukan.' });
});

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const message =
      err instanceof Error ? err.message : 'Terjadi kesalahan pada server.';
    res.status(500).json({ error: message });
  }
);

async function startServer() {
  const port = 3000;
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
