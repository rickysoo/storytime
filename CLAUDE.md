# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StoryTime is an AI-powered training story generator web application that uses OpenAI's GPT-4o-mini to create engaging, personalized training stories. It's a full-stack application with a vanilla JavaScript frontend and Vercel serverless backend.

## Development Commands

### Local Development Setup
1. **Install dependencies**: `pip install -r requirements.txt`
2. **Environment setup**: Copy `.env.example` to `.env.local` and add your OpenAI API key
3. **Development server**: `python server.py [port]` (default port: 8080)
   - Automatically opens browser to `http://localhost:8080`
   - Handles `/api/generate-story` route locally
   - Includes CORS headers for development
   - Uses environment variables from `.env.local`
   - Use `python server.py 8081` for alternative port if 8080 is in use

### Alternative Local Development
- **Direct access**: Open `index.html` directly in browser (API calls will fail without server)
- **NPM scripts**: `npm run dev` or `npm start` (runs Python server)

### Deployment (Vercel)
- **Deploy**: `vercel` (requires Vercel CLI)
- **Environment variables**: Set `OPENAI_API_KEY` in Vercel dashboard
- **Configuration**: Uses `vercel.json` for function settings

### No Build Process
This is a vanilla HTML/CSS/JavaScript application with no build system or package manager.

## Architecture Overview

### Core Structure
- **Full-stack application**: Frontend + serverless backend
- **Frontend**: Pure client-side application using vanilla JavaScript
- **Backend**: Vercel serverless functions for secure API calls
- **Security**: API key stored server-side as environment variable
- **Single-page application**: All functionality contained in one HTML page

### Key Components
- **StoryGenerator class** (`script.js:1-620`): Main application logic
  - Form handling and validation with auto-fill functionality
  - Backend API integration for story generation
  - Error handling with specific error messages
  - No client-side API key management
- **SettingsManager class** (`script.js:623-720`): Settings modal and API testing
- **Serverless function** (`api/generate-story.js`): Secure OpenAI API integration
- **Development server** (`server.py`): Local development server with API route handling

### API Integration
- **Architecture**: Frontend → Vercel Function → OpenAI API
- **Model**: Uses GPT-4o-mini (cost-effective OpenAI model)
- **Authentication**: API key stored securely in environment variables
- **Endpoint**: `/api/generate-story` POST endpoint
- **Prompt engineering**: Sophisticated prompt structure in serverless function
- **Parameters**: temperature: 0.8, max_tokens: 1500, presence_penalty: 0.1

### Security Features
- **Server-side API key**: Never exposed to client
- **Environment variables**: Secure key storage
- **CORS handling**: Proper cross-origin request handling
- **Input validation**: Server-side form data validation

### Form Behavior
- **Auto-fill**: Empty fields automatically filled with random realistic content
- **No validation errors**: Form always submits successfully due to auto-fill
- **Backend validation**: Server validates required fields

## File Structure
```
Storytime/
├── api/
│   └── generate-story.js    # Vercel serverless function for OpenAI API calls
├── index.html               # Main application file with full UI
├── styles.css               # Complete styling with animations and responsive design
├── script.js                # Frontend application logic (StoryGenerator + SettingsManager)
├── server.py                # Development server with API route handling
├── package.json             # NPM scripts and project metadata
├── requirements.txt         # Python dependencies for local development
├── vercel.json              # Vercel deployment configuration
├── .env.example             # Environment variable template
├── .env.local               # Local environment variables (not committed)
├── .gitignore               # Git ignore file (includes .env files)
├── CLAUDE.md                # This file
└── README.md                # User documentation
```

## Working with This Codebase

### Making Changes
- **Frontend changes**: Edit `index.html`, `styles.css`, or `script.js` directly
- **Backend changes**: Modify `api/generate-story.js` for production API logic
- **Local API changes**: The development server in `server.py` mirrors the serverless function
- **Local testing**: Use `python server.py` with `.env.local` setup
- **Deployment**: Push to Git, Vercel auto-deploys

### Local Development Workflow
1. **Setup**: `pip install -r requirements.txt` and create `.env.local`
2. **Development**: `python server.py` starts server with API route handling
3. **Testing**: Full application functionality available at `http://localhost:8080`
4. **API changes**: Update both `server.py` and `api/generate-story.js` to keep them in sync

### Key Implementation Details
- **No client-side API keys**: All OpenAI calls happen server-side
- **Form validation**: Always passes due to auto-fill mechanism
- **Responsive design**: Works on desktop, tablet, and mobile
- **Serverless architecture**: Scales automatically with Vercel
- **Security-first**: API credentials never exposed to frontend

### Common Modifications
- **Prompt engineering**: Modify `createStoryPrompt()` function in `api/generate-story.js`
- **AI parameters**: Adjust settings in the serverless function
- **UI styling**: Edit `styles.css` for visual changes
- **Form fields**: Add/modify fields in `index.html` and update both `script.js` and `api/generate-story.js`

### Environment Setup

#### Local Development
1. **Install Python dependencies**: `pip install -r requirements.txt`
2. **Environment file**: Copy `.env.example` to `.env.local`
3. **Add API key**: Set `OPENAI_API_KEY=your-key-here` in `.env.local`
4. **Start server**: `python server.py`
5. **Test**: Open `http://localhost:8080` and generate a story

#### Production Deployment
1. **Vercel environment**: Set `OPENAI_API_KEY` in Vercel dashboard
2. **Deploy**: Push to Git or use `vercel` CLI
3. **Auto-deployment**: Vercel automatically deploys on Git push

#### Security Notes
- **Never commit** `.env.local` or real API keys to version control
- **Local server** mimics Vercel serverless function behavior
- **API key** is loaded from environment variables in both local and production