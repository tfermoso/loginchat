const express = require('express')
const fs = require('fs');
const crypto = require('crypto')
const bodyparser = require("body-parser");
const Conexion = require("./utils/db");
session = require('express-session');
const fileUpload = require('express-fileupload')
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
app.use(fileUpload());
var usuarioOnline = [];

var users = {};
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
    if (req.session && req.session.user) {
        fs.readFile(__dirname + "/index2.html", (err, data) => {
            data = data.toString().trim().replace("{{user}}", req.session.user.nombre).replace("{{img}}", `img/${req.session.user.imagen == null ? 'default.jpg' : req.session.user.imagen}`);
            res.send(data);
        })
    } else {
        res.sendFile(__dirname + "/public/views/login.html");

    }
})
app.get("/prueba", (req, res) => {
    res.sendFile(__dirname + "/index.html");

})

app.get('/crearcuenta', function (req, res) {
    fs.readFile("./public/views/crearusuario.html", (err, data) => {
        data = data.toString().trim().replace("{{err}}", "");
        res.send(data);
        return;
    })
    // res.sendFile(__dirname + "/public/views/crearusuario.html");
})

app.post("/", (req, res) => {
    let conexion = new Conexion();
    let pass = crypto.createHash('md5').update(req.body.password).digest("hex")

    let consulta = "select * from usuarios where username=$1 and password=$2";
    conexion.con.query(consulta, [req.body.username, pass], (error, results, fields) => {
        if (error) {
            fs.readFile("./public/views/login.html", (err, data) => {
                data = data.toString().trim().replace("##err##", error.message);
                res.send(data);
                return;
            })
        } else {
            if (results.rowCount > 0) {
                req.session.user = results.rows[0];
                let date = new Date();
                let hora = String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ":" + String(date.getSeconds()).padStart(2, "0");
                usuarioOnline.push({ nombre: req.session.user.nombre, imagen: req.session.user.imagen, hora_conexion: hora });
                fs.readFile(__dirname + "/index2.html", (err, data) => {
                    data = data.toString().trim().replace("{{user}}", req.session.user.nombre).replace("{{img}}", `img/${req.session.user.imagen == null ? 'default.jpg' : req.session.user.imagen}`);
                    res.send(data);
                })
            } else {
                fs.readFile("./public/views/login.html", (err, data) => {
                    data = data.toString().trim().replace("##nombre##", "Login de Página").replace("##err##", "Usuario o contraseña incorrecto");
                    res.send(data);
                    return;
                })
            }
        }
        conexion.con.end();
    });
})

app.post("/crearcuenta", function (req, res) {
    let conexion = new Conexion();
    let username = req.body.username;
    let nombre = req.body.nombre;
    let imagen = null;
    if (req.files) {
        imagen = req.files.file.name;
    }

    let pass = crypto.createHash('md5').update(req.body.password).digest("hex")
    let consulta = "insert into usuarios (username,nombre,password,imagen) values  ($1,$2,$3,$4)";
    conexion.con.query(consulta, [username, nombre, pass, imagen], (error, results, fields) => {
        if (error) {
            fs.readFile("./public/views/crearusuario.html", (err, data) => {
                data = data.toString().trim().replace("{{err}}", error.message);
                res.send(data);
                return;
            })
        } else {
            if (results.rowCount > 0) {
                if (req.files) {
                    let EDFile = req.files.file
                    EDFile.mv(`./public/img/${EDFile.name}`, err => {
                        if (err) return res.status(500).send({ message: err })

                        res.redirect("/");
                    })
                } else {
                    res.redirect("/");
                }

            }
        }
        conexion.con.end();
    });
})
app.get("/desconectar", (req, res) => {
    for (let i = 0; i < usuarioOnline.length; i++) {
        if (usuarioOnline[i].nombre == req.session.user.nombre) {
            usuarioOnline.splice(i, 1);
            break;
        }
    }
    
    io.emit("usuarios", usuarioOnline);
    io.emit("chat", { from: req.session.user.nombre, message: "Ha abandonado el chat", imagen: `img/${req.session.user.imagen}` })
    req.session.destroy();
    res.redirect("/");
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

    io.emit("usuarios", usuarioOnline);
    //socket.broadcast.emit("chat","nuevo usuario desde io")
    console.log(socket.request.session.user.nombre + ' connected ');
    let user = socket.request.session.user.nombre;

    users[user] = socket.id;
    console.log(users);
    socket.on('chat', (msg) => {
        //let mensaje = socket.request.session.user.nombre + ":" + msg;

        io.emit('chat', msg);
        io.emit('chat', { from: 'boot', message: "respuesta a la pregunta", imagen: 'default.jpg' });
    });

    socket.on("radio",(blob)=>{
        socket.broadcast.emit("chat",{ from: socket.request.session.user.nombre, message: "Nuevo audio", imagen: `img/${socket.request.session.user.imagen}` })
        socket.broadcast.emit("radio",blob)
        console.log("emitiendo audio desde el servidor")
    })

    /*Private chat*/
    socket.on('private_chat', function (data) {
        const to = data.to,
            message = data.message;

        if (users.hasOwnProperty(to)) {
            io.to(users[to]).emit('private_chat', {
                //The sender's username
                username: socket.request.session.user.nombre,
                //Message sent to receiver
                message: message
            });
        }

    });

    socket.on("disconnect", (reason) => {
        console.log(reason);
        let mensaje = socket.request.session.user.nombre + ":" + reason
        let usuario = socket.request.session.user.nombre;
        
        if (socket.request.session && socket.request.session.user) {
            console.log(socket.request.session.user.nombre)
        } else { 
            for (let i = 0; i < usuarioOnline.length; i++) {
                if (usuarioOnline[i].nombre == usuario) {
                    usuarioOnline.splice(i, 1);
                }
            }     
            io.emit("chat", { from: usuario, message: reason, imagen: "img/" + socket.request.session.user.imagen });
        }
        io.emit("usuarios", usuarioOnline);

    });

    /*
        contador=0;
        setInterval(()=>{
            let datos=base64_encode(__dirname+"/public/img/5.jpg");
            io.emit("Juan","hola juan")
            console.log("hola Juan");
        },3000)
        */


});

function base64_encode(file) {
    return "data:image/jpg;base64," + fs.readFileSync(file, 'base64');
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, (err) => {
    console.log(`Servidor iniciado en ${PORT}`);
    /*
        let conexion=new Conexion();
        conexion.con.query('SELECT * FROM usuarios', (err, res) => {
            if (err) throw err;
            for (let row of res.rows) {
              console.log(JSON.stringify(row));
            }
            conexion.con.end();
          });
          */

});