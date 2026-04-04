import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaExternalLinkAlt,
  FaMapSigns,
  FaSpinner,
  FaTimes,
  FaYoutube,
} from 'react-icons/fa';
import BrandLogo from '../components/BrandLogo';
import { clearSession, getStoredToken } from '../utils/auth';
import { getSkillGapRoadmap, normalizeSkillGapData } from '../utils/jobs';

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

const renderValue = (value, depth = 0) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400">Not available</span>;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value);
    const urlMatch = text.match(/^https?:\/\/\S+$/);

    if (urlMatch) {
      return (
        <a
          href={text}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 break-all text-emerald-700 underline"
        >
          {text}
          <FaExternalLinkAlt className="text-xs" />
        </a>
      );
    }

    return <span className="whitespace-pre-wrap break-words text-slate-700">{text}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-400">No items</span>;

    return (
      <div className="space-y-3">
        {value.map((item, index) => (
          <div
            key={`${depth}-${index}`}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
          >
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Item {index + 1}
            </div>
            {renderValue(item, depth + 1)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Object.entries(value).map(([key, nestedValue]) => (
        <div key={`${depth}-${key}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{key}</div>
          <div className="mt-2">{renderValue(nestedValue, depth + 1)}</div>
        </div>
      ))}
    </div>
  );
};

const SkillGapRoadmapPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();
  const candidateId = localStorage.getItem('userId') || '';
  const userName = localStorage.getItem('userName') || 'Candidate';
  const initialPayload = location.state?.skillGapPayload ?? null;
  const initialJob = location.state?.job ?? {};

  const [loading, setLoading] = useState(!initialPayload);
  const [error, setError] = useState('');
  const [skillGapData, setSkillGapData] = useState(
    initialPayload ? normalizeSkillGapData(initialPayload, initialJob) : null
  );

  useEffect(() => {
    if (initialPayload) return;

    const loadSkillGap = async () => {
      const token = getStoredToken();
      if (!token) {
        clearSession();
        navigate('/', { replace: true });
        return;
      }

      if (!candidateId || !jobId) {
        setError('Candidate ID or job ID is missing for this roadmap.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await getSkillGapRoadmap(token, candidateId, jobId);
        const data = await parseResponseBody(response);

        if (response.status === 401 || response.status === 403) {
          clearSession();
          navigate('/', { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error(getResponseMessage(data) || 'Unable to load skill-gap roadmap.');
        }

        setSkillGapData(normalizeSkillGapData(data, { id: jobId }));
      } catch (loadError) {
        setError(loadError.message || 'Unable to load skill-gap roadmap.');
      } finally {
        setLoading(false);
      }
    };

    loadSkillGap();
  }, [candidateId, initialJob, initialPayload, jobId, navigate]);

  const closePage = () => navigate('/candidate-dashboard');

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Skill Gap Detail" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/candidate-dashboard')}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <FaArrowLeft />
              Back
            </button>
            <button
              onClick={closePage}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <FaTimes />
              Close Roadmap
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[32px] bg-gradient-to-r from-emerald-600 via-teal-600 to-green-500 px-7 py-8 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
            Full Backend View
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight">
            Skill Gap Roadmap for {skillGapData?.jobTitle ?? 'selected role'}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-50">
            {userName}, is page par backend response ka detailed view aa raha hai, including
            missing skills, roadmap notes, all extracted links, aur raw stored payload.
          </p>
        </section>

        {loading ? (
          <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <FaSpinner className="mx-auto mb-4 animate-spin text-3xl text-emerald-600" />
            <p className="text-slate-500">Loading complete skill gap roadmap...</p>
          </div>
        ) : error ? (
          <div className="mt-8 rounded-[32px] border border-red-100 bg-red-50 px-6 py-5 text-red-700 shadow-sm">
            {error}
          </div>
        ) : skillGapData ? (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Analysis ID', value: skillGapData.analysisId || 'Not provided' },
                { label: 'Job ID', value: skillGapData.jobId || 'Not provided' },
                { label: 'Missing Skills', value: skillGapData.missingSkills.length || 0 },
                { label: 'Links Found', value: skillGapData.allLinks.length || 0 },
              ].map((item) => (
                <div key={item.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {item.label}
                  </div>
                  <div className="mt-3 break-words text-2xl font-semibold text-slate-900">{item.value}</div>
                </div>
              ))}
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                    <FaMapSigns className="text-xl" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Roadmap
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">Plan from backend</h2>
                  </div>
                </div>
                <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {skillGapData.roadmap}
                </p>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Missing Skills
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {skillGapData.missingSkills.length > 0 ? (
                    skillGapData.missingSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No missing skills were returned.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                  <FaYoutube className="text-xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Links And Resources
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                    YouTube links and all extracted URLs
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {skillGapData.allLinks.length > 0 ? (
                  skillGapData.allLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 transition hover:border-emerald-200 hover:bg-emerald-50"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {link.isYoutube ? 'YouTube Resource' : 'External Resource'}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                            {link.path}
                          </p>
                        </div>
                        <FaExternalLinkAlt className="shrink-0 text-slate-400" />
                      </div>
                      <p className="mt-3 break-all text-sm text-emerald-700">{link.url}</p>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No URLs were found in the backend response.</p>
                )}
              </div>

              {skillGapData.learningResources.length > 0 && (
                <div className="mt-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Structured Learning Resources
                  </p>
                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {skillGapData.learningResources.map((resource) => (
                      <div
                        key={resource.id}
                        className="rounded-3xl border border-slate-200 bg-white px-5 py-4"
                      >
                        <p className="text-lg font-semibold text-slate-900">{resource.title}</p>
                        {resource.description ? (
                          <p className="mt-2 text-sm leading-6 text-slate-600">{resource.description}</p>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {resource.platform ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              {resource.platform}
                            </span>
                          ) : null}
                          {resource.type ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              {resource.type}
                            </span>
                          ) : null}
                        </div>
                        {resource.url ? (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 underline"
                          >
                            Open resource
                            <FaExternalLinkAlt className="text-xs" />
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Raw Backend Data
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Complete stored payload
              </h2>
              <div className="mt-6">{renderValue(skillGapData.rawData)}</div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default SkillGapRoadmapPage;
