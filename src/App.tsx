import { useEffect, useMemo, useState } from "react";
import ReadApp from "./apps/read/ReadApp";
import WriteApp from "./apps/write/WriteApp";

type AppId = "read" | "write";

type AppMeta = {
  id: AppId;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
};

export default function App() {
  const apps = useMemo<AppMeta[]>(
    () => [
      {
        id: "read",
        title: "Read",
        subtitle: "Multiple choice",
        description: "See a character and pick the right meaning (English) or pronunciation (pinyin).",
        accent: "from-sky-400/20 via-slate-900/40 to-slate-900/20 ring-sky-400/30",
      },
      {
        id: "write",
        title: "Write",
        subtitle: "Stroke order",
        description: "Hear a prompt, then write the character in the grid with guided stroke order.",
        accent: "from-emerald-400/20 via-slate-900/40 to-slate-900/20 ring-emerald-400/30",
      },
    ],
    [],
  );

  const [activeApp, setActiveApp] = useState<AppId | null>(null);

  useEffect(() => {
    if (activeApp === "read") {
      document.title = "Read • learncn.fun";
      return;
    }
    if (activeApp === "write") {
      document.title = "Write • learncn.fun";
      return;
    }
    document.title = "learncn.fun";
  }, [activeApp]);

  if (activeApp === "read") {
    return <ReadApp onHome={() => setActiveApp(null)} />;
  }

  if (activeApp === "write") {
    return <WriteApp onHome={() => setActiveApp(null)} />;
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-3xl items-center justify-center p-4 sm:p-6 [padding-top:calc(theme(spacing.4)+env(safe-area-inset-top))] [padding-bottom:calc(theme(spacing.4)+env(safe-area-inset-bottom))]">
        <div className="w-full rounded-3xl bg-slate-900/50 p-6 shadow-2xl ring-1 ring-slate-700/40 backdrop-blur sm:p-8">
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-100">learncn.fun</h1>
            <p className="text-sm text-slate-300">Fast, tiny Chinese practice apps. Pick one to start.</p>
          </header>

          <div className="mt-8">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Popular apps
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {apps.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setActiveApp(app.id)}
                  className={[
                    "group w-full touch-manipulation rounded-3xl bg-gradient-to-br p-5 text-left shadow-lg ring-1 transition",
                    "focus:outline-none focus:ring-2 focus:ring-slate-300/40",
                    "hover:-translate-y-0.5 hover:bg-slate-800/60",
                    app.accent,
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold text-slate-100">{app.title}</div>
                      <div className="mt-0.5 text-xs font-medium text-slate-300">{app.subtitle}</div>
                    </div>

                    <div className="mt-1 text-xs font-semibold text-slate-200/90">
                      Open →
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-slate-300">{app.description}</div>
                </button>
              ))}
            </div>

            <p className="mt-6 text-xs text-slate-400">
              Audio note: your first tap (opening an app) unlocks speech in most browsers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
