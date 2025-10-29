# SkyNow Weather Application

SkyNow is a weather application that allows users to check the current weather conditions for any city or their current location.

## Architecture

The application consists of two main components:

1. **Frontend**: A React application that provides the user interface
2. **Backend**: A Spring Boot application that serves as the API for weather data

## Integration

The frontend and backend are integrated as follows:

- The frontend makes API calls to the backend to fetch weather data
- The backend exposes REST endpoints for getting weather data by city name or coordinates
- CORS is configured to allow requests from the frontend to the backend
- In development mode, the frontend uses a proxy configuration to forward API requests to the backend
- In production mode, Nginx is used to serve the frontend static files and proxy API requests to the backend

## Running the Application

### Development Mode

1. Start the backend:
   ```
   cd backend
   ./mvnw spring-boot:run
   ```

2. Start the frontend:
   ```
   cd frontend
   npm install
   npm start
   ```

3. Open your browser and navigate to http://localhost:3000

### Production Mode (Docker)

1. Build and run the application using Docker Compose:
   ```
   docker-compose up --build
   ```

2. Open your browser and navigate to http://localhost:3000

## API Endpoints

The backend exposes the following API endpoints:

- `GET /api/weather/current/city/{city}`: Get current weather data for a specific city
- `GET /api/weather/current/coords?latitude={lat}&longitude={lon}`: Get current weather data for specific coordinates

## Technologies Used

- **Frontend**: React, JavaScript, HTML, CSS
- **Backend**: Spring Boot, Java
- **Containerization**: Docker, Docker Compose
- **Web Server**: Nginx (for production)