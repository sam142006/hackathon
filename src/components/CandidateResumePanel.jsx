import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaFileAlt, FaSpinner, FaUpload } from 'react-icons/fa';
import { clearSession, getStoredToken } from '../utils/auth';
import {
  checkResumeExists,
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

const formatScore = (score) => {
  if (score === null || score === undefined || score === '') {
    return 'N/A';
  }

  return Number.isFinite(Number(score)) ? `${score}` : String(score);
};

const CandidateResumePanel = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [resumeMeta, setResumeMeta] = useState({
    uploaded: false,
    resumeId: null,
    fileName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resumeSkills = useMemo(
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

  const fetchResumeAnalysis = async () => {
    const response = await withAuth((token) => getResumeAnalysis(token));

    if (!response) {
      return null;
    }

    const data = await parseResponseBody(response);

    if (response.status === 400) {
      setResumeData(null);
      return null;
    }

    if (!response.ok) {
      throw new Error(data.message || 'Unable to fetch resume analysis.');
    }

    setResumeData(data);
    return data;
  };

  const loadResumeState = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await withAuth((token) => checkResumeExists(token));

      if (!response) {
        return;
      }

      const data = await parseResponseBody(response);

      if (response.status === 400) {
        setResumeMeta({
          uploaded: false,
          resumeId: null,
          fileName: '',
        });
        setResumeData(null);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || 'Unable to check resume status.');
      }

      setResumeMeta({
        uploaded: Boolean(data.uploaded),
        resumeId: data.resumeId ?? null,
        fileName: data.fileName ?? '',
      });

      if (data.uploaded) {
        await fetchResumeAnalysis();
      } else {
        setResumeData(null);
      }
    } catch (loadError) {
      setError(loadError.message || 'Unable to load resume details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumeState();
  }, []);

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

  const resetSelectedFile = () => {
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadResume = async () => {
    if (!file) {
      setError('Choose a PDF file before uploading.');
      return;
    }

    setLoading(true);
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

      setResumeMeta((currentMeta) => ({
        uploaded: true,
        resumeId: data.resumeId ?? currentMeta.resumeId,
        fileName: file.name,
      }));
      setResumeData(data);
      resetSelectedFile();
    } catch (uploadError) {
      setError(uploadError.message || 'Resume upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReuploadClick = () => {
    setError('');
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Resume Insights</h3>
          <p className="text-sm text-gray-500 mt-1">
            Upload your latest PDF resume and review its analysis instantly.
          </p>
        </div>
        <button
          onClick={() => navigate('/mock-interview')}
          className="px-5 py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl hover:shadow-lg transition font-medium"
        >
          Start Mock Interview
        </button>
      </div>

      <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-green-50 p-5">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-2xl bg-white p-3 shadow-sm border border-teal-100">
                <FaFileAlt className="text-lg text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Resume Status</p>
                <p className="text-sm text-gray-500 mt-1">
                  {resumeMeta.uploaded
                    ? `Uploaded${resumeMeta.fileName ? `: ${resumeMeta.fileName}` : ''}`
                    : 'No resume uploaded yet'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-4 file:py-2 file:font-medium file:text-teal-700 hover:file:bg-teal-100"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleUploadResume}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                  {resumeMeta.uploaded ? 'Upload New Resume' : 'Upload Resume'}
                </button>
                {resumeMeta.uploaded && (
                  <button
                    onClick={handleReuploadClick}
                    disabled={loading}
                    className="px-4 py-2 border border-teal-200 text-teal-700 rounded-xl hover:bg-white transition disabled:opacity-50"
                  >
                    Re-upload Resume
                  </button>
                )}
              </div>
            </div>

            {file && (
              <p className="mt-3 text-sm text-gray-500">
                Selected file: <span className="font-medium text-gray-700">{file.name}</span>
              </p>
            )}

            {error && (
              <div className="mt-4 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="min-w-[180px] rounded-2xl bg-white border border-teal-100 shadow-sm px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">
              Resume Score
            </p>
            <p className="mt-2 text-4xl font-bold text-gray-900">
              {loading && !resumeData ? <FaSpinner className="animate-spin text-2xl" /> : formatScore(resumeData?.resumeScore)}
            </p>
            <p className="mt-2 text-sm text-gray-500">Analysis updates after every upload.</p>
          </div>
        </div>

        {resumeData && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 lg:col-span-1">
              <p className="text-sm font-semibold text-gray-800">Experience</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {resumeData.experienceYears ?? 'N/A'}
              </p>
              <p className="text-sm text-gray-500 mt-1">Years detected from the uploaded resume.</p>
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <FaChartLine className="text-teal-600" />
                <p className="text-sm font-semibold text-gray-800">Extracted Skills</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {resumeSkills.length > 0 ? (
                  resumeSkills.map((skill) => (
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

            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 lg:col-span-3">
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
