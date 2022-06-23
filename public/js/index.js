var emojis = { ":-)": "0x1F600", ":-|": "0x1F604" };
var mediaRecorder;
var audios = {};
const template_usuario = `<div class="row sideBar-body classUser" id="id_{{user}}">
<div class="col-sm-3 col-xs-3 sideBar-avatar">
  <div class="avatar-icon">
    <img src="{{img}}">
  </div>
</div>
<div class="col-sm-9 col-xs-9 sideBar-main">
  <div class="row">
    <div class="col-sm-8 col-xs-8 sideBar-name">
      <span class="name-meta">{{user}}
    </span>
    </div>
    <div class="col-sm-4 col-xs-4 pull-right sideBar-time">
      <span class="time-meta pull-right">{{hora_conexion}}
    </span>
    </div>
  </div>
</div>
</div>`;
const template_msg = `<div class="row message-body">
<div class="col-sm-12 message-main-{{origen}}">
    
    <div class="{{origen}}">
        <div class="avatar-icon">
            <img src="{{img}}"><span class="user-msg">{{user}}</span>
        </div>
        <div class="message-text">
            {{msg}}
        </div>
        <span class="message-time pull-right">
            {{hora}}
        </span>
    </div>
</div>
</div>`;
const template_audio = `<div class="row message-body">
<div class="col-sm-12 message-main-receiver">
    
    <div class="receiver">
        <div class="avatar-icon">
            <img src="{{img}}"><span class="user-msg">{{user}}</span>
        </div>
        Nuevo audio: <a href="" class="message-audio" id="audio-{{audio}}">escuchar     
        </a>
        <span class="message-time pull-right">
            {{hora}}
        </span>
    </div>
</div>
</div>`;

window.onload = () => {

    var constraints = { audio: true };


    $("#microphone").click(() => {
        // Start recording
        mediaRecorder.start();

        // Stop recording after 5 seconds and broadcast it to server
        setTimeout(function () {
            mediaRecorder.stop()
        }, 5000);
    })



    let usuario = document.getElementById("usuario").innerText;
    let emojis = { ":-)": "0x1F600", ":-|": "0x1F604" };
    var socket = io();

    var form = document.getElementById('form');
    var input = document.getElementById('input');
    var textSearch = document.getElementById('searchText');

    textSearch.onkeyup = () => {
        let usuarios = $('.classUser');
        for (let index = 0; index < usuarios.length; index++) {
            let u = usuarios[index];
            if (u.id.toLowerCase().indexOf(textSearch.value.toLowerCase()) < 0) {
                $(u).hide();
            } else {
                $(u).show();
            }

        }
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (input.value) {
            socket.emit('chat', { from: usuario, message: input.value, imagen: $("#imgAvatar").attr("src") });
            input.value = '';
        }
    });
    socket.on('chat', function (msg) {
        let mensaje = msg.message;
        let sender = '';
        if (msg.from == usuario) {
            sender = 'sender';
        } else {
            sender = 'receiver';
        }

        let date = new Date();
        let hora = String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ":" + String(date.getSeconds()).padStart(2, "0");
        document.getElementById("conversation").innerHTML += template_msg.replace("{{msg}}", mensaje).replaceAll("{{origen}}", sender).replace("{{hora}}", hora).replace("{{img}}", msg.imagen).replace("{{user}}", msg.from);
        document.getElementById("conversation").scrollTo(0, document.getElementById("conversation").scrollHeight);
    });

    // When the client receives a voice message it will play the sound
    socket.on('radio', function (msg) {

        console.log("reproduciendo audio")
        let date = new Date();
        let hora = String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ":" + String(date.getSeconds()).padStart(2, "0");
        document.getElementById("conversation").innerHTML += template_audio.replace("{{audio}}", msg.from + "-" + hora.replaceAll(":","-")).replace("{{hora}}", hora).replace("{{img}}", msg.imagen).replace("{{user}}", msg.from);
        var blob = new Blob([msg.message], { 'type': 'audio/ogg; codecs=opus' });
        let clave = "audio-" + msg.from + "-" + hora.replaceAll(":","-");
        audios[clave] = blob;
        clave="#"+clave;
        $(clave).click((e) => {
            e.preventDefault();
            let idclave = e.currentTarget.id;
            var audio = document.createElement('audio');
            audio.src = window.URL.createObjectURL(audios[idclave]);
            audio.play();
        })

    });

    socket.on('usuarios', function (users) {

        let liUsuarios = "";
        for (const user of users) {
            if (user.nombre != usuario)
                liUsuarios += template_usuario.replaceAll("{{user}}", user.nombre).replace("{{hora_conexion}}", user.hora_conexion).replace("{{img}}", `img/${user.imagen == null ? 'default.jpg' : user.imagen}`);
        }
        document.getElementById("usuarios").innerHTML = liUsuarios;
        let lis = document.getElementsByClassName("classUser");
        for (let index = 0; index < lis.length; index++) {
            const element = lis[index];
            element.onclick = (e) => {
                usuarioTo = e.currentTarget.getElementsByClassName("name-meta")[0].innerText;
                message = prompt("type your message to " + usuarioTo);
                socket.emit('private_chat', {
                    to: usuarioTo,
                    message: message
                });
            }

        }
    })
    /*Received private messages*/
    socket.on('private_chat', function (data) {
        var username = data.username;
        var message = data.message;

        alert(username + ': ' + message);
    });
    socket.on("imagen", function (datos) {
        let imagenMostrar = document.getElementById("imagen");
        imagenMostrar.setAttribute("src", datos);
        console.log(datos)
    })


    input.onkeyup = () => {
        if (input.value.length >= 3) {
            if (emojis[input.value.substr(-3)] != undefined) {
                input.value = input.value.replace(input.value.substr(-3), String.fromCodePoint(emojis[input.value.substr(-3)]));

            }
        }
    }

    navigator.mediaDevices.getUserMedia(constraints).then(function (mediaStream) {
        mediaRecorder = new MediaRecorder(mediaStream);
        mediaRecorder.onstart = function (e) {
            this.chunks = [];
        };
        mediaRecorder.ondataavailable = function (e) {
            this.chunks.push(e.data);
        };
        mediaRecorder.onstop = function (e) {
            var blob = new Blob(this.chunks, { 'type': 'audio/ogg; codecs=opus' });
            socket.emit('radio', { from: usuario, message: blob, imagen: $("#imgAvatar").attr("src") });
            console.log("Enviando audio")
        };


    });
}