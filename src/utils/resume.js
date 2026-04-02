import { apiRequest } from './api';

export const uploadResume = (token, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('resume', file);

  return apiRequest('/api/candidate/profile/resume', {
    method: 'POST',
    token,
    body: formData,
  });
};

export const checkResumeExists = (token, resumeId) =>
  apiRequest(`/api/resumes/${resumeId}/exists`, {
    method: 'GET',
    token,
  });

export const downloadResume = (token, resumeId) =>
  apiRequest(`/api/resumes/${resumeId}/download`, {
    method: 'GET',
    token,
  });

export const getResumeAnalysis = (token) =>
  apiRequest('/api/candidate/profile/resume/analysis', {
    method: 'GET',
    token,
  });
