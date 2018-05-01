import { Student } from "./students";
import { Medium } from "./Medium";

export class School {
  constructor(
    public id: number,
    public name: string,
    public address: string,
    public students: Student[],
    public medium: Medium,
    public max_class?: number,
    public remarks?: string,
    public board?: string,
) { }
}
