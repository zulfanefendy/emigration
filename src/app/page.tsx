export default function Home() {
  const judul = "KELOMPOK A";

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-zinc-950 font-sans">
      {/* Pemanis latar: dua gumpalan cahaya yang bergerak pelan */}
      <div
        aria-hidden
        className="animate-float-slow pointer-events-none absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-indigo-600/25 blur-[100px]"
      />
      <div
        aria-hidden
        className="animate-float-slower pointer-events-none absolute -right-32 -bottom-32 h-[26rem] w-[26rem] rounded-full bg-fuchsia-600/20 blur-[100px]"
      />

      <main className="relative z-10 flex flex-col items-center px-6 text-center">
        <p className="animate-fade-up text-xs font-medium tracking-[0.45em] text-indigo-300/80 uppercase opacity-0 [animation-delay:100ms] sm:text-sm">
          Capstone Project
        </p>

        <h1 className="mt-5 flex flex-wrap justify-center gap-x-4 text-5xl font-semibold tracking-tight sm:text-7xl lg:text-8xl">
          {judul.split(" ").map((kata, iKata) => (
            <span key={kata} className="flex">
              {kata.split("").map((huruf, iHuruf) => (
                <span
                  key={`${kata}-${iHuruf}`}
                  className="animate-fade-up animate-shimmer bg-gradient-to-r from-white via-indigo-200 to-white bg-[length:200%_auto] bg-clip-text text-transparent opacity-0"
                  style={{ animationDelay: `${300 + (iKata * 5 + iHuruf) * 60}ms` }}
                >
                  {huruf}
                </span>
              ))}
            </span>
          ))}
        </h1>

        <div className="animate-fade-up mt-10 h-px w-24 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 [animation-delay:1100ms]" />

        <p className="animate-fade-up mt-8 max-w-md text-base leading-7 text-zinc-400 opacity-0 [animation-delay:1250ms]">
          Sistem Informasi Emigrasi — dibangun dengan Next.js, Prisma, dan Docker.
        </p>

        <span className="animate-fade-up mt-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-zinc-300 opacity-0 backdrop-blur [animation-delay:1400ms]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Development · port 3001
        </span>
      </main>
    </div>
  );
}
