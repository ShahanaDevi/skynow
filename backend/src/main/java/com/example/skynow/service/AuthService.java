package com.example.skynow.service;

import com.example.skynow.model.Admin;
import com.example.skynow.model.User;

import java.util.List;

public interface AuthService {

    // ------------------ USER METHODS ------------------
    User registerUser(User user) throws Exception;

    String loginUser(String loginId, String password) throws Exception;

    String forgotPasswordUser(String loginId) throws Exception;

    String changePasswordUser(String loginId, String oldPassword, String newPassword) throws Exception;

    List<User> getAllUsers();

    // ------------------ ADMIN METHODS ------------------
    Admin registerAdmin(Admin admin) throws Exception;

    String loginAdmin(String username, String password) throws Exception;
}
