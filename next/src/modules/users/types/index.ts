/**
 * Users Module — Types
 */

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  username: string | null;
  image: string | null;
  role: string | null;
  createdAt: Date;
}
