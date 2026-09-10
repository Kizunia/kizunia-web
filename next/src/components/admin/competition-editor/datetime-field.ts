/**
 * Admin Competition Editor - `datetime-local` <-> ISO helpers
 *
 * Extracted from `locations-tab.tsx` (the first place a lifecycle-style date
 * was edited in this admin UI) so `schedule-tab.tsx` does not redeclare the
 * same two functions. Native `<input type="datetime-local">` is this
 * editor's established pattern for a single datetime field — see that
 * component's own history for why a shared `DateTimePicker` was not
 * introduced instead.
 */

/** Parses a `datetime-local` input's value into an ISO string, or null for
 * an empty field — which a PATCH reads as "leave it alone" is NOT what this
 * produces; an empty field here means "clear this date", so callers that
 * want "unchanged" must not call this for a field the user never touched. */
export function toIsoOrNull(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

/** Formats an ISO date for a `datetime-local` input, which rejects the `Z`. */
export function toDateTimeLocal(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  const offsetMs = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
