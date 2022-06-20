const mysql = require('mysql');
class Conexion {
    constructor() {

        this.con = mysql.createConnection({
            host: "ec2-52-22-136-117.compute-1.amazonaws.com",
            user: "bqdadughsjsqod",
            database:"d1ign1h9o3fuv5",
            password: "7b6e288a9259c080aeb5d2890149d127efb5cd8b9b576c699edfdce2336a397c",
            port: 5432
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