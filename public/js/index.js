window.onload = () => {
    var socket = io();

    var form = document.getElementById('form');
    var input = document.getElementById('input');

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
    socket.on('usuarios',function(users){

        let liUsuarios="";
        for (const user of JSON.parse(users)) {
              liUsuarios+=`<li>${user}</li>`;      
            }
        
        document.getElementById("usuarios").innerHTML=liUsuarios;
    })
}