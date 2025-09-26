package com.example.login.service;

import com.example.login.model.Admin;
import com.example.login.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AdminService {

    @Autowired
    private AdminRepository adminRepository; // ✅ Correct instance

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // ✅ Save admin with hashed password
    public Admin saveAdmin(Admin admin) {
        admin.setPassword(passwordEncoder.encode(admin.getPassword())); // hash the password
        return adminRepository.save(admin);
    }

    // ✅ Login check
    public boolean login(String username, String password) {
        Optional<Admin> adminOpt = adminRepository.findByUsername(username); // ✅ fixed typo

        if (adminOpt.isPresent()) {
            return passwordEncoder.matches(password, adminOpt.get().getPassword());
        }
        return false;
    }
}
