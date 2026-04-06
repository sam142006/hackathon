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

const normalizeSkillToken = (skill) =>
  String(skill || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getUniqueNormalizedSkills = (skills) => {
  const tokens = normalizeSkills(skills)
    .map((skill) => normalizeSkillToken(skill))
    .filter(Boolean);

  return [...new Set(tokens)];
};

const collectApplicationSkills = (application) => {
  const candidate = application?.candidate ?? {};
  const resume = candidate?.resume ?? application?.resume ?? {};
  const resumeAnalysis = application?.resumeAnalysis ?? candidate?.resumeAnalysis ?? resume?.analysis ?? {};

  return normalizeSkills([
    ...(Array.isArray(application?.skills) ? application.skills : []),
    ...(Array.isArray(application?.candidateSkills) ? application.candidateSkills : []),
    ...(Array.isArray(candidate?.skills) ? candidate.skills : []),
    ...(Array.isArray(application?.resumeSkills) ? application.resumeSkills : []),
    ...(Array.isArray(resume?.skills) ? resume.skills : []),
    ...(Array.isArray(application?.extractedSkills) ? application.extractedSkills : []),
    ...(Array.isArray(candidate?.extractedSkills) ? candidate.extractedSkills : []),
    ...(Array.isArray(resumeAnalysis?.extractedSkills) ? resumeAnalysis.extractedSkills : []),
    ...(Array.isArray(resumeAnalysis?.skills) ? resumeAnalysis.skills : []),
  ]);
};

export const calculateApplicantSkillMatch = (requiredSkills = [], candidateSkills = []) => {
  const normalizedRequiredSkills = getUniqueNormalizedSkills(requiredSkills);
  const normalizedCandidateSkills = getUniqueNormalizedSkills(candidateSkills);

  if (normalizedRequiredSkills.length === 0) {
    return {
      percentage: 0,
      matchedSkills: [],
      missingSkills: [],
    };
  }

  const matchedSkills = normalizedRequiredSkills.filter((requiredSkill) =>
    normalizedCandidateSkills.some(
      (candidateSkill) =>
        candidateSkill === requiredSkill ||
        candidateSkill.includes(requiredSkill) ||
        requiredSkill.includes(candidateSkill)
    )
  );

  const missingSkills = normalizedRequiredSkills.filter(
    (requiredSkill) => !matchedSkills.includes(requiredSkill)
  );

  return {
    percentage: Math.round((matchedSkills.length / normalizedRequiredSkills.length) * 100),
    matchedSkills,
    missingSkills,
  };
};

export const mapJobFromApi = (job) => ({
  id: job.id ?? job.jobId ?? crypto.randomUUID(),
  chatRoomId:
    job.chatRoomId ??
    job.chatId ??
    job.chat?.id ??
    job.chat?.chatRoomId ??
    null,
  applicationId:
    job.applicationId ??
    job.appliedApplicationId ??
    job.application?.id ??
    job.jobApplicationId ??
    job.application?.applicationId ??
    null,
  applicationStatus:
    job.applicationStatus ??
    job.application?.status ??
    job.appliedStatus ??
    '',
  title: job.title ?? 'Untitled Role',
  company: job.companyName ?? job.company ?? 'SmartHire',
  description: job.description ?? '',
  requiredSkills: normalizeSkills(job.requiredSkills ?? job.skills),
  experience: job.experience ?? job.minExperience ?? 0,
  package: job.package ?? job.salary ?? 'Not specified',
  location: job.location ?? 'Remote',
  status: job.status ?? 'Active',
  applicants:
    job.applicantsCount ??
    job.applicants ??
    job.applicationCount ??
    job.applicationsCount ??
    job.totalApplicants ??
    (Array.isArray(job.applications) ? job.applications.length : 0),
  postedDate: job.postedDate ?? job.createdAt ?? '',
  applied: Boolean(
    job.applied ??
      job.alreadyApplied ??
      job.hasApplied ??
      job.applicationId ??
      job.appliedApplicationId ??
      job.application?.id ??
      job.application?.applicationId ??
      job.applicationStatus
  ),
});

export const mapApplicationFromApi = (application) => ({
  id: application.id ?? application.applicationId ?? crypto.randomUUID(),
  chatRoomId:
    application.chatRoomId ??
    application.chatId ??
    application.chat?.id ??
    application.chat?.chatRoomId ??
    null,
  candidateId: application.candidateId ?? application.candidate?.id ?? application.userId ?? null,
  candidateName:
    application.candidateName ??
    application.name ??
    application.candidate?.name ??
    'Candidate',
  email: application.email ?? application.candidateEmail ?? application.candidate?.email ?? 'N/A',
  resumeId:
    application.resumeId ??
    application.candidateResumeId ??
    application.candidate?.resumeId ??
    application.candidate?.resume?.id ??
    null,
  skills: collectApplicationSkills(application),
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

export const toggleRecruiterJobStatus = (token, jobId, payload) =>
  apiRequest(`/api/recruiter/jobs/${jobId}/status`, {
    method: 'PUT',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

export const downloadCandidateResume = (token, resumeId) =>
  apiRequest(`/api/resumes/${resumeId}/download`, {
    method: 'GET',
    token,
  });

const SKILL_GAP_REQUESTS = [
  {
    path: (_candidateId, jobId) => `/api/candidate/jobs/${jobId}/skill-gap`,
    method: 'POST',
    body: (candidateId, jobId) => ({ candidateId, jobId }),
  },
  {
    path: (candidateId, jobId) =>
      `/api/candidate/skill-gap-roadmap?candidateId=${candidateId}&jobId=${jobId}`,
    method: 'POST',
  },
  {
    path: () => '/api/candidate/skill-gap-roadmap',
    method: 'POST',
    body: (candidateId, jobId) => ({ candidateId, jobId }),
  },
];

export const getSkillGapRoadmap = async (token, candidateId, jobId) => {
  let lastResponse = null;

  for (const requestConfig of SKILL_GAP_REQUESTS) {
    const response = await apiRequest(requestConfig.path(candidateId, jobId), {
      method: requestConfig.method,
      token,
      headers: requestConfig.body
        ? {
            'Content-Type': 'application/json',
          }
        : undefined,
      body: requestConfig.body ? JSON.stringify(requestConfig.body(candidateId, jobId)) : undefined,
    });

    lastResponse = response;

    if (response.ok || ![404, 405].includes(response.status)) {
      return response;
    }
  }

  return lastResponse;
};

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const extractTextList = (value) => {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => extractTextList(item))
      .filter((item) => typeof item === 'string' && item.trim() !== '');
  }

  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (isPlainObject(value)) {
    return Object.values(value).flatMap((item) => extractTextList(item));
  }

  return [];
};

const stringifyValue = (value) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map((item) => stringifyValue(item)).filter(Boolean).join(', ');
  if (isPlainObject(value)) {
    const preferredText = value.title ?? value.name ?? value.label ?? value.description ?? value.summary;
    if (preferredText) return stringifyValue(preferredText);
  }
  return '';
};

const normalizeLearningResource = (resource, index) => {
  if (typeof resource === 'string') {
    return {
      id: `resource-${index}`,
      title: `Resource ${index + 1}`,
      description: resource,
      url: '',
      platform: '',
      type: '',
    };
  }

  if (!isPlainObject(resource)) {
    return null;
  }

  return {
    id: resource.id ?? `resource-${index}`,
    title:
      resource.title ??
      resource.name ??
      resource.topic ??
      resource.skill ??
      resource.label ??
      `Resource ${index + 1}`,
    description:
      resource.description ??
      resource.summary ??
      resource.reason ??
      resource.notes ??
      resource.content ??
      '',
    url:
      resource.url ??
      resource.link ??
      resource.href ??
      resource.videoUrl ??
      resource.youtubeUrl ??
      '',
    platform: resource.platform ?? resource.provider ?? resource.source ?? '',
    type: resource.type ?? resource.category ?? resource.format ?? '',
    raw: resource,
  };
};

const extractLinksFromValue = (value, path = 'root') => {
  const links = [];

  if (typeof value === 'string') {
    const matches = value.match(/https?:\/\/[^\s"]+/g) ?? [];
    matches.forEach((url, index) => {
      links.push({
        id: `${path}-link-${index}`,
        url: url.replace(/[),.;]+$/, ''),
        label: value.length > 120 ? `${value.slice(0, 117)}...` : value,
        path,
        isYoutube: /youtu\.be|youtube\.com/i.test(url),
      });
    });
    return links;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      links.push(...extractLinksFromValue(item, `${path}[${index}]`));
    });
    return links;
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, nestedValue]) => {
      links.push(...extractLinksFromValue(nestedValue, `${path}.${key}`));
    });
  }

  return links;
};

