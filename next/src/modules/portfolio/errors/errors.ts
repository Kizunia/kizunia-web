import {
  ConflictError,
  HttpStatus,
  NotFoundError,
} from "@/lib/errors";



export class PortfolioNotFoundError extends NotFoundError {
  constructor() {
    super({
      code: "PORTFOLIO_NOT_FOUND",
      message: "Portfolio not found.",
    });
  }
}

export class PortfolioAlreadyExistsError extends ConflictError {
  constructor() {
    super({
      code: "PORTFOLIO_ALREADY_EXISTS",
      status: HttpStatus.CONFLICT,
      message: "The user already has a portfolio.",
    });
  }
}




