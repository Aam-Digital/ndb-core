export enum InteractionTypes {
  NONE = '',
  HOME_VISIT = 'Home Visit',
  GUARDIAN_TALK = 'Talk with Guardians',
  CHILD_TALK = 'Talk with Child',
  INCIDENT = 'Incident',
  DISCUSSION = 'Discussion/Decision',
  VISIT = 'School/Hostel Visit',
  PHONE_CALL = 'Phone Call',
  COACHING_TALK = 'Talk with Coaching Teacher',
  PEER_TALK = 'Talk with Peer',
  NEIGHBOUR_TALK = 'Talk with Neighbours',
  GUARDIAN_MEETING = 'Guardians\' Meeting',
  CHILDREN_MEETING = 'Children\'s Meeting',
  DAILY_ROUTINE = 'Daily Routine',
  ANNUAL_SURVEY = 'Annual Survey',
  EXCURSION = 'Excursion/Trip',
  PARTNER_CONTACT = 'Contact with other partners (club/NGO/...)',
}

export const INTERACTION_TYPE_COLORS: Map<InteractionTypes, string> = new Map([
  [InteractionTypes.GUARDIAN_MEETING, '#E1F5FE'],
  [InteractionTypes.CHILDREN_MEETING, '#E1F5FE'],
  [InteractionTypes.EXCURSION, '#E1F5FE'],
  [InteractionTypes.DISCUSSION, '#E1BEE7'],
  [InteractionTypes.ANNUAL_SURVEY, '#FFFDE7'],
  [InteractionTypes.DAILY_ROUTINE, '#F1F8E9'],
]);
