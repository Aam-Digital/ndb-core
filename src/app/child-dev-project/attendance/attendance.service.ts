import { Injectable } from "@angular/core";
import { EntityMapperService } from "../../core/entity/entity-mapper.service";
import moment from "moment";
import { Note } from "../notes/model/note";

@Injectable({
  providedIn: "root",
})
export class AttendanceService {
  constructor(private entityService: EntityMapperService) {}

  async getEventsOnDate(date: Date) {
    const events = await this.entityService.loadType<Note>(Note);
    return events.filter(
      (e) => e.category.isMeeting && moment(e.date).isSame(date, "day")
    );
  }
}
