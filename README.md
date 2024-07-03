# My Web Application
## Project Setup
To get started with the project, follow these steps:
1. **Clone the Repository:**
   ```sh
   git clone <repository-url>
   cd my-web-application
2. **Install the necessary packages:**
   npm install pouchdb
   npm install cors
   npm install express
   npm install node-fetch
3. **Run Server**
   node server.js



# Anime Organization Application README
## Overview

   This application is a web-based anime organization tool that allows users to search for anime, view detailed information, and bookmark their favorite anime using the AniList API. It is built using Express.js on the backend, with PouchDB for data persistence, and a front-end that utilizes HTML, CSS, and JavaScript.

## Features
   - Search Anime: Search for anime using the AniList API.
   - View Anime Details: View detailed information about each anime, including a description, characters, and trailers.
   - Bookmark Anime: Bookmark your favorite anime to view later. Bookmarks are stored in PouchDB and are user-specific.
   - User Authentication: Users can sign in with their AniList account to save and view their bookmarks.
## Prerequisites
   - Node.js installed on your machine.
   - AniList API client with client ID and secret.

## Installation
1. Clone the repository:

   ```sh
   Copy code
   git clone <repository-url>
   cd my-web-application
   
2. Install dependencies:

   ```sh
   Copy code
   npm install

3. Create a .env file in the root directory and add your AniList API credentials:

   ```makefile
   Copy code
   ANILIST_CLIENT_ID=your_client_id
   ANILIST_CLIENT_SECRET=your_client_secret
   SESSION_SECRET=your_session_secret
## Running the Application
1. Start the server:

   ```sh
   Copy code
   node server.js

2. Open your browser and navigate to http://localhost:3260.