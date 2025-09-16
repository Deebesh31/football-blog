// Client

// Get stored data
let storedToken = localStorage.getItem('jwtToken');
let storedUsername = localStorage.getItem('username');

// Set the username in the HTML
const usernameElement = document.getElementById('username');
usernameElement.textContent = storedUsername;

// Load page and event listeners
document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin;
  fetchPosts(baseUrl);

  if (storedToken) {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole == 'admin') {
      showAdminFeatures();
    }
  }

  const form = document.getElementById('new-post-form');
  if (form) {
    form.addEventListener('submit', (event) => createPost(event, baseUrl));
  }

  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', (event) => loginUser(event, baseUrl));

  const registerForm = document.getElementById('register-form');
  registerForm.addEventListener('submit', (event) =>
    registerUser(event, baseUrl)
  );
});

// Post details
const postDetailContainer = document.getElementById('post-detail-container');

// Add a listener for detail page
window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('post');
  if (postId) {
    showPostDetail(postId);
  }
});

// Fetch posts
async function fetchPosts(baseUrl) {
  const res = await fetch(`${baseUrl}/posts`);
  const data = await res.json();
  const postsList = document.getElementById('posts-list');
  const isAdmin = localStorage.getItem('userRole') === 'admin';

  if (postsList) {
    postsList.innerHTML = data
      .map((post, index) => {
        const deleteButtonStyle = isAdmin ? '' : 'display: none';
        const updateButtonStyle = isAdmin ? '' : 'display: none';

        return `
      <div id="${post._id}" class="post">
          <img src="${post.imageUrl}" alt="Image" />
          <div class="post-title">
            ${
              index === 0
                ? `<h1><a href="/post/${post._id}">${post.title}</a></h1>`
                : `<h3><a href="/post/${post._id}">${post.title}</a></h3>`
            }
          </div>
          ${
            index === 0
              ? `<span><p>${post.author}</p><p>${post.timestamp}</p></span>`
              : ''
          }
          <div id="admin-buttons">
            <button class="btn" style="${deleteButtonStyle}" onclick="deletePost('${
          post._id
        }', '${baseUrl}')">Delete</button>
            <button class="btn" style="${updateButtonStyle}" onclick="showUpdateForm('${
          post._id
        }', '${post.title}', '${post.content}')">Update</button>
          </div>
          ${index === 0 ? '<hr>' : ''}
          ${index === 0 ? '<h2>All Articles</h2>' : ''}
        </div>
      `;
      })
      .join('');
  }
}

async function createPost(event, baseUrl) {
  event.preventDefault();
  const titleInput = document.getElementById('title');
  const contentInput = document.getElementById('content');
  const imageUrlInput = document.getElementById('image-url');

  // Get the values from the input fields
  const title = titleInput.value;
  const content = contentInput.value;
  const imageUrl = imageUrlInput.value;

  // Ensure that inputs are not empty
  if (!title || !content || !imageUrl) {
    alert('Please fill in all fields 1.');
    return;
  }

  const newPost = {
    title,
    content,
    imageUrl,
    author: storedUsername,
    timestamp: new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };

  const headers = new Headers({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${storedToken}`,
  });
  const requestOptions = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(newPost),
  };

  try {
    const response = await fetch(`${baseUrl}/posts`, requestOptions);
    if (!response.ok) {
      const storedRole = localStorage.getItem('userRole');
      console.error(`Error creating the post: HTTP Status ${response.status}`);
    } else {
      // Clear the input data
      titleInput.value = '';
      contentInput.value = '';
      imageUrlInput.value = '';
      alert('Create post successful!');
    }
  } catch (error) {
    console.error('An errro occured during the fetch:', error);
    alert('Create post failed.');
  }
  fetchPosts(baseUrl);
}

// Delete Post
async function deletePost(postId, baseUrl) {
  const deleteUrl = `${baseUrl}/posts/${postId}`;
  try {
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    });

    if (response.ok) {
      alert('Delete post successful!');
      fetchPosts(baseUrl);
    } else {
      alert('Delete post failed.');
    }
  } catch (error) {
    console.error(`Error while deleting post: ${error}`);
    alert('Delete post failed.');
  }
}

// Update form
function showUpdateForm(postId, title, content) {
  const updateForm = `
    <form id="update-form">
        <input type="text" id="update-title" value="${title}" />
        <textarea id="update-content">${content}</textarea>
        <button type="submit">Update post</button>
    </form>
    `;

  const postElement = document.getElementById(postId);
  postElement.innerHTML += updateForm;

  const form = document.getElementById('update-form');
  form.addEventListener('submit', (event) => updatePost(event, postId));
}

// Update post
async function updatePost(event, postId) {
  event.preventDefault();
  const title = document.getElementById('update-title').value;
  const content = document.getElementById('update-content').value;
  const baseUrl = window.location.origin;

  // ensure that inputs are not empty
  if (!title || !content) {
    alert('Please fill in all fields 2.');
    return;
  }

  const updatedPost = {
    title,
    content,
  };

  try {
    const response = await fetch(`${baseUrl}/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify(updatedPost),
    });

    if (response.ok) {
      alert('Update post successful!');
      fetchPosts(baseUrl);
    } else {
      alert('Update post failed.');
    }
  } catch (error) {
    console.error('An error occured during the fetch', error);
    alert('Update post failed.');
  }
}

