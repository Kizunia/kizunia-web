import type { StrictAuthorizationActor } from "@/authorization";

import { CompetitionSuggestionAuthorizer } from "./authorization/authorizer";

import { competitionSuggestionRepository } from "./repository";
import { CreateCompetitionSuggestionInput } from "../../schemas/create-competition-suggestion";
import { UpdateCompetitionSuggestionInput } from "../../schemas/update-competition-suggestion";
import { CompetitionSuggestionContextResolver } from "./authorization/resolver";
import { PlatformContextResolver } from "@/authorization/platform/resolver";

export class CompetitionSuggestionService {
  // ===========================================================================
  // Create
  // ===========================================================================

  static async create({
    actor,
    dto,
  }: {
    actor: StrictAuthorizationActor;
    dto: CreateCompetitionSuggestionInput;
  }) {
    const context = await PlatformContextResolver.resolve(actor);

    CompetitionSuggestionAuthorizer.create(context);

    return competitionSuggestionRepository.create({
      data: dto,
      submittedById: actor.id,
    });
  }

  // ===========================================================================
  // Read
  // ===========================================================================

  static async findById({
    actor,
    id,
  }: {
    actor: StrictAuthorizationActor;
    id: string;
  }) {
    const context = await CompetitionSuggestionContextResolver.resolve({
      actor,
      suggestionId: id,
    });

    CompetitionSuggestionAuthorizer.read(context);

    return context.suggestion;
  }

  // ===========================================================================
  // Read Mine
  // ===========================================================================

  static async findMine({ actor }: { actor: StrictAuthorizationActor }) {
    const context = await PlatformContextResolver.resolve(actor);

    CompetitionSuggestionAuthorizer.create(context); // TODO: This is a bit of a hack, but it works for now. We should probably have a separate authorizer for this.

    return competitionSuggestionRepository.findManyBySubmitter(actor.id);
  }

  // ===========================================================================
  // Update
  // ===========================================================================

  static async update({
    actor,
    id,
    dto,
  }: {
    actor: StrictAuthorizationActor;
    id: string;
    dto: UpdateCompetitionSuggestionInput;
  }) {
    const context = await CompetitionSuggestionContextResolver.resolve({
      actor,
      suggestionId: id,
    });

    CompetitionSuggestionAuthorizer.edit(context);

    return competitionSuggestionRepository.update({
      id,
      data: dto,
    });
  }

  // ===========================================================================
  // Submit
  // ===========================================================================

  static async submit({
    actor,
    id,
  }: {
    actor: StrictAuthorizationActor;
    id: string;
  }) {
    const context = await CompetitionSuggestionContextResolver.resolve({
      actor,
      suggestionId: id,
    });

    CompetitionSuggestionAuthorizer.submit(context);

    const submittedAt = context.suggestion.submittedAt ?? new Date();

    return competitionSuggestionRepository.markUnderReview({
      id,
      submittedAt,
    });
  }

  // ===========================================================================
  // Delete
  // ===========================================================================

  static async delete({
    actor,
    id,
  }: {
    actor: StrictAuthorizationActor;
    id: string;
  }) {
    const context = await CompetitionSuggestionContextResolver.resolve({
      actor,
      suggestionId: id,
    });

    CompetitionSuggestionAuthorizer.delete(context);

    await competitionSuggestionRepository.softDelete(id);
  }
}

export const competitionSuggestionService = CompetitionSuggestionService;
