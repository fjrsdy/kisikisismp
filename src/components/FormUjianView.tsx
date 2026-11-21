import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Clock,
  ExternalLink,
  FileText,
  Flag,
  KeyRound,
  Link2,
  Lock,
  Maximize2,
  Pause,
  Play,
  Printer,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  GRADE_LABELS,
  SEMESTER_LABELS,
  SMP_SUBJECTS,
  getSuggestedTopics,
} from '../data/smpCurriculum';
import { SAMPLE_EXAM_PAPER } from '../data/sampleExamPaper';
import type {
  CbtSecurityConfig,
  CbtSharedSession,
  EssayQuestion,
  ExamFormSubmission,
  ExamPaperPackage,
  GradeSMP,
  KisiBlueprint,
  MultipleChoiceQuestion,
  Semester,
  ShortAnswerQuestion,
} from '../types/kisiKisi';
import { exportExamSubmissionToWordDoc } from '../utils/exportBlueprint';
import { generateLocalExamPaper } from '../utils/localEvaluationEngine';

export const STORAGE_FORM_SUBMISSIONS_KEY = 'evaluasi_smp_form_submissions_v1';
export const STORAGE_CBT_SESSIONS_KEY = 'evaluasi_smp_cbt_sessions_v1';

interface FormUjianViewProps {
  blueprint: KisiBlueprint;
  examPaper: ExamPaperPackage | null;
  onSwitchToGenerator: () => void;
  studentLockMode?: boolean;
  sharedSession?: CbtSharedSession | null;
  onOpenAnalisis?: () => void;
}

type OptionLetter = 'A' | 'B' | 'C' | 'D';
const OPTION_LETTERS: OptionLetter[] = ['A', 'B', 'C', 'D'];

interface FlatCbtItem {
  kind: 'pg' | 'isian' | 'uraian';
  key: string;
  nomor: number;
  label: string;
  pg?: MultipleChoiceQuestion;
  isian?: ShortAnswerQuestion;
  uraian?: EssayQuestion;
}

function parseMinutesFromAlokasi(alokasi: string): number {
  const match = alokasi.match(/\d+/);
  const mins = match ? parseInt(match[0], 10) : 90;
  return Number.isFinite(mins) && mins > 0 ? mins : 90;
}

function normalizeShortAnswer(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/×/g, 'x')
    .replace(/,/g, '.');
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateRandomToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function buildLocalSessionCode(subject: string): string {
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
  return `${prefix}-${generateRandomToken().slice(0, 4)}`;
}

