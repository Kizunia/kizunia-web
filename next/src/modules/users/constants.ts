/**
 * Users Module — Constants
 */

export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;

export const USER_LIMITS = {
  MAX_NAME_LENGTH: 100,
  MAX_BIO_LENGTH: 500,
  MAX_USERNAME_LENGTH: 30,
} as const;
