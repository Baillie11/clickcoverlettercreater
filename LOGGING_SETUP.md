# Logging Setup Instructions

## Quick Setup

Add these lines to your `server.js` to enable comprehensive logging:

### 1. Add logger import (after line 13)

```javascript
const { logger, requestLogger, errorLogger } = require('./logger');
```

### 2. Add logging middleware (after line 256, after `app.use(express.json({ limit: '1mb' }))`)

```javascript
// Add logging middleware
app.use(requestLogger);
```

### 3. Add logging to AI generate endpoint (line 1121+)

Replace the existing `/api/generate-paragraphs` route with this version that includes logging:

```javascript
app.post('/api/generate-paragraphs', async (req, res) => {
  const auth = await getUserFromAuth(req);
  if (!auth) {
    logger.warn('AI generate: Unauthorized');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  logger.userAction(auth.user.id, 'AI_GENERATE_START', { 
    hasProfile: !!req.body.profile, 
    hasResume: !!req.body.resumeText,
    jobAdLength: req.body.jobAdText?.length 
  });
  
  if (aiQuotaExceeded) {
    logger.warn('AI quota exceeded', { userId: auth.user.id });
    return res.status(503).json({
      error: 'AI features temporarily unavailable',
      quotaExceeded: true,
      message: 'OpenAI quota has been exceeded. AI features are currently disabled.'
    });
  }
  
  const { jobAdText, profile, resumeText } = req.body || {};
  if (!jobAdText) {
    logger.warn('Missing jobAdText', { userId: auth.user.id });
    return res.status(400).json({ error: 'Missing jobAdText' });
  }
  
  try {
    logger.apiCall('OpenAI', 'extract', { userId: auth.user.id });
    
    // Step 1: Extract job information
    const extractCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts structured information from job advertisements. Return your response as valid JSON only.'
        },
        {
          role: 'user',
          content: `Extract the following information from this job ad and return it as JSON with these exact keys: "roleTitle", "companyName", "contactPerson", "reference", "businessAddress". If any field is not found, use null.\n\nJob Ad:\n${jobAdText}`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    const extracted = JSON.parse(extractCompletion.choices[0].message.content);
    logger.info('Extraction complete', { userId: auth.user.id, extracted });
    
    // Step 2: Generate targeted responses for job criteria
    const profileInfo = profile ? `\n\nCandidate Profile:\nName: ${profile.firstName} ${profile.lastName}\nIndustry: ${profile.industry || 'Not specified'}\nKey Skills: ${profile.keywords?.join(', ') || 'Not specified'}` : '';
    const resumeInfo = resumeText ? `\n\nCandidate Resume:\n${resumeText}` : '';
    
    logger.apiCall('OpenAI', 'generate', { userId: auth.user.id });
    
    const generateCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert cover letter writer. Analyze job requirements and generate multiple tailored paragraphs addressing specific criteria. Each paragraph should be professional, specific, and compelling.'
        },
        {
          role: 'user',
          content: `Based on this job advertisement, the candidate's profile, and their resume, generate separate paragraphs for each key requirement or criterion mentioned in the job ad. Each paragraph should address a specific aspect (skills, experience, qualifications, motivation, etc.).${profileInfo}${resumeInfo}\n\nJob Ad:\n${jobAdText}\n\nReturn your response as JSON with this structure:\n{\n  "jobInfo": { "roleTitle": string, "companyName": string, "contactPerson": string, "reference": string, "businessAddress": string },\n  "responses": [\n    { "text": "paragraph text", "tag": "appropriate tag like Introduction, Skills, Experience, Motivation, etc." }\n  ]\n}\n\nGenerate 4-8 targeted paragraphs covering: Introduction, relevant Skills/Experience for each major requirement, Why this company/role, and Closing.`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });
    
    const result = JSON.parse(generateCompletion.choices[0].message.content);
    
    // Merge extracted job info with generated responses
    result.jobInfo = { ...extracted, ...result.jobInfo };
    
    logger.userAction(auth.user.id, 'AI_GENERATE_SUCCESS', { responseCount: result.responses?.length });
    
    res.json(result);
  } catch (e) {
    logger.error('AI generation failed', e, { 
      userId: auth.user.id, 
      status: e.status, 
      code: e.code,
      message: e.message
    });
    
    if (e.status === 429 && e.code === 'insufficient_quota') {
      aiQuotaExceeded = true;
      aiQuotaExceededAt = new Date().toISOString();
      return res.status(503).json({
        error: 'AI quota exceeded',
        quotaExceeded: true,
        message: 'OpenAI quota has been exceeded. AI features are now disabled for all users.'
      });
    }
    
    // Return more detailed error message
    const errorMessage = e.message || 'Failed to generate paragraphs';
    res.status(500).json({ error: errorMessage });
  }
});
```

## What Gets Logged

After setup, the following will be logged to files in the `logs/` directory:

- **access-YYYY-MM-DD.log** - All HTTP requests and responses
- **app-YYYY-MM-DD.log** - General application info and warnings
- **error-YYYY-MM-DD.log** - All errors with stack traces
- **api-YYYY-MM-DD.log** - External API calls (OpenAI)
- **user-actions-YYYY-MM-DD.log** - User actions (login, AI generate, etc.)

## Viewing Logs on Live Server

1. Upload `logger.js` to your live server
2. Apply the changes to `server.js` as described above
3. Restart the Node.js server
4. SSH/FTP into your server and check the `logs/` directory
5. Use `tail -f logs/error-*.log` to watch errors in real-time

## Alternative: Simple Console Logging

If you can't modify server.js easily, just wrap the entire try-catch in the AI endpoint with console.log statements that will appear in your server logs.
