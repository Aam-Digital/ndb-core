import {Component, HostListener, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {School} from '../school';

@Component({
  selector: 'app-school-block',
  templateUrl: './school-block.component.html',
  styleUrls: ['./school-block.component.scss']
})
export class SchoolBlockComponent implements OnInit {
  @Input() entity: School = new School('');
  @Input() entityId: string;
  @Input() linkDisabled: boolean;
  tooltip = false;
  tooltipTimeout;

  constructor(private router: Router,
              private entityMapper: EntityMapperService) {
  }

  ngOnInit() {
    if (this.entityId !== undefined) {
      this.entityMapper.load(School, this.entityId).then(school => {
        this.entity = school;
      });
    }
  }

  showTooltip() {
    this.tooltip = true;
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }
  }
  hideTooltip() {
    this.tooltipTimeout = setTimeout(() => this.tooltip = false, 250);
  }


  @HostListener('click') onClick() {
    this.showDetailsPage();
  }

  showDetailsPage() {
    if (!this.linkDisabled) {
      this.router.navigate(['/school', this.entity.getId()]);
    }
  }
}
