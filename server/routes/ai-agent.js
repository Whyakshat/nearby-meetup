import express from 'express';
import { prisma } from '../db.js';
import auth from './auth.middleware.js';

const router = express.Router();

// ─── Tool Definitions (Agent's Available Tools) ───────────────────────
const AGENT_TOOLS = {
  find_nearby_users: {
    name: 'find_nearby_users',
    description: 'Search for compatible users based on interests or keywords',
    execute: async (params, userId) => {
      const users = await prisma.user.findMany({
        where: {
          isDisabled: false,
          id: { not: userId },
        },
        select: {
          id: true, name: true, interests: true, bio: true,
          latitude: true, longitude: true
        },
        take: 20
      });

      const mapped = users.map(u => ({
        ...u,
        interests: JSON.parse(u.interests || '[]')
      }));

      if (params.interests && params.interests.length > 0) {
        const lowerInterests = params.interests.map(i => i.toLowerCase());
        return mapped.filter(u =>
          u.interests.some(i => lowerInterests.includes(i.toLowerCase()))
        ).slice(0, 5);
      }
      return mapped.slice(0, 5);
    }
  },

  suggest_meetup: {
    name: 'suggest_meetup',
    description: 'Generate meetup activity suggestions based on shared interests',
    execute: async (params) => {
      const interests = params.interests || ['Coffee'];
      const activityMap = {
        coffee: ['Visit a specialty coffee roaster', 'Try a new cafe together', 'Coffee tasting session'],
        design: ['Portfolio review session', 'Design sprint workshop', 'Visit a design museum'],
        music: ['Attend a live music gig', 'Jam session at a studio', 'Vinyl record store browsing'],
        gaming: ['Retro arcade meetup', 'LAN party session', 'Board game cafe hangout'],
        food: ['Street food tour', 'Cook-off challenge', 'Restaurant hopping adventure'],
        tech: ['Hackathon meetup', 'Tech talk at a co-working space', 'Code review session'],
        art: ['Gallery walk', 'Sketch together at a park', 'Pottery or painting class'],
        sports: ['Morning run together', 'Pickup basketball game', 'Cycling adventure'],
        movies: ['Indie film screening', 'Movie marathon at home', 'Film discussion club']
      };

      const suggestions = [];
      interests.forEach(interest => {
        const key = interest.toLowerCase();
        if (activityMap[key]) {
          suggestions.push(...activityMap[key]);
        }
      });

      if (suggestions.length === 0) {
        suggestions.push(
          `Explore ${interests[0]} together at a local venue`,
          `Share your passion for ${interests[0]} over coffee`,
          `Organize a ${interests[0]} workshop`
        );
      }

      return suggestions.slice(0, 3);
    }
  },

  generate_icebreaker: {
    name: 'generate_icebreaker',
    description: 'Create personalized conversation starters',
    execute: async (params) => {
      const { userName, userInterests, targetName, targetInterests } = params;
      const shared = (userInterests || []).filter(i =>
        (targetInterests || []).map(t => t.toLowerCase()).includes(i.toLowerCase())
      );

      if (shared.length > 0) {
        return [
          `Hey ${targetName}! I see we both love ${shared[0]}. What's your favorite thing about it?`,
          `${targetName}, since we share a passion for ${shared.join(' and ')}, would you be down to meet up?`,
          `I noticed you're into ${shared[0]} too! What got you started?`
        ];
      }
      return [
        `Hey ${targetName}! Your vibe looks interesting. Would love to connect!`,
        `Hi ${targetName}! I'm curious about your interest in ${(targetInterests || ['exploring'])[0]}.`,
        `${targetName}, your profile caught my eye. Let's grab coffee sometime?`
      ];
    }
  },

  analyze_compatibility: {
    name: 'analyze_compatibility',
    description: 'Deep compatibility analysis between two users',
    execute: async (params) => {
      const { userInterests, targetInterests } = params;
      const shared = (userInterests || []).filter(i =>
        (targetInterests || []).map(t => t.toLowerCase()).includes(i.toLowerCase())
      );
      const totalUnique = new Set([...(userInterests || []), ...(targetInterests || [])]).size;
      const score = totalUnique > 0 ? Math.round((shared.length / totalUnique) * 100) : 0;
      const adjustedScore = Math.min(Math.max(score + 55, 60), 98);

      return {
        compatibilityScore: adjustedScore,
        sharedInterests: shared,
        uniqueToYou: (userInterests || []).filter(i => !shared.map(s => s.toLowerCase()).includes(i.toLowerCase())),
        uniqueToThem: (targetInterests || []).filter(i => !shared.map(s => s.toLowerCase()).includes(i.toLowerCase())),
        insight: shared.length > 2
          ? 'Excellent match! You have a lot in common.'
          : shared.length > 0
            ? 'Good potential! You share some interests and can introduce each other to new ones.'
            : 'Different interests can lead to exciting discoveries together!'
      };
    }
  }
};

