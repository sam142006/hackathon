import { apiRequest } from './api';

const normalizeSkills = (skills) => {
  if (Array.isArray(skills)) {
    return skills.filter((skill) => typeof skill === 'string' && skill.trim() !== '');
  }

  if (typeof skills === 'string') {
    return skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
};

export const mapJobFromApi = (job) => ({
  id: job.id ?? job.jobId ?? crypto.randomUUID(),
  title: job.title ?? 'Untitled Role',
  company: job.companyName ?? job.company ?? 'SmartHire',
  description: job.description ?? '',
  requiredSkills: normalizeSkills(job.requiredSkills ?? job.skills),
  experience: job.experience ?? job.minExperience ?? 0,
  package: job.package ?? job.salary ?? 'Not specified',
  location: job.location ?? 'Remote',
  status: job.status ?? 'Active',
  applicants: job.applicantsCount ?? job.applicants ?? 0,
  postedDate: job.postedDate ?? job.createdAt ?? '',
  applied: Boolean(job.applied),
});

export const mapApplicationFromApi = (application) => ({
  id: application.id ?? application.applicationId ?? crypto.randomUUID(),
  candidateName:
    application.candidateName ??
    application.name ??
    application.candidate?.name ??
    'Candidate',
  email: application.email ?? application.candidateEmail ?? application.candidate?.email ?? 'N/A',
  skills: normalizeSkills(application.skills ?? application.candidateSkills ?? application.candidate?.skills),
  coverLetter: application.coverLetter ?? application.message ?? 'No cover letter provided.',
  status: application.status ?? 'PENDING',
  appliedDate: application.appliedDate ?? application.createdAt ?? '',
});

export const getCandidateJobs = (token) =>
  apiRequest('/api/candidate/jobs', {
    method: 'GET',
    token,
  });

export const applyForJob = (token, jobId, coverLetter) =>
  apiRequest(`/api/candidate/jobs/${jobId}/apply`, {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ coverLetter }),
  });

export const createRecruiterJob = (token, payload) =>
  apiRequest('/api/recruiter/jobs', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

export const getRecruiterJobs = (token) =>
  apiRequest('/api/recruiter/jobs', {
    method: 'GET',
    token,
  });

export const getJobApplications = (token, jobId) =>
  apiRequest(`/api/recruiter/jobs/${jobId}/applications`, {
    method: 'GET',
    token,
  });

export const updateApplicationStatus = (token, applicationId, payload) =>
  apiRequest(`/api/recruiter/applications/${applicationId}/status`, {
    method: 'PUT',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });


