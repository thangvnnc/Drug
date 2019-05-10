const dom = require('request');
const cheerio = require('cheerio');
const sqlite = require('./src/db/sqlite');
run();
let domainVicare = 'https://vicare.vn';

async function run() {
    await sqlite.initCreateTable();
    let drugTypeMapLinks = await insertDrugGroupDrugType();
    await insertDrugInfoFromLink(drugTypeMapLinks);
}

function insertDrugGroupDrugType() {
    return new Promise((resolve) => {
        dom(domainVicare + '/thuoc', async function (error, response, body) {
            if (error !== null) {
                console.error('error:', error);
            }

            const $ = cheerio.load(body);
            let items = $('.landing-drugs-list').find('.item');
            let drugGroupNames = [];
            let drugTypesMapDrugGroups = [];
            for (let idDrugGroup = 0; idDrugGroup < items.length; idDrugGroup++) {
                let itemDrugGroup = items[idDrugGroup];
                let drugGroupName = $(itemDrugGroup).find('.collapse-trigger').text().trim();
                drugGroupNames.push(drugGroupName);

                let itemDrugTypes = $(itemDrugGroup).find('.collapsible-target').find('a');
                let drugTypes = [];
                for (let idDrugType = 0; idDrugType < itemDrugTypes.length; idDrugType++) {
                    let itemDrugType = itemDrugTypes[idDrugType];
                    let drugTypeName = $(itemDrugType).text().trim();
                    drugTypes.push(drugTypeName);
                }
                drugTypesMapDrugGroups[drugGroupName] = drugTypes;
            }

            // Thêm dữ liệu nhóm
            let mapInsertDrugGroups = await sqlite.insertDrugGroups(drugGroupNames);

            // Thêm dữ liệu loại thuốc theo nhóm
            await sqlite.insertDrugTypesFromMap(mapInsertDrugGroups, drugTypesMapDrugGroups);

            // Thêm dữ liệu thuốc
            let drugTypeMapLinks = [];
            for (let idDrugGroup = 0; idDrugGroup < items.length; idDrugGroup++) {
                let itemDrugGroup = items[idDrugGroup];
                let itemDrugTypes = $(itemDrugGroup).find('.collapsible-target').find('a');
                for (let idDrugType = 0; idDrugType < itemDrugTypes.length; idDrugType++) {
                    let itemDrugType = itemDrugTypes[idDrugType];
                    let drugTypeName = $(itemDrugType).text().trim();
                    let drugTypeLink = $(itemDrugType).attr('href');
                    drugTypeMapLinks[drugTypeName] = drugTypeLink;
                }
            }
            resolve(drugTypeMapLinks);
        });
    });
}

async function insertDrugInfoFromLink(drugTypeMapLinks) {
    for (let key in drugTypeMapLinks) {
        let link = drugTypeMapLinks[key];

        let totalPageInfos = await getTotalPageDrugInfos(link);
        for (let pageIdx = 1; pageIdx <= totalPageInfos; pageIdx++) {
            await insertDrugInfos(key, link, pageIdx);
        }

        let totalPageSubtances = await getTotalPageDrugSubtances(link);
        for (let pageIdx = 1; pageIdx <= totalPageSubtances; pageIdx++) {
            await insertDrugSubstances(key, link, pageIdx);
        }
    }
}

function getTotalPageDrugInfos(drugTypeLink) {
    return new Promise(resolve => {
        dom(domainVicare + drugTypeLink, async function (error, response, body) {
            if (error !== null) {
                console.error('error:', error);
            }
            const $ = cheerio.load(body);

            let stepLinks = $('.step-links');
            if (stepLinks.length === 0) {
                resolve(1);
                return;
            }
            if (stepLinks !== "") {
                let textNumPage = $('.step-links').find('.current').text().trim();
                let totalPage = parseInt(textNumPage.split('/')[1].trim());
                resolve(totalPage);
            }
        });
    });
}

function getTotalPageDrugSubtances(drugTypeLink) {
    drugTypeLink = drugTypeLink.replace("/danh-sach/", "/duoc-chat/");
    return new Promise(resolve => {
        dom(domainVicare + drugTypeLink, async function (error, response, body) {
            if (error !== null) {
                console.error('error:', error);
            }
            const $ = cheerio.load(body);

            let stepLinks = $('.step-links');
            if (stepLinks.length === 0) {
                resolve(1);
                return;
            }
            if (stepLinks !== "") {
                let textNumPage = $('.step-links').find('.current').text().trim();
                let totalPage = parseInt(textNumPage.split('/')[1].trim());
                resolve(totalPage);
            }
        });
    });
}

function insertDrugInfos(drugTypeName, drugTypeLink, page) {
    return new Promise(resolve => {
        let pageLink = "&page=";
        pageLink = "&page=" + page;
        console.log("Get Drug info from drugTypeName: " + drugTypeName + " page : " + page);
        dom(domainVicare + drugTypeLink + pageLink, async function (error, response, body) {
            if (error !== null) {
                console.error('error:', error);
            }
            const $ = cheerio.load(body);
            let items = $('.o-masonry').find('.item');
            if (items.length < 0) {
                resolve();
                return;
            }

            let idType = await sqlite.getIdTypeFromName(drugTypeName);
            let drugInfos = [];
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                let link = $(item).find('.c-media').attr('href');
                let name = $(item).find('.c-media__title').text().trim();
                let more = $(item).find('.c-media__content').text().trim();

                let drugInfo = {
                    name: name,
                    more: more,
                    link: link,
                    idType: idType
                };
                drugInfos.push(drugInfo);
            }
            await sqlite.insertDrugInfos(idType, drugInfos);
            resolve();
        });
    });
}

function insertDrugSubstances(drugTypeName, drugTypeLink, page) {
    return new Promise(resolve => {
        let pageLink = "&page=";
        pageLink = "&page=" + page;
        console.log("Get Drug substances from drugTypeName: " + drugTypeName + " page : " + page);
        drugTypeLink = drugTypeLink.replace("/danh-sach/", "/duoc-chat/");
        dom(domainVicare + drugTypeLink + pageLink, async function (error, response, body) {
            if (error !== null) {
                console.error('error:', error);
            }
            const $ = cheerio.load(body);
            let items = $('.o-masonry').find('.item');
            if (items.length < 0) {
                resolve();
                return;
            }

            let idType = await sqlite.getIdTypeFromName(drugTypeName);
            let drugInfos = [];
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                let link = $(item).find('.c-media').attr('href');
                let name = $(item).find('.c-media__title').text().trim();
                let more = $(item).find('.c-media__content').text().trim();

                let drugInfo = {
                    name: name,
                    more: more,
                    link: link,
                    idType: idType
                };
                drugInfos.push(drugInfo);
            }
            await sqlite.insertDrugSubstances(idType, drugInfos);
            resolve();
        });
    });
}
