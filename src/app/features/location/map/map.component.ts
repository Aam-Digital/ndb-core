import { AfterViewInit, Component, Input, Output } from "@angular/core";
import * as L from "leaflet";
import { Observable, Subject } from "rxjs";
import { debounceTime, map } from "rxjs/operators";
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
  // TODO this should be configurable
  private readonly start_location: L.LatLngTuple = [52.4790412, 13.4319106];

  @Input() set marked(coordinates: Coordinates | Coordinates[]) {
    if (!coordinates) {
      return;
    }
    if (Array.isArray(coordinates)) {
      this.setMultipleMarkers(coordinates);
    } else {
      this.setMarker(coordinates);
    }
    if (this.map) {
      this.showMarkersOnMap();
    }
  }

  private map: L.Map;
  private marker: L.Marker;
  private markers: L.Marker[];
  private clickStream = new Subject<L.LatLng>();
  // TODO filter out double clicks
  @Output() mapClick: Observable<Coordinates> = this.clickStream.pipe(
    debounceTime(200),
    map((c) => ({ lat: c.lat, lon: c.lng }))
  );

  ngAfterViewInit() {
    this.initMap();
  }

  private initMap() {
    this.map = L.map("map", {
      center: this.marker ? this.marker.getLatLng() : this.start_location,
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

    if (this.marker || this.markers) {
      this.showMarkersOnMap();
    }
  }

  private setMultipleMarkers(coordinates: Coordinates[]) {
    if (this.markers && this.map) {
      this.markers.forEach((marker) => marker.removeFrom(this.map));
    }
    this.markers = coordinates.map((coord) => L.marker([coord.lat, coord.lon]));
  }

  private setMarker(coordinates: Coordinates) {
    const latLon = new L.LatLng(coordinates.lat, coordinates.lon);
    if (!this.marker) {
      this.marker = L.marker(latLon);
    } else {
      this.marker.setLatLng(latLon);
    }
  }

  private showMarkersOnMap() {
    if (this.markers) {
      this.markers.forEach((marker) => marker.addTo(this.map));
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
    if (this.marker) {
      this.marker.addTo(this.map);
      this.map.flyTo(this.marker.getLatLng());
    }
  }
}
