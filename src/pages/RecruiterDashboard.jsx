import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBriefcase,
  FaBuilding,
  FaCheckCircle,
  FaFilter,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPlus,
  FaSpinner,
  FaUsers,
} from 'react-icons/fa';
import BrandLogo from '../components/BrandLogo';
import { clearSession, getStoredToken } from '../utils/auth';
import {
  createRecruiterJob,
  getJobApplications,
  getRecruiterJobs,
  mapJobFromApi,
  toggleRecruiterJobStatus,
} from '../utils/jobs';

const parseResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const createInitialFormData = () => ({
  title: '',
  description: '',
  skills: '',
  experience: '',
  packageValue: '',
  location: '',
});

const getStatusClasses = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ACTIVE') return 'bg-emerald-50 text-emerald-700';
  if (normalized === 'INACTIVE') return 'bg-slate-100 text-slate-700';
  return 'bg-amber-50 text-amber-700';
};

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const [showPostJob, setShowPostJob] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingJobId, setUpdatingJobId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState(createInitialFormData);

  const userName = localStorage.getItem('userName') || 'Recruiter';
  const userEmail = localStorage.getItem('userEmail') || 'recruiter@example.com';
  const userAvatar = userName.split(' ').map((name) => name[0]).join('');

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
      const response = await withAuth((token) => getRecruiterJobs(token));
      if (!response) return;
      const data = await parseResponseBody(response);
      if (!response.ok) throw new Error(data.message || 'Unable to load recruiter jobs.');
      const jobList = Array.isArray(data) ? data : data.jobs ?? [];
      const mappedJobs = jobList.map(mapJobFromApi);

      const jobCounts = await Promise.all(
        mappedJobs.map(async (job) => {
          try {
            const applicationsResponse = await withAuth((token) => getJobApplications(token, job.id));
            if (!applicationsResponse) {
              return { jobId: job.id, applicants: Number(job.applicants || 0) };
            }

            const applicationsData = await parseResponseBody(applicationsResponse);
            if (!applicationsResponse.ok) {
              return { jobId: job.id, applicants: Number(job.applicants || 0) };
            }

            const applications = Array.isArray(applicationsData)
              ? applicationsData
              : applicationsData.applications ?? [];

            return { jobId: job.id, applicants: applications.length };
          } catch {
            return { jobId: job.id, applicants: Number(job.applicants || 0) };
          }
        })
      );

      const applicantsByJobId = Object.fromEntries(
        jobCounts.map((item) => [item.jobId, item.applicants])
      );

      setJobs(
        mappedJobs.map((job) => ({
          ...job,
          applicants: applicantsByJobId[job.id] ?? Number(job.applicants || 0),
        }))
      );
    } catch (loadError) {
      setError(loadError.message || 'Unable to load recruiter jobs.');
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
        job.location.toLowerCase().includes(normalizedSearch);
      const matchesFilter =
        filterStatus === 'all' || job.status.toLowerCase() === filterStatus.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [filterStatus, jobs, searchTerm]);

  const stats = useMemo(
    () => ({
      totalJobs: jobs.length,
      activeJobs: jobs.filter((job) => job.status.toLowerCase() === 'active').length,
      totalApplicants: jobs.reduce((sum, job) => sum + Number(job.applicants || 0), 0),
    }),
    [jobs]
  );

  const handleCreateJob = async () => {
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.skills.trim() ||
      !formData.experience.trim() ||
      !formData.packageValue.trim() ||
      !formData.location.trim()
    ) {
      setError('Please fill all required job fields.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        requiredSkills: formData.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
        experience: Number(formData.experience),
        package: formData.packageValue.trim(),
        location: formData.location.trim(),
      };
      const response = await withAuth((token) => createRecruiterJob(token, payload));
      if (!response) return;
      const data = await parseResponseBody(response);
      if (!response.ok) throw new Error(data.message || 'Unable to create job.');
      setJobs((currentJobs) => [mapJobFromApi(data.job ?? data), ...currentJobs]);
      setMessage(data.message || 'Job posted successfully.');
      setFormData(createInitialFormData());
      setShowPostJob(false);
    } catch (createError) {
      setError(createError.message || 'Unable to create job.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleJobStatus = async (job) => {
    const nextStatus = job.status.toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setUpdatingJobId(job.id);
    setError('');
    setMessage('');
    try {
      const response = await withAuth((token) =>
        toggleRecruiterJobStatus(token, job.id, { status: nextStatus })
      );
      if (!response) return;
      const data = await parseResponseBody(response);
      if (!response.ok) throw new Error(data.message || 'Unable to update job status.');
      setJobs((currentJobs) =>
        currentJobs.map((currentJob) =>
          currentJob.id === job.id ? { ...currentJob, status: nextStatus } : currentJob
        )
      );
      setMessage(data.message || `${job.title} marked as ${nextStatus}.`);
    } catch (toggleError) {
      setError(toggleError.message || 'Unable to update job status.');
    } finally {
      setUpdatingJobId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Recruiter Workspace" />

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
              onClick={() => {
                clearSession();
                navigate('/');
              }}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-medium text-white transition hover:shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="rounded-[32px] bg-gradient-to-r from-emerald-600 via-teal-600 to-green-500 px-7 py-8 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-50">
              Hiring Dashboard
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight">
              Manage open roles and move applicants through a cleaner workflow.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50">
              Open dedicated applicant pages for each role, review candidate profiles without the
              old crowded layout, update statuses, and jump into recruiter chat from one place.
            </p>
            <button
              onClick={() => setShowPostJob(true)}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:shadow-lg"
            >
              <FaPlus />
              Post New Job
            </button>
          </div>

          <div className="grid gap-4">
            {[
              { label: 'Total Jobs', value: stats.totalJobs, icon: FaBriefcase },
              { label: 'Active Jobs', value: stats.activeJobs, icon: FaCheckCircle },
              { label: 'Total Applicants', value: stats.totalApplicants, icon: FaUsers },
            ].map((item) => (
              <div key={item.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                    <item.icon className="text-xl" />
                  </div>
                  <span className="text-3xl font-semibold text-slate-900">{item.value}</span>
                </div>
                <p className="mt-4 text-sm font-medium text-slate-700">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Open Positions
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">Recruiter jobs</h3>
            </div>
            <div className="flex w-full flex-col gap-3 md:flex-row lg:w-auto">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by role, company, or location"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 md:min-w-[320px]"
              />
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(event) => setFilterStatus(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All jobs</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
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

          {loading ? (
            <div className="mt-6 rounded-[28px] bg-slate-50 p-12 text-center">
              <FaSpinner className="mx-auto mb-4 animate-spin text-3xl text-emerald-600" />
              <p className="text-slate-500">Loading recruiter jobs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="mt-6 rounded-[28px] bg-slate-50 p-12 text-center">
              <FaBriefcase className="mx-auto mb-4 text-5xl text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-700">No jobs found</h3>
              <p className="mt-2 text-sm text-slate-500">Post a new role to see it appear here.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              {filteredJobs.map((job) => (
                <article
                  key={job.id}
                  className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-6 transition hover:border-emerald-200 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                        <FaBuilding className="text-xl" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xl font-semibold text-slate-900">{job.title}</h4>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(job.status)}`}>
                            {job.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{job.company}</p>
                      </div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                      {job.applicants} applicants
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-slate-600">
                    {job.description || 'No description provided.'}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-emerald-600" />
                        {job.location}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <FaUsers className="text-emerald-600" />
                        {job.experience}+ years
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <FaMoneyBillWave className="text-emerald-600" />
                        {job.package}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {job.requiredSkills.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-medium text-emerald-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
                    <button
                      onClick={() =>
                        navigate(`/recruiter/jobs/${job.id}/applicants`, {
                          state: {
                            jobTitle: job.title,
                            company: job.company,
                          },
                        })
                      }
                      className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white transition hover:shadow-lg"
                    >
                      View Applicants
                    </button>
                    <button
                      onClick={() => handleToggleJobStatus(job)}
                      disabled={updatingJobId === job.id}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      {updatingJobId === job.id ? <FaSpinner className="animate-spin" /> : null}
                      Set {job.status.toUpperCase() === 'ACTIVE' ? 'Inactive' : 'Active'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {showPostJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-2xl rounded-[32px] bg-white shadow-2xl">
            <div className="rounded-t-[32px] bg-slate-900 px-6 py-6 text-white">
              <h2 className="text-2xl font-semibold">Post a New Job</h2>
              <p className="mt-2 text-sm text-slate-300">Create a clean role card for your hiring pipeline.</p>
            </div>
            <div className="space-y-4 p-6">
              <input
                type="text"
                placeholder="Job title"
                value={formData.title}
                onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <textarea
                rows={4}
                placeholder="Job description"
                value={formData.description}
                onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="text"
                placeholder="Required skills (comma separated)"
                value={formData.skills}
                onChange={(event) => setFormData((current) => ({ ...current, skills: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="grid gap-4 md:grid-cols-3">
                <input
                  type="number"
                  placeholder="Experience"
                  value={formData.experience}
                  onChange={(event) => setFormData((current) => ({ ...current, experience: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Package"
                  value={formData.packageValue}
                  onChange={(event) => setFormData((current) => ({ ...current, packageValue: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={formData.location}
                  onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
              <button
                onClick={() => setShowPostJob(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateJob}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-50"
              >
                {submitting ? <FaSpinner className="animate-spin" /> : null}
                Submit Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;
