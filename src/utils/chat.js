import { apiRequest } from './api';

export const mapChatMessageFromApi = (
  message,
  currentUserEmail,
  currentUserRole = '',
  currentUserName = ''
) => {
  const senderEmail =
    message.senderEmail ??
    message.fromEmail ??
    message.userEmail ??
    message.sender?.email ??
    '';
  const senderRole =
    message.senderRole ??
    message.role ??
    message.sender?.role ??
    '';
  const normalizedRole = senderRole.toUpperCase();
  const normalizedCurrentUserRole = currentUserRole.toUpperCase();
  const senderName =
    message.senderName ??
    message.name ??
    message.sender?.name ??
    '';
  const normalizedCurrentUserName = currentUserName.trim().toLowerCase();
  const normalizedSenderName = senderName.trim().toLowerCase();
  const emailMatchesCurrentUser =
    currentUserEmail && senderEmail
      ? currentUserEmail.toLowerCase() === senderEmail.toLowerCase()
      : null;
  const explicitOwnership =
    typeof message.isOwnMessage === 'boolean'
      ? message.isOwnMessage
      : typeof message.sentByCurrentUser === 'boolean'
        ? message.sentByCurrentUser
        : typeof message.mine === 'boolean'
          ? message.mine
          : null;
  const roleMatchesCurrentUser =
    normalizedCurrentUserRole && normalizedRole
      ? normalizedCurrentUserRole === normalizedRole
      : null;
  const nameMatchesCurrentUser =
    normalizedCurrentUserName && normalizedSenderName
      ? normalizedCurrentUserName === normalizedSenderName
      : null;
  const isOwnMessage =
    explicitOwnership ??
    emailMatchesCurrentUser ??
    roleMatchesCurrentUser ??
    nameMatchesCurrentUser ??
    false;

  return {
    id: message.id ?? message.messageId ?? crypto.randomUUID(),
    content: message.content ?? message.message ?? '',
    createdAt: message.createdAt ?? message.timestamp ?? message.sentAt ?? '',
    senderName:
      senderName ??
      (isOwnMessage ? 'You' : 'Recruiter'),
    senderRole,
    isOwnMessage,
  };
};

export const initializeChat = (token, targetId) =>
  apiRequest(`/api/chat/init/${targetId}`, {
    method: 'POST',
    token,
  });

export const getChatHistory = (token, chatRoomId) =>
  apiRequest(`/api/chat/${chatRoomId}/messages`, {
    method: 'GET',
    token,
  });

export const sendChatMessage = (token, applicationId, content) =>
  apiRequest(`/api/chats/application/${applicationId}/messages`, {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });
