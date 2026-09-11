"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { toDateTimeLocal, toIsoOrNull } from "./datetime-field";

/**
 * A `datetime-local` input that stays controlled but only commits on blur.
 *
 * Plain `defaultValue`+`onBlur` (this editor's original pattern) means the
 * displayed value never reverts when the underlying store value changes
 * out from under it — most importantly when the SaveBar/header's "Cancel"
 * (`reset()`) restores `competition` to `original`. This keeps its own
 * local text so typing isn't disrupted mid-edit, but resyncs from `value`
 * whenever *that* changes for a reason other than this input's own typing
 * (a prop change, i.e. Reset) — the same "controlled, but locally
 * buffered" shape `<input>` needs whenever the committed value and the
 * in-progress typed value can legitimately differ.
 */
export function DateTimeInput({
  id,
  value,
  disabled,
  onCommit,
}: {
  id?: string;
  /** The committed ISO value (or null), from the store. */
  value: string | null;
  disabled?: boolean;
  /** Called on blur with the parsed ISO value (or null for an emptied field). */
  onCommit: (iso: string | null) => void;
}) {
  const [text, setText] = useState(() => toDateTimeLocal(value));

  // Resync when the committed value changes for a reason other than this
  // input's own edits (Reset, or a save response landing) — but not on
  // every render, so a resync mid-typing doesn't fight the user.
  useEffect(() => {
    setText(toDateTimeLocal(value));
  }, [value]);

  return (
    <Input
      id={id}
      type="datetime-local"
      value={text}
      disabled={disabled}
      onChange={(event) => setText(event.target.value)}
      onBlur={(event) => onCommit(toIsoOrNull(event.target.value))}
    />
  );
}
