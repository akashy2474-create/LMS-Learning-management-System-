package com.lms.dao;

import com.lms.model.Message;
import com.lms.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class MessageDAO {

    public boolean createMessage(Message message) throws SQLException {
        String sql = "INSERT INTO messages (sender_id, receiver_id, course_id, message, is_read) VALUES (?, ?, ?, ?, FALSE)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            stmt.setInt(1, message.getSenderId());
            stmt.setInt(2, message.getReceiverId());
            stmt.setInt(3, message.getCourseId());
            stmt.setString(4, message.getMessage());

            int affectedRows = stmt.executeUpdate();
            if (affectedRows > 0) {
                try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        message.setId(generatedKeys.getInt(1));
                    }
                }
                return true;
            }
            return false;
        }
    }

    public List<Message> getMessagesForUser(int userId) throws SQLException {
        List<Message> messages = new ArrayList<>();
        String sql = "SELECT m.*, s.name as sender_name, r.name as receiver_name, c.title as course_title " +
                     "FROM messages m " +
                     "JOIN users s ON m.sender_id = s.id " +
                     "JOIN users r ON m.receiver_id = r.id " +
                     "JOIN courses c ON m.course_id = c.id " +
                     "WHERE m.receiver_id = ? OR m.sender_id = ? " +
                     "ORDER BY m.created_at DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, userId);
            stmt.setInt(2, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Message msg = new Message();
                    msg.setId(rs.getInt("id"));
                    msg.setSenderId(rs.getInt("sender_id"));
                    msg.setSenderName(rs.getString("sender_name"));
                    msg.setReceiverId(rs.getInt("receiver_id"));
                    msg.setReceiverName(rs.getString("receiver_name"));
                    msg.setCourseId(rs.getInt("course_id"));
                    msg.setCourseTitle(rs.getString("course_title"));
                    msg.setMessage(rs.getString("message"));
                    msg.setRead(rs.getBoolean("is_read"));
                    msg.setCreatedAt(rs.getTimestamp("created_at"));
                    messages.add(msg);
                }
            }
        }
        return messages;
    }

    public boolean markMessageRead(int messageId, int userId) throws SQLException {
        String sql = "UPDATE messages SET is_read = TRUE WHERE id = ? AND receiver_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, messageId);
            stmt.setInt(2, userId);
            return stmt.executeUpdate() > 0;
        }
    }

    public boolean markAllMessagesRead(int userId) throws SQLException {
        String sql = "UPDATE messages SET is_read = TRUE WHERE receiver_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, userId);
            return stmt.executeUpdate() >= 0;
        }
    }
}
