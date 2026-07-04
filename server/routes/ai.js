import express from 'express';
import { prisma } from '../db.js';
import auth from './auth.middleware.js';
import fs from 'fs/promises';

const router = express.Router();
const MODEL_PATH = new URL('../data/ai_model.json', import.meta.url);

// Helper to regex strip emojis from generated text
const stripEmojis = (text) => {
  return text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();
};

// Safe helper to read model file
const readModel = async () => {
  try {
    const data = await fs.readFile(MODEL_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading AI model:', err);
    return { interestAffinities: {}, wordAssociations: {}, successfulMatchesCount: 0 };
  }
};

// Safe helper to write model file
const writeModel = async (model) => {
  try {
    await fs.writeFile(MODEL_PATH, JSON.stringify(model, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing AI model:', err);
  }
};

// Public model training hook
export const trainInterestAffinity = async (interestsA, interestsB) => {
  if (!Array.isArray(interestsA) || !Array.isArray(interestsB)) return;
  const model = await readModel();
  
  let updated = false;
  interestsA.forEach(a => {
    interestsB.forEach(b => {
      if (a === b) return;
      const key1 = `${a.toLowerCase()}_${b.toLowerCase()}`;
      const key2 = `${b.toLowerCase()}_${a.toLowerCase()}`;
      
      const currentVal = model.interestAffinities[key1] || model.interestAffinities[key2] || 0.3;
      const newVal = Math.min(currentVal + 0.05, 0.99);
      
      model.interestAffinities[key1] = newVal;
      model.interestAffinities[key2] = newVal;
      updated = true;
    });
  });

  if (updated) {
    model.successfulMatchesCount += 1;
    await writeModel(model);
    console.log(`[AI Engine] Model successfully self-trained on connection. Total matches: ${model.successfulMatchesCount}`);
  }
};

// Dynamic training from search queries / tags
export const trainWordAssociation = async (word, interest) => {
  if (!word || !interest) return;
  const model = await readModel();
  const cleanWord = word.toLowerCase().trim();
  if (cleanWord.length > 2 && !model.wordAssociations[cleanWord]) {
    model.wordAssociations[cleanWord] = interest;
    await writeModel(model);
    console.log(`[AI Engine] Word Association Trained: "${cleanWord}" -> ${interest}`);
  }
};

// POST /api/ai/match-score
router.post('/match-score', auth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ message: 'Target user ID required' });
    }

    const userA = await prisma.user.findUnique({ where: { id: req.user.id } });
    const userB = await prisma.user.findUnique({ where: { id: targetUserId } });

    if (!userA || !userB) {
      return res.status(404).json({ message: 'User not found' });
    }

    const interestsA = JSON.parse(userA.interests || '[]');
    const interestsB = JSON.parse(userB.interests || '[]');

    const commonInterests = interestsA.filter(i => interestsB.includes(i));
    
    // Load model
    const model = await readModel();
    
    // Calculate affinity sums
    let totalAffinity = 0;
    let comparisons = 0;

    interestsA.forEach(a => {
      interestsB.forEach(b => {
        const key = `${a.toLowerCase()}_${b.toLowerCase()}`;
        const affinity = model.interestAffinities[key] || 0.3;
        totalAffinity += affinity;
        comparisons++;
      });
    });

    const averageAffinity = comparisons > 0 ? (totalAffinity / comparisons) : 0.3;
    
    // Score scaling: baseline 60% + overlaps & affinities up to 98%
    let score = 60 + Math.round(averageAffinity * 30);
    if (commonInterests.length > 0) {
      score += Math.min(commonInterests.length * 4, 8);
    }
    score = Math.min(Math.max(score, 65), 98);

    // Dynamic insights without emojis
    let insight = '';
    if (commonInterests.length > 0) {
      insight = `You both share interests in ${commonInterests.join(', ')}. Based on match history, your profiles show excellent compatibility.`;
    } else if (comparisons > 0) {
      insight = `Though you have different hobbies, your active tags suggest a complementary connection. A great opportunity to explore new topics together.`;
    } else {
      insight = `Your profiles show a clean slate. Meet up to find common ground and introduce each other to your favorite activities.`;
    }

    res.json({
      score,
      commonInterests,
      insight: stripEmojis(insight)
    });
  } catch (err) {
    console.error('Match score error:', err);
    res.status(500).json({ message: 'Server error calculating match score' });
  }
});

