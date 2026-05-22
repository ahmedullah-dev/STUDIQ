import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import fetch from "node-fetch";
import compression from "compression";

// Load environment variables with error handling
const envResult = dotenv.config();

if (envResult.error) {
  console.error('⚠️  Error loading .env file:', envResult.error);
  console.log('💡 Make sure you have a .env file in your root directory');
}

// Validate API key on startup
if (!process.env.OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY not found in environment variables!');
  console.log('📝 Please create a .env file with: OPENROUTER_API_KEY=your_key_here');
  console.log('🔗 Get your key from: https://openrouter.ai/keys');
} else {
  console.log('✅ API Key loaded successfully');
}

const app = express();
app.use(compression()); // Add response compression for faster transfers
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Add cache headers for static assets
app.use(express.static("public", {
  maxAge: '1h',
  etag: false
}));

// Rate limiter - increased limits for better UX
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50, // Increased from 15 to 50 requests per minute
  message: 'Too many requests, please try again later.'
});
app.use(limiter);

// Simple cache for generated content (in-memory)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(type, content, params) {
  return `${type}:${content.substring(0, 100)}:${JSON.stringify(params)}`;
}

function getCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, time: Date.now() });
  // Cleanup old entries if cache gets too large
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

// Request queue to prevent rate limiting from too many concurrent requests
class RequestQueue {
  constructor(concurrency = 1, delayMs = 1500) {
    this.concurrency = concurrency;
    this.delayMs = delayMs;
    this.queue = [];
    this.running = 0;
    this.lastRequestTime = 0;
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.concurrency) return;
    if (this.queue.length === 0) return;

    this.running++;
    const { fn, resolve, reject } = this.queue.shift();

    try {
      // Enforce minimum delay between requests
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.delayMs) {
        await new Promise(r => setTimeout(r, this.delayMs - timeSinceLastRequest));
      }

      const result = await fn();
      this.lastRequestTime = Date.now();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      this.running--;
      this.process();
    }
  }
}

const apiQueue = new RequestQueue(1, 2000); // 1 concurrent request, 2 seconds between requests

const WORKING_MODEL = "openai/gpt-oss-120b:free";

