import { AfterViewInit, Component, EventEmitter, Output } from "@angular/core";
import * as L from "leaflet";
import { from, Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";

const iconRetinaUrl = "assets/marker-icon-2x.png";
const iconUrl = "assets/marker-icon.png";
const shadowUrl = "assets/marker-shadow.png";
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.scss"],
})
export class MapComponent implements AfterViewInit {
  map: L.Map;
  marker: L.Marker = L.marker([52.4790412, 13.4319106]);
  private clickStream = new Subject<L.LatLng>();
  // TODO filter out double clicks
  @Output() mapClick = this.clickStream.pipe(debounceTime(200));

  constructor() {
    this.mapClick.subscribe((res) => console.log("clicked", res));
  }

  ngAfterViewInit(): void {
    this.map = L.map("map", {
      center: [52.4790412, 13.4319106],
      zoom: 14,
    });
    // this.marker.setLatLng(res.latlng);
    // this.map.flyTo(res.latlng);
    this.map.addEventListener("click", (res) =>
      this.clickStream.next(res.latlng)
    );

    const tiles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );
    tiles.addTo(this.map);

    this.marker.addTo(this.map);
  }
}
