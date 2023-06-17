# tree-extract
Extract trees from OSM and import them in OsmAnd

Online app: https://binnette.github.io/tree-extract/

## Build and run

Prerequisites:
- NodeJS 

1. `git clone https://github.com/Binnette/tree-extract.git`
1. `cd tree-extract`
1. `npm i`
1. `npm run start`
1. Open http://localhost:9000/

## Deploy on GitHub-Pages

1. `npm run predeploy`
1. `npm run deploy`

## Update datalist

Run `npm run datalist` to update the datalist. Those datalists are used for autocompletion when typing in inputs genus and species.