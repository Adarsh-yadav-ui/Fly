import { SignIn } from "@clerk/nextjs";
import { AudioLines, BrainCircuit, ShieldCheck, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: AudioLines,
    title: "Realtime context",
    description: "Keeps up as ideas unfold.",
  },
  {
    icon: BrainCircuit,
    title: "Custom expertise",
    description: "Built around your knowledge.",
  },
  {
    icon: Zap,
    title: "Always ready",
    description: "Prepared for every meeting.",
  },
] as const;

const waveform = [12, 20, 30, 18, 38, 26, 44, 22, 34, 48, 28, 40, 18, 32, 22, 14];

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
            <p className="text-sm font-medium text-white">Fly AI</p>
            <p className="text-xs text-white/50">Product strategy</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
          Live
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-white/10 px-3.5 py-2.5 text-sm leading-relaxed text-white/80">
          What is the biggest risk we should discuss today?
        </div>
        <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-violet-500 px-3.5 py-2.5 text-sm leading-relaxed text-white">
          I&apos;ll connect the open questions to customer impact and the launch timeline.
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs text-white/55">
        <span className="flex size-7 items-center justify-center rounded-full bg-violet-500/20 text-violet-200">
          <Sparkles className="size-3.5" aria-hidden="true" />
        </span>
        <span>Fly AI is listening</span>
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

export default function SignInPage() {
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
                Your custom AI is in the room
              </div>
              <h1 className="mt-6 max-w-xl text-4xl leading-[1.05] font-semibold tracking-[-0.045em] text-balance xl:text-6xl">
                Meet an AI that keeps up with your best thinking.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/60 xl:text-lg">
                Fly joins your meetings, understands the context, and responds in real time so your team can stay focused on the conversation.
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
              Secure workspace access
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-md">
              <div className="mb-8 lg:hidden">
                <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                  Welcome back
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-balance">
                  Your next great conversation starts here.
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Sign in and bring your custom AI back into the room.
                </p>
              </div>

              <SignIn fallbackRedirectUrl="/" />

              <div className="mt-6 flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  Secure sign-in powered by Clerk
                </span>
                <span>
                  New to Fly?{" "}
                  <Link
                    href="/sign-up"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Create an account
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
