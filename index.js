const express = require('express');
const cors = require('cors');
const res = require('express/lib/response');
const app = express();
app.set('view engine', 'ejs');
app.set('views', './views');
app.use( express.static( "public" ) );
app.use(cors());
const http = require('http');
const port = process.env.PORT || 3000;

const server = http.createServer(app);
const { Server } = require("socket.io",(http,{
    cors:{
        origin: '*',
        methods: 'GET, PUT, POST, DELETE, OPTIONS',
        allowedHeaders: 'Content-Type, Authorization, Content-Length, X-Requested-With',
        exposedHeaders: '',
        credentials: true
    }
}) );
const io = new Server(server);

const rooms = {};

io.on('connection',(socket)=>{
    socket.on('create', (room)=>{
        socket.join(room);
        rooms[room] = {
            resetValue: 0,
            users: {}
        };
      });

    socket.on('join', (data)=>{
        socket.join(data.room);
        try{
            rooms[data.room].users[socket.id] = {'id':socket.id,'name':data.name};
            io.in(data.room).emit('joined', rooms[data.room].users);
        }catch(e){
            console.log(e);
        }
      });
    
    socket.on('buzz',(room)=>{
        if(rooms[room].resetValue === 0){
            io.in(room).emit('buzz', socket.id);
            rooms[room].resetValue = 1;
        }
    })

    socket.on('reset',(room)=>{
        rooms[room].resetValue = 0;
        io.in(room).emit('reset');
    })
})

app.get('/', (req, res) => {
    res.render('index');
});


app.get('/host', (req, res) => {
    res.render('host');
});

app.get('/client/:code', (req, res) => {
    res.render('client', { code: req.params.code, name: req.query.name });
});

server.listen(port, () => {
    console.log('listening on :' + port);
  });
