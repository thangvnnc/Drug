const sqlite3 = require('sqlite3').verbose();
const fileDefaultVicare = './src/db/vicare.sqlite';

module.exports = {
    // Tạo dữ liệu db
    initTable: function (db){
        return new Promise((resolve) => {
            db.serialize(function () {
                db.run("DROP TABLE IF EXISTS drug_group;");
                db.run("DROP TABLE IF EXISTS drug_type;");
                db.run("CREATE TABLE IF NOT EXISTS drug_group (idx INTEGER PRIMARY KEY, name TEXT NOT NULL, created_at DATE, updated_at DATE)");
                db.run("CREATE TABLE IF NOT EXISTS drug_type (idx INTEGER PRIMARY KEY, name TEXT NOT NULL, created_at DATE, updated_at DATE)");
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
    insertDrugGroups: async function(drugGroupNames) {
        try {
            let db = await this.connect();
            let stmt = db.prepare("INSERT INTO drug_group (idx, name, created_at, updated_at) VALUES (?, ?, ?, ?)");
            for (let idx = 0; idx < drugGroupNames.length; idx++) {
                let now = new Date();
                let drugGroupName = drugGroupNames[idx];
                stmt.run(now.getTime() + idx, drugGroupName, now, now);
            }
            stmt.finalize();
            console.log(db.curentMilis + ": Insert database drug_groups");
            await this.close(db);
        }catch (err) {
            console.error(err.message);
        }
    },

    // Tạo dữ liệu drug_types
    insertDrugTypes: async function(drugGroupName, drugTypes) {

    },

    // Kết nối db
    connect: function(fileSql) {
        if (fileSql === undefined) {
            fileSql = fileDefaultVicare;
        }
        return new Promise((resolve, reject) => {
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
                console.log(db.curentMilis + ': Close the connection');
            });
        });
    }
};