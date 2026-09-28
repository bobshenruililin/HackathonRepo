export class ObservationInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObservationInputError";
  }
}
