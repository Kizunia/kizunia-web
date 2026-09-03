"use client";

/**
 * Search Core (React) - Free-text controls
 *
 * Two related controls: a single search box, and a token field for filters
 * that accept several independent substrings.
 */

import { useEffect, useState, type KeyboardEvent } from "react";
import { SearchIcon, XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import type { TextAnySpec, TextSpec } from "../../spec";
import type { FilterControlProps } from "./types";

/**
 * How long typing pauses before a search is emitted.
 *
 * Long enough that ordinary typing produces one request rather than one per
 * character; short enough that a person who has stopped typing does not notice
 * waiting. Each emission is a server round trip, so this number is the
 * difference between a responsive page and a thrashing one.
 */
const TYPING_DEBOUNCE_MS = 350;

export function TextControl({
  spec,
  value,
  onChange,
  disabled,
}: FilterControlProps<TextSpec>) {
  const [draft, setDraft] = useState(value ?? "");

  // Re-sync when the applied value changes from outside — a chip removed, a
  // Clear all, or the back button. Without this the input would keep showing
  // text that is no longer filtering anything.
  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  useEffect(() => {
    const current = value ?? "";

    if (draft === current) {
      return;
    }

    const timer = setTimeout(() => {
      onChange(draft.trim().length > 0 ? draft : undefined);
    }, TYPING_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // `onChange` is intentionally excluded: it is recreated on every render by
    // callers that close over the current params, and depending on it would
    // restart the timer continuously and never fire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, value]);

  return (
    <div className="relative">
      <SearchIcon
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />

      <Input
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={spec.placeholder ?? spec.label}
        aria-label={spec.label}
        className="pl-9 pr-9"
      />

      {draft.length > 0 && (
        <button
          type="button"
          onClick={() => setDraft("")}
          aria-label={`Clear ${spec.label.toLowerCase()}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/**
 * Several free-text values, each matched as a substring and OR-ed together.
 *
 * Entered as tokens rather than as one comma-separated string, because the
 * comma is the encoding, not the interface. Making the person type the
 * separator would expose a serialisation detail and would make "Acme, Inc"
 * impossible to express deliberately.
 */
export function TextAnyControl({
  spec,
  value,
  onChange,
  disabled,
}: FilterControlProps<TextAnySpec>) {
  const [draft, setDraft] = useState("");

  const tokens = value ?? [];

  const commit = () => {
    const trimmed = draft.trim();

    // Silently ignoring a duplicate is right: the person's intent is already
    // satisfied, and an error for asking twice would be pedantic.
    if (trimmed.length === 0 || tokens.includes(trimmed)) {
      setDraft("");
      return;
    }

    onChange([...tokens, trimmed]);
    setDraft("");
  };

  const remove = (token: string) => {
    const next = tokens.filter((entry) => entry !== token);

    onChange(next.length > 0 ? next : undefined);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
      return;
    }

    // Backspace on an empty field removes the last token — the convention
    // every tag input follows, and the fastest way to undo a mistake.
    if (event.key === "Backspace" && draft.length === 0 && tokens.length > 0) {
      remove(tokens[tokens.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={spec.placeholder ?? `Add ${spec.label.toLowerCase()}`}
        aria-label={spec.label}
      />

      {tokens.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tokens.map((token) => (
            <Badge key={token} variant="secondary" className="gap-1 pr-1">
              <span className="max-w-40 truncate">{token}</span>

              <button
                type="button"
                onClick={() => remove(token)}
                aria-label={`Remove ${token}`}
                className="rounded-sm p-0.5 transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
