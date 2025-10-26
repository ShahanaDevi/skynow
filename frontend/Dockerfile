## Step 1: Build the React app
#FROM node:18 AS build
#WORKDIR /app
#COPY package*.json ./
#RUN npm install
#COPY . .
#RUN npm run build
#
## Step 2: Serve with Nginx
#FROM nginx:alpine
#COPY --from=build /app/build /usr/share/nginx/html
#EXPOSE 80
#CMD ["nginx", "-g", "daemon off;"]
# Use Node 20 (React Router 7 requires Node >= 20)
# Use Node 20 for build
FROM node:20

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm config set registry https://registry.npmjs.org/ && npm install

# Copy app files
COPY . .

# Build the React app
RUN npm run build

# Install serve globally
RUN npm install -g serve

# Serve build on port 80
CMD ["serve", "-s", "build", "-l", "80"]

# Expose container port
EXPOSE 80

