/**
 * Extend any class method to measure the duration it takes to finish and log it to the console.
 *
 * @example
class TestClass {
  @PerformanceAnalysisLogging
  async action() {
    // ...
  }
}
 */
export function PerformanceAnalysisLogging(
  target: Object,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<any>
) {
  const originalMethod = descriptor.value;
  descriptor.value = async function (...args) {
    const start = new Date().getTime();

    const actualResult = await originalMethod.call(this, ...args);

    const end = new Date().getTime();
    const duration = (end - start) / 1000;
    console.log(
      `duration [s] "${target.constructor.name}.${propertyKey}"`,
      duration
    );

    return actualResult;
  };
}
