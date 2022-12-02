import { AfterViewInit, Component, Input, Output } from "@angular/core";
import * as L from "leaflet";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { Coordinates } from "../coordinates";

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
  @Input() set marked(coordinates: Coordinates) {
    const latLon = new L.LatLng(coordinates.lat, coordinates.lon);
    if (!this.marker) {
      this.marker = L.marker(latLon);
      this.marker.addTo(this.map);
    } else {
      this.marker.setLatLng(latLon);
    }
    this.map.flyTo(latLon);
  }

  private map: L.Map;
  private marker: L.Marker;
  private clickStream = new Subject<L.LatLng>();
  // TODO filter out double clicks
  @Output() mapClick = this.clickStream.pipe(debounceTime(200));

  ngAfterViewInit() {
    this.initMap();
  }

  private initMap() {
    this.map = L.map("map", {
      // TODO should be configurable
      center: [52.4790412, 13.4319106],
      zoom: 14,
    });
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
  }
}
