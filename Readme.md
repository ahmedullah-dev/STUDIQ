# 📚 STUDIQ - Intelligent Learning Companion

> **Transform Your Study Experience with AI-Powered Learning Tools**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.1.0-blue?style=flat-square&logo=express)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square)]()

STUDIQ is a revolutionary web-based learning platform that leverages artificial intelligence to personalize your educational experience. Generate intelligent quizzes, visualize concept dependencies, predict performance, and practice viva interviews—all powered by cutting-edge AI technology.

---

## 🌟 Key Features

### 📝 **AI-Powered Quiz Generator**
Generate unlimited custom quizzes from any study material with intelligent question creation.

- ✅ **Multiple Question Types**
  - Multiple Choice Questions (MCQs)
  - Fill-in-the-Blank with fuzzy matching validation
  - True/False statements
  
- 🎯 **Smart Quiz Configuration**
  - Adjustable difficulty levels: Easy, Medium, Hard
  - Custom question count (1-50 questions)
  - Real-time scoring with instant feedback
  - Comprehensive explanations for every answer
  - Performance tracking and analytics

- 💡 **Intelligent Validation**
  - Fuzzy matching for better answer acceptance
  - Case-insensitive responses
  - Synonym recognition
  - Detailed answer explanations with key points

### ⚡ **Quick Fire Mode**
Test your knowledge under pressure with timed challenges.

- ⏱️ 60-second intense quiz sessions
- Rapid-fire questions to boost retention
- Immediate scoring and feedback
- Perfect for exam preparation

### 📊 **Performance Predictor (SEE Grade Calculator)**
Visualize your academic performance and predict required marks for target grades.

- 📈 **Multiple Visualization Charts**
  - SEE Progress Radial Chart
  - Performance Gauge Chart  
  - Grade Comparison Bar Chart
  
- 🎓 **Grading System Support**
  - Grade S: ≥90 marks
  - Grade A: ≥80 marks
  - Grade B: ≥70 marks
  - Grade C: ≥60 marks
  - Grade D: ≥50 marks
  - Grade E: ≥40 marks

- 🔍 **Detailed Analytics**
  - Calculate minimum SEE marks needed for desired grades
  - View achievability status for all grades
  - Interactive performance visualization
  - Real-time grade predictions

### 🗺️ **Concept Dependency Map**
Visualize how topics relate and build a comprehensive understanding of prerequisites.

- 🔗 Understand topic relationships and dependencies
- 📚 Learn concept chains and prerequisites
- 🎯 Identify critical foundational topics
- 💭 Visualize knowledge structure
- 🧠 Enhance deep understanding of subject matter

### 🎤 **Viva Practice Simulator**
Prepare for oral examinations with AI-generated realistic interview questions.

- 🎯 **Difficulty Levels**
  - Easy: Basic conceptual questions
  - Medium: Applied knowledge questions
  - Hard: Advanced problem-solving scenarios

- 📝 **Practice Features**
  - Generate realistic oral exam questions
  - View expected answer points
  - Get expert tips for better responses
  - Practice multiple questions in sequence
  - Progress tracking and improvement metrics
  - Compare your answers with AI-generated ideal responses

### 📄 **Smart Summary Generator**
Extract key points from lengthy study materials instantly.

- 🎚️ **Flexible Summary Lengths**
  - Short: Quick overview (bullet points)
  - Medium: Balanced summary with key details
  - Long: Comprehensive summary with examples

- 📋 **Format Options**
  - Bullet points for quick reference
  - Paragraph format for detailed reading
  - Numbered lists for structured learning

- 🔄 **Export & Share**
  - Copy to clipboard for easy sharing
  - Export as PDF documents
  - Regenerate summaries with different parameters

### 🌙 **Dark/Light Mode**
Customize your learning environment with elegant theme options.

- 🎨 **Neumorphic Design System**
  - Soft, modern UI design
  - Easy on the eyes in both themes
  - Smooth theme transitions
  - Persistent theme preference (saved locally)

---

## 🏗️ Architecture & Tech Stack

### Backend Technologies

| Technology | Purpose | Version |
|-----------|---------|---------|
| **Node.js** | Runtime Environment | 18+ |
| **Express.js** | Web Framework | 5.1.0 |
| **OpenRouter API** | AI Model Integration | Latest |
| **Compression** | Response Compression | 1.7.4 |
| **CORS** | Cross-Origin Support | 2.8.5 |
| **dotenv** | Environment Configuration | 17.2.2 |
| **express-rate-limit** | API Rate Limiting | 8.1.0 |
| **node-fetch** | HTTP Requests | 3.3.2 |

### Frontend Technologies

- **HTML5** - Semantic markup
- **CSS3** - Neumorphic design system
- **Vanilla JavaScript** - No framework bloat
- **ApexCharts** - Advanced data visualization
- **jsPDF** - PDF export functionality

### AI Integration

