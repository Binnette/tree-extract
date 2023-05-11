import { Modal, Toast, Button } from 'bootstrap';
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
let lc: Control.Locate = new Control.Locate({
    initialZoomLevel: 13
}).addTo(map);
lc.start();

// Globals
let opl: Layer;
let currentData: any[] = [];
let genus: string;
let species: string;
const btnTreeSelect: HTMLButtonElement[] = [];

const modalTreeSearch = new Modal('#modalTreeSearch');
const modalTreeExport = new Modal('#modalTreeExport');
const genusInput = document.getElementById('treeGenus') as HTMLInputElement;
genusInput.value = '';
const speciesInput = document.getElementById('treeSpecies') as HTMLInputElement;
speciesInput.value = '';
const btnSearch = document.getElementById('btnSearch') as HTMLButtonElement;
const treeSearchAlert = document.getElementById('treeSearchAlert') as HTMLElement;
const btnExport = document.getElementById('btnExport') as HTMLButtonElement;
const toastNoData = new Toast('#toastNoData');
const toastLoaded = new Toast('#toastLoaded');
const toastTreeCount = document.getElementById('toastTreeCount') as HTMLDivElement;
const shortcutsDiv = document.getElementById('shortcuts') as HTMLDivElement;

function setSpecies(species: string) {
    btnTreeSelect.forEach((btn) => {
        btn.classList.toggle('active', btn.value == species);
    });
    genusInput.value = '';
    speciesInput.value = species;
}

function setGenus(genus: string) {
    btnTreeSelect.forEach((btn) => {
        btn.classList.toggle('active', btn.value == genus);
    });
    genusInput.value = genus;
    speciesInput.value = '';
}

let shortcuts = [
    {
        category: 'Common',
        items: [
            { name: '🍒 Cherry soft', species: 'Prunus avium' },
            { name: '🍒 Cherry acid', species: 'Prunus cerasus' },
            { name: '🍒 Cherry plum', species: 'Prunus cerasifera' },
            { name: '🫐 Plum', species: 'Prunus domestica' },
            { name: '🍑 Peach', species: 'Prunus persica' },
            { name: '🍑 Apricot', species: 'Prunus armeniaca' },
            { name: '🍏 Apple', species: 'Malus domestica' },
            { name: '🍐 Pear', species: 'Pyrus communis' },
            { name: '🍐 Quince', species: 'Cydonia oblonga' },
            { name: '🍑 Kaki persimmon', species: 'Diospyros kaki' },
            { name: '🍎 Pomegranate', species: 'Punica granatum' },
            { name: '🥝 Kiwi', genus: 'Actinidia' },
            { name: '🟣 Fig', species: 'Ficus carica' },
            { name: '🍇 Grapes', genus: 'Vitis' },
        ]
    }, {
        category: 'Citrus',
        items: [
            { name: '🍊 Mandarin', species: 'Citrus reticulata', show: false }, // Too few in OSM
            { name: '🍊 Clementine', species: 'Citrus × clementina', show: false }, // No tree in OSM
            { name: '🍊 Orange', species: 'Citrus × sinensis' },
            { name: '🍋 Lemon', species: 'Citrus × limon' },
        ]
    }, {
        category: 'Tropical',
        items: [
            { name: '🍌 Banana', species: 'Musa acuminata', show: false }, // Too few in OSM
            { name: '🍍 Pineapple', species: 'Hananas comosus' },
            { name: '🥭 Mango', species: 'Mangifera indica' },
            { name: '🍈 Papaya', species: 'Carica papaya' },
            { name: '🥥 Coconut', species: 'Cocos nucifera' },
            { name: '🏝️ Date', species: 'Phoenix dactylifera' },
        ]
    }, {
        category: 'Berries',
        items: [
            { name: '⚫️ Elderberry', species: 'Sambucus nigra' },
            { name: '⚫️ Mulberry', species: 'Morus nigra' },
            { name: '🔴 Rowanberry', species: 'Sorbus aucuparia' },
            { name: '🍇 Blackberry', species: 'Rubus fruticosus', show: false }, // Too few in OSM
            { name: '🔵 Blueberry', species: 'Vaccinium corymbosum', show: false }, // Too few in OSM
            { name: '🔴 Cranberry', species: 'Vaccinium macrocarpon', show: false }, // Too few in OSM
            { name: '🔴 Currant', species: 'Ribes rubrum', show: false }, // Too few in OSM
        ]
    }, {
        category: 'Nuts',
        items: [
            { name: '🌰 Almonds', species: 'Prunus dulcis' },
            { name: '🌰 Brazil Nuts', species: 'Bertholletia excelsa', show: false }, // Too few in OSM
            { name: '🌰 Cashews', species: 'Anacardium occidentale', show: false }, // Too few in OSM
            { name: '🌰 Chestnuts', species: 'Castanea sativa' },
            { name: '🌰 Hazelnuts', species: 'Corylus avellana' },
            { name: '🌰 Pecans', species: 'Carya illinoinensis', show: false }, // Too few in OSM
            { name: '🌰 Macadamia Nuts', species: 'Macadamia integrifolia', show: false }, // Too few in OSM
            { name: '🌰 Pistachios', species: 'Pistacia vera', show: false }, // Too few in OSM
        ]
    }, {
        category: 'Others',
        items: [
            { name: '🥑 Avocado', species: 'Persea americana' },
            { name: '🫒 Olive', species: 'Olea europaea' },
            { name: '💮 Robinia', species: 'Robinia pseudoacacia' },
        ]
    }
];

