import { apiRequest } from './api';

export const startInterviewSession = (token) =>
  apiRequest('/api/interview/start-session', {
    method: 'POST',
    token,
  });

  

