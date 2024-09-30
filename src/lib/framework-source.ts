export abstract class FrameworkSource<T> {
  public readonly source: T;
  constructor(source: T) {
    this.source = source;
  }
}
