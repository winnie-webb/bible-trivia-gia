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

export const ACHIEVEMENTS: Achievement[] = [
  { key: 'first_game', name: 'First Steps', description: 'Play your first game', icon: '🎮', requirementType: 'games_played', requirementValue: 1 },
  { key: 'ten_games', name: 'Getting Started', description: 'Play 10 games', icon: '🎯', requirementType: 'games_played', requirementValue: 10 },
  { key: 'hundred_games', name: 'Veteran', description: 'Play 100 games', icon: '🏆', requirementType: 'games_played', requirementValue: 100 },
  { key: 'first_win', name: 'First Victory', description: 'Win your first game', icon: '🥇', requirementType: 'wins', requirementValue: 1 },
  { key: 'ten_wins', name: 'Champion', description: 'Win 10 games', icon: '👑', requirementType: 'wins', requirementValue: 10 },
  { key: 'fifty_wins', name: 'Legend', description: 'Win 50 games', icon: '⭐', requirementType: 'wins', requirementValue: 50 },
  { key: 'bible_scholar', name: 'Bible Scholar', description: 'Answer 100 questions correctly', icon: '📚', requirementType: 'correct_answers', requirementValue: 100 },
  { key: 'bible_master', name: 'Bible Master', description: 'Answer 500 questions correctly', icon: '🎓', requirementType: 'correct_answers', requirementValue: 500 },
  { key: 'speed_demon', name: 'Speed Demon', description: 'Answer a question in under 3 seconds', icon: '⚡', requirementType: 'speed', requirementValue: 3 },
  { key: 'perfect_streak', name: 'Perfectionist', description: 'Get 10 correct answers in a row', icon: '🔥', requirementType: 'streak', requirementValue: 10 },
  { key: 'unstoppable', name: 'Unstoppable', description: 'Get 25 correct answers in a row', icon: '💫', requirementType: 'streak', requirementValue: 25 },
]

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
    createdAt: new Date().toISOString()
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
  if (!current) {
    throw new Error('No profile found')
  }
  const updated = { ...current, ...updates }
  localStorage.setItem('userProfile', JSON.stringify(updated))
  return updated
}

export function recordGameComplete(isWinner: boolean, correctAnswers: number, totalQuestions: number, fastestTime?: number) {
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
    const updates: Partial<UserProfile> = {
      currentStreak: newStreak
    }
    if (newStreak > profile.bestStreak) {
      updates.bestStreak = newStreak
    }
    updateProfile(updates)
    checkAndAwardAchievements()
  } else {
    updateProfile({ currentStreak: 0 })
  }
}

export function checkAndAwardAchievements(): string[] {
  const profile = getProfile()
  if (!profile) return []

  const newAchievements: string[] = []

  for (const achievement of ACHIEVEMENTS) {
    // Skip if already unlocked
    if (profile.unlockedAchievements.includes(achievement.key)) {
      continue
    }

    let shouldUnlock = false

    switch (achievement.requirementType) {
      case 'games_played':
        shouldUnlock = profile.totalGames >= achievement.requirementValue
        break
      case 'wins':
        shouldUnlock = profile.totalWins >= achievement.requirementValue
        break
      case 'correct_answers':
        shouldUnlock = profile.totalCorrect >= achievement.requirementValue
        break
      case 'speed':
        shouldUnlock = profile.fastestAnswer !== null && profile.fastestAnswer <= achievement.requirementValue
        break
      case 'streak':
        shouldUnlock = profile.bestStreak >= achievement.requirementValue
        break
    }

    if (shouldUnlock) {
      profile.unlockedAchievements.push(achievement.key)
      newAchievements.push(achievement.key)
    }
  }

  if (newAchievements.length > 0) {
    updateProfile({ unlockedAchievements: profile.unlockedAchievements })
  }

  return newAchievements
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