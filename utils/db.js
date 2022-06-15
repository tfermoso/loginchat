const mysql = require('mysql');
class Conexion {
    constructor() {
        this.con = mysql.createConnection({
            host: "localhost",
            user: "root",
            database:"pedidos",
            password: ""
        });

        this.con.connect(function (err) {

            if (err) {
                this.con = null;
                console.log("Error al conectarme")
            } else {
                console.log("Connected!");
            }


        });
    }
}
module.exports = Conexion;