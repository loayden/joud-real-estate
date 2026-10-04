"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Heart,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import type { CSSProperties, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Link, usePathname, useRouter, type Locale } from "@/i18n/routing";
import { apiFetch } from "@/lib/api-client";

type OnboardingStatus = {
  completed: boolean;
  firstName: string | null;
};

const copy = {
  ar: {
    eyebrow: "أهلاً بك في جود العقارية",
    welcomeTitle: (name: string | null) =>
      name ? `أهلاً، ${name} 👋` : "أهلاً بك 👋",
    welcomeBody:
      "منصّتك الموثوقة لاكتشاف العقارات في مصر — آلاف الشقق والفلل والأراضي للبيع والإيجار، من مالكين ووسطاء موثوقين.",
    discoverEyebrow: "اكتشف",
    discoverTitle: "كل مصر بين يديك",
    discoverBody:
      "ابحث بالمدينة والسعر والمواصفات، وشاهد النتائج لحظة بلحظة — من القاهرة الجديدة إلى الساحل الشمالي.",
    exploreEyebrow: "استكشف",
    exploreTitle: "أدوات صُممت لتختصر عليك الطريق",
    features: [
      {
        icon: SlidersHorizontal,
        title: "بحث وفلاتر ذكية",
        body: "ضيّق النتائج حسب احتياجك بدقة.",
      },
      {
        icon: Heart,
        title: "احفظ وقارن",
        body: "مفضلتك وتنبيهات الأسعار في مكان واحد.",
      },
      {
        icon: MessageCircle,
        title: "تواصل مباشر",
        body: "راسل المالك أو الوسيط بدون وسطاء.",
      },
    ],
    startEyebrow: "ابدأ الآن",
    startTitle: "جاهز لأول خطوة؟",
    startBody:
      "تصفح أحدث الإعلانات الآن، أو اعرض عقارك مجاناً ليصل لآلاف الباحثين.",
    browse: "تصفح العقارات",
    addListing: "أضف عقارك",
    next: "التالي",
    back: "رجوع",
    skip: "تخطي",
    stepOf: (step: number, total: number) => `${step} / ${total}`,
  },
  en: {
    eyebrow: "Welcome to Joud Real Estate",
    welcomeTitle: (name: string | null) =>
      name ? `Hello, ${name} 👋` : "Welcome 👋",
    welcomeBody:
      "Your trusted platform for discovering property in Egypt — thousands of apartments, villas, and land for sale and rent from verified owners and agents.",
    discoverEyebrow: "Discover",
    discoverTitle: "All of Egypt in your hands",
    discoverBody:
      "Search by city, price, and specs with live results — from New Cairo to the North Coast.",
    exploreEyebrow: "Explore",
    exploreTitle: "Tools built to shorten your journey",
    features: [
      {
        icon: SlidersHorizontal,
        title: "Smart search & filters",
        body: "Narrow results to exactly what you need.",
      },
      {
        icon: Heart,
        title: "Save & compare",
        body: "Favorites and price alerts in one place.",
      },
      {
        icon: MessageCircle,
        title: "Direct contact",
        body: "Message owners and agents directly.",
      },
    ],
    startEyebrow: "Get started",
    startTitle: "Ready for your first step?",
    startBody:
      "Browse the latest listings now, or list your property for free to reach thousands of seekers.",
    browse: "Browse properties",
    addListing: "Add your property",
    next: "Next",
    back: "Back",
    skip: "Skip",
    stepOf: (step: number, total: number) => `${step} / ${total}`,
  },
} as const;

