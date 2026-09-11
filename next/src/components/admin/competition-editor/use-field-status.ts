import { useCompetitionEditorStore } from "@/modules/competitions/store/editor-store";
import { deriveFieldStatus } from "@/modules/competitions/editor/field-status";
import type { CompetitionEditDTOWithPermissions } from "@/modules/competitions/types/edit-dto";

/**
 * Subscribes to one field's NULL/UNSAVED/DONE status, derived from the
 * store's `competition` vs `original` — see `field-status.ts`. Returns
 * `undefined` before the editor has initialized, so callers can omit the
 * badge entirely rather than show a misleading default.
 */
export function useFieldStatus<K extends keyof CompetitionEditDTOWithPermissions>(
  key: K,
) {
  return useCompetitionEditorStore((state) => {
    if (!state.competition || !state.original) return undefined;
    return deriveFieldStatus(state.competition[key], state.original[key]);
  });
}
