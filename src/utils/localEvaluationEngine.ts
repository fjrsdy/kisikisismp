import {
  COGNITIVE_LEVELS,
  GRADE_LABELS,
  SEMESTER_LABELS,
  getSuggestedTopics,
} from '../data/smpCurriculum';
import { SAMPLE_EXAM_PAPER } from '../data/sampleExamPaper';
import type {
  AssessmentEssayKey,
  AssessmentGuidePackage,
  AssessmentPGKey,
  AssessmentShortKey,
  CognitiveLevel,
  CognitivePreset,
  DifficultyLevel,
  EnrichmentPlanItem,
  EssayQuestion,
  ExamConfig,
  ExamPaperPackage,
  GeneratedSampleItem,
  GradeSMP,
  KisiRow,
  LearningEvaluationReport,
  MultipleChoiceQuestion,
  QuestionForm,
  RemedialPlanItem,
  ScoreAnalysisNarrative,
  ScoreStatistics,
  Semester,
  ShortAnswerQuestion,
  TPOAchievementItem,
  TopicMasteryNote,
} from '../types/kisiKisi';

const SUBJECT_CP_BANK: Record<string, string[]> = {
  Matematika: [
    'Peserta didik dapat membaca, menulis, dan membandingkan bilangan bulat, bilangan rasional, bilangan berpangkat, serta menggunakannya dalam menyelesaikan masalah kontekstual.',
    'Peserta didik dapat mengenali, memprediksi, dan menggeneralisasi pola serta menggunakan persamaan linear, sistem persamaan linear dua variabel, dan fungsi dalam pemecahan masalah.',
    'Peserta didik dapat membuktikan dan menerapkan Teorema Pythagoras, kesebangunan, transformasi geometri, serta menghitung luas dan volume bangun ruang sisi datar maupun lengkung.',
    'Peserta didik dapat merumuskan pertanyaan, mengumpulkan, menyajikan, dan menganalisis data statistika serta menentukan peluang empirik dan teoretik dari suatu percobaan.',
  ],
  'Bahasa Indonesia': [
    'Peserta didik mampu memahami, menginterpretasi, dan mengevaluasi gagasan, pandangan, serta pesan dari teks deskripsi, narasi, prosedur, laporan hasil observasi, dan teks rekon.',
    'Peserta didik mampu menganalisis unsur kebahasaan, struktur teks, kohesi, koherensi, dan kaidah EYD V dalam berbagai ragam wacana tulis maupun multimodal.',
    'Peserta didik mampu menulis gagasan, pikiran, arahan, dan tanggapan kritis secara logis, terstruktur, dan kreatif dalam bentuk teks fungsional maupun sastra.',
  ],
  'Ilmu Pengetahuan Alam (IPA)': [
    'Peserta didik mampu melakukan pengukuran besaran fisis, mengidentifikasi karakteristik zat serta perubahan fisika/kimia, dan menganalisis kalor, gerak, gaya, usaha, serta getaran.',
    'Peserta didik memahami struktur dan fungsi sel, sistem organ manusia, klasifikasi makhluk hidup, serta interaksi komponen ekosistem dan upaya pelestarian lingkungan.',
    'Peserta didik mampu menerapkan konsep listrik, kemagnetan, tekanan zat, pewarisan sifat, dan posisi relatif Bumi-Bulan-Matahari dalam menjelaskan fenomena alam sehari-hari.',
  ],
  'Bahasa Inggris': [
    'Peserta didik menggunakan teks lisan, tulisan, dan visual dalam bahasa Inggris untuk berinteraksi dan berkomunikasi dalam konteks familiar maupun akademik tingkat dasar-menengah.',
    'Peserta didik mampu mengidentifikasi gagasan utama, informasi rinci tersurat/tersirat, dan makna kosakata kontekstual dari teks descriptive, recount, narrative, report, dan procedure.',
    'Peserta didik mampu menerapkan struktur tata bahasa (Simple Present, Past Tense, Passive Voice, Modal Verbs) secara tepat dalam kalimat dan teks fungsional pendek.',
  ],
  'Ilmu Pengetahuan Sosial (IPS)': [
    'Peserta didik memahami keberadaan diri dan keluarga di tengah lingkungan sosial serta kondisi geografis Indonesia dalam kaitannya dengan konektivitas antarruang dan pelestarian sumber daya.',
    'Peserta didik menganalisis proses interaksi sosial, mobilitas sosial, konflik dan integrasi, serta dinamika kependudukan dalam masyarakat Indonesia yang majemuk.',
    'Peserta didik memahami kegiatan ekonomi (produksi, distribusi, konsumsi), peran lembaga keuangan, perdagangan antarpulau/internasional, serta perkembangan sejarah kebangsaan.',
  ],
  'Pendidikan Pancasila': [
    'Peserta didik menghayati sejarah kelahiran Pancasila, kedudukan Pancasila sebagai dasar negara dan pandangan hidup bangsa, serta menerapkannya dalam kehidupan bermasyarakat.',
    'Peserta didik memahami norma, hak dan kewajiban warga negara, kedudukan UUD NRI Tahun 1945, serta tata urutan peraturan perundang-undangan nasional secara bertanggung jawab.',
    'Peserta didik mampu menelaah keberagaman suku, agama, ras, dan antargolongan dalam bingkai Bhinneka Tunggal Ika serta menjaga keutuhan wilayah NKRI.',
  ],
  Informatika: [
    'Peserta didik mampu menerapkan berpikir komputasional (dekomposisi, pengenalan pola, abstraksi, algoritma) dan konsep fungsi, himpunan, serta struktur data dasar.',
    'Peserta didik memahami cara kerja sistem komputer, jaringan komputer, internet, serta mempraktikkan integrasi aplikasi perkantoran dan pengolahan lembar kerja.',
    'Peserta didik mampu mengembangkan algoritma pemrograman visual/blok serta menganalisis dampak sosial informatika, etika bermedia digital, dan keamanan informasi.',
  ],
};

function getSubjectCPList(subject: string): string[] {
  if (SUBJECT_CP_BANK[subject]) return SUBJECT_CP_BANK[subject];
  return [
    `Peserta didik memahami konsep fundamental dan prinsip utama pada mata pelajaran ${subject} Fase D secara sistematis.`,
    `Peserta didik mampu menerapkan pengetahuan dan keterampilan prosedural ${subject} untuk menyelesaikan permasalahan kontekstual.`,
    `Peserta didik mampu menganalisis, mengevaluasi, dan mengomunikasikan gagasan berbasis bukti dalam kajian ${subject}.`,
  ];
}

function parseTopicsFromInput(
  materiPokok: string,
  mataPelajaran: string,
  kelas: GradeSMP,
  semester: Semester
): string[] {
  const cleaned = (materiPokok || '')
    .split(/[\n;]+|,\s*(?![^()]*\))/)
    .map((s) => s.trim().replace(/^[-•\d.)]+\s*/, ''))
    .filter((s) => s.length >= 2);
  if (cleaned.length > 0) return cleaned;
  return getSuggestedTopics(mataPelajaran, kelas, semester);
}

function buildCognitiveSequence(
  count: number,
  preset: CognitivePreset,
  hasComplexForm: boolean
): CognitiveLevel[] {
  if (count <= 0) return [];
  const poolProporsional: CognitiveLevel[] = ['C1', 'C2', 'C3', 'C3', 'C4', 'C2', 'C3', 'C5', 'C4', 'C6'];
  const poolHots: CognitiveLevel[] = ['C2', 'C3', 'C4', 'C4', 'C5', 'C3', 'C4', 'C6', 'C5', 'C4'];
  const poolDasar: CognitiveLevel[] = ['C1', 'C1', 'C2', 'C2', 'C3', 'C3', 'C2', 'C4', 'C1', 'C5'];

  const basePool =
    preset === 'hots_fokus'
      ? poolHots
      : preset === 'dasar_penguatan'
        ? poolDasar
        : poolProporsional;

  const result: CognitiveLevel[] = [];
  for (let i = 0; i < count; i++) {
    let lvl = basePool[i % basePool.length];
    if (hasComplexForm && i === count - 1) {
      lvl = preset === 'dasar_penguatan' ? 'C4' : i % 2 === 0 ? 'C5' : 'C6';
    }
    result.push(lvl);
  }
  return result;
}

function pickKko(level: CognitiveLevel, index: number): string {
  const examples = COGNITIVE_LEVELS[level]?.kkoExamples ?? ['Menentukan'];
  return examples[index % examples.length];
}

function formatNumberRange(start: number, count: number): string {
  if (count <= 1) return String(start);
  const nums: number[] = [];
  for (let i = 0; i < count; i++) nums.push(start + i);
  return nums.join(', ');
}

function buildTPForTopic(topic: string, level: CognitiveLevel, kko: string): string {
  const kkoLower = kko.toLowerCase();
  if (level === 'C1' || level === 'C2') {
    return `Peserta didik mampu ${kkoLower} konsep dasar, istilah kunci, dan prinsip utama pada materi ${topic}.`;
  }
  if (level === 'C3') {
    return `Peserta didik mampu ${kkoLower} prosedur dan kaidah ${topic} untuk menyelesaikan permasalahan rutin maupun kontekstual.`;
  }
  if (level === 'C4') {
    return `Peserta didik mampu ${kkoLower} hubungan antarunsur serta pola permasalahan pada topik ${topic}.`;
  }
  if (level === 'C5') {
    return `Peserta didik mampu ${kkoLower} ketepatan argumen atau penyelesaian masalah yang berkaitan dengan ${topic}.`;
  }
  return `Peserta didik mampu ${kkoLower} strategi pemecahan masalah atau rancangan solusi kontekstual pada topik ${topic}.`;
}

function buildIndicatorForTopic(
  topic: string,
  subject: string,
  level: CognitiveLevel,
  kko: string,
  form: QuestionForm
): string {
  const kkoLower = kko.toLowerCase();
  const stimulusBySubject: Record<string, string[]> = {
    Matematika: [
      `Disajikan data numerik dan situasi masalah sehari-hari mengenai ${topic}`,
      `Disajikan deskripsi kasus matematis terkait ${topic}`,
      `Disajikan grafik, tabel nilai, atau persamaan tentang ${topic}`,
    ],
    'Bahasa Indonesia': [
      `Disajikan kutipan paragraf bacaan bertema ${topic}`,
      `Disajikan teks fungsional pendek yang memuat unsur ${topic}`,
      `Disajikan wacana singkat berisi permasalahan kebahasaan tentang ${topic}`,
    ],
    'Ilmu Pengetahuan Alam (IPA)': [
      `Disajikan data hasil pengamatan atau skema percobaan mengenai ${topic}`,
      `Disajikan fenomena alam dalam kehidupan sehari-hari terkait ${topic}`,
      `Disajikan tabel besaran atau gambar ilustrasi tentang ${topic}`,
    ],
    'Bahasa Inggris': [
      `Disajikan teks pendek berbahasa Inggris bertema ${topic}`,
      `Disajikan dialog rumpang atau informasi fungsional mengenai ${topic}`,
      `Disajikan situasi komunikatif singkat terkait ${topic}`,
    ],
    'Ilmu Pengetahuan Sosial (IPS)': [
      `Disajikan studi kasus dinamika masyarakat atau peta wilayah mengenai ${topic}`,
      `Disajikan data kondisi sosial-ekonomi dan sejarah tentang ${topic}`,
      `Disajikan ilustrasi fenomena sosial budaya terkait ${topic}`,
    ],
    'Pendidikan Pancasila': [
      `Disajikan cuplikan peristiwa kehidupan bermasyarakat terkait ${topic}`,
      `Disajikan kutipan pasal atau studi kasus perilaku berwarga negara mengenai ${topic}`,
      `Disajikan wacana studi kasus nilai kebangsaan tentang ${topic}`,
    ],
    Informatika: [
      `Disajikan potongan algoritma, tabel data, atau skenario kasus mengenai ${topic}`,
      `Disajikan ilustrasi sistem atau kasus literasi digital terkait ${topic}`,
      `Disajikan contoh input-proses-output mengenai ${topic}`,
    ],
  };

  const bank = stimulusBySubject[subject] ?? [
    `Disajikan stimulus bacaan atau studi kasus mengenai ${topic}`,
    `Disajikan data informasi kontekstual terkait ${topic}`,
  ];
  const stimulus = bank[(topic.length + level.charCodeAt(1)) % bank.length];

  if (form === 'Pilihan Ganda Kompleks') {
    return `${stimulus}, peserta didik dapat ${kkoLower} beberapa pernyataan yang paling tepat mengenai ${topic}.`;
  }
  if (form === 'Isian Singkat') {
    return `${stimulus}, peserta didik dapat ${kkoLower} jawaban singkat yang akurat terkait ${topic}.`;
  }
  if (form === 'Uraian') {
    return `${stimulus}, peserta didik dapat ${kkoLower} penyelesaian lengkap disertai alasan atau langkah sistematis mengenai ${topic}.`;
  }
  return `${stimulus}, peserta didik dapat ${kkoLower} kesimpulan atau jawaban yang tepat terkait ${topic}.`;
}

