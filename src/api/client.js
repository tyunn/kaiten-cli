import axios from 'axios';
import { getConfig } from '../utils/config.js';

function createApiClient() {
  const config = getConfig();
  
  return axios.create({
    baseURL: config.apiUrl,
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json'
    }
  });
}

export const api = createApiClient();
