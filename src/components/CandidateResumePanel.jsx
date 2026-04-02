import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaChartLine,
  FaCloudDownloadAlt,
  FaFileAlt,
  FaPlay,
  FaSearch,
  FaSpinner,
  FaUpload,
} from 'react-icons/fa';
import { clearSession, getStoredToken } from '../utils/auth';
import {
  checkResumeExists,
  downloadResume,
  getResumeAnalysis,
  uploadResume,
} from '../utils/resume';

const parseResponseBody = async (response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
};

const normalizeSkills = (skills) => {
  if (!Array.isArray(skills)) {
    return [];
  }

  return skills.filter((skill) => typeof skill === 'string' && skill.trim() !== '');
};

const getDownloadFileName = (response, fallbackResumeId) => {
  const contentDisposition = response.headers.get('content-disposition');
  const match = contentDisposition?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);

  if (match?.[1]) {
    return decodeURIComponent(match[1].replace(/"/g, ''));
  }

  return `resume-${fallbackResumeId}.pdf`;
};

const CandidateResumePanel = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [resumeId, setResumeId] = useState('');
  const [resumeStatus, setResumeStatus] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('');
  const [error, setError] = useState('');

  const skills = useMemo(
    () => normalizeSkills(resumeData?.extractedSkills),
    [resumeData]
  );

  const handleUnauthorized = () => {
    clearSession();
    navigate('/', { replace: true });
  };

  const withAuth = async (request) => {
    const token = getStoredToken();

    if (!token) {
      handleUnauthorized();
      return null;
    }

    const response = await request(token);

    if (response.status === 401 || response.status === 403) {
      handleUnauthorized();
      return null;
    }

    return response;
  };

  const resetFileInput = () => {
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const syncResumeId = (nextResumeId) => {
    if (nextResumeId !== null && nextResumeId !== undefined && nextResumeId !== '') {
      setResumeId(String(nextResumeId));
    }
  };

  const getEffectiveResumeId = () => {
    const normalizedResumeId = resumeId.trim();

    if (!normalizedResumeId) {
      setError('Enter a resume ID or upload a resume first.');
      return null;
    }

    return normalizedResumeId;
  };

  const handleFileChange = (event) => {
    setError('');
    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const isPdf =
      selectedFile.type === 'application/pdf' ||
      selectedFile.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setFile(null);
      setError('Only PDF resumes are allowed.');
      event.target.value = '';
      return;
    }

    setFile(selectedFile);
  };

  const handleUploadResume = async () => {
    if (!file) {
      setError('Choose a PDF file before uploading.');
      return;
    }

    setLoading(true);
    setLoadingAction('upload');
    setError('');

    try {
      const response = await withAuth((token) => uploadResume(token, file));

      if (!response) {
        return;
      }

      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(data.message || 'Resume upload failed.');
      }

      syncResumeId(data.resumeId);
      setResumeStatus({
        resumeId: data.resumeId ?? null,
        exists: true,
        message: data.message || `${file.name} uploaded successfully.`,
      });

      const uploadedAnalysis = {
        resumeScore: data.resumeScore,
        extractedSkills: data.extractedSkills,
        experienceYears: data.experienceYears,
        summary: data.summary,
      };

      const hasAnalysis =
        uploadedAnalysis.resumeScore !== undefined ||
        uploadedAnalysis.extractedSkills !== undefined ||
        uploadedAnalysis.experienceYears !== undefined ||
        uploadedAnalysis.summary !== undefined;

      setResumeData(hasAnalysis ? uploadedAnalysis : null);
      resetFileInput();
    } catch (uploadError) {
      setError(uploadError.message || 'Resume upload failed.');
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  const handleCheckResume = async () => {
    const effectiveResumeId = getEffectiveResumeId();

    if (!effectiveResumeId) {
      return;
    }

    setLoading(true);
    setLoadingAction('check');
    setError('');

    try {
      const response = await withAuth((token) =>
        checkResumeExists(token, effectiveResumeId)
      );

      if (!response) {
        return;
      }

      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(data.message || 'Unable to check resume status.');
      }

      const exists = typeof data.exists === 'boolean' ? data.exists : true;

      setResumeStatus({
        resumeId: effectiveResumeId,
        exists,
        message: exists
          ? data.message || `Resume ${effectiveResumeId} is available.`
          : data.message || `Resume ${effectiveResumeId} was not found.`,
      });
    } catch (checkError) {
      setResumeStatus(null);
      setError(checkError.message || 'Unable to check resume status.');
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  const handleDownloadResume = async () => {
    const effectiveResumeId = getEffectiveResumeId();

    if (!effectiveResumeId) {
      return;
    }

    setLoading(true);
    setLoadingAction('download');
    setError('');

    try {
      const response = await withAuth((token) =>
        downloadResume(token, effectiveResumeId)
      );

      if (!response) {
        return;
      }

      if (!response.ok) {
        const data = await parseResponseBody(response);
        throw new Error(data.message || 'Unable to download resume.');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = getDownloadFileName(response, effectiveResumeId);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setResumeStatus({
        resumeId: effectiveResumeId,
        exists: true,
        message: `Resume ${effectiveResumeId} downloaded successfully.`,
      });
    } catch (downloadError) {
      setError(downloadError.message || 'Unable to download resume.');
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  const handleGetAnalysis = async () => {
    setLoading(true);
    setLoadingAction('analysis');
    setError('');

    try {
      const response = await withAuth((token) => getResumeAnalysis(token));

      if (!response) {
        return;
      }

      const data = await parseResponseBody(response);

      if (response.status === 400) {
        throw new Error(data.message || 'Resume analysis is not available yet.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Unable to fetch resume analysis.');
      }

      setResumeData(data);
      syncResumeId(data.resumeId);
    } catch (analysisError) {
      setResumeData(null);
      setError(analysisError.message || 'Unable to fetch resume analysis.');
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Resume Tools</h3>
          <p className="text-sm text-gray-500 mt-1">
            Upload, verify, download, analyze your resume, and open your dedicated AI interview workspace.
          </p>
        </div>
        <button
          onClick={() => navigate('/mock-interview')}
          className="px-5 py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl hover:shadow-lg transition font-medium"
        >
          Open AI Interview
        </button>
      </div>

      <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-green-50 p-5">
        <div className="flex flex-col xl:flex-row gap-5">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-2xl bg-white p-3 shadow-sm border border-teal-100">
                <FaFileAlt className="text-lg text-teal-600" />
              </div>
              <div className="w-full">
                <p className="text-sm font-semibold text-gray-800">Resume Actions</p>
                <p className="text-sm text-gray-500 mt-1">
                  Upload a PDF resume or use an existing resume ID for access checks and downloads.
                </p>

                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-4 file:py-2 file:font-medium file:text-teal-700 hover:file:bg-teal-100"
                    />
                    <input
                      type="text"
                      value={resumeId}
                      onChange={(event) => setResumeId(event.target.value)}
                      placeholder="Resume ID"
                      className="w-full sm:max-w-[180px] rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleUploadResume}
                      disabled={loading}
                      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {loadingAction === 'upload' ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaUpload />
                      )}
                      Upload Resume
                    </button>
                    <button
                      onClick={handleCheckResume}
                      disabled={loading}
                      className="px-4 py-2 border border-teal-200 text-teal-700 rounded-xl hover:bg-white transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {loadingAction === 'check' ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaSearch />
                      )}
                      Check Resume Exists
                    </button>
                    <button
                      onClick={handleDownloadResume}
                      disabled={loading}
                      className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-white transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {loadingAction === 'download' ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaCloudDownloadAlt />
                      )}
                      Download Resume
                    </button>
                    <button
                      onClick={handleGetAnalysis}
                      disabled={loading}
                      className="px-4 py-2 border border-teal-200 text-teal-700 rounded-xl hover:bg-white transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {loadingAction === 'analysis' ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaChartLine />
                      )}
                      Resume Analysis
                    </button>
                    <button
                      onClick={() => navigate('/mock-interview', { state: { autoStart: true } })}
                      disabled={loading}
                      className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-white transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <FaPlay />
                      Open & Start AI Interview
                    </button>
                  </div>
                </div>

                {file && (
                  <p className="mt-3 text-sm text-gray-500">
                    Selected file: <span className="font-medium text-gray-700">{file.name}</span>
                  </p>
                )}

                {resumeStatus && (
                  <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {resumeStatus.message}
                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="min-w-[220px] rounded-2xl bg-white border border-teal-100 shadow-sm px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">
              Status
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {loading ? (
                <FaSpinner className="animate-spin text-xl" />
              ) : resumeStatus ? (
                resumeStatus.exists ? 'Ready' : 'Unavailable'
              ) : resumeData ? (
                'Analyzed'
              ) : (
                'Idle'
              )}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {resumeId ? `Resume ID: ${resumeId}` : 'Resume ID will appear here after upload or entry.'}
            </p>
          </div>
        </div>

        {resumeData && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-800">Resume Score</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {resumeData.resumeScore ?? 'N/A'}
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-800">Experience</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {resumeData.experienceYears ?? 'N/A'}
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-800">Skills Found</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{skills.length}</p>
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <FaChartLine className="text-teal-600" />
                <p className="text-sm font-semibold text-gray-800">Extracted Skills</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-sm border border-teal-100"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No skills were extracted yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 lg:col-span-1">
              <p className="text-sm font-semibold text-gray-800">Summary</p>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                {resumeData.summary || 'No summary is available for this resume yet.'}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CandidateResumePanel;
