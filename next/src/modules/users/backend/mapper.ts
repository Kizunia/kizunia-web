/**
 * Users Module — Mapper
 *
 * Responsible for converting between database models and DTOs.
 * Prisma models should never be returned directly.
 */

import type { User } from "@/generated/prisma";
import type { UserDTO } from "../types";

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    image: user.image,
    role: user.role,
    createdAt: user.createdAt,
  };
}