- **Model**: Google Gemini 4 31B via OpenRouter
- **Rate Limiting**: Smart request queue management
- **Caching**: 5-minute in-memory cache for performance
- **Timeout Protection**: 60-second request timeout with retry logic

---

## �️ Project File Structure

```text
/studiq
├─ .env
├─ .gitignore
├─ .renderignore
├─ package.json
├─ package-lock.json
├─ render.yaml
├─ server.js
├─ Readme.md
├─ Readme enhanced.md
├─ public/
│  ├─ index.html
│  ├─ main.js
│  └─ styles.css
└─ node_modules/ (generated)
```

---

## �🚀 Quick Start Guide

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **OpenRouter API Key**: [Get one free here](https://openrouter.ai/keys)
- **Git**: For cloning the repository

### Installation Steps

#### 1. **Clone the Repository**
```bash
git clone https://github.com/yourusername/studiq.git
cd studiq
```

#### 2. **Install Dependencies**
```bash
npm install
```

#### 3. **Configure Environment Variables**
Create a `.env` file in the root directory:

```env
OPENROUTER_API_KEY=your_api_key_here
PORT=3000
NODE_ENV=development
```

**Important**: Never commit your `.env` file to version control!

#### 4. **Start the Application**

**Development Mode** (with auto-reload):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

#### 5. **Access the Application**
Open your browser and navigate to: `http://localhost:3000`

---

## 📖 Usage Guide

### Getting Started

1. **Paste Study Material**: Enter or paste your study content in the main text area
2. **Select a Feature**: Choose from Summary, Quiz, Quick Fire, Concept Map, Performance, or Viva
3. **Configure Options**: Customize difficulty, format, or other parameters
4. **Generate Content**: Click the action button and wait for AI processing
5. **Review Results**: Analyze generated content and take action

### Feature Workflows

#### **📝 Using the Quiz Generator**

1. Paste your study material
2. Select the **Quiz** tab
3. Configure options:
   - **Difficulty**: Select difficulty level (Easy/Medium/Hard)
   - **Question Count**: Choose how many questions (1-50)
   - **Question Types**: Select desired question formats (MCQ, Fill-in-the-Blank, True/False)
4. Click **Generate Quiz**
5. Answer all questions
6. Click **Submit Quiz** to see your score
7. Review detailed explanations for each answer
8. Export quiz results as PDF if needed

#### **⚡ Using Quick Fire Mode**

1. Paste your study material
2. Select the **Quick Fire** tab
3. Click **Start Quiz**
4. Answer questions as fast as possible within 60 seconds
5. View your final score and performance metrics

#### **📊 Using the Performance Predictor**

1. Navigate to the **Performance** tab
2. Enter your current SEE marks
3. Specify your target grade
4. View interactive charts showing:
   - Minimum marks required
   - Grade achievability
   - Performance comparison
5. Use insights to set study goals

#### **🎤 Using Viva Practice**

1. Select the **Viva Practice** tab
2. Choose difficulty level (Easy/Medium/Hard)
3. Click **Generate Questions**
4. Read the question carefully
5. Review expected answer points and expert tips
6. Click **Next Question** to continue
7. Track your progress through the session

#### **📄 Using Summary Generator**

1. Paste your study material
2. Select the **Summary** tab
3. Configure:
   - **Length**: Short/Medium/Long
   - **Format**: Bullet Points/Paragraphs/Numbered List
4. Click **Generate Summary**
5. Copy to clipboard or export as PDF

---

## ⚙️ Configuration & Customization

### Environment Variables

```env
# API Configuration
OPENROUTER_API_KEY=your_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional: API Model Selection
# WORKING_MODEL=openai/gpt-oss-120b:free
```

### Rate Limiting Configuration

The application includes intelligent rate limiting:
- **Window**: 60 seconds
- **Max Requests**: 50 requests per minute
- **Queue Management**: Single concurrent request with 2-second delays between requests

### Caching System

- **Cache TTL**: 5 minutes
- **Auto-cleanup**: Prevents cache from exceeding 100 entries
- **Smart Invalidation**: Based on content hash and parameters

---

## 🔒 Security Features

- ✅ **CORS Protection**: Secure cross-origin requests
- ✅ **Rate Limiting**: Prevents API abuse
- ✅ **Input Sanitization**: Protects against injection attacks
- ✅ **API Key Protection**: Secure environment-based configuration
- ✅ **Response Compression**: Smaller payload sizes
- ✅ **Cache Headers**: Optimized static asset serving (1-hour cache)

---

## 📊 Performance Optimizations

### Backend Optimizations
- **Response Compression**: gzip compression for all responses
- **Smart Caching**: 5-minute in-memory cache for generated content
- **Request Queue**: Prevents concurrent API overload
- **Static Asset Caching**: 1-hour cache for JavaScript, CSS, images

### Frontend Optimizations
- **Lazy Loading**: Third-party libraries loaded only when needed
- **DOM Caching**: Critical elements cached in memory
- **Event Delegation**: Efficient event handling
- **Async Operations**: Non-blocking UI updates

---

## 🐛 Troubleshooting

### Common Issues & Solutions

#### **❌ "API Key not found" Error**
```
Solution: Create .env file with OPENROUTER_API_KEY=your_key_here
```

#### **❌ "Port Already in Use"**
```bash
# On Windows
netstat -ano | findstr :3000

# On macOS/Linux
lsof -i :3000

# Then kill the process:
kill -9 <PID>
```

#### **❌ Quiz Generation Takes Too Long**
- Check your internet connection
- Verify OpenRouter API key is valid
- Check API request queue (max 1 concurrent request with 2-sec delays)

#### **❌ Theme Not Persisting**
- Clear browser cache and cookies
- Check localStorage permissions in browser settings
- Try incognito/private mode to verify

#### **❌ PDF Export Not Working**
- Ensure jsPDF library is loaded (check browser console)
- Try a different browser
- Check browser pop-up blocker settings

---

## 📈 API Endpoints Reference

### Quiz Generation
```
POST /api/generate-quiz
Body: { content, difficulty, questionCount, types }
```

### Summary Generation
```
POST /api/generate-summary
Body: { content, length, format }
```

### Viva Questions
```
POST /api/generate-viva
Body: { content, difficulty }
```

### Concept Map
```
POST /api/generate-concepts
Body: { content }
```

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/studiq.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and commit
   ```bash
   git commit -m "Add: description of your changes"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** with detailed description

### Contribution Guidelines
- Follow existing code style and conventions
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed
- Be respectful and constructive

---

## 📝 Development Tips

### Adding New Features

1. **Backend**: Add endpoint in `server.js`
2. **Frontend**: Create UI in `public/index.html`
3. **Styling**: Update `public/styles.css`
4. **Logic**: Implement handlers in `public/main.js`
5. **Testing**: Test thoroughly before committing

### Debug Mode
```javascript
// Add to main.js for debugging
const DEBUG = true;
const log = (msg) => DEBUG && console.log(`[DEBUG] ${msg}`);
```

---

## 📚 Learning Resources

- [Express.js Documentation](https://expressjs.com/)
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [ApexCharts Library](https://apexcharts.com/)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [MDN Web Docs](https://developer.mozilla.org/)

---

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, and sublicense.
```

---

## 🙏 Acknowledgments

- **OpenRouter** for providing access to powerful AI models
- **ApexCharts** for beautiful data visualization
- **jsPDF** for PDF export capabilities
- **Express.js** for the robust framework
- All contributors and users for their support

---

## 📞 Support & Contact

### Get Help
- 💬 **Issues**: [GitHub Issues](https://github.com/yourusername/studiq/issues)
- 📧 **Email**: support@studiq.io
- 🐦 **Twitter**: [@STUDIQ_IO](https://twitter.com/studiq_io)
- 💡 **FAQ**: Check the [Wiki](https://github.com/yourusername/studiq/wiki)

### Report Bugs
Please use the [Issue Tracker](https://github.com/yourusername/studiq/issues) with:
- Clear description of the bug
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots if applicable

---

## 🚀 Roadmap

### Coming Soon
- 🤖 **Multi-Language Support**: AI explanations in multiple languages
- 📱 **Mobile App**: Native iOS and Android applications
- 🌐 **Collaboration Features**: Group study sessions
- 📊 **Advanced Analytics**: Detailed learning insights and recommendations
- 🎯 **Personalized Learning Paths**: AI-suggested study plans
- 🔊 **Audio Support**: Viva practice with voice input/output
- 🏆 **Gamification**: Achievements, badges, and leaderboards

---

## 📈 Statistics & Metrics

**Current Version**: 1.0.0

**Technology Stack**:
- 1 Backend Framework
- 5+ Frontend Libraries
- 6 NPM Dependencies
- 100+ JavaScript Functions
- AI-Powered Features: 6

**Supported Question Types**: 3
- Multiple Choice
- Fill-in-the-Blank
- True/False

**Theme Modes**: 2
- Light Mode
- Dark Mode (Neumorphic)

---

## 🎯 Best Practices for Using STUDIQ

1. **Start with Summaries**: Get an overview before attempting quizzes
2. **Use Progressive Difficulty**: Start easy, work up to hard
3. **Review Explanations**: Learn from detailed answer explanations
4. **Regular Practice**: Use Viva mode for consistent practice
5. **Track Progress**: Monitor performance over time
6. **Combine Features**: Use multiple tools for comprehensive learning
7. **Export Results**: Save PDFs for offline review

---

## ⭐ Show Your Support

If you find STUDIQ helpful, please:
- ⭐ **Star the repository** on GitHub
- 🐛 **Report bugs** and suggest features
- 📢 **Share** with friends and colleagues
- 💬 **Leave feedback** and testimonials
- 🤝 **Contribute** code or documentation

---

**Last Updated**: May 2026  
**Maintainer**: Your Name/Team  
**Status**: ✅ Active Development

---

*STUDIQ - Making Learning Intelligent, Personal, and Effective* 🚀📚✨
