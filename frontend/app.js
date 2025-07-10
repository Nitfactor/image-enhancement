// Only show the photo enhancer section, no nav or admin logic
const navEnhancer = document.getElementById('nav-enhancer');
const navSupport = document.getElementById('nav-support');
const enhancerSection = document.getElementById('photo-enhancer-section');
const enhancerResult = document.getElementById('enhancer-result');
const enhancerForm = document.getElementById('enhancer-form');
// Show enhancer section by default
showSection(enhancerSection);

const API_BASE = 'http://localhost:5001/api';

// Connection status tracking
let isBackendConnected = true;
let connectionRetries = 0;
const MAX_RETRIES = 3;

// Utility functions
function showSection(section) {
  enhancerSection.style.display = 'block';
}

function setAuthUI(isLoggedIn, isAdmin = false) {
  // Remove all nav, admin, login, and dashboard logic
}

function getToken() {
  return localStorage.getItem('token');
}

function saveToken(token) {
  localStorage.setItem('token', token);
}

function clearToken() {
  localStorage.removeItem('token');
}

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

// Enhanced fetch with retry logic and better error handling
async function apiRequest(url, options = {}, retryCount = 0) {
  try {
    console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    console.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ API Response:`, data);
    
    // Reset connection status on success
    isBackendConnected = true;
    connectionRetries = 0;
    
    return data;
  } catch (error) {
    console.error(`❌ API Error (attempt ${retryCount + 1}):`, error);
    
    // Check if it's a network error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      isBackendConnected = false;
      
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return apiRequest(url, options, retryCount + 1);
      }
      
      throw new Error('Backend server is not responding. Please check if the server is running.');
    }
    
    throw error;
  }
}

// Check backend connection
async function checkBackendConnection() {
  try {
    await apiRequest(`${API_BASE}/test`);
    return true;
  } catch (error) {
    console.error('Backend connection check failed:', error);
    return false;
  }
}

// Photo Enhancer with enhanced error handling
enhancerForm.onsubmit = async (e) => {
  e.preventDefault();
  enhancerResult.innerHTML = 'Enhancing photo...';
  const file = document.getElementById('enhancer-photo').files[0];
  if (!file) return;
  try {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await fetch(`${API_BASE}/images/enhance`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + getToken() },
      body: formData
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Enhance failed');
    }
    const data = await response.json();
    if (data.downloadUrl) {
      // Show a preview and download button using the secure link
      const downloadLink = `http://localhost:5001${data.downloadUrl}`;
      enhancerResult.innerHTML = `
        <div style="text-align:center;">
          <img id="enhanced-preview" src="${downloadLink}" alt="Enhanced Photo" style="max-width:100%;border:1px solid #ccc;margin-top:1em;display:block;" />
          <a href="${downloadLink}" download target="_blank" style="display:inline-block;margin-top:0.5em;padding:0.5em 1em;background:#007bff;color:#fff;text-decoration:none;border-radius:4px;">Download Enhanced Photo</a>
        </div>
      `;
    } else {
      enhancerResult.innerHTML = 'Enhanced image not found.';
    }
  } catch (err) {
    enhancerResult.innerHTML = `<span style="color:red;">${err.message || 'Enhance failed.'}</span>`;
  }
};

navEnhancer.onclick = () => showSection(enhancerSection);
navSupport.onclick = () => {
  alert('Support Us: If you like this project and want to help us improve, please consider donating! (Payment integration coming soon)');
};