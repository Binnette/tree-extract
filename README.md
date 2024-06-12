# tree-extract
Extract trees from OSM and import them into OsmAnd.

Online app: https://binnette.github.io/tree-extract/

## How to use

1. Geolocate yourself by clicking on the ↗️ button.
1. Click on the 🌲 button to select a tree.
1. For example, click on "Common", then "Apple", then the "Search" button.
1. Zoom in until you reach level 13 (current level is displayed on the top right).
1. Wait for the Overpass query result.
1. A popup will show the number of trees found and trees will be displayed on the map.
1. Click on the 💾 button to export trees to an OsmAnd GPX favorite file.
1. Import this file into OsmAnd.
1. You are now ready to visit those trees!

## Build and run

Prerequisites:
- NodeJS

Steps:

1. `git clone https://github.com/Binnette/tree-extract.git`
1. `cd tree-extract`
1. `npm i`
1. `npm run start`
1. Open http://localhost:9000/

## Deploy on GitHub-Pages

1. `npm i -g gh-pages`
1. `npm run deploy`

## Update datalist

Run `npm run datalist` to update the datalist.
These datalists are used for autocompletion when typing in the genus and species inputs.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
