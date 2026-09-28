export class NotAGoldSetError extends Error {
  constructor(message = "Synthetic fixtures are not a gold set.") {
    super(message);
    this.name = "NotAGoldSetError";
  }
}

export class MetricRefusalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MetricRefusalError";
  }
}
