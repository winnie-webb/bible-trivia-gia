import { NextRequest, NextResponse } from 'next/server'
import { QUESTION_BANK } from '@/lib/questionBank'

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// Google Gemini generation (FREE tier - 15 requests/min)
async function generateWithGemini(difficulty: string, category: string, count: number) {
  if (!GEMINI_API_KEY) {
    console.log('No Gemini API key, skipping')
    return null
  }

  const categoryPrompt = category && category !== 'mixed' 
    ? `Focus on ${category.replace('_', ' ')} content.` 
    : 'Cover various biblical topics.'

  const prompt = `Generate ${count} Bible trivia questions at ${difficulty} difficulty. ${categoryPrompt}

Return ONLY valid JSON array (no markdown, no explanation):
[
  {
    "question": "Question text?",
    "options": ["A", "B", "C", "D"],
    "correct_index": 0,
    "difficulty": "${difficulty}",
    "category": "${category || 'Mixed'}"
  }
]`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          }
        })
      }
    )

    if (!response.ok) {
      console.error('Gemini API error:', response.status)
      return null
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    const jsonMatch = text.match(/\[[\s\S]*\]/)?.[0]
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch)
      return questions.slice(0, count)
    }
    
    return null
  } catch (error) {
    console.error('Gemini generation error:', error)
    return null
  }
}

// Hugging Face generation
async function generateWithHuggingFace(difficulty: string, category: string, count: number) {
  if (!HF_API_KEY) {
    console.log('No Hugging Face API key, skipping')
    return null
  }

  const categoryPrompt = category && category !== 'mixed' 
    ? `Focus on ${category.replace('_', ' ')}.` 
    : 'Cover various biblical topics.'

  const prompt = `Generate ${count} Bible trivia questions at ${difficulty} difficulty level. ${categoryPrompt}

Return ONLY a valid JSON array with this exact format:
[
  {
    "question": "Question text?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correct_index": 0,
    "difficulty": "${difficulty}",
    "category": "${category || 'Mixed'}"
  }
]`

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 2000,
            temperature: 0.7,
            return_full_text: false
          }
        })
      }
    )

    if (!response.ok) {
      console.error('HF API error:', response.status)
      return null
    }

    const data = await response.json()
    const text = data[0]?.generated_text || ''
    
    const jsonMatch = text.match(/\[[\s\S]*\]/)?.[0]
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch)
      return questions.slice(0, count)
    }
    
    return null
  } catch (error) {
    console.error('Hugging Face generation error:', error)
    return null
  }
}

// Fallback: Get questions from bank
function getQuestionsFromBank(difficulty: string, category: string, count: number) {
  const cat = category === 'mixed' ? null : category
  const diff = difficulty === 'mixed' ? null : difficulty
  
  let availableQuestions: any[] = []

  if (difficulty === 'mixed') {
    const easyCount = Math.floor(count * 0.3)
    const mediumCount = Math.floor(count * 0.4)
    const hardCount = count - easyCount - mediumCount

    availableQuestions = [
      ...getQuestionsFromBank('easy', category, easyCount),
      ...getQuestionsFromBank('medium', category, mediumCount),
      ...getQuestionsFromBank('hard', category, hardCount)
    ]
    
    return availableQuestions.sort(() => Math.random() - 0.5)
  }

  if (cat && QUESTION_BANK[cat as keyof typeof QUESTION_BANK]) {
    const categoryBank = QUESTION_BANK[cat as keyof typeof QUESTION_BANK]
    if (diff && categoryBank[diff as keyof typeof categoryBank]) {
      availableQuestions = [...categoryBank[diff as keyof typeof categoryBank]]
    } else {
      availableQuestions = [
        ...(categoryBank.easy || []),
        ...(categoryBank.medium || []),
        ...(categoryBank.hard || [])
      ]
    }
  } else {
    Object.values(QUESTION_BANK).forEach(categoryBank => {
      if (diff && categoryBank[diff as keyof typeof categoryBank]) {
        availableQuestions.push(...categoryBank[diff as keyof typeof categoryBank])
      } else {
        availableQuestions.push(...(categoryBank.easy || []))
        availableQuestions.push(...(categoryBank.medium || []))
        availableQuestions.push(...(categoryBank.hard || []))
      }
    })
  }

  const shuffled = availableQuestions.sort(() => Math.random() - 0.5)
  
  const questions = []
  for (let i = 0; i < count; i++) {
    questions.push(shuffled[i % shuffled.length])
  }
  
  return questions
}

export async function POST(request: NextRequest) {
  try {
    const { difficulty, category, count } = await request.json()

    console.log(`Generating ${count} questions: ${difficulty} difficulty, ${category} category`)

    let questions = null

    // Try Gemini first
    if (GEMINI_API_KEY) {
      console.log('Trying Gemini API...')
      questions = await generateWithGemini(difficulty, category || 'mixed', count)
      if (questions && questions.length > 0) {
        console.log(`✓ Generated ${questions.length} questions with Gemini`)
        return NextResponse.json({ questions, provider: 'gemini' })
      }
    }

    // Try Hugging Face
    if (HF_API_KEY && !questions) {
      console.log('Trying Hugging Face API...')
      questions = await generateWithHuggingFace(difficulty, category || 'mixed', count)
      if (questions && questions.length > 0) {
        console.log(`✓ Generated ${questions.length} questions with Hugging Face`)
        return NextResponse.json({ questions, provider: 'huggingface' })
      }
    }

    // Fallback to question bank
    console.log('Using fallback question bank')
    questions = getQuestionsFromBank(difficulty, category || 'mixed', count)
    console.log(`✓ Generated ${questions.length} questions from bank`)

    return NextResponse.json({ questions, provider: 'fallback' })
  } catch (error) {
    console.error('Generate questions error:', error)
    
    const fallbackQuestions = getQuestionsFromBank('mixed', 'mixed', 10)
    return NextResponse.json({ 
      questions: fallbackQuestions,
      provider: 'emergency_fallback' 
    })
  }
}
