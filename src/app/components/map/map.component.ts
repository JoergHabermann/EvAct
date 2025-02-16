import { Component, OnInit } from '@angular/core';
declare let L: any;  // Leaflet global verfügbar machen

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements OnInit {

  ngOnInit(): void {
    // Karte initialisieren
    const map = L.map('map').setView([51.505, -0.09], 13);

    // OpenStreetMap-Tiles hinzufügen
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Marker hinzufügen
    L.marker([51.505, -0.09]).addTo(map)
      .bindPopup('A pretty popup.<br> Easily customizable.')
      .openPopup();
  }
}
