// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
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

  // Store token after login
  setToken: (token) => {
    localStorage.setItem('authToken', token);
  },

  // Remove token on logout
  removeToken: () => {
    localStorage.removeItem('authToken');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getAuthToken();
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
