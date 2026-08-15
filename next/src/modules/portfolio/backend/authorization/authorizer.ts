import { Authorization } from "@/authorization";

import { PortfolioAction } from "./actions";
import type { PortfolioContext } from "./context";
import { PortfolioPolicy } from "./policy";

export class PortfolioAuthorizer {
  static read(
    context: PortfolioContext,
  ): void {
    Authorization.assert(
      PortfolioPolicy.can(
        context,
        PortfolioAction.VIEW,
      ),
    );
  }

  static create(
    context: PortfolioContext,
  ): void {
    Authorization.assert(
      PortfolioPolicy.can(
        context,
        PortfolioAction.CREATE,
      ),
    );
  }

  static edit(
    context: PortfolioContext,
  ): void {
    Authorization.assert(
      PortfolioPolicy.can(
        context,
        PortfolioAction.EDIT,
      ),
    );
  }

  static delete(
    context: PortfolioContext,
  ): void {
    Authorization.assert(
      PortfolioPolicy.can(
        context,
        PortfolioAction.DELETE,
      ),
    );
  }

  static can(
    context: PortfolioContext,
    action: PortfolioAction,
  ): void {
    Authorization.assert(
      PortfolioPolicy.can(
        context,
        action,
      ),
    );
  }
}