# PaySplit
PaySplit is an app that simplifies splitting bills among friends by allowing easy money pooling and automatic calculation of shares, including complex scenarios like tax and tips, with real-time updates for transparent and fair settlements.

**Link to project:** [Project Link](https://github.com/Jesulayomy/PaySplit)

## How It's Made:

**Tech used:** HTML, CSS, JavaScript, ejs, Node.js, MongoDB, Github

The application was built using ejs and bootstrap for the front end, providing a responsive user interface. The back end is powered by Node.js and Express, with MongoDB as the database to store user data and item information.

## Optimizations
I used the socket.io library to enable real time updates of bid changes through an emitter and listener model. I also utilized ejs partials (`chunks`) to reuse content like navbars and other pages.

## Lessons Learned:

I learned more about socket IO, emitting and listening for events, using bootstrap classes and font-awesome icons.

```javascript
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('bid', (data) => {
    // ...
    io.emit('bid', { data: returnedData })
  });
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});
```


## Other projects

- [Bidds](https://github.com/Jesulayomy/bidd)
- [Homez](https://github.com/Jesulayomy/homez)
- [Shelf Sync](https://github.com/Jesulayomy/shelf-sync)
