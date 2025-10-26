# ---------- Stage 1: Build the Spring Boot app ----------
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy Maven project files
COPY pom.xml .
COPY src ./src

# Build the jar file (skip tests for faster build)
RUN mvn clean package -DskipTests

# ---------- Stage 2: Run the built jar ----------
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose backend port
EXPOSE 8080

# Start the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