// Register user
async function registerUser(event, baseUrl) {
  event.preventDefault();
  
  const usernameInput = document.getElementById('register-username');
  const passwordInput = document.getElementById('register-password');
  const roleInput = document.getElementById('register-role');

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const role = roleInput.value;

  // Clear previous error styling
  [usernameInput, passwordInput, roleInput].forEach(input => {
    input.style.borderColor = '';
    input.style.backgroundColor = '';
  });

  // Enhanced client-side validation
  let hasError = false;

  // Username validation
  if (!username) {
    showInputError(usernameInput, 'Username is required');
    hasError = true;
  } else if (username.length < 3 || username.length > 30) {
    showInputError(usernameInput, 'Username must be between 3 and 30 characters');
    hasError = true;
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    showInputError(usernameInput, 'Username can only contain letters, numbers, and underscores');
    hasError = true;
  }

  // Password validation
  if (!password) {
    showInputError(passwordInput, 'Password is required');
    hasError = true;
  } else if (password.length < 6) {
    showInputError(passwordInput, 'Password must be at least 6 characters long');
    hasError = true;
  }

  // Role validation
  if (!role) {
    showInputError(roleInput, 'Please select a role');
    hasError = true;
  }

  if (hasError) {
    return;
  }

  const newUser = {
    username,
    password,
    role,
  };

  try {
    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Creating Account...';

    const res = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser),
    });

    const data = await res.json();

    // Reset button state
    submitButton.disabled = false;
    submitButton.textContent = originalText;

    if (data.success) {
      showSuccessMessage('Registration successful! You can now log in.');
      // Clear input fields
      usernameInput.value = '';
      passwordInput.value = '';
      roleInput.value = 'reader';
    } else {
      showErrorMessage(data.error || 'Registration failed. Please try again.');
      
      // Handle specific error cases
      if (data.error && data.error.includes('Username already exists')) {
        showInputError(usernameInput, data.error);
      }
    }

  } catch (error) {
    console.error('Registration error:', error);
    
    // Reset button state
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = false;
    submitButton.textContent = 'Register';
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      showErrorMessage('Network error. Please check your connection and try again.');
    } else {
      showErrorMessage('An unexpected error occurred. Please try again later.');
    }
  }
}


// Loging user
async function loginUser(event, baseUrl) {
  event.preventDefault();
  
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  // Clear previous error styling
  [usernameInput, passwordInput].forEach(input => {
    input.style.borderColor = '';
    input.style.backgroundColor = '';
  });

  // Enhanced client-side validation
  let hasError = false;

  if (!username) {
    showInputError(usernameInput, 'Username is required');
    hasError = true;
  }

  if (!password) {
    showInputError(passwordInput, 'Password is required');
    hasError = true;
  }

  if (hasError) {
    return;
  }

  const user = {
    username,
    password,
  };

  try {
    // Show loading state
    const submitButton = document.getElementById('login-button');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Signing In...';

    const res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });

    const data = await res.json();

    // Reset button state
    submitButton.disabled = false;
    submitButton.textContent = originalText;

    if (data.success) {
      localStorage.setItem('jwtToken', data.token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('username', data.username);

      showSuccessMessage(`Welcome back, ${data.username}!`);

      // Close the hamburger menu if open
      const hamburger = document.querySelector('.nav__hamburger');
      const linksContainer = document.querySelector('.nav__menu');
      if (linksContainer && hamburger) {
        linksContainer.classList.remove('active');
        hamburger.classList.remove('active');
      }

      // Clear input fields
      usernameInput.value = '';
      passwordInput.value = '';

      // Delay reload to show success message
      setTimeout(() => {
        location.reload();
      }, 1000);

      if (data.role === 'admin') {
        showAdminFeatures();
      }
    } else {
      showErrorMessage(data.error || 'Login failed. Please check your credentials and try again.');
      
      // Focus on username field for retry
      usernameInput.focus();
    }

  } catch (error) {
    console.error('Login error:', error);
    
    // Reset button state
    const submitButton = document.getElementById('login-button');
    submitButton.disabled = false;
    submitButton.textContent = 'Login';
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      showErrorMessage('Network error. Please check your connection and try again.');
    } else {
      showErrorMessage('An unexpected error occurred. Please try again later.');
    }
  }
}

