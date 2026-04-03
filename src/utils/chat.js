import { apiRequest } from './api';

export const mapChatMessageFromApi = (message, currentUserEmail) => {
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
  const isOwnMessage =
    typeof message.isOwnMessage === 'boolean'
      ? message.isOwnMessage
      : Boolean(
          message.sentByCurrentUser ??
            message.sentByCandidate ??
            message.mine ??
            (currentUserEmail &&
              senderEmail &&
              currentUserEmail.toLowerCase() === senderEmail.toLowerCase()) ??
            senderRole.toUpperCase() === 'CANDIDATE'
        );

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

export const initializeChat = (token, applicationId) =>
  apiRequest(`/api/chat/init/${applicationId}`, {
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
