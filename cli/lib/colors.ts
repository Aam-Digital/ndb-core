import { styleText } from "node:util";

type Format = Parameters<typeof styleText>[0];

/**
 * Colorize text for terminal output.
 *
 * Node's `styleText` strips the escape codes automatically when the target
 * stream is not a TTY (piped output, CI logs) or when `NO_COLOR` is set,
 * so callers don't need to guard for that themselves.
 */
export function color(format: Format, text: string): string {
  return styleText(format, text);
}

/** Like {@link color}, but checks stderr since that is where the text goes. */
export function colorErr(format: Format, text: string): string {
  return styleText(format, text, { stream: process.stderr });
}