// Utility functions for better error handling and user feedback
function showInputError(inputElement, message) {
  inputElement.style.borderColor = '#dc3545';
  inputElement.style.backgroundColor = '#fff5f5';
  inputElement.title = message;
  
  // Remove existing error message
  const existingError = inputElement.parentNode.querySelector('.field-error');
  if (existingError) {
    existingError.remove();
  }
  
  // Add error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    color: #dc3545;
    font-size: 12px;
    margin-top: 4px;
    display: block;
  `;
  
  inputElement.parentNode.appendChild(errorDiv);
  
  // Clear error when user starts typing
  const clearError = () => {
    inputElement.style.borderColor = '';
    inputElement.style.backgroundColor = '';
    inputElement.title = '';
    const errorEl = inputElement.parentNode.querySelector('.field-error');
    if (errorEl) {
      errorEl.remove();
    }
    inputElement.removeEventListener('input', clearError);
  };
  
  inputElement.addEventListener('input', clearError);
}

function showErrorMessage(message) {
  // Remove existing messages
  const existingMessages = document.querySelectorAll('.alert-message');
  existingMessages.forEach(msg => msg.remove());
  
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert-message error-alert';
  alertDiv.textContent = message;
  alertDiv.style.cssText = `
    background-color: #f8d7da;
    color: #721c24;
    padding: 12px 16px;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
    margin: 10px 0;
    font-size: 14px;
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 300px;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(alertDiv);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
  
  // Click to dismiss
  alertDiv.addEventListener('click', () => {
    alertDiv.remove();
  });
}

function showSuccessMessage(message) {
  // Remove existing messages
  const existingMessages = document.querySelectorAll('.alert-message');
  existingMessages.forEach(msg => msg.remove());
  
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert-message success-alert';
  alertDiv.textContent = message;
  alertDiv.style.cssText = `
    background-color: #d4edda;
    color: #155724;
    padding: 12px 16px;
    border: 1px solid #c3e6cb;
    border-radius: 4px;
    margin: 10px 0;
    font-size: 14px;
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 300px;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(alertDiv);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 3000);
}

// Enhanced token handling for API calls
async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem('jwtToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Handle token expiration
    if (response.status === 401) {
      const data = await response.json().catch(() => ({}));
      if (data.expired || data.error?.includes('expired')) {
        showErrorMessage('Your session has expired. Please log in again.');
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        setTimeout(() => {
          location.reload();
        }, 2000);
        return null;
      }
    }
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Add CSS animation for alerts
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .alert-message {
    cursor: pointer;
    transition: opacity 0.3s ease;
  }
  
  .alert-message:hover {
    opacity: 0.9;
  }
  
  .field-error {
    animation: fadeIn 0.3s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;
document.head.appendChild(style);

// Admin features
function showAdminFeatures() {
  const newPostDiv = document.getElementById('new-post-div');
  if (newPostDiv) {
    newPostDiv.style.display = 'flex';
  }

  const allBtns = document.querySelectorAll('.btn');
  allBtns.forEach((btn) => {
    if (btn) {
      btn.style.display = 'block';
    }
  });
}

// Logout
document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin;
  const registerDiv = document.getElementById('register-div');
  const loginDiv = document.getElementById('login-div');
  const logoutDiv = document.getElementById('logout-div');
  const logoutButton = document.getElementById('logout-button');

  if (storedToken) {
    registerDiv.style.display = 'none';
    loginDiv.style.display = 'none';
    logoutDiv.style.display = 'flex';
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
      location.reload();
    });
  } else {
    registerDiv.style.display = 'flex';
    loginDiv.style.display = 'flex';
    logoutDiv.style.display = 'none';
  }
});