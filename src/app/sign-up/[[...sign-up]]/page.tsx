import { SignUp } from "@clerk/nextjs";
import { AudioLines, BrainCircuit, ShieldCheck, Sparkles, Users } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: BrainCircuit,
    title: "Made for you",
    description: "Shaped around your expertise.",
  },
  {
    icon: AudioLines,
    title: "Instant answers",
    description: "Help while the moment is live.",
  },
  {
    icon: Users,
    title: "Team-ready",
    description: "Consistent context for everyone.",
  },
] as const;

const waveform = [14, 26, 38, 20, 46, 30, 42, 24, 36, 48, 26, 40, 20, 34, 18, 12];

function Brand({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 ${className}`}
      aria-label="Fly home"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-950/30">
        <AudioLines className="size-5" aria-hidden="true" />
      </span>
      <span className="text-xl font-semibold tracking-[-0.04em]">
        fly<span className="text-violet-500">.</span>
      </span>
    </Link>
  );
}

function LiveConversation() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-violet-950/40 backdrop-blur-xl sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-200">
            <Sparkles className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Your Fly AI</p>
            <p className="text-xs text-white/50">Go-to-market review</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
          Live
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-violet-500 px-3.5 py-2.5 text-sm leading-relaxed text-white">
          What should we prioritize for the next launch?
        </div>
        <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-white/10 px-3.5 py-2.5 text-sm leading-relaxed text-white/80">
          Start with the customer workflow that removes the most friction. I found three supporting signals.
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs text-white/55">
        <span className="flex size-7 items-center justify-center rounded-full bg-violet-500/20 text-violet-200">
          <Sparkles className="size-3.5" aria-hidden="true" />
        </span>
        <span>Responding with your team&apos;s context</span>
        <div className="ml-auto flex h-6 items-center gap-1" aria-hidden="true">
          {waveform.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className="w-1 rounded-full bg-violet-300/80"
              style={{ height: height / 2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <main className="min-h-svh bg-background">
      <div className="grid min-h-svh lg:grid-cols-[minmax(0,1.08fr)_minmax(26rem,0.92fr)]">
        <section className="relative hidden overflow-hidden bg-zinc-950 px-12 py-10 text-white lg:flex lg:flex-col xl:px-16 xl:py-12">
          <div className="absolute -top-40 -left-40 size-[30rem] rounded-full bg-violet-600/25 blur-3xl" />
          <div className="absolute -right-32 -bottom-48 size-[28rem] rounded-full bg-sky-500/15 blur-3xl" />

          <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col">
            <Brand />

            <div className="my-auto py-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-200">
                <span className="size-1.5 animate-pulse rounded-full bg-violet-300" />
                Realtime, personalized, always in the room
              </div>
              <h1 className="mt-6 max-w-xl text-4xl leading-[1.05] font-semibold tracking-[-0.045em] text-balance xl:text-6xl">
                Add a brilliant teammate to every conversation.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/60 xl:text-lg">
                Shape an AI with your expertise, your tone, and your context. Fly answers in the moment—not minutes later.
              </p>
            </div>

            <LiveConversation />

            <div className="mt-8 grid grid-cols-3 gap-5 border-t border-white/10 pt-6">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title}>
                  <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-white/10 text-violet-200">
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/45">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative flex min-h-svh flex-col px-5 py-6 sm:px-8 lg:px-10 xl:px-16">
          <div className="flex items-center justify-between">
            <Brand className="text-foreground lg:hidden" />
            <div className="ml-auto hidden items-center gap-2 text-xs font-medium text-muted-foreground lg:flex">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Private and secure by design
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-md">
              <div className="mb-8 lg:hidden">
                <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                  Meet your AI teammate
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-balance">
                  Better meetings start with better context.
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Create your workspace and bring a realtime custom AI into every conversation.
                </p>
              </div>

              <SignUp fallbackRedirectUrl="/" />

              <div className="mt-6 flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  Secure sign-up powered by Clerk
                </span>
                <span>
                  Already have an account?{" "}
                  <Link
                    href="/sign-in"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Sign in
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
