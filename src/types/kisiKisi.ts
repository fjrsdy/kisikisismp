export type GradeSMP = '7' | '8' | '9';

export type Semester = '1' | '2';

export type CognitiveLevel = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';

export type QuestionForm =
  | 'Pilihan Ganda'
  | 'Pilihan Ganda Kompleks'
  | 'Menjodohkan'
  | 'Isian Singkat'
  | 'Uraian';

export type CognitivePreset = 'proporsional' | 'hots_fokus' | 'dasar_penguatan';

export interface KisiRow {
  id: string;
  no: number;
  capaianPembelajaran: string;
  tujuanPembelajaran: string;
  materi: string;
  indikatorSoal: string;
  levelKognitif: CognitiveLevel;
  kataKerjaOperasional: string;
  bentukSoal: QuestionForm;
  nomorSoal: string;
  bobotSkor?: number;
}

export interface ExamConfig {
  mataPelajaran: string;
  kelas: GradeSMP;
  semester: Semester;
  jenisUjian: string;
  kurikulum: string;
  materiPokok: string;
  jumlahPG: number;
  jumlahPGK: number;
  jumlahIsian: number;
  jumlahUraian: number;
  proporsiKognitif: CognitivePreset;
  namaSekolah: string;
  tahunAjaran: string;
  namaPenyusun: string;
  nipPenyusun: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  alokasiWaktu: string;
}

export interface KisiBlueprint {
  id: string;
  config: ExamConfig;
  rows: KisiRow[];
  catatanAhliEvaluasi: string;
  updatedAt: string;
}

export interface GeneratedSampleItem {
  nomorSoal: string;
  bentukSoal: QuestionForm;
  levelKognitif: CognitiveLevel;
  stimulus: string;
  pertanyaan: string;
  pilihanJawaban?: string[];
  kunciJawaban: string;
  pembahasan: string;
  pedomanPenskoran: string;
}

export type DifficultyLevel = 'Mudah' | 'Sedang' | 'Sukar';

export interface MultipleChoiceQuestion {
  id: string;
  nomor: number;
  indikatorTerkait: string;
  materi: string;
  levelKognitif: CognitiveLevel;
  tingkatKesulitan: DifficultyLevel;
  stimulus: string;
  pertanyaan: string;
  pilihan: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  kunciJawaban: 'A' | 'B' | 'C' | 'D';
  pembahasan: string;
}

export interface ShortAnswerQuestion {
  id: string;
  nomor: number;
  indikatorTerkait: string;
  materi: string;
  levelKognitif: CognitiveLevel;
  tingkatKesulitan: DifficultyLevel;
  stimulus: string;
  pertanyaan: string;
  kunciJawaban: string;
  pedomanPenskoran: string;
}

export interface EssayQuestion {
  id: string;
  nomor: number;
  indikatorTerkait: string;
  materi: string;
  levelKognitif: CognitiveLevel;
  tingkatKesulitan: DifficultyLevel;
  stimulus: string;
  pertanyaan: string;
  kunciJawaban: string;
  pedomanPenskoran: string;
  skorMaksimal: number;
}

export interface ExamPaperPackage {
  id: string;
  judulUjian: string;
  mataPelajaran: string;
  kelasLabel: string;
  semesterLabel: string;
  alokasiWaktu: string;
  namaSekolah: string;
  tahunAjaran: string;
  catatanPenyusun: string;
  pilihanGanda: MultipleChoiceQuestion[];
  isianSingkat: ShortAnswerQuestion[];
  uraian: EssayQuestion[];
  createdAt: string;
}

export interface RubricCriterion {
  kriteria: string;
  skor: number;
}

export interface AssessmentPGKey {
  nomor: number;
  ringkasanSoal: string;
  kunciJawaban: string;
  pembahasanSingkat: string;
  skorMaksimal: number;
}

export interface AssessmentShortKey {
  nomor: number;
  ringkasanSoal: string;
  kunciUtama: string;
  alternatifJawaban: string[];
  pembahasanSingkat: string;
  rubrikPenskoran: RubricCriterion[];
  skorMaksimal: number;
}

