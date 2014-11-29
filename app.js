var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var usuarios = {};
server.listen(3000);

app.get('/',function(req, resp) {
  resp.sendfile(__dirname + '/publico/index.html');  
});

io.sockets.on("connection", function(socket) {
    socket.on('novo usuario', function(nickname , callback) {
        if(nickname in usuarios) {
            callback({retorno : false, msg : " O usuário já está em uso: Escolha outro!"});
        } else {
            console.log("Novo usuário no chat: "+nickname);
            callback({retorno : true, msg : ""});
            socket.nickname = nickname;
            usuarios[socket.nickname] = socket;
            atualizarUsuarios();
            
        }
    });
    
    socket.on('enviar mensagem', function(data) {
        var mensagem = data.trim();
        var letra = mensagem.substring(0,1);
        if(letra === "/") {
            console.log('cheguei aqui');
            var nome = mensagem.substr(1,mensagem.indexOf(" ")).trim();
            var msg = mensagem.substr(mensagem.indexOf(" ") + 1);
            console.log(msg);
            if(nome in usuarios) {
                usuarios[nome].emit('nova mensagem', {msg : "(mensagem privada de "
                                                      +socket.nickname+"): <i>" +msg+"</i>", nick : usuarios[nome].nickname});
              socket.emit('nova mensagem', {msg : "(vocÊ enviou para "+nome+") <i>" + msg + "</i>", nick : usuarios[nome].nickname});
              
                
            } else {
                socket.emit('nova mensagem', {msg : "O usuário "+nome+" não foi encontrado", nick :                    
                                              usuarios[nome].nickname});
            }
        } else {
            io.sockets.emit('nova mensagem',{msg : mensagem, nick: socket.nickname});
        }
        
    });
    
    socket.on('disconnect', function() {
        if(!socket.nickname) return;
        
        delete usuarios[socket.nickname];
        atualizarUsuarios();
    });
    
    function atualizarUsuarios() {
        io.sockets.emit('atualiza usuarios', Object.keys(usuarios));
    };
});