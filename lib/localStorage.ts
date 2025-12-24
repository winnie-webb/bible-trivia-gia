// LocalStorage utilities for user data and stats

export type UserProfile = {
  userId: string
  username: string
  totalGames: number
  totalWins: number
  totalCorrect: number
  totalQuestions: number
  fastestAnswer: number | null
  currentStreak: number
  bestStreak: number
  unlockedAchievements: string[]
  createdAt: string
}

export type Achievement = {
  key: string
  name: string
  description: string
  icon: string
  requirementType: 'games_played' | 'wins' | 'correct_answers' | 'speed' | 'streak'
  requirementValue: number
  unlockedAt?: string
}

/* =========================
   ACHIEVEMENTS
   ========================= */

export const ACHIEVEMENTS: Achievement[] = [
  // 🧭 Games Played
  { key: 'first_steps', name: 'First Steps of Faith', description: 'Play your first game', icon: '👣', requirementType: 'games_played', requirementValue: 1 },
  { key: 'five_games', name: 'On the Narrow Path', description: 'Play 5 games', icon: '🛤️', requirementType: 'games_played', requirementValue: 5 },
  { key: 'ten_games', name: 'Faithful Servant', description: 'Play 10 games', icon: '🙏', requirementType: 'games_played', requirementValue: 10 },
  { key: 'twenty_five_games', name: 'Steady in the Word', description: 'Play 25 games', icon: '📖', requirementType: 'games_played', requirementValue: 25 },
  { key: 'fifty_games', name: 'Seasoned Disciple', description: 'Play 50 games', icon: '🧔', requirementType: 'games_played', requirementValue: 50 },
  { key: 'hundred_games', name: 'Elder of Wisdom', description: 'Play 100 games', icon: '👴', requirementType: 'games_played', requirementValue: 100 },
  { key: 'three_hundred_games', name: 'Cloud of Witnesses', description: 'Play 300 games', icon: '☁️', requirementType: 'games_played', requirementValue: 300 },

  // 🏆 Wins
  { key: 'first_win', name: 'David vs. Goliath', description: 'Win your first game', icon: '🗿', requirementType: 'wins', requirementValue: 1 },
  { key: 'three_wins', name: 'Stone from the Sling', description: 'Win 3 games', icon: '🪨', requirementType: 'wins', requirementValue: 3 },
  { key: 'ten_wins', name: 'Warrior of Faith', description: 'Win 10 games', icon: '⚔️', requirementType: 'wins', requirementValue: 10 },
  { key: 'twenty_five_wins', name: 'Captain of the Hosts', description: 'Win 25 games', icon: '🛡️', requirementType: 'wins', requirementValue: 25 },
  { key: 'fifty_wins', name: 'Mighty Conqueror', description: 'Win 50 games', icon: '👑', requirementType: 'wins', requirementValue: 50 },
  { key: 'hundred_wins', name: 'More Than a Conqueror', description: 'Win 100 games', icon: '🏆', requirementType: 'wins', requirementValue: 100 },

  // 📜 Correct Answers
  { key: 'fifty_correct', name: 'Student of the Word', description: 'Answer 50 questions correctly', icon: '📝', requirementType: 'correct_answers', requirementValue: 50 },
  { key: 'hundred_correct', name: 'Scribe of Scripture', description: 'Answer 100 questions correctly', icon: '📜', requirementType: 'correct_answers', requirementValue: 100 },
  { key: 'two_fifty_correct', name: 'Teacher of the Law', description: 'Answer 250 questions correctly', icon: '🏛️', requirementType: 'correct_answers', requirementValue: 250 },
  { key: 'five_hundred_correct', name: 'Prophet of Truth', description: 'Answer 500 questions correctly', icon: '✨', requirementType: 'correct_answers', requirementValue: 500 },
  { key: 'thousand_correct', name: 'Walking Concordance', description: 'Answer 1,000 questions correctly', icon: '🧠', requirementType: 'correct_answers', requirementValue: 1000 },

  // ⚡ Speed
  { key: 'quick_mind', name: 'Quickened Spirit', description: 'Answer in under 5 seconds', icon: '⚡', requirementType: 'speed', requirementValue: 5 },
  { key: 'swift_wind', name: 'Swift as the Wind', description: 'Answer in under 3 seconds', icon: '💨', requirementType: 'speed', requirementValue: 3 },
  { key: 'flash_revelation', name: 'Flash of Revelation', description: 'Answer in under 2 seconds', icon: '🌟', requirementType: 'speed', requirementValue: 2 },

  // 🔥 Streaks
  { key: 'five_streak', name: 'Firm Foundation', description: 'Get 5 correct answers in a row', icon: '🪨', requirementType: 'streak', requirementValue: 5 },
  { key: 'ten_streak', name: 'Pillar of Fire', description: 'Get 10 correct answers in a row', icon: '🔥', requirementType: 'streak', requirementValue: 10 },
  { key: 'twenty_five_streak', name: 'Unshaken Faith', description: 'Get 25 correct answers in a row', icon: '🌿', requirementType: 'streak', requirementValue: 25 },
  { key: 'fifty_streak', name: 'Armor of God', description: 'Get 50 correct answers in a row', icon: '🛡️', requirementType: 'streak', requirementValue: 50 },
]