export interface AssessmentEssayKey {
  nomor: number;
  ringkasanSoal: string;
  kunciUtama: string;
  alternatifJawaban: string[];
  pembahasanSingkat: string;
  rubrikPenskoran: RubricCriterion[];
  skorMaksimal: number;
}

export interface AssessmentGuidePackage {
  id: string;
  judulUjian: string;
  mataPelajaran: string;
  kelasLabel: string;
  bobotPGPerSoal: number;
  bobotIsianPerSoal: number;
  rumusNilaiAkhir: string;
  rumusBerbobotOpsional: string;
  catatanPenilaian: string;
  kunciPG: AssessmentPGKey[];
  kunciIsian: AssessmentShortKey[];
  kunciUraian: AssessmentEssayKey[];
  createdAt: string;
}

export interface StudentScoreRecord {
  id: string;
  no: number;
  nama: string;
  nilai: number;
}

export interface ScoreDistributionBucket {
  label: string;
  min: number;
  max: number;
  count: number;
}

export interface ScoreStatistics {
  totalSiswa: number;
  rataRata: number;
  median: number;
  simpanganBaku: number;
  nilaiTertinggi: number;
  nilaiTerendah: number;
  siswaTertinggi: string[];
  siswaTerendah: string[];
  jumlahTuntas: number;
  jumlahBelumTuntas: number;
  persentaseKetuntasan: number;
  persentaseBelumTuntas: number;
  distribusi: ScoreDistributionBucket[];
}

export interface ScoreAnalysisNarrative {
  statusKetuntasanKlasikal: string;
  ringkasanEksekutif: string;
  interpretasiHasil: string;
  analisisSebaranNilai: string;
  rekomendasiRemedial: string[];
  rekomendasiPengayaan: string[];
  tindakLanjutPembelajaranGuru: string[];
}

export interface TPOAchievementItem {
  no: number;
  tujuanPembelajaran: string;
  materi: string;
  tingkatKetercapaian: 'Tercapai Penuh' | 'Tercapai Sebagian' | 'Belum Tercapai';
  persentaseCapaian: string;
  catatanBukti: string;
}

export interface TopicMasteryNote {
  materi: string;
  alasanBukti: string;
}

export interface RemedialPlanItem {
  sasaran: string;
  strategi: string;
  bentukAktivitas: string;
  targetKetuntasan: string;
}

export interface EnrichmentPlanItem {
  sasaran: string;
  strategi: string;
  bentukAktivitas: string;
  luaranDiharapkan: string;
}

export interface LearningEvaluationReport {
  id: string;
  judulLaporan: string;
  mataPelajaran: string;
  kelasLabel: string;
  semesterLabel: string;
  namaSekolah: string;
  tahunAjaran: string;
  ringkasanHasilBelajar: string;
  ketercapaianTP: TPOAchievementItem[];
  materiDikuasai: TopicMasteryNote[];
  materiPerluDiperbaiki: TopicMasteryNote[];
  rekomendasiRemedial: RemedialPlanItem[];
  rekomendasiPengayaan: EnrichmentPlanItem[];
  catatanPenutupGuru: string;
  createdAt: string;
}

export interface ExamFormSubmission {
  id: string;
  namaSiswa: string;
  nis: string;
  kelas: string;
  judulUjian: string;
  mataPelajaran: string;
  pgAnswers: Record<number, 'A' | 'B' | 'C' | 'D' | ''>;
  isianAnswers: Record<number, string>;
  uraianAnswers: Record<number, string>;
  skorPG: number;
  maksPG: number;
  skorIsian: number;
  maksIsian: number;
  skorUraian: number;
  maksUraian: number;
  nilaiAkhir: number;
  durasiDetik: number;
  pelanggaranFokus?: number;
  dikumpulkanOtomatis?: boolean;
  cbtSessionCode?: string;
  submittedAt: string;
}

export interface CbtSecurityConfig {
  acakSoal: boolean;
  acakOpsi: boolean;
  wajibFullscreen: boolean;
  blokirCopyKlikKanan: boolean;
  batasPelanggaranTab: number;
  tokenUjian: string;
  tampilkanNilaiKeSiswa: boolean;
}

export interface CbtSharedSession {
  code: string;
  paper: ExamPaperPackage;
  kktp: number;
  security: CbtSecurityConfig;
  createdAt: string;
}