const TOTAL_STEPS = 4;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function OnboardingGate({ locale }: { locale: Locale }) {
  const [visible, setVisible] = useState(false);
  const [replay, setReplay] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [stepKey, setStepKey] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  const checking = useRef(false);
  const text = copy[locale];
  const isRtl = locale === "ar";

  const check = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    try {
      const res = await apiFetch("/api/onboarding");
      if (!res.ok) return;
      const payload = (await res.json()) as {
        success?: boolean;
        data?: OnboardingStatus;
      };
      if (payload.success && payload.data && !payload.data.completed) {
        setFirstName(payload.data.firstName);
        setReplay(false);
        setStep(0);
        setStepKey((key) => key + 1);
        setVisible(true);
      }
    } catch {
      // Offline or unauthenticated: stay hidden, never block the app.
    } finally {
      checking.current = false;
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check, pathname]);

  useEffect(() => {
    const onFocus = () => {
      if (!visible) void check();
    };
    const onSession = () => void check();
    const onReplay = () => {
      setReplay(true);
      setStep(0);
      setStepKey((key) => key + 1);
      setVisible(true);
      void check();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("joud:session-changed", onSession);
    window.addEventListener(
      "joud:replay-onboarding",
      onReplay as EventListener,
    );
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("joud:session-changed", onSession);
      window.removeEventListener(
        "joud:replay-onboarding",
        onReplay as EventListener,
      );
    };
  }, [check, visible]);

  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [visible]);

  const close = useCallback(
    async (persist: boolean) => {
      setVisible(false);
      if (persist && !replay) {
        try {
          await apiFetch("/api/onboarding", { method: "POST" });
        } catch {
          // Completion is best-effort; the flag stays unset and the
          // overlay simply appears again next session.
        }
      }
    },
    [replay],
  );

  const goTo = useCallback(
    (next: number) => {
      setDirection(next > step ? 1 : -1);
      setStep(next);
      setStepKey((key) => key + 1);
    },
    [step],
  );

  const finish = useCallback(
    (href: string) => {
      void close(true).then(() => router.push(href));
    },
    [close, router],
  );

  if (!visible) return null;

  const enterX = direction * (isRtl ? -1 : 1) * 44;
  const NextIcon = isRtl ? ArrowLeft : ArrowRight;
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div
      aria-modal="true"
      className="ob-overlay fixed inset-0 z-[100] overflow-y-auto"
      role="dialog"
    >
      <style>{`
        .ob-overlay { background: radial-gradient(120% 100% at 50% 0%, #163D73 0%, #0D2444 55%, #081A33 100%); animation: ob-fade 0.3s ease-out; }
        .ob-orb { position: absolute; border-radius: 9999px; filter: blur(72px); pointer-events: none; animation: ob-drift 14s ease-in-out infinite alternate; will-change: transform, opacity; }
        .ob-card { animation: ob-pop 0.34s cubic-bezier(0.22, 1, 0.36, 1); }
        .ob-step { animation: ob-step-in 0.32s cubic-bezier(0.22, 1, 0.36, 1); }
        .ob-rise { opacity: 0; animation: ob-rise 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .ob-bar { transition: width 0.32s cubic-bezier(0.22, 1, 0.36, 1); }
        .ob-btn { transition: transform 0.12s ease-out, box-shadow 0.12s ease-out, background-color 0.12s ease-out; }
        .ob-btn:active { transform: scale(0.97); }
        @keyframes ob-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ob-pop { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes ob-step-in { from { opacity: 0; transform: translateX(var(--ob-x, 24px)); } to { opacity: 1; transform: none; } }
        @keyframes ob-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes ob-drift { from { transform: translate3d(-24px, -12px, 0) scale(1); opacity: 0.7; } to { transform: translate3d(28px, 20px, 0) scale(1.12); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .ob-overlay, .ob-card, .ob-step, .ob-rise { animation: none !important; opacity: 1 !important; transform: none !important; }
          .ob-orb { display: none !important; }
          .ob-bar { transition: none !important; }
        }
      `}</style>

      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div
          className="ob-orb left-[8%] top-[6%] h-64 w-64 bg-gold-400/20"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="ob-orb bottom-[10%] right-[6%] h-80 w-80 bg-primary-400/25"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="ob-orb left-[38%] top-[46%] h-52 w-52 bg-gold-300/10"
          style={{ animationDelay: "-3s" }}
        />
      </div>

      <div className="relative mx-auto flex min-h-full w-full max-w-lg items-center justify-center px-4 py-10">
        <div className="ob-card w-full rounded-2xl bg-white/[0.97] p-6 shadow-2xl backdrop-blur sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${index === step ? "w-7 bg-gold-400" : index < step ? "w-3 bg-primary-300" : "w-3 bg-border"}`}
                />
              ))}
            </div>
            <button
              className="rounded-md px-2 py-1 text-small text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => void close(true)}
              type="button"
            >
              {text.skip}
            </button>
          </div>

          <div className="ob-bar mt-3 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-l from-gold-300 to-gold-500"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>

          <div
            className="ob-step mt-6"
            key={stepKey}
            style={
              { "--ob-x": `${reducedMotion ? 0 : enterX}px` } as CSSProperties
            }
          >
            {step === 0 && (
              <StepWelcome
                body={text.welcomeBody}
                delay={reducedMotion}
                eyebrow={text.eyebrow}
                title={text.welcomeTitle(firstName)}
              />
            )}
            {step === 1 && (
              <StepCenter
                body={text.discoverBody}
                delay={reducedMotion}
                eyebrow={text.discoverEyebrow}
                icon={<Search className="size-7 text-white" />}
                title={text.discoverTitle}
              />
            )}
            {step === 2 && (
              <StepFeatures
                delay={reducedMotion}
                eyebrow={text.exploreEyebrow}
                features={text.features}
                title={text.exploreTitle}
              />
            )}
            {step === 3 && (
              <StepCenter
                body={text.startBody}
                delay={reducedMotion}
                eyebrow={text.startEyebrow}
                icon={<Building2 className="size-7 text-white" />}
                title={text.startTitle}
              />
            )}
          </div>

          <p className="mt-6 text-center text-caption text-muted-foreground">
            {text.stepOf(step + 1, TOTAL_STEPS)}
          </p>

          <div className="mt-3 flex items-center gap-3">
            {step > 0 ? (
              <Button
                className="ob-btn shrink-0"
                onClick={() => goTo(step - 1)}
                type="button"
                variant="secondary"
              >
                <BackIcon className="size-4" />
                {text.back}
              </Button>
            ) : (
              <span className="shrink-0" />
            )}
            {step < TOTAL_STEPS - 1 ? (
              <Button
                className="ob-btn flex-1"
                onClick={() => goTo(step + 1)}
                type="button"
              >
                {text.next}
                <NextIcon className="size-4" />
              </Button>
            ) : (
              <div className="grid flex-1 gap-2.5">
                <Button
                  className="ob-btn w-full"
                  onClick={() => finish("/properties")}
                  type="button"
                >
                  <Sparkles className="size-4" />
                  {text.browse}
                </Button>
                <Link
                  className="ob-btn inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-small font-bold text-foreground transition-colors hover:bg-muted"
                  href="/my-listings/new"
                  onClick={() => void close(true)}
                >
                  {text.addListing}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-small font-bold uppercase tracking-wide text-primary-600">
      {children}
    </p>
  );
}

