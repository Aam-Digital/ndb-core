
export class MeetingNoteAttendance {

  present: boolean = true;
  remarks: string = '';
  childID: string;

  constructor(childID: string) {
    this.childID = childID;
  }

  presence(presence: boolean): MeetingNoteAttendance {
    this.present = presence;
    return this;
  }

  remark(remarks: string): MeetingNoteAttendance {
    this.remarks = remarks;
    return this;
  }
}
