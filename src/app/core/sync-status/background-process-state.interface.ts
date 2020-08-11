/**
 * Describe a task running in the background, such as index creation.
 */
export interface BackgroundProcessState {
  /** unique name of the process as displayed to user */
  title: string;

  /** additional optional details explaining the process */
  description?: string;

  /** whether the process is still running */
  pending: boolean;

  /** if the process has failed, contains the error details; otherwise undefined */
  error?: any;
}
