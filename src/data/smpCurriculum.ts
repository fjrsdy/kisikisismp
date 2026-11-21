import type { CognitiveLevel, GradeSMP, KisiBlueprint, Semester } from '../types/kisiKisi';

export const SMP_SUBJECTS: string[] = [
  'Matematika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Ilmu Pengetahuan Alam (IPA)',
  'Ilmu Pengetahuan Sosial (IPS)',
  'Pendidikan Pancasila',
  'Informatika',
  'Pendidikan Agama Islam dan Budi Pekerti',
  'Seni Budaya',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
];

export const EXAM_TYPES: string[] = [
  'Sumatif Akhir Semester (SAS)',
  'Sumatif Tengah Semester (STS)',
  'Penilaian Akhir Tahun (PAT)',
  'Asesmen Sumatif Akhir Jenjang (ASAJ)',
];

export const CURRICULUM_OPTIONS: string[] = [
  'Kurikulum Merdeka (Fase D)',
  'Kurikulum 2013 (Revisi)',
];

export interface CognitiveMeta {
  code: CognitiveLevel;
  label: string;
  english: string;
  tier: 'LOTS' | 'MOTS' | 'HOTS';
  description: string;
  kkoExamples: string[];
  badgeClass: string;
  barClass: string;
}

export const COGNITIVE_LEVELS: Record<CognitiveLevel, CognitiveMeta> = {
  C1: {
    code: 'C1',
    label: 'Mengingat',
    english: 'Remembering',
    tier: 'LOTS',
    description: 'Mengenali atau memanggil kembali fakta, istilah, konsep dasar, atau rumus.',
    kkoExamples: ['Menyebutkan', 'Mengidentifikasi', 'Menunjukkan', 'Mendefinisikan'],
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    barClass: 'bg-slate-500',
  },
  C2: {
    code: 'C2',
    label: 'Memahami',
    english: 'Understanding',
    tier: 'LOTS',
    description: 'Menjelaskan gagasan, menafsirkan makna, merangkum, atau memberi contoh.',
    kkoExamples: ['Menjelaskan', 'Mengklasifikasikan', 'Menafsirkan', 'Membedakan'],
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    barClass: 'bg-sky-500',
  },
  C3: {
    code: 'C3',
    label: 'Menerapkan',
    english: 'Applying',
    tier: 'MOTS',
    description: 'Menggunakan prosedur, rumus, atau konsep pada situasi rutin maupun kontekstual.',
    kkoExamples: ['Menghitung', 'Menentukan', 'Menerapkan', 'Menggunakan'],
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    barClass: 'bg-teal-600',
  },
  C4: {
    code: 'C4',
    label: 'Menganalisis',
    english: 'Analyzing',
    tier: 'HOTS',
    description: 'Menguraikan informasi menjadi bagian, menemukan pola, atau menguji hubungan antarunsur.',
    kkoExamples: ['Menganalisis', 'Membandingkan', 'Menelaah', 'Mengaitkan'],
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
    barClass: 'bg-amber-500',
  },
  C5: {
    code: 'C5',
    label: 'Mengevaluasi',
    english: 'Evaluating',
    tier: 'HOTS',
    description: 'Menilai kelayakan argumen, mengambil keputusan berbasis kriteria, atau mengkritisi solusi.',
    kkoExamples: ['Menyimpulkan', 'Membuktikan', 'Menilai', 'Memutuskan'],
    badgeClass: 'bg-orange-50 text-orange-900 border-orange-200',
    barClass: 'bg-orange-600',
  },
  C6: {
    code: 'C6',
    label: 'Mencipta',
    english: 'Creating',
    tier: 'HOTS',
    description: 'Merancang strategi baru, menyusun model matematis, atau memproduksi gagasan orisinal.',
    kkoExamples: ['Merancang', 'Menyusun', 'Merumuskan', 'Memecahkan masalah kompleks'],
    badgeClass: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    barClass: 'bg-indigo-700',
  },
};

export const GRADE_LABELS: Record<GradeSMP, string> = {
  '7': 'Kelas VII (1 SMP)',
  '8': 'Kelas VIII (2 SMP)',
  '9': 'Kelas IX (3 SMP)',
};

export const SEMESTER_LABELS: Record<Semester, string> = {
  '1': 'Semester 1 (Ganjil)',
  '2': 'Semester 2 (Genap)',
};

type TopicCatalog = Record<string, Record<GradeSMP, Record<Semester, string[]>>>;