export const FormUjianView: React.FC<FormUjianViewProps> = ({
  blueprint,
  examPaper,
  onSwitchToGenerator,
  studentLockMode = false,
  sharedSession = null,
  onOpenAnalisis,
}) => {
  const [useSamplePaper, setUseSamplePaper] = useState<boolean>(!examPaper);

  useEffect(() => {
    if (examPaper && !sharedSession) {
      setUseSamplePaper(false);
    }
  }, [examPaper, sharedSession]);

  const activePaper: ExamPaperPackage = sharedSession
    ? sharedSession.paper
    : !useSamplePaper && examPaper
      ? examPaper
      : SAMPLE_EXAM_PAPER;

  // CBT vs Full Form mode (locked to 'cbt' in student share-link mode)
  const [examMode, setExamMode] = useState<'cbt' | 'full'>('cbt');
  const isCbtMode = studentLockMode || examMode === 'cbt';

  // CBT Security configuration (controlled by teacher or inherited from sharedSession)
  const [security, setSecurity] = useState<CbtSecurityConfig>(
    sharedSession?.security ?? {
      acakSoal: true,
      acakOpsi: true,
      wajibFullscreen: true,
      blokirCopyKlikKanan: true,
      batasPelanggaranTab: 3,
      tokenUjian: '',
      tampilkanNilaiKeSiswa: true,
    }
  );

  useEffect(() => {
    if (sharedSession?.security) {
      setSecurity(sharedSession.security);
    }
  }, [sharedSession]);

  // Share Link per Subject panel state (teacher only)
  const [showSharePanel, setShowSharePanel] = useState<boolean>(false);
  const [shareSource, setShareSource] = useState<'active' | 'subject'>(
    examPaper ? 'active' : 'subject'
  );
  const [shareSubject, setShareSubject] = useState<string>(
    blueprint.config.mataPelajaran || SMP_SUBJECTS[0]
  );
  const [shareGrade, setShareGrade] = useState<GradeSMP>(blueprint.config.kelas);
  const [shareSemester, setShareSemester] = useState<Semester>(
    blueprint.config.semester
  );
  const [shareCountPreset, setShareCountPreset] = useState<
    'ringkas' | 'standar' | 'lengkap'
  >('standar');
  const [isCreatingShare, setIsCreatingShare] = useState<boolean>(false);
  const [createdShareInfo, setCreatedShareInfo] = useState<{
    code: string;
    url: string;
    subject: string;
    kelasLabel: string;
    token: string;
  } | null>(null);
  const [copiedShareUrl, setCopiedShareUrl] = useState<boolean>(false);
  const [savedCbtLinks, setSavedCbtLinks] = useState<CbtSharedSession[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CBT_SESSIONS_KEY);
      if (raw) return JSON.parse(raw) as CbtSharedSession[];
    } catch {
      // ignore
    }
    return [];
  });

  // Student identity & session config
  const [namaSiswa, setNamaSiswa] = useState<string>('');
  const [nis, setNis] = useState<string>('');
  const [kelasPeserta, setKelasPeserta] = useState<string>(
    sharedSession?.paper.kelasLabel || GRADE_LABELS[blueprint.config.kelas]
  );
  const [tokenInput, setTokenInput] = useState<string>('');
  const [kktp, setKktp] = useState<number>(sharedSession?.kktp ?? 75);

  // Active CBT runtime states
  const [cbtStarted, setCbtStarted] = useState<boolean>(false);
  const [cbtOrder, setCbtOrder] = useState<FlatCbtItem[]>([]);
  const [optionPermutations, setOptionPermutations] = useState<
    Record<number, OptionLetter[]>
  >({});
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [fontScale, setFontScale] = useState<'sm' | 'md' | 'lg'>('md');
  const [pelanggaranFokus, setPelanggaranFokus] = useState<number>(0);
  const [violationLog, setViolationLog] = useState<string[]>([]);
  const [showViolationModal, setShowViolationModal] = useState<boolean>(false);
  const [fullscreenLost, setFullscreenLost] = useState<boolean>(false);
  const [copyBlockedToast, setCopyBlockedToast] = useState<boolean>(false);

  const initialSeconds = useMemo(
    () => parseMinutesFromAlokasi(activePaper.alokasiWaktu) * 60,
    [activePaper.alokasiWaktu]
  );

  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Answers & flags
  const [pgAnswers, setPgAnswers] = useState<Record<number, OptionLetter | ''>>({});
  const [isianAnswers, setIsianAnswers] = useState<Record<number, string>>({});
  const [uraianAnswers, setUraianAnswers] = useState<Record<number, string>>({});
  const [flaggedKeys, setFlaggedKeys] = useState<Record<string, boolean>>({});
  const [sectionTab, setSectionTab] = useState<'all' | 'pg' | 'isian' | 'uraian'>(
    'all'
  );

  // Submission & review state
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmSubmitPrompt, setConfirmSubmitPrompt] = useState<boolean>(false);
  const [isSubmittingServer, setIsSubmittingServer] = useState<boolean>(false);
  const [submittedRecord, setSubmittedRecord] =
    useState<ExamFormSubmission | null>(null);
  const [studentShowScore, setStudentShowScore] = useState<boolean>(
    security.tampilkanNilaiKeSiswa
  );
  const [isianScores, setIsianScores] = useState<Record<number, number>>({});
  const [uraianScores, setUraianScores] = useState<Record<number, number>>({});

  // Persisted submissions list
  const [submissions, setSubmissions] = useState<ExamFormSubmission[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_FORM_SUBMISSIONS_KEY);
      if (raw) {
        return JSON.parse(raw) as ExamFormSubmission[];
      }
    } catch {
      // Fallback empty
    }
    return [];
  });
  const [isSyncingCbt, setIsSyncingCbt] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [copiedRecap, setCopiedRecap] = useState<boolean>(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setTimerRunning(false);
  }, [initialSeconds, activePaper.id]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_FORM_SUBMISSIONS_KEY,
        JSON.stringify(submissions)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [submissions]);

  const progressStats = useMemo(() => {
    const totalPG = activePaper.pilihanGanda.length;
    const totalIsian = activePaper.isianSingkat.length;
    const totalUraian = activePaper.uraian.length;
    const totalAll = totalPG + totalIsian + totalUraian;

    const answeredPG = activePaper.pilihanGanda.filter(
      (q) => Boolean(pgAnswers[q.nomor])
    ).length;
    const answeredIsian = activePaper.isianSingkat.filter(
      (q) => Boolean((isianAnswers[q.nomor] || '').trim())
    ).length;
    const answeredUraian = activePaper.uraian.filter(
      (q) => Boolean((uraianAnswers[q.nomor] || '').trim())
    ).length;

    const answeredTotal = answeredPG + answeredIsian + answeredUraian;
    const flaggedCount = Object.values(flaggedKeys).filter(Boolean).length;
    const unansweredTotal = Math.max(0, totalAll - answeredTotal);
    const pct = totalAll > 0 ? Math.round((answeredTotal / totalAll) * 100) : 0;

    return {
      totalAll,
      answeredTotal,
      unansweredTotal,
      flaggedCount,
      pct,
    };
  }, [activePaper, pgAnswers, isianAnswers, uraianAnswers, flaggedKeys]);

  const finalizeSubmit = useCallback(
    async (autoSubmitted = false, violationCountOverride?: number) => {
      const usedViolations =
        typeof violationCountOverride === 'number'
          ? violationCountOverride
          : pelanggaranFokus;
      const durasiDetik = Math.max(0, initialSeconds - secondsLeft);

      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }

      // If student is inside a shared CBT session, submit to server for tamper-proof grading
      if (sharedSession) {
        setIsSubmittingServer(true);
        try {
          const resp = await fetch(
            `/api/cbt/sessions/${encodeURIComponent(sharedSession.code)}/submit`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                namaSiswa: namaSiswa.trim(),
                nis: nis.trim(),
                kelas: kelasPeserta.trim() || activePaper.kelasLabel,
                pgAnswers,
                isianAnswers,
                uraianAnswers,
                durasiDetik,
                pelanggaranFokus: usedViolations,
                dikumpulkanOtomatis: autoSubmitted,
              }),
            }
          );
          if (resp.ok) {
            const data = (await resp.json()) as {
              submission: ExamFormSubmission;
              tampilkanNilaiKeSiswa: boolean;
            };
            setSubmittedRecord(data.submission);
            setStudentShowScore(data.tampilkanNilaiKeSiswa);
            setSubmissions((prev) => [data.submission, ...prev]);
            setTimerRunning(false);
            setCbtStarted(false);
            setShowViolationModal(false);
            setConfirmSubmitPrompt(false);
            setValidationError(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsSubmittingServer(false);
            return;
          }
        } catch {
          // Fall back to local grading if server unreachable
        } finally {
          setIsSubmittingServer(false);
        }
      }

      const maksPG = activePaper.pilihanGanda.length;
      const skorPG = activePaper.pilihanGanda.reduce((acc, q) => {
        return acc + (pgAnswers[q.nomor] === q.kunciJawaban ? 1 : 0);
      }, 0);

      const initialIsianScores: Record<number, number> = {};
      const maksIsian = activePaper.isianSingkat.length * 2;
      let skorIsian = 0;
      for (const q of activePaper.isianSingkat) {
        const studentNorm = normalizeShortAnswer(isianAnswers[q.nomor] || '');
        const keyNorm = normalizeShortAnswer(q.kunciJawaban);
        const pts = studentNorm && studentNorm === keyNorm ? 2 : 0;
        initialIsianScores[q.nomor] = pts;
        skorIsian += pts;
      }

      const initialUraianScores: Record<number, number> = {};
      const maksUraian = activePaper.uraian.reduce(
        (acc, q) => acc + (q.skorMaksimal || 5),
        0
      );
      for (const q of activePaper.uraian) {
        const hasText = Boolean((uraianAnswers[q.nomor] || '').trim());
        initialUraianScores[q.nomor] = hasText
          ? Math.ceil((q.skorMaksimal || 5) / 2)
          : 0;
      }
      const skorUraian = Object.values(initialUraianScores).reduce(
        (a, b) => a + b,
        0
      );

      const maksTotal = maksPG + maksIsian + maksUraian;
      const totalSkor = skorPG + skorIsian + skorUraian;
      const nilaiAkhir =
        maksTotal > 0 ? Math.round((totalSkor / maksTotal) * 1000) / 10 : 0;

      const record: ExamFormSubmission = {
        id: `sub-${Date.now()}`,
        namaSiswa: namaSiswa.trim() || 'Peserta CBT',
        nis: nis.trim(),
        kelas: kelasPeserta.trim() || activePaper.kelasLabel,
        judulUjian: activePaper.judulUjian,
        mataPelajaran: activePaper.mataPelajaran,
        pgAnswers: { ...pgAnswers },
        isianAnswers: { ...isianAnswers },
        uraianAnswers: { ...uraianAnswers },
        skorPG,
        maksPG,
        skorIsian,
        maksIsian,
        skorUraian,
        maksUraian,
        nilaiAkhir,
        durasiDetik,
        pelanggaranFokus: usedViolations,
        dikumpulkanOtomatis: autoSubmitted,
        cbtSessionCode: sharedSession?.code,
        submittedAt: new Date().toISOString(),
      };

      setIsianScores(initialIsianScores);
      setUraianScores(initialUraianScores);
      setSubmittedRecord(record);
      setStudentShowScore(security.tampilkanNilaiKeSiswa);
      setSubmissions((prev) => [record, ...prev]);
      fetch('/api/cbt/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission: record }),
      }).catch(() => {});
      setTimerRunning(false);
      setCbtStarted(false);
      setShowViolationModal(false);
      setConfirmSubmitPrompt(false);
      setValidationError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [
      pelanggaranFokus,
      initialSeconds,
      secondsLeft,
      sharedSession,
      namaSiswa,
      nis,
      kelasPeserta,
      activePaper,
      pgAnswers,
      isianAnswers,
      uraianAnswers,
      security.tampilkanNilaiKeSiswa,
    ]
  );

  // Auto-submit when CBT timer reaches 0
  useEffect(() => {
    if (isCbtMode && cbtStarted && !submittedRecord && secondsLeft === 0) {
      finalizeSubmit(true);
    }
  }, [isCbtMode, cbtStarted, submittedRecord, secondsLeft, finalizeSubmit]);

  // Anti-cheat listeners during active CBT session
  useEffect(() => {
    if (!isCbtMode || !cbtStarted || submittedRecord) return;

    const triggerViolation = (reason: string) => {
      const timeLabel = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setViolationLog((prev) => [`[${timeLabel}] ${reason}`, ...prev]);
      setPelanggaranFokus((prev) => {
        const next = prev + 1;
        if (
          security.batasPelanggaranTab > 0 &&
          next >= security.batasPelanggaranTab
        ) {
          window.setTimeout(() => {
            finalizeSubmit(true, next);
          }, 80);
        } else {
          setShowViolationModal(true);
        }
        return next;
      });
    };

    const handleVisibility = () => {
      if (document.hidden) {
        triggerViolation('Terdeteksi berpindah tab atau menyembunyikan layar CBT');
      }
    };

    const handleBlur = () => {
      if (!document.hidden) {
        triggerViolation('Fokus jendela ujian berpindah ke aplikasi/jendela lain');
      }
    };

    const handleFullscreenChange = () => {
      if (security.wajibFullscreen && !document.fullscreenElement) {
        setFullscreenLost(true);
      } else {
        setFullscreenLost(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!security.blokirCopyKlikKanan) return;
      const key = e.key.toLowerCase();
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      if (
        (ctrlOrMeta && ['c', 'x', 'a', 'u', 'p', 's'].includes(key)) ||
        e.key === 'F12' ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        setCopyBlockedToast(true);
        window.setTimeout(() => setCopyBlockedToast(false), 2200);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isCbtMode,
    cbtStarted,
    submittedRecord,
    security.batasPelanggaranTab,
    security.wajibFullscreen,
    security.blokirCopyKlikKanan,
    finalizeSubmit,
  ]);

  const handleStartCbt = () => {
    if (!namaSiswa.trim()) {
      setValidationError('Masukkan Nama Lengkap Peserta sebelum memulai CBT.');
      nameInputRef.current?.focus();
      return;
    }

    if (
      security.tokenUjian.trim() &&
      tokenInput.trim().toUpperCase() !== security.tokenUjian.trim().toUpperCase()
    ) {
      setValidationError(
        'Token ujian tidak sesuai. Periksa kembali token dari pengawas/guru.'
      );
      return;
    }

    setValidationError(null);

    const pgItems: FlatCbtItem[] = activePaper.pilihanGanda.map((q, idx) => ({
      kind: 'pg',
      key: `pg-${q.nomor}`,
      nomor: q.nomor,
      label: `${idx + 1}`,
      pg: q,
    }));
    const isianItems: FlatCbtItem[] = activePaper.isianSingkat.map((q) => ({
      kind: 'isian',
      key: `isian-${q.nomor}`,
      nomor: q.nomor,
      label: `I${q.nomor}`,
      isian: q,
    }));
    const uraianItems: FlatCbtItem[] = activePaper.uraian.map((q) => ({
      kind: 'uraian',
      key: `uraian-${q.nomor}`,
      nomor: q.nomor,
      label: `U${q.nomor}`,
      uraian: q,
    }));

    const orderedPg = security.acakSoal ? shuffleArray(pgItems) : pgItems;
    const orderedIsian = security.acakSoal ? shuffleArray(isianItems) : isianItems;
    const orderedUraian = security.acakSoal ? shuffleArray(uraianItems) : uraianItems;

    const perms: Record<number, OptionLetter[]> = {};
    for (const q of activePaper.pilihanGanda) {
      perms[q.nomor] = security.acakOpsi
        ? shuffleArray([...OPTION_LETTERS])
        : [...OPTION_LETTERS];
    }

    setOptionPermutations(perms);
    setCbtOrder([...orderedPg, ...orderedIsian, ...orderedUraian]);
    setCurrentIdx(0);
    setPelanggaranFokus(0);
    setViolationLog([]);
    setShowViolationModal(false);
    setSecondsLeft(initialSeconds);
    setTimerRunning(true);
    setCbtStarted(true);

    if (security.wajibFullscreen && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        setFullscreenLost(false);
      });
    }
  };

  const handleCreateShareLink = async () => {
    setIsCreatingShare(true);
    setValidationError(null);

    let targetPaper: ExamPaperPackage;
    if (shareSource === 'active' && examPaper) {
      targetPaper = examPaper;
    } else if (shareSource === 'active' && !examPaper) {
      targetPaper = SAMPLE_EXAM_PAPER;
    } else {
      const counts =
        shareCountPreset === 'ringkas'
          ? { pg: 10, isian: 5, uraian: 3 }
          : shareCountPreset === 'lengkap'
            ? { pg: 30, isian: 10, uraian: 5 }
            : { pg: 20, isian: 5, uraian: 3 };
      const topics = getSuggestedTopics(shareSubject, shareGrade, shareSemester);
      const kisiSummary = topics
        .map(
          (topic, i) =>
            `| ${i + 1} | CP ${shareSubject} | Memahami ${topic} | ${topic} | Peserta didik mampu menganalisis dan menyelesaikan masalah terkait ${topic} | C3 | Menerapkan | Pilihan Ganda | ${i + 1} | 10 |`
        )
        .join('\n');
      targetPaper = generateLocalExamPaper({
        kisiKisiText: kisiSummary,
        mataPelajaran: shareSubject,
        kelasLabel: GRADE_LABELS[shareGrade],
        semesterLabel: SEMESTER_LABELS[shareSemester],
        jenisUjian: blueprint.config.jenisUjian,
        namaSekolah: blueprint.config.namaSekolah,
        tahunAjaran: blueprint.config.tahunAjaran,
        alokasiWaktu: blueprint.config.alokasiWaktu || '90 Menit',
        jumlahPG: counts.pg,
        jumlahIsian: counts.isian,
        jumlahUraian: counts.uraian,
      });
    }

    let createdSession: CbtSharedSession | null = null;
    try {
      const resp = await fetch('/api/cbt/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper: targetPaper,
          kktp,
          security,
        }),
      });
      if (resp.ok) {
        const data = (await resp.json()) as { session: CbtSharedSession };
        createdSession = data.session;
      }
    } catch {
      // Fallback to local session creation below
    }

    if (!createdSession) {
      createdSession = {
        code: buildLocalSessionCode(targetPaper.mataPelajaran),
        paper: targetPaper,
        kktp,
        security: { ...security },
        createdAt: new Date().toISOString(),
      };
    }

    const updatedSessions = [
      createdSession,
      ...savedCbtLinks.filter((s) => s.code !== createdSession!.code),
    ].slice(0, 12);
    setSavedCbtLinks(updatedSessions);
    try {
      localStorage.setItem(
        STORAGE_CBT_SESSIONS_KEY,
        JSON.stringify(updatedSessions)
      );
    } catch {
      // ignore
    }

    const params = new URLSearchParams({
      cbt: createdSession.code,
      mapel: targetPaper.mataPelajaran,
      kelas: shareGrade,
      sem: shareSemester,
    });
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    setCreatedShareInfo({
      code: createdSession.code,
      url: shareUrl,
      subject: targetPaper.mataPelajaran,
      kelasLabel: targetPaper.kelasLabel,
      token: createdSession.security.tokenUjian,
    });

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShareUrl(true);
      window.setTimeout(() => setCopiedShareUrl(false), 2500);
    } catch {
      // Clipboard optional
    }

    setIsCreatingShare(false);
  };

  const handleSyncFromCbtServer = async () => {
    setIsSyncingCbt(true);
    setSyncNotice(null);
    try {
      const resp = await fetch('/api/cbt/submissions');
      if (resp.ok) {
        const data = (await resp.json()) as {
          submissions: ExamFormSubmission[];
        };
        const incoming = data.submissions || [];
        let added = 0;
        setSubmissions((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueIncoming = incoming.filter((item) => !existingIds.has(item.id));
          added = uniqueIncoming.length;
          return [...uniqueIncoming, ...prev];
        });
        setSyncNotice(
          added > 0
            ? `Berhasil menarik ${added} kiriman peserta baru dari link CBT.`
            : 'Semua kiriman link CBT sudah tersinkron.'
        );
      } else {
        setSyncNotice('Belum ada data kiriman baru di server.');
      }
    } catch {
      setSyncNotice('Tidak dapat terhubung ke server sinkronisasi CBT.');
    } finally {
      setIsSyncingCbt(false);
      window.setTimeout(() => setSyncNotice(null), 3500);
    }
  };

  useEffect(() => {
    if (studentLockMode) return;
    let cancelled = false;
    fetch('/api/cbt/submissions')
      .then((resp) => (resp.ok ? resp.json() : null))
      .then((data: { submissions?: ExamFormSubmission[] } | null) => {
        if (cancelled || !data?.submissions?.length) return;
        setSubmissions((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueIncoming = data.submissions!.filter(
            (item) => !existingIds.has(item.id)
          );
          if (uniqueIncoming.length === 0) return prev;
          return [...uniqueIncoming, ...prev];
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [studentLockMode]);

  const toggleFlag = (key: string) => {
    setFlaggedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const scrollToQuestion = (elementId: string) => {
    setSectionTab('all');
    window.requestAnimationFrame(() => {
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  };

  const handleRequestSubmit = () => {
    if (!namaSiswa.trim()) {
      setValidationError(
        'Masukkan Nama Lengkap Peserta terlebih dahulu sebelum mengumpulkan ujian.'
      );
      nameInputRef.current?.focus();
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setValidationError(null);

    if (progressStats.unansweredTotal > 0 && !confirmSubmitPrompt) {
      setConfirmSubmitPrompt(true);
      return;
    }

    finalizeSubmit(false);
  };

  const syncAdjustedScores = (
    nextIsianScores: Record<number, number>,
    nextUraianScores: Record<number, number>
  ) => {
    if (!submittedRecord) return;
    const skorIsian = Object.values(nextIsianScores).reduce((a, b) => a + b, 0);
    const skorUraian = Object.values(nextUraianScores).reduce((a, b) => a + b, 0);
    const maksTotal =
      submittedRecord.maksPG +
      submittedRecord.maksIsian +
      submittedRecord.maksUraian;
    const totalSkor = submittedRecord.skorPG + skorIsian + skorUraian;
    const nilaiAkhir =
      maksTotal > 0 ? Math.round((totalSkor / maksTotal) * 1000) / 10 : 0;

    const updated: ExamFormSubmission = {
      ...submittedRecord,
      skorIsian,
      skorUraian,
      nilaiAkhir,
    };

    setSubmittedRecord(updated);
    setSubmissions((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    fetch('/api/cbt/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission: updated }),
    }).catch(() => {});
  };

  const handleResetForNewStudent = () => {
    setNamaSiswa('');
    setNis('');
    setTokenInput('');
    setPgAnswers({});
    setIsianAnswers({});
    setUraianAnswers({});
    setFlaggedKeys({});
    setSubmittedRecord(null);
    setConfirmSubmitPrompt(false);
    setValidationError(null);
    setCbtStarted(false);
    setPelanggaranFokus(0);
    setViolationLog([]);
    setShowViolationModal(false);
    setSecondsLeft(initialSeconds);
    setTimerRunning(false);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyRecapForAnalysis = async () => {
    const lines = submissions.map(
      (s, idx) => `${idx + 1}\t${s.namaSiswa}\t${s.nilaiAkhir}`
    );
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopiedRecap(true);
    setTimeout(() => setCopiedRecap(false), 2000);
  };

  const activeItem = cbtOrder[currentIdx] || null;
  const textScaleClass =
    fontScale === 'sm'
      ? 'text-xs'
      : fontScale === 'lg'
        ? 'text-base'
        : 'text-sm';

  return (
    <div className="space-y-6">
      {!cbtStarted && !submittedRecord && (
        <section
          aria-labelledby="form-ujian-header"
          className="no-print rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2
                id="form-ujian-header"
                className="font-display text-base font-semibold text-slate-900"
              >
                {activePaper.judulUjian} — {isCbtMode ? 'Ujian Digital CBT' : 'Form Ujian Lengkap'}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {activePaper.namaSekolah} · {activePaper.kelasLabel} ·{' '}
                {activePaper.semesterLabel} · Alokasi {activePaper.alokasiWaktu} ·{' '}
                <span className="font-mono tabular-nums">
                  {activePaper.pilihanGanda.length} PG,{' '}
                  {activePaper.isianSingkat.length} Isian, {activePaper.uraian.length}{' '}
                  Uraian
                </span>
                {sharedSession ? ` · Sesi ${sharedSession.code}` : ''}
              </p>
            </div>

            {!studentLockMode && (
              <div className="flex flex-wrap items-center gap-2">
                <div
                  role="tablist"
                  aria-label="Pilih mode form ujian"
                  className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={examMode === 'cbt'}
                    onClick={() => setExamMode('cbt')}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                      examMode === 'cbt'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Model CBT (Anti-Contek)
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={examMode === 'full'}
                    onClick={() => setExamMode('full')}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                      examMode === 'full'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Form Semua Soal
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSharePanel((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                    showSharePanel
                      ? 'border-blue-800 bg-blue-800 text-white'
                      : 'border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100'
                  }`}
                >
                  <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Bagikan Link CBT Mapel</span>
                </button>

                {examPaper ? (
                  <div
                    role="group"
                    aria-label="Pilih paket soal form"
                    className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setUseSamplePaper(false);
                        handleResetForNewStudent();
                      }}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                        !useSamplePaper
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Naskah Aktif
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUseSamplePaper(true);
                        handleResetForNewStudent();
                      }}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                        useSamplePaper
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Contoh (18 Soal)
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onSwitchToGenerator}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Susun Soal Kisi-Kisi</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {!studentLockMode && showSharePanel && (
            <div className="rounded-xl border border-blue-200 bg-slate-50/80 p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-950">
                    Generator Share Link Ujian CBT per Mata Pelajaran
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Link yang dibuka siswa otomatis masuk ke Mode CBT Terkunci (navigasi guru, kunci jawaban, dan pembahasan disembunyikan).
                  </p>
                </div>
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setShareSource('subject')}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                      shareSource === 'subject'
                        ? 'bg-blue-800 text-white font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pilih Mata Pelajaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareSource('active')}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                      shareSource === 'active'
                        ? 'bg-blue-800 text-white font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Gunakan Naskah Aktif
                  </button>
                </div>
              </div>

              {shareSource === 'subject' && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-700 mb-1">
                      Mata Pelajaran
                    </span>
                    <select
                      value={shareSubject}
                      onChange={(e) => setShareSubject(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                    >
                      {SMP_SUBJECTS.map((subj) => (
                        <option key={subj} value={subj}>
                          {subj}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-700 mb-1">
                      Kelas SMP
                    </span>
                    <select
                      value={shareGrade}
                      onChange={(e) => setShareGrade(e.target.value as GradeSMP)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                    >
                      <option value="7">Kelas VII (1 SMP)</option>
                      <option value="8">Kelas VIII (2 SMP)</option>
                      <option value="9">Kelas IX (3 SMP)</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-700 mb-1">
                      Semester
                    </span>
                    <select
                      value={shareSemester}
                      onChange={(e) => setShareSemester(e.target.value as Semester)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                    >
                      <option value="1">Semester 1 (Ganjil)</option>
                      <option value="2">Semester 2 (Genap)</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-700 mb-1">
                      Komposisi Paket Soal
                    </span>
                    <select
                      value={shareCountPreset}
                      onChange={(e) =>
                        setShareCountPreset(
                          e.target.value as 'ringkas' | 'standar' | 'lengkap'
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                    >
                      <option value="ringkas">Ringkas (10 PG, 5 Isian, 3 Uraian)</option>
                      <option value="standar">Standar (20 PG, 5 Isian, 3 Uraian)</option>
                      <option value="lengkap">Lengkap (30 PG, 10 Isian, 5 Uraian)</option>
                    </select>
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-3 lg:grid-cols-12">
                <div className="lg:col-span-7 grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs text-slate-800">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={security.acakSoal}
                      onChange={(e) =>
                        setSecurity((s) => ({ ...s, acakSoal: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-slate-300 accent-blue-800"
                    />
                    <span>Acak urutan soal tiap siswa</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={security.acakOpsi}
                      onChange={(e) =>
                        setSecurity((s) => ({ ...s, acakOpsi: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-slate-300 accent-blue-800"
                    />
                    <span>Acak posisi opsi jawaban A–D</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={security.wajibFullscreen}
                      onChange={(e) =>
                        setSecurity((s) => ({
                          ...s,
                          wajibFullscreen: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 accent-blue-800"
                    />
                    <span>Wajib mode layar penuh (fullscreen)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={security.blokirCopyKlikKanan}
                      onChange={(e) =>
                        setSecurity((s) => ({
                          ...s,
                          blokirCopyKlikKanan: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 accent-blue-800"
                    />
                    <span>Blokir salin teks, klik kanan & cetak</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={security.tampilkanNilaiKeSiswa}
                      onChange={(e) =>
                        setSecurity((s) => ({
                          ...s,
                          tampilkanNilaiKeSiswa: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 accent-blue-800"
                    />
                    <span>
                      Tampilkan skor akhir ke siswa (kunci jawaban & pembahasan tetap disembunyikan)
                    </span>
                  </label>
                </div>

                <div className="lg:col-span-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-700 mb-1">
                      Batas Pindah Tab / Jendela
                    </span>
                    <select
                      value={security.batasPelanggaranTab}
                      onChange={(e) =>
                        setSecurity((s) => ({
                          ...s,
                          batasPelanggaranTab: Number(e.target.value),
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900"
                    >
                      <option value={1}>Ketat: 1x pindah tab auto-kumpul</option>
                      <option value={2}>2x pindah tab auto-kumpul</option>
                      <option value={3}>3x pindah tab auto-kumpul</option>
                      <option value={0}>Peringatan & catat log saja</option>
                    </select>
                  </label>

                  <div>
                    <label
                      htmlFor="token-guru-input"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Token Masuk Ujian (Opsional)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        id="token-guru-input"
                        type="text"
                        value={security.tokenUjian}
                        onChange={(e) =>
                          setSecurity((s) => ({
                            ...s,
                            tokenUjian: e.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="Tanpa token"
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs uppercase text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSecurity((s) => ({
                            ...s,
                            tokenUjian: generateRandomToken(),
                          }))
                        }
                        title="Buat token acak"
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                      >
                        Acak
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCreateShareLink}
                  disabled={isCreatingShare}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-800 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 disabled:bg-slate-300 whitespace-nowrap"
                >
                  <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {isCreatingShare
                      ? 'Menyiapkan Link CBT...'
                      : 'Buat & Salin Link Ujian CBT'}
                  </span>
                </button>

                {createdShareInfo && (
                  <div className="flex flex-1 flex-wrap items-center justify-end gap-2 min-w-[260px]">
                    <input
                      type="text"
                      readOnly
                      value={createdShareInfo.url}
                      aria-label="URL Share Link Ujian CBT"
                      className="flex-1 min-w-[200px] rounded-lg border border-blue-200 bg-white px-3 py-1.5 font-mono text-xs text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(createdShareInfo.url);
                        setCopiedShareUrl(true);
                        window.setTimeout(() => setCopiedShareUrl(false), 2000);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                    >
                      {copiedShareUrl ? (
                        <>
                          <CheckCircle2
                            className="h-3.5 w-3.5 text-emerald-700"
                            aria-hidden="true"
                          />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <ClipboardCopy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                    <a
                      href={createdShareInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Buka Link Siswa</span>
                    </a>
                  </div>
                )}
              </div>

              {createdShareInfo && (
                <p className="text-xs text-slate-600">
                  Link aktif untuk <strong>{createdShareInfo.subject}</strong> (
                  {createdShareInfo.kelasLabel}) · Kode Sesi:{' '}
                  <span className="font-mono font-semibold text-slate-900">
                    {createdShareInfo.code}
                  </span>
                  {createdShareInfo.token
                    ? ` · Token Masuk: ${createdShareInfo.token}`
                    : ' · Tanpa Token'}
                </p>
              )}
            </div>
          )}

          {!isCbtMode && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Peserta <span className="text-red-600">*</span>
                </span>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={namaSiswa}
                  onChange={(e) => {
                    setNamaSiswa(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Contoh: Aditya Pratama"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-semibold text-slate-700 mb-1">
                  NIS / Nomor Absen
                </span>
                <input
                  type="text"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  placeholder="Contoh: 01 / 2026001"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-semibold text-slate-700 mb-1">
                  Kelas / Rombel
                </span>
                <input
                  type="text"
                  value={kelasPeserta}
                  onChange={(e) => setKelasPeserta(e.target.value)}
                  placeholder="Contoh: VIII-A"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-semibold text-slate-700 mb-1">
                  Batas Ketuntasan (KKTP)
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={kktp}
                  onChange={(e) =>
                    setKktp(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-900 tabular-nums focus:border-blue-700 focus:outline-none"
                />
              </label>
            </div>
          )}

          {validationError && !isCbtMode && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800"
            >
              {validationError}
            </div>
          )}
        </section>
      )}

      {submittedRecord ? (
        studentLockMode ? (
          <section
            aria-labelledby="student-cbt-receipt"
            className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6"
          >
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Jawaban Ujian CBT Berhasil Dikumpulkan</span>
              </div>
              <h3
                id="student-cbt-receipt"
                className="mt-2 font-display text-xl font-bold text-slate-950"
              >
                {submittedRecord.namaSiswa}
                {submittedRecord.nis ? ` · ${submittedRecord.nis}` : ''}
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                {submittedRecord.kelas} · {activePaper.mataPelajaran} · Sesi{' '}
                {submittedRecord.cbtSessionCode || 'CBT'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-[11px] font-medium text-slate-500">
                  Waktu Pengerjaan
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-slate-950 tabular-nums">
                  {formatClock(submittedRecord.durasiDetik)}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <div className="text-[11px] font-medium text-slate-500">
                  Catatan Fokus CBT
                </div>
                <div
                  className={`mt-1 font-mono text-lg font-bold tabular-nums ${
                    (submittedRecord.pelanggaranFokus ?? 0) > 0
                      ? 'text-amber-800'
                      : 'text-emerald-800'
                  }`}
                >
                  {submittedRecord.pelanggaranFokus ?? 0}x
                </div>
              </div>

              {studentShowScore ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-semibold text-blue-900">
                    Skor Sementara
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold text-blue-950 tabular-nums">
                    {submittedRecord.nilaiAkhir}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-medium text-slate-500">
                    Status Pengumpulan
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    Terkirim ke Guru
                  </div>
                </div>
              )}
            </div>

            {submittedRecord.dikumpulkanOtomatis && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-950">
                Ujian dikumpulkan secara otomatis karena batas waktu habis atau batas pelanggaran berpindah tab telah tercapai.
              </div>
            )}

            <p className="text-xs leading-relaxed text-slate-600">
              Terima kasih telah mengikuti ujian secara jujur. Kunci jawaban dan pembahasan hanya dapat dilihat oleh guru mata pelajaran untuk menjaga kerahasiaan instrumen evaluasi.
            </p>
          </section>
        ) : (
          <div className="space-y-6">
            <section
              aria-labelledby="exam-result-heading"
              className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-900">
                    Bukti Pengumpulan & Koreksi Form Ujian
                  </p>
                  <h3
                    id="exam-result-heading"
                    className="mt-1 font-display text-xl font-bold text-slate-950"
                  >
                    {submittedRecord.namaSiswa}
                    {submittedRecord.nis ? ` · ${submittedRecord.nis}` : ''}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {submittedRecord.kelas} · {activePaper.judulUjian} · Durasi:{' '}
                    <span className="font-mono tabular-nums">
                      {formatClock(submittedRecord.durasiDetik)}
                    </span>{' '}
                    · Pelanggaran Fokus:{' '}
                    <span className="font-mono font-semibold tabular-nums">
                      {submittedRecord.pelanggaranFokus ?? 0}x
                    </span>
                    {submittedRecord.dikumpulkanOtomatis
                      ? ' (Auto-Submit CBT)'
                      : ''}
                  </p>
                </div>

                <div className="no-print flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      exportExamSubmissionToWordDoc(activePaper, submittedRecord, kktp)
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Unduh Lembar Jawaban (.doc)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  >
                    <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Cetak Bukti PDF</span>
                  </button>
                  {onOpenAnalisis && (
                    <button
                      type="button"
                      onClick={onOpenAnalisis}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 whitespace-nowrap"
                    >
                      <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Analisis Hasil Ujian</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetForNewStudent}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-900 whitespace-nowrap"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Peserta Baru / Ulangi Form</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[11px] font-medium text-slate-500">
                    Skor Pilihan Ganda
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-slate-950 tabular-nums">
                    {submittedRecord.skorPG} / {submittedRecord.maksPG}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[11px] font-medium text-slate-500">
                    Skor Isian Singkat
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-slate-950 tabular-nums">
                    {submittedRecord.skorIsian} / {submittedRecord.maksIsian}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <div className="text-[11px] font-medium text-slate-500">
                    Skor Uraian
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-slate-950 tabular-nums">
                    {submittedRecord.skorUraian} / {submittedRecord.maksUraian}
                  </div>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3">
                  <div className="text-[11px] font-semibold text-blue-900">
                    Nilai Akhir
                  </div>
                  <div className="mt-1 font-mono text-2xl font-bold text-blue-950 tabular-nums">
                    {submittedRecord.nilaiAkhir}
                  </div>
                </div>
                <div
                  className={`rounded-lg border p-3 ${
                    submittedRecord.nilaiAkhir >= kktp
                      ? 'border-emerald-200 bg-emerald-50/60'
                      : 'border-red-200 bg-red-50/60'
                  }`}
                >
                  <div
                    className={`text-[11px] font-semibold ${
                      submittedRecord.nilaiAkhir >= kktp
                        ? 'text-emerald-900'
                        : 'text-red-900'
                    }`}
                  >
                    Status (KKTP {kktp})
                  </div>
                  <div
                    className={`mt-1 text-base font-bold ${
                      submittedRecord.nilaiAkhir >= kktp
                        ? 'text-emerald-950'
                        : 'text-red-950'
                    }`}
                  >
                    {submittedRecord.nilaiAkhir >= kktp
                      ? 'Tuntas'
                      : 'Belum Tuntas'}
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-2">
                {activePaper.pilihanGanda.length > 0 && (
                  <div>
                    <h4 className="border-b border-slate-200 pb-2 font-display text-sm font-bold text-slate-900 mb-3">
                      A. Koreksi Otomatis Pilihan Ganda
                    </h4>
                    <div className="space-y-3">
                      {activePaper.pilihanGanda.map((q) => {
                        const chosen = submittedRecord.pgAnswers[q.nomor] || '';
                        const isCorrect = chosen === q.kunciJawaban;
                        return (
                          <div
                            key={q.id}
                            className="rounded-lg border border-slate-200 p-4 text-xs space-y-2"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="text-sm font-medium text-slate-900 flex-1">
                                <span className="font-mono font-bold mr-2 tabular-nums">
                                  {q.nomor}.
                                </span>
                                {q.pertanyaan}
                              </p>
                              <span
                                className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
                                  isCorrect
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                    : 'border-red-200 bg-red-50 text-red-900'
                                }`}
                              >
                                {isCorrect ? 'Benar (+1)' : 'Salah (0)'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs">
                              <span>
                                Jawaban Peserta:{' '}
                                <strong className="font-mono text-slate-950">
                                  {chosen ? `${chosen}. ${q.pilihan[chosen]}` : 'Tidak dijawab'}
                                </strong>
                              </span>
                              <span className="text-emerald-900">
                                Kunci:{' '}
                                <strong className="font-mono">
                                  {q.kunciJawaban}. {q.pilihan[q.kunciJawaban]}
                                </strong>
                              </span>
                            </div>
                            <p className="text-slate-600">
                              <strong className="text-slate-800">Pembahasan:</strong>{' '}
                              {q.pembahasan}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activePaper.isianSingkat.length > 0 && (
                  <div>
                    <h4 className="border-b border-slate-200 pb-2 font-display text-sm font-bold text-slate-900 mb-3">
                      B. Koreksi & Verifikasi Skor Isian Singkat (Maks 2/soal)
                    </h4>
                    <div className="space-y-3">
                      {activePaper.isianSingkat.map((q) => {
                        const ans = submittedRecord.isianAnswers[q.nomor] || '';
                        const score = isianScores[q.nomor] ?? 0;
                        return (
                          <div
                            key={q.id}
                            className="rounded-lg border border-slate-200 p-4 text-xs space-y-2"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <p className="text-sm font-medium text-slate-900 flex-1">
                                <span className="font-mono font-bold mr-2 tabular-nums">
                                  {q.nomor}.
                                </span>
                                {q.pertanyaan}
                              </p>
                              <div className="no-print flex items-center gap-1.5 shrink-0">
                                <span className="text-[11px] font-semibold text-slate-600">
                                  Skor:
                                </span>
                                {[0, 1, 2].map((pts) => (
                                  <button
                                    key={pts}
                                    type="button"
                                    onClick={() => {
                                      const next = { ...isianScores, [q.nomor]: pts };
                                      setIsianScores(next);
                                      syncAdjustedScores(next, uraianScores);
                                    }}
                                    className={`h-7 w-7 rounded border font-mono text-xs font-semibold tabular-nums ${
                                      score === pts
                                        ? 'border-blue-800 bg-blue-800 text-white'
                                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    {pts}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                                <span className="font-semibold text-slate-700">
                                  Jawaban Peserta:
                                </span>{' '}
                                <span className="font-mono text-slate-950">
                                  {ans.trim() || '(Kosong)'}
                                </span>
                              </div>
                              <div className="rounded border border-emerald-200 bg-emerald-50/50 px-3 py-2">
                                <span className="font-semibold text-emerald-900">
                                  Kunci Jawaban:
                                </span>{' '}
                                <span className="font-mono font-semibold text-emerald-950">
                                  {q.kunciJawaban}
                                </span>
                              </div>
                            </div>
                            <p className="text-slate-600">{q.pedomanPenskoran}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activePaper.uraian.length > 0 && (
                  <div>
                    <h4 className="border-b border-slate-200 pb-2 font-display text-sm font-bold text-slate-900 mb-3">
                      C. Penilaian Rubrik Uraian (Sesuaikan Skor Guru)
                    </h4>
                    <div className="space-y-3">
                      {activePaper.uraian.map((q) => {
                        const ans = submittedRecord.uraianAnswers[q.nomor] || '';
                        const maxPts = q.skorMaksimal || 5;
                        const score = uraianScores[q.nomor] ?? 0;
                        return (
                          <div
                            key={q.id}
                            className="rounded-lg border border-slate-200 p-4 text-xs space-y-2.5"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <p className="text-sm font-medium text-slate-900 flex-1">
                                <span className="font-mono font-bold mr-2 tabular-nums">
                                  {q.nomor}.
                                </span>
                                {q.pertanyaan}
                              </p>
                              <label className="no-print flex items-center gap-2 shrink-0">
                                <span className="text-[11px] font-semibold text-slate-700">
                                  Skor (0–{maxPts}):
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  max={maxPts}
                                  value={score}
                                  onChange={(e) => {
                                    const val = Math.max(
                                      0,
                                      Math.min(maxPts, Number(e.target.value) || 0)
                                    );
                                    const next = { ...uraianScores, [q.nomor]: val };
                                    setUraianScores(next);
                                    syncAdjustedScores(isianScores, next);
                                  }}
                                  className="w-16 rounded-md border border-slate-300 px-2 py-1 text-center font-mono text-xs font-bold text-slate-950 tabular-nums focus:border-blue-700 focus:outline-none"
                                />
                              </label>
                            </div>

                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                              <div className="rounded border border-slate-200 bg-slate-50 p-3">
                                <div className="font-semibold text-slate-800 mb-1">
                                  Jawaban Peserta:
                                </div>
                                <p className="whitespace-pre-line text-slate-900">
                                  {ans.trim() || '(Tidak menjawab)'}
                                </p>
                              </div>
                              <div className="rounded border border-emerald-200 bg-emerald-50/40 p-3">
                                <div className="font-semibold text-emerald-900 mb-1">
                                  Kunci Penyelesaian:
                                </div>
                                <p className="whitespace-pre-line text-emerald-950">
                                  {q.kunciJawaban}
                                </p>
                              </div>
                            </div>

                            <p className="whitespace-pre-line text-slate-600">
                              <strong className="text-slate-800">
                                Pedoman Penskoran:
                              </strong>{' '}
                              {q.pedomanPenskoran}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )
      ) : isCbtMode && !cbtStarted ? (
        <section
          aria-labelledby="cbt-lobby-heading"
          className="rounded-xl border border-slate-200 bg-white p-5 sm:p-8"
        >
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            <div className="lg:col-span-6 space-y-5">
              <div>
                <p className="text-xs font-semibold text-blue-900">
                  {activePaper.mataPelajaran} · {activePaper.kelasLabel}
                </p>
                <h3
                  id="cbt-lobby-heading"
                  className="mt-1 font-display text-xl font-bold text-slate-950"
                >
                  Masuk Ruang Ujian CBT
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Isi identitas peserta dengan benar. Saat ujian dimulai, sistem menerapkan pengawasan CBT (1 soal per layar dan deteksi perpindahan tab).
                </p>
              </div>

              <div className="space-y-3">
                <label className="block">
                  <span className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap Peserta <span className="text-red-600">*</span>
                  </span>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={namaSiswa}
                    onChange={(e) => {
                      setNamaSiswa(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="Ketik nama lengkap Anda..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                  />
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-700 mb-1">
                      NIS / Nomor Absen
                    </span>
                    <input
                      type="text"
                      value={nis}
                      onChange={(e) => setNis(e.target.value)}
                      placeholder="Contoh: 14 / 2026014"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-700 mb-1">
                      Kelas / Rombel
                    </span>
                    <input
                      type="text"
                      value={kelasPeserta}
                      onChange={(e) => setKelasPeserta(e.target.value)}
                      placeholder="Contoh: VIII-A"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
                    />
                  </label>
                </div>

                {security.tokenUjian.trim() && (
                  <label className="block">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                      <KeyRound className="h-3.5 w-3.5 text-blue-800" aria-hidden="true" />
                      <span>Token Ujian dari Pengawas</span>
                      <span className="text-red-600">*</span>
                    </span>
                    <input
                      type="text"
                      value={tokenInput}
                      onChange={(e) => {
                        setTokenInput(e.target.value.toUpperCase());
                        if (validationError) setValidationError(null);
                      }}
                      placeholder="Masukkan token ujian..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm font-bold tracking-widest uppercase text-slate-950 focus:border-blue-700 focus:outline-none"
                    />
                  </label>
                )}
              </div>

              {validationError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800"
                >
                  {validationError}
                </div>
              )}

              <button
                type="button"
                onClick={handleStartCbt}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-900"
              >
                <Lock className="h-4 w-4" aria-hidden="true" />
                <span>Mulai Ujian CBT Sekarang</span>
              </button>
            </div>

            <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <ShieldCheck className="h-4 w-4 text-blue-800" aria-hidden="true" />
                <h4 className="font-display text-sm font-bold text-slate-900">
                  Ketentuan & Pengamanan Anti-Contek CBT
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                  <div className="text-[11px] text-slate-500">Total Butir</div>
                  <div className="mt-0.5 font-mono text-base font-bold text-slate-950 tabular-nums">
                    {progressStats.totalAll}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                  <div className="text-[11px] text-slate-500">Waktu</div>
                  <div className="mt-0.5 font-mono text-base font-bold text-slate-950 tabular-nums">
                    {activePaper.alokasiWaktu}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                  <div className="text-[11px] text-slate-500">Batas Pindah Tab</div>
                  <div className="mt-0.5 font-mono text-base font-bold text-slate-950 tabular-nums">
                    {security.batasPelanggaranTab > 0
                      ? `${security.batasPelanggaranTab}x`
                      : 'Log'}
                  </div>
                </div>
              </div>

              <ul className="space-y-2 text-xs leading-relaxed text-slate-700">
                <li className="flex items-start gap-2">
                  <Shuffle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-800" aria-hidden="true" />
                  <span>
                    <strong>Tampilan 1 Soal per Layar:</strong> Soal{' '}
                    {security.acakSoal ? 'diacak per peserta' : 'berurutan'} dan opsi jawaban{' '}
                    {security.acakOpsi ? 'diacak otomatis' : 'sesuai naskah'}.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
                  <span>
                    <strong>Deteksi Pindah Tab / Jendela:</strong> Membuka tab lain, jendela baru, atau aplikasi pencarian dicatat otomatis sebagai pelanggaran fokus
                    {security.batasPelanggaranTab > 0
                      ? ` dan ujian terkumpul otomatis setelah ${security.batasPelanggaranTab}x pelanggaran.`
                      : '.'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-700" aria-hidden="true" />
                  <span>
                    <strong>Proteksi Konten:</strong>{' '}
                    {security.blokirCopyKlikKanan
                      ? 'Salin teks, klik kanan, tangkapan cetak, serta tombol pengembang diblokir.'
                      : 'Proteksi klik kanan nonaktif.'}{' '}
                    {security.wajibFullscreen
                      ? 'Ujian berjalan pada mode layar penuh.'
                      : ''}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      ) : isCbtMode && cbtStarted && activeItem ? (
        <div
          className={`space-y-4 ${security.blokirCopyKlikKanan ? 'select-none' : ''}`}
          onCopy={(e) => {
            if (!security.blokirCopyKlikKanan) return;
            e.preventDefault();
            setCopyBlockedToast(true);
            window.setTimeout(() => setCopyBlockedToast(false), 2200);
          }}
          onCut={(e) => {
            if (!security.blokirCopyKlikKanan) return;
            e.preventDefault();
          }}
          onContextMenu={(e) => {
            if (!security.blokirCopyKlikKanan) return;
            e.preventDefault();
            setCopyBlockedToast(true);
            window.setTimeout(() => setCopyBlockedToast(false), 2200);
          }}
        >
          {fullscreenLost && security.wajibFullscreen && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-950"
            >
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                <span>
                  Layar penuh keluar saat ujian berlangsung. Kembalikan ke mode layar penuh untuk menjaga fokus ujian CBT.
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  document.documentElement.requestFullscreen?.().catch(() => {})
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-950 whitespace-nowrap"
              >
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Kembali ke Layar Penuh</span>
              </button>
            </div>
          )}

          {copyBlockedToast && (
            <div
              role="status"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-900"
            >
              Penyalinan teks, klik kanan, dan pencetakan halaman dinonaktifkan selama ujian CBT berlangsung.
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            <section
              aria-labelledby="cbt-active-question"
              className="lg:col-span-8 rounded-xl border border-slate-200 bg-white overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-3.5">
                <div className="text-xs text-slate-700">
                  <span className="font-semibold text-slate-950">
                    {activePaper.mataPelajaran}
                  </span>
                  <span className="mx-1.5 text-slate-300">·</span>
                  <span className="font-mono font-bold text-blue-900 tabular-nums">
                    Soal {currentIdx + 1} dari {cbtOrder.length}
                  </span>
                  <span className="mx-1.5 text-slate-300">·</span>
                  <span>
                    {activeItem.kind === 'pg'
                      ? 'Pilihan Ganda'
                      : activeItem.kind === 'isian'
                        ? 'Isian Singkat'
                        : 'Uraian'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    role="group"
                    aria-label="Ukuran huruf soal"
                    className="inline-flex items-center rounded-md border border-slate-200 bg-white p-0.5 text-[11px]"
                  >
                    {(['sm', 'md', 'lg'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setFontScale(sz)}
                        className={`rounded px-2 py-0.5 font-semibold ${
                          fontScale === sz
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {sz === 'sm' ? 'A-' : sz === 'md' ? 'A' : 'A+'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7 space-y-5 min-h-[340px]">
                {activeItem.kind === 'pg' && activeItem.pg && (
                  <div className="space-y-4">
                    {activeItem.pg.stimulus && activeItem.pg.stimulus !== '-' && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-800 whitespace-pre-line">
                        {activeItem.pg.stimulus}
                      </div>
                    )}

                    <h3
                      id="cbt-active-question"
                      className={`${textScaleClass} font-medium leading-relaxed text-slate-950`}
                    >
                      {activeItem.pg.pertanyaan}
                    </h3>

                    <div className="space-y-2.5 pt-1">
                      {(optionPermutations[activeItem.pg.nomor] ?? OPTION_LETTERS).map(
                        (originalKey, displayIdx) => {
                          const displayLetter = OPTION_LETTERS[displayIdx];
                          const chosen =
                            pgAnswers[activeItem.pg!.nomor] === originalKey;
                          return (
                            <label
                              key={originalKey}
                              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
                                chosen
                                  ? 'border-blue-800 bg-blue-50/75 text-blue-950 font-semibold'
                                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`cbt-pg-${activeItem.pg!.nomor}`}
                                checked={chosen}
                                onChange={() =>
                                  setPgAnswers((prev) => ({
                                    ...prev,
                                    [activeItem.pg!.nomor]: originalKey,
                                  }))
                                }
                                className="mt-0.5 h-4 w-4 shrink-0 accent-blue-800"
                              />
                              <span className={`${textScaleClass} leading-relaxed`}>
                                <span className="font-mono font-bold mr-2">
                                  {displayLetter}.
                                </span>
                                {activeItem.pg!.pilihan[originalKey]}
                              </span>
                            </label>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                {activeItem.kind === 'isian' && activeItem.isian && (
                  <div className="space-y-4">
                    {activeItem.isian.stimulus &&
                      activeItem.isian.stimulus !== '-' && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-800 whitespace-pre-line">
                          {activeItem.isian.stimulus}
                        </div>
                      )}

                    <label
                      id="cbt-active-question"
                      htmlFor={`cbt-isian-${activeItem.isian.nomor}`}
                      className={`block ${textScaleClass} font-medium leading-relaxed text-slate-950`}
                    >
                      {activeItem.isian.pertanyaan}
                    </label>

                    <input
                      id={`cbt-isian-${activeItem.isian.nomor}`}
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={isianAnswers[activeItem.isian.nomor] || ''}
                      onChange={(e) =>
                        setIsianAnswers((prev) => ({
                          ...prev,
                          [activeItem.isian!.nomor]: e.target.value,
                        }))
                      }
                      placeholder="Ketik jawaban singkat Anda di sini..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                    />
                  </div>
                )}

                {activeItem.kind === 'uraian' && activeItem.uraian && (
                  <div className="space-y-4">
                    {activeItem.uraian.stimulus &&
                      activeItem.uraian.stimulus !== '-' && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-800 whitespace-pre-line">
                          {activeItem.uraian.stimulus}
                        </div>
                      )}

                    <label
                      id="cbt-active-question"
                      htmlFor={`cbt-uraian-${activeItem.uraian.nomor}`}
                      className={`block ${textScaleClass} font-medium leading-relaxed text-slate-950`}
                    >
                      {activeItem.uraian.pertanyaan}
                      <span className="ml-2 font-mono text-xs font-normal text-slate-500 tabular-nums">
                        (Skor Maks: {activeItem.uraian.skorMaksimal})
                      </span>
                    </label>

                    <textarea
                      id={`cbt-uraian-${activeItem.uraian.nomor}`}
                      rows={6}
                      spellCheck={false}
                      value={uraianAnswers[activeItem.uraian.nomor] || ''}
                      onChange={(e) =>
                        setUraianAnswers((prev) => ({
                          ...prev,
                          [activeItem.uraian!.nomor]: e.target.value,
                        }))
                      }
                      placeholder="Tuliskan langkah penyelesaian dan jawaban uraian Anda di sini..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-relaxed text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-3.5">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-45 whitespace-nowrap"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Sebelumnya</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleFlag(activeItem.key)}
                  aria-pressed={Boolean(flaggedKeys[activeItem.key])}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold whitespace-nowrap ${
                    flaggedKeys[activeItem.key]
                      ? 'border-amber-400 bg-amber-100 text-amber-950'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {flaggedKeys[activeItem.key] ? 'Ditandai Ragu' : 'Tandai Ragu-Ragu'}
                  </span>
                </button>

                {currentIdx < cbtOrder.length - 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentIdx((i) => Math.min(cbtOrder.length - 1, i + 1))
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-800 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900 whitespace-nowrap"
                  >
                    <span>Selanjutnya</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestSubmit}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap"
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Kumpulkan Jawaban</span>
                  </button>
                )}
              </div>
            </section>

            <aside className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">
                      Peserta Ujian CBT
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      {namaSiswa} {nis ? `(${nis})` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-medium text-slate-500">
                      Sisa Waktu
                    </div>
                    <div
                      className={`font-mono text-lg font-bold tabular-nums ${
                        secondsLeft <= 300 ? 'text-red-700' : 'text-slate-950'
                      }`}
                    >
                      {formatClock(secondsLeft)}
                    </div>
                  </div>
                </div>

                <div
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                    pelanggaranFokus > 0
                      ? 'border-amber-200 bg-amber-50 text-amber-950'
                      : 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Pengawasan Fokus</span>
                  </span>
                  <span className="font-mono font-bold tabular-nums">
                    {pelanggaranFokus}
                    {security.batasPelanggaranTab > 0
                      ? ` / ${security.batasPelanggaranTab}`
                      : 'x'}
                  </span>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">
                      Progres Pengerjaan
                    </span>
                    <span className="font-mono font-semibold text-blue-900 tabular-nums">
                      {progressStats.answeredTotal}/{progressStats.totalAll} ({progressStats.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      style={{ width: `${progressStats.pct}%` }}
                      className="h-full bg-blue-800 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2.5 border-t border-slate-100 pt-3">
                  <div className="text-xs font-semibold text-slate-800">
                    Navigasi Nomor Soal CBT
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {cbtOrder.map((item, idx) => {
                      const answered =
                        item.kind === 'pg'
                          ? Boolean(pgAnswers[item.nomor])
                          : item.kind === 'isian'
                            ? Boolean((isianAnswers[item.nomor] || '').trim())
                            : Boolean((uraianAnswers[item.nomor] || '').trim());
                      const flagged = Boolean(flaggedKeys[item.key]);
                      const isCurrent = idx === currentIdx;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setCurrentIdx(idx)}
                          className={`h-8 rounded border font-mono text-xs font-semibold tabular-nums transition-colors ${
                            isCurrent
                              ? 'ring-2 ring-slate-900 border-slate-900'
                              : ''
                          } ${
                            flagged
                              ? 'border-amber-400 bg-amber-50 text-amber-950'
                              : answered
                                ? 'border-blue-800 bg-blue-800 text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2.5 w-2.5 rounded-xs bg-blue-800" />
                      Terjawab
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2.5 w-2.5 rounded-xs border border-amber-400 bg-amber-50" />
                      Ragu
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2.5 w-2.5 rounded-xs border border-slate-300 bg-white" />
                      Kosong
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2.5">
                  {confirmSubmitPrompt && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 space-y-2">
                      <p className="font-medium">
                        Masih terdapat{' '}
                        <strong className="font-mono tabular-nums">
                          {progressStats.unansweredTotal}
                        </strong>{' '}
                        soal kosong. Yakin kumpulkan sekarang?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isSubmittingServer}
                          onClick={() => finalizeSubmit(false)}
                          className="flex-1 rounded-md bg-blue-800 px-3 py-1.5 font-semibold text-white hover:bg-blue-900"
                        >
                          Ya, Kumpulkan
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmSubmitPrompt(false)}
                          className="rounded-md border border-amber-300 bg-white px-3 py-1.5 font-medium text-amber-950 hover:bg-amber-100"
                        >
                          Periksa Lagi
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isSubmittingServer}
                    onClick={handleRequestSubmit}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-900 disabled:bg-slate-400"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {isSubmittingServer
                        ? 'Mengirim Jawaban...'
                        : 'Kumpulkan Jawaban Ujian'}
                    </span>
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div
                role="tablist"
                aria-label="Filter bagian form ujian"
                className="flex flex-wrap items-center gap-1"
              >
                {(
                  [
                    { id: 'all', label: 'Semua Bagian' },
                    {
                      id: 'pg',
                      label: `A. Pilihan Ganda (${activePaper.pilihanGanda.length})`,
                    },
                    {
                      id: 'isian',
                      label: `B. Isian (${activePaper.isianSingkat.length})`,
                    },
                    {
                      id: 'uraian',
                      label: `C. Uraian (${activePaper.uraian.length})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={sectionTab === tab.id}
                    onClick={() => setSectionTab(tab.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      sectionTab === tab.id
                        ? 'bg-blue-800 text-white font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <span className="font-mono text-xs text-slate-600 tabular-nums">
                Terjawab: <strong>{progressStats.answeredTotal}</strong> /{' '}
                {progressStats.totalAll}
              </span>
            </div>

            {(sectionTab === 'all' || sectionTab === 'pg') &&
              activePaper.pilihanGanda.length > 0 && (
                <section
                  aria-labelledby="form-pg-title"
                  className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5"
                >
                  <div className="border-b border-slate-100 pb-3">
                    <h3
                      id="form-pg-title"
                      className="font-display text-base font-bold text-slate-950"
                    >
                      Bagian A. Pilihan Ganda ({activePaper.pilihanGanda.length}{' '}
                      Soal)
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Pilih satu jawaban yang paling tepat (A, B, C, atau D).
                    </p>
                  </div>

                  <div className="space-y-6">
                    {activePaper.pilihanGanda.map((q) => {
                      const selected = pgAnswers[q.nomor] || '';
                      const flagKey = `pg-${q.nomor}`;
                      const isFlagged = Boolean(flaggedKeys[flagKey]);
                      return (
                        <fieldset
                          key={q.id}
                          id={`soal-pg-${q.nomor}`}
                          className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <legend className="text-sm font-medium leading-relaxed text-slate-950">
                              <span className="font-mono font-bold mr-2 tabular-nums">
                                {q.nomor}.
                              </span>
                              {q.stimulus && q.stimulus !== '-' && (
                                <span className="mb-2 block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-normal leading-relaxed text-slate-800 whitespace-pre-line">
                                  {q.stimulus}
                                </span>
                              )}
                              {q.pertanyaan}
                            </legend>
                            <button
                              type="button"
                              onClick={() => toggleFlag(flagKey)}
                              aria-pressed={isFlagged}
                              className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                                isFlagged
                                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                                  : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <Flag className="h-3 w-3" aria-hidden="true" />
                              <span>{isFlagged ? 'Ragu-ragu' : 'Tandai'}</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {OPTION_LETTERS.map((opt) => {
                              const checked = selected === opt;
                              return (
                                <label
                                  key={opt}
                                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs transition-colors ${
                                    checked
                                      ? 'border-blue-800 bg-blue-50/70 text-blue-950 font-semibold'
                                      : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`pg-${q.nomor}`}
                                    value={opt}
                                    checked={checked}
                                    onChange={() =>
                                      setPgAnswers((prev) => ({
                                        ...prev,
                                        [q.nomor]: opt,
                                      }))
                                    }
                                    className="mt-0.5 h-4 w-4 shrink-0 accent-blue-800"
                                  />
                                  <span className="leading-relaxed">
                                    <span className="font-mono font-bold mr-1.5">
                                      {opt}.
                                    </span>
                                    {q.pilihan[opt]}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </fieldset>
                      );
                    })}
                  </div>
                </section>
              )}

            {(sectionTab === 'all' || sectionTab === 'isian') &&
              activePaper.isianSingkat.length > 0 && (
                <section
                  aria-labelledby="form-isian-title"
                  className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5"
                >
                  <div className="border-b border-slate-100 pb-3">
                    <h3
                      id="form-isian-title"
                      className="font-display text-base font-bold text-slate-950"
                    >
                      Bagian B. Isian Singkat ({activePaper.isianSingkat.length}{' '}
                      Soal)
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Ketikkan jawaban singkat yang paling tepat pada kolom yang tersedia.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {activePaper.isianSingkat.map((q) => {
                      const val = isianAnswers[q.nomor] || '';
                      const flagKey = `isian-${q.nomor}`;
                      const isFlagged = Boolean(flaggedKeys[flagKey]);
                      return (
                        <div
                          key={q.id}
                          id={`soal-isian-${q.nomor}`}
                          className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <label
                              htmlFor={`input-isian-${q.nomor}`}
                              className="text-sm font-medium leading-relaxed text-slate-950 flex-1"
                            >
                              <span className="font-mono font-bold mr-2 tabular-nums">
                                {q.nomor}.
                              </span>
                              {q.stimulus && q.stimulus !== '-' && (
                                <span className="mb-2 block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-normal leading-relaxed text-slate-800 whitespace-pre-line">
                                  {q.stimulus}
                                </span>
                              )}
                              {q.pertanyaan}
                            </label>
                            <button
                              type="button"
                              onClick={() => toggleFlag(flagKey)}
                              aria-pressed={isFlagged}
                              className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                                isFlagged
                                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                                  : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <Flag className="h-3 w-3" aria-hidden="true" />
                              <span>{isFlagged ? 'Ragu-ragu' : 'Tandai'}</span>
                            </button>
                          </div>

                          <input
                            id={`input-isian-${q.nomor}`}
                            type="text"
                            value={val}
                            onChange={(e) =>
                              setIsianAnswers((prev) => ({
                                ...prev,
                                [q.nomor]: e.target.value,
                              }))
                            }
                            placeholder="Tulis jawaban singkat Anda di sini..."
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

            {(sectionTab === 'all' || sectionTab === 'uraian') &&
              activePaper.uraian.length > 0 && (
                <section
                  aria-labelledby="form-uraian-title"
                  className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5"
                >
                  <div className="border-b border-slate-100 pb-3">
                    <h3
                      id="form-uraian-title"
                      className="font-display text-base font-bold text-slate-950"
                    >
                      Bagian C. Uraian ({activePaper.uraian.length} Soal)
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Tuliskan langkah penyelesaian dan kesimpulan secara runtut dan jelas.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {activePaper.uraian.map((q) => {
                      const val = uraianAnswers[q.nomor] || '';
                      const flagKey = `uraian-${q.nomor}`;
                      const isFlagged = Boolean(flaggedKeys[flagKey]);
                      return (
                        <div
                          key={q.id}
                          id={`soal-uraian-${q.nomor}`}
                          className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <label
                              htmlFor={`input-uraian-${q.nomor}`}
                              className="text-sm font-medium leading-relaxed text-slate-950 flex-1"
                            >
                              <span className="font-mono font-bold mr-2 tabular-nums">
                                {q.nomor}.
                              </span>
                              {q.stimulus && q.stimulus !== '-' && (
                                <span className="mb-2 block rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-normal leading-relaxed text-slate-800 whitespace-pre-line">
                                  {q.stimulus}
                                </span>
                              )}
                              {q.pertanyaan}
                              <span className="ml-2 font-mono text-xs font-normal text-slate-500 tabular-nums">
                                (Skor Maks: {q.skorMaksimal})
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => toggleFlag(flagKey)}
                              aria-pressed={isFlagged}
                              className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                                isFlagged
                                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                                  : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <Flag className="h-3 w-3" aria-hidden="true" />
                              <span>{isFlagged ? 'Ragu-ragu' : 'Tandai'}</span>
                            </button>
                          </div>

                          <textarea
                            id={`input-uraian-${q.nomor}`}
                            rows={4}
                            value={val}
                            onChange={(e) =>
                              setUraianAnswers((prev) => ({
                                ...prev,
                                [q.nomor]: e.target.value,
                              }))
                            }
                            placeholder="Tuliskan langkah pengerjaan atau uraian jawaban Anda di sini..."
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-950 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
          </div>

          <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Clock className="h-4 w-4 text-blue-800" aria-hidden="true" />
                  <span>Sisa Waktu Ujian</span>
                </div>
                <span
                  className={`font-mono text-lg font-bold tabular-nums ${
                    secondsLeft <= 300 ? 'text-red-700' : 'text-slate-950'
                  }`}
                >
                  {formatClock(secondsLeft)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimerRunning((r) => !r)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {timerRunning ? (
                    <>
                      <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Jeda Timer</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Jalankan Timer</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setSecondsLeft(initialSeconds);
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Reset</span>
                </button>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">
                    Progres Pengerjaan
                  </span>
                  <span className="font-mono font-semibold text-blue-900 tabular-nums">
                    {progressStats.answeredTotal}/{progressStats.totalAll} ({progressStats.pct}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    style={{ width: `${progressStats.pct}%` }}
                    className="h-full bg-blue-800 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div className="text-xs font-semibold text-slate-800">
                  Navigasi Nomor Soal
                </div>

                {activePaper.pilihanGanda.length > 0 && (
                  <div className="grid grid-cols-6 gap-1.5">
                    {activePaper.pilihanGanda.map((q) => {
                      const answered = Boolean(pgAnswers[q.nomor]);
                      const flagged = Boolean(flaggedKeys[`pg-${q.nomor}`]);
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => scrollToQuestion(`soal-pg-${q.nomor}`)}
                          className={`h-8 rounded border font-mono text-xs font-semibold tabular-nums transition-colors ${
                            flagged
                              ? 'border-amber-400 bg-amber-50 text-amber-950'
                              : answered
                                ? 'border-blue-800 bg-blue-800 text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {q.nomor}
                        </button>
                      );
                    })}
                  </div>
                )}

                {activePaper.isianSingkat.length > 0 && (
                  <div className="grid grid-cols-6 gap-1.5">
                    {activePaper.isianSingkat.map((q) => {
                      const answered = Boolean((isianAnswers[q.nomor] || '').trim());
                      const flagged = Boolean(flaggedKeys[`isian-${q.nomor}`]);
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => scrollToQuestion(`soal-isian-${q.nomor}`)}
                          className={`h-8 rounded border font-mono text-xs font-semibold tabular-nums transition-colors ${
                            flagged
                              ? 'border-amber-400 bg-amber-50 text-amber-950'
                              : answered
                                ? 'border-blue-800 bg-blue-800 text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          I{q.nomor}
                        </button>
                      );
                    })}
                  </div>
                )}

                {activePaper.uraian.length > 0 && (
                  <div className="grid grid-cols-6 gap-1.5">
                    {activePaper.uraian.map((q) => {
                      const answered = Boolean((uraianAnswers[q.nomor] || '').trim());
                      const flagged = Boolean(flaggedKeys[`uraian-${q.nomor}`]);
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => scrollToQuestion(`soal-uraian-${q.nomor}`)}
                          className={`h-8 rounded border font-mono text-xs font-semibold tabular-nums transition-colors ${
                            flagged
                              ? 'border-amber-400 bg-amber-50 text-amber-950'
                              : answered
                                ? 'border-blue-800 bg-blue-800 text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          U{q.nomor}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2.5">
                {confirmSubmitPrompt && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 space-y-2">
                    <p className="font-medium">
                      Masih terdapat{' '}
                      <strong className="font-mono tabular-nums">
                        {progressStats.unansweredTotal}
                      </strong>{' '}
                      soal yang belum diisi. Kumpulkan jawaban sekarang?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => finalizeSubmit(false)}
                        className="flex-1 rounded-md bg-blue-800 px-3 py-1.5 font-semibold text-white hover:bg-blue-900"
                      >
                        Ya, Kumpulkan
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmSubmitPrompt(false)}
                        className="rounded-md border border-amber-300 bg-white px-3 py-1.5 font-medium text-amber-950 hover:bg-amber-100"
                      >
                        Periksa Lagi
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRequestSubmit}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-900"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  <span>Kumpulkan Jawaban Ujian</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {showViolationModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cbt-violation-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-amber-300 bg-white p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="h-6 w-6 shrink-0 text-amber-600 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <h3
                  id="cbt-violation-title"
                  className="font-display text-base font-bold text-slate-950"
                >
                  Peringatan Pengawasan Fokus CBT
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-700">
                  Sistem mendeteksi Anda meninggalkan halaman atau berpindah jendela saat ujian berlangsung.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold text-slate-900">
                <span>Total Pelanggaran Fokus</span>
                <span className="font-mono tabular-nums text-amber-800">
                  {pelanggaranFokus}
                  {security.batasPelanggaranTab > 0
                    ? ` dari ${security.batasPelanggaranTab}`
                    : 'x'}
                </span>
              </div>
              {security.batasPelanggaranTab > 0 && (
                <p className="text-[11px] text-slate-600">
                  Jika mencapai {security.batasPelanggaranTab} pelanggaran, lembar ujian akan dikumpulkan otomatis oleh sistem.
                </p>
              )}
              {violationLog[0] && (
                <p className="font-mono text-[11px] text-slate-500 pt-1">
                  {violationLog[0]}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowViolationModal(false);
                if (security.wajibFullscreen && !document.fullscreenElement) {
                  document.documentElement.requestFullscreen?.().catch(() => {});
                }
              }}
              className="w-full rounded-lg bg-blue-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-900"
            >
              Saya Mengerti, Lanjutkan Ujian
            </button>
          </div>
        </div>
      )}

      {!studentLockMode && (
        <section
          aria-labelledby="rekap-peserta-heading"
          className="no-print rounded-xl border border-slate-200 bg-white overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
            <div>
              <h3
                id="rekap-peserta-heading"
                className="font-display text-base font-semibold text-slate-900"
              >
                Rekap Hasil Pengumpulan Form & Link CBT ({submissions.length} Peserta)
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Tarik kiriman peserta dari Share Link CBT atau muat langsung ke menu Evaluasi Hasil.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSyncFromCbtServer}
                disabled={isSyncingCbt}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100 whitespace-nowrap"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isSyncingCbt ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>Sinkronkan Hasil Link CBT</span>
              </button>

              {submissions.length > 0 && (
                <>
                  {onOpenAnalisis && (
                    <button
                      type="button"
                      onClick={onOpenAnalisis}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-900 whitespace-nowrap"
                    >
                      <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Analisis Hasil &amp; Tindak Lanjut</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCopyRecapForAnalysis}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  >
                    {copiedRecap ? (
                      <>
                        <CheckCircle2
                          className="h-3.5 w-3.5 text-emerald-700"
                          aria-hidden="true"
                        />
                        <span>Tersalin (Format Excel)</span>
                      </>
                    ) : (
                      <>
                        <ClipboardCopy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Salin Nilai (Excel/Analisis)</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissions([]);
                      fetch('/api/cbt/submissions', { method: 'DELETE' }).catch(() => {});
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 whitespace-nowrap"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Kosongkan Rekap</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {syncNotice && (
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-2 text-xs text-slate-700">
              {syncNotice}
            </div>
          )}

          {submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
                    <th className="w-12 px-3 py-2.5 text-center">No</th>
                    <th className="px-3 py-2.5">Nama Peserta</th>
                    <th className="px-3 py-2.5">Mata Pelajaran / Sesi</th>
                    <th className="px-3 py-2.5">Kelas</th>
                    <th className="px-3 py-2.5 text-right">PG</th>
                    <th className="px-3 py-2.5 text-right">Isian</th>
                    <th className="px-3 py-2.5 text-right">Uraian</th>
                    <th className="px-3 py-2.5 text-center">Fokus CBT</th>
                    <th className="px-3 py-2.5 text-right">Nilai Akhir</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="w-16 px-3 py-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {submissions.map((sub, idx) => {
                    const isTuntas = sub.nilaiAkhir >= kktp;
                    const vCount = sub.pelanggaranFokus ?? 0;
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/75">
                        <td className="px-3 py-2.5 text-center font-mono text-slate-500 tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-900">
                          <div>{sub.namaSiswa}</div>
                          {sub.nis && (
                            <div className="font-mono text-[11px] text-slate-500">
                              NIS: {sub.nis}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          <div>{sub.mataPelajaran}</div>
                          {sub.cbtSessionCode && (
                            <div className="font-mono text-[11px] text-slate-500">
                              {sub.cbtSessionCode}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">{sub.kelas}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                          {sub.skorPG}/{sub.maksPG}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                          {sub.skorIsian}/{sub.maksIsian}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                          {sub.skorUraian}/{sub.maksUraian}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono tabular-nums">
                          <span
                            className={
                              vCount > 0 ? 'font-semibold text-amber-800' : 'text-slate-600'
                            }
                          >
                            {vCount}x{sub.dikumpulkanOtomatis ? ' (Auto)' : ''}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-950 tabular-nums">
                          {sub.nilaiAkhir}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                              isTuntas
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                : 'border-red-200 bg-red-50 text-red-900'
                            }`}
                          >
                            {isTuntas ? 'Tuntas' : 'Belum Tuntas'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            type="button"
                            aria-label={`Hapus hasil ${sub.namaSiswa}`}
                            onClick={() =>
                              setSubmissions((prev) =>
                                prev.filter((item) => item.id !== sub.id)
                              )
                            }
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-xs text-slate-500">
              Belum ada peserta yang mengumpulkan ujian. Gunakan form CBT di atas atau bagikan link CBT per mata pelajaran ke siswa, lalu klik <strong>Sinkronkan Hasil Link CBT</strong>.
            </div>
          )}
        </section>
      )}
    </div>
  );
};
