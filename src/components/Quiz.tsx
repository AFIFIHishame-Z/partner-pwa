import { useMemo, useState } from "react";

/**
 * Pixel-accurate UI inspired by the provided mock.
 * Notes:
 * - Replace placeholder image src values with your real assets.
 * - The background pattern/clouds column is expected to come from your app's page background.
 * - Uses Tailwind only (no external CSS).
 */
export default function Quiz() {
  // simple demo state (you can remove if you only want static UI)
  const a = 27;
  const b = 46;
  const expected = useMemo(() => a + b, [a, b]);
  const [answer, setAnswer] = useState("");

  const onKey = (v: any) => setAnswer((s) => (s === "0" ? v : s + v));
  const clear = () => setAnswer("");

  return (
    <div className="relative min-h-screen w-full bg-[#eaf3fb] overflow-hidden">
      {/* --- Left decorative sidebar (replace with your illustration) --- */}
      <div className="absolute left-0 top-0 h-full w-[82px] bg-gradient-to-b from-[#f1f2f4] to-[#d9dde2]">
        <img
          src="/img/left-arch-placeholder.png"
          alt="decor"
          className="absolute bottom-0 left-0 w-full select-none pointer-events-none"
        />
      </div>

      {/* --- Top bar --- */}
      <header className="relative z-10 flex items-center justify-between pl-[96px] pr-4 pt-3">
        {/* left actions */}
        <div className="flex items-center gap-2">
          <button
            aria-label="Back"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#f7a14a] text-white shadow-[0_4px_0_rgba(0,0,0,0.15)]"
          >
            <img src="/img/icon-back.png" alt="" className="h-5 w-5" />
          </button>
          <button
            aria-label="Home"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#f7a14a] text-white shadow-[0_4px_0_rgba(0,0,0,0.15)]"
          >
            <img src="/img/icon-home.png" alt="" className="h-5 w-5" />
          </button>

          {/* Coins pill */}
          <div className="ml-3 flex items-center gap-2 rounded-full bg-white/80 px-2 py-1 shadow">
            <span className="text-[15px] font-semibold text-[#1e2a39]">10</span>
            <img src="/img/icon-coin.png" alt="coin" className="h-5 w-5" />
          </div>
        </div>

        {/* right badges + avatar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {/* 1 colored + 4 gray placeholders */}
            <img src="/img/star-on.png" className="h-6 w-6" alt="badge" />
            <img src="/img/star-off.png" className="h-6 w-6" alt="badge" />
            <img src="/img/star-off.png" className="h-6 w-6" alt="badge" />
            <img src="/img/star-off.png" className="h-6 w-6" alt="badge" />
            <img src="/img/star-off.png" className="h-6 w-6" alt="badge" />
          </div>
          <img
            src="/img/avatar.png"
            alt="avatar"
            className="h-8 w-8 rounded-full"
          />
        </div>
      </header>

      {/* --- Progress rail --- */}
      <div className="relative z-10 pl-[96px] pr-4 mt-2">
        <div className="mx-auto max-w-[520px]">
          <div className="relative h-2 w-full rounded-full bg-[#cfe1ef]">
            {/* ticks */}
            <div className="absolute inset-0 flex items-center justify-between px-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[6px] w-[2px] rounded bg-[#6aa2c8]/70"
                />
              ))}
            </div>
            {/* diamond knob */}
            <div className="absolute -top-[7px] left-[14%] h-4 w-4 rotate-45 rounded bg-[#1e90cf] shadow" />
          </div>
          <p className="mt-1 text-center text-[13px] font-medium text-[#1e6ea3]">
            Nom de la sous-compétence
          </p>
        </div>
      </div>

      {/* --- Main content row --- */}
      <main className="relative z-10 grid grid-cols-12 gap-6 pl-[96px] pr-4 pt-6">
        {/* Left: card with arch top */}
        <section className="col-span-12 md:col-span-6 xl:col-span-5">
          <div className="relative mx-auto w-[320px] rounded-b-3xl rounded-t-[44px] bg-[#dff0fa]/95 px-8 pb-8 pt-10 shadow">
            {/* fake arch cap */}
            <div className="absolute -top-8 left-1/2 h-16 w-[220px] -translate-x-1/2 rounded-b-none rounded-t-full bg-[#dff0fa]" />

            {/* vertical equation */}
            <div className="relative z-10 select-none text-center text-[#1a4d7a]">
              <div className="text-[40px] font-semibold leading-tight tracking-wide">
                <div className="-mb-1">2 7</div>
                <div className="-mb-1">
                  <span className="align-middle text-[28px] font-bold mr-2">
                    +
                  </span>
                  4 6
                </div>
              </div>
              <div className="mx-auto mt-2 h-[4px] w-40 rounded bg-[#1a4d7a]" />
            </div>

            {/* input */}
            <div className="relative z-10 mt-4 flex items-center justify-center">
              <input
                value={answer}
                readOnly
                placeholder="Entrez le résultat"
                className="w-44 rounded-lg border border-[#d2dbe4] bg-white/90 px-4 py-2 text-center text-[15px] text-[#385a73] shadow-[inset_0_2px_0_rgba(0,0,0,0.05)] placeholder:text-[#aab7c4] focus:outline-none"
              />
            </div>
          </div>

          {/* Cat (bottom-left) */}
          <img
            src="/img/cat.png"
            alt="cat"
            className="mt-4 h-24 w-24 select-none"
          />
        </section>

        {/* Right: keypad and floating elements */}
        <section className="col-span-12 md:col-span-6 xl:col-span-7">
          <div className="mx-auto grid max-w-[280px] grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => onKey(String(n))}
                className="relative h-16 w-20 rounded-xl bg-[#066ea1] text-xl font-semibold text-white shadow-[0_5px_0_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-[0_3px_0_rgba(0,0,0,0.2)]"
              >
                {n}
              </button>
            ))}
            <div />
            <button
              onClick={() => onKey("0")}
              className="col-span-1 h-16 w-20 justify-self-center rounded-xl bg-[#066ea1] text-xl font-semibold text-white shadow-[0_5px_0_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-[0_3px_0_rgba(0,0,0,0.2)]"
            >
              0
            </button>
            <div />
          </div>

          {/* Floating side icon (right center) */}
          <img
            src="/img/floating-ring.png"
            alt="side icon"
            className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 md:block h-16 w-16"
          />
        </section>
      </main>

      {/* --- Bottom-right validate circle --- */}
      <button
        onClick={clear}
        aria-label="Valider"
        className="fixed bottom-6 right-6 grid h-16 w-16 place-items-center rounded-full bg-[#f59d48] text-white shadow-[0_8px_0_rgba(0,0,0,0.18)]"
      >
        <img src="/img/icon-check.png" alt="valider" className="h-6 w-6" />
      </button>

      {/* Optional tiny correctness hint (remove in prod) */}
      <div className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 text-xs text-[#6b7f92] opacity-60">
        résultat attendu : {expected}
      </div>
    </div>
  );
}
