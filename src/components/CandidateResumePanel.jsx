import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaDownload, FaSpinner, FaTrash, FaUpload } from 'react-icons/fa';
import { apiRequest } from '../utils/api';
import { clearSession, getStoredToken } from '../utils/auth';

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

const CandidateResumePanel = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loadingAction, setLoadingAction] = useState('');

  const hasAnalysis = Boolean(analysis);
  const formattedAnalysis = useMemo(() => {
    if (!analysis) {
      return '';
    }

    return typeof analysis === 'string' ? analysis : JSON.stringify(analysis, null, 2);
  }, [analysis]);

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

  const resetFeedback = () => {
    setMessage('');
    setError('');
  };

  const handleFileChange = (event) => {
    resetFeedback();
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setSelectedFile(null);
      setError('Only PDF resumes are allowed.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadResume = async () => {
    if (!selectedFile) {
      setError('Choose a PDF file before uploading.');
      return;
    }

    resetFeedback();
    setLoadingAction('upload');

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const response = await withAuth((token) =>
        apiRequest('/api/resume/upload', {
          method: 'POST',
          token,
          body: formData,
        })
      );

      if (!response) {
        return;
      }

      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(data.message || 'Resume upload failed.');
      }

      setMessage(data.message || 'Resume uploaded successfully.');
      setSelectedFile(null);
    } catch (uploadError) {
      setError(uploadError.message || 'Resume upload failed.');
    } finally {
      setLoadingAction('');
    }
  };

  const handleDeleteResume = async () => {
    resetFeedback();
    setLoadingAction('delete');

    try {
      const response = await withAuth((token) =>
        apiRequest('/api/resume/delete', {
          method: 'DELETE',
          token,
        })
      );

      if (!response) {
        return;
      }

      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(data.message || 'Resume delete failed.');
      }

      setAnalysis(null);
      setMessage(data.message || 'Resume deleted successfully.');
    } catch (deleteError) {
      setError(deleteError.message || 'Resume delete failed.');
    } finally {
      setLoadingAction('');
    }
  };

  const handleDownloadResume = async () => {
    resetFeedback();
    setLoadingAction('download');

    try {
      const response = await withAuth((token) =>
        apiRequest('/api/resume/download', {
          method: 'GET',
          token,
        })
      );

      if (!response) {
        return;
      }

      if (!response.ok) {
        const data = await parseResponseBody(response);
        throw new Error(data.message || 'Resume download failed.');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = downloadUrl;
      anchor.download = 'resume.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setMessage('Resume download started.');
    } catch (downloadError) {
      setError(downloadError.message || 'Resume download failed.');
    } finally {
      setLoadingAction('');
    }
  };

  const handleGetAnalysis = async () => {
    resetFeedback();
    setLoadingAction('analysis');

    try {
      const response = await withAuth((token) =>
        apiRequest('/api/resume/analysis', {
          method: 'GET',
          token,
        })
      );

      if (!response) {
        return;
      }

      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(data.message || 'Resume analysis failed.');
      }

      setAnalysis(data);
      setMessage('Resume analysis loaded successfully.');
    } catch (analysisError) {
      setError(analysisError.message || 'Resume analysis failed.');
    } finally {
      setLoadingAction('');
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Resume Tools</h3>
          <p className="text-sm text-gray-500 mt-1">
            Upload, manage, download, and analyze your latest PDF resume.
          </p>
        </div>
        <button
          onClick={() => navigate('/mock-interview')}
          className="px-5 py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl hover:shadow-lg transition font-medium"
        >
          Start Mock Interview
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
        <input
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:font-medium file:text-teal-700 hover:file:bg-teal-100"
        />
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleUploadResume}
            disabled={loadingAction !== ''}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
          >
            {loadingAction === 'upload' ? <FaSpinner className="animate-spin" /> : <FaUpload />}
            Upload Resume
          </button>
          <button
            onClick={handleDeleteResume}
            disabled={loadingAction !== ''}
            className="px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loadingAction === 'delete' ? <FaSpinner className="animate-spin" /> : <FaTrash />}
            Delete
          </button>
          <button
            onClick={handleDownloadResume}
            disabled={loadingAction !== ''}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loadingAction === 'download' ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaDownload />
            )}
            Download
          </button>
          <button
            onClick={handleGetAnalysis}
            disabled={loadingAction !== ''}
            className="px-4 py-2 border border-teal-200 text-teal-700 rounded-xl hover:bg-teal-50 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loadingAction === 'analysis' ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaChartLine />
            )}
            Get Analysis
          </button>
        </div>
      </div>

      {selectedFile && (
        <p className="text-sm text-gray-500 mt-3">Selected file: {selectedFile.name}</p>
      )}

      {message && (
        <div className="mt-4 rounded-2xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {hasAnalysis && (
        <div className="mt-5 rounded-2xl bg-teal-50 border border-teal-100 p-4">
          <h4 className="text-base font-semibold text-gray-800 mb-2">Resume Analysis</h4>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words font-sans">
            {formattedAnalysis}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CandidateResumePanel;