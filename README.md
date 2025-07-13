# Node Drive

This project is a Node.js application designed to function as a personal cloud storage or simple drive clone. It allows users to upload, store, and manage files securely, with features like user authentication and file organization.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Docker Setup](#docker-setup)
- [Usage](#usage)
- [Dependencies](#dependencies)
- [License](#license)

## Features

- **File Upload and Storage**: Easily upload and store various file types.
- **User Authentication**: Secure user login and session management using Google OAuth2.0.
- **File Management**: View, download, and delete your uploaded files.
- **Directory Browsing**: Navigate through your stored files and folders.
- **Multi-file Move**: Move multiple files or folders simultaneously.
- **File Preview**: Preview images and videos directly in the browser.
- **Appropriate File Icons**: Display specific icons for different file types (e.g., images, videos, folders).
- **Admin Panel**: (If applicable) Manage users and system settings.
- **Error Handling**: Custom error pages for forbidden access and pending states.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js and npm (if running without Docker)
*   Docker and Docker Compose (recommended for easy setup and deployment)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/node-drive.git
    cd node-drive
    ```
2.  Install NPM packages (if running without Docker):
    ```bash
    npm install
    ```

### Configuration

1.  **Google OAuth 2.0 Credentials**: This application uses Google for authentication. You need to set up your own Google API project to obtain your Client ID and Client Secret.
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project or select an existing one.
    *   Navigate to "APIs & Services" > "Credentials".
    *   Create an "OAuth client ID" of type "Web application".
    *   Add your authorized redirect URIs (e.g., `http://localhost:3000/auth/google/callback`).
2.  **Environment Variables**: Create a `.env` file in the root directory and add the following:
    ```
    ADMIN_EMAIL=your_admin_email@example.com
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    SESSION_SECRET=your_super_secret_key_here
    ```
    Replace placeholders with your actual values. `SESSION_SECRET` should be a strong, random string used for securing session cookies.

## Docker Setup

This project can be easily run using Docker and Docker Compose.

1.  **Build and Run with Docker Compose**:
    Ensure you have Docker and Docker Compose installed. Navigate to the root directory of the project where `docker-compose.yml` is located.
    ```bash
    docker-compose up --build
    ```
    This command will build the Docker image (if not already built or if changes are detected) and start the container. The application will be accessible at `http://localhost:3000`.

    *Note: A `.dockerignore` file is included to optimize Docker image builds by excluding unnecessary files and directories.* 

2.  **Volumes**: The `uploads` and `data` directories are configured as Docker volumes to persist your uploaded files and application data outside the container. This means your data will not be lost if the container is removed.

## Usage

### Running Natively (without Docker)

To start the application:

```bash
npm start
```

Then, open your web browser and navigate to `http://localhost:3000`.

For running with Docker Compose, please refer to the [Docker Setup](#docker-setup) section.

## Dependencies

*   `express`
*   `express-session`
*   `multer`
*   `passport`
*   `passport-google-oauth20`

## License

Distributed under the MIT License. See `LICENSE` for more information.
