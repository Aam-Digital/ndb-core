import { Injectable } from "@angular/core";

import { Medium } from "./Medium";
import { School } from "./school";
import { Student } from "./students";
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {AlertService} from '../../alerts/alert.service';

@Injectable()
export class SchoolsServices {
  schools: School[];

  constructor(private entityMapper: EntityMapperService, private alertService: AlertService) {
    // example dummy data
    let s = new School('school:dummy');
    s.name ='Primary';
    s.address = 'India, asdw';
    s.students = [
        new Student(
          1,
          'Max Mustermann',
          10
        ),
        new Student(
          2,
          'Thomas Müller',
          12
        )
      ];
    s.medium = Medium.HINDI;
    this.schools = [s];

    // data loaded from pouchdb
    // TODO: make sure loaded school data is fitting the class and then remove dummy data above
    this.entityMapper.loadType<School>(School).then(
      loadedEntities => this.schools = this.schools.concat(loadedEntities),
      reason => this.alertService.addWarning(reason)
    );


  }

  getSingle(id) {
    return this.schools.find(school => school.id === id);
  }
}
