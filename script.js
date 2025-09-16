// Client - Fixed Version

// Get stored data
let storedToken = localStorage.getItem('jwtToken');
let storedUsername = localStorage.getItem('username');

// Set the username in the HTML
const usernameElement = document.getElementById('username');
if (usernameElement && storedUsername) {
  usernameElement.textContent = storedUsername;
}

// Get navigation elements
const linksContainer = document.querySelector('.nav__menu');
const hamburger = document.querySelector('.nav__hamburger');

// Load page and event listeners
document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin;
  fetchPosts(baseUrl);

  if (storedToken) {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole === 'admin') {
      showAdminFeatures();
    }
  }

  const form = document.getElementById('new-post-form');
  if (form) {
    form.addEventListener('submit', (event) => createPost(event, baseUrl));
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (event) => loginUser(event, baseUrl));
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (event) =>
      registerUser(event, baseUrl)
    );
  }

  // Handle logout functionality
  handleLogoutUI();
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

// Show post detail (placeholder - implement based on your needs)
function showPostDetail(postId) {
  console.log('Show post detail for:', postId);
  // TODO: Implement post detail view
}

// Fetch posts
async function fetchPosts(baseUrl) {
  try {
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
            <img src="${post.imageUrl}" alt="Post Image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'" />
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
            <div class="admin-buttons">
              <button class="btn delete-btn" style="${deleteButtonStyle}" onclick="deletePost('${
            post._id
          }', '${baseUrl}')">Delete</button>
              <button class="btn update-btn" style="${updateButtonStyle}" onclick="showUpdateForm('${
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
  } catch (error) {
    console.error('Error fetching posts:', error);
  }
}

async function createPost(event, baseUrl) {
  event.preventDefault();
  const titleInput = document.getElementById('title');
  const contentInput = document.getElementById('content');
  const imageUrlInput = document.getElementById('image-url');

  // Get the values from the input fields
  const title = titleInput?.value;
  const content = contentInput?.value;
  const imageUrl = imageUrlInput?.value;

  // Ensure that inputs are not empty
  if (!title || !content || !imageUrl) {
    alert('Please fill in all fields.');
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
      console.error(`Error creating the post: HTTP Status ${response.status}`);
      alert('Create post failed.');
    } else {
      // Clear the input data
      titleInput.value = '';
      contentInput.value = '';
      imageUrlInput.value = '';
      alert('Create post successful!');
      fetchPosts(baseUrl);
    }
  } catch (error) {
    console.error('An error occurred during the fetch:', error);
    alert('Create post failed.');
  }
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
    <div class="update-form-container">
      <form id="update-form">
          <input type="text" id="update-title" value="${title}" />
          <textarea id="update-content">${content}</textarea>
          <button type="submit">Update post</button>
          <button type="button" onclick="cancelUpdate('${postId}')">Cancel</button>
      </form>
    </div>
    `;

  const postElement = document.getElementById(postId);
  postElement.innerHTML += updateForm;

  const form = document.getElementById('update-form');
  form.addEventListener('submit', (event) => updatePost(event, postId));
}

function cancelUpdate(postId) {
  const baseUrl = window.location.origin;
  fetchPosts(baseUrl); // Refresh to remove update form
}

// Update post
async function updatePost(event, postId) {
  event.preventDefault();
  const title = document.getElementById('update-title')?.value;
  const content = document.getElementById('update-content')?.value;
  const baseUrl = window.location.origin;

  // ensure that inputs are not empty
  if (!title || !content) {
    alert('Please fill in all fields.');
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
    console.error('An error occurred during the fetch', error);
    alert('Update post failed.');
  }
}

// Register user
async function registerUser(event, baseUrl) {
  event.preventDefault();
  const usernameInput = document.getElementById('register-username');
  const passwordInput = document.getElementById('register-password');
  const roleInput = document.getElementById('register-role');

  const username = usernameInput?.value;
  const password = passwordInput?.value;
  const role = roleInput?.value;

  // ensure that inputs are not empty
  if (!username || !password || !role) {
    alert('Please fill in all fields.');
    return;
  }

  const newUser = {
    username,
    password,
    role,
  };

  try {
    const res = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser),
    });

    const data = await res.json();

    if (data.success) {
      alert('Registration successful!');
      // Clear input fields
      usernameInput.value = '';
      passwordInput.value = '';
      roleInput.value = 'reader'; // Reset to default
    } else {
      alert(data.message || 'Registration failed.');
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('Registration failed.');
  }
}

// Login user
async function loginUser(event, baseUrl) {
  event.preventDefault();
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const username = usernameInput?.value;
  const password = passwordInput?.value;

  if (!username || !password) {
    alert('Please fill in all fields.');
    return;
  }

  const user = {
    username,
    password,
  };

  try {
    const res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem('jwtToken', data.token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('username', username);

      // Close the hamburger menu if open
      if (linksContainer && hamburger) {
        linksContainer.classList.remove('active');
        hamburger.classList.remove('active');
      }

      // Clear input fields
      usernameInput.value = '';
      passwordInput.value = '';

      location.reload();
    } else {
      alert(data.message || 'Login failed.');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Login failed.');
  }
}

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

// Handle logout UI
function handleLogoutUI() {
  const registerDiv = document.getElementById('register-div');
  const loginDiv = document.getElementById('login-div');
  const logoutDiv = document.getElementById('logout-div');
  const logoutButton = document.getElementById('logout'); // Fixed ID

  if (storedToken) {
    if (registerDiv) registerDiv.style.display = 'none';
    if (loginDiv) loginDiv.style.display = 'none';
    if (logoutDiv) logoutDiv.style.display = 'flex';
    
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        location.reload();
      });
    }
  } else {
    if (registerDiv) registerDiv.style.display = 'flex';
    if (loginDiv) loginDiv.style.display = 'flex';
    if (logoutDiv) logoutDiv.style.display = 'none';
  }
}