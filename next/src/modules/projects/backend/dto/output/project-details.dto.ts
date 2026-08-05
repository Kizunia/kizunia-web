import { ProjectDto } from "./project.dto";

export interface ProjectDetailsDto extends ProjectDto {
  content: string | null;

  categories: {
    id: string;
    name: string;
    slug: string;
  }[];

  technologies: {
    id: string;
    name: string;
    slug: string;
    iconUrl: string | null;
  }[];

  badges: {
    id: string;
    name: string;
    description: string | null;
    icon: {
      id: string;
      url: string;
    } | null;
  }[];

  links: {
    id: string;
    title: string;
    url: string;
    type: string;
    order: number;
  }[];

  members: {
    id: string;
    username: string;
    displayName: string;
    avatar: {
      id: string;
      url: string;
    } | null;
  }[];

  createdAt: Date;

  updatedAt: Date;
}