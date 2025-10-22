// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Helper functions to manage tokens
const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

const removeTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers = [];

// Subscribers for token refresh
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (accessToken) => {
  refreshSubscribers.forEach(callback => callback(accessToken));
  refreshSubscribers = [];
};

// Refresh access token using refresh token
const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    return data.tokens.accessToken;
  } catch (error) {
    removeTokens();
    throw error;
  }
};

// Helper function to make API requests with automatic token refresh
const apiRequest = async (endpoint, options = {}) => {
  const token = getAccessToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // If unauthorized and we have a refresh token, try to refresh
    if (response.status === 401 && getRefreshToken() && !options._retry) {
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          const newAccessToken = await refreshAccessToken();
          isRefreshing = false;
          onTokenRefreshed(newAccessToken);
          
          // Retry the original request with new token
          return apiRequest(endpoint, { ...options, _retry: true });
        } catch (refreshError) {
          isRefreshing = false;
          removeTokens();
          // Redirect to login or throw error
          window.location.href = '/';
          throw new Error('Session expired. Please login again.');
        }
      } else {
        // If already refreshing, wait for it to complete
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newAccessToken) => {
            // Retry with new token
            apiRequest(endpoint, { ...options, _retry: true })
              .then(resolve)
              .catch(reject);
          });
        });
      }
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  // Register new user
  register: async (email, password) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Login user
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Verify token
  verifyToken: async () => {
    return apiRequest('/auth/verify');
  },

  // Refresh token
  refreshToken: async () => {
    return refreshAccessToken();
  },

  // Store tokens after login/register
  setTokens: (accessToken, refreshToken) => {
    setTokens(accessToken, refreshToken);
  },

  // Remove tokens on logout
  removeTokens: () => {
    removeTokens();
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getAccessToken();
  }
};

// Products API
export const productsAPI = {
  // Get all products
  getAll: async () => {
    return apiRequest('/products');
  },

  // Get single product
  getById: async (id) => {
    return apiRequest(`/products/${id}`);
  },

  // Create product
  create: async (productData) => {
    return apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  // Update product
  update: async (id, productData) => {
    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  // Delete product
  delete: async (id) => {
    return apiRequest(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Bulk create products
  bulkCreate: async (products) => {
    return apiRequest('/products/bulk', {
      method: 'POST',
      body: JSON.stringify({ products }),
    });
  }
};

// Containers API
export const containersAPI = {
  // Get all containers
  getAll: async () => {
    return apiRequest('/containers');
  },

  // Get single container
  getById: async (id) => {
    return apiRequest(`/containers/${id}`);
  },

  // Create container
  create: async (containerData) => {
    return apiRequest('/containers', {
      method: 'POST',
      body: JSON.stringify(containerData),
    });
  },

  // Update container
  update: async (id, containerData) => {
    return apiRequest(`/containers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(containerData),
    });
  },
  // Delete container
  delete: async (id) => {
    return apiRequest(`/containers/${id}`, {
      method: 'DELETE',
    });
  },

  // Bulk create containers
  bulkCreate: async (containers) => {
    return apiRequest('/containers/bulk', {
      method: 'POST',
      body: JSON.stringify({ containers }),
    });
  },
    // Proof down container
  proofDown: async (proofDownData) => {
    return apiRequest(`/container-operations/proof-down`, {
      method: 'POST',
      body: JSON.stringify({
        containerId: proofDownData.containerId,
        targetProof: proofDownData.targetProof,
        }
      ),
    });
  }

  
};

// Production API
export const productionAPI = {
  // Get all production batches
  getAll: async () => {
    return apiRequest('/production');
  },

  // Get single production batch
  getById: async (id) => {
    return apiRequest(`/production/${id}`);
  },

  // Create production batch
  create: async (batchData) => {
    return apiRequest('/production', {
      method: 'POST',
      body: JSON.stringify(batchData),
    });
  },

  // Update production batch
  update: async (id, batchData) => {
    return apiRequest(`/production/${id}`, {
      method: 'PUT',
      body: JSON.stringify(batchData),
    });
  },

  // Delete production batch
  delete: async (id) => {
    return apiRequest(`/production/${id}`, {
      method: 'DELETE',
    });
  }
};

// Transactions API
export const transactionsAPI = {
  // Get all transactions with pagination
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return apiRequest(`/transactions?${queryParams}`);
  },

  // Get single transaction
  getById: async (id) => {
    return apiRequest(`/transactions/${id}`);
  },

  // Create transaction
  create: async (transactionData) => {
    return apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  },

  // Get transaction statistics
  getStats: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return apiRequest(`/transactions/stats/summary?${queryParams}`);
  }
};

// Users API
export const usersAPI = {
  // Get user profile
  getProfile: async () => {
    return apiRequest('/users/profile');
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Get dashboard statistics
  getDashboard: async () => {
    return apiRequest('/users/dashboard');
  }
};

// Container Operations API
export const containerOperationsAPI = {
  // Transfer spirit between containers
  transfer: async (transferData) => {
    return apiRequest('/container-operations/transfer', {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  },

  // Proof down spirit
  proofDown: async (proofDownData) => {
    return apiRequest('/container-operations/proof-down', {
      method: 'POST',
      body: JSON.stringify(proofDownData),
    });
  },

  // Adjust container contents
  adjust: async (adjustmentData) => {
    return apiRequest('/container-operations/adjust', {
      method: 'POST',
      body: JSON.stringify(adjustmentData),
    });
  },

  // Bottle spirit from container
  bottle: async (bottlingData) => {
    return apiRequest('/container-operations/bottle', {
      method: 'POST',
      body: JSON.stringify(bottlingData),
    });
  },

  // Change container account
  changeAccount: async (accountData) => {
    return apiRequest('/container-operations/change-account', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  }
};

// Export all APIs
export default {
  auth: authAPI,
  products: productsAPI,
  containers: containersAPI,
  containerOperations: containerOperationsAPI,
  production: productionAPI,
  transactions: transactionsAPI,
  users: usersAPI
};
