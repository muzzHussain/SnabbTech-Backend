const db = require('mysql');

const con = db.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
}); 

con.connect((err)=>{
    if(err) {
        console.log(`Error occured while connecting to MySql Db : ${err}`);
    } else {
        console.log('Database Connected Successfully');

        createTable();
    }
});


function createTable(){
    const query = `
        CREATE TABLE IF NOT EXISTS user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        mobileNumber BIGINT UNSIGNED NOT NULL,
        resetToken VARCHAR(255),
        resetExpires DATETIME
    )
    `;

    con.query(query, (err, result)=> {
        if(err) {
            console.log(`Error while creating 'user' table : ${err}`);
        }else {
            console.log(`Table has been created`);
        }
    });
}

module.exports = con;