document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startButton = document.getElementById('startListening');
    const stopButton = document.getElementById('stopListening');
    const statusElement = document.getElementById('status');
    const resultElement = document.getElementById('result');
    
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Check if the browser supports speech recognition
    if (!SpeechRecognition) {
        statusElement.textContent = "Sorry, your browser doesn't support speech recognition.";
        startButton.disabled = true;
        return;
    }
    
    // Configure recognition settings
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    // Initialize speech synthesis
    const synth = window.speechSynthesis;
    
    // API Configuration
    const AI_API_KEY = ''; // Replace with your actual API key
    const AI_API_URL = 'https://api.anthropic.com/v1/messages'; // Example using OpenAI
    
    // Event listeners for buttons
    startButton.addEventListener('click', startListening);
    stopButton.addEventListener('click', stopListening);
    
    // Recognition event handlers
    recognition.onstart = () => {
        statusElement.textContent = "Listening...";
        startButton.disabled = true;
        stopButton.disabled = false;
    };
    
    recognition.onresult = async (event) => {
        const last = event.results.length - 1;
        const userInput = event.results[last][0].transcript.trim();
        
        // Display what was heard
        const heardElement = document.createElement('p');
        heardElement.classList.add('heard');
        heardElement.textContent = `You said: "${userInput}"`;
        resultElement.appendChild(heardElement);
        
        // First check for built-in commands
        let response = processBuiltInCommands(userInput.toLowerCase());
        
        // If no built-in command was matched, send to AI API
        if (response === null) {
            // Show thinking state
            const thinkingElement = document.createElement('p');
            thinkingElement.classList.add('thinking');
            thinkingElement.textContent = 'Thinking...';
            resultElement.appendChild(thinkingElement);
            
            try {
                response = await getAIResponse(userInput);
                // Remove the thinking indicator
                resultElement.removeChild(thinkingElement);
            } catch (error) {
                response = "Sorry, I couldn't connect to my AI brain at the moment. Please try again later.";
                // Remove the thinking indicator
                resultElement.removeChild(thinkingElement);
            }
        }
        
        // Display and speak the response
        const responseElement = document.createElement('p');
        responseElement.classList.add('response');
        responseElement.textContent = `Assistant: ${response}`;
        resultElement.appendChild(responseElement);
        
        // Scroll to the bottom to show latest messages
        resultElement.scrollTop = resultElement.scrollHeight;
        
        speak(response);
    };
    
    recognition.onerror = (event) => {
        statusElement.textContent = `Error occurred: ${event.error}`;
        startButton.disabled = false;
        stopButton.disabled = true;
    };
    
    recognition.onend = () => {
        statusElement.textContent = "Voice recognition stopped.";
        startButton.disabled = false;
        stopButton.disabled = true;
    };
    
    // Functions to control recognition
    function startListening() {
        recognition.start();
    }
    
    function stopListening() {
        recognition.stop();
    }
    
    // Process built-in voice commands
    function processBuiltInCommands(command) {
        // Handle system commands first (these don't need AI)
        if (command.includes('clear screen') || command.includes('clear chat')) {
            resultElement.innerHTML = '';
            return "I've cleared our conversation.";
        } else if (command.includes('stop listening')) {
            stopListening();
            return "I've stopped listening.";
        }
        
        // Simple built-in responses for common queries
        // Return null if the command isn't recognized so it can be sent to the AI API
        if (command.includes('hello') || command.includes('hi there')) {
            return "Hello! How can I help you today?";
        } else if (command === "what time is it" || command === "tell me the time") {
            const now = new Date();
            return `The current time is ${now.toLocaleTimeString()}.`;
        } else if (command === "what's today's date" || command === "what day is it") {
            const now = new Date();
            return `Today is ${now.toLocaleDateString()}.`;
        } else if (command.includes('thank you') || command.includes('thanks')) {
            return "You're welcome!";
        } else if (command.includes('bye') || command.includes('goodbye')) {
            return "Goodbye! Have a great day!";
        }
        
        // Not a built-in command, send to AI API
        return null;
    }
    
    // Get response from AI API
    async function getAIResponse(userInput) {
        const requestBody = {
            model: "claude-3-sonnet-20240229", // or another Claude model
            max_tokens: 150,
            messages: [
                {
                    role: "user",
                    content: userInput
                }
            ],
            system: "You are a helpful voice assistant. Provide concise and accurate responses."
        };
        
        const response = await fetch(AI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': AI_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        return data.content[0].text;
    }
    
    // Speech synthesis function
    function speak(text) {
        if (synth.speaking) {
            synth.cancel(); // Stop any current speech
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Optional: Select a specific voice
        const voices = synth.getVoices();
        if (voices.length > 0) {
            // Try to find an English female voice
            const preferredVoice = voices.find(voice => 
                voice.lang.includes('en') && voice.name.includes('Female'));
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
        }
        
        utterance.pitch = 1;
        utterance.rate = 1;
        utterance.volume = 1;
        
        synth.speak(utterance);
    }
    
    // Load available voices (necessary for some browsers)
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = () => {
            console.log("Voices loaded.");
        };
    }
});