"use client";

import type { FeatureFlag } from "@prisma/client";
import { Flag, Plus, RefreshCw, Save } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/i18n/routing";
import { apiFetch } from "@/lib/api-client";

const copy = {
  ar: {
    addTitle: "إضافة علم ميزة",
    key: "المفتاح",
    description: "الوصف",
    placeholder: "وصف داخلي مختصر للميزة",
    add: "إضافة",
    feature: "الميزة",
    status: "الحالة",
    noDescription: "لا يوجد وصف",
    enabled: "مفعلة",
    disabled: "متوقفة",
    enterKey: "أدخل مفتاح الميزة",
  },
  en: {
    addTitle: "Add Feature Flag",
    key: "Key",
    description: "Description",
    placeholder: "Short internal feature description",
    add: "Add",
    feature: "Feature",
    status: "Status",
    noDescription: "No description",
    enabled: "Enabled",
    disabled: "Disabled",
    enterKey: "Enter a feature key",
  },
} as const;

type FeatureFlagsManagerProps = {
  initialFlags: FeatureFlag[];
  locale: Locale;
};

type PendingState = Record<string, boolean>;

function normalizeFlagKey(key: string) {
  return key
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
}

export function FeatureFlagsManager({
  initialFlags,
  locale,
}: FeatureFlagsManagerProps) {
  const text = copy[locale];
  const [flags, setFlags] = useState(initialFlags);
  const [pending, setPending] = useState<PendingState>({});
  const [newKey, setNewKey] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sortedFlags = useMemo(
    () => [...flags].sort((a, b) => a.key.localeCompare(b.key)),
    [flags],
  );

  async function updateFlag(flag: FeatureFlag, isEnabled: boolean) {
    setError(null);
    setPending((current) => ({ ...current, [flag.id]: true }));

    try {
      const response = await apiFetch(`/api/admin/feature-flags/${flag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        data?: FeatureFlag;
        error?: string;
      };

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Unable to update feature flag");
      }

      setFlags((current) =>
        current.map((item) => (item.id === flag.id ? payload.data! : item)),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setPending((current) => ({ ...current, [flag.id]: false }));
    }
  }

  async function createFlag() {
    const key = normalizeFlagKey(newKey);

    if (!key) {
      setError(text.enterKey);
      return;
    }

    setError(null);
    setPending((current) => ({ ...current, create: true }));

    try {
      const response = await apiFetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          description: newDescription || undefined,
          isEnabled: false,
        }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        data?: FeatureFlag;
        error?: string;
      };

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Unable to create feature flag");
      }

      setFlags((current) => [...current, payload.data!]);
      setNewKey("");
      setNewDescription("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unknown error");
    } finally {
      setPending((current) => ({ ...current, create: false }));
    }
  }

  return (
    <div className="grid gap-6">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
          {error}
        </div>
      ) : null}

      <section className="rounded-md border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Flag className="size-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">{text.addTitle}</h2>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] md:items-end">
          <div className="grid gap-2">
            <Label htmlFor="feature-key">{text.key}</Label>
            <Input
              id="feature-key"
              onChange={(event) => setNewKey(event.target.value)}
              placeholder="AI_SEARCH"
              value={newKey}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="feature-description">{text.description}</Label>
            <Textarea
              id="feature-description"
              onChange={(event) => setNewDescription(event.target.value)}
              placeholder={text.placeholder}
              value={newDescription}
            />
          </div>
          <Button
            disabled={Boolean(pending.create)}
            onClick={createFlag}
            type="button"
          >
            {pending.create ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {text.add}
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-border bg-card">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] border-b border-border px-4 py-3 text-sm font-bold text-muted-foreground">
          <span>{text.feature}</span>
          <span>{text.status}</span>
        </div>
        <div className="divide-y divide-border">
          {sortedFlags.map((flag) => (
            <div
              className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              key={flag.id}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 text-xs font-bold text-primary">
                    {flag.key}
                  </code>
                  {pending[flag.id] ? (
                    <Save className="size-4 animate-pulse text-muted-foreground" />
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {flag.description ?? text.noDescription}
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-3 justify-self-start md:justify-self-end">
                <input
                  checked={flag.isEnabled}
                  className="peer sr-only"
                  disabled={Boolean(pending[flag.id])}
                  onChange={(event) => updateFlag(flag, event.target.checked)}
                  type="checkbox"
                />
                <span className="h-6 w-11 rounded-full bg-muted transition-colors after:block after:size-5 after:translate-x-0.5 after:translate-y-0.5 after:rounded-full after:bg-background after:shadow after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5" />
                <span className="min-w-20 text-sm font-bold text-foreground">
                  {flag.isEnabled ? text.enabled : text.disabled}
                </span>
              </label>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
