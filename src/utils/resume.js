import { apiRequest } from './api';

const RESUME_BASE_PATH = '/api/candidate/profile/resume';

export const uploadResume = (token, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('resume', file);

  return apiRequest(RESUME_BASE_PATH, {
    method: 'POST',
    token,
    body: formData,
  });
};

export const checkResumeExists = (token) =>
  apiRequest(`${RESUME_BASE_PATH}/exists`, {
    method: 'GET',
    token,
  });

export const getResumeAnalysis = (token) =>
  apiRequest(`${RESUME_BASE_PATH}/analysis`, {
    method: 'GET',
    token,
  });