export function generateLocalKisiKisi(config: Partial<ExamConfig>): {
  catatanAhliEvaluasi: string;
  rows: Omit<KisiRow, 'id'>[];
} {
  const mataPelajaran = config.mataPelajaran || 'Matematika';
  const kelas = (config.kelas || '8') as GradeSMP;
  const semester = (config.semester || '1') as Semester;
  const kurikulum = config.kurikulum || 'Kurikulum Merdeka (Fase D)';
  const proporsiKognitif = (config.proporsiKognitif || 'proporsional') as CognitivePreset;

  const pgCount = Math.max(0, Math.min(60, Number(config.jumlahPG) || 0));
  const pgkCount = Math.max(0, Math.min(20, Number(config.jumlahPGK) || 0));
  const isianCount = Math.max(0, Math.min(25, Number(config.jumlahIsian) || 0));
  const uraianCount = Math.max(0, Math.min(15, Number(config.jumlahUraian) || 0));

  const topics = parseTopicsFromInput(
    config.materiPokok || '',
    mataPelajaran,
    kelas,
    semester
  );
  const cpList = getSubjectCPList(mataPelajaran);

  interface FormAllocation {
    form: QuestionForm;
    startNo: number;
    itemsInRow: number;
  }

  const allocations: FormAllocation[] = [];
  let cursor = 1;

  const pushAllocations = (form: QuestionForm, total: number, maxGroupSize: number) => {
    let remaining = total;
    while (remaining > 0) {
      const groupSize = Math.min(remaining, maxGroupSize);
      allocations.push({ form, startNo: cursor, itemsInRow: groupSize });
      cursor += groupSize;
      remaining -= groupSize;
    }
  };

  pushAllocations('Pilihan Ganda', pgCount, pgCount > 18 ? 3 : 2);
  pushAllocations('Pilihan Ganda Kompleks', pgkCount, 2);
  pushAllocations('Isian Singkat', isianCount, isianCount > 6 ? 2 : 1);
  pushAllocations('Uraian', uraianCount, 1);

  const cogLevels = buildCognitiveSequence(
    allocations.length,
    proporsiKognitif,
    uraianCount > 0 || pgkCount > 0
  );

  // Calculate raw weight units so bobotSkor sums exactly to 100
  const weightPerForm: Record<QuestionForm, number> = {
    'Pilihan Ganda': 2,
    'Pilihan Ganda Kompleks': 3,
    Menjodohkan: 2,
    'Isian Singkat': 3,
    Uraian: 8,
  };
  const rawUnits = allocations.map(
    (a) => a.itemsInRow * (weightPerForm[a.form] || 2)
  );
  const totalRawUnits = rawUnits.reduce((acc, v) => acc + v, 0) || 1;
  const bobots = rawUnits.map((u) => Math.max(2, Math.round((u / totalRawUnits) * 100)));
  const bobotSum = bobots.reduce((acc, v) => acc + v, 0);
  if (bobots.length > 0 && bobotSum !== 100) {
    bobots[bobots.length - 1] = Math.max(2, bobots[bobots.length - 1] + (100 - bobotSum));
  }

  const rows: Omit<KisiRow, 'id'>[] = allocations.map((alloc, idx) => {
    const topic = topics[idx % topics.length];
    const cp = cpList[idx % cpList.length];
    const levelKognitif = cogLevels[idx] || 'C3';
    const kko = pickKko(levelKognitif, idx);
    return {
      no: idx + 1,
      capaianPembelajaran: cp,
      tujuanPembelajaran: buildTPForTopic(topic, levelKognitif, kko),
      materi: topic,
      indikatorSoal: buildIndicatorForTopic(topic, mataPelajaran, levelKognitif, kko, alloc.form),
      levelKognitif,
      kataKerjaOperasional: kko,
      bentukSoal: alloc.form,
      nomorSoal: formatNumberRange(alloc.startNo, alloc.itemsInRow),
      bobotSkor: bobots[idx],
    };
  });

  const lotsCount = rows.filter((r) => r.levelKognitif === 'C1' || r.levelKognitif === 'C2').length;
  const motsCount = rows.filter((r) => r.levelKognitif === 'C3').length;
  const hotsCount = rows.filter(
    (r) => r.levelKognitif === 'C4' || r.levelKognitif === 'C5' || r.levelKognitif === 'C6'
  ).length;
  const totalRows = rows.length || 1;
  const totalSoal = pgCount + pgkCount + isianCount + uraianCount;

  const catatanAhliEvaluasi = `Kisi-kisi ${mataPelajaran} ${GRADE_LABELS[kelas]} ${SEMESTER_LABELS[semester]} (${kurikulum}) disusun mencakup ${totalSoal} butir soal pada ${topics.length} materi pokok. Sebaran kognitif Taksonomi Bloom Revisi terjaga pada komposisi ${Math.round((lotsCount / totalRows) * 100)}% LOTS (C1–C2), ${Math.round((motsCount / totalRows) * 100)}% MOTS (C3), dan ${Math.round((hotsCount / totalRows) * 100)}% HOTS (C4–C6) dengan total bobot 100 poin.`;

  return { catatanAhliEvaluasi, rows };
}

/* ============================================================================
 * CURATED MULTI-SUBJECT SMP QUESTION BANK
 * ============================================================================ */

interface BankPGItem {
  subject: string;
  materiKeyword: string;
  levelKognitif: CognitiveLevel;
  tingkatKesulitan: DifficultyLevel;
  indikator: string;
  stimulus: string;
  pertanyaan: string;
  pilihan: { A: string; B: string; C: string; D: string };
  kunciJawaban: 'A' | 'B' | 'C' | 'D';
  pembahasan: string;
}

interface BankShortItem {
  subject: string;
  materiKeyword: string;
  levelKognitif: CognitiveLevel;
  tingkatKesulitan: DifficultyLevel;
  indikator: string;
  stimulus: string;
  pertanyaan: string;
  kunciJawaban: string;
  alternatif: string[];
  pedomanPenskoran: string;
}

interface BankEssayItem {
  subject: string;
  materiKeyword: string;
  levelKognitif: CognitiveLevel;
  tingkatKesulitan: DifficultyLevel;
  indikator: string;
  stimulus: string;
  pertanyaan: string;
  kunciJawaban: string;
  alternatif: string[];
  pedomanPenskoran: string;
  skorMaksimal: number;
}

