import {Component, Input, OnInit} from '@angular/core';
import {ProgressDashboardConfig, ProgressDashboardPart} from './progress-dashboard-config';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {AlertService} from '../../alerts/alert.service';

@Component({
  selector: 'app-progress-dashboard',
  templateUrl: './progress-dashboard.component.html',
  styleUrls: ['./progress-dashboard.component.scss']
})
export class ProgressDashboardComponent implements OnInit {

  @Input() dashboardConfigId = '';
  data: ProgressDashboardConfig;
  configure = false;

  constructor(private entityMapper: EntityMapperService,
              private alertService: AlertService,
  ) { }

  ngOnInit() {
    this.data = new ProgressDashboardConfig(this.dashboardConfigId);
    this.entityMapper.load<ProgressDashboardConfig>(ProgressDashboardConfig, this.dashboardConfigId)
      .then(config => {
        this.data = config;
      })
      .catch(e => {
        if (e.status === 404) {
          this.alertService.addDebug(`ProgressDashboardConfig (${this.dashboardConfigId}) not found. Creating ...`);
          this.createDefaultConfig();
        } else {
          this.alertService.addWarning(`Error loading ProgressDashboardConfig (${this.dashboardConfigId}): ${e.message}`);
        }
      });
  }

  private createDefaultConfig() {
    this.data.title = 'Progress of X';
    this.addPart();
    this.addPart();
    this.save();
  }


  addPart() {
    const newPart: ProgressDashboardPart = {
      label: 'Part',
      currentValue: 1,
      targetValue: 10,
    };
    this.data.parts.push(newPart);
  }

  async save() {
    await this.entityMapper.save(this.data);
    this.configure = false;
  }
}
