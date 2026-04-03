import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBookmark,
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaChartLine,
  FaComments,
  FaCompass,
  FaEnvelope,
  FaEye,
  FaMapSigns,
  FaMapMarkerAlt,
  FaSpinner,
  FaStar,
} from 'react-icons/fa';
import BrandLogo from '../components/BrandLogo';
import CandidateResumePanel from '../components/CandidateResumePanel';
import { clearSession, getStoredToken } from '../utils/auth';
import { applyForJob, getCandidateJobs, getSkillGapRoadmap, mapJobFromApi } from '../utils/jobs';

const parseResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const getResponseMessage = (payload) =>
  payload?.message ??
  payload?.error ??
  payload?.details ??
  payload?.data?.message ??
  payload?.result?.message ??
  '';

const getSkillGapErrorMessage = (payload) => {
  const message = getResponseMessage(payload);
  const normalized = message.toLowerCase();

  if (
    normalized.includes('no static resource') ||
    normalized.includes('500') ||
    normalized.includes('internal server error')
  ) {
    return 'Skill-gap roadmap API is failing on the server right now. Please try again later.';
  }

  return message || 'Unable to generate skill-gap roadmap.';
};

const getAppliedJobsStorageKey = (email) => `candidate-applied-jobs:${email || 'default'}`;

const readAppliedJobsCache = (email) => {
  try {
    const storedValue = localStorage.getItem(getAppliedJobsStorageKey(email));
    return storedValue ? JSON.parse(storedValue) : {};
  } catch {
    return {};
  }
};

