import { apiRequest } from './api';



  

export const submitInterviewAnswer = (token, payload) =>
  apiRequest('/api/interview/answer', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

