
export class AttendanceModel {

  present: boolean = true;
  remarks: string = '';
  childID: string;

  constructor(childID: string) {
    this.childID = childID;
  }

  presence(presence: boolean): AttendanceModel {
    this.present = presence;
    return this;
  }

  remark(remarks: string): AttendanceModel {
    this.remarks = remarks;
    return this;
  }
}