const writeAppliedJobsCache = (email, value) => {
  try {
    localStorage.setItem(getAppliedJobsStorageKey(email), JSON.stringify(value));
  } catch {
    // Ignore storage write failures and keep the in-memory state working.
  }
};

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all jobs');
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [applyModalJob, setApplyModalJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [skillGapLoadingJobId, setSkillGapLoadingJobId] = useState(null);
  const [skillGapData, setSkillGapData] = useState(null);

  const userName = localStorage.getItem('userName') || 'Alex Morgan';
  const userEmail = localStorage.getItem('userEmail') || 'alex.morgan@example.com';
  const candidateId = localStorage.getItem('userId') || '';
  const userAvatar = userName
    .split(' ')
    .map((name) => name[0])
    .join('');

  const withAuth = async (request) => {
    const token = getStoredToken();
    if (!token) {
      clearSession();
      navigate('/', { replace: true });
      return null;
    }
    const response = await request(token);
    if (response.status === 401 || response.status === 403) {
      clearSession();
      navigate('/', { replace: true });
      return null;
    }
    return response;
  };

  const loadJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await withAuth((token) => getCandidateJobs(token));
      if (!response) return;
      const data = await parseResponseBody(response);
      if (!response.ok) throw new Error(getResponseMessage(data) || 'Unable to load jobs.');
      const jobList = Array.isArray(data) ? data : data.jobs ?? [];
      const cachedAppliedJobs = readAppliedJobsCache(userEmail);
      setJobs(
        jobList.map(mapJobFromApi).map((job) => {
          const cachedJob = cachedAppliedJobs[job.id];
          if (!cachedJob) return job;
          return {
            ...job,
            applied: job.applied || Boolean(cachedJob.applied),
            applicationId: job.applicationId ?? cachedJob.applicationId ?? null,
          };
        })
      );
    } catch (loadError) {
      setError(loadError.message || 'Unable to load jobs.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesSearch =
        !normalizedSearch ||
        job.title.toLowerCase().includes(normalizedSearch) ||
        job.company.toLowerCase().includes(normalizedSearch) ||
        job.requiredSkills.some((skill) => skill.toLowerCase().includes(normalizedSearch));
      const normalizedTab = activeTab.toLowerCase();
      if (normalizedTab === 'remote') {
        return matchesSearch && job.location.toLowerCase().includes('remote');
      }
      if (normalizedTab === 'contract') {
        return matchesSearch && job.description.toLowerCase().includes('contract');
      }
      if (normalizedTab === 'featured') {
        return matchesSearch && job.requiredSkills.length >= 3;
      }
      return matchesSearch;
    });
  }, [activeTab, jobs, searchTerm]);

  const stats = useMemo(
    () => ({
      jobsApplied: jobs.filter((job) => job.applied).length,
      skillMatches: jobs.filter((job) => job.requiredSkills.length >= 4).length,
      interviews: jobs.filter((job) => job.applied).slice(0, 3).length,
      applicationSuccess:
        jobs.length > 0
          ? `${Math.round((jobs.filter((job) => job.applied).length / jobs.length) * 100)}%`
          : '0%',
    }),
    [jobs]
  );

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  const openApplyModal = (job) => {
    setApplyModalJob(job);
    setCoverLetter('');
    setError('');
    setMessage('');
  };

  const closeApplyModal = () => {
    setApplyModalJob(null);
    setCoverLetter('');
  };

  const handleGenerateSkillGap = async (job) => {
    if (!candidateId) {
      setError('Candidate ID is missing for skill-gap generation.');
      setMessage('');
      return;
    }
    setSkillGapLoadingJobId(job.id);
    setSkillGapData(null);
    setError('');
    setMessage('');
    try {
      const response = await withAuth((token) => getSkillGapRoadmap(token, candidateId, job.id));
      if (!response) return;
      const data = await parseResponseBody(response);
      if (!response.ok) {
        throw new Error(getSkillGapErrorMessage(data));
      }
      setSkillGapData({
        jobId: job.id,
        analysisId: data.analysisId ?? null,
        jobTitle: data.jobTitle ?? job.title,
        missingSkills: Array.isArray(data.missingSkills) ? data.missingSkills : [],
        roadmap: data.roadmap ?? data.roadmapText ?? 'No roadmap available.',
        learningResources: Array.isArray(data.learningResources) ? data.learningResources : [],
        createdAt: data.createdAt ?? null,
      });
      setMessage(`Skill-gap roadmap generated for ${job.title}.`);
    } catch (skillGapError) {
      setError(skillGapError.message || 'Unable to generate skill-gap roadmap.');
    } finally {
      setSkillGapLoadingJobId(null);
    }
  };

  const cacheAppliedJob = (jobId, applicationId = null) => {
    const currentCache = readAppliedJobsCache(userEmail);
    writeAppliedJobsCache(userEmail, {
      ...currentCache,
      [jobId]: {
        applied: true,
        applicationId: applicationId ?? currentCache[jobId]?.applicationId ?? null,
      },
    });
  };

  const openChatPage = (job) => {
    setError('');
    navigate('/candidate-chat', {
      state: {
        targetId: job.id,
        applicationId: job.applicationId,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
      },
    });
  };

  const handleApply = async () => {
    if (!applyModalJob) return;
    if (!coverLetter.trim()) {
      setError('Please add a cover letter before applying.');
      return;
    }
    setApplying(true);
    setError('');
    try {
      const response = await withAuth((token) =>
        applyForJob(token, applyModalJob.id, coverLetter.trim())
      );
      if (!response) return;
      const data = await parseResponseBody(response);
      const responseMessage = getResponseMessage(data);
      const normalizedMessage = responseMessage.toLowerCase();
      if (!response.ok) {
        if (
          normalizedMessage.includes('already applied') ||
          (response.status === 400 &&
            (normalizedMessage.includes('already') ||
              normalizedMessage.includes('duplicate') ||
              normalizedMessage.includes('exists') ||
              normalizedMessage.includes('applied')))
        ) {
          const resolvedApplicationId =
            data.applicationId ??
            data.id ??
            data.application?.id ??
            applyModalJob.applicationId ??
            null;
          cacheAppliedJob(applyModalJob.id, resolvedApplicationId);
          setJobs((currentJobs) =>
            currentJobs.map((job) =>
              job.id === applyModalJob.id
                ? {
                    ...job,
                    applied: true,
                    applicationId: resolvedApplicationId ?? job.applicationId,
                  }
                : job
            )
          );
          setMessage(responseMessage || `You have already applied for ${applyModalJob.title}.`);
          closeApplyModal();
          return;
        }
        throw new Error(responseMessage || 'Unable to apply for this job.');
      }

      const resolvedApplicationId =
        data.applicationId ??
        data.id ??
        data.application?.id ??
        applyModalJob.applicationId ??
        null;

      cacheAppliedJob(applyModalJob.id, resolvedApplicationId);
      setJobs((currentJobs) =>
        currentJobs.map((job) =>
          job.id === applyModalJob.id
            ? {
                ...job,
                applied: true,
                applicationId: resolvedApplicationId ?? job.applicationId,
              }
            : job
        )
      );
      setMessage(responseMessage || `Application submitted for ${applyModalJob.title}.`);
      closeApplyModal();
    } catch (applyError) {
      setError(applyError.message || 'Unable to apply for this job.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#f4f7fb]">
        <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <BrandLogo subtitle="Candidate Workspace" />

            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white">
                  {userAvatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{userName}</p>
                  <p className="text-xs text-slate-500">{userEmail}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-medium text-white transition hover:shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <section className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
            <div className="rounded-[32px] bg-gradient-to-r from-emerald-600 via-teal-600 to-green-500 px-7 py-8 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Career Dashboard
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight">
                Find stronger roles, apply faster, and stay interview-ready.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50">
                Browse live openings, apply with a tailored cover letter, open recruiter chat after
                applying, and generate a skill-gap roadmap whenever you want to prepare for a role.
              </p>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Profile Snapshot
              </p>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-xl font-semibold text-emerald-700">
                  {userAvatar}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{userName}</h3>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    <FaEnvelope className="text-emerald-600" />
                    {userEmail}
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Focus</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    Full-stack and frontend roles with strong growth potential
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Actions</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    Apply, chat, analyze resume, and launch one dedicated AI interview flow
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Jobs Applied', value: stats.jobsApplied, icon: FaBriefcase },
              { label: 'Skill Matches', value: stats.skillMatches, icon: FaBookmark },
              { label: 'Interview Leads', value: stats.interviews, icon: FaCalendarAlt },
              { label: 'Apply Rate', value: stats.applicationSuccess, icon: FaChartLine },
            ].map((item) => (
              <div key={item.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                    <item.icon className="text-xl" />
                  </div>
                  <span className="text-3xl font-semibold text-slate-900">{item.value}</span>
                </div>
                <p className="mt-4 text-sm font-medium text-slate-700">{item.label}</p>
                <p className="mt-1 text-xs text-slate-400">Updated from your current job pipeline</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <CandidateResumePanel />
          </div>

          <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Job Discovery
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">Explore open roles</h3>
              </div>
              <div className="flex w-full flex-col gap-3 md:flex-row lg:w-auto">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by role, company, or skill"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 md:min-w-[320px]"
                />
                <div className="flex flex-wrap gap-2">
                  {['All Jobs', 'Featured', 'Remote', 'Contract'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        activeTab === tab.toLowerCase()
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {(message || error) && (
              <div
                className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
                  error
                    ? 'border-red-100 bg-red-50 text-red-700'
                    : 'border-emerald-100 bg-emerald-50 text-emerald-700'
                }`}
              >
                {error || message}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-800">{filteredJobs.length}</span> roles
              </p>
            </div>

            {loading ? (
              <div className="mt-6 rounded-[28px] bg-slate-50 p-12 text-center">
                <FaSpinner className="mx-auto mb-4 animate-spin text-3xl text-emerald-600" />
                <p className="text-slate-500">Loading jobs...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="mt-6 rounded-[28px] bg-slate-50 p-12 text-center">
                <FaCompass className="mx-auto mb-4 text-5xl text-slate-300" />
                <h3 className="text-xl font-semibold text-slate-700">No jobs available</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Try another search term or wait for more openings from the API.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                {filteredJobs.map((job) => (
                  <article
                    key={job.id}
                    className="group rounded-[30px] border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/40 p-5 transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-sm">
                          <FaBuilding className="text-xl" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-xl font-semibold capitalize text-slate-900">
                              {job.title}
                            </h4>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              {job.status}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-sm font-medium text-slate-500">
                            {job.company}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {job.applicants} applicants
                      </div>
                    </div>

                    <p className="mt-4 line-clamp-3 min-h-[72px] text-sm leading-6 text-slate-600">
                      {job.description || 'No description provided.'}
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-emerald-50/70 px-4 py-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-emerald-600" />
                          {job.location}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-emerald-50/70 px-4 py-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <FaBriefcase className="text-emerald-600" />
                          {job.experience}+ yrs
                        </div>
                      </div>
                      <div className="rounded-2xl bg-emerald-50/70 px-4 py-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <FaStar className="text-amber-500" />
                          {job.package}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.requiredSkills.slice(0, 6).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.requiredSkills.length > 6 && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                          +{job.requiredSkills.length - 6} more
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                      <button
                        onClick={() => openApplyModal(job)}
                        disabled={job.applied}
                        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                          job.applied
                          ? 'cursor-not-allowed bg-emerald-100 text-emerald-700'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg'
                        }`}
                      >
                        <FaEye />
                        {job.applied ? 'Applied' : 'Apply Now'}
                      </button>

                      {job.applied && (
                        <button
                          onClick={() => openChatPage(job)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <FaComments />
                          Open Chat
                        </button>
                      )}

                      {job.applied && (
                        <button
                          onClick={() => handleGenerateSkillGap(job)}
                          disabled={skillGapLoadingJobId === job.id}
                          className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {skillGapLoadingJobId === job.id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaMapSigns />
                          )}
                          Get Skill Gap Roadmap
                        </button>
                      )}
                    </div>

                    {skillGapData?.jobId === job.id && (
                      <div className="mt-4 rounded-3xl border border-blue-100 bg-blue-50/70 p-5">
                        <p className="text-sm font-semibold text-slate-800">Skill Gap Roadmap</p>
                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Missing Skills
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {skillGapData.missingSkills.length > 0 ? (
                              skillGapData.missingSkills.map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-medium text-blue-700"
                                >
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-slate-500">No missing skills returned.</span>
                            )}
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Roadmap
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{skillGapData.roadmap}</p>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {applyModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-2xl rounded-[32px] bg-white shadow-2xl">
            <div className="rounded-t-[32px] bg-gradient-to-r from-emerald-600 via-teal-600 to-green-500 px-6 py-6 text-white">
              <h3 className="text-2xl font-semibold">Apply for {applyModalJob.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{applyModalJob.company}</p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700">Cover Letter</label>
              <textarea
                rows={7}
                value={coverLetter}
                onChange={(event) => setCoverLetter(event.target.value)}
                placeholder="Write a concise cover letter highlighting your fit for this role."
                className="mt-3 w-full resize-none rounded-3xl border border-slate-200 p-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
              <button
                onClick={closeApplyModal}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-50"
              >
                {applying ? <FaSpinner className="animate-spin" /> : null}
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CandidateDashboard;
