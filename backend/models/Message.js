const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  roomId: String,
  userId: String,
  username: String,
  text: String,
  likes: Number,
  dislikes: Number,
  editMode: Boolean,
  likedBy: [String],
  dislikedBy: [String],
  replies: [ { username: String, userId: String, text: String, likes: Number, dislikes: Number, editMode: Boolean, likedBy: [String], dislikedBy: [String]} ]
});

module.exports = mongoose.model('Message',MessageSchema);