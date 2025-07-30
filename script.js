class StoryGenerator {
    constructor() {
        this.form = document.getElementById('storyForm');
        this.resultContainer = document.getElementById('resultContainer');
        this.storyContent = document.getElementById('storyContent');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.copyBtn = document.getElementById('copyBtn');
        this.regenerateBtn = document.getElementById('regenerateBtn');
        this.startOverBtn = document.getElementById('startOverBtn');
        
        // Ensure loading overlay is hidden on init
        this.hideLoading();
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.copyBtn.addEventListener('click', () => this.copyStoryToClipboard());
        this.regenerateBtn.addEventListener('click', () => this.regenerateStory());
        this.startOverBtn.addEventListener('click', () => this.startOver());
    }


    async handleFormSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        const formData = this.getFormData();
        
        // Change button text during generation
        const generateBtn = document.querySelector('.generate-btn');
        const originalButtonText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Writing Your Story...';
        generateBtn.disabled = true;
        
        this.showLoading('AI is crafting your training story...');
        
        try {
            const story = await this.generateStoryWithAPI(formData);
            this.displayStory(story);
        } catch (error) {
            console.error('Story generation error:', error);
            
            // Provide more specific error messages
            let errorMessage = 'Failed to generate story. ';
            
            if (error.message.includes('rate limit') || error.message.includes('quota')) {
                errorMessage += 'API rate limit exceeded. Please wait and try again.';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage += 'Network connection error. Please check your internet connection.';
            } else {
                errorMessage += `Error: ${error.message}`;
            }
            
            this.showNotification(errorMessage, 'error');
        } finally {
            // Restore button text and enable it
            generateBtn.innerHTML = originalButtonText;
            generateBtn.disabled = false;
            this.hideLoading();
        }
    }

    async generateStoryWithAPI(formData) {
        let response;
        try {
            response = await fetch('/api/generate-story', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
        } catch (networkError) {
            throw new Error(`Network error: ${networkError.message}`);
        }

        if (!response.ok) {
            let errorMessage = `API request failed (${response.status})`;
            
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (parseError) {
                errorMessage += ` - ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        
        if (!data.story) {
            throw new Error('Invalid response format from API');
        }
        
        return data.story;
    }


    generateRandomTrainingDetails() {
        const topics = [
            'Leadership development for new managers',
            'Customer service excellence training', 
            'Team communication and collaboration',
            'Time management and productivity',
            'Conflict resolution in the workplace',
            'Sales techniques and customer engagement',
            'Problem-solving and critical thinking',
            'Workplace diversity and inclusion',
            'Project management fundamentals',
            'Employee motivation and engagement'
        ];
        
        const audiences = [
            'new employees',
            'middle managers', 
            'senior staff',
            'sales team members',
            'customer service representatives',
            'project teams',
            'remote workers',
            'department heads'
        ];
        
        const durations = [
            '1-hour workshop',
            '2-hour session',
            'half-day training',
            'full-day seminar',
            '90-minute interactive session'
        ];
        
        const tones = [
            'professional but engaging',
            'casual and interactive',
            'inspirational and motivating',
            'practical and straightforward',
            'collaborative and discussion-based'
        ];
        
        const objectives = [
            'improve communication skills and build stronger team relationships',
            'develop practical problem-solving abilities and decision-making confidence',
            'enhance leadership capabilities and team management skills',
            'increase productivity through better time management and prioritization',
            'strengthen customer relationships and improve service quality',
            'build conflict resolution skills and create a more harmonious workplace',
            'develop sales techniques and improve customer engagement strategies',
            'foster inclusive practices and improve workplace diversity awareness'
        ];
        
        const topic = this.selectRandom(topics);
        const audience = this.selectRandom(audiences);
        const duration = this.selectRandom(durations);
        const tone = this.selectRandom(tones);
        const objective = this.selectRandom(objectives);
        
        return `${topic} for ${audience}, ${duration} focusing on ${objective}. ${tone.charAt(0).toUpperCase() + tone.slice(1)} tone.`;
    }
    
    generateRandomPersonalStatement() {
        const experiences = [
            'corporate trainer with 5 years experience in professional development',
            'learning and development specialist with a background in HR',
            'team leader who transitioned into training and facilitation',
            'consultant specializing in organizational development',
            'former manager now focused on leadership training',
            'training coordinator with expertise in adult learning principles',
            'freelance facilitator working with various industries',
            'internal trainer at a Fortune 500 company'
        ];
        
        const styles = [
            'interactive, story-based learning that helps participants relate concepts to real situations',
            'hands-on activities and group discussions to encourage active participation',
            'practical exercises combined with theoretical frameworks',
            'case study analysis and role-playing scenarios',
            'experiential learning with immediate application opportunities',
            'collaborative workshops that build on participant experiences',
            'engaging presentations mixed with breakout sessions',
            'problem-based learning that addresses real workplace challenges'
        ];
        
        const industries = [
            'technology and software development',
            'healthcare and medical services',
            'retail and customer service',
            'manufacturing and operations',
            'financial services and banking',
            'education and non-profit organizations',
            'consulting and professional services',
            'hospitality and service industries'
        ];
        
        const unique = [
            'I focus on creating safe learning environments where participants feel comfortable sharing experiences',
            'I emphasize practical application and provide follow-up resources for continued learning',
            'I adapt my approach based on group dynamics and individual learning preferences',
            'I incorporate real-world examples from my own professional experience',
            'I use storytelling and humor to make complex concepts more accessible',
            'I encourage peer-to-peer learning and knowledge sharing',
            'I provide actionable takeaways that participants can implement immediately'
        ];
        
        const experience = this.selectRandom(experiences);
        const style = this.selectRandom(styles);
        const industry = this.selectRandom(industries);
        const uniqueAspect = this.selectRandom(unique);
        
        return `I'm a ${experience} working primarily in ${industry}. I prefer ${style}. ${uniqueAspect}.`;
    }
    
    selectRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    validateForm() {
        const trainingField = document.getElementById('trainingDetails');
        const personalField = document.getElementById('personalStatement');
        
        // Auto-fill empty fields with random content (silently)
        if (!trainingField.value.trim()) {
            const randomTraining = this.generateRandomTrainingDetails();
            trainingField.value = randomTraining;
        }
        
        if (!personalField.value.trim()) {
            const randomPersonal = this.generateRandomPersonalStatement();
            personalField.value = randomPersonal;
        }
        
        // Clear any existing errors
        this.clearFieldError(trainingField);
        this.clearFieldError(personalField);
        
        return true; // Always return true since we auto-fill
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        field.style.borderColor = '#e53e3e';
        field.style.backgroundColor = '#fed7d7';
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = '#e53e3e';
        errorDiv.style.fontSize = '0.9rem';
        errorDiv.style.marginTop = '5px';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.style.borderColor = '#e2e8f0';
        field.style.backgroundColor = '#f7fafc';
        
        const errorMessage = field.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    getFormData() {
        return {
            trainingDetails: document.getElementById('trainingDetails').value.trim(),
            personalStatement: document.getElementById('personalStatement').value.trim()
        };
    }

    displayStory(story) {
        // Sanitize HTML content to prevent XSS attacks
        this.storyContent.innerHTML = this.sanitizeHTML(story);
        this.resultContainer.style.display = 'block';
        this.resultContainer.scrollIntoView({ behavior: 'smooth' });
    }

    sanitizeHTML(html) {
        // Create a temporary element to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Remove any script tags and event handlers
        const scripts = temp.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        
        // Remove dangerous attributes
        const allElements = temp.querySelectorAll('*');
        allElements.forEach(element => {
            // Remove event handler attributes
            Array.from(element.attributes).forEach(attr => {
                if (attr.name.startsWith('on') || attr.name === 'javascript:') {
                    element.removeAttribute(attr.name);
                }
            });
            
            // Only allow safe HTML tags
            const allowedTags = ['div', 'h3', 'h4', 'p', 'ul', 'li', 'strong', 'em', 'br'];
            if (!allowedTags.includes(element.tagName.toLowerCase())) {
                // Replace with span if not allowed
                const span = document.createElement('span');
                span.innerHTML = element.innerHTML;
                element.parentNode.replaceChild(span, element);
            }
        });
        
        return temp.innerHTML;
    }

    async copyStoryToClipboard() {
        try {
            // Copy the text content, not the HTML
            const textContent = this.storyContent.innerText || this.storyContent.textContent;
            await navigator.clipboard.writeText(textContent);
            
            // Visual feedback
            const originalText = this.copyBtn.innerHTML;
            this.copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            this.copyBtn.classList.add('success');
            
            setTimeout(() => {
                this.copyBtn.innerHTML = originalText;
                this.copyBtn.classList.remove('success');
            }, 2000);
            
        } catch (err) {
            // Fallback for older browsers
            const textContent = this.storyContent.innerText || this.storyContent.textContent;
            this.fallbackCopyToClipboard(textContent);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showNotification('Story copied to clipboard!', 'success');
        } catch (err) {
            this.showNotification('Please manually copy the story', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    async regenerateStory() {
        if (this.validateForm()) {
            const formData = this.getFormData();
            
            // Change regenerate button text during generation
            const regenerateBtn = document.getElementById('regenerateBtn');
            const originalRegenerateText = regenerateBtn.innerHTML;
            regenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating New Story...';
            regenerateBtn.disabled = true;
            
            this.showLoading('Generating a new story variation...');
            
            try {
                const newStory = await this.generateStoryWithAPI(formData);
                this.displayStory(newStory);
            } catch (error) {
                console.error('Story regeneration error:', error);
                
                // Use the same error handling as the main generation
                let errorMessage = 'Failed to generate new story. ';
                
                if (error.message.includes('rate limit') || error.message.includes('quota')) {
                    errorMessage += 'API rate limit exceeded. Please wait and try again.';
                } else if (error.message.includes('network') || error.message.includes('fetch')) {
                    errorMessage += 'Network connection error. Please check your internet connection.';
                } else {
                    errorMessage += `Error: ${error.message}`;
                }
                
                this.showNotification(errorMessage, 'error');
            } finally {
                // Restore regenerate button text and enable it
                regenerateBtn.innerHTML = originalRegenerateText;
                regenerateBtn.disabled = false;
                this.hideLoading();
            }
        }
    }

    showLoading(message = 'Crafting your perfect training story...') {
        const loadingText = this.loadingOverlay.querySelector('p');
        loadingText.textContent = message;
        this.loadingOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#e53e3e' : '#667eea'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1001;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }


    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    startOver() {
        // Clear form fields
        document.getElementById('trainingDetails').value = '';
        document.getElementById('personalStatement').value = '';
        
        // Hide result container
        this.resultContainer.style.display = 'none';
        
        // Clear story content
        this.storyContent.innerHTML = '';
        
        // Focus on first field
        document.getElementById('trainingDetails').focus();
        
        // Show notification
        this.showNotification('Form cleared! Ready for a new story.', 'success');
    }
}

// Add settings panel functionality

// Add additional CSS animations for notifications
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .settings-content {
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 400px;
        width: 90%;
    }
    
    .settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #e2e8f0;
    }
    
    .close-btn {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: #718096;
    }
    
    .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 0;
    }
    
`;
document.head.appendChild(additionalStyles);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.storyGenerator = new StoryGenerator();
    
    // Add some interactive enhancements
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentNode.style.transform = 'translateY(-2px)';
            this.parentNode.style.transition = 'transform 0.2s ease';
        });
        
        input.addEventListener('blur', function() {
            this.parentNode.style.transform = 'translateY(0)';
        });
    });
});