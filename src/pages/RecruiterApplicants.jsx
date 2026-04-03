import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaComments,
  FaDownload,
  FaEnvelope,
  FaFileAlt,
  FaMapMarkerAlt,
  FaRegClock,
  FaSpinner,
  FaSuitcase,
  FaUserCheck,
  FaUsers,
} from 'react-icons/fa';
import { clearSession, getStoredToken } from '../utils/auth';
import {
  downloadCandidateResume,
  getJobApplications,
  mapApplicationFromApi,
  updateApplicationStatus,
} from '../utils/jobs';

const APPLICATION_STATUSES = ['PENDING', 'INTERVIEW', 'REJECTED', 'HIRED'];

const parseResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const getStatusClasses = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'INTERVIEW') return 'bg-blue-50 text-blue-700 border-blue-100';
  if (normalized === 'REJECTED') return 'bg-red-50 text-red-700 border-red-100';
  if (normalized === 'HIRED') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  return 'bg-amber-50 text-amber-700 border-amber-100';
};

const formatAppliedDate = (value) => {
  if (!value) return 'N/A';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value;
  return parsedDate.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getResumeErrorMessage = (message) => {
  const normalized = String(message || '').toLowerCase();
  if (normalized.includes('file not found on disk')) {
    return 'Resume record exists, but the actual file is missing on the server.';
  }
  return message || 'Unable to download resume.';
};

const RecruiterApplicants = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [updatingApplicationId, setUpdatingApplicationId] = useState(null);
  const [downloadingResumeId, setDownloadingResumeId] = useState(null);
  const [statusUpdateData, setStatusUpdateData] = useState({});

  const recruiterName = localStorage.getItem('userName') || 'Recruiter';
  const jobTitle = location.state?.jobTitle ?? 'Job Applicants';
  const company = location.state?.company ?? 'SmartHire';

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

  const loadApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await withAuth((token) => getJobApplications(token, jobId));
      if (!response) return;
      const data = await parseResponseBody(response);
      if (!response.ok) throw new Error(data.message || 'Unable to load applicants.');
      const list = Array.isArray(data) ? data : data.applications ?? [];
      setApplications(list.map(mapApplicationFromApi));
    } catch (loadError) {
      setApplications([]);
      setError(loadError.message || 'Unable to load applicants.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [jobId]);

  const applicantStats = useMemo(
    () => ({
      total: applications.length,
      interview: applications.filter((item) => item.status?.toUpperCase() === 'INTERVIEW').length,
      hired: applications.filter((item) => item.status?.toUpperCase() === 'HIRED').length,
    }),
    [applications]
  );

  const handleStatusDraftChange = (applicationId, field, value) => {
    setStatusUpdateData((currentData) => ({
      ...currentData,
      [applicationId]: {
        status: currentData[applicationId]?.status ?? 'PENDING',
        message: currentData[applicationId]?.message ?? '',
        ...currentData[applicationId],
        [field]: value,
      },
    }));
  };

  const handleUpdateApplicationStatus = async (application) => {
    const draft = statusUpdateData[application.id] ?? { status: application.status, message: '' };
    setUpdatingApplicationId(application.id);
    setError('');
    setMessage('');
    try {
      const response = await withAuth((token) =>
        updateApplicationStatus(token, application.id, {
          status: draft.status,
          message: draft.message,
        })
      );
      if (!response) return;
      const data = await parseResponseBody(response);
      if (!response.ok) throw new Error(data.message || 'Unable to update application status.');
      setApplications((currentApplications) =>
        currentApplications.map((currentApplication) =>
          currentApplication.id === application.id
            ? { ...currentApplication, status: draft.status }
            : currentApplication
        )
      );
      setMessage(data.message || `Application updated to ${draft.status}.`);
    } catch (statusError) {
      setError(statusError.message || 'Unable to update application status.');
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  const handleDownloadResume = async (application) => {
    if (!application.resumeId) {
      setError('Resume is not available for this candidate.');
      return;
    }

    setDownloadingResumeId(application.resumeId);
    setError('');
    setMessage('');

    try {
      const response = await withAuth((token) =>
        downloadCandidateResume(token, application.resumeId)
      );

      if (!response) return;

      if (!response.ok) {
        const data = await parseResponseBody(response);
        throw new Error(getResumeErrorMessage(data.message));
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const contentDisposition = response.headers.get('content-disposition');
      const fileNameMatch = contentDisposition?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);

      link.href = downloadUrl;
      link.download = fileNameMatch?.[1]
        ? decodeURIComponent(fileNameMatch[1].replace(/"/g, ''))
        : `candidate-resume-${application.resumeId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setMessage(`Resume downloaded for ${application.candidateName}.`);
    } catch (downloadError) {
      setError(getResumeErrorMessage(downloadError.message));
    } finally {
      setDownloadingResumeId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <button
              onClick={() => navigate('/recruiter-dashboard')}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              <FaArrowLeft />
              Back to jobs
            </button>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
              Applicant Workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{jobTitle}</h1>
            <p className="mt-2 text-sm text-slate-500">
              Review each application, download resumes, open chat, and update candidate status.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Company</p>
              <p className="mt-2 text-lg font-semibold text-slate-800">{company}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Applicants</p>
              <p className="mt-2 text-lg font-semibold text-slate-800">{applicantStats.total}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Interview / Hired</p>
              <p className="mt-2 text-lg font-semibold text-slate-800">
                {applicantStats.interview} / {applicantStats.hired}
              </p>
            </div>
          </div>
        </div>

        {(message || error) && (
          <div
            className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
              error
                ? 'border-red-100 bg-red-50 text-red-700'
                : 'border-emerald-100 bg-emerald-50 text-emerald-700'
            }`}
          >
            {error || message}
          </div>
        )}

        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <FaSpinner className="mx-auto mb-4 animate-spin text-3xl text-emerald-600" />
            <p className="text-slate-500">Loading applicants...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <FaUsers className="mx-auto mb-4 text-5xl text-slate-300" />
            <h2 className="text-xl font-semibold text-slate-800">No applicants yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Once candidates apply to this role, their profiles will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => {
              const draft = statusUpdateData[application.id] ?? {
                status: application.status,
                message: '',
              };

              return (
                <article
                  key={application.id}
                  className="rounded-[30px] border border-emerald-100 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-lg"
                >
                  <div className="flex flex-col gap-5 border-b border-slate-100 pb-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="min-w-0">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                            <FaUserCheck />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <h2 className="text-2xl font-semibold text-slate-900">
                                {application.candidateName}
                              </h2>
                              <span
                                className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(application.status)}`}
                              >
                                {application.status}
                              </span>
                            </div>
                            <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
                              <FaRegClock className="text-emerald-600" />
                              Applied on {formatAppliedDate(application.appliedDate)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <div className="min-w-[280px] flex-1 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Email
                            </p>
                            <p className="flex items-start gap-2 leading-6">
                              <FaEnvelope className="mt-1 shrink-0 text-emerald-600" />
                              <span className="break-all text-[15px]">{application.email}</span>
                            </p>
                          </div>
                          <div className="min-w-[170px] flex-1 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Candidate ID
                            </p>
                            <p className="inline-flex items-start gap-2 leading-6">
                              <FaSuitcase className="mt-1 shrink-0 text-emerald-600" />
                              <span>{application.candidateId ?? 'N/A'}</span>
                            </p>
                          </div>
                          <div className="min-w-[170px] flex-1 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Resume ID
                            </p>
                            <p className="inline-flex items-start gap-2 leading-6">
                              <FaMapMarkerAlt className="mt-1 shrink-0 text-emerald-600" />
                              <span>{application.resumeId ?? 'Unavailable'}</span>
                            </p>
                          </div>
                        </div>

                        <section className="mt-4 rounded-3xl border border-slate-100 bg-slate-50 p-5">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                            <div className="w-full max-w-[140px] shrink-0">
                              <p className="text-sm font-semibold text-slate-800">Skills</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {application.skills.length > 0 ? (
                                application.skills.map((skill) => (
                                  <span
                                    key={skill}
                                    className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
                                  >
                                    {skill}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-slate-500">No skills listed</span>
                              )}
                            </div>
                          </div>
                        </section>

                        <section className="mt-4 rounded-3xl border border-slate-100 bg-slate-50 p-5">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                            <div className="flex w-full max-w-[140px] shrink-0 items-center gap-2 text-sm font-semibold text-slate-800">
                              <FaFileAlt className="text-emerald-600" />
                              Cover Letter
                            </div>
                            <p className="text-sm leading-7 text-slate-600">
                              {application.coverLetter}
                            </p>
                          </div>
                        </section>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:w-[380px] xl:grid-cols-1 md:grid-cols-2">
                      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700/70">
                          Quick Actions
                        </p>
                        <div className="mt-4 grid gap-3">
                          <button
                            onClick={() => handleDownloadResume(application)}
                            disabled={!application.resumeId || downloadingResumeId === application.resumeId}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-50"
                          >
                            {downloadingResumeId === application.resumeId ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaDownload />
                            )}
                            {application.resumeId ? 'Download Resume' : 'Resume Unavailable'}
                          </button>

                          <button
                            onClick={() =>
                              navigate('/recruiter-chat', {
                                state: {
                                  targetId: jobId,
                                  fallbackTargetId: application.id,
                                  applicationId: application.id,
                                  chatRoomId: application.chatRoomId,
                                  jobId,
                                  jobTitle,
                                  company,
                                  candidateName: application.candidateName,
                                  recruiterName,
                                  backPath: `/recruiter/jobs/${jobId}/applicants`,
                                },
                              })
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            <FaComments />
                            Open Chat
                          </button>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700/70">
                          Update Status
                        </p>
                        <div className="mt-4 space-y-3">
                          <select
                            value={draft.status}
                            onChange={(event) =>
                              handleStatusDraftChange(application.id, 'status', event.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {APPLICATION_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <textarea
                            rows={4}
                            value={draft.message}
                            onChange={(event) =>
                              handleStatusDraftChange(application.id, 'message', event.target.value)
                            }
                            placeholder="Optional message for the candidate"
                            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            onClick={() => handleUpdateApplicationStatus(application)}
                            disabled={updatingApplicationId === application.id}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-50"
                          >
                            {updatingApplicationId === application.id ? (
                              <FaSpinner className="animate-spin" />
                            ) : null}
                            Save Status
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterApplicants;
