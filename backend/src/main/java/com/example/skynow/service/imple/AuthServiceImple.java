package com.example.skynow.service.imple;

import com.example.skynow.model.Admin;
import com.example.skynow.model.User;
import com.example.skynow.repository.AdminRepository;
import com.example.skynow.repository.UserRepository;
import com.example.skynow.security.JwtUtil;
import com.example.skynow.service.AuthService;
import com.example.skynow.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AuthServiceImple implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private JwtUtil jwtUtil;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // ------------------ USER METHODS ------------------

    @Override
    public User registerUser(User user) throws Exception {
        if (userRepository.findByUsername(user.getUsername()) != null) {
            throw new Exception("Username already exists");
        }
        if (userRepository.findByEmail(user.getEmail()) != null) {
            throw new Exception("Email already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @Override
    public String loginUser(String loginId, String password) throws Exception {
        User user = userRepository.findByUsername(loginId);
        if (user == null) user = userRepository.findByEmail(loginId);
        if (user == null) throw new Exception("User not found");

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new Exception("Invalid password");
        }

        return jwtUtil.generateToken(user.getUsername(), "USER");
    }

    @Override
    public String forgotPasswordUser(String loginId) throws Exception {
        User user = userRepository.findByUsername(loginId);
        if (user == null) user = userRepository.findByEmail(loginId);
        if (user == null) throw new Exception("User not found");

        String otp = UUID.randomUUID().toString().substring(0, 8);
        user.setPassword(passwordEncoder.encode(otp));
        userRepository.save(user);

        emailService.sendMail(
                user.getEmail(),
                "Your One-Time Password (OTP)",
                "Hello " + user.getUsername() + ",\n\nYour OTP: " + otp
        );

        return "OTP sent to email: " + user.getEmail();
    }

    @Override
    public String changePasswordUser(String loginId, String oldPassword, String newPassword) throws Exception {
        User user = userRepository.findByUsername(loginId);
        if (user == null) user = userRepository.findByEmail(loginId);
        if (user == null) throw new Exception("User not found");

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new Exception("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return "Password updated successfully!";
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // ------------------ ADMIN METHODS ------------------

    @Override
    public Admin registerAdmin(Admin admin) throws Exception {
        if (adminRepository.findByUsername(admin.getUsername()).isPresent()) {
            throw new Exception("Username already exists");
        }
        admin.setPassword(passwordEncoder.encode(admin.getPassword()));
        return adminRepository.save(admin);
    }

    @Override
    public String loginAdmin(String username, String password) throws Exception {
        Optional<Admin> adminOpt = adminRepository.findByUsername(username);
        if (adminOpt.isEmpty()) throw new Exception("Admin not found");

        Admin admin = adminOpt.get();
        if (!passwordEncoder.matches(password, admin.getPassword())) {
            throw new Exception("Invalid password");
        }

        return jwtUtil.generateToken(admin.getUsername(), "ADMIN");
    }
}
