import { TaxonomyRepository } from "../repository/taxonomy.repository";
import type { TaxonomyQuery } from "../schemas/taxonomy-query";
import type { TaxonomyOptionDTO } from "../types/taxonomy-option.dto";

/** A row shaped like every taxonomy the filter UI consumes. */
interface CountedTaxonomyRow {
  readonly name: string;
  readonly slug: string;
  readonly _count: { readonly competitions: number };
}

export class TaxonomyService {
  /**
   * Business Layer
   *
   * Responsibilities
   * ----------------
   * ✓ Business rules
   * ✓ Repository orchestration
   * ✓ Mapping database models
   *
   * Does NOT
   * ----------------
   * ✗ Parse HTTP requests
   * ✗ Authenticate users
   * ✗ Authorize users
   * ✗ Query Prisma directly
   * ✗ Return NextResponse
   */

  /**
   * Category options for the filter picker.
   *
   * Categories and technologies are separate tables but identical from the
   * filter's point of view, so both funnel through one mapper. If they ever
   * diverge — a technology gaining an icon the picker should render — that is
   * the moment to split them, not before.
   */
  static async listCategories(
    query: TaxonomyQuery,
  ): Promise<TaxonomyOptionDTO[]> {
    const rows = await TaxonomyRepository.findCategories(query);

    return this.toOptions(rows, query.includeEmpty);
  }

  static async listTechnologies(
    query: TaxonomyQuery,
  ): Promise<TaxonomyOptionDTO[]> {
    const rows = await TaxonomyRepository.findTechnologies(query);

    return this.toOptions(rows, query.includeEmpty);
  }

  /**
   * Drops options nothing public uses, unless explicitly asked for them.
   *
   * Filtered here rather than in the query because the count is what decides
   * it, and expressing "having at least one visible competition" in Prisma
   * would need a second, more expensive relational condition for the same
   * answer this already has in hand.
   */
  private static toOptions(
    rows: readonly CountedTaxonomyRow[],
    includeEmpty: boolean,
  ): TaxonomyOptionDTO[] {
    return rows
      .filter((row) => includeEmpty || row._count.competitions > 0)
      .map((row) => ({
        value: row.slug,
        label: row.name,
        count: row._count.competitions,
      }));
  }
}
