import { apiRequest } from './api';

export const mapChatMessageFromApi = (message, currentUserEmail, currentUserRole = '') => {
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
  const emailMatchesCurrentUser =
    Boolean(
      currentUserEmail &&
        senderEmail &&
        currentUserEmail.toLowerCase() === senderEmail.toLowerCase()
    );
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
  const isOwnMessage =
    explicitOwnership ??
    emailMatchesCurrentUser ??
    roleMatchesCurrentUser ??
    false;

  return {
    id: message.id ?? message.messageId ?? crypto.randomUUID(),
    content: message.content ?? message.message ?? '',
    createdAt: message.createdAt ?? message.timestamp ?? message.sentAt ?? '',
    senderName:
      message.senderName ??
      message.name ??
      message.sender?.name ??
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
