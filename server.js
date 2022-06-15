const express = require('express')
const fs = require('fs');
const crypto = require('crypto')
const bodyparser = require("body-parser");
const Conexion = require("./utils/db");
session = require('express-session');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var usuarioOnline=[];
const sessionMiddleware = session({
    secret: '5577-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true
});
app.use(sessionMiddleware);

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));


app.use('/', express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname+"/public/views/login.html");
})

app.post("/", (req, res) => {
    let conexion = new Conexion();
    let pass = crypto.createHash('md5').update(req.body.password).digest("hex")

    let consulta = "select * from cliente where username=? and password=?";
    conexion.con.query(consulta, [req.body.username, pass], (error, results, fields) => {
        if (error) {
            fs.readFile("./public/views/login.html", (err, data) => {
                data = data.toString().trim().replace("##nombre##", "Login de Página").replace("##err##", error.message);
                res.send(data);
                return;
            })
        } else {
            if (results.length > 0) {
                req.session.user = results[0];
                usuarioOnline.push(req.session.user.nombre);
                fs.readFile(__dirname+"/index.html", (err, data) => {
                    data = data.toString().trim().replace("{{user}}",req.session.user.nombre);
                    res.send(data);
                })

            } else {
                fs.readFile("./public/view/login.html", (err, data) => {
                    data = data.toString().trim().replace("##nombre##", "Login de Página").replace("##err##", "Usuario o contraseña incorrecto");
                    res.send(data);
                    return;
                })
            }
        }
        conexion.con.end();
    });
})


// convert a connect middleware to a Socket.IO middleware
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

// only allow authenticated users
io.use((socket, next) => {
  const session = socket.request.session;
  if (session && session.user) {
    next();
  } else {
    next(new Error("unauthorized"));
  }
});

io.on('connection', (socket) => {
    io.emit("usuarios", JSON.stringify(usuarioOnline));
    //socket.broadcast.emit("chat","nuevo usuario desde io")
    console.log('a user connected');
    
    socket.on('chat', (msg) => {
        let mensaje=socket.request.session.user.nombre+":"+msg;
        io.emit('chat', mensaje);
    });

/*
    contador=0;
    setInterval(()=>{
        contador++;
        io.emit("chat","Nuevo mensaje "+contador)
    },5000)
    */
});


server.listen(3500);