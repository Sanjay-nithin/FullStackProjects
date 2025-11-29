
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Send, Bot, User, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI booking assistant with voice support. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speakText = (text: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setSpeechEnabled(!speechEnabled);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate bot response with realistic delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(content),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
      
      // Speak the bot response
      speakText(botResponse.content);
    }, 1500);
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('book') || input.includes('schedule')) {
      return 'I can help you book a service! What type of service are you looking for? We have laundry, cleaning, study spaces, repairs, and tech support available.';
    } else if (input.includes('laundry')) {
      return 'Great! Our laundry services include washing, drying, and dry cleaning. Would you like to see available time slots for today or tomorrow?';
    } else if (input.includes('cleaning')) {
      return 'Our cleaning services cover room cleaning and housekeeping. What date would work best for you? We have availability this week.';
    } else if (input.includes('study')) {
      return 'I can help you book a study space in our library. When would you like to reserve it? We have quiet study rooms and group study areas available.';
    } else if (input.includes('repair')) {
      return 'What type of repair do you need? We handle room maintenance, electrical issues, plumbing, and general repairs. Please describe the problem.';
    } else if (input.includes('tech')) {
      return 'Our tech support covers WiFi issues, computer problems, and general technical assistance. What specific issue are you facing?';
    } else if (input.includes('hello') || input.includes('hi')) {
      return 'Hello! I\'m here to help you with bookings and service information. You can speak to me or type your questions. What can I assist you with?';
    } else if (input.includes('voice') || input.includes('speak')) {
      return 'Yes, I have voice capabilities! I can listen to your voice commands and speak my responses back to you. Try using the microphone button to talk to me.';
    } else {
      return 'I understand you need help with our services. Could you please specify what type of service you\'re interested in? We offer laundry, cleaning, study spaces, repairs, and tech support.';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Audio level monitoring
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateAudioLevel = () => {
        if (isRecording) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(average);
          requestAnimationFrame(updateAudioLevel);
        }
      };
      updateAudioLevel();

      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        // Simulate speech-to-text conversion
        const simulatedText = 'I want to book a laundry service for tomorrow';
        handleSendMessage(simulatedText);
        stream.getTracks().forEach(track => track.stop());
        setAudioLevel(0);
      };

      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: 'Recording started',
        description: 'Speak now, I\'m listening...',
      });
    } catch (error) {
      toast({
        title: 'Microphone Error',
        description: 'Unable to access microphone. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({
        title: 'Recording stopped',
        description: 'Processing your voice...',
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col animate-slide-in-up shadow-2xl">
      <CardHeader className="pb-4 border-b bg-gradient-to-r from-blue-50 to-green-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary animate-bounce-gentle" />
            AI Voice Assistant
            {isSpeaking && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSpeech}
            className="hover-scale"
          >
            {speechEnabled ? (
              <Volume2 className="h-4 w-4 text-green-600" />
            ) : (
              <VolumeX className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex gap-3 animate-slide-in-left ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {message.sender === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              
              <div
                className={`max-w-[70%] p-3 rounded-lg transition-all duration-300 hover:shadow-md ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white animate-slide-in-right'
                    : 'bg-card border animate-slide-in-left'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              
              {message.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center animate-scale-in">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start animate-slide-in-left">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="bg-card border p-3 rounded-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Audio Level Indicator */}
        {isRecording && (
          <div className="px-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Recording...</span>
              <Progress value={audioLevel} className="flex-1 h-2" />
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
              placeholder="Type your message or use voice..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
              disabled={isLoading}
            />
            
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="hover-scale"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? 'destructive' : 'outline'}
            size="icon"
            className={`hover-scale ${isRecording ? 'pulse-strong' : ''}`}
          >
            {isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Chatbot;