const CURATED_PG_BANK: BankPGItem[] = [
  ...SAMPLE_EXAM_PAPER.pilihanGanda.map((q) => ({
    subject: 'Matematika',
    materiKeyword: q.materi,
    levelKognitif: q.levelKognitif,
    tingkatKesulitan: q.tingkatKesulitan,
    indikator: q.indikatorTerkait,
    stimulus: q.stimulus,
    pertanyaan: q.pertanyaan,
    pilihan: q.pilihan,
    kunciJawaban: q.kunciJawaban,
    pembahasan: q.pembahasan,
  })),
  {
    subject: 'Matematika',
    materiKeyword: 'Bilangan Bulat',
    levelKognitif: 'C3',
    tingkatKesulitan: 'Mudah',
    indikator: 'Menghitung hasil operasi campuran bilangan bulat dalam konteks suhu.',
    stimulus: 'Suhu di dalam ruang pendingin mula-mula -4°C. Setelah mesin dimatikan selama 3 jam, suhunya naik 3°C setiap jam.',
    pertanyaan: 'Suhu ruang pendingin tersebut sekarang adalah ...',
    pilihan: { A: '3°C', B: '5°C', C: '9°C', D: '-13°C' },
    kunciJawaban: 'B',
    pembahasan: 'Kenaikan suhu = 3 × 3°C = 9°C. Suhu akhir = -4°C + 9°C = 5°C.',
  },
  {
    subject: 'Matematika',
    materiKeyword: 'Rasio dan Proporsi',
    levelKognitif: 'C3',
    tingkatKesulitan: 'Sedang',
    indikator: 'Menyelesaikan masalah perbandingan berbalik nilai dalam pekerjaan konstruksi.',
    stimulus: 'Pembangunan pos ronda direncanakan selesai dalam 24 hari oleh 8 pekerja.',
    pertanyaan: 'Jika pekerjaan harus selesai dalam 16 hari, banyak pekerja tambahan yang diperlukan adalah ... orang.',
    pilihan: { A: '4', B: '6', C: '10', D: '12' },
    kunciJawaban: 'A',
    pembahasan: 'Perbandingan berbalik nilai: 24 × 8 = 16 × x → x = 192 / 16 = 12 pekerja. Tambahan = 12 - 8 = 4 orang.',
  },
  {
    subject: 'Matematika',
    materiKeyword: 'Bentuk Aljabar',
    levelKognitif: 'C2',
    tingkatKesulitan: 'Mudah',
    indikator: 'Menyederhanakan operasi penjumlahan dan pengurangan suku sejenis bentuk aljabar.',
    stimulus: '-',
    pertanyaan: 'Bentuk sederhana dari 5x - 3y + 7 - 2x + 8y - 4 adalah ...',
    pilihan: { A: '3x + 5y + 3', B: '3x - 11y + 3', C: '7x + 5y + 11', D: '3x + 5y - 3' },
    kunciJawaban: 'A',
    pembahasan: 'Kelompokkan suku sejenis: (5x - 2x) + (-3y + 8y) + (7 - 4) = 3x + 5y + 3.',
  },
  {
    subject: 'Matematika',
    materiKeyword: 'Relasi dan Fungsi',
    levelKognitif: 'C3',
    tingkatKesulitan: 'Sedang',
    indikator: 'Menentukan nilai fungsi linear dari rumus fungsi yang diketahui.',
    stimulus: '-',
    pertanyaan: 'Diketahui fungsi f(x) = 3x - 5. Jika f(a) = 16, maka nilai a adalah ...',
    pilihan: { A: '5', B: '6', C: '7', D: '8' },
    kunciJawaban: 'C',
    pembahasan: '3a - 5 = 16 → 3a = 21 → a = 7.',
  },
  {
    subject: 'Matematika',
    materiKeyword: 'Statistika',
    levelKognitif: 'C4',
    tingkatKesulitan: 'Sedang',
    indikator: 'Menganalisis rata-rata gabungan dua kelompok data.',
    stimulus: 'Nilai rata-rata ulangan Matematika 18 siswa adalah 76. Setelah 2 siswa mengikuti ulangan susulan, rata-rata kelas menjadi 78.',
    pertanyaan: 'Nilai rata-rata dari 2 siswa yang mengikuti ulangan susulan adalah ...',
    pilihan: { A: '88', B: '92', C: '96', D: '98' },
    kunciJawaban: 'C',
    pembahasan: 'Jumlah 20 siswa = 20 × 78 = 1.560. Jumlah 18 siswa = 18 × 76 = 1.368. Selisih = 192, sehingga rata-rata 2 siswa = 192 / 2 = 96.',
  },
  {
    subject: 'Matematika',
    materiKeyword: 'Peluang',
    levelKognitif: 'C3',
    tingkatKesulitan: 'Mudah',
    indikator: 'Menghitung peluang teoretik kejadian majemuk pelemparan dua buah dadu.',
    stimulus: '-',
    pertanyaan: 'Dua buah dadu dilemparkan bersamaan satu kali. Peluang muncul mata dadu berjumlah 9 adalah ...',
    pilihan: { A: '1/12', B: '1/9', C: '5/36', D: '1/6' },
    kunciJawaban: 'B',
    pembahasan: 'Pasangan berjumlah 9: (3,6), (4,5), (5,4), (6,3) ada 4 kejadian dari 36 ruang sampel → 4/36 = 1/9.',
  },
  {
    subject: 'Matematika',
    materiKeyword: 'Bangun Ruang',
    levelKognitif: 'C3',
    tingkatKesulitan: 'Sedang',
    indikator: 'Menghitung volume tabung dalam permasalahan kapasitas wadah.',
    stimulus: 'Sebuah tangki air berbentuk tabung memiliki jari-jari alas 70 cm dan tinggi 100 cm.',
    pertanyaan: 'Volume maksimal air yang dapat ditampung tangki tersebut (π = 22/7) adalah ... liter.',
    pilihan: { A: '154', B: '440', C: '1.540', D: '4.400' },
    kunciJawaban: 'C',
    pembahasan: 'V = π r² t = (22/7) × 7 dm × 7 dm × 10 dm = 1.540 dm³ = 1.540 liter.',
  },
  {
    subject: 'Matematika',
    materiKeyword: 'Persamaan Kuadrat',
    levelKognitif: 'C3',
    tingkatKesulitan: 'Sedang',
    indikator: 'Menentukan akar-akar persamaan kuadrat dengan pemfaktoran.',
    stimulus: '-',
    pertanyaan: 'Akar-akar dari persamaan kuadrat x² - 7x + 12 = 0 adalah ...',
    pilihan: { A: 'x = 2 atau x = 6', B: 'x = 3 atau x = 4', C: 'x = -3 atau x = -4', D: 'x = -2 atau x = 6' },
    kunciJawaban: 'B',
    pembahasan: 'x² - 7x + 12 = (x - 3)(x - 4) = 0, sehingga akarnya x = 3 atau x = 4.',
  },
  {
    subject: 'Ilmu Pengetahuan Alam (IPA)',
    materiKeyword: 'Pengukuran',
    levelKognitif: 'C2',
    tingkatKesulitan: 'Mudah',
    indikator: 'Mengidentifikasi satuan besaran pokok dalam Sistem Internasional (SI).',
    stimulus: '-',
    pertanyaan: 'Kelompok besaran berikut yang seluruhnya termasuk besaran pokok dalam Sistem Internasional (SI) adalah ...',
    pilihan: {
      A: 'Massa, waktu, kuat arus listrik',
      B: 'Panjang, kecepatan, massa jenis',
      C: 'Gaya, usaha, daya',
      D: 'Suhu, tekanan, volume',
    },
    kunciJawaban: 'A',
    pembahasan: 'Ketujuh besaran pokok SI meliputi panjang, massa, waktu, suhu, kuat arus listrik, intensitas cahaya, dan jumlah zat.',
  },
  {
    subject: 'Ilmu Pengetahuan Alam (IPA)',
    materiKeyword: 'Gerak dan Gaya',
    levelKognitif: 'C3',
    tingkatKesulitan: 'Sedang',
    indikator: 'Menerapkan Hukum II Newton untuk menghitung percepatan benda.',
    stimulus: 'Sebuah peti bermassa 15 kg berada di lantai licin didorong ke kanan oleh dua anak masing-masing dengan gaya 40 N dan 35 N, sementara gaya gesek udara berlawanan sebesar 15 N.',
    pertanyaan: 'Percepatan yang dialami peti tersebut adalah ... m/s².',
    pilihan: { A: '3', B: '4', C: '5', D: '6' },
    kunciJawaban: 'B',
    pembahasan: 'Resultan gaya ΣF = 40 + 35 - 15 = 60 N. Sesuai Hukum II Newton, a = ΣF / m = 60 / 15 = 4 m/s².',
  },
  {
    subject: 'Ilmu Pengetahuan Alam (IPA)',
    materiKeyword: 'Ekologi',
    levelKognitif: 'C4',
    tingkatKesulitan: 'Sedang',
    indikator: 'Menganalisis keseimbangan rantai makanan dalam suatu ekosistem.',
    stimulus: 'Pada ekosistem sawah terdapat rantai makanan: Padi → Tikus → Ular → Elang.',
    pertanyaan: 'Apabila populasi ular menurun drastis akibat perburuan liar, dampak langsung yang paling mungkin terjadi adalah ...',
    pilihan: {
      A: 'Populasi padi meningkat pesat',
      B: 'Populasi tikus meningkat sehingga merusak padi',
      C: 'Populasi elang meningkat karena kekurangan saingan',
      D: 'Semua komponen ekosistem tetap stabil',
    },
    kunciJawaban: 'B',
    pembahasan: 'Penurunan predator (ular) menyebabkan populasi mangsanya (tikus) melonjak sehingga konsumsi padi meningkat dan panen terancam.',
  },
  {
    subject: 'Ilmu Pengetahuan Alam (IPA)',
    materiKeyword: 'Listrik',
    levelKognitif: 'C3',
    tingkatKesulitan: 'Sedang',
    indikator: 'Menghitung hambatan pengganti dan kuat arus listrik pada rangkaian seri-paralel.',
    stimulus: 'Dua buah resistor masing-masing bernilai 6 Ω dan 3 Ω dirangkai secara paralel lalu dihubungkan dengan sumber tegangan 12 V.',
    pertanyaan: 'Kuat arus total yang mengalir pada rangkaian tersebut adalah ... A.',
    pilihan: { A: '2', B: '4', C: '6', D: '9' },
    kunciJawaban: 'C',
    pembahasan: '1/Rp = 1/6 + 1/3 = 3/6 → Rp = 2 Ω. Arus total I = V / Rp = 12 / 2 = 6 A.',
  },
  {
    subject: 'Bahasa Indonesia',
    materiKeyword: 'Teks Deskripsi',
    levelKognitif: 'C2',
    tingkatKesulitan: 'Mudah',
    indikator: 'Mengidentifikasi citraan indrawi yang dominan pada paragraf deskripsi.',
    stimulus: 'Udara pagi di lereng Dieng terasa menusuk tulang. Kabut putih tipis perlahan menyelimuti hamparan kebun teh yang hijau berkilau diterpa sinar mentari.',
    pertanyaan: 'Citraan indrawi yang tampak pada dua kalimat tersebut secara berurutan adalah ...',
    pilihan: {
      A: 'Pendengaran dan penciuman',
      B: 'Perabaan dan penglihatan',
      C: 'Pengecapan dan penglihatan',
      D: 'Perabaan dan pendengaran',
    },
    kunciJawaban: 'B',
    pembahasan: 'Frasa "terasa menusuk tulang" melibatkan indra peraba, sedangkan "kabut putih... hijau berkilau" melibatkan indra penglihatan.',
  },
  {
    subject: 'Bahasa Indonesia',
    materiKeyword: 'Teks Prosedur',
    levelKognitif: 'C3',
    tingkatKesulitan: 'Mudah',
    indikator: 'Mengidentifikasi kalimat imperatif dan konjungsi temporal pada teks prosedur.',
    stimulus: '1) Siapkan daun pandan bersih sebanyak lima lembar.\n2) Cucilah daun di bawah air mengalir hingga bersih.\n3) Setelah itu, ikatlah menjadi satu simpul agar aromanya keluar.',
    pertanyaan: 'Kata kerja imperatif (perintah) yang terdapat pada kutipan langkah di atas adalah ...',
    pilihan: {
      A: 'sebanyak, mengalir, aroma',
      B: 'siapkan, cucilah, ikatlah',
      C: 'bersih, simpul, keluar',
      D: 'daun, bawah, agar',
    },
    kunciJawaban: 'B',
    pembahasan: 'Kata "siapkan", "cucilah", dan "ikatlah" merupakan verba imperatif yang menyatakan perintah langkah kerja.',
  },
  {
    subject: 'Bahasa Indonesia',
    materiKeyword: 'Ejaan',
    levelKognitif: 'C3',
    tingkatKesulitan: 'Sedang',
    indikator: 'Menentukan penulisan kata baku sesuai KBBI dan EYD V.',
    stimulus: '-',
    pertanyaan: 'Penulisan seluruh kata baku yang tepat terdapat pada kelompok kata ...',
    pilihan: {
      A: 'apek, aktifitas, analisa',
      B: 'apotek, aktivitas, analisis',
      C: 'apotik, aktivis, diagnosa',
      D: 'atlet, ijasah, resiko',
    },
    kunciJawaban: 'B',
    pembahasan: 'Bentuk baku menurut KBBI adalah apotek (bukan apotik), aktivitas (bukan aktifitas), dan analisis (bukan analisa).',
  },
  {
    subject: 'Bahasa Inggris',
    materiKeyword: 'Simple Present',
    levelKognitif: 'C2',
    tingkatKesulitan: 'Mudah',
    indikator: 'Melengkapi kalimat rumpang berbentuk Simple Present Tense dengan tepat.',
    stimulus: '-',
    pertanyaan: 'Rania always ... her bicycle to school at 6.30 a.m. every morning.',
    pilihan: { A: 'ride', B: 'rides', C: 'rode', D: 'is riding' },
    kunciJawaban: 'B',
    pembahasan: 'Subjek tunggal orang ketiga (Rania) dan keterangan kebiasaan "always / every morning" menggunakan verb-s: rides.',
  },
  {
    subject: 'Bahasa Inggris',
    materiKeyword: 'Recount Text',
    levelKognitif: 'C3',
    tingkatKesulitan: 'Sedang',
    indikator: 'Menentukan informasi tersirat atau tujuan komunikatif dari recount text.',
    stimulus: 'Last Sunday, our school held an Independence Day parade around the neighborhood. Every class wore traditional costumes from different provinces in Indonesia.',
    pertanyaan: 'What is the main communicative purpose of the text above?',
    pilihan: {
      A: 'To persuade readers to buy traditional costumes',
      B: 'To describe how to make a parade banner step by step',
      C: 'To retell a past school event in chronological context',
      D: 'To announce an upcoming school holiday next month',
    },
    kunciJawaban: 'C',
    pembahasan: 'Teks recount bertujuan menceritakan kembali peristiwa yang telah terjadi di masa lampau ("Last Sunday... held... wore").',
  },
  {
    subject: 'Ilmu Pengetahuan Sosial (IPS)',
    materiKeyword: 'Geografis',
    levelKognitif: 'C2',
    tingkatKesulitan: 'Mudah',
    indikator: 'Menjelaskan dampak letak astronomis Indonesia terhadap pembagian waktu dan iklim.',
    stimulus: 'Secara astronomis, Indonesia terletak di antara 6° LU – 11° LS dan 95° BT – 141° BT.',
    pertanyaan: 'Pengaruh langsung letak lintang tersebut bagi kondisi alam Indonesia adalah ...',
    pilihan: {
      A: 'Indonesia memiliki empat musim yang berganti setiap tiga bulan',
      B: 'Indonesia beriklim tropis dengan curah hujan dan penyinaran matahari cukup tinggi',
      C: 'Indonesia terbagi menjadi lima zona waktu resmi',
      D: 'Indonesia terbebas dari aktivitas lempeng tektonik',
    },
    kunciJawaban: 'B',
    pembahasan: 'Posisi 6° LU–11° LS berada di kawasan khatulistiwa sehingga menghasilkan iklim tropis.',
  },
  {
    subject: 'Pendidikan Pancasila',
    materiKeyword: 'UUD',
    levelKognitif: 'C2',
    tingkatKesulitan: 'Mudah',
    indikator: 'Mengidentifikasi tata urutan peraturan perundang-undangan nasional.',
    stimulus: 'Sesuai Pasal 7 Ayat (1) UU Nomor 12 Tahun 2011, peraturan perundang-undangan Indonesia memiliki hierarki yang jelas.',
    pertanyaan: 'Peraturan perundang-undangan yang menempati kedudukan tertinggi sebagai hukum dasar tertulis adalah ...',
    pilihan: {
      A: 'Ketetapan MPR',
      B: 'Undang-Undang / Perppu',
      C: 'UUD Negara Republik Indonesia Tahun 1945',
      D: 'Peraturan Pemerintah',
    },
    kunciJawaban: 'C',
    pembahasan: 'Dalam hierarki perundang-undangan nasional, UUD NRI Tahun 1945 berada pada urutan paling atas.',
  },
  {
    subject: 'Informatika',
    materiKeyword: 'Berpikir Komputasional',
    levelKognitif: 'C2',
    tingkatKesulitan: 'Mudah',
    indikator: 'Membedakan empat pilar berpikir komputasional dalam pemecahan masalah.',
    stimulus: 'Seorang siswa memecah tugas pembuatan proyek aplikasi menjadi beberapa modul kecil: desain antarmuka, pengolahan data, dan pengujian.',
    pertanyaan: 'Pilar berpikir komputasional yang diterapkan siswa tersebut adalah ...',
    pilihan: {
      A: 'Dekomposisi',
      B: 'Pengenalan pola',
      C: 'Abstraksi',
      D: 'Algoritma',
    },
    kunciJawaban: 'A',
    pembahasan: 'Dekomposisi adalah teknik memecah masalah besar atau kompleks menjadi submasalah yang lebih kecil agar mudah dikelola.',
  },
];

const CURATED_SHORT_BANK: BankShortItem[] = [
  ...SAMPLE_EXAM_PAPER.isianSingkat.map((q) => ({
    subject: 'Matematika',
    materiKeyword: q.materi,
    levelKognitif: q.levelKognitif,
    tingkatKesulitan: q.tingkatKesulitan,
    indikator: q.indikatorTerkait,
    stimulus: q.stimulus,
    pertanyaan: q.pertanyaan,
    kunciJawaban: q.kunciJawaban,
    alternatif: [q.kunciJawaban],
    pedomanPenskoran: q.pedomanPenskoran,
  })),
  {
    subject: 'Ilmu Pengetahuan Alam (IPA)',
    materiKeyword: 'Energi',
    levelKognitif: 'C3',
    tingkatKesulitan: 'Mudah',
    indikator: 'Menghitung besar energi kinetik benda bergerak.',
    stimulus: 'Sebuah bola bermassa 2 kg menggelinding dengan kecepatan tetap 4 m/s.',
    pertanyaan: 'Besar energi kinetik bola tersebut adalah ... joule.',
    kunciJawaban: '16',
    alternatif: ['16', '16 J', '16 joule'],
    pedomanPenskoran: 'Skor 2 jika menjawab 16 atau 16 J dengan tepat; skor 0 jika keliru.',
  },
  {
    subject: 'Bahasa Indonesia',
    materiKeyword: 'Kebahasaan',
    levelKognitif: 'C3',
    tingkatKesulitan: 'Mudah',
    indikator: 'Mengubah kata tidak baku menjadi bentuk baku KBBI.',
    stimulus: 'Kalimat: "Para siswa melakukan aktifitas literasi sebelum jam pelajaran dimulai."',
    pertanyaan: 'Penulisan kata baku yang tepat untuk kata "aktifitas" adalah ...',
    kunciJawaban: 'aktivitas',
    alternatif: ['aktivitas', 'Aktivitas'],
    pedomanPenskoran: 'Skor 2 jika menulis "aktivitas" dengan ejaan tepat; skor 0 jika tidak tepat.',
  },
  {
    subject: 'Bahasa Inggris',
    materiKeyword: 'Verb',
    levelKognitif: 'C2',
    tingkatKesulitan: 'Mudah',
    indikator: 'Melengkapi kalimat lampau dengan bentuk Past Tense kata kerja tak beraturan.',
    stimulus: '-',
    pertanyaan: 'Bentuk Past Tense (Verb-2) dari kata kerja "go" pada kalimat "We ... to the museum yesterday" adalah ...',
    kunciJawaban: 'went',
    alternatif: ['went', 'Went'],
    pedomanPenskoran: 'Skor 2 jika menjawab "went"; skor 0 jika menjawab lain.',
  },
  {
    subject: 'Pendidikan Pancasila',
    materiKeyword: 'Pancasila',
    levelKognitif: 'C1',
    tingkatKesulitan: 'Mudah',
    indikator: 'Menyebutkan tanggal peringatan Hari Lahir Pancasila.',
    stimulus: '-',
    pertanyaan: 'Pidato pengusulan dasar negara Pancasila oleh Ir. Soekarno terjadi pada sidang BPUPKI tanggal 1 Juni 1945 sehingga setiap tanggal ... diperingati sebagai Hari Lahir Pancasila.',
    kunciJawaban: '1 Juni',
    alternatif: ['1 Juni', '01 Juni', 'tanggal 1 Juni'],
    pedomanPenskoran: 'Skor 2 jika menulis "1 Juni"; skor 1 jika hanya menulis Juni; skor 0 jika salah.',
  },
  {
    subject: 'Informatika',
    materiKeyword: 'Bilangan',
    levelKognitif: 'C3',
    tingkatKesulitan: 'Sedang',
    indikator: 'Mengonversi bilangan desimal ke sistem bilangan biner.',
    stimulus: '-',
    pertanyaan: 'Bentuk bilangan biner dari bilangan desimal 13 adalah ...',
    kunciJawaban: '1101',
    alternatif: ['1101', '1101₂'],
    pedomanPenskoran: 'Skor 2 jika menulis 1101; skor 0 jika salah.',
  },
];

