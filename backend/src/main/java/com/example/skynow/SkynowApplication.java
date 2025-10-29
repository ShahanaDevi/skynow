package com.example.skynow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SkynowApplication {
	public static void main(String[] args) {
		SpringApplication.run(SkynowApplication.class, args);
	}
}
