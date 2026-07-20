
import {
  useEffect,
  useState
} from 'react';

import { useParams }
from 'react-router-dom';

import {FaThumbsUp, FaThumbsDown} from "react-icons/fa";

export default function Room() {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [replyId, setReplyId] = useState('');
  const [replyText, setReplyText] = useState('');

  useEffect(() => { // load messages upon page load
    loadMessages();
    const timer = setInterval(loadMessages, 3000);
    return () => clearInterval(timer);
  }, []);

  async function loadMessages() {
    const response = await fetch('http://localhost:8080/messages/' +
      roomId, { credentials: 'include'} // make request to backend and send session info
    );
    const data = await response.json();
    if (Array.isArray(data)) { setMessages(data);
    } else {  setMessages([]); }
  }

  async function sendMessage(event) {
    event.preventDefault();
    await fetch(
      'http://localhost:8080/send-message',
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId: roomId,
          text: text
        })
      }
    );

    setText('');
    loadMessages();
  }

  // Likes a message
  async function likeMessage(messageId){
    await fetch(
      'http://localhost:8080/like-message/' + messageId,
      {
        method: 'POST',
        credentials: 'include'
      } 
    );

    loadMessages();
  }

  // Dislikes a message
  async function dislikeMessage(messageId){
    await fetch(
      'http://localhost:8080/dislike-message/' + messageId,
      {
        method: 'POST',
        credentials: 'include'
      } 
    );

    loadMessages();
  }

  // Likes a reply
  async function likeReply(parentMessageId, index){
    await fetch(
      'http://localhost:8080/like-reply/' + parentMessageId + '/' + index,
      {
        method: 'POST',
        credentials: 'include'
      }
    );

    loadMessages();
  }

  // Dislikes a reply
  async function dislikeReply(parentMessageId, index){
    await fetch(
      'http://localhost:8080/dislike-reply/' + parentMessageId + '/' + index,
      {
        method: 'POST',
        credentials: 'include'
      }
    );

    loadMessages();
  }

  async function sendReply(messageId) {

    await fetch(
      'http://localhost:8080/reply/' +
      messageId,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: replyText
        })
      }
    );

    setReplyId('');
    setReplyText('');
    loadMessages();
  }

  async function deleteMessage(messageId){
    await fetch(
      'http://localhost:8080/delete-message/' + messageId,
      {
        method: 'POST',
        credentials: 'include'
      }
    );

    loadMessages();
  }

  async function deleteReply(parentMessageId, index){
    await fetch(
      'http://localhost:8080/delete-reply/' + parentMessageId + '/' + index,
      {
        method: 'POST',
        credentials: 'include'
      }
    );

    loadMessages();
  }

  function editMessage(){
    if(!editMode)
      setEditMode(true);
  }

  async function saveMessageEdit(messageId){
    setEditMode(false);
  }

  async function saveReplyEdit(parentMessageId, index){
    setEditMode(false);
  }

  return (
    <div>

      <h1>Room {roomId}</h1>

      {
        messages.map((message) => (
          <div className="message" key={message._id} >
            <div className="message-header">
              <b>{message.username}</b>
              <button className="like" onClick={() => {likeMessage(message._id)}}>
                <FaThumbsUp className="like-symbol"/>
              </button>

              <b>{message.likes ?? 0}</b>

              <button className="dislike" onClick={() => {dislikeMessage(message._id)}}>
                <FaThumbsDown className="dislike-symbol"/>
              </button>

              <b>{message.dislikes ?? 0}</b>

              <button className="edit" onClick={() => {editMessage()}}>Edit</button>
              <button className="delete" onClick={() => {deleteMessage(message._id)}}>Delete</button>
            </div>

            <p>{message.text}</p>

            {
              message.replies.map( (reply, index) => (
                <div className="reply" key={index} >
                  <div className="message-header">
                    <b>{reply.username}</b>
                    <button className="like" onClick={() => {likeReply(message._id, index)}}>
                      <FaThumbsUp className="like-symbol"/>
                    </button>

                    <b>{reply.likes ?? 0}</b>

                    <button className="dislike" onClick={() => {dislikeReply(message._id, index)}}>
                      <FaThumbsDown className="dislike-symbol"/>
                    </button>

                    <b>{reply.dislikes ?? 0}</b>

                    <button className="edit" onClick={() => {editMessage()}}>Edit</button>
                    <button className="delete" onClick={() => {deleteReply(message._id, index)}}>Delete</button>
                  </div>

                  <p>{reply.text}</p>
                </div>
              ))
            }

            {
              replyId === message._id ? (

                <div>
                  <input value={replyText} onChange={(event) => { setReplyText( event.target.value ); }} />
                  <button onClick={() => { sendReply(message._id); }} > Reply </button>
                </div>

              ) : (

                <button  onClick={() => {setReplyId(message._id); }} > Reply </button>

              )
            }

          </div>

        ))
      }

      <form onSubmit={sendMessage}>
        <input value={text} onChange={(event) => {setText( event.target.value  ); }} />
        <button>  Send </button>
      </form>

    </div>
  );
}
