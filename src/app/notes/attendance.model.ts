
export class AttendanceModel {
  present: boolean = true;
  remarks: string = '';
  childID: string;

  constructor(childID: string) {
    this.childID = childID;
  }

}
