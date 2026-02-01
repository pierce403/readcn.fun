import { useEffect, useMemo, useRef, useState } from "react";
import { WORDS, type Word } from "./data/words";
import { burstConfetti } from "./lib/confetti";
import { sampleDistinct, shuffleInPlace } from "./lib/random";
import { playDing, playPop, playTada } from "./lib/sfx";
import { speakChineseSequence, stopSpeech } from "./lib/speech";

type OptionState = "idle" | "wrong" | "correct";

type Option = {
  id: string;
  label: string;
};

type Question = {
  word: Word;
  options: Option[];
  correctOptionId: string;
};

const AUDIO_STORAGE_KEY = "readcn.audioEnabled";
const PROMPT_ZH = "这是什么字？";

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

function buildQuestion(word: Word): Question {
  const distractors = sampleDistinct(WORDS, 2, (candidate) => candidate.id !== word.id);
  const options: Option[] = [word, ...distractors].map((w) => ({ id: w.id, label: w.english }));
  shuffleInPlace(options);

  return {
    word,
    options,
    correctOptionId: word.id,
  };
}

function makeDeck(previousWordId: string | null): string[] {
  const ids = WORDS.map((word) => word.id);
  shuffleInPlace(ids);

  if (previousWordId && ids.length > 1 && ids[ids.length - 1] === previousWordId) {
    [ids[ids.length - 1], ids[ids.length - 2]] = [ids[ids.length - 2], ids[ids.length - 1]];
  }

  return ids;
}

