import { Modal, Toast } from 'bootstrap';
import { Map, Layer, TileLayer, Control, Point, Icon, DomUtil } from 'leaflet';
import { saveAs } from 'file-saver';
import 'leaflet.locatecontrol';
import OverPassLayer from 'leaflet-overpass-layer';
import L from 'leaflet';

// Init map
let map = new Map('map').setView([46.521, 2.197], 6);
new TileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Start geolocalisation
let lc: Control.Locate = new Control.Locate().addTo(map);
lc.start();

// Globals
let opl: Layer;
let currentData: any;
let genus: string;
let species: string;

const modalTreeSearch = new Modal('#modalTreeSearch');
const modalTreeExport = new Modal('#modalTreeExport');
const genusInput = document.getElementById('treeGenus') as HTMLInputElement;
genusInput.value = '';
const speciesInput = document.getElementById('treeSpecies') as HTMLInputElement;
speciesInput.value = '';
const btnSearch = document.getElementById('btnSearch') as HTMLButtonElement;
const treeSearchAlert = document.getElementById('treeSearchAlert') as HTMLElement;
const btnExport = document.getElementById('btnExport') as HTMLButtonElement;
const toastNoData = new Toast('#toastNoData')
const shortcutsDiv = document.getElementById('shortcuts') as HTMLDivElement;

function setSpecies(species: string) {
    genusInput.value = '';
    speciesInput.value = species;
}

function setGenus(genus: string) {
    genusInput.value = genus;
    speciesInput.value = '';
}

let shortcuts = [
    {name: '🍒 Cherry soft', species: 'Prunus avium'},
    {name: '🍒 Cherry acid', species: 'Prunus cerasus'},
    {name: '🍒 Cherry plum', species: 'Prunus cerasifera'},
    {name: '🫐 Plum', species: 'Prunus domestica'},
    {name: '🍏 Apple', species: 'Malus domestica'},
    {name: '🍐 Pear', species: 'Pyrus communis'},
    {name: '🍑 Peach', species: 'Prunus persica'},
    {name: '🥝 Kiwi', genus: 'Actinidia'},
    {name: '🥑 Avocado', species: 'Persea americana'},
    {name: '🫒 Olive', species: 'Olea europaea'},
    {name: '🍇 Grapes', genus: 'Vitis'},
    {name: '🍊 Mandarin', species: 'Citrus reticulata'},
    {name: '🍋 Lemon', species: 'Citrus limon'},
    {name: '🍌 Banana', species: 'Musa acuminata'},
    {name: '🍍 Pineapple', species: 'Hananas comosus'},
    {name: '🥭 Mango', species: 'Mangifera indica'},
    {name: '🥥 Coconut', species: 'Cocos nucifera'},
];

shortcuts.forEach(e => {
    const button = document.createElement('button') as HTMLButtonElement;
    button.type = 'button';
    button.className = 'btn btn-outline-primary';
    button.textContent = e.name;
    if (e.species) {
        button.value = e.species;
        button.onclick = () => { setSpecies(button.value); };
    }

    if (e.genus) {
        button.value = e.genus;
        button.onclick = () => { setGenus(button.value); };
    }

    shortcutsDiv.appendChild(button);
    shortcutsDiv.append(' ');
});

btnSearch.onclick = () => {
    treeSearchAlert.classList.toggle('d-none', true);
    if (opl) {
        map.removeLayer(opl)
    }
    genus = genusInput.value;
    species = speciesInput.value;
    if (!genus && !species) {
        treeSearchAlert.classList.toggle('d-none', false);
        return;
    }
    let query = '(';
    if (genus) {
        query += 'node[natural=tree][genus~"' + genus + '",i]({{bbox}});'
    }
    if (species) {
        query += 'node[natural=tree][species~"' + species + '",i]({{bbox}});'
    }
    query += '); out qt;'
    modalTreeSearch.hide();
    console.log(query);

    let oplOptions: any = {
        query: query,
        minZoom: 13,
        markerIcon: treeIcon,
        onSuccess: function (data: any) {
            this._data = [];
            for (let i = 0; i < data.elements.length; i++) {
                let pos;
                let marker;
                const e = data.elements[i];

                if (e.id in this._ids) {
                    continue;
                }

                this._ids[e.id] = true;
                this._data.push(e);

                if (e.type === 'node') {
                    pos = L.latLng(e.lat, e.lon);
                } else {
                    pos = L.latLng(e.center.lat, e.center.lon);
                }

                if (this.options.markerIcon) {
                    marker = L.marker(pos, { icon: this.options.markerIcon });
                } else {
                    marker = L.circle(pos, 20, {
                        stroke: false,
                        fillColor: '#E54041',
                        fillOpacity: 0.9
                    });
                }

                const popupContent = this._getPoiPopupHTML(e.tags, e.id);
                const popup = L.popup().setContent(popupContent);
                marker.bindPopup(popup);

                this._markers.addLayer(marker);
            }
        },
        afterRequest: function () {
            currentData = this.getData();
        }
    }

    opl = new OverPassLayer(oplOptions);

    map.addLayer(opl);
};

const btnLoading = document.getElementById('#btnLoading');

