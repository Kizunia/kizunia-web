import { PortfolioAction } from "./actions";
import type { PortfolioContext } from "./context";
import { PortfolioPolicy } from "./policy";

import type { PortfolioPermissionsDto } from "./dto";

export class PortfolioPermissionResolver {
  /**
   * Resolves all permissions available to the current actor.
   */
  static resolve(
    context: PortfolioContext,
  ): PortfolioPermissionsDto {
    return {
      canView: this.can(
        context,
        PortfolioAction.VIEW,
      ),

      canEdit: this.can(
        context,
        PortfolioAction.EDIT,
      ),

      canDelete: this.can(
        context,
        PortfolioAction.DELETE,
      ),
    };
  }

  private static can(
    context: PortfolioContext,
    action: PortfolioAction,
  ): boolean {
    return PortfolioPolicy.can(
      context,
      action,
    ).allowed;
  }
}