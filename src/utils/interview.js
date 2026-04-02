import { apiRequest } from './api';

export const startInterviewSession = (token) =>
  apiRequest('/api/interview/start-session', {
    method: 'POST',
    token,
  });

  

export const submitInterviewAnswer = (token, payload) =>
  apiRequest('/api/interview/answer', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

export const getInterviewResult = (token) =>
  apiRequest('/api/interview/result', {
    method: 'GET',
    token,
  });



export const endInterviewSession = (token) =>
  apiRequest('/api/interview/end-session', {
    method: 'POST',
    token,
  });
