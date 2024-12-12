export interface EventType {
  id: string;
  name: string;
  description: string;
  options: string[];
  conditions: any[];
}

export const eventTypes: EventType[] = [
  {
    id: "student",
    name: "Student Notifications",
    description: "Get notified about updates on students.",
    options: ["Push", "Email"],
    conditions: [],
  },
  {
    id: "school",
    name: "School Notifications",
    description: "Get updates about school events or changes.",
    options: ["Push", "Email"],
    conditions: [],
  },
  {
    id: "attendance",
    name: "Attendance Notifications",
    description: "Stay informed about attendance updates.",
    options: ["Push", "Email"],
    conditions: [],
  },
];
