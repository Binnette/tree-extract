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

    const outFile = 'data/' + key + '.json';

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
                .filter((value, index, self) => self.indexOf(value) === index);

            fs.writeFileSync(outFile, JSON.stringify(values));
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });

}

getDataFromTagInfo('genus', 100);
getDataFromTagInfo('species', 999);