export const TOPIC_SUGGESTIONS: TopicCatalog = {
  Matematika: {
    '7': {
      '1': [
        'Bilangan Bulat dan Operasi Hitung',
        'Bilangan Rasional dan Pecahan',
        'Rasio dan Proporsi',
        'Bentuk Aljabar Dasar',
      ],
      '2': [
        'Persamaan dan Pertidaksamaan Linear Satu Variabel',
        'Garis dan Sudut',
        'Bangun Datar (Segitiga dan Segiempat)',
        'Penyajian Data dan Diagram',
      ],
    },
    '8': {
      '1': [
        'Bilangan Berpangkat dan Bentuk Akar',
        'Teorema Pythagoras',
        'Persamaan Garis Lurus',
        'Sistem Persamaan Linear Dua Variabel (SPLDV)',
      ],
      '2': [
        'Relasi dan Fungsi',
        'Statistika (Pemusatan dan Penyebaran Data)',
        'Peluang Empirik dan Teoretik',
        'Bangun Ruang Sisi Datar',
      ],
    },
    '9': {
      '1': [
        'Sistem Persamaan Linear Dua Variabel Lanjutan',
        'Bangun Ruang Sisi Lengkung (Tabung, Kerucut, Bola)',
        'Transformasi Geometri (Translasi, Refleksi, Rotasi, Dilatasi)',
        'Kesebangunan dan Kekongruenan',
      ],
      '2': [
        'Persamaan Kuadrat dan Fungsi Kuadrat',
        'Peluang dan Pemilihan Sampel',
        'Pemodelan Matematika Kontekstual',
        'Uji Kompetensi Terpadu Fase D',
      ],
    },
  },
  'Bahasa Indonesia': {
    '7': {
      '1': [
        'Teks Deskripsi',
        'Puisi Rakyat dan Cerita Fantasi',
        'Teks Prosedur',
        'Kaidah Kebahasaan dan Ejaan (EYD V)',
      ],
      '2': [
        'Teks Berita (Eksplanasi Faktual)',
        'Buku Fiksi dan Nonfiksi',
        'Surat Pribadi dan Surat Resmi',
        'Teks Tanggapan',
      ],
    },
    '8': {
      '1': [
        'Teks Laporan Hasil Observasi',
        'Iklan, Slogan, dan Poster',
        'Artikel Ilmiah Populer',
        'Struktur Kalimat Efektif dan Paragraf',
      ],
      '2': [
        'Ulasan Karya Fiksi (Resensi)',
        'Puisi Modern dan Majas',
        'Teks Pidato Persuasif',
        'Drama dan Unsur Pementasan',
      ],
    },
    '9': {
      '1': [
        'Teks Deskripsi Bertema Lingkungan Sosial',
        'Teks Prosedur Kompleks',
        'Teks Rekon (Pengalaman dan Sejarah)',
        'Kalimat Konjungsi, Kohesi, dan Koherensi',
      ],
      '2': [
        'Teks Eksplanasi dan Laporan Percobaan',
        'Teks Diskusi (Argumen Pro dan Kontra)',
        'Teks Kritik dan Esai Singkat',
        'Literasi Membaca Kritis Fase D',
      ],
    },
  },
  'Ilmu Pengetahuan Alam (IPA)': {
    '7': {
      '1': [
        'Hakikat Ilmu Sains dan Metode Ilmiah',
        'Pengukuran dan Besaran',
        'Zat dan Perubahannya (Wujud, Fisika, Kimia)',
        'Suhu, Kalor, dan Pemuaian',
      ],
      '2': [
        'Gerak dan Gaya (Hukum Newton)',
        'Klasifikasi Makhluk Hidup',
        'Ekologi dan Keanekaragaman Hayati',
        'Bumi dan Tata Surya',
      ],
    },
    '8': {
      '1': [
        'Pengenalan Sel dan Mikroskop',
        'Struktur dan Fungsi Tubuh Makhluk Hidup (Pencernaan, Peredaran Darah, Pernapasan)',
        'Usaha, Energi, dan Pesawat Sederhana',
        'Getaran, Gelombang, dan Cahaya',
      ],
      '2': [
        'Unsur, Senyawa, dan Campuran',
        'Struktur Bumi dan Perkembangannya',
        'Tekanan Zat Cair dan Gas',
        'Sistem Ekskresi Manusia',
      ],
    },
    '9': {
      '1': [
        'Pertumbuhan dan Perkembangan Makhluk Hidup',
        'Sistem Koordinasi, Reproduksi, dan Homeostasis',
        'Tekanan pada Zat Padat, Cair, dan Gas',
        'Listrik Statis, Listrik Dinamis, dan Kemagnetan',
      ],
      '2': [
        'Reaksi-Reaksi Kimia dan Dinamikanya (Asam Basa)',
        'Pewarisan Sifat dan Bioteknologi',
        'Isu-Isu Lingkungan dan Pemanasan Global',
        'Energi Terbarukan',
      ],
    },
  },
  'Bahasa Inggris': {
    '7': {
      '1': [
        'Greeting, Leave-taking, and Self-Introduction',
        'Culinary and Me (Describing Food & Recipe/Procedure)',
        'Home Sweet Home (Rooms, Things, and Prepositions)',
        'Simple Present Tense & Adjectives',
      ],
      '2': [
        'My School Activities (Schedules & Routines)',
        'This is My School (Describing Places)',
        'Descriptive Text about People and Animals',
        'Asking and Giving Information',
      ],
    },
    '8': {
      '1': [
        'Celebrating Independence Day (Recount Text & Past Tense)',
        'Kindness Begins with Me (Narrative Text)',
        'Love Our World (Procedure & Imperative Sentences)',
        'Regular and Irregular Verbs in Context',
      ],
      '2': [
        'No Littering (Recount & Environmental Awareness)',
        'Embrace Yourself (Expressing Opinions & Comparison)',
        'Short Functional Texts (Notices, Announcements, Messages)',
        'Reading Comprehension & Inference',
      ],
    },
    '9': {
      '1': [
        'Exploring Fauna of Indonesia (Report Text)',
        'Taking Trips (Recount Text & Past Continuous)',
        'Journeys to the Fantasy Worlds (Narrative Text)',
        'Passive Voice in Report & Procedure Texts',
      ],
      '2': [
        'Upcycling Used Materials (Descriptive & Procedural)',
        'Digital Life and Safety (Procedure & Argumentative)',
        'Advertisement, Label, and Short Functional Text',
        'Integrated Reading & Writing Assessment',
      ],
    },
  },
  'Ilmu Pengetahuan Sosial (IPS)': {
    '7': {
      '1': [
        'Keluarga Awal Kehidupan & Sejarah Lisan',
        'Lokasi, Peta, dan Kondisi Geografis Indonesia',
        'Keberagaman Lingkungan Sekitar dan Interaksi Sosial',
        'Kebutuhan Manusia dan Kelangkaan Ekonomi',
      ],
      '2': [
        'Potensi Ekonomi Lingkungan & Pemanfaatan SDA',
        'Kegiatan Ekonomi (Produksi, Distribusi, Konsumsi)',
        'Pemberdayaan Masyarakat dan Literasi Keuangan',
        'Interaksi Sosial dan Lembaga Sosial',
      ],
    },
    '8': {
      '1': [
        'Kondisi Geografis dan Pelestarian Sumber Daya Alam',
        'Kemajemukan Masyarakat Indonesia & Mobilitas Sosial',
        'Konflik dan Integrasi Sosial',
        'Kedatangan Bangsa-Bangsa Asing di Nusantara',
      ],
      '2': [
        'Pergerakan Kebangsaan Menuju Kemerdekaan',
        'Pemerataan Pembangunan dan Peran Lembaga Keuangan',
        'Perdagangan Antarpulau dan Antarnegara',
        'Dinamika Penduduk Indonesia',
      ],
    },
    '9': {
      '1': [
        'Manusia dan Perubahan (Modernisasi dan Perubahan Sosial)',
        'Perkembangan Ekonomi Digital dan Uang Elektronik',
        'Perdagangan Internasional dan Kerja Sama Ekonomi',
        'Dinamika Kependudukan Global',
      ],
      '2': [
        'Tantangan Pembangunan Indonesia Menuju Negara Maju',
        'Sejarah Awal Kemerdekaan hingga Reformasi',
        'Kerja Sama Dunia dan Peran Indonesia di ASEAN/PBB',
        'Ekonomi Kreatif dan Kewirausahaan Sosial',
      ],
    },
  },
  'Pendidikan Pancasila': {
    '7': {
      '1': [
        'Sejarah Kelahiran Pancasila',
        'Norma dan UUD NRI Tahun 1945',
        'Hak dan Kewajiban Warga Negara Muda',
      ],
      '2': [
        'Kesatuan Indonesia dan Karakteristik Daerah',
        'Kebinekaan Indonesia (Suku, Agama, Ras, Antargolongan)',
        'Bekerja Sama dan Bergotong Royong',
      ],
    },
    '8': {
      '1': [
        'Pancasila dalam Kehidupan Berbangsa dan Bernegara',
        'Kedudukan dan Fungsi UUD NRI Tahun 1945',
        'Tata Urutan Peraturan Perundang-undangan Nasional',
      ],
      '2': [
        'Kebangkitan Nasional dan Sumpah Pemuda 1928',
        'Jati Diri Bangsa dan Budaya Nasional',
        'Literasi Digital dan Etika Berwarga Negara',
      ],
    },
    '9': {
      '1': [
        'Hubungan Pancasila dengan UUD 1945, Bhinneka Tunggal Ika, dan NKRI',
        'Hak dan Kewajiban Warga Negara dalam Demokrasi',
        'Kemerdekaan Berpendapat Secara Bertanggung Jawab',
      ],
      '2': [
        'Menjaga dan Melestarikan Tradisi, Kearifan Lokal, serta Budaya',
        'Menjaga Keutuhan Wilayah Negara Kesatuan Republik Indonesia',
        'Partisipasi Warga Negara dalam Pembangunan Nasional',
      ],
    },
  },
  Informatika: {
    '7': {
      '1': [
        'Berpikir Komputasional (Algoritma, Dekomposisi, Pola)',
        'Teknologi Informasi dan Komunikasi (Aplikasi Perkantoran)',
        'Sistem Komputer (Perangkat Keras dan Lunak)',
      ],
      '2': [
        'Jaringan Komputer dan Internet',
        'Analisis Data Dasar (Pengolahan Lembar Kerja)',
        'Dampak Sosial Informatika & Keamanan Digital',
      ],
    },
    '8': {
      '1': [
        'Berpikir Komputasional (Fungsi, Himpunan, Sistem Bilangan)',
        'Integrasi Konten Aplikasi Perkantoran & Blog/Vlog',
        'Sistem Komputer (Gerbang Logika dan Memori)',
      ],
      '2': [
        'Jaringan Komputer, Routing, dan Keamanan Data',
        'Algoritma dan Pemrograman Visual (Scratch/Blockly)',
        'Media Sosial, Etika, dan Verifikasi Informasi',
      ],
    },
    '9': {
      '1': [
        'Berpikir Komputasional (Struktur Data Graf dan Pohon)',
        'Integrasi Aplikasi Perkantoran Kompleks',
        'Algoritma Pemrograman Berbasis Teks/Blok Modular',
      ],
      '2': [
        'Keamanan Informasi dan Enkripsi Dasar',
        'Dampak Sosial Informatika dan Kecerdasan Artifisial',
        'Praktik Lintas Bidang Informatika',
      ],
    },
  },
};