function StepWelcome({
  body,
  delay,
  eyebrow,
  title,
}: {
  body: string;
  delay: boolean;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="text-center">
      <div
        className="ob-rise mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-3xl shadow-2xl"
        style={delay ? undefined : { animationDelay: "40ms" }}
      >
        👋
      </div>
      <div
        className="ob-rise mt-5"
        style={delay ? undefined : { animationDelay: "110ms" }}
      >
        <Eyebrow>{eyebrow}</Eyebrow>
      </div>
      <h2
        className="ob-rise mt-2 text-balance text-3xl font-bold text-foreground"
        style={delay ? undefined : { animationDelay: "170ms" }}
      >
        {title}
      </h2>
      <p
        className="ob-rise mx-auto mt-3 max-w-md text-body text-muted-foreground"
        style={delay ? undefined : { animationDelay: "230ms" }}
      >
        {body}
      </p>
    </div>
  );
}

function StepCenter({
  body,
  delay,
  eyebrow,
  icon,
  title,
}: {
  body: string;
  delay: boolean;
  eyebrow: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="text-center">
      <div
        className="ob-rise mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-2xl"
        style={delay ? undefined : { animationDelay: "40ms" }}
      >
        {icon}
      </div>
      <div
        className="ob-rise mt-5"
        style={delay ? undefined : { animationDelay: "110ms" }}
      >
        <Eyebrow>{eyebrow}</Eyebrow>
      </div>
      <h2
        className="ob-rise mt-2 text-balance text-3xl font-bold text-foreground"
        style={delay ? undefined : { animationDelay: "170ms" }}
      >
        {title}
      </h2>
      <p
        className="ob-rise mx-auto mt-3 max-w-md text-body text-muted-foreground"
        style={delay ? undefined : { animationDelay: "230ms" }}
      >
        {body}
      </p>
    </div>
  );
}

function StepFeatures({
  delay,
  eyebrow,
  features,
  title,
}: {
  delay: boolean;
  eyebrow: string;
  features: ReadonlyArray<{
    icon: ComponentType<{ className?: string }>;
    title: string;
    body: string;
  }>;
  title: string;
}) {
  return (
    <div>
      <div
        className="ob-rise text-center"
        style={delay ? undefined : { animationDelay: "40ms" }}
      >
        <Eyebrow>{eyebrow}</Eyebrow>
      </div>
      <h2
        className="ob-rise mt-2 text-balance text-center text-2xl font-bold text-foreground"
        style={delay ? undefined : { animationDelay: "110ms" }}
      >
        {title}
      </h2>
      <div className="mt-5 grid gap-2.5">
        {features.map((feature, index) => (
          <div
            className="ob-rise flex items-start gap-3 rounded-xl border border-border bg-background p-3.5 text-start"
            key={feature.title}
            style={
              delay ? undefined : { animationDelay: `${170 + index * 70}ms` }
            }
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600">
              <feature.icon className="size-5" />
            </span>
            <span>
              <span className="block text-body font-bold text-foreground">
                {feature.title}
              </span>
              <span className="mt-0.5 block text-small text-muted-foreground">
                {feature.body}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
