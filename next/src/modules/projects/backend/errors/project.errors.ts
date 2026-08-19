import { ConflictError, HttpStatus, NotFoundError, ResourceError } from "@/lib/errors";
import { ProjectErrorCode } from "./error-code";

export class ProjectNotFoundError extends NotFoundError {
  constructor(message = "Project not found.") {
    super({
      code: ProjectErrorCode.NOT_FOUND,
      message,
    });
  }
}

export class ProjectDeletedError extends ResourceError {
  constructor() {
    super({
      code: ProjectErrorCode.DELETED,
      status: 410,
      message: "Project has been deleted.",
    });
  }
}

export class ProjectSlugAlreadyExistsError extends Error {
  constructor() {
    super("A project with this slug already exists.");
    this.name = "ProjectSlugAlreadyExistsError";
  }
}

export class ProjectDuplicateSlugError extends ConflictError {
  constructor(slug: string) {
    super({
      code: ProjectErrorCode.DUPLICATE_SLUG,
      status: HttpStatus.CONFLICT,
      message: `Project slug "${slug}" already exists.`,
      details: {
        slug,
      },
    });
  }
}

export class ProjectAlreadyDeletedError extends Error {
  constructor() {
    super("Project has already been deleted.");
    this.name = "ProjectAlreadyDeletedError";
  }
}

export class ProjectValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectValidationError";
  }
}