export function getSuggestedTopics(
  subject: string,
  kelas: GradeSMP,
  semester: Semester
): string[] {
  const subjectCatalog = TOPIC_SUGGESTIONS[subject];
  if (subjectCatalog?.[kelas]?.[semester]) {
    return subjectCatalog[kelas][semester];
  }
  return [
    `Konsep Dasar ${subject} Kelas ${kelas}`,
    `Penerapan Kontekstual Materi Semester ${semester}`,
    `Pemecahan Masalah & Analisis Kasus ${subject}`,
  ];
}

export const INITIAL_BLUEPRINT: KisiBlueprint = {
  id: 'default-matematika-8-s1',
  updatedAt: '2026-11-20T08:00:00.000Z',
  catatanAhliEvaluasi:
    'Kisi-kisi disusun mengikuti sebaran Taksonomi Bloom Revisi secara proporsional: 25% LOTS (C1–C2) untuk penguasaan konsep dasar, 37,5% MOTS (C3) untuk ketepatan prosedural, dan 37,5% HOTS (C4–C6) untuk penalaran matematis kontekstual Fase D.',
  config: {
    mataPelajaran: 'Matematika',
    kelas: '8',
    semester: '1',
    jenisUjian: 'Sumatif Akhir Semester (SAS)',
    kurikulum: 'Kurikulum Merdeka (Fase D)',
    materiPokok:
      'Bilangan Berpangkat dan Bentuk Akar, Teorema Pythagoras, Persamaan Garis Lurus, Sistem Persamaan Linear Dua Variabel (SPLDV)',
    jumlahPG: 20,
    jumlahPGK: 3,
    jumlahIsian: 4,
    jumlahUraian: 3,
    proporsiKognitif: 'proporsional',
    namaSekolah: 'SMP Negeri 1 Nusantara',
    tahunAjaran: '2026/2027',
    namaPenyusun: 'Drs. Hendra Wijaya, M.Pd.',
    nipPenyusun: '19780412 200501 1 008',
    namaKepalaSekolah: 'Dra. Siti Rahmawati, M.Pd.',
    nipKepalaSekolah: '19710918 199802 2 003',
    alokasiWaktu: '120 Menit',
  },
  rows: [
    {
      id: 'row-1',
      no: 1,
      capaianPembelajaran:
        'Peserta didik dapat membaca, menulis, dan membandingkan bilangan berpangkat bulat, bilangan rasional, serta menerapkan sifat operasi perpangkatan.',
      tujuanPembelajaran:
        'Mengidentifikasi sifat perkalian dan pembagian bilangan berpangkat bulat positif dengan benar.',
      materi: 'Bilangan Berpangkat Bulat',
      indikatorSoal:
        'Disajikan operasi perkalian dan pembagian bilangan berpangkat dengan basis sama, peserta didik dapat menentukan bentuk paling sederhana berdasarkan sifat eksponen.',
      levelKognitif: 'C1',
      kataKerjaOperasional: 'Mengidentifikasi',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: '1, 2',
      bobotSkor: 4,
    },
    {
      id: 'row-2',
      no: 2,
      capaianPembelajaran:
        'Peserta didik dapat membaca, menulis, dan membandingkan bilangan berpangkat bulat, bilangan rasional, serta menerapkan sifat operasi perpangkatan.',
      tujuanPembelajaran:
        'Menjelaskan makna bilangan berpangkat negatif dan nol serta menyederhanakan bentuk akar kuadrat.',
      materi: 'Pangkat Negatif dan Bentuk Akar',
      indikatorSoal:
        'Disajikan beberapa pernyataan kesetaraan antara bilangan berpangkat negatif dan bentuk akar, peserta didik dapat menafsirkan pernyataan yang bernilai benar.',
      levelKognitif: 'C2',
      kataKerjaOperasional: 'Menafsirkan',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: '3, 4',
      bobotSkor: 4,
    },
    {
      id: 'row-3',
      no: 3,
      capaianPembelajaran:
        'Peserta didik dapat membaca, menulis, dan membandingkan bilangan berpangkat bulat, bilangan rasional, serta menerapkan sifat operasi perpangkatan.',
      tujuanPembelajaran:
        'Menggunakan notasi ilmiah untuk menyatakan bilangan sangat besar atau sangat kecil dalam konteks sains.',
      materi: 'Notasi Ilmiah (Bentuk Baku)',
      indikatorSoal:
        'Disajikan data jarak benda langit atau ukuran partikel mikroskopis dalam satuan standar, peserta didik dapat menghitung dan mengubahnya ke dalam notasi ilmiah dengan tepat.',
      levelKognitif: 'C3',
      kataKerjaOperasional: 'Menghitung',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: '5, 6',
      bobotSkor: 4,
    },
    {
      id: 'row-4',
      no: 4,
      capaianPembelajaran:
        'Peserta didik dapat membaca, menulis, dan membandingkan bilangan berpangkat bulat, bilangan rasional, serta menerapkan sifat operasi perpangkatan.',
      tujuanPembelajaran:
        'Menganalisis kesalahan prosedur penyederhanaan operasi bentuk akar campuran.',
      materi: 'Operasi Bentuk Akar',
      indikatorSoal:
        'Disajikan langkah-langkah penyederhanaan penjumlahan dan perkalian bentuk akar yang memuat satu kekeliruan langkah, peserta didik dapat menganalisis letak kesalahan dan memperbaikinya.',
      levelKognitif: 'C4',
      kataKerjaOperasional: 'Menganalisis',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: '7',
      bobotSkor: 2,
    },
    {
      id: 'row-5',
      no: 5,
      capaianPembelajaran:
        'Peserta didik dapat menunjukkan kebenaran teorema Pythagoras dan menggunakannya dalam menyelesaikan masalah termasuk jarak antara dua titik pada bidang koordinat Kartesius.',
      tujuanPembelajaran:
        'Mengenali tiga bilangan bulat yang membentuk tripel Pythagoras.',
      materi: 'Tripel Pythagoras',
      indikatorSoal:
        'Disajikan empat kelompok ukuran panjang sisi segitiga, peserta didik dapat menunjukkan kelompok ukuran yang merupakan segitiga siku-siku.',
      levelKognitif: 'C1',
      kataKerjaOperasional: 'Menunjukkan',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: '8, 9',
      bobotSkor: 4,
    },
    {
      id: 'row-6',
      no: 6,
      capaianPembelajaran:
        'Peserta didik dapat menunjukkan kebenaran teorema Pythagoras dan menggunakannya dalam menyelesaikan masalah termasuk jarak antara dua titik pada bidang koordinat Kartesius.',
      tujuanPembelajaran:
        'Menentukan panjang salah satu sisi segitiga siku-siku atau segitiga istimewa (30°-60°-90° dan 45°-45°-90°).',
      materi: 'Segitiga Siku-Siku Istimewa',
      indikatorSoal:
        'Disajikan gambar tangga bersandar pada dinding dengan sudut elevasi 60° dan panjang tertentu, peserta didik dapat menentukan tinggi dinding yang dicapai tangga.',
      levelKognitif: 'C3',
      kataKerjaOperasional: 'Menentukan',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: '10, 11',
      bobotSkor: 4,
    },
    {
      id: 'row-7',
      no: 7,
      capaianPembelajaran:
        'Peserta didik dapat menunjukkan kebenaran teorema Pythagoras dan menggunakannya dalam menyelesaikan masalah termasuk jarak antara dua titik pada bidang koordinat Kartesius.',
      tujuanPembelajaran:
        'Menganalisis lintasan terpendek atau jarak dua titik pada peta koordinat Kartesius.',
      materi: 'Penerapan Teorema Pythagoras pada Koordinat',
      indikatorSoal:
        'Disajikan rute perjalanan kapal dari pelabuhan ke dua pulau dengan arah mata angin berbeda, peserta didik dapat menganalisis jarak terpendek kembali ke titik awal.',
      levelKognitif: 'C4',
      kataKerjaOperasional: 'Menganalisis',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: '12, 13',
      bobotSkor: 4,
    },
    {
      id: 'row-8',
      no: 8,
      capaianPembelajaran:
        'Peserta didik dapat memahami relasi dan fungsi, serta menyajikan, menganalisis, dan menyelesaikan masalah menggunakan persamaan linear dan gradien garis lurus.',
      tujuanPembelajaran:
        'Menjelaskan hubungan antara gradien garis lurus dengan kemiringan garis pada bidang koordinat.',
      materi: 'Gradien Persamaan Garis Lurus',
      indikatorSoal:
        'Disajikan grafik garis lurus yang melalui dua titik berkoordinat bulat, peserta didik dapat menentukan nilai kemiringan (gradien) serta mengklasifikasikan arah kemiringannya.',
      levelKognitif: 'C2',
      kataKerjaOperasional: 'Mengklasifikasikan',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: '14, 15',
      bobotSkor: 4,
    },
    {
      id: 'row-9',
      no: 9,
      capaianPembelajaran:
        'Peserta didik dapat memahami relasi dan fungsi, serta menyajikan, menganalisis, dan menyelesaikan masalah menggunakan persamaan linear dan gradien garis lurus.',
      tujuanPembelajaran:
        'Menentukan persamaan garis lurus yang sejajar atau tegak lurus dengan garis lain melalui sebuah titik.',
      materi: 'Kedudukan Dua Garis Lurus',
      indikatorSoal:
        'Disajikan persamaan garis ax + by = c dan sebuah titik di luar garis, peserta didik dapat menentukan persamaan garis baru yang tegak lurus dan melalui titik tersebut.',
      levelKognitif: 'C3',
      kataKerjaOperasional: 'Menentukan',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: '16, 17',
      bobotSkor: 4,
    },
    {
      id: 'row-10',
      no: 10,
      capaianPembelajaran:
        'Peserta didik dapat menyelesaikan sistem persamaan linear dua variabel melalui beberapa cara untuk penyelesaian masalah kontekstual.',
      tujuanPembelajaran:
        'Menyelesaikan sistem persamaan linear dua variabel menggunakan metode eliminasi dan substitusi.',
      materi: 'Penyelesaian SPLDV',
      indikatorSoal:
        'Disajikan permasalahan harga dua jenis paket alat tulis di koperasi sekolah, peserta didik dapat menentukan harga satuan masing-masing barang secara akurat.',
      levelKognitif: 'C3',
      kataKerjaOperasional: 'Menentukan',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: '18, 19',
      bobotSkor: 4,
    },
    {
      id: 'row-11',
      no: 11,
      capaianPembelajaran:
        'Peserta didik dapat menyelesaikan sistem persamaan linear dua variabel melalui beberapa cara untuk penyelesaian masalah kontekstual.',
      tujuanPembelajaran:
        'Mengevaluasi kesesuaian model matematika SPLDV terhadap batasan kondisi soal cerita.',
      materi: 'Evaluasi Model SPLDV',
      indikatorSoal:
        'Disajikan narasi perbandingan umur dan empat alternatif model SPLDV, peserta didik dapat mengevaluasi dan memilih model yang paling valid sesuai kondisi waktu lampau dan mendatang.',
      levelKognitif: 'C5',
      kataKerjaOperasional: 'Menilai',
      bentukSoal: 'Pilihan Ganda',
      nomorSoal: '20',
      bobotSkor: 2,
    },
    {
      id: 'row-12',
      no: 12,
      capaianPembelajaran:
        'Peserta didik dapat membaca, menulis, dan membandingkan bilangan berpangkat bulat serta menunjukkan kebenaran teorema Pythagoras.',
      tujuanPembelajaran:
        'Menelaah kebenaran beberapa sifat bilangan berpangkat dan hubungan sisi segitiga siku-siku secara simultan.',
      materi: 'Sifat Eksponen & Teorema Pythagoras',
      indikatorSoal:
        'Disajikan empat pernyataan aljabar eksponen dan tiga gambar segitiga dengan ukuran sisinya, peserta didik dapat memilih lebih dari satu pernyataan yang bernilai benar.',
      levelKognitif: 'C4',
      kataKerjaOperasional: 'Menelaah',
      bentukSoal: 'Pilihan Ganda Kompleks',
      nomorSoal: '21, 22, 23',
      bobotSkor: 9,
    },
    {
      id: 'row-13',
      no: 13,
      capaianPembelajaran:
        'Peserta didik dapat menerapkan sifat operasi bentuk akar dan menentukan gradien garis lurus dari persamaan implisit.',
      tujuanPembelajaran:
        'Menghitung hasil operasi bentuk akar dan nilai gradien dari persamaan garis bentuk ax + by + c = 0.',
      materi: 'Rasionalisasi Penyebut & Gradien Implisit',
      indikatorSoal:
        'Disajikan pecahan berpenyebut bentuk akar dan persamaan garis implisit, peserta didik dapat menuliskan hasil rasionalisasi dan nilai gradien secara ringkas.',
      levelKognitif: 'C3',
      kataKerjaOperasional: 'Menghitung',
      bentukSoal: 'Isian Singkat',
      nomorSoal: '24, 25, 26, 27',
      bobotSkor: 12,
    },
    {
      id: 'row-14',
      no: 14,
      capaianPembelajaran:
        'Peserta didik dapat menunjukkan kebenaran teorema Pythagoras dan menggunakannya dalam menyelesaikan masalah bangun ruang maupun bidang datar.',
      tujuanPembelajaran:
        'Membuktikan kelayakan ukuran penyangga atap berbentuk segitiga siku-siku dalam konteks teknik bangunan sederhana.',
      materi: 'Aplikasi Teorema Pythagoras dalam Konteks Nyata',
      indikatorSoal:
        'Disajikan sketsa rangka atap dan batas panjang kayu yang tersedia, peserta didik dapat membuktikan apakah ukuran rangka memenuhi sudut siku-siku dan menyimpulkan kecukupan bahan.',
      levelKognitif: 'C5',
      kataKerjaOperasional: 'Membuktikan',
      bentukSoal: 'Uraian',
      nomorSoal: '28',
      bobotSkor: 12,
    },
    {
      id: 'row-15',
      no: 15,
      capaianPembelajaran:
        'Peserta didik dapat menyajikan, menganalisis, dan menyelesaikan masalah menggunakan persamaan linear dan grafik fungsi linear.',
      tujuanPembelajaran:
        'Menganalisis titik potong dua tarif layanan transportasi daring berdasarkan grafik persamaan garis lurus.',
      materi: 'Perbandingan Tarif Linear',
      indikatorSoal:
        'Disajikan tabel tarif awal dan tarif per kilometer dari dua penyedia jasa ojek daring, peserta didik dapat menganalisis pada jarak tempuh berapa kedua tarif bernilai sama dan merekomendasikan pilihan lebih hemat.',
      levelKognitif: 'C4',
      kataKerjaOperasional: 'Menganalisis',
      bentukSoal: 'Uraian',
      nomorSoal: '29',
      bobotSkor: 13,
    },
    {
      id: 'row-16',
      no: 16,
      capaianPembelajaran:
        'Peserta didik dapat menyelesaikan sistem persamaan linear dua variabel melalui beberapa cara untuk penyelesaian masalah kontekstual.',
      tujuanPembelajaran:
        'Merancang kombinasi paket penjualan produk bazar sekolah berbasis batasan modal dan target keuntungan menggunakan SPLDV.',
      materi: 'Pemodelan dan Optimasi Kontekstual SPLDV',
      indikatorSoal:
        'Disajikan data harga pokok produksi, harga jual, dan kapasitas stok dua jenis kudapan bazar kelas, peserta didik dapat merumuskan model SPLDV dan merancang strategi jumlah paket agar seluruh stok habis dengan target pendapatan tercapai.',
      levelKognitif: 'C6',
      kataKerjaOperasional: 'Merancang',
      bentukSoal: 'Uraian',
      nomorSoal: '30',
      bobotSkor: 14,
    },
  ],
};