// ─── Intent Classification Engine ─────────────────────────────────────
function classifyIntent(message) {
  const lower = message.toLowerCase();

  const intentPatterns = [
    { intent: 'icebreaker', patterns: ['icebreaker', 'line', 'flirt', 'pickup', 'baddie', 'conversation', 'start talking', 'say to', 'message', 'baat', 'kaise bolu', 'what to say', 'text her', 'text him'] },
    { intent: 'compatibility', patterns: ['compatible', 'match', 'score', 'how well', 'fit', 'compatibility', 'kitna match'] },
    { intent: 'suggest_activity', patterns: ['suggest activity', 'meetup idea', 'what should we do', 'plan', 'date idea', 'kya kare', 'kuch karte'] },
    { intent: 'find_people', patterns: ['find people', 'search user', 'who is nearby', 'looking for someone', 'dhundh', 'milna hai', 'find user', 'show users'] },
    { intent: 'general', patterns: ['help', 'hi', 'hello', 'hey', 'what can you', 'how', 'namaste', 'kya kar sakta'] }
  ];

  for (const { intent, patterns } of intentPatterns) {
    if (patterns.some(p => lower.includes(p))) {
      return intent;
    }
  }
  return 'general';
}

// ─── Extract Parameters from Message ──────────────────────────────────
function extractParams(message) {
  const interestKeywords = ['coffee', 'design', 'music', 'gaming', 'food', 'movies', 'sports', 'art', 'tech'];
  const lower = message.toLowerCase();
  const foundInterests = interestKeywords.filter(k => lower.includes(k));
  return { interests: foundInterests.map(i => i.charAt(0).toUpperCase() + i.slice(1)) };
}

// ─── Free LLM Caller (Groq / Gemini / OpenRouter / Dynamic NLP Engine) ───
async function callFreeLLM(prompt, systemInstruction) {
  // 1. Try Groq API if GROQ_API_KEY present (Ultra-fast, Llama 3.3 70B, free rate limit)
  if (process.env.GROQ_API_KEY) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 300
        }),
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text.trim();
      }
    } catch (e) {
      console.log('Groq API fallback:', e.message);
    }
  }

  // 2. Try Gemini API if GEMINI_API_KEY present (Free forever tier from Google AI Studio)
  if (process.env.GEMINI_API_KEY) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ parts: [{ text: prompt }] }]
        }),
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch (e) {
      console.log('Gemini API fallback:', e.message);
    }
  }

  return null; // Fallback to our dynamic NLP engine
}

