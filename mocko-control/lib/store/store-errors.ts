export class StoreNotSupportedError extends Error {
  constructor(message = "Management operations require Redis mode") {
    super(message);
    this.name = "StoreNotSupportedError";
  }
}
