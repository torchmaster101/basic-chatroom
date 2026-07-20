require('dotenv').config(); // so we can use .env to store settings
const express = require('express');
const mongoose = require('mongoose'); // for mongodb
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');

const LocalStrategy = require('passport-local').Strategy;
const app = express();

app.use(cors({ // browsers block requests from different origins unless the server explicitly allows it
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.use(session({
    secret: 'chatroom-secret',
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());

app.use(passport.session());

mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB Connected');
});

const User = require('./models/User');
const Room = require('./models/Room');
const Message = require('./models/Message');

passport.use(
  new LocalStrategy(
    async function(username, password, done) {
      const user = await User.findOne({
        username: username,
        password: password
      });

      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    }
  )
);

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(
  async function(id, done) {
    const user = await User.findById(id);
    done(null, user);
  }
);

function generateRoomId() {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[
      Math.floor(Math.random() * chars.length)
    ];
  }
  return id;
}

function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.json({
      success: false
    });
  }
}

// Updates like/dislike count.
function updateLikesDislikes (message, likeLength, dislikeLength) {
  message.likes = likeLength;
  message.dislikes = dislikeLength;
}

app.post('/signup', async (req, res) => {
  const user = await User.create({
    username: req.body.username,
    password: req.body.password
  });
  res.json(user);
});

app.post(
  '/login',
  passport.authenticate('local'),
  function(req, res) {
    res.json({
      success: true
    });
  }
);

app.get('/rooms', checkAuth, async (req, res) => {
  const rooms = await Room.find();
  res.json(rooms);
});

app.post('/create-room', checkAuth, async (req, res) => {
  const room = await Room.create({
    roomId: generateRoomId()
  });

  res.json(room);
});

app.get('/messages/:roomId', checkAuth, async (req, res) => {
  const messages = await Message.find({
    roomId: req.params.roomId
  });

  res.json(messages);
});

app.post('/send-message', checkAuth, async (req, res) => {
  const message = await Message.create({
    roomId: req.body.roomId,
    userId: req.user._id,
    username: req.user.username,
    text: req.body.text,
    likes: 0,
    dislikes: 0,
    editMode: false,
    likedBy: [],
    dislikedBy: [],
    replies: []
  });
  res.json(message);
});

// Likes a message

app.post('/like-message/:messageId', checkAuth, async (req, res) => {
  const message = await Message.findById(
    req.params.messageId
  );

  const user = req.user._id;

  if(message.dislikedBy.includes(user)){
    message.dislikedBy.splice(message.dislikedBy.indexOf(user), 1);
  }

  if(message.likedBy.includes(user)){
    message.likedBy.splice(message.likedBy.indexOf(user), 1);
  }else{
    message.likedBy.push(user);
  }

  updateLikesDislikes(message, message.likedBy.length, message.dislikedBy.length);

  await message.save();
  res.json(message);
});

// Dislikes a message

app.post('/dislike-message/:messageId', checkAuth, async (req, res) => {
  const message = await Message.findById(
    req.params.messageId
  );

  const user = req.user._id;

  if(message.likedBy.includes(user)){
    message.likedBy.splice(message.likedBy.indexOf(user), 1);
  }

  if(message.dislikedBy.includes(user)){
    message.dislikedBy.splice(message.dislikedBy.indexOf(user), 1);
  }else{
    message.dislikedBy.push(user);
  }

  updateLikesDislikes(message, message.likedBy.length, message.dislikedBy.length);

  await message.save();
  res.json(message);
});

app.post('/reply/:messageId', checkAuth, async (req, res) => {
  const message = await Message.findById(
    req.params.messageId
  );

  message.replies.push({
    username: req.user.username,
    userId: req.user._id,
    text: req.body.text,
    likes: 0,
    dislikes: 0,
    editMode: false,
    likedBy: [],
    dislikedBy: []
  });

  await message.save();
  res.json(message);
});

// Likes a reply

app.post('/like-reply/:parentMessageId/:index', checkAuth, async (req, res) => {
  const message = await Message.findById(
    req.params.parentMessageId
  );

  const user = req.user._id;
  const reply = message.replies[req.params.index];

  if(reply.dislikedBy.includes(user)){
    reply.dislikedBy.splice(reply.dislikedBy.indexOf(user), 1);
  }

  if(reply.likedBy.includes(user)){
    reply.likedBy.splice(reply.likedBy.indexOf(user), 1);
  }else{
    reply.likedBy.push(user);
  }

  updateLikesDislikes(reply, reply.likedBy.length, reply.dislikedBy.length);

  await message.save();
  res.json(message);
});

// Dislikes a reply

app.post('/dislike-reply/:parentMessageId/:index', checkAuth, async (req, res) => {
  const message = await Message.findById(
    req.params.parentMessageId
  );

  const user = req.user._id;
  const reply = message.replies[req.params.index];

  if(reply.likedBy.includes(user)){
    reply.likedBy.splice(reply.likedBy.indexOf(user), 1);
  }

  if(reply.dislikedBy.includes(user)){
    reply.dislikedBy.splice(reply.dislikedBy.indexOf(user), 1);
  }else{
    reply.dislikedBy.push(user);
  }

  updateLikesDislikes(reply, reply.likedBy.length, reply.dislikedBy.length);

  await message.save();
  res.json(message);
});

app.post('/delete-message/:messageId', checkAuth, async (req, res) => {
  const message = await Message.findById(req.params.messageId);

  // Verify user actually owns the message
  if(req.user._id.equals(message.userId)){ 
    await Message.findByIdAndDelete(
      req.params.messageId
    );

    return
  }

  res.json({
    success: false
  });
});

app.post('/delete-reply/:parentMessageId/:index', checkAuth, async (req, res) => {
  const message = await Message.findById(
    req.params.parentMessageId
  );

  // Verify user actually owns the message
  if(req.user._id.equals(message.replies[req.params.index].userId)){
    message.replies.splice(req.params.index, 1);
  }

  await message.save();
  res.json(message);
});

app.listen(8080, () => {
  console.log('Server running on port 8080');
});