export const CURATED_TEMPLATES: KisiBlueprint[] = [
  INITIAL_BLUEPRINT,
  {
    id: 'template-ipa-7-s2',
    updatedAt: '2026-11-18T10:00:00.000Z',
    catatanAhliEvaluasi:
      'Kisi-kisi IPA Kelas VII Semester 2 menekankan literasi sains Kurikulum Merdeka Fase D: pengamatan gejala alam, interpretasi data eksperimen gaya, rantai makanan, serta mitigasi tata surya dengan dominasi C3–C5.',
    config: {
      mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
      kelas: '7',
      semester: '2',
      jenisUjian: 'Sumatif Akhir Semester (SAS)',
      kurikulum: 'Kurikulum Merdeka (Fase D)',
      materiPokok:
        'Gerak dan Gaya (Hukum Newton), Klasifikasi Makhluk Hidup, Ekologi dan Keanekaragaman Hayati, Bumi dan Tata Surya',
      jumlahPG: 15,
      jumlahPGK: 3,
      jumlahIsian: 3,
      jumlahUraian: 2,
      proporsiKognitif: 'proporsional',
      namaSekolah: 'SMP Negeri 1 Nusantara',
      tahunAjaran: '2026/2027',
      namaPenyusun: 'Nadia Kusuma, S.Pd., Gr.',
      nipPenyusun: '19890615 201502 2 001',
      namaKepalaSekolah: 'Dra. Siti Rahmawati, M.Pd.',
      nipKepalaSekolah: '19710918 199802 2 003',
      alokasiWaktu: '90 Menit',
    },
    rows: [
      {
        id: 'ipa-1',
        no: 1,
        capaianPembelajaran:
          'Peserta didik memahami gerak, gaya, dan tekanan serta penerapannya dalam kehidupan sehari-hari.',
        tujuanPembelajaran:
          'Mengidentifikasi perbedaan antara kelajuan dan kecepatan serta jenis-jenis gaya pada benda.',
        materi: 'Gerak Lurus dan Gaya',
        indikatorSoal:
          'Disajikan tabel jarak tempuh dan waktu dua pelari, peserta didik dapat menyebutkan konsep besaran gerak yang tepat serta mengenali gaya gesek yang bekerja.',
        levelKognitif: 'C1',
        kataKerjaOperasional: 'Mengidentifikasi',
        bentukSoal: 'Pilihan Ganda',
        nomorSoal: '1, 2, 3',
        bobotSkor: 9,
      },
      {
        id: 'ipa-2',
        no: 2,
        capaianPembelajaran:
          'Peserta didik memahami gerak, gaya, dan tekanan serta penerapannya dalam kehidupan sehari-hari.',
        tujuanPembelajaran:
          'Menghitung percepatan benda berdasarkan Hukum II Newton.',
        materi: 'Hukum I, II, dan III Newton',
        indikatorSoal:
          'Disajikan gambar balok bermassa m yang didorong oleh dua gaya berlawanan arah, peserta didik dapat menghitung besar dan arah percepatan balok.',
        levelKognitif: 'C3',
        kataKerjaOperasional: 'Menghitung',
        bentukSoal: 'Pilihan Ganda',
        nomorSoal: '4, 5, 6',
        bobotSkor: 9,
      },
      {
        id: 'ipa-3',
        no: 3,
        capaianPembelajaran:
          'Peserta didik mampu melakukan klasifikasi makhluk hidup dan benda berdasarkan karakteristik yang diamati.',
        tujuanPembelajaran:
          'Mengklasifikasikan makhluk hidup menggunakan kunci dikotomi dan tata nama binomial.',
        materi: 'Klasifikasi Makhluk Hidup',
        indikatorSoal:
          'Disajikan bagan kunci determinasi sederhana untuk empat jenis hewan vertebrata, peserta didik dapat menafsirkan urutan nomor kunci dikotomi bagi hewan yang ditunjuk.',
        levelKognitif: 'C2',
        kataKerjaOperasional: 'Menafsirkan',
        bentukSoal: 'Pilihan Ganda',
        nomorSoal: '7, 8, 9',
        bobotSkor: 9,
      },
      {
        id: 'ipa-4',
        no: 4,
        capaianPembelajaran:
          'Peserta didik mengidentifikasi interaksi antar makhluk hidup dan lingkungannya serta merancang upaya-upaya mencegah dan mengatasi pencemaran dan perubahan iklim.',
        tujuanPembelajaran:
          'Menganalisis dampak perubahan populasi satu spesies terhadap keseimbangan jaring-jaring makanan.',
        materi: 'Ekologi dan Jaring-Jaring Makanan',
        indikatorSoal:
          'Disajikan skema jaring-jaring makanan ekosistem sawah dengan kasus penurunan drastis populasi ular akibat perburuan, peserta didik dapat menganalisis dampak berantai pada tingkat trofik lainnya.',
        levelKognitif: 'C4',
        kataKerjaOperasional: 'Menganalisis',
        bentukSoal: 'Pilihan Ganda',
        nomorSoal: '10, 11, 12',
        bobotSkor: 9,
      },
      {
        id: 'ipa-5',
        no: 5,
        capaianPembelajaran:
          'Peserta didik mengelaborasikan pemahamannya tentang posisi relatif bumi-bulan-matahari dalam sistem tata surya dan memahami struktur lapisan bumi.',
        tujuanPembelajaran:
          'Menghubungkan kemiringan sumbu rotasi Bumi dengan pergantian musim serta terjadinya gerhana.',
        materi: 'Bumi dan Tata Surya',
        indikatorSoal:
          'Disajikan diagram posisi Matahari, Bumi, dan Bulan, peserta didik dapat menentukan fenomena pasang surut air laut dan jenis gerhana yang terjadi di wilayah pengamatan.',
        levelKognitif: 'C3',
        kataKerjaOperasional: 'Menentukan',
        bentukSoal: 'Pilihan Ganda',
        nomorSoal: '13, 14, 15',
        bobotSkor: 9,
      },
      {
        id: 'ipa-6',
        no: 6,
        capaianPembelajaran:
          'Peserta didik mampu melakukan klasifikasi makhluk hidup dan mengidentifikasi interaksi ekosistem.',
        tujuanPembelajaran:
          'Menelaah ciri taksonomi dan bentuk simbiosis pada beberapa organisme.',
        materi: 'Simbiosis & Kunci Klasifikasi',
        indikatorSoal:
          'Disajikan studi kasus interaksi antara bakteri Rhizobium dengan akar kacang-kacangan serta data ciri lima kingdom, peserta didik dapat memilih beberapa pernyataan yang valid.',
        levelKognitif: 'C4',
        kataKerjaOperasional: 'Menelaah',
        bentukSoal: 'Pilihan Ganda Kompleks',
        nomorSoal: '16, 17, 18',
        bobotSkor: 12,
      },
      {
        id: 'ipa-7',
        no: 7,
        capaianPembelajaran:
          'Peserta didik memahami gerak, gaya, dan sistem tata surya.',
        tujuanPembelajaran:
          'Menjelaskan konsep resultan gaya, komponen biotik-abiotik, dan ciri planet dalam/luar.',
        materi: 'Gaya, Ekosistem, dan Planet',
        indikatorSoal:
          'Disajikan pernyataan rumpang tentang contoh Hukum III Newton, peran dekomposer, dan ciri planet bercincin, peserta didik dapat melengkapi jawaban singkat yang tepat.',
        levelKognitif: 'C2',
        kataKerjaOperasional: 'Menjelaskan',
        bentukSoal: 'Isian Singkat',
        nomorSoal: '19, 20, 21',
        bobotSkor: 12,
      },
      {
        id: 'ipa-8',
        no: 8,
        capaianPembelajaran:
          'Peserta didik mengidentifikasi interaksi antar makhluk hidup dan lingkungannya serta merancang upaya mencegah dan mengatasi pencemaran.',
        tujuanPembelajaran:
          'Mengevaluasi dan merancang solusi penanggulangan pencemaran air sungai akibat limbah domestik.',
        materi: 'Konservasi dan Pencemaran Lingkungan',
        indikatorSoal:
          'Disajikan data hasil uji kualitas air (pH, DO, BOD) di tiga titik aliran sungai dekat pemukiman, peserta didik dapat mengevaluasi tingkat pencemaran dan merancang dua langkah mitigasi berbasis sekolah.',
        levelKognitif: 'C6',
        kataKerjaOperasional: 'Merancang',
        bentukSoal: 'Uraian',
        nomorSoal: '22, 23',
        bobotSkor: 31,
      },
    ],
  },
  {
    id: 'template-bindo-9-s1',
    updatedAt: '2026-11-19T09:15:00.000Z',
    catatanAhliEvaluasi:
      'Kisi-kisi Bahasa Indonesia Kelas IX Semester 1 dirancang untuk mengukur literasi membaca teks deskripsi, prosedur, dan rekon pada level kognitif pemahaman literal (C2), penerapan kaidah kebahasaan (C3), hingga evaluasi kritis kohesi wacana (C5).',
    config: {
      mataPelajaran: 'Bahasa Indonesia',
      kelas: '9',
      semester: '1',
      jenisUjian: 'Sumatif Akhir Semester (SAS)',
      kurikulum: 'Kurikulum Merdeka (Fase D)',
      materiPokok:
        'Teks Deskripsi Bertema Sosial, Teks Prosedur Kompleks, Teks Rekon (Pengalaman dan Sejarah), Kohesi Koherensi dan EYD V',
      jumlahPG: 15,
      jumlahPGK: 2,
      jumlahIsian: 3,
      jumlahUraian: 2,
      proporsiKognitif: 'hots_fokus',
      namaSekolah: 'SMP Negeri 1 Nusantara',
      tahunAjaran: '2026/2027',
      namaPenyusun: 'Rina Marlina, S.Pd.',
      nipPenyusun: '19850322 201001 2 012',
      namaKepalaSekolah: 'Dra. Siti Rahmawati, M.Pd.',
      nipKepalaSekolah: '19710918 199802 2 003',
      alokasiWaktu: '90 Menit',
    },
    rows: [
      {
        id: 'bindo-1',
        no: 1,
        capaianPembelajaran:
          'Peserta didik mampu mengevaluasi informasi melalui penilaian ketepatan gagasan, pikiran, arahan, pandangan, atau pesan dari teks deskripsi dan rekon.',
        tujuanPembelajaran:
          'Mengidentifikasi ide pokok dan sudut pandang penceritaan dalam teks deskripsi bertema keluarga dan sosial.',
        materi: 'Ide Pokok dan Sudut Pandang Teks Deskripsi',
        indikatorSoal:
          'Disajikan kutipan teks deskripsi suasana pasar tradisional, peserta didik dapat menentukan gagasan utama paragraf dan citraan indrawi yang dominan.',
        levelKognitif: 'C2',
        kataKerjaOperasional: 'Menentukan',
        bentukSoal: 'Pilihan Ganda',
        nomorSoal: '1, 2, 3, 4',
        bobotSkor: 16,
      },
      {
        id: 'bindo-2',
        no: 2,
        capaianPembelajaran:
          'Peserta didik memahami kaidah kohesi, koherensi, dan penggunaan ejaan yang disempurnakan dalam teks tulis.',
        tujuanPembelajaran:
          'Menerapkan konjungsi antarkalimat dan tanda baca sesuai EYD V secara tepat.',
        materi: 'Kohesi, Koherensi, dan EYD V',
        indikatorSoal:
          'Disajikan paragraf rumpang dengan hubungan pertentangan dan sebab-akibat, peserta didik dapat melengkapi bagian rumpang menggunakan konjungsi yang tepat.',
        levelKognitif: 'C3',
        kataKerjaOperasional: 'Menerapkan',
        bentukSoal: 'Pilihan Ganda',
        nomorSoal: '5, 6, 7, 8',
        bobotSkor: 16,
      },
      {
        id: 'bindo-3',
        no: 3,
        capaianPembelajaran:
          'Peserta didik mampu memaknai kosakata baru dan menelaah struktur teks prosedur kompleks.',
        tujuanPembelajaran:
          'Menganalisis ketepatan urutan langkah dan kalimat imperatif pada teks prosedur.',
        materi: 'Struktur dan Kebahasaan Teks Prosedur',
        indikatorSoal:
          'Disajikan teks prosedur pembuatan kompos organik yang dua langkahnya tertukar, peserta didik dapat menganalisis perbaikan urutan agar prosedur berjalan logis.',
        levelKognitif: 'C4',
        kataKerjaOperasional: 'Menganalisis',
        bentukSoal: 'Pilihan Ganda',
        nomorSoal: '9, 10, 11, 12',
        bobotSkor: 16,
      },
      {
        id: 'bindo-4',
        no: 4,
        capaianPembelajaran:
          'Peserta didik mampu membandingkan fakta dan opini dalam teks rekon faktual dan pribadi.',
        tujuanPembelajaran:
          'Menilai keakuratan fakta sejarah dan keteladanan tokoh dalam teks rekon.',
        materi: 'Teks Rekon (Fakta vs Opini)',
        indikatorSoal:
          'Disajikan kutipan teks rekon sejarah perkembangan media cetak di Indonesia, peserta didik dapat menyimpulkan mana kalimat fakta historis dan opini penulis.',
        levelKognitif: 'C5',
        kataKerjaOperasional: 'Menyimpulkan',
        bentukSoal: 'Pilihan Ganda',
        nomorSoal: '13, 14, 15',
        bobotSkor: 12,
      },
      {
        id: 'bindo-5',
        no: 5,
        capaianPembelajaran:
          'Peserta didik mampu memaknai informasi tersirat dari teks multimodal (infografik dan teks prosedur).',
        tujuanPembelajaran:
          'Menelaah kesesuaian isi infografik dengan teks bacaan pendamping.',
        materi: 'Literasi Teks Multimodal',
        indikatorSoal:
          'Disajikan infografik alur pendaftaran perpustakaan digital dan empat pernyataan analisis, peserta didik dapat memilih pernyataan yang didukung bukti visual.',
        levelKognitif: 'C4',
        kataKerjaOperasional: 'Menelaah',
        bentukSoal: 'Pilihan Ganda Kompleks',
        nomorSoal: '16, 17',
        bobotSkor: 10,
      },
      {
        id: 'bindo-6',
        no: 6,
        capaianPembelajaran:
          'Peserta didik menguasai penulisan kata serapan, kata baku, dan kalimat efektif.',
        tujuanPembelajaran:
          'Memperbaiki kesalahan penulisan kata tidak baku dan kata serapan dalam kalimat.',
        materi: 'Kata Baku dan Serapan',
        indikatorSoal:
          'Disajikan tiga kalimat berisi kata serapan tidak baku (seperti "aktifitas", "resiko", "analisa"), peserta didik dapat menuliskan bentuk bakunya sesuai KBBI.',
        levelKognitif: 'C3',
        kataKerjaOperasional: 'Memperbaiki',
        bentukSoal: 'Isian Singkat',
        nomorSoal: '18, 19, 20',
        bobotSkor: 10,
      },
      {
        id: 'bindo-7',
        no: 7,
        capaianPembelajaran:
          'Peserta didik mampu menulis gagasan, pikiran, arahan dalam teks deskripsi dan prosedur secara kreatif dan terstruktur.',
        tujuanPembelajaran:
          'Menyusun teks prosedur singkat dan menyunting paragraf deskripsi yang kurang koheren.',
        materi: 'Produksi Teks Prosedur & Penyuntingan',
        indikatorSoal:
          'Disajikan data bahan dan tujuan kegiatan literasi digital sekolah, peserta didik dapat merancang teks prosedur 5 langkah yang efektif serta menyunting satu paragraf deskripsi menjadi padu.',
        levelKognitif: 'C6',
        kataKerjaOperasional: 'Merancang',
        bentukSoal: 'Uraian',
        nomorSoal: '21, 22',
        bobotSkor: 20,
      },
    ],
  },
];
