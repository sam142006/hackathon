import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaChartLine,
  FaCodeBranch,
  FaExternalLinkAlt,
  FaLayerGroup,
  FaMapSigns,
  FaSpinner,
  FaTimes,
  FaTools,
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

const formatDateTime = (value) => {
  if (!value) return 'Not available';
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

const getRoadmapSteps = (roadmap) =>
  String(roadmap || '')
    .split('\n')
    .map((step) => step.trim())
    .filter(Boolean)
    .slice(0, 6);

const getDisplayLinks = (skillGapData) => {
  const resourceLinks = skillGapData.learningResources
    .filter((resource) => resource.url)
    .map((resource, index) => ({
      id: resource.id ?? `resource-${index}`,
      title: resource.title,
      subtitle: resource.platform || resource.type || 'Learning resource',
      url: resource.url,
      isYoutube: /youtu\.be|youtube\.com/i.test(resource.url),
    }));

  const fallbackLinks = skillGapData.allLinks.slice(0, 6).map((link, index) => ({
    id: link.id ?? `link-${index}`,
    title: link.isYoutube ? `YouTube Resource ${index + 1}` : `External Resource ${index + 1}`,
    subtitle: link.path,
    url: link.url,
    isYoutube: link.isYoutube,
  }));

  const combined = [...resourceLinks, ...fallbackLinks];
  const seenUrls = new Set();

  return combined.filter((item) => {
    if (!item.url || seenUrls.has(item.url)) return false;
    seenUrls.add(item.url);
    return true;
  });
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
  const roadmapSteps = getRoadmapSteps(skillGapData?.roadmap);
  const displayLinks = skillGapData ? getDisplayLinks(skillGapData) : [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_26%),linear-gradient(180deg,_#f7fbfa_0%,_#eef6f4_44%,_#f8fafc_100%)]">
      <nav className="sticky top-0 z-50 border-b border-white/60 bg-white/75 backdrop-blur-xl">
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
            <section className="relative overflow-hidden rounded-[36px] border border-emerald-200/60 bg-[linear-gradient(135deg,_rgba(5,150,105,0.96)_0%,_rgba(13,148,136,0.94)_45%,_rgba(8,145,178,0.92)_100%)] px-7 py-8 text-white shadow-[0_28px_80px_-32px_rgba(15,118,110,0.7)]">
              <div className="absolute inset-y-0 right-0 hidden w-[38%] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.18),_transparent_62%)] lg:block" />
              <div className="relative grid gap-8 xl:grid-cols-[1.4fr_0.8fr]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100/90">
                    Skill Gap Summary
                  </p>
                  <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
                    Smart roadmap for {skillGapData.jobTitle}
                  </h1>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-50/95">
                    {userName}, backend response ko simplify karke sirf most useful roadmap points,
                    missing skills, aur recommended learning links yahan dikhaye gaye hain.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/95">
                      {skillGapData.missingSkills.length} key skill gaps
                    </div>
                    <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/95">
                      {displayLinks.length} curated links
                    </div>
                    <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/95">
                      Updated {formatDateTime(skillGapData.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {[
                    {
                      label: 'Analysis ID',
                      value: skillGapData.analysisId || 'Not provided',
                      icon: FaChartLine,
                    },
                    {
                      label: 'Job ID',
                      value: skillGapData.jobId || 'Not provided',
                      icon: FaCodeBranch,
                    },
                    {
                      label: 'Resources',
                      value: skillGapData.learningResources.length,
                      icon: FaLayerGroup,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[28px] border border-white/15 bg-white/10 p-4 backdrop-blur"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="rounded-2xl bg-white/14 p-3 text-white">
                          <item.icon className="text-lg" />
                        </div>
                        <span className="max-w-[70%] break-words text-right text-lg font-semibold text-white">
                          {item.value}
                        </span>
                      </div>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/85">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'Missing Skills',
                  value: skillGapData.missingSkills.length || 0,
                  note: 'Most important capability gaps for this role',
                },
                {
                  label: 'Action Steps',
                  value: roadmapSteps.length || 0,
                  note: 'Useful roadmap items selected from backend output',
                },
                {
                  label: 'Learning Resources',
                  value: skillGapData.learningResources.length || 0,
                  note: 'Structured resources returned by the API',
                },
                {
                  label: 'Generated At',
                  value: formatDateTime(skillGapData.createdAt),
                  note: 'Latest stored roadmap generation time',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] backdrop-blur"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {item.label}
                  </div>
                  <div className="mt-3 break-words text-2xl font-semibold text-slate-900">{item.value}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.note}</p>
                </div>
              ))}
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <FaMapSigns className="text-xl" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Roadmap Overview
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">Recommended next steps</h2>
                  </div>
                </div>

                {roadmapSteps.length > 0 ? (
                  <div className="mt-8 space-y-4">
                    {roadmapSteps.map((step, index) => (
                      <div
                        key={`${step}-${index}`}
                        className="rounded-[28px] border border-emerald-100 bg-[linear-gradient(180deg,_#ffffff_0%,_#f4fbf8_100%)] p-5"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-semibold text-white">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/70">
                              Step {index + 1}
                            </p>
                            <p className="mt-2 text-sm leading-7 text-slate-700">{step}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-sm leading-7 text-slate-600">
                    Detailed roadmap text available nahi tha, lekin important skill gaps aur learning resources niche curated form me diye gaye hain.
                  </p>
                )}
              </div>

              <div className="space-y-6">
                <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                      <FaTools className="text-xl" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Missing Skills
                      </p>
                      <h2 className="mt-1 text-2xl font-semibold text-slate-900">Focus areas</h2>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {skillGapData.missingSkills.length > 0 ? (
                      skillGapData.missingSkills.map((skill, index) => (
                        <span
                          key={skill}
                          className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700"
                        >
                          {index + 1}. {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No missing skills were returned.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-red-100 p-3 text-red-600">
                  <FaYoutube className="text-xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Learning Resources
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                    Curated learning links
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {displayLinks.length > 0 ? (
                  displayLinks.map((link, index) => (
                    <a
                      key={`${link.id}-${index}`}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] px-5 py-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Link {index + 1}</p>
                          <p className="mt-1 text-sm font-medium text-slate-700">{link.title}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                            {link.subtitle}
                          </p>
                        </div>
                        <FaExternalLinkAlt className="shrink-0 text-slate-400 transition group-hover:text-emerald-600" />
                      </div>
                      <p className="mt-3 break-all text-sm text-emerald-700">{link.url}</p>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No useful learning links were found in the backend response.</p>
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default SkillGapRoadmapPage;
