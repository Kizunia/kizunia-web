/**
 * Users Module — Errors
 *
 * Contains feature-specific error classes.
 * All feature errors should inherit from AppError.
 */

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = "UserNotFoundError";
  }
}

export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`User already exists with email: ${email}`);
    this.name = "UserAlreadyExistsError";
  }
}