// Helper: Call AI with timeout protection and retry logic
async function callAI(prompt, maxTokens = 1000, timeout = 60000, maxRetries = 3) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("API key not configured");
  }

  console.log("Sending prompt to AI:", prompt.substring(0, 50) + "...", `(tokens: ${maxTokens}, timeout: ${timeout}ms)`);

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Use request queue to prevent rate limiting
      const result = await apiQueue.add(async () => {
        let timeoutId;
        try {
          const controller = new AbortController();
          timeoutId = setTimeout(() => controller.abort(), timeout);

          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: WORKING_MODEL,
              messages: [{ role: "user", content: prompt }],
              max_tokens: maxTokens,
              temperature: 0.7,
              top_p: 0.9,
              stream: false,
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          const data = await response.json();

          if (!response.ok) {
            const errMsg = data?.error?.message || data?.error || response.statusText || "Unknown API error";
            const status = response.status;
            const err = new Error(`API Error (${status}): ${errMsg}`);
            err.status = status;
            throw err;
          }

          if (!data.choices || !data.choices[0]?.message?.content) {
            throw new Error("No response from AI");
          }

          return data.choices[0].message.content;
        } finally {
          if (timeoutId) clearTimeout(timeoutId);
        }
      });

      return result;
    } catch (err) {
      lastError = err;
      
      if (err.name === 'AbortError') {
        lastError = new Error(`Request timeout after ${timeout}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      }
      
      if (attempt < maxRetries && (err.name === 'AbortError' || err.message.includes('Failed to fetch') || err.status === 429 || err.status === 503 || err.status === 502)) {
        let delayMs;
        if (err.status === 429) {
          delayMs = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s for rate limits
          console.log(`⚠️  Rate limited (429). Waiting ${delayMs}ms before retry ${attempt + 2}/${maxRetries + 1}...`);
        } else {
          delayMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s for other errors
          console.log(`🔄 Retrying in ${delayMs}ms... (attempt ${attempt + 2}/${maxRetries + 1})`);
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      
      throw lastError;
    }
  }
  
  throw lastError;
}

// Parse quiz JSON
function parseQuizResponse(rawResponse) {
  let cleaned = rawResponse.trim();

  if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/```json\s*|\s*```/g, '').trim();
  }

  const arrayStart = cleaned.indexOf('[');
  const arrayEnd = cleaned.lastIndexOf(']') + 1;

  if (arrayStart === -1 || arrayEnd <= arrayStart) {
    throw new Error("No valid JSON array found in response");
  }

  cleaned = cleaned.substring(arrayStart, arrayEnd);

  try {
    const quizData = JSON.parse(cleaned);
    if (!Array.isArray(quizData)) throw new Error("Response is not an array");
    return quizData;
  } catch (jsonErr) {
    throw new Error("Failed to parse quiz JSON: " + jsonErr.message);
  }
}

// Homepage - Serve index.html
app.get("/", (req, res) => {
  res.sendFile(new URL('./public/index.html', import.meta.url).pathname);
});

// ENHANCED SUMMARIZE ENDPOINT
app.post("/api/summarize", async (req, res) => {
  try {
    const { content, length = 'medium', format = 'paragraph' } = req.body;

    if (!content) return res.status(400).json({ error: "No content provided" });

    // Check cache
    const cacheKey = getCacheKey('summarize', content, { length, format });
    const cached = getCache(cacheKey);
    if (cached) {
      console.log('✓ Returning cached summary');
      return res.json(cached);
    }

    const truncatedContent = content.length > 2500 ? content.substring(0, 2500) + "..." : content;

    const lengthMap = {
      'short': '150 words',
      'medium': '500 words',
      'long': '800 words'
    };

    const formatInstructions = {
      'paragraph': 'Write as flowing paragraphs.',
      'points': 'Write as bullet points with key information.',
      'headings': 'Organize with headings and subheadings.',
      'mixed': 'Use a mix of paragraphs, headings, and bullet points for best clarity.'
    };

    const prompt = `Summarize this text in ${lengthMap[length] || '150 words'} or less. ${formatInstructions[format] || ''} Use simple, clear language suitable for students:

${truncatedContent}

Provide ONLY the summary, no preamble or extra text.`;

    const rawSummary = await callAI(prompt, 300, 45000, 3);

    const summary = rawSummary.trim()
      .replace(/^(Here's|Here is|This is|The following is)\s+(a\s+)?(summary|text|content)[^:]*:\s*/i, '')
      .replace(/^Summary:\s*/i, '')
      .trim();

    const result = { summary };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error("Error generating summary:", err);
    res.status(500).json({ error: "Failed to summarize", details: err.message });
  }
});

// ENHANCED QUIZ ENDPOINT - FIXED
app.post("/api/generateQuiz", async (req, res) => {
  try {
    const { 
      content, 
      count = 10, 
      difficulty = 'medium',
      types = 'mcq,fillblank,truefalse'
    } = req.body;

    if (!content) return res.status(400).json({ error: "No content provided" });

    const requestedCount = Math.min(parseInt(count), 50);
    const truncatedText = content.length > 2500 ? content.substring(0, 2500) + "..." : content;

    // FIX: Strictly validate and filter question types
    const typeArray = types.split(',').map(t => t.trim()).filter(t => ['mcq', 'fillblank', 'truefalse'].includes(t.toLowerCase())).map(t => t.toLowerCase());
    
    if (typeArray.length === 0) {
      return res.status(400).json({ error: "No valid question types provided" });
    }
    
    const difficultyMap = {
      'easy': 'simple, straightforward concepts',
      'medium': 'standard difficulty with moderate depth',
      'hard': 'complex concepts requiring deep understanding'
    };

    // Calculate distribution of question types
    const distribution = {};
    const perType = Math.floor(requestedCount / typeArray.length);
    const remainder = requestedCount % typeArray.length;
    
    typeArray.forEach((type, idx) => {
      distribution[type] = perType + (idx < remainder ? 1 : 0);
    });

    // FIX: MUCH stricter prompt to enforce question type filtering
    const typeDistribution = Object.entries(distribution).map(([type, num]) => `${num} ${type.toUpperCase()}`).join(', ');
    const validTypes = typeArray.map(t => {
      if (t === 'mcq') return 'mcq (Multiple Choice with 4 options)';
      if (t === 'fillblank') return 'fillblank (Fill in the Blank - student fills missing word/phrase)';
      if (t === 'truefalse') return 'truefalse (True/False - exactly 2 options)';
    }).join(', ');

    const prompt = `Create EXACTLY ${requestedCount} quiz questions (${difficultyMap[difficulty]}) from this content.
ONLY generate these question types: ${validTypes}
Distribution: ${typeDistribution}

EXTREMELY IMPORTANT RULES:
1. ONLY use these question types: ${typeArray.map(t => `"${t}"`).join(', ')}
2. Generate EXACTLY the number specified for each type
3. Every question MUST have one of these exact type values: ${typeArray.map(t => `"${t}"`).join(', ')}
4. DO NOT generate any other question types
5. If type is "mcq" or "truefalse", provide options array and correctIndex
6. If type is "fillblank", provide correctAnswer string

Return ONLY valid JSON array with NO extra text or markdown:
[
  {
    "type": "${typeArray[0]}",
    "question": "Question text?",
    "options": ["Option A", "Option B"],
    "correctIndex": 0,
    "hint": "Helpful hint",
    "explanation": "Why this is correct"
  }
]

Content to generate questions from:
${truncatedText}`;

    const tokensPerQuestion = 80;
    const maxTokens = Math.min(1500, 200 + (requestedCount * tokensPerQuestion));
    const timeout = 90000;

    console.log(`\n\uD83D\uDCDD Generating ${requestedCount} questions (${typeArray.join(', ')}), max tokens: ${maxTokens}`);
    const quiz = await callAI(prompt, maxTokens, timeout, 3);
    const quizData = parseQuizResponse(quiz);

    // FIXED: Strict filtering to ONLY include selected question types
    const filtered = quizData
      .filter(q => {
        if (!q.question || !q.type) return false;
        
        // FIX: Only accept questions of selected types
        if (!typeArray.includes(String(q.type).toLowerCase())) {
          console.warn(`Filtered out question with type "${q.type}" - not in selected types`);
          return false;
        }
        
        // Validate based on question type
        q.type = String(q.type).toLowerCase();
        
        if (q.type === 'fillblank') {
          return q.correctAnswer && typeof q.correctAnswer === 'string' && q.correctAnswer.trim().length > 0;
        } else if (q.type === 'truefalse') {
          // Ensure true/false questions have proper options
          if (!Array.isArray(q.options) || q.options.length !== 2) {
            q.options = ["True", "False"];
          }
          return typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 1;
        } else if (q.type === 'mcq') {
          return Array.isArray(q.options) && q.options.length >= 2 && 
                 typeof q.correctIndex === 'number' && 
                 q.correctIndex >= 0 && q.correctIndex < q.options.length;
        }
        
        return false;
      })
      .slice(0, requestedCount)
      .map(q => {
        // Ensure proper formatting for each question type
        const baseQuestion = {
          type: q.type,
          question: String(q.question).trim(),
          hint: q.hint ? String(q.hint).trim() : "Think about the key concepts from the material.",
          explanation: q.explanation ? String(q.explanation).trim() : "Review this topic for better understanding."
        };

        if (q.type === 'fillblank') {
          return {
            ...baseQuestion,
            correctAnswer: String(q.correctAnswer).trim()
          };
        } else {
          // For MCQ and True/False
          return {
            ...baseQuestion,
            options: (q.options || []).map(opt => String(opt).trim()),
            correctIndex: parseInt(q.correctIndex) || 0
          };
        }
      });

    if (filtered.length === 0) {
      throw new Error(`No valid questions generated. Requested types: ${typeArray.join(', ')}, but generated types may not match.`);
    }

    // Log the distribution for debugging
    const typeCounts = {};
    filtered.forEach(q => {
      typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
    });
    console.log("✓ Generated question distribution:", typeCounts);
    console.log("✓ Requested types:", typeArray);

    const result = { questions: filtered };
    res.json(result);

  } catch (err) {
    console.error("Quiz generation error:", err);
    res.status(500).json({ error: "Failed to generate quiz", details: err.message });
  }
});

// ==================== CONCEPT DEPENDENCY MAP ====================
app.post("/api/conceptMap", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "No content provided" });

    const cacheKey = getCacheKey('conceptMap', content, {});
    const cached = getCache(cacheKey);
    if (cached) {
      console.log('✓ Returning cached concept map');
      return res.json(cached);
    }

    const truncatedContent = content.length > 2000 ? content.substring(0, 2000) + "..." : content;

    const prompt = `Analyze this educational content and create a concept dependency graph. Identify key concepts and their prerequisites.

Return ONLY valid JSON (no markdown, no extra text):
{
  "concepts": [
    {
      "id": "concept1",
      "name": "Concept Name",
      "description": "Brief description",
      "level": 1
    }
  ],
  "dependencies": [
    {
      "from": "concept1",
      "to": "concept2",
      "relationship": "requires" or "leads_to"
    }
  ]
}

Content:
${truncatedContent}

Generate 5-8 key concepts with their dependencies.`;

    const mapJson = await callAI(prompt, 400, 45000, 2);
    const mapData = JSON.parse(mapJson.replace(/```json\s*|\s*```/g, '').trim());

    const result = { conceptMap: mapData };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error("Concept map error:", err);
    res.status(500).json({ error: "Failed to generate concept map", details: err.message });
  }
});

// ==================== PERFORMANCE PREDICTOR ====================
// Calculate minimum SEE required for a desired grade based on CIE marks
function calculateMinSEE(cieMarks, desiredGrade, subjectType) {
  // Grading cutoffs for total marks (CIE + SEE) - Theory only
  const gradingRules = {
    S: 90,
    A: 80,
    B: 70,
    C: 60,
    D: 50,
    E: 40,
    F: 0
  };

  const gradeCutoff = gradingRules[desiredGrade];

  if (!gradeCutoff && desiredGrade !== 'F') {
    return { error: `Invalid grade: ${desiredGrade}` };
  }

  // Minimum passing SEE marks for theory: 24 (40% of 60)
  const minSEE = 24;

  // Calculate required SEE
  let seeRequired = gradeCutoff - cieMarks;

  // Apply minimum passing constraint
  if (seeRequired < minSEE) {
    seeRequired = minSEE;
  }

  // Check if achievable (SEE max is 60)
  const achievable = seeRequired <= 60;
  const seeToDisplay = achievable ? seeRequired : 60;

  return {
    cieMarks,
    desiredGrade,
    subjectType: 'Theory',
    minSEERequired: Math.max(minSEE, Math.ceil(seeRequired)),
    totalMarksRequired: gradeCutoff,
    achievable,
    minSEEPassing: minSEE,
    minSEEPassingPercent: '40%'
  };
}

// Calculate minimum marks for all achievable grades
function calculateAllGrades(cieMarks, subjectType) {
  const grades = ['S', 'A', 'B', 'C', 'D', 'E'];
  const results = {};

  for (const grade of grades) {
    const result = calculateMinSEE(cieMarks, grade, subjectType);
    if (!result.error) {
      results[grade] = {
        gradeName: grade,
        seeRequired: result.minSEERequired,
        totalMarks: result.totalMarksRequired,
        achievable: result.achievable
      };
    }
  }

  return results;
}

app.post("/api/predictPerformance", async (req, res) => {
  try {
    const { cieMarks, desiredGrade, subjectType } = req.body;

    if (cieMarks === undefined || !desiredGrade) {
      return res.status(400).json({ error: "Missing required fields: cieMarks, desiredGrade" });
    }

    // Validate CIE marks
    const cieValue = parseFloat(cieMarks);
    if (isNaN(cieValue) || cieValue < 0 || cieValue > 40) {
      return res.status(400).json({ error: "CIE marks must be between 0-40" });
    }

    // Subject type is always Theory
    const finalSubjectType = 'Theory';

    // Calculate for desired grade
    const desiredResult = calculateMinSEE(cieValue, desiredGrade, finalSubjectType);

    if (desiredResult.error) {
      return res.status(400).json({ error: desiredResult.error });
    }

    // Calculate for all grades
    const allGrades = calculateAllGrades(cieValue, finalSubjectType);

    res.json({
      cieMarks: cieValue,
      desiredGrade,
      subjectType: 'Theory',
      seeRequired: desiredResult.minSEERequired,
      totalMarksRequired: desiredResult.totalMarksRequired,
      achievable: desiredResult.achievable,
      message: desiredResult.achievable 
        ? `You need minimum ${desiredResult.minSEERequired}/60 SEE marks for grade ${desiredGrade}`
        : `Grade ${desiredGrade} is not achievable (requires ${Math.ceil(calculateMinSEE(cieValue, desiredGrade, subjectType).minSEERequired - 60)} more marks)`,
      minSEEPassing: desiredResult.minSEEPassing,
      allGrades
    });
  } catch (err) {
    console.error("Performance calculation error:", err);
    res.status(500).json({ error: "Failed to calculate performance requirement", details: err.message });
  }
});

// ==================== VIVA SIMULATOR ====================
app.post("/api/vivaSimulator", async (req, res) => {
  try {
    const { content, count = 5, difficulty = 'medium' } = req.body;
    if (!content) return res.status(400).json({ error: "No content provided" });

    const cacheKey = getCacheKey('viva', content, { count, difficulty });
    const cached = getCache(cacheKey);
    if (cached) {
      console.log('✓ Returning cached viva questions');
      return res.json(cached);
    }

    const truncatedContent = content.length > 2000 ? content.substring(0, 2000) + "..." : content;

    const diffMap = {
      'easy': 'simple, definition-based',
      'medium': 'conceptual and application-based',
      'hard': 'deep analysis and critical thinking'
    };

    const prompt = `Generate ${count} viva exam questions (${diffMap[difficulty] || 'medium difficulty'}) from this content. These are oral exam questions.

Return ONLY valid JSON (no markdown):
[
  {
    "question": "Full question text?",
    "expectedPoints": ["point 1", "point 2", "point 3"],
    "tips": "Tips for answering well",
    "followUp": "Possible follow-up question"
  }
]

Content:
${truncatedContent}

Generate ${count} questions suitable for oral examination.`;

    const vivaJson = await callAI(prompt, 600, 60000, 2);
    const vivaData = JSON.parse(vivaJson.replace(/```json\s*|\s*```/g, '').trim());

    const result = {
      questions: vivaData.slice(0, count).map(q => ({
        question: q.question,
        expectedPoints: q.expectedPoints || [],
        tips: q.tips || "Focus on key concepts",
        followUp: q.followUp || "Can you elaborate?"
      }))
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error("Viva simulator error:", err);
    res.status(500).json({ error: "Failed to generate viva questions", details: err.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Enhanced AI Study Tutor running on port ${PORT}`);
  console.log("Environment check:", { 
    hasApiKey: !!process.env.OPENROUTER_API_KEY,
    model: WORKING_MODEL
  });
});