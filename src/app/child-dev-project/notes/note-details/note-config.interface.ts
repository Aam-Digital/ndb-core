/**
 * Object specifying overall note
 * as stored in the config database
 */
export interface NoteConfig {
  InteractionTypes: {
    [key: string]: {
      name: string;
      color?: string;
      isMeeting?: boolean;
    };
  };
}