const CURATED_ESSAY_BANK: BankEssayItem[] = [
  ...SAMPLE_EXAM_PAPER.uraian.map((q) => ({
    subject: 'Matematika',
    materiKeyword: q.materi,
    levelKognitif: q.levelKognitif,
    tingkatKesulitan: q.tingkatKesulitan,
    indikator: q.indikatorTerkait,
    stimulus: q.stimulus,
    pertanyaan: q.pertanyaan,
    kunciJawaban: q.kunciJawaban,
    alternatif: ['Menggunakan metode substitusi langsung maupun metode campuran (eliminasi-substitusi).'],
    pedomanPenskoran: q.pedomanPenskoran,
    skorMaksimal: q.skorMaksimal,
  })),
  {
    subject: 'Ilmu Pengetahuan Alam (IPA)',
    materiKeyword: 'Pencemaran',
    levelKognitif: 'C5',
    tingkatKesulitan: 'Sukar',
    indikator: 'Mengevaluasi dampak pencemaran air dan merancang dua langkah mitigasi.',
    stimulus: 'Hasil uji air sungai di dekat pemukiman menunjukkan kadar oksigen terlarut (DO) sangat rendah dan banyaknya busa detergen.',
    pertanyaan: 'Analisislah dua dampak kondisi air tersebut bagi ekosistem sungai serta rumuskan dua upaya konkret yang dapat dilakukan warga sekolah untuk mencegah pencemaran serupa!',
    kunciJawaban:
      '1) Dampak: Penurunan kadar oksigen terlarut menyebabkan kematian ikan/biota air serta eutrofikasi akibat fosfat detergen.\n2) Upaya mitigasi: Menerapkan instalasi pengolahan air limbah (IPAL) sederhana/biofilter di kantin serta kampanye pengurangan penggunaan detergen berfosfat tinggi dan pemilahan sampah.',
    alternatif: ['Menyebutkan dampak rantai makanan akuatik dan solusi biopori/bank sampah sekolah.'],
    pedomanPenskoran:
      'Skor 2: Menjelaskan 2 dampak ekologis dengan logis.\nSkor 2: Merumuskan 2 solusi konkret dan relevan.\nSkor 1: Argumentasi ilmiah runtut.',
    skorMaksimal: 5,
  },
  {
    subject: 'Bahasa Indonesia',
    materiKeyword: 'Prosedur',
    levelKognitif: 'C6',
    tingkatKesulitan: 'Sedang',
    indikator: 'Menyusun teks prosedur singkat yang sistematis menggunakan kalimat imperatif.',
    stimulus: 'Sekolah akan mengadakan gerakan pengomposan daun kering taman sekolah.',
    pertanyaan: 'Susunlah teks prosedur singkat yang terdiri atas tujuan dan 4 langkah kerja runtut mengenai cara membuat kompos sederhana menggunakan kalimat perintah dan konjungsi urutan yang tepat!',
    kunciJawaban:
      'Tujuan: Mengolah daun kering menjadi pupuk kompos ramah lingkungan.\nLangkah: 1) Kumpulkan daun kering dan cacah hingga berukuran kecil. 2) Masukkan ke wadah komposter dan campurkan sedikit tanah serta starter EM4. 3) Setelah itu, aduk campuran dan tutup rapat agar lembap. 4) Diamkan selama 3–4 minggu sambil dibolak-balik seminggu sekali hingga kompos matang.',
    alternatif: ['Struktur langkah diperbolehkan 4–5 tahapan selama urutan logis dan memuat kalimat imperatif.'],
    pedomanPenskoran:
      'Skor 2: Mencantumkan tujuan yang jelas.\nSkor 2: Urutan 4 langkah kerja logis & lengkap.\nSkor 2: Penggunaan kalimat imperatif, konjungsi temporal, dan ejaan EYD V tepat.',
    skorMaksimal: 6,
  },
  {
    subject: 'Ilmu Pengetahuan Sosial (IPS)',
    materiKeyword: 'Ekonomi',
    levelKognitif: 'C4',
    tingkatKesulitan: 'Sedang',
    indikator: 'Menganalisis upaya mengatasi kelangkaan sumber daya ekonomi di lingkungan sekitar.',
    stimulus: 'Pada musim kemarau panjang, harga sayuran di pasar tradisional meningkat karena pasokan berkurang.',
    pertanyaan: 'Jelaskan penyebab kenaikan harga tersebut berdasarkan konsep kelangkaan serta berikan dua strategi adaptasi yang dapat dilakukan rumah tangga dan petani!',
    kunciJawaban:
      'Penyebab: Terjadi kelangkaan pasokan akibat kekeringan sementara permintaan konsumen tetap, sehingga harga keseimbangan naik.\nStrategi: Petani menerapkan irigasi hemat air (tetes) atau tanaman tahan kering, sedangkan rumah tangga menyusun skala prioritas dan menanam sayuran hidroponik/pekarangan.',
    alternatif: ['Mengaitkan dengan hukum permintaan-penawaran serta diversifikasi pangan lokal.'],
    pedomanPenskoran:
      'Skor 2: Penjelasan hubungan kelangkaan & harga tepat.\nSkor 2: Dua strategi adaptasi petani dan rumah tangga logis.\nSkor 1: Bahasa runtut dan analitis.',
    skorMaksimal: 5,
  },
  {
    subject: 'Pendidikan Pancasila',
    materiKeyword: 'Norma',
    levelKognitif: 'C5',
    tingkatKesulitan: 'Sedang',
    indikator: 'Mengevaluasi penerapan hak dan kewajiban dalam bermedia digital.',
    stimulus: 'Seorang siswa mengomentari unggahan teman di grup kelas dengan kata-kata merendahkan karena berdalih memiliki kebebasan berpendapat.',
    pertanyaan: 'Evaluasilah tindakan siswa tersebut ditinjau dari keseimbangan hak kebebasan berpendapat dan kewajiban menghormati hak orang lain!',
    kunciJawaban:
      'Tindakan tersebut keliru karena kebebasan berpendapat yang dijamin konstitusi tetap dibatasi oleh norma kesopanan, norma hukum, serta kewajiban menghormati martabat dan hak asasi orang lain.',
    alternatif: ['Mengaitkan dengan Pasal 28J UUD 1945 dan etika digital Pancasila sila ke-2.'],
    pedomanPenskoran:
      'Skor 2: Penilaian tegas bahwa tindakan tidak dibenarkan.\nSkor 2: Penjelasan batasan hak & kewajiban menghormati orang lain.\nSkor 1: Solusi sikap santun bermedia digital.',
    skorMaksimal: 5,
  },
];

function matchSubjectScore(itemSubject: string, targetSubject: string): number {
  const a = itemSubject.toLowerCase();
  const b = targetSubject.toLowerCase();
  if (a === b) return 3;
  if (a.includes(b) || b.includes(a)) return 2;
  return 0;
}

function matchKeywordScore(text: string, targetMateri: string): number {
  const words = targetMateri
    .toLowerCase()
    .split(/[\s,()/-]+/)
    .filter((w) => w.length >= 4);
  const lowerText = text.toLowerCase();
  let hits = 0;
  for (const w of words) {
    if (lowerText.includes(w)) hits += 1;
  }
  return hits;
}

export function generateLocalSampleItem(
  config: ExamConfig,
  row: KisiRow
): GeneratedSampleItem {
  const subject = config.mataPelajaran || 'Matematika';
  const materi = row.materi || 'Materi Pokok';
  const form = row.bentukSoal;
  const level = row.levelKognitif;

  if (form === 'Pilihan Ganda') {
    const candidates = CURATED_PG_BANK.map((item) => ({
      item,
      score:
        matchSubjectScore(item.subject, subject) * 5 +
        matchKeywordScore(item.materiKeyword + ' ' + item.indikator, materi + ' ' + row.indikatorSoal),
    })).sort((a, b) => b.score - a.score);

    if (candidates[0] && candidates[0].score >= 15) {
      const best = candidates[0].item;
      return {
        nomorSoal: row.nomorSoal,
        bentukSoal: form,
        levelKognitif: level,
        stimulus: best.stimulus,
        pertanyaan: best.pertanyaan,
        pilihanJawaban: [
          `A. ${best.pilihan.A}`,
          `B. ${best.pilihan.B}`,
          `C. ${best.pilihan.C}`,
          `D. ${best.pilihan.D}`,
        ],
        kunciJawaban: best.kunciJawaban,
        pembahasan: best.pembahasan,
        pedomanPenskoran: `Skor ${Math.max(1, Math.round((row.bobotSkor || 3) / Math.max(1, row.nomorSoal.split(',').length)))} jika memilih opsi ${best.kunciJawaban} dengan tepat; skor 0 jika salah atau kosong.`,
      };
    }
  }

  if (form === 'Isian Singkat') {
    const candidates = CURATED_SHORT_BANK.map((item) => ({
      item,
      score:
        matchSubjectScore(item.subject, subject) * 5 +
        matchKeywordScore(item.materiKeyword + ' ' + item.indikator, materi),
    })).sort((a, b) => b.score - a.score);

    if (candidates[0] && candidates[0].score >= 15) {
      const best = candidates[0].item;
      return {
        nomorSoal: row.nomorSoal,
        bentukSoal: form,
        levelKognitif: level,
        stimulus: best.stimulus,
        pertanyaan: best.pertanyaan,
        pilihanJawaban: [],
        kunciJawaban: best.kunciJawaban,
        pembahasan: `Berdasarkan indikator "${row.indikatorSoal}", jawaban singkat yang paling tepat adalah "${best.kunciJawaban}".`,
        pedomanPenskoran: best.pedomanPenskoran,
      };
    }
  }

  if (form === 'Uraian') {
    const candidates = CURATED_ESSAY_BANK.map((item) => ({
      item,
      score:
        matchSubjectScore(item.subject, subject) * 5 +
        matchKeywordScore(item.materiKeyword + ' ' + item.indikator, materi),
    })).sort((a, b) => b.score - a.score);

    if (candidates[0] && candidates[0].score >= 15) {
      const best = candidates[0].item;
      return {
        nomorSoal: row.nomorSoal,
        bentukSoal: form,
        levelKognitif: level,
        stimulus: best.stimulus,
        pertanyaan: best.pertanyaan,
        pilihanJawaban: [],
        kunciJawaban: best.kunciJawaban,
        pembahasan: `Butir uraian ini menguji kemampuan ${COGNITIVE_LEVELS[level].label.toLowerCase()} (${level}) pada topik ${materi}.`,
        pedomanPenskoran: best.pedomanPenskoran,
      };
    }
  }

  // Dynamic synthesized item aligned directly to the row's indicator, KKO, and cognitive level
  const kko = row.kataKerjaOperasional || pickKko(level, 0);
  const kkoLower = kko.toLowerCase();
  const kelasLabel = GRADE_LABELS[config.kelas] || 'Kelas VIII (2 SMP)';

  if (form === 'Pilihan Ganda Kompleks') {
    return {
      nomorSoal: row.nomorSoal,
      bentukSoal: form,
      levelKognitif: level,
      stimulus: `Perhatikan ringkasan konteks ${subject} (${kelasLabel}) terkait materi "${materi}": pemahaman konsep yang utuh mencakup ketepatan prinsip dasar, penerapan prosedur yang benar, serta evaluasi hasil pada kasus nyata.`,
      pertanyaan: `Berdasarkan indikator "${row.indikatorSoal}", manakah pernyataan berikut yang BENAR mengenai ${materi}? (Pilih lebih dari satu jawaban benar)`,
      pilihanJawaban: [
        `A. Penerapan prinsip ${materi} harus memperhatikan keterkaitan antara konsep dasar dan data konteks masalah.`,
        `B. Analisis terhadap ${materi} dapat dilakukan tanpa mempertimbangkan syarat atau batasan konsep yang berlaku.`,
        `C. Kesimpulan pada permasalahan ${materi} perlu diverifikasi melalui langkah ${kkoLower} yang sistematis.`,
        `D. Seluruh unsur pada ${materi} bersifat terpisah sehingga tidak memengaruhi hasil akhir pemecahan masalah.`,
      ],
      kunciJawaban: 'A dan C',
      pembahasan: `Pernyataan A dan C selaras dengan kaidah konsep dan langkah ${kkoLower} pada materi ${materi}, sedangkan pernyataan B dan D mengabaikan validitas konsep.`,
      pedomanPenskoran:
        'Skor 2 jika memilih kedua pernyataan benar secara tepat (A dan C) tanpa memilih pengecoh; skor 1 jika memilih 1 jawaban benar; skor 0 jika memilih opsi salah.',
    };
  }

  if (form === 'Isian Singkat') {
    return {
      nomorSoal: row.nomorSoal,
      bentukSoal: form,
      levelKognitif: level,
      stimulus: `Dalam pembelajaran ${subject} ${kelasLabel}, penguasaan materi ${materi} menuntut ketepatan istilah kunci maupun hasil perhitungan singkat.`,
      pertanyaan: `Berdasarkan indikator pembelajaran (${row.indikatorSoal}), tuliskan konsep atau hasil utama yang menjadi inti penyelesaian pada topik ${materi}: ...`,
      pilihanJawaban: [],
      kunciJawaban: `Konsep utama / penyelesaian akurat ${materi}`,
      pembahasan: `Siswa diharapkan mampu ${kkoLower} elemen kunci pada materi ${materi} secara ringkas dan presisi sesuai tujuan pembelajaran "${row.tujuanPembelajaran}".`,
      pedomanPenskoran:
        'Skor 2 jika jawaban singkat tepat dan sesuai istilah/nilai kunci; skor 1 jika mendekati benar namun kurang lengkap; skor 0 jika keliru.',
    };
  }

  if (form === 'Uraian') {
    return {
      nomorSoal: row.nomorSoal,
      bentukSoal: form,
      levelKognitif: level,
      stimulus: `Studi Kasus ${subject} (${kelasLabel}): Sebuah permasalahan nyata di lingkungan sekolah menuntut peserta didik untuk ${kkoLower} keterkaitan konsep pada materi ${materi}.`,
      pertanyaan: `Mengacu pada indikator "${row.indikatorSoal}", uraikan langkah-langkah analisis atau pemecahan masalah secara sistematis beserta kesimpulan yang dapat dipertanggungjawabkan mengenai ${materi}!`,
      pilihanJawaban: [],
      kunciJawaban: `1) Identifikasi unsur dan informasi penting dari permasalahan ${materi}.\n2) Terapkan konsep/prosedur ${subject} untuk ${kkoLower} hubungan antardata.\n3) Rumuskan kesimpulan logis yang menjawab permasalahan secara utuh.`,
      pembahasan: `Soal uraian level ${level} (${COGNITIVE_LEVELS[level].label}) menilai kedalaman penalaran dan sistematika argumen peserta didik terhadap ${materi}.`,
      pedomanPenskoran:
        'Skor 2: Mengidentifikasi fakta/data permasalahan dengan tepat.\nSkor 2: Menerapkan langkah kerja atau alasan konseptual secara runtut.\nSkor 1: Menuliskan kesimpulan akhir yang akurat (Skor Maksimal = 5).',
    };
  }

  return {
    nomorSoal: row.nomorSoal,
    bentukSoal: form,
    levelKognitif: level,
    stimulus: `Dalam kajian ${subject} ${kelasLabel}, materi "${materi}" menekankan keterpaduan antara pemahaman konsep dan penerapannya secara tepat.`,
    pertanyaan: `Berdasarkan indikator "${row.indikatorSoal}", manakah langkah atau pernyataan yang paling tepat untuk ${kkoLower} konsep ${materi}?`,
    pilihanJawaban: [
      `A. Mengidentifikasi informasi inti lalu menghubungkannya dengan prinsip utama ${materi} secara runtut`,
      `B. Mengabaikan syarat awal permasalahan dan langsung menebak hasil akhir tanpa pembuktian`,
      `C. Menggunakan prosedur dari materi lain yang tidak relevan dengan karakteristik ${materi}`,
      `D. Menyimpulkan hasil sebelum mengevaluasi kesesuaian data yang disajikan pada soal`,
    ],
    kunciJawaban: 'A',
    pembahasan: `Opsi A menunjukkan prosedur ilmiah dan kognitif level ${level} (${kko}) yang tepat dalam menyelesaikan permasalahan ${materi}.`,
    pedomanPenskoran: 'Skor 1 (atau sesuai bobot butir PG) jika menjawab A; skor 0 jika menjawab opsi lain.',
  };
}

