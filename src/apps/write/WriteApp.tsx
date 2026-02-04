import HanziWriter, { type StrokeData } from "hanzi-writer";
import { useEffect, useMemo, useRef, useState } from "react";
import { UnitSelector } from "../../components/UnitSelector";
import { getWriteWordsForUnits, type UnitId, type Word } from "../../data/words";
import { burstConfetti } from "../../lib/confetti";
import { shuffleInPlace } from "../../lib/random";
import { playDing, playPop, playTada } from "../../lib/sfx";
import { speakChineseSequence, stopSpeech } from "../../lib/speech";

export type WriteAppProps = {
  onHome?: () => void;
};

const AUDIO_STORAGE_KEY = "learncn.write.audioEnabled";

const PROMPT_ZH = "这个字怎么写？";
const STREAK_MILESTONE = 10;
const AUTO_ADD_UNIT_2_STREAK = 10;
const AUTO_ADD_UNIT_3_STREAK = 20;
const CELEBRATION_STEP_MS = 260;
const CELEBRATION_BUFFER_MS = 220;
const NEXT_DELAY_MS = 900;
const NEXT_CHARACTER_DELAY_MS = 520;
const MAX_CHARACTER_ATTEMPTS = 3;
const FLASH_DURATION_MS = 650;
const USER_BRUSH_FILTER_ID = "learncn-user-brush";
const RETRY_RESTART_DELAY_MS = 820;

function ensureUserBrushFilter(container: HTMLElement): void {
  const svg = container.querySelector("svg");
  if (!svg) return;
  if (svg.querySelector(`#${USER_BRUSH_FILTER_ID}`)) return;

  const svgNS = "http://www.w3.org/2000/svg";
  const defs =
    svg.querySelector("defs") ?? svg.insertBefore(document.createElementNS(svgNS, "defs"), svg.firstChild);

  const filter = document.createElementNS(svgNS, "filter");
  filter.setAttribute("id", USER_BRUSH_FILTER_ID);
  filter.setAttribute("x", "-20%");
  filter.setAttribute("y", "-20%");
  filter.setAttribute("width", "140%");
  filter.setAttribute("height", "140%");
  filter.setAttribute("color-interpolation-filters", "sRGB");

  const blur = document.createElementNS(svgNS, "feGaussianBlur");
  blur.setAttribute("in", "SourceGraphic");
  blur.setAttribute("stdDeviation", "0.55");
  blur.setAttribute("result", "blur");

  const noise = document.createElementNS(svgNS, "feTurbulence");
  noise.setAttribute("type", "fractalNoise");
  noise.setAttribute("baseFrequency", "0.9");
  noise.setAttribute("numOctaves", "1");
  noise.setAttribute("seed", "2");
  noise.setAttribute("result", "noise");

  const displacement = document.createElementNS(svgNS, "feDisplacementMap");
  displacement.setAttribute("in", "blur");
  displacement.setAttribute("in2", "noise");
  displacement.setAttribute("scale", "1.0");
  displacement.setAttribute("xChannelSelector", "R");
  displacement.setAttribute("yChannelSelector", "G");
  displacement.setAttribute("result", "displaced");

  const shadow = document.createElementNS(svgNS, "feDropShadow");
  shadow.setAttribute("dx", "0");
  shadow.setAttribute("dy", "1");
  shadow.setAttribute("stdDeviation", "0.85");
  shadow.setAttribute("flood-color", "rgb(15, 23, 42)");
  shadow.setAttribute("flood-opacity", "0.35");
  shadow.setAttribute("result", "shadow");

  const merge = document.createElementNS(svgNS, "feMerge");
  const mergeShadow = document.createElementNS(svgNS, "feMergeNode");
  mergeShadow.setAttribute("in", "shadow");
  const mergeDisplaced = document.createElementNS(svgNS, "feMergeNode");
  mergeDisplaced.setAttribute("in", "displaced");
  const mergeSource = document.createElementNS(svgNS, "feMergeNode");
  mergeSource.setAttribute("in", "SourceGraphic");
  merge.appendChild(mergeShadow);
  merge.appendChild(mergeDisplaced);
  merge.appendChild(mergeSource);

  filter.appendChild(blur);
  filter.appendChild(noise);
  filter.appendChild(displacement);
  filter.appendChild(shadow);
  filter.appendChild(merge);
  defs.appendChild(filter);
}

function loadStoredBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === null) return fallback;
    return stored === "true";
  } catch {
    return fallback;
  }
}

function storeBool(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function makeDeck(previousWordId: string | null, ids: string[]): string[] {
  const deck = [...ids];
  shuffleInPlace(deck);

  if (previousWordId && deck.length > 1 && deck[deck.length - 1] === previousWordId) {
    [deck[deck.length - 1], deck[deck.length - 2]] = [deck[deck.length - 2], deck[deck.length - 1]];
  }

  return deck;
}

function firstHanziCharacter(text: string): string | null {
  const chars = Array.from(text.trim());
  return chars.length > 0 ? chars[0] : null;
}

function computeTotalStrokesFallback(strokeData: StrokeData): number {
  return Math.max(1, strokeData.strokeNum + strokeData.strokesRemaining + 1);
}

export default function WriteApp({ onHome }: WriteAppProps) {
  const [selectedUnits, setSelectedUnits] = useState<UnitId[]>([1]);
  const autoUnitsEnabledRef = useRef(true);
  const lastAutoAddedUnitRef = useRef<UnitId>(1);

  const activeWords = useMemo(() => getWriteWordsForUnits(selectedUnits), [selectedUnits]);
  const activeWordIds = useMemo(() => activeWords.map((word) => word.id), [activeWords]);
  const activeWordIdsKey = useMemo(() => activeWordIds.join("|"), [activeWordIds]);

  const wordsById = useMemo<Record<string, Word>>(() => {
    return Object.fromEntries(activeWords.map((word) => [word.id, word])) as Record<string, Word>;
  }, [activeWords]);

  const activeWordIdsRef = useRef<string[]>(activeWordIds);
  const wordsByIdRef = useRef<Record<string, Word>>(wordsById);

  const [started, setStarted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(() => loadStoredBool(AUDIO_STORAGE_KEY, true));

  const audioEnabledRef = useRef(audioEnabled);
  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  const [word, setWord] = useState<Word | null>(null);
  const [characterIndex, setCharacterIndex] = useState(0);
  const [characterAttempt, setCharacterAttempt] = useState(1);
  const [quizKey, setQuizKey] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState<number | null>(null);
  const [strokeProgress, setStrokeProgress] = useState<{ done: number; total: number } | null>(null);
  const [mistakePulse, setMistakePulse] = useState<{ token: number; strokeNum: number } | null>(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [streakFlash, setStreakFlash] = useState<{ token: number; value: number } | null>(null);

  const deckRef = useRef<string[]>([]);
  const lastWordIdRef = useRef<string | null>(null);
  const nextTimeoutRef = useRef<number | null>(null);
  const celebrationTimeoutsRef = useRef<number[]>([]);
  const lastCelebratedStreakRef = useRef<number>(0);
  const hadMistakeThisWordRef = useRef<boolean>(false);
  const streakRef = useRef<number>(0);
  const flashTokenRef = useRef<number>(0);
  const mistakeTokenRef = useRef<number>(0);
  const totalStrokesRef = useRef<number | null>(null);
  const characterAttemptRef = useRef(1);
  const characterAttemptKeyRef = useRef<string | null>(null);

  const writerRef = useRef<HanziWriter | null>(null);
  const nextStrokeNumRef = useRef<number>(0);
  const [boardEl, setBoardEl] = useState<HTMLDivElement | null>(null);
  const [boardSize, setBoardSize] = useState(0);
  const lastPromptedKeyRef = useRef<string | null>(null);
  const lastCompletedCharacterRef = useRef<string | null>(null);

  const wordCharacters = useMemo(() => (word ? Array.from(word.hanzi) : []), [word?.id]);
  const currentCharacter = wordCharacters[characterIndex] ?? null;

  useEffect(() => {
    activeWordIdsRef.current = activeWordIds;
  }, [activeWordIdsKey]);

  useEffect(() => {
    wordsByIdRef.current = wordsById;
  }, [wordsById]);

  function toggleUnit(unit: UnitId): void {
    autoUnitsEnabledRef.current = false;
    setSelectedUnits((prev) => {
      const has = prev.includes(unit);
      const next = has ? prev.filter((u) => u !== unit) : [...prev, unit];
      if (next.length === 0) return prev;
      next.sort((a, b) => a - b);
      return next;
    });
  }

  function clearNextTimeout(): void {
    if (nextTimeoutRef.current === null) return;
    window.clearTimeout(nextTimeoutRef.current);
    nextTimeoutRef.current = null;
  }

  function clearCelebrationTimeouts(): void {
    for (const timeoutId of celebrationTimeoutsRef.current) {
      window.clearTimeout(timeoutId);
    }
    celebrationTimeoutsRef.current = [];
  }

  function flashStreak(value: number): void {
    flashTokenRef.current += 1;
    const token = flashTokenRef.current;
    setStreakFlash({ token, value });

    celebrationTimeoutsRef.current.push(
      window.setTimeout(() => {
        setStreakFlash((current) => (current?.token === token ? null : current));
      }, FLASH_DURATION_MS),
    );
  }

  function pulseMistake(strokeNum: number): void {
    mistakeTokenRef.current += 1;
    const token = mistakeTokenRef.current;
    setMistakePulse({ token, strokeNum });
    window.setTimeout(() => {
      setMistakePulse((current) => (current?.token === token ? null : current));
    }, 520);
  }

  function nextWord(): Word | null {
    if (currentCharacter) lastCompletedCharacterRef.current = currentCharacter;
    clearNextTimeout();
    clearCelebrationTimeouts();
    stopSpeech();
    hadMistakeThisWordRef.current = false;
    nextStrokeNumRef.current = 0;
    setCharacterIndex(0);
    setTotalStrokes(null);
    setStrokeProgress(null);
    setMistakePulse(null);

    if (deckRef.current.length === 0) {
      deckRef.current = makeDeck(lastWordIdRef.current, activeWordIdsRef.current);
    }

    const avoidCharacter = lastCompletedCharacterRef.current;
    const rejectedIds: string[] = [];
    let nextId: string | undefined;

    while (deckRef.current.length > 0) {
      const candidateId = deckRef.current.pop()!;
      const candidateWord = wordsByIdRef.current[candidateId];
      const candidateFirstChar = candidateWord ? firstHanziCharacter(candidateWord.hanzi) : null;

      if (!avoidCharacter || !candidateFirstChar || candidateFirstChar !== avoidCharacter) {
        nextId = candidateId;
        break;
      }

      rejectedIds.push(candidateId);
    }

    if (!nextId && rejectedIds.length > 0) {
      nextId = rejectedIds.pop();
    }

    if (rejectedIds.length > 0) {
      deckRef.current.unshift(...rejectedIds);
    }

    if (!nextId) return null;
    lastWordIdRef.current = nextId;
    const next = wordsByIdRef.current[nextId];
    if (!next) return null;

    setWord(next);
    setQuizKey((key) => key + 1);
    return next;
  }

  function start(): void {
    clearNextTimeout();
    clearCelebrationTimeouts();
    stopSpeech();
    lastCompletedCharacterRef.current = null;

    setStarted(true);
    setCorrectCount(0);
    setMistakeCount(0);
    setStreak(0);
    setBestStreak(0);
    setStreakFlash(null);
    setTotalStrokes(null);
    setStrokeProgress(null);
    setMistakePulse(null);

    lastCelebratedStreakRef.current = 0;
    hadMistakeThisWordRef.current = false;
    lastWordIdRef.current = null;
    deckRef.current = makeDeck(null, activeWordIdsRef.current);
    const first = nextWord();
    if (first) speakPrompt(Array.from(first.hanzi)[0] ?? first.hanzi, `${first.id}:0`);
  }

  useEffect(() => {
    start();
  }, []);

  function speakPrompt(character: string, promptKey: string): void {
    if (!audioEnabledRef.current) return;
    stopSpeech();
    lastPromptedKeyRef.current = promptKey;
    void speakChineseSequence([PROMPT_ZH, character], { rate: 0.95 });
  }

  function replayPrompt(): void {
    if (!word) return;
    if (!currentCharacter) return;
    speakPrompt(currentCharacter, `${word.id}:${characterIndex}`);
  }

  function hintStroke(): void {
    const writer = writerRef.current;
    if (!writer) return;
    void writer.highlightStroke(nextStrokeNumRef.current);
  }

  function skipStroke(): void {
    const writer = writerRef.current;
    if (!writer) return;
    hadMistakeThisWordRef.current = true;
    writer.skipQuizStroke();
  }

  function resetWord(): void {
    hadMistakeThisWordRef.current = true;
    characterAttemptRef.current = 1;
    setCharacterAttempt(1);
    setCharacterIndex(0);
    setQuizKey((key) => key + 1);
  }

  useEffect(() => {
    storeBool(AUDIO_STORAGE_KEY, audioEnabled);
  }, [audioEnabled]);

  useEffect(() => {
    streakRef.current = streak;
  }, [streak]);

  useEffect(() => {
    totalStrokesRef.current = totalStrokes;
  }, [totalStrokes]);

  useEffect(() => {
    if (!boardEl) return;

    const update = () => {
      const rect = boardEl.getBoundingClientRect();
      const size = Math.floor(Math.min(rect.width, rect.height));
      setBoardSize(size);
    };

    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const ro = new ResizeObserver(() => update());
    ro.observe(boardEl);
    return () => ro.disconnect();
  }, [boardEl]);

  useEffect(() => {
    if (!started) return;
    if (!word) return;
    if (!currentCharacter) return;
    if (!audioEnabledRef.current) return;
    const promptKey = `${word.id}:${characterIndex}`;
    if (lastPromptedKeyRef.current === promptKey) return;
    speakPrompt(currentCharacter, promptKey);
  }, [started, word?.id, currentCharacter, characterIndex]);

  useEffect(() => {
    if (!word) return;
    const key = `${word.id}:${characterIndex}`;
    if (characterAttemptKeyRef.current === key) return;
    characterAttemptKeyRef.current = key;
    characterAttemptRef.current = 1;
    setCharacterAttempt(1);
  }, [word?.id, characterIndex]);

  useEffect(() => {
    if (!autoUnitsEnabledRef.current) return;
    const desiredMaxUnit: UnitId =
      streak >= AUTO_ADD_UNIT_3_STREAK ? 3 : streak >= AUTO_ADD_UNIT_2_STREAK ? 2 : 1;
    const prev = lastAutoAddedUnitRef.current;
    if (desiredMaxUnit <= prev) return;
    lastAutoAddedUnitRef.current = desiredMaxUnit;
    setSelectedUnits((units) => {
      const next = new Set<UnitId>(units);
      for (let u = prev + 1; u <= desiredMaxUnit; u++) {
        next.add(u as UnitId);
      }
      return Array.from(next).sort((a, b) => a - b);
    });
  }, [streak]);

  useEffect(() => {
    if (!started) return;
    deckRef.current = makeDeck(lastWordIdRef.current, activeWordIds);
    if (nextTimeoutRef.current !== null) return;
    nextWord();
  }, [activeWordIdsKey]);

  useEffect(() => {
    if (!started) return;
    if (!word) return;
    if (!currentCharacter) return;
    if (boardSize <= 0) return;
    if (!boardEl) return;

    clearNextTimeout();
    writerRef.current?.cancelQuiz();
    writerRef.current = null;

    boardEl.innerHTML = "";

    const padding = clamp(Math.round(boardSize * 0.08), 10, 28);
    const writer = HanziWriter.create(boardEl, currentCharacter, {
      width: boardSize,
      height: boardSize,
      padding,
      showOutline: false,
      showCharacter: false,
      outlineColor: "rgba(148, 163, 184, 0.22)",
      strokeColor: "#cbd5e1",
      drawingColor: "rgba(52, 211, 153, 0.9)",
      highlightColor: "rgba(56, 189, 248, 0.45)",
      highlightCompleteColor: "#fbbf24",
      drawingFadeDuration: 750,
      drawingWidth: clamp(Math.round(boardSize * 0.022), 5, 16),
      strokeWidth: clamp(Math.round(boardSize * 0.007), 2, 6),
      outlineWidth: clamp(Math.round(boardSize * 0.006), 1, 5),
    });

    writerRef.current = writer;
    ensureUserBrushFilter(boardEl);
    nextStrokeNumRef.current = 0;
    setTotalStrokes(null);
    setStrokeProgress(null);
    setMistakePulse(null);

    let canceled = false;
    void writer
      .getCharacterData()
      .then((character) => {
        if (canceled) return;
        setTotalStrokes(character.strokes.length);
      })
      .catch(() => {
        // ignore
      });

    void writer.quiz({
      showHintAfterMisses: 1,
      acceptBackwardsStrokes: false,
      onMistake: (strokeData) => {
        hadMistakeThisWordRef.current = true;
        nextStrokeNumRef.current = strokeData.strokeNum;
        setMistakeCount((count) => count + 1);
        setStrokeProgress({
          done: strokeData.strokeNum,
          total: totalStrokesRef.current ?? computeTotalStrokesFallback(strokeData),
        });
        pulseMistake(strokeData.strokeNum);
        if (audioEnabledRef.current) playPop();
        if (strokeData.totalMistakes === 2) void writer.showOutline({ duration: 250 });
      },
      onCorrectStroke: (strokeData) => {
        nextStrokeNumRef.current = strokeData.strokeNum + 1;
        setStrokeProgress({
          done: strokeData.strokeNum + 1,
          total: totalStrokesRef.current ?? computeTotalStrokesFallback(strokeData),
        });
      },
      onComplete: ({ totalMistakes }) => {
        const didHaveMistakeThisAttempt = totalMistakes > 0;
        hadMistakeThisWordRef.current = hadMistakeThisWordRef.current || didHaveMistakeThisAttempt;

        if (didHaveMistakeThisAttempt && characterAttemptRef.current < MAX_CHARACTER_ATTEMPTS) {
          clearNextTimeout();
          characterAttemptRef.current += 1;
          setCharacterAttempt(characterAttemptRef.current);

          nextTimeoutRef.current = window.setTimeout(() => {
            nextStrokeNumRef.current = 0;
            setTotalStrokes(null);
            setStrokeProgress(null);
            setMistakePulse(null);
            setQuizKey((key) => key + 1);
            if (audioEnabledRef.current) speakPrompt(currentCharacter, `${word.id}:${characterIndex}`);
          }, RETRY_RESTART_DELAY_MS);
          return;
        }

        const isLastCharacter = characterIndex >= wordCharacters.length - 1;

        if (!isLastCharacter) {
          const nextIndex = Math.min(characterIndex + 1, wordCharacters.length - 1);
          const nextCharacter = wordCharacters[nextIndex] ?? null;
          if (audioEnabledRef.current) playDing();
          nextTimeoutRef.current = window.setTimeout(() => {
            if (nextCharacter && audioEnabledRef.current) {
              speakPrompt(nextCharacter, `${word.id}:${nextIndex}`);
            }
            setCharacterIndex(nextIndex);
          }, NEXT_CHARACTER_DELAY_MS);
          return;
        }

        const didHaveMistake = hadMistakeThisWordRef.current;
        const nextStreak = didHaveMistake ? 0 : streakRef.current + 1;
        const celebrationBursts =
          nextStreak > 0 && nextStreak % STREAK_MILESTONE === 0 ? nextStreak / STREAK_MILESTONE : 0;

        setCorrectCount((count) => count + 1);
        setStreak(nextStreak);
        setBestStreak((best) => Math.max(best, nextStreak));
        lastCelebratedStreakRef.current = didHaveMistake ? 0 : lastCelebratedStreakRef.current;

        if (audioEnabledRef.current) playDing();
        if (audioEnabledRef.current) void speakChineseSequence([word.hanzi], { rate: 0.95 });

        const celebrationExtraMs =
          celebrationBursts > 0
            ? (celebrationBursts - 1) * CELEBRATION_STEP_MS + CELEBRATION_BUFFER_MS
            : 0;
        nextTimeoutRef.current = window.setTimeout(() => {
          nextWord();
        }, NEXT_DELAY_MS + celebrationExtraMs);
      },
    });

    return () => {
      canceled = true;
      writer.cancelQuiz();
    };
  }, [started, word?.id, currentCharacter, characterIndex, wordCharacters.length, boardSize, quizKey, boardEl]);

  useEffect(() => {
    return () => {
      clearNextTimeout();
      clearCelebrationTimeouts();
      stopSpeech();
      writerRef.current?.cancelQuiz();
    };
  }, []);

  useEffect(() => {
    if (streak <= 0) return;
    if (streak % STREAK_MILESTONE !== 0) return;
    if (lastCelebratedStreakRef.current === streak) return;
    lastCelebratedStreakRef.current = streak;

    const bursts = Math.max(1, Math.floor(streak / STREAK_MILESTONE));
    clearCelebrationTimeouts();

    for (let index = 0; index < bursts; index++) {
      celebrationTimeoutsRef.current.push(
        window.setTimeout(() => {
          flashStreak(streak);
          burstConfetti();
          if (audioEnabledRef.current) playTada();
        }, index * CELEBRATION_STEP_MS),
      );
    }
  }, [streak]);

  const progressLabel =
    strokeProgress && strokeProgress.total > 0
      ? `${Math.min(strokeProgress.done, strokeProgress.total)} / ${strokeProgress.total} strokes`
      : null;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl items-center justify-center p-4 sm:p-6 [padding-top:calc(theme(spacing.4)+env(safe-area-inset-top))] [padding-bottom:calc(theme(spacing.4)+env(safe-area-inset-bottom))]">
        <div className="w-full rounded-3xl bg-slate-900/50 p-6 shadow-2xl ring-1 ring-slate-700/40 backdrop-blur sm:p-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Write</h1>
              <p className="text-sm text-slate-300">
                Listen, then write the character with correct stroke order.
              </p>
	              <div className="mt-3">
	                <div className="text-xs font-medium text-slate-400">Units</div>
	                <div className="mt-2">
	                  <UnitSelector selectedUnits={selectedUnits} onToggle={toggleUnit} />
	                </div>
	              </div>
	            </div>

            <div className="flex flex-wrap items-center gap-3">
              {onHome ? (
                <button
                  type="button"
                  onClick={() => {
                    stopSpeech();
                    onHome();
                  }}
                  className="inline-flex touch-manipulation items-center justify-center rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 ring-1 ring-slate-700/40 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300/40"
                >
                  Apps
                </button>
              ) : null}
            </div>
          </header>

          {word ? (
            <div className="mt-8">
              <div className="flex flex-col items-center text-center">
                <div className="text-sm font-medium text-slate-300">Write:</div>
                <div className="mt-2 text-4xl font-semibold tracking-tight text-slate-100">
                  {word.pinyin}
                </div>

                <div className="mt-1 text-lg text-slate-300">{word.english}</div>

                {wordCharacters.length > 1 ? (
                  <div className="mt-1 text-xs text-slate-500">
                    Character {characterIndex + 1} / {wordCharacters.length}
                  </div>
                ) : null}

                {characterAttempt > 1 ? (
                  <div className="mt-1 text-xs text-slate-500">
                    Repeat {characterAttempt} / {MAX_CHARACTER_ATTEMPTS}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={replayPrompt}
                    className="inline-flex touch-manipulation items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 ring-1 ring-slate-700/40 hover:bg-slate-700"
                    disabled={!audioEnabled}
                  >
                    Play audio
                  </button>

                  <button
                    type="button"
                    onClick={hintStroke}
                    className="inline-flex touch-manipulation items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 ring-1 ring-slate-700/40 hover:bg-slate-700"
                  >
                    Hint stroke
                  </button>

                  <button
                    type="button"
                    onClick={skipStroke}
                    className="inline-flex touch-manipulation items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 ring-1 ring-slate-700/40 hover:bg-slate-700"
                  >
                    Skip stroke
                  </button>

                  <button
                    type="button"
                    onClick={resetWord}
                    className="inline-flex touch-manipulation items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 ring-1 ring-slate-700/40 hover:bg-slate-700"
                  >
                    Reset
                  </button>
                </div>

                <div className="mt-4 flex min-h-10 flex-col items-center justify-center gap-1">
                  {progressLabel ? (
                    <div className="text-xs text-slate-400">{progressLabel}</div>
                  ) : (
                    <div className="h-4" aria-hidden="true" />
                  )}

                  {mistakePulse ? (
                    <div className="text-xs text-rose-300">Miss on stroke {mistakePulse.strokeNum + 1}</div>
                  ) : (
                    <div className="h-4" aria-hidden="true" />
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center">
                <div className="grid-board aspect-square w-full max-w-[380px] overflow-hidden rounded-3xl bg-slate-950/40 ring-1 ring-slate-700/40">
                  <div ref={setBoardEl} className="h-full w-full touch-none select-none" />
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 text-sm text-slate-300 sm:grid-cols-4">
                <div className="rounded-2xl bg-slate-950/40 px-4 py-3 ring-1 ring-slate-700/30">
                  <div className="text-xs text-slate-400">Completed</div>
                  <div className="mt-1 text-lg font-semibold text-slate-100">{correctCount}</div>
                </div>
                <div className="rounded-2xl bg-slate-950/40 px-4 py-3 ring-1 ring-slate-700/30">
                  <div className="text-xs text-slate-400">Mistakes</div>
                  <div className="mt-1 text-lg font-semibold text-slate-100">{mistakeCount}</div>
                </div>
                <div className="rounded-2xl bg-slate-950/40 px-4 py-3 ring-1 ring-slate-700/30">
                  <div className="text-xs text-slate-400">Perfect streak</div>
                  <div className="mt-1 text-lg font-semibold text-slate-100">{streak}</div>
                </div>
                <div className="rounded-2xl bg-slate-950/40 px-4 py-3 ring-1 ring-slate-700/30">
                  <div className="text-xs text-slate-400">Best</div>
                  <div className="mt-1 text-lg font-semibold text-slate-100">{bestStreak}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-10 flex flex-col items-center justify-center gap-2 text-center">
              <div className="text-sm text-slate-300">Loading…</div>
              <div className="text-xs text-slate-500">Pick up a pen and start writing.</div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed z-50 flex flex-col gap-2 [right:calc(theme(spacing.4)+env(safe-area-inset-right))] [bottom:calc(theme(spacing.4)+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => setAudioEnabled((value) => !value)}
          className="inline-flex touch-manipulation items-center gap-2 rounded-full bg-slate-800/90 px-4 py-2 text-sm font-medium text-slate-100 shadow-lg ring-1 ring-slate-700/40 backdrop-blur hover:bg-slate-700"
          aria-pressed={audioEnabled}
          title="Toggle audio"
        >
          <span
            className={[
              "h-2.5 w-2.5 rounded-full",
              audioEnabled ? "bg-emerald-400" : "bg-slate-500",
            ].join(" ")}
            aria-hidden="true"
          />
          Audio {audioEnabled ? "On" : "Off"}
        </button>
      </div>

      {streakFlash ? (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
          <div
            key={streakFlash.token}
            className="animate-[streak-flash_650ms_cubic-bezier(0.2,0.9,0.2,1)] rounded-3xl bg-slate-950/35 px-8 py-5 text-center shadow-2xl ring-1 ring-slate-200/10 backdrop-blur"
          >
            <div className="text-7xl font-extrabold tracking-tight text-amber-200">
              {streakFlash.value}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
