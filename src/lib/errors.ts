export class ApiError extends Error {
  constructor(message: string, public status = 0, public data: Record<string, unknown> = {}) {
    super(message);
  }
}
