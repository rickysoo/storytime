#!/usr/bin/env python3
"""
Development server for StoryTime app with API route handling
Usage: python server.py [port]
Default port: 8080
"""

import http.server
import socketserver
import sys
import os
import webbrowser
import json
import urllib.parse
from pathlib import Path

# Try to load environment variables
try:
    from dotenv import load_dotenv
    if load_dotenv('.env.local'):
        print("Environment variables loaded from .env.local")
    else:
        print("Warning: .env.local file not found. Create one from .env.example for API functionality.")
except ImportError:
    print("Warning: python-dotenv not installed. Install with 'pip install python-dotenv' for environment variable support.")

def main():
    # Get port from command line argument or use default
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    
    # Change to the script directory
    os.chdir(Path(__file__).parent)
    
    # Create server
    handler = http.server.SimpleHTTPRequestHandler
    
    # Enhanced request handler with API route support
    class APIRequestHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            # Restrict CORS to localhost for development
            origin = self.headers.get('Origin', '')
            allowed_origins = ['http://localhost:8080', 'http://127.0.0.1:8080']
            
            if origin in allowed_origins:
                self.send_header('Access-Control-Allow-Origin', origin)
            
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            super().end_headers()
        
        def do_OPTIONS(self):
            self.send_response(200)
            self.end_headers()
        
        def do_POST(self):
            if self.path == '/api/generate-story':
                self.handle_generate_story()
            else:
                self.send_error(404, "API endpoint not found")
        
        def handle_generate_story(self):
            try:
                # Read request body
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                # Input validation
                training_details = data.get('trainingDetails', '')
                personal_statement = data.get('personalStatement', '')
                
                if not training_details or not personal_statement:
                    self.send_json_response(400, {'error': 'Missing required fields'})
                    return
                
                if not isinstance(training_details, str) or not isinstance(personal_statement, str):
                    self.send_json_response(400, {'error': 'Invalid input format'})
                    return
                
                # Length validation
                if len(training_details) > 2000 or len(personal_statement) > 1000:
                    self.send_json_response(400, {'error': 'Input too long'})
                    return
                
                # Basic sanitization
                sanitized_data = {
                    'trainingDetails': training_details.replace('<', '').replace('>', '').replace('"', '').replace("'", '').replace('&', ''),
                    'personalStatement': personal_statement.replace('<', '').replace('>', '').replace('"', '').replace("'", '').replace('&', '')
                }
                
                # Check for API key
                api_key = os.getenv('OPENAI_API_KEY')
                if not api_key:
                    print("Error: API key not found in environment variables")
                    self.send_json_response(500, {
                        'error': 'OpenAI API key not found. Please set OPENAI_API_KEY in .env.local'
                    })
                    return
                
                print("API key loaded successfully")
                
                # Import and use the serverless function logic
                story = self.generate_story_with_openai(sanitized_data, api_key)
                self.send_json_response(200, {'story': story})
                
            except json.JSONDecodeError:
                self.send_json_response(400, {'error': 'Invalid JSON'})
            except Exception as e:
                print(f"Error generating story: {e}")
                self.send_json_response(500, {'error': 'Service temporarily unavailable. Please try again.'})
        
        def send_json_response(self, status_code, data):
            self.send_response(status_code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode('utf-8'))
        
        def generate_story_with_openai(self, form_data, api_key):
            import urllib.request
            import urllib.error
            
            prompt = self.create_story_prompt(form_data)
            
            # Prepare the request to OpenAI
            url = 'https://api.openai.com/v1/chat/completions'
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'model': 'gpt-4o-mini',
                'messages': [
                    {
                        'role': 'system',
                        'content': 'You are a professional training story writer who creates funny, engaging, and educational narratives. Your stories should be humorous yet meaningful, with workplace comedy that makes learning memorable while delivering clear training value. Think of yourself as a comedian who also happens to be an excellent trainer - your stories should make people laugh while they learn.'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'max_tokens': 1500,
                'temperature': 0.8,
                'presence_penalty': 0.1,
                'frequency_penalty': 0.1
            }
            
            # Make the request
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers=headers
                )
                
                with urllib.request.urlopen(req) as response:
                    response_data = json.loads(response.read().decode('utf-8'))
                    
                if 'choices' not in response_data or not response_data['choices']:
                    raise Exception('Invalid response format from OpenAI API')
                
                return response_data['choices'][0]['message']['content'].strip()
                
            except urllib.error.HTTPError as e:
                error_body = e.read().decode('utf-8')
                try:
                    error_data = json.loads(error_body)
                    error_message = error_data.get('error', {}).get('message', f'HTTP {e.code}')
                except:
                    error_message = f'HTTP {e.code}: {e.reason}'
                raise Exception(error_message)
            except urllib.error.URLError as e:
                raise Exception(f'Network error: {e.reason}')
        
        def create_story_prompt(self, form_data):
            return f"""Create a personalized first-person training story based on the following information:

TRAINING SESSION DETAILS:
{form_data['trainingDetails']}

PERSONAL DETAIL ABOUT THE TRAINER:
{form_data['personalStatement']}

CRITICAL REQUIREMENTS:
- MUST write the story in FIRST PERSON using "I", "me", "my" throughout the entire story
- NEVER use third-person pronouns like "she", "he", "Sarah", or any character names
- The story narrator IS the trainer themselves telling their own experience
- Start sentences with "I" - for example: "I was working in...", "I noticed...", "I decided to..."
- Incorporate the personal detail about the trainer naturally into the first-person narrative
- Show how "I" faced realistic workplace challenges related to the training topic
- Demonstrate how "I" applied the training concepts to overcome obstacles
- Keep the story to exactly 400 words or less
- Format the response as clean HTML with appropriate tags (no markdown)
- Use single line spacing throughout, avoid double spacing between lines

STORY TONE REQUIREMENTS:
- Make the story FUNNY and engaging with humor, light moments, or amusing situations
- Include relatable workplace comedy (awkward moments, funny misunderstandings, quirky colleagues)
- Use the trainer's personal detail in a humorous way if possible
- Add amusing dialogue or internal thoughts
- Keep it professional but entertaining - appropriate for workplace training
- Balance humor with meaningful learning outcomes
- The comedy should enhance, not distract from, the training message

Example opening: "I was working as a [role] when I encountered the most ridiculous situation..." or "Little did I know that my [personal detail] would save the day in the most unexpected way..."

Structure your HTML response as:
<div class="story-section">
<h3>The Story</h3>
<p>[Funny first-person opening: "I was working in... when the most ridiculous thing happened..." - set the scene with humor and "I"]</p>
<p>[Amusing challenge paragraph: "I couldn't believe it when..." "The situation got even more absurd..." - present the problem with comedic elements from my perspective]</p>
<p>[Clever resolution paragraph: "That's when I remembered..." "Using my [personal detail] and [training concept], I managed to..." - show how I solved it with both humor and meaningful learning]</p>
</div>

<div class="training-section">
<h3>Training Application</h3>
<div class="application-overview">
<h4>Story Relevance</h4>
<p>[2-3 sentences explaining how this story directly connects to the training objectives and why it resonates with the target audience]</p>
</div>

<div class="facilitation-guide">
<h4>How to Use This Story</h4>
<ul>
<li><strong>Opening Activity:</strong> [Detailed suggestion for introducing the story - timing, setup, participant engagement]</li>
<li><strong>Discussion Questions:</strong> [2-3 specific questions to facilitate meaningful group discussion, with follow-up prompts - format as single line spacing, not double spacing]</li>
<li><strong>Learning Connection:</strong> [Explicit guidance on linking story elements to key training concepts and real workplace scenarios]</li>
<li><strong>Action Planning:</strong> [Specific steps participants can take to apply the lessons in their own work environment]</li>
</ul>
</div>

<div class="trainer-tips">
<h4>Trainer Notes</h4>
<p>[Practical tips for delivery, potential participant reactions to anticipate, and ways to adapt the story for different group dynamics]</p>
</div>
</div>

Ensure the HTML is well-formatted, uses semantic tags, and creates a professional appearance when rendered. Use single line spacing throughout - no double spacing between sentences or paragraphs. The Training Application section should be comprehensive and provide detailed guidance for effective story utilization. Do not include any markdown formatting (**, ##, etc.) - use only HTML tags."""
    
    try:
        with socketserver.TCPServer(("", port), APIRequestHandler, bind_and_activate=False) as httpd:
            httpd.allow_reuse_address = True
            httpd.server_bind()
            httpd.server_activate()
            
            print(f"StoryTime app server starting...")
            print(f"Server running at: http://localhost:{port}")
            print(f"Serving directory: {os.getcwd()}")
            print(f"Opening browser...")
            print(f"Press Ctrl+C to stop the server")
            
            # Open browser
            webbrowser.open(f'http://localhost:{port}')
            
            # Start serving
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print(f"\nServer stopped.")
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"Port {port} is already in use. Try a different port:")
            print(f"   python server.py 8081")
        else:
            print(f"Error starting server: {e}")

if __name__ == "__main__":
    main()