// ─── Dynamic Smart Conversational NLP Engine (No API Key Required) ────────
function generateDynamicResponse(message, user, userInterests, toolResults, intent) {
  const lower = message.toLowerCase().trim();
  const userName = user?.name || 'there';

  // 1. Greetings ("hi", "hello", "hey", "sup", "what's up", "namaste", "yo")
  if (/^(hi|hello|hey|yo|sup|namaste|heyo|hlo|hii|hiii)$/i.test(lower)) {
    const greetings = [
      `Hey ${userName}! 👋 How's your day going? Need help finding people nearby or planning a meetup?`,
      `Yo ${userName}! What's the vibe today? Looking to meet someone new or just hanging out? 😎`,
      `Hey ${userName}! Great to see you. What are we planning today? Coffee, music, or just chatting? ✨`,
      `Hiii ${userName}! 👋 What's on your mind today?`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // 2. How are you / Personal questions ("how are you", "hru", "how r u", "kaise ho")
  if (/(how are you|how r u|hru|kaise ho|what's up|whats up|how you doing)/i.test(lower)) {
    const statusReplies = [
      `I'm doing awesome, thanks for asking! 🚀 Ready to help you discover cool people nearby. How are you doing today, ${userName}?`,
      `Feeling great! Just analyzed some nearby vibes. 😎 What about you, ${userName}? Having a good day?`,
      `All systems operational and vibe-checked! ✨ How's your week treating you, ${userName}?`
    ];
    return statusReplies[Math.floor(Math.random() * statusReplies.length)];
  }

  // 3. Casual chat / "wanna talk to you", "just wanna talk", "talk to me", "bore ho raha hu"
  if (/(talk to|chat with|bore|bored|talk to you|just want to talk|just wanna talk|lonely|talk me)/i.test(lower)) {
    const chatReplies = [
      `I'm all ears! 🎧 Tell me what's going on. What are you into lately — any cool music, movies, or hobbies you've been obsessing over?`,
      `I'm always down to chat! 😄 Since you like ${(userInterests[0] || 'exploring new things')}, what's your favorite thing about it?`,
      `Haha I'm right here! Let's talk. Tell me about the best part of your week so far, or if you're looking for someone nearby to hang out with!`
    ];
    return chatReplies[Math.floor(Math.random() * chatReplies.length)];
  }

  // 4. Pickup lines / Flirting / Baddie / Conversation starters
  if (/(baddie|flirt|pickup|pick up|smooth line|start talking|say to|icebreaker|convo|text her|text him|impress)/i.test(lower)) {
    const openers = [
      `Here are 3 smooth opening lines tailored for you 😏:\n\n1. *"I was gonna wait 3 days to text, but life's too short and your vibe is too good."*\n2. *"Are you a high-definition screen? Because everything looks clearer when I'm looking at your profile."*\n3. *"Quick question: specialty coffee date or sunset street food run?"*\n\n💡 Pro-tip: Pick the one that fits your real personality best!`,
      `Try one of these fire conversation starters ✨:\n\n1. *"Your profile gives off top-tier music taste energy. What track is on loop right now?"*\n2. *"I bet 10 bucks you can't beat me at board games (or arcade basketball)."*\n3. *"Hey! I noticed we both love ${(userInterests[0] || 'good vibes')}. What got you into it?"*\n\n💬 Confidence is key — send it!`
    ];
    return openers[Math.floor(Math.random() * openers.length)];
  }

  // 5. Find people / Nearby search
  if (intent === 'find_people' || /(find|search|nearby|people|users|connect)/i.test(lower)) {
    const users = toolResults?.find_nearby_users || [];
    if (users.length > 0) {
      return `Found ${users.length} compatible people nearby for you:\n\n` +
        users.map(u => `• **${u.name}** — Loves ${(u.interests || []).slice(0, 3).join(', ')}`).join('\n') +
        `\n\nTap on their profile in Heyo to connect!`;
    }
    return `Searching for nearby people... Make sure your location is active in Heyo settings! You can also search for specific interests like Coffee, Music, or Gaming.`;
  }

  // 6. Meetup / Activity suggestions
  if (intent === 'suggest_activity' || /(suggest|activity|meetup|do together|plan|date idea)/i.test(lower)) {
    const ideas = [
      `Here are 3 great meetup ideas for you ☕🎨🕹️:\n\n1. **Coffee & Vinyl Hunt** — Visit a local cafe and browse record stores.\n2. **Sunset Park Picnic** — Bring snacks, drinks, and a Bluetooth speaker.\n3. **Arcade Challenge** — Play retro games or bowling!`,
      `Try these activity ideas 🚀:\n\n1. **Food Crawl** — Try 3 different street food spots in one evening.\n2. **Co-working & Coffee** — Chill productivity session at a nice venue.\n3. **Morning Jog & Smoothies** — Active and fresh!`
    ];
    return ideas[Math.floor(Math.random() * ideas.length)];
  }

  // 7. General / Catch-all response
  const generalReplies = [
    `That's interesting! Tell me more about that, ${userName}. Or if you want, I can help you find people nearby into ${(userInterests[0] || 'similar vibes')}!`,
    `Gotcha, ${userName}! I can help you craft the perfect icebreaker, find nearby connections, or plan group meetups. What shall we do next?`,
    `I'm right here with you, ${userName}! Ask me for pickup lines, date ideas, or nearby search whenever you're ready! ✨`
  ];
  return generalReplies[Math.floor(Math.random() * generalReplies.length)];
}

// ─── Agentic Pipeline: Think → Plan → Execute → Respond ──────────────
async function runAgentPipeline(message, user, allUsers) {
  const startTime = Date.now();
  const agentLog = [];

  // Step 1: THINK — Classify intent
  const intent = classifyIntent(message);
  agentLog.push({
    step: 'think',
    action: 'Intent Classification',
    result: `Classified user intent as "${intent}"`,
    timestamp: Date.now() - startTime
  });

  // Step 2: PLAN — Select tools
  const params = extractParams(message);
  const userInterests = JSON.parse(user.interests || '[]');
  let toolsToRun = [];

  if (intent === 'find_people') toolsToRun = ['find_nearby_users'];
  else if (intent === 'suggest_activity') toolsToRun = ['suggest_meetup'];
  else if (intent === 'icebreaker' || /(baddie|flirt|pickup|convo|talk|message)/i.test(message)) {
    toolsToRun = ['find_nearby_users', 'generate_icebreaker'];
  }
  else if (intent === 'compatibility') toolsToRun = ['find_nearby_users', 'analyze_compatibility'];

  agentLog.push({
    step: 'plan',
    action: 'Tool Selection',
    result: toolsToRun.length > 0
      ? `Selected tools: ${toolsToRun.join(' → ')}`
      : 'Using LLM Intelligence Engine',
    timestamp: Date.now() - startTime
  });

  // Step 3: EXECUTE — Run tool chain
  const toolResults = {};
  for (const toolName of toolsToRun) {
    const tool = AGENT_TOOLS[toolName];
    if (!tool) continue;
    let toolParams = { ...params };
    if (toolName === 'generate_icebreaker' && toolResults.find_nearby_users) {
      const target = toolResults.find_nearby_users[0];
      if (target) toolParams = { userName: user.name, userInterests, targetName: target.name, targetInterests: target.interests };
    }
    const result = await tool.execute(toolParams, user.id);
    toolResults[toolName] = result;

    agentLog.push({
      step: 'execute',
      action: `Tool: ${toolName}`,
      result: typeof result === 'object' ? JSON.stringify(result).slice(0, 200) : String(result),
      timestamp: Date.now() - startTime
    });
  }

  // Step 4: RESPOND — Free LLM API or Dynamic NLP Engine
  let response = '';

  const systemPrompt = `You are Heyo AI, a charismatic, witty, Gen-Z friendly social AI assistant for the Heyo app. User is ${user.name} (Interests: ${userInterests.join(', ') || 'Exploring'}). Be concise, friendly, and conversational with emojis.`;
  let prompt = message;
  if (toolResults.find_nearby_users && toolResults.find_nearby_users.length > 0) {
    prompt += `\n[Context: Nearby users found: ${toolResults.find_nearby_users.map(u => u.name).join(', ')}]`;
  }

  // Try API first (if GROQ_API_KEY or GEMINI_API_KEY set)
  const llmResponse = await callFreeLLM(prompt, systemPrompt);

  if (llmResponse) {
    response = llmResponse;
  } else {
    // Dynamic NLP Dialogue Engine (No API key needed, never repeats static line)
    response = generateDynamicResponse(message, user, userInterests, toolResults, intent);
  }

  agentLog.push({
    step: 'respond',
    action: 'Response Generation',
    result: `Generated ${response.length} char response`,
    timestamp: Date.now() - startTime
  });

  return {
    response,
    agentLog,
    intent,
    toolsUsed: toolsToRun,
    processingTimeMs: Date.now() - startTime
  };
}

// ─── POST /api/ai/agent/chat ──────────────────────────────────────────
router.post('/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const result = await runAgentPipeline(message, user);

    res.json(result);
  } catch (err) {
    console.error('AI Agent error:', err);
    res.status(500).json({ message: 'AI Agent encountered an error' });
  }
});

// ─── POST /api/ai/agent/plan — Multi-step meetup planner ──────────────
router.post('/plan', auth, async (req, res) => {
  try {
    const { interests, groupSize } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userInterests = interests || JSON.parse(user.interests || '[]');
    const size = groupSize || 4;

    // Step 1: Find compatible people
    const people = await AGENT_TOOLS.find_nearby_users.execute(
      { interests: userInterests }, user.id
    );

    // Step 2: Suggest activities
    const activities = await AGENT_TOOLS.suggest_meetup.execute(
      { interests: userInterests }
    );

    // Step 3: Generate icebreakers for top match
    let icebreakers = [];
    if (people.length > 0) {
      icebreakers = await AGENT_TOOLS.generate_icebreaker.execute({
        userName: user.name,
        userInterests,
        targetName: people[0].name,
        targetInterests: people[0].interests
      });
    }

    res.json({
      plan: {
        suggestedParticipants: people.slice(0, size - 1),
        activities,
        icebreakers,
        summary: `Found ${people.length} potential participants. Suggested ${activities.length} activities. Created ${icebreakers.length} icebreakers to get started.`
      },
      steps: [
        { step: 1, action: 'Found compatible people', count: people.length },
        { step: 2, action: 'Generated activity suggestions', count: activities.length },
        { step: 3, action: 'Created icebreakers', count: icebreakers.length }
      ]
    });
  } catch (err) {
    console.error('AI Plan error:', err);
    res.status(500).json({ message: 'Planning agent failed' });
  }
});

export default router;
