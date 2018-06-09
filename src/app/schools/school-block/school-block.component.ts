import {Component, HostListener, Input, OnInit} from '@angular/core';
import {School} from '../school';
import {Router} from '@angular/router';

@Component({
  selector: 'app-school-block',
  templateUrl: './school-block.component.html',
  styleUrls: ['./school-block.component.scss']
})
export class SchoolBlockComponent implements OnInit {
  @Input() entity: School;
  tooltip = false;
  tooltipTimeout;

  constructor(private router: Router) { }

  ngOnInit() {
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
    this.router.navigate(['/school', this.entity.getId()]);
  }
}
