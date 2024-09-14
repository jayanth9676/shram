import { useState, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://shram.onrender.com/api';

export function useGameAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = useCallback(async (endpoint, method = 'GET', body = null, retries = 3) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const url = `${API_URL}${endpoint}`;
      console.log(`Making ${method} request to: ${url}`);
      console.log('Request body:', body);
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        ...(body && { body: JSON.stringify(body) })
      });
      console.log(`Response status: ${response.status}`);
      const responseData = await response.json();
      console.log('Response data:', responseData);
      if (!response.ok) {
        throw new Error(JSON.stringify(responseData));
      }
      return responseData;
    } catch (error) {
      console.error('API call error:', error);
      if (retries > 0) {
        console.log(`Retrying... (${retries} attempts left)`);
        return apiCall(endpoint, method, body, retries - 1);
      }
      setError(error.message || 'An error occurred');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { apiCall, loading, error };
}