/*  This script fetches the top 100 genus and top 999 species from Osm TagInfo,
    saves them in genus.json and species.json in the data folder.
    Those files are bound to inputs genus/species in the web app,
    so users can get autocompletion when typing tree genus/species.
*/
const https = require('https');
const fs = require('fs');

function getDataFromTagInfo(key, count) {

    const params = {
        key: key,
        sortname: 'count',
        sortorder: 'desc',
        rp: count,
        page: 1
    };

    const urlString = new URL('https://taginfo.openstreetmap.org/api/4/key/values');
    urlString.search = new URLSearchParams(params).toString();

    const outFile = 'dist/data/' + key + '.json';

    https.get(urlString.href, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            const jsonData = JSON.parse(data);
            const values = jsonData.data
                .map(item => item.value)
                .filter(value => value !== 'unknown')
                .map(value => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase())
                .filter((value, index, self) => self.indexOf(value) === index)
                .sort();

            fs.writeFile(outFile, JSON.stringify(values, null, 2), (err) => {
                if (err) {
                    console.error(`🔴 Error writing to file ${outFile}: ${err}`);
                } else {
                    console.log(`🟢 Successfully wrote to file ${outFile}`);
                }
            });
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });

}

getDataFromTagInfo('genus', 100);
getDataFromTagInfo('species', 999);