/* =========================
   PROFILE MANAGEMENT
   ========================= */

export function initializeProfile(username: string): UserProfile {
  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const profile: UserProfile = {
    userId,
    username,
    totalGames: 0,
    totalWins: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    fastestAnswer: null,
    currentStreak: 0,
    bestStreak: 0,
    unlockedAchievements: [],
    createdAt: new Date().toISOString(),
  }
  localStorage.setItem('userProfile', JSON.stringify(profile))
  localStorage.setItem('userId', userId)
  localStorage.setItem('username', username)
  return profile
}

export function getProfile(): UserProfile | null {
  const data = localStorage.getItem('userProfile')
  if (!data) return null
  return JSON.parse(data)
}

export function updateProfile(updates: Partial<UserProfile>): UserProfile {
  const current = getProfile()
  if (!current) throw new Error('No profile found')
  const updated = { ...current, ...updates }
  localStorage.setItem('userProfile', JSON.stringify(updated))
  return updated
}

/* =========================
   GAME & STREAK TRACKING
   ========================= */

export function recordGameComplete(
  isWinner: boolean,
  correctAnswers: number,
  totalQuestions: number,
  fastestTime?: number
) {
  const profile = getProfile()
  if (!profile) return

  const updates: Partial<UserProfile> = {
    totalGames: profile.totalGames + 1,
    totalCorrect: profile.totalCorrect + correctAnswers,
    totalQuestions: profile.totalQuestions + totalQuestions,
  }

  if (isWinner) {
    updates.totalWins = profile.totalWins + 1
  }

  if (fastestTime !== undefined) {
    if (profile.fastestAnswer === null || fastestTime < profile.fastestAnswer) {
      updates.fastestAnswer = fastestTime
    }
  }

  updateProfile(updates)
  checkAndAwardAchievements()
}

export function updateStreak(isCorrect: boolean) {
  const profile = getProfile()
  if (!profile) return

  if (isCorrect) {
    const newStreak = profile.currentStreak + 1
    updateProfile({
      currentStreak: newStreak,
      bestStreak: Math.max(profile.bestStreak, newStreak),
    })
    checkAndAwardAchievements()
  } else {
    updateProfile({ currentStreak: 0 })
  }
}

/* =========================
   ACHIEVEMENT LOGIC
   ========================= */

export function checkAndAwardAchievements(): string[] {
  const profile = getProfile()
  if (!profile) return []

  const newlyUnlocked: string[] = []

  for (const achievement of ACHIEVEMENTS) {
    if (profile.unlockedAchievements.includes(achievement.key)) continue

    let unlocked = false

    switch (achievement.requirementType) {
      case 'games_played':
        unlocked = profile.totalGames >= achievement.requirementValue
        break
      case 'wins':
        unlocked = profile.totalWins >= achievement.requirementValue
        break
      case 'correct_answers':
        unlocked = profile.totalCorrect >= achievement.requirementValue
        break
      case 'speed':
        unlocked = profile.fastestAnswer !== null && profile.fastestAnswer <= achievement.requirementValue
        break
      case 'streak':
        unlocked = profile.bestStreak >= achievement.requirementValue
        break
    }

    if (unlocked) {
      profile.unlockedAchievements.push(achievement.key)
      newlyUnlocked.push(achievement.key)
    }
  }

  if (newlyUnlocked.length) {
    updateProfile({ unlockedAchievements: profile.unlockedAchievements })
  }

  return newlyUnlocked
}

export function getUnlockedAchievements(): Achievement[] {
  const profile = getProfile()
  if (!profile) return []
  return ACHIEVEMENTS.filter(a => profile.unlockedAchievements.includes(a.key))
}

export function getLockedAchievements(): Achievement[] {
  const profile = getProfile()
  if (!profile) return ACHIEVEMENTS
  return ACHIEVEMENTS.filter(a => !profile.unlockedAchievements.includes(a.key))
}
