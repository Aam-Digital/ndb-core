/**
 * Log level indicates the context and severity of a message.
 */
export enum LogLevel {
  /** for development and analysis */
  DEBUG,

  /** event during the regular functioning of the app */
  INFO,

  /** unexpected event that can still be handled */
  WARN,

  /** critical unexpected event that will affect the functioning of the app */
  ERROR,
}
