require("dotenv").config();

const express        = require("express");
const app            = express();
const mongoose       = require("mongoose");

const passport       = require("passport");
const flash          = require("express-flash");
const logger         = require("morgan");
const session        = require("express-session");
const MongoStore     = require("connect-mongo");
const methodOverride = require("method-override");
// const cookieParser   = require('cookie-parser');

const connectDB      = require("./config/database");
const mainRoutes     = require("./routes/main");
const contribRoutes  = require("./routes/contributions");

require("./config/passport")(passport);

const { createServer } = require('node:http');
const { Server }       = require('socket.io');
const PORT             = process.env.PORT || 8081;


connectDB();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(logger("dev"));
// app.use(cookieParser); // I might not need this anymore?

// Use forms for put / delete
app.use(methodOverride("_method"));

// Setup Sessions - stored in MongoDB
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ client: mongoose.connection.getClient() }),
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


app.use("/", mainRoutes);
app.use("/contributions", contribRoutes);


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


server.listen(PORT, () => {
  console.log(`PaySplit is running at http://localhost:${PORT}`);
});
