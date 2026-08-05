export class ProjectNotFoundError extends Error {
  constructor() {
    super("Project not found.");
    this.name = "ProjectNotFoundError";
  }
}

export class ProjectSlugAlreadyExistsError extends Error {
  constructor() {
    super("A project with this slug already exists.");
    this.name = "ProjectSlugAlreadyExistsError";
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