export default function App() {
  const wordsById = useMemo<Record<string, Word>>(
    () => Object.fromEntries(WORDS.map((word) => [word.id, word])) as Record<string, Word>,
    [],
  );

  const [started, setStarted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(() => loadStoredBool(AUDIO_STORAGE_KEY, true));

  const [question, setQuestion] = useState<Question | null>(null);
  const [optionStates, setOptionStates] = useState<Record<string, OptionState>>({});
  const [locked, setLocked] = useState(false);

  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const deckRef = useRef<string[]>([]);
  const lastWordIdRef = useRef<string | null>(null);
  const nextTimeoutRef = useRef<number | null>(null);
  const lastCelebratedStreakRef = useRef<number>(0);

  function clearNextTimeout(): void {
    if (nextTimeoutRef.current === null) return;
    window.clearTimeout(nextTimeoutRef.current);
    nextTimeoutRef.current = null;
  }

  function nextQuestion(): void {
    clearNextTimeout();
    stopSpeech();

    if (deckRef.current.length === 0) {
      deckRef.current = makeDeck(lastWordIdRef.current);
    }

    const nextWordId = deckRef.current.pop();
    if (!nextWordId) return;

    lastWordIdRef.current = nextWordId;
    const word = wordsById[nextWordId];
    if (!word) return;

    setQuestion(buildQuestion(word));
    setOptionStates({});
    setLocked(false);
  }

  function start(): void {
    clearNextTimeout();
    setStarted(true);
    setCorrectCount(0);
    setMistakeCount(0);
    setStreak(0);
    setBestStreak(0);
    lastCelebratedStreakRef.current = 0;
    lastWordIdRef.current = null;
    deckRef.current = makeDeck(null);
    nextQuestion();
  }

  function restart(): void {
    start();
  }

  function sayPrompt(): void {
    if (!question) return;
    if (!audioEnabled) return;
    void speakChineseSequence([PROMPT_ZH, question.word.hanzi], { rate: 0.95 });
  }

  function choose(optionId: string): void {
    if (!question) return;
    if (locked) return;

    const isCorrect = optionId === question.correctOptionId;

    setOptionStates((prev) => ({
      ...prev,
      [optionId]: isCorrect ? "correct" : "wrong",
    }));

    if (isCorrect) {
      if (audioEnabled) playDing();
      setLocked(true);
      setCorrectCount((count) => count + 1);
      setStreak((current) => {
        const next = current + 1;
        setBestStreak((best) => Math.max(best, next));
        return next;
      });

      nextTimeoutRef.current = window.setTimeout(() => {
        nextQuestion();
      }, 650);
      return;
    }

    if (audioEnabled) playPop();
    setMistakeCount((count) => count + 1);
    setStreak(0);
  }

  useEffect(() => {
    storeBool(AUDIO_STORAGE_KEY, audioEnabled);
  }, [audioEnabled]);

  useEffect(() => {
    if (!started) return;
    if (!question) return;
    if (!audioEnabled) return;
    void speakChineseSequence([PROMPT_ZH, question.word.hanzi], { rate: 0.95 });
  }, [started, question?.word.id, audioEnabled]);

  useEffect(() => {
    if (!started) return;
    if (streak <= 0) return;
    if (streak % 10 !== 0) return;
    if (lastCelebratedStreakRef.current === streak) return;
    lastCelebratedStreakRef.current = streak;

    burstConfetti();
    if (audioEnabled) playTada();
  }, [streak, started, audioEnabled]);

  useEffect(() => {
    return () => {
      clearNextTimeout();
      stopSpeech();
    };
  }, []);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl items-center justify-center p-4 sm:p-6 [padding-top:calc(theme(spacing.4)+env(safe-area-inset-top))] [padding-bottom:calc(theme(spacing.4)+env(safe-area-inset-bottom))]">
        <div className="w-full rounded-3xl bg-slate-900/50 p-6 shadow-2xl ring-1 ring-slate-700/40 backdrop-blur sm:p-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">readcn.fun</h1>
              <p className="text-sm text-slate-300">
                Guess the English meaning of the Chinese character.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setAudioEnabled((value) => !value)}
                className="inline-flex touch-manipulation items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 ring-1 ring-slate-700/40 hover:bg-slate-700"
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

              <button
                type="button"
                onClick={restart}
                className="inline-flex touch-manipulation items-center rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 ring-1 ring-slate-700/40 hover:bg-slate-700"
              >
                Restart
              </button>
            </div>
          </header>

          {!started ? (
            <div className="mt-10 text-center">
              <div className="text-6xl font-semibold leading-none text-slate-200 sm:text-7xl">
                汉字
              </div>

              <p className="mx-auto mt-4 max-w-md text-sm text-slate-300">
                You’ll see a character and 3 choices. Pick the correct English word.
              </p>

              <button
                type="button"
                onClick={start}
                className="mt-8 inline-flex touch-manipulation items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-base font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                Start
              </button>

              <p className="mt-4 text-xs text-slate-400">
                Tip: browsers require a click before they’ll play speech audio.
              </p>
            </div>
          ) : question ? (
            <div className="mt-8">
              <div className="flex flex-col items-center text-center">
                <div className="select-none text-7xl font-semibold leading-none tracking-tight sm:text-8xl">
                  {question.word.hanzi}
                </div>

                <div className="mt-2 text-sm text-slate-400">{question.word.pinyin}</div>

                <button
                  type="button"
                  onClick={sayPrompt}
                  disabled={!audioEnabled}
                  className="mt-4 inline-flex touch-manipulation items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 ring-1 ring-slate-700/40 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Play audio
                </button>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3">
                {question.options.map((option) => {
                  const state = optionStates[option.id] ?? "idle";
                  const isDisabled = locked || state === "wrong";

                  const className =
                    state === "correct"
                      ? "bg-emerald-500 text-emerald-950 ring-emerald-300/50"
                      : state === "wrong"
                        ? "bg-rose-500 text-rose-950 ring-rose-300/50"
                        : "bg-slate-800 text-slate-100 ring-slate-700/40 hover:bg-slate-700";

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => choose(option.id)}
                      disabled={isDisabled}
                      className={[
                        "w-full touch-manipulation rounded-2xl px-5 py-4 text-left text-lg font-semibold shadow-sm ring-1 transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-slate-300/40",
                        "disabled:cursor-not-allowed disabled:opacity-70",
                        className,
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 text-sm text-slate-300 sm:grid-cols-4">
                <div className="rounded-2xl bg-slate-950/40 px-4 py-3 ring-1 ring-slate-700/30">
                  <div className="text-xs text-slate-400">Correct</div>
                  <div className="mt-1 text-lg font-semibold text-slate-100">{correctCount}</div>
                </div>
                <div className="rounded-2xl bg-slate-950/40 px-4 py-3 ring-1 ring-slate-700/30">
                  <div className="text-xs text-slate-400">Mistakes</div>
                  <div className="mt-1 text-lg font-semibold text-slate-100">{mistakeCount}</div>
                </div>
                <div className="rounded-2xl bg-slate-950/40 px-4 py-3 ring-1 ring-slate-700/30">
                  <div className="text-xs text-slate-400">Streak</div>
                  <div className="mt-1 text-lg font-semibold text-slate-100">{streak}</div>
                </div>
                <div className="rounded-2xl bg-slate-950/40 px-4 py-3 ring-1 ring-slate-700/30">
                  <div className="text-xs text-slate-400">Best</div>
                  <div className="mt-1 text-lg font-semibold text-slate-100">{bestStreak}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
