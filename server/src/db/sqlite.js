const sqlite3 = require('sqlite3').verbose();
const fileDefaultVicare = './src/db/vicare.sqlite';

module.exports = {
    // Tạo dữ liệu db
    initTable: function (db){
        return new Promise((resolve) => {
            db.serialize(function () {
                db.run("DROP TABLE IF EXISTS drug_group;");
                db.run("DROP TABLE IF EXISTS drug_type;");
                db.run("DROP TABLE IF EXISTS drug_info;");
                db.run("CREATE TABLE IF NOT EXISTS drug_group (idx INTEGER PRIMARY KEY, name TEXT NOT NULL, created_at DATE, updated_at DATE)");
                db.run("CREATE TABLE IF NOT EXISTS drug_type (idx INTEGER PRIMARY KEY, id_group INTEGER NOT NULL, name TEXT NOT NULL, created_at DATE, updated_at DATE)");
                db.run("CREATE TABLE IF NOT EXISTS drug_info (idx INTEGER PRIMARY KEY, id_type INTEGER NOT NULL, name TEXT NOT NULL, more TEXT, created_at DATE, updated_at DATE)");
                console.log(db.curentMilis + ": Created tables database");
                resolve();
            });
        });
    },

    // Hàm khởi tạo sqlite
    initCreateTable: async function () {
        try {
            let db = await this.connect();
            await this.initTable(db);
            await this.close(db);
        }catch (err) {
            console.error(err.message);
        }
    },

    // Tạo dữ liệu table drug_groups
    insertDrugGroups: function(drugGroupNames) {
        return new Promise((resolve) => {
            this.connect().then((db) => {
                let mapInsertDrugGroups = [];
                let stmt = db.prepare("INSERT INTO drug_group (idx, name, created_at, updated_at) VALUES (?, ?, ?, ?)");
                for (let idx = 0; idx < drugGroupNames.length; idx++) {
                    let now = new Date();
                    let drugGroupName = drugGroupNames[idx];
                    let idxDatabase = now.getTime() + idx;
                    stmt.run(idxDatabase, drugGroupName, now, now);
                    mapInsertDrugGroups[drugGroupName] = idxDatabase;
                }
                stmt.finalize();
                console.log(db.curentMilis + ": Insert database drug_groups");
                this.close(db).then(()=>{
                    resolve(mapInsertDrugGroups);
                });
            });
        });
    },

    insertDrugTypes: function (idxGroup, drugTypes) {
        return new Promise((resolve) => {
            this.connect().then((db) => {
                let drugTypeNames = [];
                let stmt = db.prepare("INSERT INTO drug_type (idx, id_group, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)");
                for (let idx = 0; idx < drugTypes.length; idx++) {
                    let now = new Date();
                    let drugTypeName = drugTypes[idx];
                    let idxDatabase = now.getTime() + idx;
                    drugTypeNames.push(drugTypeName);
                    stmt.run(idxDatabase, idxGroup, drugTypeName, now, now);
                }
                stmt.finalize();
                console.log(db.curentMilis + ": Insert database drug_types");
                this.close(db).then(()=>{
                    resolve(drugTypeNames);
                });
            });
        });
    },

    insertDrugTypesFromMap: async function(mapInsertDrugGroups, drugTypesMapDrugGroups) {
        let drugTypeNames = [];
        for (let key in drugTypesMapDrugGroups) {
            let drugTypeNameData = await this.insertDrugTypes(mapInsertDrugGroups[key], drugTypesMapDrugGroups[key]);
            drugTypeNames.push(drugTypeNameData);
        }
        return drugTypeNames;
    },
    // Kết nối db
    connect: function(fileSql) {
        return new Promise((resolve, reject) => {
            if (fileSql === undefined) {
                fileSql = fileDefaultVicare;
            }
            let db = new sqlite3.Database(fileSql, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                let curentMilis = new Date().getTime();
                db.curentMilis = curentMilis;
                console.log(curentMilis + ': Connected database');
                resolve(db);
            });
        });
    },

    // Đóng kết nối db
    close: function(db) {
        return new Promise((resolve, reject) => {
            db.close((err) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                    return;
                }
                resolve();
                console.log(db.curentMilis + ': Close the connection');
            });
        });
    }
};