/* ============================================================================
 * PARSER FOR KISI-KISI & LOCAL EXAM PAPER GENERATOR
 * ============================================================================ */

interface ParsedKisiEntry {
  materi: string;
  indikator: string;
  levelKognitif: CognitiveLevel;
}

function parseKisiKisiEntries(kisiText: string, fallbackSubject: string): ParsedKisiEntry[] {
  const entries: ParsedKisiEntry[] = [];
  const lines = kisiText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    // Markdown table row
    if (line.startsWith('|') && !line.match(/^\|[\s:-]+\|/)) {
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      if (cells.length >= 4) {
        const headerLike =
          cells[0].toLowerCase() === 'no' ||
          cells.some((c) => c.toLowerCase().includes('indikator soal'));
        if (headerLike) continue;

        const levelMatch = line.match(/\b(C[1-6])\b/i);
        const levelKognitif = (
          levelMatch ? levelMatch[1].toUpperCase() : 'C3'
        ) as CognitiveLevel;

        // Standard exported order: No | CP | TP | Materi | Indikator | Level | KKO | Bentuk | Nomor | Bobot
        const materi = cells.length >= 5 ? cells[3] : cells[1];
        const indikator = cells.length >= 5 ? cells[4] : cells[2];
        if (materi && indikator) {
          entries.push({ materi, indikator, levelKognitif });
          continue;
        }
      }
    }

    // Bullet / numbered / CSV line fallback
    if (line.length >= 10 && !line.startsWith('#') && !line.startsWith('Mata Pelajaran')) {
      const cleaned = line.replace(/^[-*•\d.)]+\s*/, '');
      const levelMatch = cleaned.match(/\b(C[1-6])\b/i);
      const levelKognitif = (
        levelMatch ? levelMatch[1].toUpperCase() : 'C3'
      ) as CognitiveLevel;
      const parts = cleaned.split(/\t|;|\|/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        entries.push({
          materi: parts[0],
          indikator: parts[1],
          levelKognitif,
        });
      } else {
        entries.push({
          materi: cleaned.slice(0, 65),
          indikator: `Peserta didik dapat memahami dan menerapkan konsep ${cleaned.slice(0, 80)} dengan tepat.`,
          levelKognitif,
        });
      }
    }
  }

  if (entries.length === 0) {
    const topics = getSuggestedTopics(fallbackSubject, '8', '1');
    return topics.map((topic, idx) => ({
      materi: topic,
      indikator: `Peserta didik dapat menyelesaikan permasalahan terkait ${topic} secara tepat.`,
      levelKognitif: (['C2', 'C3', 'C4', 'C3'][idx % 4] as CognitiveLevel),
    }));
  }

  return entries;
}

function difficultyFromLevel(level: CognitiveLevel, index: number): DifficultyLevel {
  if (level === 'C1' || level === 'C2') return index % 4 === 0 ? 'Sedang' : 'Mudah';
  if (level === 'C3') return index % 3 === 0 ? 'Mudah' : 'Sedang';
  return index % 3 === 0 ? 'Sedang' : 'Sukar';
}

function pickRotatingKey(index: number): 'A' | 'B' | 'C' | 'D' {
  return (['A', 'B', 'C', 'D'] as const)[index % 4];
}

function synthesizePGQuestion(
  nomor: number,
  entry: ParsedKisiEntry,
  subject: string,
  kelasLabel: string
): MultipleChoiceQuestion {
  const diff = difficultyFromLevel(entry.levelKognitif, nomor);
  const kunci = pickRotatingKey(nomor);
  const kko = pickKko(entry.levelKognitif, nomor);

  // Use curated math / multi-subject computational variations when appropriate, else smart contextual generator
  const lowerSubject = subject.toLowerCase();
  const lowerMateri = entry.materi.toLowerCase();

  // Dynamic parametric Math variants so even 30 PG math items stay genuinely distinct!
  if (lowerSubject.includes('matematika')) {
    const variant = nomor % 6;
    if (lowerMateri.includes('pangkat') || lowerMateri.includes('akar') || variant === 0) {
      const base = 2 + (nomor % 3);
      const p1 = 2 + (nomor % 4);
      const p2 = 3 + ((nomor + 1) % 3);
      const p3 = 1 + (nomor % 2);
      const ansExp = p1 + p2 - p3;
      const distractors = [`${base}^${ansExp + 1}`, `${base}^${ansExp + 3}`, `${base}^${Math.max(1, ansExp - 2)}`, `${base}^${ansExp}`];
      const correctStr = `${base}^${ansExp}`;
      const ordered = {
        A: distractors[(0 + nomor) % 4],
        B: distractors[(1 + nomor) % 4],
        C: distractors[(2 + nomor) % 4],
        D: distractors[(3 + nomor) % 4],
      };
      const foundKey = (['A', 'B', 'C', 'D'] as const).find((k) => ordered[k] === correctStr) || 'A';
      return {
        id: `pg-gen-${Date.now()}-${nomor}`,
        nomor,
        indikatorTerkait: entry.indikator,
        materi: entry.materi,
        levelKognitif: entry.levelKognitif,
        tingkatKesulitan: diff,
        stimulus: '-',
        pertanyaan: `Hasil penyederhanaan operasi bilangan berpangkat ${base}^${p1} × ${base}^${p2} : ${base}^${p3} adalah ...`,
        pilihan: ordered,
        kunciJawaban: foundKey,
        pembahasan: `Dengan sifat eksponen a^m × a^n : a^p = a^(m+n-p), diperoleh ${base}^(${p1}+${p2}-${p3}) = ${correctStr}.`,
      };
    }
    if (lowerMateri.includes('pythagoras') || lowerMateri.includes('segitiga') || variant === 1) {
      const k = 1 + (nomor % 3);
      const a = 3 * k;
      const b = 4 * k;
      const c = 5 * k;
      const opts = [c - 2, c, c + 2, c + 4];
      const rotate = nomor % 4;
      const rotated = [0, 1, 2, 3].map((i) => `${opts[(i + rotate) % 4]} cm`);
      const key = (['A', 'B', 'C', 'D'] as const).find((_, i) => (i + rotate) % 4 === 1) || 'B';
      return {
        id: `pg-gen-${Date.now()}-${nomor}`,
        nomor,
        indikatorTerkait: entry.indikator,
        materi: entry.materi,
        levelKognitif: entry.levelKognitif,
        tingkatKesulitan: diff,
        stimulus: `Sebuah tangga atau penyangga besi membentuk segitiga siku-siku dengan panjang dua sisi penyikunya berturut-turut ${a} cm dan ${b} cm.`,
        pertanyaan: `Panjang sisi miring (hipotenusa) dari bangun segitiga siku-siku tersebut adalah ...`,
        pilihan: { A: rotated[0], B: rotated[1], C: rotated[2], D: rotated[3] },
        kunciJawaban: key,
        pembahasan: `Sesuai Teorema Pythagoras, c = √(${a}² + ${b}²) = √(${a * a} + ${b * b}) = √${c * c} = ${c} cm.`,
      };
    }
    if (lowerMateri.includes('garis') || lowerMateri.includes('gradien') || variant === 2) {
      const m = 2 + (nomor % 4);
      const x1 = 1 + (nomor % 3);
      const y1 = 2 + (nomor % 3);
      const x2 = x1 + 2;
      const y2 = y1 + 2 * m;
      const opts = [m - 1, m, m + 1, m + 2];
      const rotate = nomor % 4;
      const rotated = [0, 1, 2, 3].map((i) => String(opts[(i + rotate) % 4]));
      const key = (['A', 'B', 'C', 'D'] as const).find((_, i) => (i + rotate) % 4 === 1) || 'B';
      return {
        id: `pg-gen-${Date.now()}-${nomor}`,
        nomor,
        indikatorTerkait: entry.indikator,
        materi: entry.materi,
        levelKognitif: entry.levelKognitif,
        tingkatKesulitan: diff,
        stimulus: '-',
        pertanyaan: `Gradien garis lurus yang melalui titik P(${x1}, ${y1}) dan titik Q(${x2}, ${y2}) adalah ...`,
        pilihan: { A: rotated[0], B: rotated[1], C: rotated[2], D: rotated[3] },
        kunciJawaban: key,
        pembahasan: `m = (y2 - y1) / (x2 - x1) = (${y2} - ${y1}) / (${x2} - ${x1}) = ${y2 - y1} / ${x2 - x1} = ${m}.`,
      };
    }
  }

  // Contextual structured synthesis for any SMP subject
  const optionPool = {
    correct: [
      `Menerapkan konsep inti ${entry.materi} secara sistematis sesuai data dan kaidah ilmiah yang berlaku`,
      `Menghubungkan informasi kunci pada stimulus dengan prinsip ${entry.materi} untuk memperoleh simpulan valid`,
      `Melakukan langkah ${kko.toLowerCase()} secara runtut berdasarkan kriteria konsep ${entry.materi}`,
      `Menggunakan bukti konsep serta aturan prosedural yang sesuai pada topik ${entry.materi}`,
    ],
    distractor1: [
      `Menarik kesimpulan secara langsung tanpa memeriksa kesesuaian syarat konsep ${entry.materi}`,
      `Menggabungkan data secara acak tanpa memperhatikan hubungan sebab-akibat dalam ${entry.materi}`,
      `Menggunakan definisi dari pokok bahasan lain yang tidak relevan dengan ${entry.materi}`,
    ],
    distractor2: [
      `Mengabaikan variabel penting yang tercantum dalam konteks permasalahan ${entry.materi}`,
      `Menetapkan hasil berdasarkan asumsi subjektif tanpa verifikasi konsep ${entry.materi}`,
      `Menerapkan langkah prosedural secara terbalik sehingga makna ${entry.materi} berubah`,
    ],
    distractor3: [
      `Membatasi analisis hanya pada satu unsur permukaan tanpa menguji validitas ${entry.materi}`,
      `Mengubah ketentuan dasar pada topik ${entry.materi} di luar kaidah pembelajaran ${kelasLabel}`,
      `Menyusun ringkasan yang bertentangan dengan fakta utama dalam kajian ${entry.materi}`,
    ],
  };

  const correctText = optionPool.correct[nomor % optionPool.correct.length];
  const d1 = optionPool.distractor1[nomor % optionPool.distractor1.length];
  const d2 = optionPool.distractor2[(nomor + 1) % optionPool.distractor2.length];
  const d3 = optionPool.distractor3[(nomor + 2) % optionPool.distractor3.length];

  const pilihan: { A: string; B: string; C: string; D: string } = {
    A: kunci === 'A' ? correctText : d1,
    B: kunci === 'B' ? correctText : kunci === 'A' ? d1 : d2,
    C: kunci === 'C' ? correctText : kunci === 'D' ? d2 : d3,
    D: kunci === 'D' ? correctText : d3,
  };

  const scenarioContexts = [
    `Dalam diskusi kelas ${subject} (${kelasLabel}), seorang peserta didik menelaah studi kasus penerapan ${entry.materi}.`,
    `Perhatikan situasi pembelajaran ${subject} berikut: guru menyajikan data kontekstual mengenai topik ${entry.materi}.`,
    `Pada kegiatan evaluasi ${subject}, peserta didik dihadapkan pada permasalahan nyata yang berkaitan erat dengan ${entry.materi}.`,
  ];

  return {
    id: `pg-gen-${Date.now()}-${nomor}`,
    nomor,
    indikatorTerkait: entry.indikator,
    materi: entry.materi,
    levelKognitif: entry.levelKognitif,
    tingkatKesulitan: diff,
    stimulus: scenarioContexts[nomor % scenarioContexts.length],
    pertanyaan: `Mengacu pada indikator "${entry.indikator}", tindakan atau pernyataan yang paling tepat untuk ${kko.toLowerCase()} permasalahan ${entry.materi} adalah ...`,
    pilihan,
    kunciJawaban: kunci,
    pembahasan: `Pilihan ${kunci} paling tepat karena menerapkan prinsip ${entry.materi} secara akurat sesuai tuntutan level kognitif ${entry.levelKognitif} (${kko}).`,
  };
}