const getRoadmapText = (payload) => {
  const roadmapValue =
    payload?.roadmap ??
    payload?.roadmapText ??
    payload?.plan ??
    payload?.summary ??
    payload?.analysis ??
    payload?.skillGapRoadmap;

  if (!roadmapValue) return 'No roadmap available.';

  if (typeof roadmapValue === 'string') return roadmapValue;

  if (Array.isArray(roadmapValue)) {
    return roadmapValue.map((item) => stringifyValue(item)).filter(Boolean).join('\n');
  }

  if (isPlainObject(roadmapValue)) {
    const orderedFields = ['overview', 'summary', 'timeline', 'steps', 'recommendations', 'details'];
    const preferredText = orderedFields
      .flatMap((field) => extractTextList(roadmapValue[field]))
      .filter(Boolean);

    if (preferredText.length > 0) {
      return preferredText.join('\n');
    }
  }

  return stringifyValue(roadmapValue) || 'No roadmap available.';
};

export const normalizeSkillGapData = (payload, fallbackJob = {}) => {
  const learningResourceCandidates = [
    ...(Array.isArray(payload?.learningResources) ? payload.learningResources : []),
    ...(Array.isArray(payload?.resources) ? payload.resources : []),
    ...(Array.isArray(payload?.recommendedResources) ? payload.recommendedResources : []),
    ...(Array.isArray(payload?.youtubeLinks) ? payload.youtubeLinks : []),
    ...(Array.isArray(payload?.videos) ? payload.videos : []),
  ];

  const learningResources = learningResourceCandidates
    .map((resource, index) => normalizeLearningResource(resource, index))
    .filter(Boolean);

  const allLinks = extractLinksFromValue(payload);
  const seenLinks = new Set();
  const uniqueLinks = allLinks.filter((link) => {
    if (!link.url || seenLinks.has(link.url)) return false;
    seenLinks.add(link.url);
    return true;
  });

  const missingSkillsSource =
    payload?.missingSkills ??
    payload?.skillGaps ??
    payload?.missingTechnicalSkills ??
    payload?.gapSkills ??
    [];

  return {
    analysisId: payload?.analysisId ?? payload?.id ?? null,
    jobId: payload?.jobId ?? fallbackJob.id ?? null,
    jobTitle: payload?.jobTitle ?? fallbackJob.title ?? 'Skill Gap Roadmap',
    createdAt: payload?.createdAt ?? payload?.generatedAt ?? null,
    missingSkills: extractTextList(missingSkillsSource),
    roadmap: getRoadmapText(payload),
    learningResources,
    allLinks: uniqueLinks,
    rawData: payload,
  };
};
