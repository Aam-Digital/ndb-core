/**
 * Interface specifying overall note
 * as stored in the config database
 */
export interface NoteConfig {
  InteractionTypes: {
    [key: string]: InteractionType;
  };
}
export interface InteractionType {
  name: string;
  color?: string;
  isMeeting?: boolean;
}