// POST /api/ai/suggest-activity
router.post('/suggest-activity', auth, async (req, res) => {
  try {
    const { interests } = req.body;
    const selectedInterests = Array.isArray(interests) && interests.length > 0 ? interests : ['Coffee'];

    const activities = [];
    const lowerInterests = selectedInterests.map(i => i.toLowerCase());

    if (lowerInterests.includes('coffee') && lowerInterests.includes('design')) {
      activities.push('Visit a modern gallery cafe to sketch logo concepts and talk about visual trends');
      activities.push('Explore a boutique espresso bar and review each other\'s design portfolios');
    }
    if (lowerInterests.includes('tech') || lowerInterests.includes('gaming')) {
      activities.push('Check out a local esports zone or retro arcade cafe for a casual gaming session');
      activities.push('Meet up at a tech hub workspace to share code repositories and discuss projects');
    }
    if (lowerInterests.includes('music') || lowerInterests.includes('art')) {
      activities.push('Attend an acoustic live music session or visit an independent art gallery exhibition');
      activities.push('Browse a classic vinyl record store together followed by a walk in the art district');
    }

    // Fallback activities if specific combos don\'t match
    if (activities.length < 3) {
      const primary = selectedInterests[0];
      activities.push(`Plan a walk around the neighborhood to discuss your passion for ${primary}`);
      activities.push(`Meet at a quiet library or community garden to share tips about ${primary}`);
      activities.push(`Gather at a local central venue to network with others interested in ${primary}`);
    }

    res.json({
      activities: activities.slice(0, 3).map(stripEmojis)
    });
  } catch (err) {
    console.error('Suggest activity error:', err);
    res.status(500).json({ message: 'Server error suggesting activity' });
  }
});

// POST /api/ai/icebreakers
router.post('/icebreakers', auth, async (req, res) => {
  try {
    const { interests } = req.body;
    const items = Array.isArray(interests) && interests.length > 0 ? interests : ['Coffee'];
    
    const icebreakers = [
      `Hey! I noticed you are interested in ${items[0]}. What got you started with that?`,
      `Since we both share a passion for ${items[0]}, what is your favorite spot in the city for it?`,
      `Hey there! If you had to recommend one book, game, or project related to ${items[0]}, what would it be?`
    ];

    res.json({
      icebreakers: icebreakers.map(stripEmojis)
    });
  } catch (err) {
    console.error('Icebreakers error:', err);
    res.status(500).json({ message: 'Server error generating icebreakers' });
  }
});

// POST /api/ai/generate-bio
router.post('/generate-bio', auth, async (req, res) => {
  try {
    const { name, interests, style } = req.body;
    const items = Array.isArray(interests) && interests.length > 0 ? interests : ['Coffee'];
    const isProfessional = style === 'professional';

    let bio = '';
    if (isProfessional) {
      bio = `Hi, I'm ${name || 'User'}. I focus on ${items.slice(0, 3).join(' and ')}. Always interested in networking with like-minded creators, developers, and designers around the city to build great things.`;
    } else {
      bio = `Hey, I'm ${name || 'User'}! I spend most of my time exploring ${items.slice(0, 2).join(' & ')}. Down to meet up for a casual session or discuss projects around town. Let's connect!`;
    }

    res.json({
      bio: stripEmojis(bio)
    });
  } catch (err) {
    console.error('Generate bio error:', err);
    res.status(500).json({ message: 'Server error generating bio' });
  }
});

// POST /api/ai/moderate
router.post('/moderate', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.json({ allowed: true });

    const toxicWords = ['spam', 'abuse', 'hack', 'scam', 'offensive', 'fuck', 'bitch', 'asshole'];
    const cleanText = text.toLowerCase();
    
    const containsToxic = toxicWords.some(word => cleanText.includes(word));
    if (containsToxic) {
      return res.json({
        allowed: false,
        message: 'Content contains flagged words. Please keep your communication respectful and secure.'
      });
    }

    res.json({ allowed: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error during moderation' });
  }
});

// POST /api/ai/semantic-search
router.post('/semantic-search', auth, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.json({ matchedInterests: [] });

    const model = await readModel();
    const tokens = query.toLowerCase().split(/\s+/);
    const matchedInterests = new Set();

    tokens.forEach(token => {
      const match = model.wordAssociations[token];
      if (match) {
        matchedInterests.add(match);
      }
    });

    res.json({
      matchedInterests: Array.from(matchedInterests)
    });
  } catch (err) {
    console.error('Semantic search error:', err);
    res.status(500).json({ message: 'Server error in semantic search' });
  }
});

export default router;
