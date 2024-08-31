const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", 'ejs');
app.use(express.static(path.join(__dirname, "public")));

app.get('/', function (req, res) {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniquesocket) {
    console.log("connected");

    uniquesocket.on("disconnect", function () {
        console.log("disconnected");

        if (!players.white) {
            players.white = uniquesocket.id;
            uniquesocket.emit("PlayerRole", "w");
        }
        else if (!players.black) {
            players.black = uniquesocket.id;
            uniquesocket.emit("PlayerRole", "b");
        }
        else {
            uniquesocket.emit("SpectatorRole");
        }

        uniquesocket.on("disconnect", function () {
            if (uniquesocket.id === white) {
                delete players.white;
            }
            else if (uniquesocket.id === black) {
                delete players.black;
            }
        });

        uniquesocket.on("move", function (move) {
            try {
                if (chess.turn() === 'w' && uniquesocket.id !== players.white) return;
                if (chess.turn() === 'b' && uniquesocket.id !== players.black) return;

                const result = chess.move(move);
                if (result) {
                    currentPlayer = chess.turn();
                    io.emit("move", move);
                    io.emit("boardState", chess.fen());
                }
                else {
                    console.log("Invalid Move :", move);
                    uniquesocket.emit("inalidMove", move);
                }
            }
            catch (err) {
                console.log(err.message);
                uniquesocket.emit("Imvalid Move :", move);
            }
        })
    });

    // uniquesocket.on("churan",function(){
    //     io.emit("churan papdi");
    // })
})

server.listen(3000, function () {
    console.log("Port is Running");
});