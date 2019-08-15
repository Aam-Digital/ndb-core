import {Component, HostListener, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {ChildrenService} from '../children.service';
import { BlobServiceService } from 'app/webdav/blob-service.service';
import {Child} from '../child';
import { SafeUrl } from '@angular/platform-browser';

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
  image: SafeUrl = 'assets/child.png';

  constructor(private router: Router,
              private blobService: BlobServiceService,
              private childrenService: ChildrenService) { }

  ngOnInit() {
    if (this.entityId !== undefined) {
      this.childrenService.getChild(this.entityId).subscribe(child => {
        this.entity = child;
      });
    }
    // TODO: use entity.photoFile
    this.blobService.getImage(this.entity.getId().replace('child:', ''))
    .then( arrayBuffer => this.image = this.blobService.bufferArrayToBase64(arrayBuffer));
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
