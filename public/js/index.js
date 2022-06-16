var emojis = { ":-)": "0x1F600", ":-|": "0x1F604" };

window.onload = () => {
    let usuario = document.getElementById("usuario").innerText;
    let emojis = { ":-)": "0x1F600", ":-|": "0x1F604" };
    var socket = io();

    var form = document.getElementById('form');
    var input = document.getElementById('input');
   /*
    var desconectar = document.getElementById("desconectar");
    desconectar.onclick = function salir() {
        socket.disconnect();
    }
    */
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (input.value) {
            socket.emit('chat', input.value);
            input.value = '';
        }
    });
    socket.on('chat', function (msg) {
        var item = document.createElement('li');
        item.textContent = msg;
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on(usuario, (msg) => {
        alert(msg);
    })
    socket.on('usuarios', function (users) {

        let liUsuarios = "";
        for (const user of JSON.parse(users)) {
            liUsuarios += `<li class="classUser">${user}</li>`;
        }
        document.getElementById("usuarios").innerHTML = liUsuarios;
        let lis = document.getElementsByClassName("classUser");
        for (let index = 0; index < lis.length; index++) {
            const element = lis[index];
            element.onclick = (e) => {
                usuarioTo = e.currentTarget.innerText;
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
}