shortcuts.forEach(c => {
    const cat = c.category.replace(/[^a-zA-Z0-9]/g, '');
    const accordionItem = document.createElement('div');
    accordionItem.className = 'accordion-item';

    const accordionHeader = document.createElement('h2');
    accordionHeader.className = 'accordion-header';
    accordionHeader.id = 'heading' + cat;

    const accordionButton = document.createElement('button');
    accordionButton.className = 'accordion-button collapsed';
    accordionButton.type = 'button';
    accordionButton.setAttribute('data-bs-toggle', 'collapse');
    accordionButton.setAttribute('data-bs-target', '#collapse' + cat);
    accordionButton.setAttribute('aria-expanded', 'false');
    accordionButton.setAttribute('aria-controls', 'collapse' + cat);
    accordionButton.textContent = c.category;

    const accordionCollapse = document.createElement('div');
    accordionCollapse.id = 'collapse' + cat;
    accordionCollapse.className = 'accordion-collapse collapse';
    accordionCollapse.setAttribute('aria-labelledby', 'heading' + cat);
    accordionCollapse.setAttribute('data-bs-parent', '#shortcuts');

    const accordionBody = document.createElement('div');
    accordionBody.className = 'accordion-body';

    accordionHeader.appendChild(accordionButton);
    accordionItem.appendChild(accordionHeader);
    accordionCollapse.appendChild(accordionBody);
    accordionItem.appendChild(accordionCollapse);

    c.items.forEach(e => {
        if ('show' in e && !e.show) {
            return;
        }

        const button = document.createElement('button') as HTMLButtonElement;
        button.type = 'button';
        button.className = 'btn btn-outline-primary btn-tree-select';
        button.setAttribute('data-bs-toggle', 'button');
        button.textContent = e.name;

        if ('species' in e && e.species) {
            button.value = e.species;
            button.onclick = () => { setSpecies(button.value); };
        }

        if ('genus' in e && e.genus) {
            button.value = e.genus;
            button.onclick = () => { setGenus(button.value); };
        }

        btnTreeSelect.push(button);
        accordionBody.appendChild(button);
        accordionBody.append(' ');
    });

    shortcutsDiv.appendChild(accordionItem);
});

btnSearch.onclick = () => {
    currentData = [];
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
        query += 'node[natural=tree][genus~"' + genus + '",i]({{bbox}});';
    }
    if (species) {
        query += 'node[natural=tree][species~"' + species + '",i]({{bbox}});';
    }
    query += '); out qt;'
    modalTreeSearch.hide();
    console.log(query);

    let oplOptions: any = {
        query: query,
        minZoom: 13,
        markerIcon: treeIcon,
        onSuccess: function (data: any) {
            for (let i = 0; i < data.elements.length; i++) {
                let pos;
                let marker;
                const e = data.elements[i];

                if (e.id in this._ids) {
                    continue;
                }

                this._ids[e.id] = true;
                currentData.push(e);

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
            let trees: number = currentData.length;
            let toastTxt: string = trees + " trees found 🌲"
            toastTreeCount.innerText = toastTxt;
            console.log(toastTxt);
            toastLoaded.show();
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

    var blob = new Blob([xmlString], { type: "application/gpx+xml;charset=utf-8" });
    let fileName: string = metadataName.replace(/[\/\\:;,?*|<>]/g, '_') + '.gpx';
    saveAs(blob, fileName);
}

function showModalTreeExport() {
    if (currentData.length < 0) {
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