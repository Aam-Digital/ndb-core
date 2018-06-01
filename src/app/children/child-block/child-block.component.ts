import {Component, HostListener, Input, OnInit} from '@angular/core';
import {Child} from '../child';
import {Router} from '@angular/router';

@Component({
  selector: 'app-child-block',
  templateUrl: './child-block.component.html',
  styleUrls: ['./child-block.component.scss']
})
export class ChildBlockComponent implements OnInit {
  @Input() entity: Child;
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
    this.router.navigate(['/child', this.entity.getId()]);
  }
}
