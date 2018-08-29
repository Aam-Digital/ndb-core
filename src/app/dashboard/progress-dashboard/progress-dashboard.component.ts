import {Component, Input, OnInit} from '@angular/core';
import {ProgressDashboardConfig} from './progress-dashboard-config';
import {EntityMapperService} from '../../entity/entity-mapper.service';

@Component({
  selector: 'app-progress-dashboard',
  templateUrl: './progress-dashboard.component.html',
  styleUrls: ['./progress-dashboard.component.scss']
})
export class ProgressDashboardComponent implements OnInit {

  @Input() dashboardConfigId;
  data: ProgressDashboardConfig;
  configure = false;

  constructor(private entityMapper: EntityMapperService) { }

  ngOnInit() {
    this.data = new ProgressDashboardConfig(this.dashboardConfigId);
    this.entityMapper.load<ProgressDashboardConfig>(ProgressDashboardConfig, this.dashboardConfigId)
      .then(config => {
        this.data = config;
      })
      .catch(e => console.log(e));

    this.addPart();
  }


  addPart() {
    const newPart = {
      label: 'Part',
      currentValue: 1,
      targetValue: 10,
    };
    this.data.parts.push(newPart);
  }

  save() {
    this.entityMapper.save(this.data)
      .then(x => console.log(x))
      .catch(e => console.log(e));
    this.configure = false;
  }
}
