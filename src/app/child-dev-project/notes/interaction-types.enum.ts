export enum InteractionTypes {
  NONE = "",
  TWINNING = "Twinning",
  MATCH = "Match",
  RETREAT = "Retreat",
  SOCIAL_ACTION = "Social Action",
}

export const INTERACTION_TYPE_COLORS: Map<InteractionTypes, string> = new Map([
  [InteractionTypes.TWINNING, "#E1F5FE"],
  [InteractionTypes.RETREAT, "#FFFDE7"],
]);
