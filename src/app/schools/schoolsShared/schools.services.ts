import {Injectable} from '@angular/core';
import {School} from './school';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {AlertService} from '../../alerts/alert.service';

@Injectable()
export class SchoolsServices {
  schools: School[];

  constructor(private entityMapper: EntityMapperService, private alertService: AlertService) {
    // example dummy data
    const s = new School('selectedSchool:dummy');
    s.name = 'Primary';
    s.address = 'India, asdw';
    s.medium = 'Hindi';
    this.schools = [s];

    // data loaded from pouchdb
    // TODO: make sure loaded selectedSchool data is fitting the class and then remove dummy data above
    this.entityMapper.loadType<School>(School).then(
      loadedEntities => this.schools = this.schools.concat(loadedEntities),
      reason => this.alertService.addWarning(reason)
    );


  }

  getSingle(id) {
    return this.schools.find(school => school.id === id);
  }
}
