import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  CbtSharedSession,
  ExamFormSubmission,
  ExamPaperPackage,
} from './src/types/kisiKisi.ts';
import {
  generateLocalAssessmentGuide,
  generateLocalExamPaper,
  generateLocalKisiKisi,
  generateLocalLearningReport,
  generateLocalSampleItem,
  generateLocalScoreInterpretation,
} from './src/utils/localEvaluationEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CBT_STORE_PATH = path.join(__dirname, '.cbt-store.json');

interface CbtStoreData {
  sessions: Record<string, CbtSharedSession>;
  submissions: ExamFormSubmission[];
}

function loadCbtStore(): CbtStoreData {
  try {
    if (fs.existsSync(CBT_STORE_PATH)) {
      const raw = fs.readFileSync(CBT_STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<CbtStoreData>;
      return {
        sessions: parsed.sessions ?? {},
        submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
      };
    }
  } catch {
    // Fallback empty store
  }
  return { sessions: {}, submissions: [] };
}

function saveCbtStore(store: CbtStoreData): void {
  try {
    fs.writeFileSync(CBT_STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch {
    // Ignore write failure on read-only environments
  }
}

function buildSubjectSessionCode(subject: string): string {
  const cleanWords = subject
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let prefix = 'UJN';
  if (cleanWords.length === 1) {
    prefix = cleanWords[0].slice(0, 3).toUpperCase();
  } else if (cleanWords.length >= 2) {
    prefix = cleanWords
      .slice(0, 3)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${suffix}`;
}

function normalizeShortAnswerServer(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/×/g, 'x')
    .replace(/,/g, '.');
}

function sanitizePaperForStudent(paper: ExamPaperPackage): ExamPaperPackage {
  return {
    ...paper,
    pilihanGanda: paper.pilihanGanda.map((q) => ({
      ...q,
      kunciJawaban: '' as unknown as 'A',
      pembahasan: '',
    })),
    isianSingkat: paper.isianSingkat.map((q) => ({
      ...q,
      kunciJawaban: '',
      pedomanPenskoran: '',
    })),
    uraian: paper.uraian.map((q) => ({
      ...q,
      kunciJawaban: '',
      pedomanPenskoran: '',
    })),
  };
}

const app = express();
app.use(express.json({ limit: '2mb' }));

app.post('/api/kisi-kisi/generate', (req, res) => {
  try {
    const {
      mataPelajaran,
      kelas,
      semester,
      jumlahPG = 20,
      jumlahPGK = 0,
      jumlahIsian = 5,
      jumlahUraian = 5,
      materiPokok,
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

    const result = generateLocalKisiKisi(req.body ?? {});
    res.json(result);
  } catch (err: unknown) {
    console.error('Error generating kisi-kisi:', err);
    const message =
      err instanceof Error ? err.message : 'Terjadi kesalahan saat menyusun kisi-kisi.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/kisi-kisi/sample-item', (req, res) => {
  try {
    const { config, row } = req.body ?? {};
    if (!config || !row) {
      res.status(400).json({ error: 'Data konfigurasi dan baris kisi-kisi wajib dikirim.' });
      return;
    }

    const result = generateLocalSampleItem(config, row);
    res.json(result);
  } catch (err: unknown) {
    console.error('Error generating sample item:', err);
    const message =
      err instanceof Error ? err.message : 'Gagal membuat contoh butir soal.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/naskah-soal/generate', (req, res) => {
  try {
    const {
      kisiKisiText,
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

    const total = Number(jumlahPG) + Number(jumlahIsian) + Number(jumlahUraian);
    if (total <= 0) {
      res.status(400).json({
        error: 'Jumlah total soal minimal 1 butir.',
      });
      return;
    }

    const result = generateLocalExamPaper(req.body ?? {});
    res.json(result);
  } catch (err: unknown) {
    console.error('Error generating exam paper:', err);
    const message =
      err instanceof Error ? err.message : 'Gagal menyusun naskah soal ujian.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/pedoman-penilaian/generate', (req, res) => {
  try {
    const { rawExamText } = req.body ?? {};

    if (!rawExamText || String(rawExamText).trim().length < 15) {
      res.status(400).json({
        error:
          'Tempelkan soal ujian atau gunakan naskah soal aktif terlebih dahulu (minimal 15 karakter).',
      });
      return;
    }

    const result = generateLocalAssessmentGuide(req.body ?? {});
    res.json(result);
  } catch (err: unknown) {
    console.error('Error generating assessment guide:', err);
    const message =
      err instanceof Error ? err.message : 'Gagal menyusun kunci dan pedoman penilaian.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/analisis-hasil/interpretasi', (req, res) => {
  try {
    const { stats } = req.body ?? {};

    if (!stats || !stats.totalSiswa) {
      res.status(400).json({
        error: 'Statistik hasil ujian wajib tersedia sebelum menyusun interpretasi.',
      });
      return;
    }

    const result = generateLocalScoreInterpretation(req.body ?? {});
    res.json(result);
  } catch (err: unknown) {
    console.error('Error generating score interpretation:', err);
    const message =
      err instanceof Error
        ? err.message
        : 'Gagal menyusun interpretasi hasil evaluasi.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/laporan-evaluasi/generate', (req, res) => {
  try {
    const { analisisText } = req.body ?? {};

    if (!analisisText || String(analisisText).trim().length < 20) {
      res.status(400).json({
        error:
          'Hasil analisis ujian wajib tersedia atau ditempelkan minimal 20 karakter untuk menyusun laporan evaluasi pembelajaran.',
      });
      return;
    }

    const result = generateLocalLearningReport(req.body ?? {});
    res.json(result);
  } catch (err: unknown) {
    console.error('Error generating learning evaluation report:', err);
    const message =
      err instanceof Error
        ? err.message
        : 'Gagal menyusun laporan evaluasi pembelajaran.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/cbt/sessions', (req, res) => {
  try {
    const { paper, kktp = 75, security } = req.body ?? {};
    if (!paper || !paper.mataPelajaran) {
      res.status(400).json({ error: 'Paket naskah soal wajib disertakan untuk membuat link CBT.' });
      return;
    }

    const store = loadCbtStore();
    const code = buildSubjectSessionCode(String(paper.mataPelajaran));
    const session: CbtSharedSession = {
      code,
      paper,
      kktp: Number(kktp) || 75,
      security: {
        acakSoal: security?.acakSoal ?? true,
        acakOpsi: security?.acakOpsi ?? true,
        wajibFullscreen: security?.wajibFullscreen ?? true,
        blokirCopyKlikKanan: security?.blokirCopyKlikKanan ?? true,
        batasPelanggaranTab: Number(security?.batasPelanggaranTab ?? 3),
        tokenUjian: String(security?.tokenUjian ?? '').trim().toUpperCase(),
        tampilkanNilaiKeSiswa: security?.tampilkanNilaiKeSiswa ?? true,
      },
      createdAt: new Date().toISOString(),
    };

    store.sessions[code] = session;
    saveCbtStore(store);

    res.json({ session });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membuat sesi link CBT.';
    res.status(500).json({ error: message });
  }
});

app.get('/api/cbt/sessions/:code', (req, res) => {
  const code = String(req.params.code || '').trim().toUpperCase();
  const role = String(req.query.role || 'student');
  const store = loadCbtStore();
  const session = store.sessions[code];

  if (!session) {
    res.status(404).json({ error: `Sesi ujian CBT dengan kode ${code} tidak ditemukan.` });
    return;
  }

  if (role === 'student') {
    res.json({
      session: {
        ...session,
        paper: sanitizePaperForStudent(session.paper),
      },
    });
    return;
  }

  res.json({ session });
});

app.post('/api/cbt/sessions/:code/submit', (req, res) => {
  try {
    const code = String(req.params.code || '').trim().toUpperCase();
    const store = loadCbtStore();
    const session = store.sessions[code];

    if (!session) {
      res.status(404).json({ error: `Sesi ujian CBT ${code} tidak ditemukan.` });
      return;
    }

    const {
      namaSiswa = '',
      nis = '',
      kelas = '',
      pgAnswers = {},
      isianAnswers = {},
      uraianAnswers = {},
      durasiDetik = 0,
      pelanggaranFokus = 0,
      dikumpulkanOtomatis = false,
    } = req.body ?? {};

    if (!String(namaSiswa).trim()) {
      res.status(400).json({ error: 'Nama lengkap peserta wajib diisi.' });
      return;
    }

    const paper = session.paper;
    const maksPG = paper.pilihanGanda.length;
    const skorPG = paper.pilihanGanda.reduce((acc, q) => {
      return acc + (pgAnswers[q.nomor] === q.kunciJawaban ? 1 : 0);
    }, 0);

    const maksIsian = paper.isianSingkat.length * 2;
    let skorIsian = 0;
    for (const q of paper.isianSingkat) {
      const studentNorm = normalizeShortAnswerServer(String(isianAnswers[q.nomor] || ''));
      const keyNorm = normalizeShortAnswerServer(q.kunciJawaban);
      if (studentNorm && studentNorm === keyNorm) {
        skorIsian += 2;
      }
    }

    const maksUraian = paper.uraian.reduce((acc, q) => acc + (q.skorMaksimal || 5), 0);
    let skorUraian = 0;
    for (const q of paper.uraian) {
      const hasText = Boolean(String(uraianAnswers[q.nomor] || '').trim());
      if (hasText) {
        skorUraian += Math.ceil((q.skorMaksimal || 5) / 2);
      }
    }

    const maksTotal = maksPG + maksIsian + maksUraian;
    const totalSkor = skorPG + skorIsian + skorUraian;
    const nilaiAkhir = maksTotal > 0 ? Math.round((totalSkor / maksTotal) * 1000) / 10 : 0;

    const submission: ExamFormSubmission = {
      id: `sub-cbt-${Date.now()}`,
      namaSiswa: String(namaSiswa).trim(),
      nis: String(nis).trim(),
      kelas: String(kelas).trim() || paper.kelasLabel,
      judulUjian: paper.judulUjian,
      mataPelajaran: paper.mataPelajaran,
      pgAnswers,
      isianAnswers,
      uraianAnswers,
      skorPG,
      maksPG,
      skorIsian,
      maksIsian,
      skorUraian,
      maksUraian,
      nilaiAkhir,
      durasiDetik: Math.max(0, Number(durasiDetik) || 0),
      pelanggaranFokus: Math.max(0, Number(pelanggaranFokus) || 0),
      dikumpulkanOtomatis: Boolean(dikumpulkanOtomatis),
      cbtSessionCode: code,
      submittedAt: new Date().toISOString(),
    };

    store.submissions.unshift(submission);
    saveCbtStore(store);

    res.json({
      submission,
      tampilkanNilaiKeSiswa: session.security.tampilkanNilaiKeSiswa,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menyimpan jawaban CBT.';
    res.status(500).json({ error: message });
  }
});

app.get('/api/cbt/submissions', (req, res) => {
  const code = String(req.query.code || '').trim().toUpperCase();
  const store = loadCbtStore();
  const list = code
    ? store.submissions.filter((s) => s.cbtSessionCode === code)
    : store.submissions;
  res.json({ submissions: list });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: 'local-engine' });
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
    console.log(`Server running on http://0.0.0.0:${port} (local-engine mode)`);
  });
}

startServer();
