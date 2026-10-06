package com.lms.service;

import com.lms.dao.MessageDAO;
import com.lms.model.Message;

import java.sql.SQLException;
import java.util.List;

public class MessageService {
    private final MessageDAO messageDAO = new MessageDAO();

    public Message sendMessage(int senderId, int receiverId, int courseId, String messageContent) throws Exception {
        if (messageContent == null || messageContent.trim().isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be empty.");
        }

        Message msg = new Message();
        msg.setSenderId(senderId);
        msg.setReceiverId(receiverId);
        msg.setCourseId(courseId);
        msg.setMessage(messageContent.trim());

        boolean sent = messageDAO.createMessage(msg);
        if (!sent) {
            throw new Exception("Failed to send message.");
        }
        return msg;
    }

    public List<Message> getUserMessages(int userId) throws SQLException {
        return messageDAO.getMessagesForUser(userId);
    }

    public boolean markRead(int messageId, int userId) throws SQLException {
        return messageDAO.markMessageRead(messageId, userId);
    }

    public boolean markAllRead(int userId) throws SQLException {
        return messageDAO.markAllMessagesRead(userId);
    }
}
