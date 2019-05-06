const dom = require('request');
const cheerio = require('cheerio');
const sqlite = require('./src/db/sqlite');
run();
async function run() {
    await sqlite.initCreateTable();

    dom('https://vicare.vn/thuoc/', async function (error, response, body) {
        if(error !== null) {
            console.error('error:', error);
        }

        const $ = cheerio.load(body);
        let items = $('.landing-drugs-list').find('.item');
        let drugGroupNames = [];
        let drugTypesMapDrugGroups = [];
        for(let idDrugGroup = 0; idDrugGroup < items.length; idDrugGroup++) {
            let itemDrugGroup = items[idDrugGroup];
            let drugGroupName = $(itemDrugGroup).find('.collapse-trigger').text().trim();
            drugGroupNames.push(drugGroupName);

            let itemDrugTypes = $(itemDrugGroup).find('.collapsible-target').find('a');
            let drugTypes = [];
            for(let idDrugType = 0; idDrugType < itemDrugTypes.length; idDrugType++) {
                let itemDrugType = itemDrugTypes[idDrugType];
                let drugTypeName = $(itemDrugType).text().trim();
                drugTypes.push(drugTypeName);
            }
            drugTypesMapDrugGroups[drugGroupName] = drugTypes;
        }

        let mapInsertDrugGroups = await sqlite.insertDrugGroups(drugGroupNames);
        let mapInsertDrugTypes = await sqlite.insertDrugTypesFromMap(mapInsertDrugGroups, drugTypesMapDrugGroups);
    });
}

