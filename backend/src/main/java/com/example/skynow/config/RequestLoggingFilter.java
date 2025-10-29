package com.example.skynow.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Temporary filter to log request headers and raw body for /api/auth/* endpoints.
 * Useful to debug malformed JSON received by the backend.
 * Remove or disable in production.
 */
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger requestLogger = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        // Only log auth endpoints for now
        return path == null || !path.startsWith("/api/auth");
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        try {
            filterChain.doFilter(wrappedRequest, response);
        } finally {
            byte[] buf = wrappedRequest.getContentAsByteArray();
            if (buf != null && buf.length > 0) {
                String payload = new String(buf, StandardCharsets.UTF_8);
        requestLogger.info("[RequestLoggingFilter] {} {} headers={} payload={}",
            request.getMethod(), request.getRequestURI(), getHeaders(request), payload);
            } else {
        requestLogger.info("[RequestLoggingFilter] {} {} headers={} (no payload)",
            request.getMethod(), request.getRequestURI(), getHeaders(request));
            }
        }
    }

    private String getHeaders(HttpServletRequest request) {
        StringBuilder sb = new StringBuilder();
        var names = request.getHeaderNames();
        if (names != null) {
            while (names.hasMoreElements()) {
                String name = names.nextElement();
                sb.append(name).append("=").append(request.getHeader(name)).append("; ");
            }
        }
        return sb.toString();
    }
}