function loadDataList(url: string, dataListId: string) {
    fetch(url)
        .then(response => response.json())
        .then(values => {
            const dataList = document.getElementById(dataListId) as HTMLElement;
            dataList.replaceChildren();

            values.forEach((value: string) => {
                const option = document.createElement('option');
                option.value = value;
                dataList.appendChild(option);
            });
        });
}

loadDataList('data/genus.json', 'selectGenus');
loadDataList('data/species.json', 'datalistSpecies');

const iconSize = new Point(40, 48);
const treeIcon = new Icon({
    iconUrl: 'img/tree.svg',
    iconSize: iconSize,
    iconAnchor: [iconSize.x / 2, iconSize.y],
    popupAnchor: [0, iconSize.y * -1]
});

function showModalTreeSearch() {
    btnSearch?.classList.toggle('d-none', false);
    btnLoading?.classList.toggle('d-none', true);
    modalTreeSearch.show();
}

let treeButton = new Control({
    position: 'topleft',
});
treeButton.onAdd = function () {
    const container = DomUtil.create('div', 'leaflet-bar leaflet-control');
    const button = DomUtil.create('a', '', container);
    button.innerHTML = '🌲';
    button.href = '#';
    button.onclick = function (e) {
        e.preventDefault();
        showModalTreeSearch();
    }
    return container;
};

map.addControl(treeButton);

btnExport.onclick = () => {
    const icon = 'nature_reserve';

    let background = 'circle';
    const radioBackground = document.querySelector('input[name="radioBackground"]:checked') as HTMLInputElement;
    if (radioBackground) {
        background = radioBackground.value;
    }
    
    let color = '#5fc33b';
    const inputColor = document.getElementById("inputColor") as HTMLInputElement;
    if (inputColor) {
        color = inputColor.value;
    } 

    const metadataName = [genus, species].filter(Boolean).join(' / ');   
    const xmlDoc = document.implementation.createDocument(null, 'gpx');
    const gpxElement = xmlDoc.documentElement;
    gpxElement.setAttribute('version', '1.1');
    gpxElement.setAttribute('creator', 'OsmAnd~ 4.1.11');
    gpxElement.setAttribute('xmlns', 'http://www.topografix.com/GPX/1/1');
    gpxElement.setAttribute('xmlns:osmand', 'https://osmand.net');
    gpxElement.setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
    gpxElement.setAttribute('xsi:schemaLocation', 'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd');

    const metadataElement = xmlDoc.createElement('metadata');
    const nameElement = xmlDoc.createElement('name');
    nameElement.textContent = metadataName;
    metadataElement.appendChild(nameElement);
    gpxElement.appendChild(metadataElement);

    for (const data of currentData) {
        const tags = data.tags;
        const wptElement = xmlDoc.createElement('wpt');
        wptElement.setAttribute('lat', data.lat.toString());
        wptElement.setAttribute('lon', data.lon.toString());

        const wptNameElement = xmlDoc.createElement('name');
        let nameTab = [tags.species || tags.genus || metadataName];
        nameTab.push(tags.start_date);
        nameTab.push(tags.age);
        nameTab.push(data.type[0] + data.id);
        const name = nameTab.filter(Boolean).join('; ');
        wptNameElement.textContent = name;
        wptElement.appendChild(wptNameElement);

        const descElement = xmlDoc.createElement('desc');
        const excludedKeys = ['denotation', 'natural', 'source'];
        const properties = Object.entries(data.tags)
            .filter(([key]) => !excludedKeys.includes(key))
            .map(([key, value]) => `${key}=${value}`);
        const desc = properties.join(',\r\n');
        descElement.textContent = desc;
        wptElement.appendChild(descElement);

        const typeElement = xmlDoc.createElement('type');
        typeElement.textContent = metadataName;
        wptElement.appendChild(typeElement);

        const extensionsElement = xmlDoc.createElement('extensions');

        const iconElement = xmlDoc.createElement('osmand:icon');
        iconElement.textContent = icon;
        extensionsElement.appendChild(iconElement);

        const backgroundElement = xmlDoc.createElement('osmand:background');
        backgroundElement.textContent = background;
        extensionsElement.appendChild(backgroundElement);

        const colorElement = xmlDoc.createElement('osmand:color');
        colorElement.textContent = color;
        extensionsElement.appendChild(colorElement);

        wptElement.appendChild(extensionsElement);
        gpxElement.appendChild(wptElement);
    }

    let serializer = new XMLSerializer();
    let xmlString = serializer.serializeToString(xmlDoc);

    var blob = new Blob([xmlString], {type: "application/gpx+xml;charset=utf-8"});
    let fileName: string = metadataName.replace(/[\/\\:;,?*|<>]/g, '_') + '.gpx';
    saveAs(blob, fileName);
}

function showModalTreeExport() {
    if (currentData){
        modalTreeExport.show();
    } else {
        toastNoData.show();
    }
}

let exportButton = new Control({
    position: 'topleft',
});
exportButton.onAdd = function () {
    const container = DomUtil.create('div', 'leaflet-bar leaflet-control');
    const button = DomUtil.create('a', '', container);
    button.innerHTML = '💾';
    button.href = '#';
    button.onclick = function (e) {
        e.preventDefault();
        showModalTreeExport();
    }
    return container;
};

map.addControl(exportButton);