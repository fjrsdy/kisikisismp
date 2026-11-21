import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
