package com.example.skynow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class SkynowApplication {

	public static void main(String[] args) {
		SpringApplication.run(SkynowApplication.class, args);
	}

}

@RestController
class HelloController {
	@GetMapping("/")
	public String home() {
		return "Hello from Skynow Backend 🚀";
	}
}