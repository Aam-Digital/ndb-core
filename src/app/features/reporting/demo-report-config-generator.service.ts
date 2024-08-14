import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../../core/demo-data/demo-data-generator";
import { ReportEntity } from "./report-config";
import { Child } from "../../child-dev-project/children/model/child";
import { School } from "../../child-dev-project/schools/model/school";
import { ChildSchoolRelation } from "../../child-dev-project/children/model/childSchoolRelation";
import { EventNote } from "../../child-dev-project/attendance/model/event-note";

@Injectable()
export class DemoReportConfigGeneratorService extends DemoDataGenerator<ReportEntity> {
  static provider() {
    return [
      {
        provide: DemoReportConfigGeneratorService,
        useClass: DemoReportConfigGeneratorService,
      },
    ];
  }

  protected generateEntities(): ReportEntity[] {
    return demoReports.map((report) =>
      Object.assign(new ReportEntity(), report),
    );
  }
}

const demoReports: Partial<ReportEntity>[] = [
  {
    title: $localize`:Name of a report:Basic Report`,
    aggregationDefinitions: [
      {
        query: `${Child.ENTITY_TYPE}:toArray[*isActive=true]`,
        label: $localize`:Label of report query:All children`,
        groupBy: ["gender"],
      },
      {
        query: `${School.ENTITY_TYPE}:toArray`,
        label: $localize`:Label for report query:All schools`,
        aggregations: [
          {
            label: $localize`:Label for report query:Children attending a school`,
            query: `:getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)[*isActive=true].childId:unique`,
          },
          {
            label: $localize`:Label for report query:Governmental schools`,
            query: `[*privateSchool!=true]`,
          },
          {
            query: `[*privateSchool!=true]:getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)[*isActive=true].childId::unique:toEntities(${Child.ENTITY_TYPE})`,
            label: $localize`:Label for report query:Children attending a governmental school`,
            groupBy: ["gender"],
          },
          {
            label: $localize`:Label for report query:Private schools`,
            query: `[*privateSchool=true]`,
          },
          {
            query: `[*privateSchool=true]:getRelated(${ChildSchoolRelation.ENTITY_TYPE}, schoolId)[*isActive=true].childId::unique:toEntities(${Child.ENTITY_TYPE})`,
            label: $localize`:Label for report query:Children attending a private school`,
            groupBy: ["gender"],
          },
        ],
      },
    ],
  },
  {
    title: $localize`:Name of a report:Event Report`,
    aggregationDefinitions: [
      {
        query: `${EventNote.ENTITY_TYPE}:toArray[*date >= ? & date <= ?]`,
        groupBy: ["category"],
        label: $localize`:Label for a report query:Events`,
        aggregations: [
          {
            query: `:getParticipantsWithAttendance(PRESENT):unique:toEntities(${Child.ENTITY_TYPE})`,
            groupBy: ["gender"],
            label: $localize`:Label for a report query:Participants`,
          },
        ],
      },
    ],
  },
  {
    title: $localize`:Name of a report:Attendance Report`,
    mode: "exporting",
    aggregationDefinitions: [
      {
        query: `${EventNote.ENTITY_TYPE}:toArray[* date >= ? & date <= ?]`,
        groupBy: { label: "Type", property: "category" },
        subQueries: [
          {
            query: ":getAttendanceArray:getAttendanceReport",
            subQueries: [
              {
                label: $localize`:Name of a column of a report:Name`,
                query: `.participant:toEntities(Child).name`,
              },
              {
                query:
                  ".participant:toEntities(Child):getRelated(ChildSchoolRelation, childId)[*isActive=true]",
                subQueries: [
                  {
                    label: "Class",
                    query: ".schoolClass",
                  },
                  {
                    label: "School",
                    query: ".schoolId:toEntities(School).name",
                  },
                ],
              },
              {
                label: $localize`:Name of a column of a report:Total`,
                query: `total`,
              },
              {
                label: $localize`:Name of a column of a report:Present`,
                query: `present`,
              },
              {
                label: $localize`:Name of a column of a report:Rate`,
                query: `percentage`,
              },
              {
                label: $localize`:Name of a column of a report:Late`,
                query: `detailedStatus.LATE`,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: $localize`:Name of a report:Materials Distributed`,
    mode: "exporting",
    aggregationDefinitions: [
      {
        query: `EducationalMaterial:toArray[*date >= ? & date <= ?]`,
        groupBy: { label: "Type", property: "materialType" },
        subQueries: [
          {
            label: "Number of events of handing out",
            query: `.materialAmount:count`,
          },
          {
            label: "Total Items",
            query: `.materialAmount:sum`,
          },
        ],
      },
    ],
  },
];
