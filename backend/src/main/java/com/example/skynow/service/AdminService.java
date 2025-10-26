package com.example.skynow.service;

import com.example.skynow.model.Admin;
import com.example.skynow.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AdminService {

    @Autowired
    private AdminRepository adminRepository;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Register new admin
    public Admin register(Admin admin) throws Exception {
        if (adminRepository.findByUsername(admin.getUsername()).isPresent()) {
            throw new Exception("Username already exists. Please choose another.");
        }

        admin.setPassword(passwordEncoder.encode(admin.getPassword())); // hash password
        return adminRepository.save(admin);
    }

    // Validate login
    public boolean login(String username, String password) {
        Optional<Admin> adminOpt = adminRepository.findByUsername(username);

        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            return passwordEncoder.matches(password, admin.getPassword());
        }
        return false;
    }

    // Get admin by username
    public Optional<Admin> getByUsername(String username) {
        return adminRepository.findByUsername(username);
    }
}