import { Student } from "./students";

export class School {
  constructor(
    public id: number,
    public name: string,
    public location?: string,
    public students?: Student[]
  ) { }
}