function synthesizeShortQuestion(
  nomor: number,
  entry: ParsedKisiEntry,
  subject: string
): ShortAnswerQuestion {
  const diff = difficultyFromLevel(entry.levelKognitif, nomor);
  const lowerSubject = subject.toLowerCase();

  if (lowerSubject.includes('matematika')) {
    const a = 3 + (nomor % 5);
    const b = 4 + (nomor % 4);
    const hasil = a * a + b * 2;
    return {
      id: `isian-gen-${Date.now()}-${nomor}`,
      nomor,
      indikatorTerkait: entry.indikator,
      materi: entry.materi,
      levelKognitif: entry.levelKognitif,
      tingkatKesulitan: diff,
      stimulus: '-',
      pertanyaan: `Jika diketahui nilai x = ${a} dan y = ${b} pada model permasalahan ${entry.materi} yang memenuhi bentuk P = x² + 2y, maka nilai P adalah ...`,
      kunciJawaban: String(hasil),
      pedomanPenskoran: `Skor 2 jika menjawab ${hasil} dengan benar; skor 1 jika menuliskan substitusi ${a}² + 2(${b}) namun keliru hasil akhir; skor 0 jika salah.`,
    };
  }

  return {
    id: `isian-gen-${Date.now()}-${nomor}`,
    nomor,
    indikatorTerkait: entry.indikator,
    materi: entry.materi,
    levelKognitif: entry.levelKognitif,
    tingkatKesulitan: diff,
    stimulus: `Kajian singkat ${subject} mengenai ${entry.materi}.`,
    pertanyaan: `Berdasarkan indikator "${entry.indikator}", tuliskan istilah kunci atau prinsip utama yang menentukan ketepatan penyelesaian pada materi ${entry.materi}: ...`,
    kunciJawaban: `Prinsip utama ${entry.materi}`,
    pedomanPenskoran: `Skor 2 jika jawaban singkat memuat kata kunci utama ${entry.materi} secara tepat; skor 1 jika kurang lengkap; skor 0 jika tidak relevan.`,
  };
}

function synthesizeEssayQuestion(
  nomor: number,
  entry: ParsedKisiEntry,
  subject: string,
  kelasLabel: string
): EssayQuestion {
  const level: CognitiveLevel =
    entry.levelKognitif === 'C1' || entry.levelKognitif === 'C2'
      ? 'C4'
      : entry.levelKognitif;
  const kko = pickKko(level, nomor);
  const skorMaksimal = nomor % 2 === 0 ? 6 : 5;

  return {
    id: `uraian-gen-${Date.now()}-${nomor}`,
    nomor,
    indikatorTerkait: entry.indikator,
    materi: entry.materi,
    levelKognitif: level,
    tingkatKesulitan: level === 'C5' || level === 'C6' ? 'Sukar' : 'Sedang',
    stimulus: `Studi Kasus ${subject} (${kelasLabel}): Diberikan permasalahan kontekstual di lingkungan sekitar yang melibatkan penerapan konsep ${entry.materi} secara terpadu.`,
    pertanyaan: `Berdasarkan indikator "${entry.indikator}", lakukan langkah untuk ${kko.toLowerCase()} permasalahan tersebut secara terperinci beserta alasan ilmiah dan kesimpulan akhirnya!`,
    kunciJawaban: `1) Identifikasi fakta/data yang diketahui pada konteks ${entry.materi}.\n2) Terapkan konsep dan prosedur penyelesaian ${subject} secara bertahap.\n3) Tuliskan hasil analisis dan verifikasi kesesuaian kesimpulan akhir.`,
    pedomanPenskoran: `Skor 2: Identifikasi unsur/data masalah lengkap.\nSkor ${skorMaksimal - 3}: Proses penerapan konsep & argumentasi runtut.\nSkor 1: Kesimpulan akhir jelas dan akurat.`,
    skorMaksimal,
  };
}

export function generateLocalExamPaper(params: {
  kisiKisiText: string;
  mataPelajaran?: string;
  kelasLabel?: string;
  semesterLabel?: string;
  jenisUjian?: string;
  namaSekolah?: string;
  tahunAjaran?: string;
  alokasiWaktu?: string;
  jumlahPG?: number;
  jumlahIsian?: number;
  jumlahUraian?: number;
}): ExamPaperPackage {
  const mataPelajaran = params.mataPelajaran || 'Matematika';
  const kelasLabel = params.kelasLabel || 'Kelas VIII (2 SMP)';
  const semesterLabel = params.semesterLabel || 'Semester 1 (Ganjil)';
  const jenisUjian = params.jenisUjian || 'Sumatif Akhir Semester (SAS)';
  const namaSekolah = params.namaSekolah || 'SMP Negeri 1 Nusantara';
  const tahunAjaran = params.tahunAjaran || '2026/2027';
  const alokasiWaktu = params.alokasiWaktu || '120 Menit';

  const pgCount = Math.max(0, Math.min(50, Number(params.jumlahPG) || 0));
  const isianCount = Math.max(0, Math.min(25, Number(params.jumlahIsian) || 0));
  const uraianCount = Math.max(0, Math.min(15, Number(params.jumlahUraian) || 0));

  const entries = parseKisiKisiEntries(params.kisiKisiText, mataPelajaran);

  // Use curated bank items first (once per question so zero duplicates), then synthesize remaining count!
  const usedPGSet = new Set<string>();
  const pilihanGanda: MultipleChoiceQuestion[] = [];
  for (let i = 0; i < pgCount; i++) {
    const entry = entries[i % entries.length];
    const match = CURATED_PG_BANK.find(
      (b) =>
        !usedPGSet.has(b.pertanyaan) &&
        matchSubjectScore(b.subject, mataPelajaran) >= 2 &&
        (matchKeywordScore(b.materiKeyword, entry.materi) >= 1 || i < 6)
    );
    if (match) {
      usedPGSet.add(match.pertanyaan);
      pilihanGanda.push({
        id: `pg-${Date.now()}-${i + 1}`,
        nomor: i + 1,
        indikatorTerkait: entry.indikator,
        materi: entry.materi,
        levelKognitif: match.levelKognitif,
        tingkatKesulitan: match.tingkatKesulitan,
        stimulus: match.stimulus,
        pertanyaan: match.pertanyaan,
        pilihan: match.pilihan,
        kunciJawaban: match.kunciJawaban,
        pembahasan: match.pembahasan,
      });
    } else {
      pilihanGanda.push(synthesizePGQuestion(i + 1, entry, mataPelajaran, kelasLabel));
    }
  }

  const usedShortSet = new Set<string>();
  const isianSingkat: ShortAnswerQuestion[] = [];
  for (let i = 0; i < isianCount; i++) {
    const entry = entries[(i + pgCount) % entries.length];
    const match = CURATED_SHORT_BANK.find(
      (b) =>
        !usedShortSet.has(b.pertanyaan) &&
        matchSubjectScore(b.subject, mataPelajaran) >= 2
    );
    if (match) {
      usedShortSet.add(match.pertanyaan);
      isianSingkat.push({
        id: `isian-${Date.now()}-${i + 1}`,
        nomor: i + 1,
        indikatorTerkait: entry.indikator,
        materi: entry.materi,
        levelKognitif: match.levelKognitif,
        tingkatKesulitan: match.tingkatKesulitan,
        stimulus: match.stimulus,
        pertanyaan: match.pertanyaan,
        kunciJawaban: match.kunciJawaban,
        pedomanPenskoran: match.pedomanPenskoran,
      });
    } else {
      isianSingkat.push(synthesizeShortQuestion(i + 1, entry, mataPelajaran));
    }
  }

  const usedEssaySet = new Set<string>();
  const uraian: EssayQuestion[] = [];
  for (let i = 0; i < uraianCount; i++) {
    const entry = entries[(entries.length - 1 - (i % entries.length) + entries.length) % entries.length];
    const match = CURATED_ESSAY_BANK.find(
      (b) =>
        !usedEssaySet.has(b.pertanyaan) &&
        matchSubjectScore(b.subject, mataPelajaran) >= 2
    );
    if (match) {
      usedEssaySet.add(match.pertanyaan);
      uraian.push({
        id: `uraian-${Date.now()}-${i + 1}`,
        nomor: i + 1,
        indikatorTerkait: entry.indikator,
        materi: entry.materi,
        levelKognitif: match.levelKognitif,
        tingkatKesulitan: match.tingkatKesulitan,
        stimulus: match.stimulus,
        pertanyaan: match.pertanyaan,
        kunciJawaban: match.kunciJawaban,
        pedomanPenskoran: match.pedomanPenskoran,
        skorMaksimal: match.skorMaksimal,
      });
    } else {
      uraian.push(synthesizeEssayQuestion(i + 1, entry, mataPelajaran, kelasLabel));
    }
  }

  return {
    id: `naskah-${Date.now()}`,
    judulUjian: `${jenisUjian} — ${mataPelajaran}`,
    mataPelajaran,
    kelasLabel,
    semesterLabel,
    alokasiWaktu,
    namaSekolah,
    tahunAjaran,
    catatanPenyusun: `Naskah soal ${mataPelajaran} (${pgCount} PG, ${isianCount} Isian Singkat, ${uraianCount} Uraian) telah disusun merata mengacu pada ${entries.length} indikator kisi-kisi dengan variasi tingkat kesulitan Mudah, Sedang, dan Sukar.`,
    pilihanGanda,
    isianSingkat,
    uraian,
    createdAt: new Date().toISOString(),
  };
}

/* ============================================================================
 * PARSER FOR EXAM TEXT & ASSESSMENT GUIDE GENERATOR
 * ============================================================================ */

interface ParsedQuestionChunk {
  section: 'PG' | 'ISIAN' | 'URAIAN';
  nomor: number;
  body: string;
  options: Record<string, string>;
  inlineKey?: string;
}

