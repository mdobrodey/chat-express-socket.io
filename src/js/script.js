document.addEventListener('DOMContentLoaded', () => {
  const socket = io('http://localhost:3000');

  const $ = (id) => {
    return document.getElementById(id);
  }

  const modal = $('modalOverlay');
  const nicknameInput = $('nicknameInput');
  const loginButton = $('loginButton');
  const loginError = $('loginError');
  const messageInput = $('messageInput');
  const sendButton = $('sendButton');
  const messagesList = $('messagesList');
  const usersList = $('usersList');
  const onlineCount = $('onlineCount');
      
  function showError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
    setTimeout(() => {
      loginError.style.display = 'none';
    }, 3000);
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  function scrollToBottom() {
    messagesList.scrollTop = messagesList.scrollHeight;
  }

  function getAvatarLetter(nickname) {
    return nickname.charAt(0).toUpperCase();
  }

  function addMessage(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.innerHTML = `
      <div class="message-header">
        <span class="message-author">${data.nickname}</span>
        <span class="message-time">${formatTime(data.timestamp)}</span>
      </div>
      <div class="message-text">${data.message}</div>
    `;
    messagesList.appendChild(messageDiv);
    scrollToBottom();
  }

  function addNotification(message, type = 'notification') {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = type;
    notificationDiv.textContent = message;
    messagesList.appendChild(notificationDiv);
    scrollToBottom();
  }

  function updateUsersList(users) {
    usersList.innerHTML = '';
        
    users.forEach(user => {
      const userDiv = document.createElement('div');
      userDiv.className = 'user';
      userDiv.innerHTML = `
        <div class="user-avatar">${getAvatarLetter(user)}</div>
        <div class="user-name">${user}</div>
      `;
      usersList.appendChild(userDiv);
    });

    onlineCount.textContent = `${users.length} онлайн`;
  }

  function attemptLogin() {
    const nickname = nicknameInput.value.trim();
        
    if (!nickname) {
      showError('Пожалуйста, введите никнейм');
      return;
    }

    if (nickname.length < 2) {
      showError('Никнейм должен содержать минимум 2 символа');
      return;
    }

    if (nickname.length > 20) {
      showError('Никнейм не должен превышать 20 символов');
      return;
    }

    socket.emit('login', nickname);
  }

  loginButton.addEventListener('click', attemptLogin);
  nicknameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      attemptLogin();
    }
  });

  function sendMessage() {
    const message = messageInput.value.trim();
        
    if (!message) return;
        
    socket.emit('message', message);
    messageInput.value = '';
  }

  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  socket.on('login', (data) => {
    if (data.status === 'OK') {
      modal.style.display = 'none';
      messageInput.focus();
    } else {
      showError(data.message || 'Не удалось войти в чат');
    }
  });

  socket.on('new_message', (data) => {
    addMessage(data);
  });

  socket.on('users_update', (users) => {
    updateUsersList(users);
  });

  socket.on('user_joined', (data) => {
    addNotification(`${data.nickname} присоединился к чату`);
  });

  socket.on('user_leave', (data) => {
    addNotification(`${data.nickname} покинул чат`)
  })

  socket.on('error', (data) => {
    addNotification(data.message, 'error-message');
  });
});
