import { SessionService } from "@/lib/auth/session";

import { CompetitionAuthorizer } from "./authorization/authorizer";
import { CompetitionContextResolver } from "./authorization/context-resolver";
import { CompetitionService } from "./service";

export class CompetitionFacade {
  static async getForEdit(hackathonId: string) {
    const actor = await SessionService.getActor();

    const context =
      await CompetitionContextResolver.resolve({
        actor,
        hackathonId,
      });

    CompetitionAuthorizer.edit(context);

    return CompetitionService.findForEdit(hackathonId);
  }
}