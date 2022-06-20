//const mysql = require('mysql');
const { Client } = require('pg');

class Conexion {
    
    constructor() {

        this.con = new Client({
            user: 'bqdadughsjsqod',
            host: 'ec2-52-22-136-117.compute-1.amazonaws.com',
            database: 'd1ign1h9o3fuv5',
            password: '7b6e288a9259c080aeb5d2890149d127efb5cd8b9b576c699edfdce2336a397c',
            port: 5432,
            ssl: {
                rejectUnauthorized: false
            }
        })
/*
    constructor() {
        this.con = new Client({
            connectionString: "postgres://bqdadughsjsqod:7b6e288a9259c080aeb5d2890149d127efb5cd8b9b576c699edfdce2336a397c@ec2-52-22-136-117.compute-1.amazonaws.com:5432/d1ign1h9o3fuv5",
            ssl: {
                rejectUnauthorized: false
            }

        });

        */
        this.con.connect()

    }


    /*
            this.con.connect(function (err) {
    
                if (err) {
                    this.con = null;
                    console.log("Error al conectarme")
                } else {
                    console.log("Connected!");
                }
    
    
            });
            */
}

module.exports = Conexion;