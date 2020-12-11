/**
 * Interface specifying overall note
 * as stored in the config database
 */
export interface NoteConfig {
  InteractionTypes: {
    [key: string]: InteractionType;
  };
}
export class InteractionType {
  static NONE = { name: "" };

  name: string;
  color?: string;
  isMeeting?: boolean;
}
