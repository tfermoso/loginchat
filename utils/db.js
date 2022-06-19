const mysql = require('mysql');
class Conexion {
    constructor() {

        this.con = mysql.createConnection({
            host: "https://databases.000webhost.com/",
            user: "id18920129_admin_loginchat",
            database:"id18920129_loginchat",
            password: "}q5W?$pof&#%O>C#"
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