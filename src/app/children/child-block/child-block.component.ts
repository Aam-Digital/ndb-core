import {Component, HostListener, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {ChildrenService} from '../children.service';
import {ChildWithRelation} from '../childWithRelation';

@Component({
  selector: 'app-child-block',
  templateUrl: './child-block.component.html',
  styleUrls: ['./child-block.component.scss']
})
export class ChildBlockComponent implements OnInit {
  @Input() entity: ChildWithRelation;
  @Input() entityId: string;
  @Input() linkDisabled: boolean;
  tooltip = false;
  tooltipTimeout;

  constructor(private router: Router,
              private entityMapper: EntityMapperService,
              private childrenService: ChildrenService) { }

  ngOnInit() {
    if (this.entityId !== undefined) {
      this.childrenService.getChildWithRelation(this.entityId).then(child => {
        this.entity = child;
      }).catch(() => {
        // No special error handling here, as the database will report the technical error and the UI catches the entity being undefined
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
    if (this.linkDisabled) {
      return;
    }

    this.router.navigate(['/child', this.entity.getId()]);
  }
}
