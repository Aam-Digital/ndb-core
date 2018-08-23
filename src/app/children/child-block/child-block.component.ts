import {Component, HostListener, Input, OnInit} from '@angular/core';
import {Child} from '../child';
import {Router} from '@angular/router';
import {EntityMapperService} from '../../entity/entity-mapper.service';

@Component({
  selector: 'app-child-block',
  templateUrl: './child-block.component.html',
  styleUrls: ['./child-block.component.scss']
})
export class ChildBlockComponent implements OnInit {
  @Input() entity: Child;
  @Input() entityId: string;
  @Input() linkDisabled: boolean;
  tooltip = false;
  tooltipTimeout;

  constructor(private router: Router,
              private entityMapper: EntityMapperService) { }

  ngOnInit() {
    if (this.entityId !== undefined) {
      this.entityMapper.load(Child, this.entityId).then(child => {
        this.entity = child;
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
