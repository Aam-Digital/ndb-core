// Event Types Configuration
// TODO: Need to make the changes on this event types configuration according to the logic implementation

export interface EventType {
  id: string;
  name: string;
  options: string[];
  icon: string;
  conditions: any[];
}

export const eventTypes: EventType[] = [
  {
    id: "student",
    name: "Student",
    options: ["Push", "Email"],
    icon: "user",
    conditions: [],
  },
  {
    id: "school",
    name: "School",
    options: ["Push", "Email"],
    icon: "school",
    conditions: [],
  },
  {
    id: "attendance",
    name: "Attendance",
    options: ["Push", "Email"],
    icon: "calendar",
    conditions: [],
  },
];
