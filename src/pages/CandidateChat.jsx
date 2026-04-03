import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaComments, FaPaperPlane, FaSpinner } from 'react-icons/fa';
import { clearSession, getStoredToken } from '../utils/auth';
import { getChatHistory, initializeChat, mapChatMessageFromApi, sendChatMessage } from '../utils/chat';

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

const CandidateChat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const initialChatRoomId = location.state?.chatRoomId ?? null;
  const targetId = location.state?.targetId ?? location.state?.jobId ?? location.state?.applicationId ?? null;
  const fallbackTargetId =
    location.state?.fallbackTargetId ??
    location.state?.applicationId ??
    location.state?.jobId ??
    null;
  const currentRole = localStorage.getItem('userRole') || '';
  const backPath =
    location.state?.backPath ??
    (currentRole.toUpperCase() === 'RECRUITER' ? '/recruiter-dashboard' : '/candidate-dashboard');
  const userEmail = localStorage.getItem('userEmail') || '';

  const [chatRoomId, setChatRoomId] = useState(initialChatRoomId);
  const [applicationId, setApplicationId] = useState(location.state?.applicationId ?? null);
  const [jobTitle, setJobTitle] = useState(location.state?.jobTitle ?? 'Recruiter Chat');
  const [company, setCompany] = useState(location.state?.company ?? 'SmartHire');
  const [candidateName, setCandidateName] = useState(
    location.state?.candidateName ?? localStorage.getItem('userName') ?? 'Candidate'
  );
  const [recruiterName, setRecruiterName] = useState('Recruiter');
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
    if (!value) {
      return 'Just now';
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return parsedDate.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const loadMessages = async (roomId) => {
    const response = await withAuth((token) => getChatHistory(token, roomId));

    if (!response) {
      return;
    }

    const data = await parseResponseBody(response);

    if (!response.ok) {
      throw new Error(data.message || 'Unable to load chat history.');
    }

    const messageList = Array.isArray(data) ? data : data.messages ?? [];
    setMessages(messageList.map((item) => mapChatMessageFromApi(item, userEmail, currentRole)));
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

          if (!response) {
            return;
          }

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

        if (!initialized) {
          throw new Error(lastErrorMessage);
        }
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
      senderRole: 'CANDIDATE',
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

      if (!response.ok) {
        throw new Error(data.message || 'Unable to send message.');
      }

      const savedMessage = data.message ?? data.data ?? data;
        setMessages((currentMessages) => [
        ...currentMessages.filter((item) => item.id !== optimisticMessage.id),
        mapChatMessageFromApi(savedMessage, userEmail, currentRole),
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
          >
            <FaArrowLeft />
            Back to Dashboard
          </button>
          <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-2 text-sm text-slate-500 shadow-sm">
            Application ID: <span className="font-semibold text-slate-700">{applicationId ?? 'N/A'}</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-2xl">
          <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-green-500 px-8 py-7 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/15 p-3">
                <FaComments className="text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{jobTitle}</h1>
                <p className="mt-1 text-sm text-emerald-50">
                  {currentRole.toUpperCase() === 'RECRUITER'
                    ? `Chat with ${candidateName} about ${jobTitle}`
                    : `Direct recruiter conversation with ${recruiterName} at ${company}`}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="rounded-[28px] border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-4 shadow-inner">
              <div className="h-[420px] overflow-y-auto pr-2">
                {loading ? (
                  <div className="flex h-full items-center justify-center gap-3 text-slate-500">
                    <FaSpinner className="animate-spin text-emerald-600" />
                    Loading chat...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center text-slate-500">
                    No messages yet. Start the conversation with the recruiter.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-2xl rounded-[26px] px-4 py-3 shadow-sm ${
                            message.isOwnMessage
                              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white'
                              : 'border border-slate-100 bg-white text-slate-800'
                          }`}
                        >
                          <p className="text-sm leading-6">{message.content}</p>
                          <div
                            className={`mt-2 text-[11px] ${
                              message.isOwnMessage ? 'text-emerald-50' : 'text-slate-400'
                            }`}
                          >
                            {message.senderName} • {formatChatTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="flex flex-col gap-3 md:flex-row">
                  <textarea
                    rows={4}
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                    placeholder="Write your message here..."
                    className="flex-1 rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || loading || !messageInput.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-[24px] bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-4 font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                    Send
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 text-sm text-slate-500">
              Chat Room ID: <span className="font-semibold text-slate-700">{chatRoomId ?? 'Connecting...'}</span>
              {' '}| Application ID: <span className="font-semibold text-slate-700">{applicationId ?? 'Resolving...'}</span>
              {' '}| Candidate: <span className="font-semibold text-slate-700">{candidateName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateChat;
