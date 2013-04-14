var express = require('express');
var http = require('http');
var socketio = require('socket.io');

var app = express();
var server = http.createServer(app);
var io = socketio.listen(server);

// Serve static files from ./public
app.use(express.static(__dirname + '/public'));

// Quiet you.
io.set('log level', 1);

// Store users.
var usersWaiting = [];
var competitions = [];



// Listen for Socket.IO connections
io.sockets.on('connection', function (socket) {
    console.log(socket.id);
    socket.emit('connected', { message: 'Welcome. Please enter your name to start.'});

    // Listen for events from the client.
    socket.on('username_submitted', function (data) {
        userName = data.username;
        var user = {socketid: socket.id, username: userName};

        if(usersWaiting.length > 0){
            var opponent = usersWaiting[0];

            usersWaiting.splice(0, 1); //Remove user from waiting list

            var competition = {
                id: Guid.NewGuid() ,
                status: {
                    tileOne: "",
                    tileTwo: "",
                    tileThree: "",
                    tileFour: "",
                    tileFive: "",
                    tileSix: "",
                    tileSeven: "",
                    tileEight: "",
                    tileNine: ""
                },
                playerOne: opponent,
                playerTwo: user,
                turn: opponent.socketid
            };

            competitions.push(competition);

            var opponentSocket = io.sockets.sockets[opponent.socketid];
            opponentSocket.emit('opponent_found',
                {
                    message: "Opponent found! You are competing against " + user.username,
                    playerId: opponent.socketid,
                    opponentName: user.userName,
                    competition: competition
                });

            socket.emit('username_accepted_compete',
                {
                    message: 'Welcome ' + userName + '. You are competing against ' + opponent.username,
                    playerId: user.socketid,
                    opponentName: opponent.username,
                    competition: competition
                });

        }else{
            usersWaiting.push(user)
            socket.emit('username_accepted_waiting', {message: 'Welcome ' + userName + '. Please wait for a opponent'});
        }



        // Log the pretty data to the console.
        console.log(data);
    });

    socket.on('tile_clicked', function(data){
            console.log(data);
            for( var i in competitions){
                if(competitions[i].id == data.competitionId){
                    if(competitions[i].turn == socket.id){
                        var tag;
                        var nextTurn;
                        switch(socket.id){
                            case competitions[i].playerOne.socketid:
                                tag = "X";
                                nextTurn = competitions[i].playerTwo.socketid;
                                break;
                            case competitions[i].playerTwo.socketid:
                                tag = "O";
                                nextTurn = competitions[i].playerOne.socketid;
                                break;
                            default:
                                return;
                        }


                        switch(data.tile){
                            case "11":
                                competitions[i].status.tileOne = tag;
                                break;
                            case "12":
                                competitions[i].status.tileTwo = tag;
                                break;
                            case "13":
                                competitions[i].status.tileThree = tag;
                                break;
                            case "21":
                                competitions[i].status.tileFour = tag;
                                break;
                            case "22":
                                competitions[i].status.tileFive = tag;
                                break;
                            case "23":
                                competitions[i].status.tileSix = tag;
                                break;
                            case "31":
                                competitions[i].status.tileSeven = tag;
                                break;
                            case "32":
                                competitions[i].status.tileEight = tag;
                                break;
                            case "33":
                                competitions[i].status.tileNine = tag;
                                break;
                            default:
                                console.log("wrong tile?")
                                return;
                        }

                        competitions[i].turn = nextTurn;

                        socket.emit('tile_click_accepted', {
                           competition: competitions[i]
                        });

                        io.sockets.sockets[nextTurn].emit('tile_click_accepted',{
                            competition: competitions[i]
                        });
                    }
                }
            }



    });

    socket.on("close", function() {
        // request closed unexpectedly
        console.log("close" + socket.id);
        User.Remove(socket.id);


    });

    socket.on("end", function() {
        // request ended normally
        User.Remove(socket.id);
        console.log("end" + socket.id)

    });


});


// Check if we are testing
if(require.main === module) {
      // Not testing, spin it up!
      server.listen(8023);
      var appUrl = 'http://localhost:' + server.address().port;
      console.log('Running! Open ' + appUrl + ' in a browser to see');
    } else {
      server.listen(8045);
      // Let our tests get at our server.
      module.exports = server;
}



var Guid = {
    NewGuid: function(){
        function S4() {
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        }

        return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
    }
};

var User = {
    Remove: function(socketid){
        for(var i in usersWaiting){
            if(usersWaiting[i],socketid == socketid){
                usersWaiting.splice(i, 1);
                return;
            }
        }

        for (var i in competitions){
            if(competitions[i].playerOne == socketid){
                io.sockets.sockets[competitions[i],playerTwo].emit('opponent_left', {message: "Opponent left"});
            }else if(competitions[i].playerTwo == socketid){
                io.sockets.sockets[competitions[i],playerOne].emit('opponent_left', {message: "Opponent left"});
            }

        }
    }
}


