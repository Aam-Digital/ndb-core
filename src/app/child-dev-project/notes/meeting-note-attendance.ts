
export class MeetingNoteAttendance {

  present: boolean = true;
  remarks: string = '';
  childId: string;

  constructor(childId: string, presence: boolean = true, remark: string = '') {
    this.childId = childId;
    this.present = presence;
    this.remarks = remark;
  }
}