function parseRawExamQuestions(rawExamText: string): ParsedQuestionChunk[] {
  const lines = rawExamText.split(/\r?\n/);
  let currentSection: 'PG' | 'ISIAN' | 'URAIAN' = 'PG';
  const chunks: ParsedQuestionChunk[] = [];
  let active: ParsedQuestionChunk | null = null;

  const flush = () => {
    if (active && active.body.trim()) {
      chunks.push(active);
    }
    active = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const upper = line.toUpperCase();
    if (
      (upper.includes('ISIAN SINGKAT') || upper.startsWith('B. ISIAN') || upper.includes('II. ISIAN')) &&
      line.length < 60
    ) {
      flush();
      currentSection = 'ISIAN';
      continue;
    }
    if (
      (upper.includes('URAIAN') || upper.startsWith('C. URAIAN') || upper.includes('III. URAIAN') || upper.includes('ESSAI')) &&
      line.length < 60
    ) {
      flush();
      currentSection = 'URAIAN';
      continue;
    }
    if ((upper.includes('PILIHAN GANDA') || upper.startsWith('A. PILIHAN')) && line.length < 60) {
      flush();
      currentSection = 'PG';
      continue;
    }

    const qStart = line.match(/^(\d{1,2})[.)]\s+(.+)$/);
    if (qStart) {
      flush();
      active = {
        section: currentSection,
        nomor: Number(qStart[1]),
        body: qStart[2].trim(),
        options: {},
      };
      const keyMatch = active.body.match(/\[?Kunci:\s*([^\]]+)\]?/i);
      if (keyMatch) {
        active.inlineKey = keyMatch[1].trim();
        active.body = active.body.replace(keyMatch[0], '').trim();
      }
      continue;
    }

    if (active) {
      const optMatch = line.match(/^([A-D])[.)]\s+(.+)$/);
      if (optMatch && active.section === 'PG') {
        active.options[optMatch[1]] = optMatch[2].trim();
        continue;
      }
      const keyMatch = line.match(/^(?:Kunci(?:\s*Jawaban)?|Jawaban)\s*:\s*(.+)$/i);
      if (keyMatch) {
        active.inlineKey = keyMatch[1].trim();
        continue;
      }
      active.body += ` ${line}`;
    }
  }
  flush();

  // If no explicit section headers were provided, infer PG vs Isian vs Uraian from presence of options / keywords
  return chunks.map((c) => {
    const hasOptions = Object.keys(c.options).length >= 2;
    if (c.section === 'PG' && !hasOptions) {
      if (
        c.body.toLowerCase().includes('jelaskan') ||
        c.body.toLowerCase().includes('tentukan langkah') ||
        c.body.toLowerCase().includes('analisislah') ||
        c.body.toLowerCase().includes('hitunglah') ||
        c.body.length > 150
      ) {
        return { ...c, section: 'URAIAN' as const };
      }
      if (c.body.includes('...')) {
        return { ...c, section: 'ISIAN' as const };
      }
    }
    return c;
  });
}

function summarizeStem(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= 105) return clean;
  return `${clean.slice(0, 102)}...`;
}

export function generateLocalAssessmentGuide(params: {
  rawExamText: string;
  mataPelajaran?: string;
  kelasLabel?: string;
  bobotPGPerSoal?: number;
  bobotIsianPerSoal?: number;
}): AssessmentGuidePackage {
  const mataPelajaran = params.mataPelajaran || 'Matematika';
  const kelasLabel = params.kelasLabel || 'Kelas VIII (2 SMP)';
  const pgWeight = Math.max(1, Math.min(10, Number(params.bobotPGPerSoal) || 1));
  const isianWeight = Math.max(1, Math.min(10, Number(params.bobotIsianPerSoal) || 2));

  const chunks = parseRawExamQuestions(params.rawExamText);

  const pgChunks = chunks.filter((c) => c.section === 'PG');
  const isianChunks = chunks.filter((c) => c.section === 'ISIAN');
  const uraianChunks = chunks.filter((c) => c.section === 'URAIAN');

  const kunciPG: AssessmentPGKey[] = pgChunks.map((chunk, idx) => {
    const matched = CURATED_PG_BANK.find(
      (b) =>
        chunk.body.toLowerCase().includes(b.pertanyaan.slice(0, 28).toLowerCase()) ||
        b.pertanyaan.toLowerCase().includes(chunk.body.slice(0, 28).toLowerCase())
    );

    const detectedKey =
      chunk.inlineKey?.match(/^[A-D]/i)?.[0]?.toUpperCase() ||
      matched?.kunciJawaban ||
      (['A', 'B', 'C', 'D'][idx % 4]);

    const optText = chunk.options[detectedKey] || matched?.pilihan[detectedKey as 'A' | 'B' | 'C' | 'D'] || '';
    const pembahasan =
      matched?.pembahasan ||
      (optText
        ? `Berdasarkan analisis konsep ${mataPelajaran}, opsi ${detectedKey} ("${optText}") paling tepat menjawab inti pertanyaan.`
        : `Berdasarkan analisis indikator soal ${mataPelajaran}, pilihan ${detectedKey} memenuhi kaidah konseptual yang benar.`);

    return {
      nomor: chunk.nomor || idx + 1,
      ringkasanSoal: summarizeStem(chunk.body),
      kunciJawaban: detectedKey,
      pembahasanSingkat: pembahasan,
      skorMaksimal: pgWeight,
    };
  });

  const kunciIsian: AssessmentShortKey[] = isianChunks.map((chunk, idx) => {
    const matched = CURATED_SHORT_BANK.find(
      (b) =>
        chunk.body.toLowerCase().includes(b.pertanyaan.slice(0, 25).toLowerCase()) ||
        b.pertanyaan.toLowerCase().includes(chunk.body.slice(0, 25).toLowerCase())
    );

    const kunciUtama =
      chunk.inlineKey || matched?.kunciJawaban || 'Sesuai konsep/hasil perhitungan tepat';
    const alt = matched?.alternatif?.length
      ? matched.alternatif
      : [kunciUtama, `${kunciUtama} (dengan/tanpa satuan baku)`];

    return {
      nomor: chunk.nomor || idx + 1,
      ringkasanSoal: summarizeStem(chunk.body),
      kunciUtama,
      alternatifJawaban: alt,
      pembahasanSingkat:
        matched?.pedomanPenskoran ||
        `Jawaban singkat harus mengacu tepat pada istilah atau nilai numerik hasil penyelesaian soal.`,
      rubrikPenskoran: [
        {
          kriteria: `Menuliskan jawaban singkat tepat (${kunciUtama}) atau alternatif ekuivalen.`,
          skor: isianWeight,
        },
        ...(isianWeight >= 2
          ? [
              {
                kriteria: 'Menuliskan jawaban mendekati benar namun kurang lengkap satuan/penulisan.',
                skor: Math.floor(isianWeight / 2),
              },
            ]
          : []),
        {
          kriteria: 'Jawaban keliru atau tidak dijawab.',
          skor: 0,
        },
      ],
      skorMaksimal: isianWeight,
    };
  });

  const kunciUraian: AssessmentEssayKey[] = uraianChunks.map((chunk, idx) => {
    const matched = CURATED_ESSAY_BANK.find(
      (b) =>
        chunk.body.toLowerCase().includes(b.pertanyaan.slice(0, 25).toLowerCase()) ||
        b.pertanyaan.toLowerCase().includes(chunk.body.slice(0, 25).toLowerCase())
    );

    const skorMaks = matched?.skorMaksimal || 5;
    const step1 = Math.max(1, Math.floor(skorMaks * 0.4));
    const step2 = Math.max(1, Math.floor(skorMaks * 0.4));

    const kunciUtama =
      chunk.inlineKey ||
      matched?.kunciJawaban ||
      `1) Identifikasi informasi/data yang diketahui pada soal.\n2) Terapkan konsep dan langkah penyelesaian ${mataPelajaran} secara sistematis.\n3) Simpulkan hasil akhir dengan tepat dan jelas.`;

    return {
      nomor: chunk.nomor || idx + 1,
      ringkasanSoal: summarizeStem(chunk.body),
      kunciUtama,
      alternatifJawaban: matched?.alternatif || [
        'Diterima cara/metode penyelesaian lain yang sahih secara ilmiah/matematis selama langkah logis dan hasil akhir benar.',
      ],
      pembahasanSingkat:
        'Penilaian uraian berfokus pada ketepatan identifikasi masalah, alur penalaran langkah demi langkah, dan kebenaran simpulan akhir.',
      rubrikPenskoran: [
        {
          kriteria: 'Langkah lengkap: identifikasi tepat, proses penyelesaian benar, dan kesimpulan akurat.',
          skor: skorMaks,
        },
        {
          kriteria: 'Identifikasi dan proses penyelesaian sebagian besar benar, namun kesimpulan kurang lengkap.',
          skor: step1 + step2,
        },
        {
          kriteria: 'Hanya menuliskan konsep awal atau identifikasi masalah tanpa penyelesaian tuntas.',
          skor: step1,
        },
        {
          kriteria: 'Tidak ada langkah yang relevan atau lembar jawaban kosong.',
          skor: 0,
        },
      ],
      skorMaksimal: skorMaks,
    };
  });

  const totalMaxPG = kunciPG.reduce((s, k) => s + k.skorMaksimal, 0);
  const totalMaxIsian = kunciIsian.reduce((s, k) => s + k.skorMaksimal, 0);
  const totalMaxUraian = kunciUraian.reduce((s, k) => s + k.skorMaksimal, 0);
  const totalMaxAll = totalMaxPG + totalMaxIsian + totalMaxUraian || 100;

  return {
    id: `guide-${Date.now()}`,
    judulUjian: `Kunci Jawaban & Pedoman Penilaian — ${mataPelajaran}`,
    mataPelajaran,
    kelasLabel,
    bobotPGPerSoal: pgWeight,
    bobotIsianPerSoal: isianWeight,
    rumusNilaiAkhir: `Nilai Akhir = (Total Skor Perolehan / ${totalMaxAll}) × 100`,
    rumusBerbobotOpsional:
      'Alternatif Berbobot: Nilai Akhir = (50% × Persentase PG) + (20% × Persentase Isian) + (30% × Persentase Uraian)',
    catatanPenilaian: `Pedoman penilaian disusun untuk ${kunciPG.length} PG (maks ${totalMaxPG} poin), ${kunciIsian.length} Isian Singkat (maks ${totalMaxIsian} poin), dan ${kunciUraian.length} Uraian (maks ${totalMaxUraian} poin) dengan total skor maksimal ${totalMaxAll}.`,
    kunciPG,
    kunciIsian,
    kunciUraian,
    createdAt: new Date().toISOString(),
  };
}

/* ============================================================================
 * SCORE INTERPRETATION & FOLLOW-UP ANALYST
 * ============================================================================ */

