require('dotenv').config();

const express      = require('express');
const app          = express();
const mongoose     = require('mongoose');

const passport     = require('passport');
const flash        = require('connect-flash');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const session      = require('express-session');


const { createServer } = require('node:http');
const { join }         = require('node:path');
const { Server }       = require('socket.io');


const DB_URL  = process.env.DB_URL;
const PORT    = process.env.PORT || 8081;


app.set('view_engine', 'ejs');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan('dev'));
app.use(cookieParser());

app.use(session({
  secret: process.env.SECRET,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); 
require('./config/passport')(passport);
app.use(flash());


const server = createServer(app);
const io = new Server(server);


io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('bid', (data) => {
    const userName = data.name;
    const bid = data.bid;
    const premium = data.premium;
    const _id = data.itemID;
    User.findOneAndUpdate(
      {name: userName},
      {
        $set: {
          name: userName
        }
      },
      { upsert: true, new: true }
    ).then(user => {
      Item.findByIdAndUpdate(
        _id,
        {
          $set: {
            highestBid: bid,
            highestBidder: user,
          },
          $push: {
            bids: { $each: [{user, bid, premium}], $position: 0}
          }
        },
        { new: true}
      ).then(item => {
        io.emit('bid', item)
      })
    });
  });
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});


mongoose.connect(DB_URL)
  .then(() => {
    console.log('Listening to Database: PaySplit...');
    require('./app/routes.js')(app, passport, io);
  })
  .catch(err => {
    console.error(err);
  })

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
