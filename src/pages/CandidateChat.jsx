import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaComments, FaPaperPlane, FaSpinner, FaUserTie } from 'react-icons/fa';
import { clearSession, getStoredToken } from '../utils/auth';
import { getChatHistory, initializeChat, mapChatMessageFromApi, sendChatMessage } from '../utils/chat';

const parseResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const CandidateChat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const initialChatRoomId = location.state?.chatRoomId ?? null;
  const targetId = location.state?.targetId ?? location.state?.jobId ?? location.state?.applicationId ?? null;
  const fallbackTargetId =
    location.state?.fallbackTargetId ?? location.state?.applicationId ?? location.state?.jobId ?? null;
  const currentRole = localStorage.getItem('userRole') || '';
  const backPath =
    location.state?.backPath ??
    (currentRole.toUpperCase() === 'RECRUITER' ? '/recruiter-dashboard' : '/candidate-dashboard');
  const userEmail = localStorage.getItem('userEmail') || '';
  const currentUserName = localStorage.getItem('userName') || '';

  const [chatRoomId, setChatRoomId] = useState(initialChatRoomId);
  const [applicationId, setApplicationId] = useState(location.state?.applicationId ?? null);
  const [jobTitle, setJobTitle] = useState(location.state?.jobTitle ?? 'Recruiter Chat');
  const [company, setCompany] = useState(location.state?.company ?? 'SmartHire');
  const [candidateName, setCandidateName] = useState(
    location.state?.candidateName ?? localStorage.getItem('userName') ?? 'Candidate'
  );
  const [recruiterName, setRecruiterName] = useState(location.state?.recruiterName ?? 'Recruiter');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

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

  const formatChatTime = (value) => {
    if (!value) return 'Just now';
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;
    return parsedDate.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const loadMessages = async (roomId) => {
    const response = await withAuth((token) => getChatHistory(token, roomId));
    if (!response) return;
    const data = await parseResponseBody(response);
    if (!response.ok) throw new Error(data.message || 'Unable to load chat history.');
    const messageList = Array.isArray(data) ? data : data.messages ?? [];
    setMessages(
      messageList.map((item) =>
        mapChatMessageFromApi(item, userEmail, currentRole, currentUserName)
      )
    );
  };

  useEffect(() => {
    const bootstrapChat = async () => {
      if (initialChatRoomId) {
        setLoading(true);
        setError('');
        try {
          await loadMessages(initialChatRoomId);
        } catch (chatError) {
          setError(chatError.message || 'Unable to load chat history.');
          setMessages([]);
        } finally {
          setLoading(false);
        }
        return;
      }

      if (!targetId) {
        setLoading(false);
        setError('Job context is missing for this chat. Open chat from a job card.');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const candidateTargets = [targetId, fallbackTargetId].filter(Boolean);
        const uniqueTargets = [...new Set(candidateTargets)];
        let initialized = false;
        let lastErrorMessage = 'Unable to start chat.';

        for (const currentTarget of uniqueTargets) {
          const response = await withAuth((token) => initializeChat(token, currentTarget));
          if (!response) return;
          const data = await parseResponseBody(response);
          if (!response.ok) {
            lastErrorMessage = data.message || lastErrorMessage;
            continue;
          }

          const roomId = data.chatRoomId ?? data.chatId ?? data.id ?? null;
          if (!roomId) {
            lastErrorMessage = 'Chat room ID was not returned by the server.';
            continue;
          }

          setApplicationId(data.applicationId ?? location.state?.applicationId ?? null);
          setChatRoomId(roomId);
          setJobTitle(data.jobTitle ?? location.state?.jobTitle ?? 'Recruiter Chat');
          setCompany(data.company ?? location.state?.company ?? 'SmartHire');
          setCandidateName(
            data.candidateName ??
              location.state?.candidateName ??
              localStorage.getItem('userName') ??
              'Candidate'
          );
          setRecruiterName(data.recruiterName ?? location.state?.recruiterName ?? 'Recruiter');
          await loadMessages(roomId);
          initialized = true;
          break;
        }

        if (!initialized) throw new Error(lastErrorMessage);
      } catch (chatError) {
        setError(chatError.message || 'Unable to start chat.');
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    bootstrapChat();
  }, [initialChatRoomId, targetId, fallbackTargetId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!applicationId || !messageInput.trim()) {
      if (!applicationId) {
        setError('Application ID is still not available for sending messages.');
      }
      return;
    }

    const content = messageInput.trim();
    const optimisticMessage = {
      id: `local-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      senderName: 'You',
      senderRole: currentRole || 'CANDIDATE',
      isOwnMessage: true,
    };

    setSending(true);
    setError('');
    setMessages((currentMessages) => [...currentMessages, optimisticMessage]);
    setMessageInput('');

    try {
      const response = await withAuth((token) => sendChatMessage(token, applicationId, content));
      if (!response) {
        setMessages((currentMessages) =>
          currentMessages.filter((item) => item.id !== optimisticMessage.id)
        );
        return;
      }
      const data = await parseResponseBody(response);
      if (!response.ok) throw new Error(data.message || 'Unable to send message.');
      const savedMessage = data.message ?? data.data ?? data;
      setMessages((currentMessages) => [
        ...currentMessages.filter((item) => item.id !== optimisticMessage.id),
        mapChatMessageFromApi(savedMessage, userEmail, currentRole, currentUserName),
      ]);
    } catch (sendError) {
      setMessages((currentMessages) =>
        currentMessages.filter((item) => item.id !== optimisticMessage.id)
      );
      setError(sendError.message || 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#eef3f8]">
      <div className="mx-auto flex h-full max-w-6xl flex-col px-4 py-3 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
          >
            <FaArrowLeft />
            Back to Dashboard
          </button>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
            Application ID: <span className="font-semibold text-slate-700">{applicationId ?? 'N/A'}</span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl">
          <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-emerald-200 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-500 px-6 py-4 text-white">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/15 p-2">
                  <FaComments className="text-lg" />
                </div>
                <div>
                  <h1 className="text-[32px] font-bold leading-none md:text-[30px]">{jobTitle}</h1>
                  <p className="mt-1 text-sm text-emerald-50">
                    {currentRole.toUpperCase() === 'RECRUITER'
                      ? `Direct conversation with ${candidateName}`
                      : `Direct recruiter conversation with ${recruiterName} at ${company}`}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/80">Participant</p>
                  <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-white">
                    <FaUserTie className="text-emerald-300" />
                    {currentRole.toUpperCase() === 'RECRUITER' ? candidateName : recruiterName}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/80">Workspace</p>
                  <p className="mt-1.5 text-sm font-semibold text-white">{company}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col p-4 md:p-5">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-slate-200 bg-slate-50 p-3 shadow-inner">
              <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                {loading ? (
                  <div className="flex h-full items-center justify-center gap-3 text-slate-500">
                    <FaSpinner className="animate-spin text-emerald-600" />
                    Loading chat...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center text-slate-500">
                    No messages yet. Start the conversation from the message box below.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-2xl px-4 py-2 shadow-sm ${
                            message.isOwnMessage
                              ? 'rounded-[26px] rounded-br-md bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                              : 'rounded-[26px] rounded-bl-md border border-slate-200 bg-white text-slate-800'
                          }`}
                        >
                          <p
                            className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                              message.isOwnMessage ? 'text-slate-300' : 'text-slate-400'
                            }`}
                          >
                            {message.senderName}
                          </p>
                          <p className="mt-1 text-sm leading-5">{message.content}</p>
                          <div
                            className={`mt-2 text-[11px] ${
                              message.isOwnMessage ? 'text-slate-300' : 'text-slate-400'
                            }`}
                          >
                            {formatChatTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="mt-3 border-t border-slate-200 pt-3">
                <div className="flex flex-col gap-3 md:flex-row">
                  <textarea
                    rows={1}
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                    placeholder="Write a clear professional message..."
                    className="flex-1 resize-none rounded-[20px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || loading || !messageInput.trim()}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                    Send
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 text-sm text-slate-500 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
                Chat Room ID: <span className="font-semibold text-slate-700">{chatRoomId ?? 'Connecting...'}</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
                Application ID: <span className="font-semibold text-slate-700">{applicationId ?? 'Resolving...'}</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
                Candidate: <span className="font-semibold text-slate-700">{candidateName}</span>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateChat;