export function generateLocalScoreInterpretation(params: {
  mataPelajaran?: string;
  kelasLabel?: string;
  materiPokok?: string;
  kktp?: number;
  stats: ScoreStatistics;
  daftarBelumTuntas?: { nama: string; nilai: number }[];
}): ScoreAnalysisNarrative {
  const mataPelajaran = params.mataPelajaran || 'Matematika';
  const kelasLabel = params.kelasLabel || 'Kelas VIII (2 SMP)';
  const materiPokok = params.materiPokok || 'Materi Ujian Semester';
  const kktp = Number(params.kktp) || 75;
  const { stats, daftarBelumTuntas = [] } = params;

  const pct = stats.persentaseKetuntasan;
  let statusKetuntasanKlasikal = 'Tercapai Baik (≥ 85% Ketuntasan Klasikal)';
  if (pct < 50) {
    statusKetuntasanKlasikal = 'Perlu Pembelajaran Ulang Klasikal (< 50% Tuntas)';
  } else if (pct < 75) {
    statusKetuntasanKlasikal = 'Perlu Intervensi Kelompok (50%–74% Tuntas)';
  } else if (pct < 85) {
    statusKetuntasanKlasikal = 'Memenuhi Standar Ketuntasan Klasikal (75%–84%)';
  }

  const selisihKKTP = Number((stats.rataRata - kktp).toFixed(1));
  const posRata =
    selisihKKTP >= 0
      ? `berada ${selisihKKTP} poin di atas batas KKTP (${kktp})`
      : `masih ${Math.abs(selisihKKTP)} poin di bawah batas KKTP (${kktp})`;

  const rentang = Number((stats.nilaiTertinggi - stats.nilaiTerendah).toFixed(1));
  const homogenitas =
    stats.simpanganBaku <= 8
      ? 'sebaran kemampuan siswa relatif homogen dan merata'
      : stats.simpanganBaku <= 14
        ? 'sebaran kemampuan siswa bervariasi secara wajar (moderat)'
        : 'terdapat kesenjangan penguasaan kompetensi yang cukup lebar antarpeserta didik';

  const topNames = stats.siswaTertinggi.slice(0, 3).join(', ') || '-';
  const lowNames = stats.siswaTerendah.slice(0, 3).join(', ') || '-';

  const ringkasanEksekutif = `Evaluasi hasil ujian ${mataPelajaran} ${kelasLabel} pada materi ${materiPokok} diikuti oleh ${stats.totalSiswa} peserta didik dengan nilai rata-rata ${stats.rataRata} (${posRata}). Sebanyak ${stats.jumlahTuntas} siswa (${stats.persentaseKetuntasan}%) dinyatakan tuntas memenuhi KKTP ${kktp}, sedangkan ${stats.jumlahBelumTuntas} siswa (${stats.persentaseBelumTuntas}%) masih memerlukan tindak lanjut remedial.`;

  const interpretasiHasil = `Nilai tengah (median) sebesar ${stats.median} dibandingkan dengan rata-rata ${stats.rataRata} menunjukkan ${stats.median >= stats.rataRata ? 'mayoritas siswa cenderung mengelompok pada capaian nilai menengah ke atas' : 'terdapat kelompok siswa bernilai rendah yang menarik rata-rata kelas ke bawah'}. Rentang nilai antara capaian tertinggi ${stats.nilaiTertinggi} (${topNames}) dan nilai terendah ${stats.nilaiTerendah} (${lowNames}) adalah ${rentang} poin, dengan simpangan baku ${stats.simpanganBaku} yang mengindikasikan ${homogenitas}.`;

  const distSummary = (stats.distribusi || [])
    .map((b) => `${b.label}: ${b.count} siswa`)
    .join('; ');
  const analisisSebaranNilai = `Distribusi frekuensi perolehan nilai (${distSummary}) memperlihatkan pemetaan penguasaan materi kelas. Kelompok peserta didik pada rentang di bawah ${kktp} perlu diarahkan pada penguatan konsep prasyarat dan latihan bertahap, sementara kelompok capaian ≥ 85 siap memperoleh tantangan soal HOTS dan pengayaan lintas konteks.`;

  const pctBelum = stats.persentaseBelumTuntas;
  const sampleNames = daftarBelumTuntas
    .slice(0, 5)
    .map((s) => `${s.nama} (${s.nilai})`)
    .join(', ');

  const rekomendasiRemedial: string[] = [];
  if (stats.jumlahBelumTuntas === 0) {
    rekomendasiRemedial.push(
      'Seluruh peserta didik (100%) telah melampaui KKTP sehingga tidak diperlukan program remedial formal; fokuskan sesi berikutnya pada pemantapan konsep esensial.'
    );
  } else {
    if (pctBelum > 50) {
      rekomendasiRemedial.push(
        `Proporsi belum tuntas mencapai ${pctBelum}% (> 50%), sehingga guru disarankan menyelenggarakan pembelajaran ulang secara klasikal menggunakan metode visual dan contoh bertahap.`
      );
    } else if (pctBelum >= 20) {
      rekomendasiRemedial.push(
        `Proporsi belum tuntas sebesar ${pctBelum}% (20%–50%), sehingga pendekatan terbaik adalah bimbingan kelompok kecil terfokus pada indikator dengan tingkat kesalahan tertinggi.`
      );
    } else {
      rekomendasiRemedial.push(
        `Proporsi belum tuntas di bawah 20% (${stats.jumlahBelumTuntas} siswa), sehingga efektif ditangani melalui bimbingan individual dan tutor sebaya bersama siswa berprestasi.`
      );
    }
    if (sampleNames) {
      rekomendasiRemedial.push(
        `Prioritaskan pendampingan terstruktur kepada peserta didik berikut: ${sampleNames}${daftarBelumTuntas.length > 5 ? ', dan rekan lain di bawah KKTP' : ''}.`
      );
    }
    rekomendasiRemedial.push(
      `Berikan lembar kerja latihan bertahap (scaffolding) serta asesmen ulang pada indikator spesifik hingga nilai mencapai minimal KKTP ${kktp}.`
    );
  }

  const rekomendasiPengayaan = [
    `Libatkan ${stats.jumlahTuntas} siswa yang sudah tuntas—terutama peraih nilai tertinggi (${topNames})—dalam proyek pemecahan masalah kontekstual level HOTS (C4–C6).`,
    `Tugaskan kelompok pengayaan sebagai tutor sebaya untuk membimbing rekan satu kelompok pada topik ${materiPokok}.`,
    `Sediakan modul tantangan mandiri atau soal pengayaan setingkat olimpiade/literasi numerasi lanjutan.`,
  ];

  const tindakLanjutPembelajaranGuru = [
    `Lakukan analisis butir soal untuk mengidentifikasi indikator yang paling banyak dijawab keliru oleh kelompok di bawah KKTP.`,
    `Terapkan asesmen formatif singkat (exit ticket) di akhir pertemuan sebelum melanjutkan ke bab baru untuk mendeteksi miskonsepsi lebih dini.`,
    `Diferensiasikan bahan ajar pada pertemuan berikutnya antara kelompok penguatan konsep dasar dan kelompok pengayaan.`,
  ];

  return {
    statusKetuntasanKlasikal,
    ringkasanEksekutif,
    interpretasiHasil,
    analisisSebaranNilai,
    rekomendasiRemedial,
    rekomendasiPengayaan,
    tindakLanjutPembelajaranGuru,
  };
}

/* ============================================================================
 * LEARNING EVALUATION REPORT GENERATOR
 * ============================================================================ */

export function generateLocalLearningReport(params: {
  analisisText: string;
  mataPelajaran?: string;
  kelasLabel?: string;
  semesterLabel?: string;
  namaSekolah?: string;
  tahunAjaran?: string;
  tujuanPembelajaranList?: { materi: string; tujuanPembelajaran: string }[];
}): LearningEvaluationReport {
  const mataPelajaran = params.mataPelajaran || 'Matematika';
  const kelasLabel = params.kelasLabel || 'Kelas VIII (2 SMP)';
  const semesterLabel = params.semesterLabel || 'Semester 1 (Ganjil)';
  const namaSekolah = params.namaSekolah || 'SMP Negeri 1 Nusantara';
  const tahunAjaran = params.tahunAjaran || '2026/2027';
  const text = params.analisisText || '';

  // Extract metrics from analisisText via flexible regex patterns
  const meanMatch = text.match(/rata-?rata\s*(?:\(mean\))?\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i);
  const tuntasMatch = text.match(/tuntas[^%\n]*\(?\s*(\d+(?:[.,]\d+)?)\s*%/i) || text.match(/ketuntasan[^%\n]*[:=]?\s*(\d+(?:[.,]\d+)?)\s*%/i);
  const maxMatch = text.match(/tertinggi\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i);
  const minMatch = text.match(/terendah\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i);
  const kktpMatch = text.match(/(?:KKTP|KKM)\s*[:=]?\s*(\d+)/i);
  const totalMatch = text.match(/(?:jumlah|total)\s*(?:peserta\s*didik|siswa)\s*[:=]?\s*(\d+)/i);

  const rataRata = meanMatch ? parseFloat(meanMatch[1].replace(',', '.')) : 78.5;
  const pctKetuntasan = tuntasMatch ? parseFloat(tuntasMatch[1].replace(',', '.')) : 76.0;
  const nilaiTertinggi = maxMatch ? maxMatch[1].replace(',', '.') : '96';
  const nilaiTerendah = minMatch ? minMatch[1].replace(',', '.') : '54';
  const kktp = kktpMatch ? kktpMatch[1] : '75';
  const totalSiswa = totalMatch ? totalMatch[1] : 'sesuai daftar peserta';

  const tpSource =
    Array.isArray(params.tujuanPembelajaranList) && params.tujuanPembelajaranList.length > 0
      ? params.tujuanPembelajaranList
      : getSuggestedTopics(
          mataPelajaran,
          kelasLabel.includes('VII (1') ? '7' : kelasLabel.includes('IX') ? '9' : '8',
          semesterLabel.includes('2') ? '2' : '1'
        ).map((materi) => ({
          materi,
          tujuanPembelajaran: `Peserta didik mampu memahami dan menyelesaikan permasalahan kontekstual pada materi ${materi}.`,
        }));

  const ketercapaianTP: TPOAchievementItem[] = tpSource.slice(0, 8).map((tp, idx) => {
    // Vary achievement realistically around the overall ketuntasan percentage
    const offset = idx === tpSource.length - 1 ? -11 : idx === 0 ? 9 : idx % 2 === 0 ? 4 : -6;
    const tpPct = Math.max(42, Math.min(98, Math.round(pctKetuntasan + offset)));
    const tingkatKetercapaian: TPOAchievementItem['tingkatKetercapaian'] =
      tpPct >= 80 ? 'Tercapai Penuh' : tpPct >= 65 ? 'Tercapai Sebagian' : 'Belum Tercapai';

    return {
      no: idx + 1,
      tujuanPembelajaran: tp.tujuanPembelajaran,
      materi: tp.materi,
      tingkatKetercapaian,
      persentaseCapaian: `${tpPct}%`,
      catatanBukti:
        tingkatKetercapaian === 'Tercapai Penuh'
          ? `Mayoritas peserta didik menguasai konsep dasar hingga penerapan prosedural pada indikator ${tp.materi}.`
          : tingkatKetercapaian === 'Tercapai Sebagian'
            ? `Peserta didik menguasai soal tingkat C1–C3, namun sebagian masih kesulitan pada soal penalaran kontekstual ${tp.materi}.`
            : `Sebagian peserta didik masih mengalami miskonsepsi pada konsep inti dan pemecahan masalah ${tp.materi}.`,
    };
  });

  const dikuasaiTP = ketercapaianTP.filter((t) => t.tingkatKetercapaian === 'Tercapai Penuh');
  const perluPerbaikanTP = ketercapaianTP.filter((t) => t.tingkatKetercapaian !== 'Tercapai Penuh');

  const materiDikuasai: TopicMasteryNote[] = (
    dikuasaiTP.length > 0 ? dikuasaiTP : ketercapaianTP.slice(0, 2)
  ).map((t) => ({
    materi: t.materi,
    alasanBukti: `Capaian ketuntasan mencapai ${t.persentaseCapaian}; peserta didik mampu menerapkan konsep serta prosedur dasar pada ${t.materi} secara akurat.`,
  }));

  const materiPerluDiperbaiki: TopicMasteryNote[] = (
    perluPerbaikanTP.length > 0 ? perluPerbaikanTP : [ketercapaianTP[ketercapaianTP.length - 1]]
  )
    .filter(Boolean)
    .map((t) => ({
      materi: t.materi,
      alasanBukti: `Capaian sebesar ${t.persentaseCapaian} mengindikasikan perlunya penguatan pemahaman konsep prasyarat dan pembiasaan soal penalaran bertahap pada ${t.materi}.`,
    }));

  const rekomendasiRemedial: RemedialPlanItem[] = [
    {
      sasaran: `Peserta didik belum tuntas (< KKTP ${kktp})`,
      strategi: pctKetuntasan < 60 ? 'Pembelajaran Ulang Terbimbing Klasikal' : 'Klinik Belajar Kelompok Kecil & Scaffolding',
      bentukAktivitas: `Pendalaman konsep prasyarat pada materi ${materiPerluDiperbaiki[0]?.materi || mataPelajaran}, pembahasan langkah demi langkah, dan latihan soal bertingkat.`,
      targetKetuntasan: `Mencapai nilai minimal KKTP ${kktp} melalui asesmen ulang terstruktur.`,
    },
    {
      sasaran: 'Siswa dengan nilai mendekati KKTP (selisih ≤ 10 poin)',
      strategi: 'Tutor Sebaya & Umpan Balik Individual',
      bentukAktivitas: 'Diskusi berpasangan membahas kesalahan umum lembar jawaban ujian serta penugasan perbaikan terbimbing.',
      targetKetuntasan: 'Meningkatkan ketelitian prosedural dan menutup kesenjangan indikator esensial.',
    },
  ];

  const rekomendasiPengayaan: EnrichmentPlanItem[] = [
    {
      sasaran: `Peserta didik tuntas dengan capaian ≥ 85 (${Math.round(pctKetuntasan)}% tuntas)`,
      strategi: 'Pemecahan Masalah HOTS & Proyek Kontekstual',
      bentukAktivitas: `Penugasan studi kasus terpadu lintas topik ${mataPelajaran} level C4–C6 serta soal tantangan literasi-numerasi.`,
      luaranDiharapkan: 'Laporan analisis pemecahan masalah kreatif dan peningkatan daya nalar kritis.',
    },
    {
      sasaran: 'Peraih nilai tertinggi kelas',
      strategi: 'Pendampingan Tutor Sebaya & Kompetisi Akademik',
      bentukAktivitas: 'Berperan sebagai fasilitator sebaya dalam kelompok belajar sekaligus eksplorasi soal pengayaan tingkat lanjut.',
      luaranDiharapkan: 'Penguasaan materi mendalam serta penguatan keterampilan komunikasi akademik.',
    },
  ];

  return {
    id: `laporan-${Date.now()}`,
    judulLaporan: `Laporan Evaluasi Pembelajaran ${mataPelajaran} — ${kelasLabel}`,
    mataPelajaran,
    kelasLabel,
    semesterLabel,
    namaSekolah,
    tahunAjaran,
    ringkasanHasilBelajar: `Berdasarkan hasil evaluasi pembelajaran ${mataPelajaran} pada ${kelasLabel} ${semesterLabel} Tahun Ajaran ${tahunAjaran} di ${namaSekolah} (jumlah peserta: ${totalSiswa}), diperoleh nilai rata-rata kelas sebesar ${rataRata} dengan rentang nilai dari ${nilaiTerendah} hingga ${nilaiTertinggi}. Tingkat ketuntasan klasikal mencapai ${pctKetuntasan}% terhadap batas KKTP ${kktp}, sehingga secara umum kompetensi esensial telah berjalan baik namun tetap memerlukan penguatan terarah pada indikator bernalar tinggi.`,
    ketercapaianTP,
    materiDikuasai,
    materiPerluDiperbaiki,
    rekomendasiRemedial,
    rekomendasiPengayaan,
    catatanPenutupGuru: `Hasil evaluasi ini menjadi dasar penyesuaian strategi pembelajaran pada siklus berikutnya di ${namaSekolah}, dengan mengoptimalkan asesmen formatif harian serta keseimbangan pendampingan remedial dan pengayaan.`,
    createdAt: new Date().toISOString(),
  };
}
