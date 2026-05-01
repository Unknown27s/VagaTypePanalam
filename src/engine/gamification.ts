/**
 * VangaTypePanalam — Gamification Engine
 *
 * Handles rank progression, achievement badges, XP calculations, and milestone tracking.
 */

import type { Session, UserProfile } from '@/db/schema';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type RankType =
    | 'beginner'
    | 'novice'
    | 'intermediate'
    | 'advanced'
    | 'expert'
    | 'master';

export interface Rank {
    type: RankType;
    title: string;
    minWpm: number;
    maxWpm: number;
    icon: string;
}

export type BadgeId =
    | 'first-steps'
    | 'speed-demon'
    | 'sharpshooter'
    | 'on-fire'
    | 'scholar'
    | 'night-owl'
    | 'early-bird'
    | 'century'
    | 'marathon'
    | 'perfectionist'
    | 'tamil-typist'
    | 'word-machine'
    | 'comeback-king'
    | 'speed-breaker'
    | 'iron-fingers';

export interface Badge {
    id: BadgeId;
    title: string;
    description: string;
    icon: string; // SVG path in /badges/ folder
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    category?: 'speed' | 'accuracy' | 'dedication' | 'learning' | 'mastery';
    quote?: string;
}

export interface SeasonChallenge {
    id: string;
    title: string;
    description: string;
    icon: string; // SVG path
    month: number; // 0-11
    year: number;
    badgeReward: BadgeId;
    criteria: { type: 'wpm' | 'accuracy' | 'streak' | 'sessions'; target: number };
}

export interface BadgeProgress {
    badgeId: BadgeId;
    current: number;
    target: number;
    percentage: number;
    hint: string;
    unlockedAt?: number; // Unix timestamp when earned
}

export interface GamificationStats {
    rank: Rank;
    xp: number;
    xpToNextRank: number;
    badges: BadgeId[];
    totalWords: number;
    totalTime: number;
    bestWpm: number;
    avgAccuracy: number;
    currentStreak: number;
    lessonsCompleted: number;
}

// ─────────────────────────────────────────────
// Rank Definitions
// ─────────────────────────────────────────────

export const RANKS: Record<RankType, Rank> = {
    beginner: {
        type: 'beginner',
        title: 'Beginner',
        minWpm: 0,
        maxWpm: 15,
        icon: '🌱',
    },
    novice: {
        type: 'novice',
        title: 'Novice',
        minWpm: 15,
        maxWpm: 25,
        icon: '📚',
    },
    intermediate: {
        type: 'intermediate',
        title: 'Intermediate',
        minWpm: 25,
        maxWpm: 40,
        icon: '🎯',
    },
    advanced: {
        type: 'advanced',
        title: 'Advanced',
        minWpm: 40,
        maxWpm: 55,
        icon: '⚡',
    },
    expert: {
        type: 'expert',
        title: 'Expert',
        minWpm: 55,
        maxWpm: 70,
        icon: '🔥',
    },
    master: {
        type: 'master',
        title: 'Master',
        minWpm: 70,
        maxWpm: Infinity,
        icon: '👑',
    },
};

// ─────────────────────────────────────────────
// Badge Definitions
// ─────────────────────────────────────────────

export const BADGES: Record<BadgeId, Badge> = {
    'first-steps': {
        id: 'first-steps',
        title: 'First Steps',
        description: 'Complete your first typing session',
        icon: '/badges/NewBages/badge-1.svg',
        rarity: 'common',
        category: 'learning',
        quote: 'Every journey begins with a single stroke.',
    },
    'speed-demon': {
        id: 'speed-demon',
        title: 'Speed Demon',
        description: 'Reach 50 WPM in a session',
        icon: '/badges/NewBages/badge-2.svg',
        rarity: 'uncommon',
        category: 'speed',
        quote: 'Speed is the companion of mastery.',
    },
    sharpshooter: {
        id: 'sharpshooter',
        title: 'Sharpshooter',
        description: 'Achieve 100% accuracy in a session',
        icon: '/badges/NewBages/badge-3.svg',
        rarity: 'uncommon',
        category: 'accuracy',
        quote: 'Precision over pace, always.',
    },
    'on-fire': {
        id: 'on-fire',
        title: 'On Fire',
        description: 'Maintain a 7-day typing streak',
        icon: '/badges/on-fire.svg',
        rarity: 'rare',
        category: 'dedication',
    },
    scholar: {
        id: 'scholar',
        title: 'Scholar',
        description: 'Complete 10 lessons',
        icon: '/badges/scholar.svg',
        rarity: 'uncommon',
        category: 'learning',
    },
    'night-owl': {
        id: 'night-owl',
        title: 'Night Owl',
        description: 'Practice after 10 PM',
        icon: '/badges/night-owl.svg',
        rarity: 'common',
        category: 'dedication',
    },
    'early-bird': {
        id: 'early-bird',
        title: 'Early Bird',
        description: 'Practice before 7 AM',
        icon: '/badges/early-bird.svg',
        rarity: 'common',
        category: 'dedication',
    },
    century: {
        id: 'century',
        title: 'Century Club',
        description: 'Type 100+ WPM in a session',
        icon: '/badges/century.svg',
        rarity: 'epic',
        category: 'speed',
    },
    marathon: {
        id: 'marathon',
        title: 'Marathon Runner',
        description: 'Practice for 60+ minutes total',
        icon: '/badges/marathon.svg',
        rarity: 'rare',
        category: 'dedication',
    },
    perfectionist: {
        id: 'perfectionist',
        title: 'Perfectionist',
        description: 'Get 3 stars on 5 lessons',
        icon: '/badges/perfectionist.svg',
        rarity: 'rare',
        category: 'mastery',
    },
    'tamil-typist': {
        id: 'tamil-typist',
        title: 'Tamil Typist',
        description: 'Complete 5 Tamil typing sessions',
        icon: '/badges/tamil-typist.svg',
        rarity: 'uncommon',
        category: 'learning',
    },
    'word-machine': {
        id: 'word-machine',
        title: 'Word Machine',
        description: 'Type 5,000 total characters',
        icon: '/badges/word-machine.svg',
        rarity: 'rare',
        category: 'dedication',
    },
    'comeback-king': {
        id: 'comeback-king',
        title: 'Comeback King',
        description: 'Resume practice after a 7+ day gap',
        icon: '/badges/comeback-king.svg',
        rarity: 'uncommon',
        category: 'dedication',
    },
    'speed-breaker': {
        id: 'speed-breaker',
        title: 'Speed Breaker',
        description: 'Reach 75 WPM in a session',
        icon: '/badges/speed-breaker.svg',
        rarity: 'rare',
        category: 'speed',
    },
    'iron-fingers': {
        id: 'iron-fingers',
        title: 'Iron Fingers',
        description: 'Maintain a 30-day typing streak',
        icon: '/badges/iron-fingers.svg',
        rarity: 'legendary',
        category: 'mastery',
    },
};

// --- Dynamic Config Override ---
let dynamicRanks: Rank[] | null = null;
let dynamicBadges: Badge[] | null = null;
let dynamicEvents: SeasonChallenge[] | null = null;

export function setGamificationConfig(ranks: any[], badges: any[], events: any[]) {
    if (ranks && ranks.length > 0) dynamicRanks = ranks;
    if (badges && badges.length > 0) dynamicBadges = badges;
    if (events && events.length > 0) dynamicEvents = events;
}

export function getActiveRanks(): Rank[] {
    return dynamicRanks || Object.values(RANKS);
}

export function getActiveBadges(): Badge[] {
    return dynamicBadges || Object.values(BADGES);
}

export function getActiveBadge(id: string): Badge | undefined {
    if (dynamicBadges) return dynamicBadges.find(b => b.id === id || (b as any).badgeId === id);
    return BADGES[id as BadgeId];
}

// ─────────────────────────────────────────────
// Rank & XP Calculation
// ─────────────────────────────────────────────

/**
 * Calculate XP from a session.
 * 1 XP per correct character typed.
 */
export function calculateSessionXP(session: Session): number {
    return session.correctChars;
}

/**
 * Calculate total XP from all sessions.
 */
export function calculateTotalXP(sessions: Session[]): number {
    return sessions.reduce((sum, s) => sum + calculateSessionXP(s), 0);
}

/**
 * Get user's current rank based on average WPM.
 */
export function getRankFromAvgWpm(avgWpm: number): Rank {
    const rankArray = getActiveRanks().sort((a, b) => a.minWpm - b.minWpm);
    for (const rank of rankArray) {
        if (avgWpm >= rank.minWpm && avgWpm < rank.maxWpm) {
            return rank;
        }
    }
    return rankArray[rankArray.length - 1] || RANKS.master;
}

/**
 * Calculate XP needed to reach the next rank threshold.
 * Assumes 1 WPM improvement ≈ 50 XP (empirical tuning).
 */
export function calculateXpToNextRank(currentAvgWpm: number, nextRankMinWpm: number): number {
    const wpmDifference = Math.max(0, nextRankMinWpm - currentAvgWpm);
    return Math.ceil(wpmDifference * 50);
}

// ─────────────────────────────────────────────
// Badge Criteria Checking
// ─────────────────────────────────────────────

export interface BadgeCriteria {
    earned: BadgeId[];
    unearned: BadgeId[];
}

/**
 * Determine which badges have been earned based on session and profile data.
 */
export function calculateEarnedBadges(
    sessions: Session[],
    profile: UserProfile | null,
): BadgeCriteria {
    const earned: BadgeId[] = [];
    const allBadgeIds = Object.keys(BADGES) as BadgeId[];

    // 🏁 First Steps — Complete 1 session
    if (sessions.length >= 1) {
        earned.push('first-steps');
    }

    // ⚡ Speed Demon — Reach 50 WPM
    if (sessions.some((s) => s.wpm >= 50)) {
        earned.push('speed-demon');
    }

    // 🎯 Sharpshooter — 100% accuracy in a session
    if (sessions.some((s) => s.accuracy === 1.0)) {
        earned.push('sharpshooter');
    }

    // 🔥 On Fire — 7-day streak
    if (profile && profile.currentStreak >= 7) {
        earned.push('on-fire');
    }

    // 📚 Scholar — Complete 10 lessons (we track this in profile)
    if (profile && profile.currentLevel >= 10) {
        earned.push('scholar');
    }

    // 🌙 Night Owl — Practice after 10 PM
    if (sessions.some((s) => {
        const hour = new Date(s.startedAt).getHours();
        return hour >= 22 || hour < 7; // 10 PM to 7 AM
    })) {
        earned.push('night-owl');
    }

    // ☀️ Early Bird — Practice before 7 AM
    if (sessions.some((s) => {
        const hour = new Date(s.startedAt).getHours();
        return hour < 7;
    })) {
        earned.push('early-bird');
    }

    // 💯 Century — 100+ WPM
    if (sessions.some((s) => s.wpm >= 100)) {
        earned.push('century');
    }

    // 🏆 Marathon — Practice for 60+ minutes total
    const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMs / 60000, 0);
    if (totalMinutes >= 60) {
        earned.push('marathon');
    }

    // ⭐ Perfectionist — 3 stars on 5 lessons (stored in profile.unlockedKeys as a proxy)
    // This is a simplified check; in production you'd query lesson progress from IDB
    if (profile && profile.unlockedKeys.length >= 5) {
        earned.push('perfectionist');
    }

    // Tamil Typist — 5 Tamil sessions
    const tamilSessions = sessions.filter((s) => s.language === 'ta').length;
    if (tamilSessions >= 5) {
        earned.push('tamil-typist');
    }

    // Word Machine — 5000 total characters
    const totalChars = sessions.reduce((sum, s) => sum + s.totalChars, 0);
    if (totalChars >= 5000) {
        earned.push('word-machine');
    }

    // Comeback King — Resume after 7+ day gap
    if (profile && sessions.length >= 2) {
        const sortedDates = sessions
            .map((s) => s.startedAt)
            .sort((a, b) => a - b);
        for (let i = 1; i < sortedDates.length; i++) {
            const gap = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24);
            if (gap >= 7) {
                earned.push('comeback-king');
                break;
            }
        }
    }

    // Speed Breaker — 75 WPM
    if (sessions.some((s) => s.wpm >= 75)) {
        earned.push('speed-breaker');
    }

    // Iron Fingers — 30-day streak
    if (profile && (profile.currentStreak >= 30 || profile.longestStreak >= 30)) {
        earned.push('iron-fingers');
    }

    // Remove duplicates and sort
    const uniqueEarned = [...new Set(earned)];

    // Calculate unearned
    const uniqueEarnedIds = uniqueEarned.map(b => b as string);
    const unearned = getActiveBadges()
        .map(b => (b as any).badgeId || b.id)
        .filter((id) => !uniqueEarnedIds.includes(id)) as BadgeId[];

    return { earned: uniqueEarned, unearned };
}

// ─────────────────────────────────────────────
// Badge Progress Tracking
// ─────────────────────────────────────────────

/**
 * Calculate progress toward unlocking a badge.
 * Returns { current, target, percentage, hint } for locked badges.
 */
export function calculateBadgeProgress(
    badgeId: BadgeId,
    sessions: Session[],
    profile: UserProfile | null,
): BadgeProgress {
    const totalTime = sessions.reduce((sum, s) => sum + s.durationMs / 60000, 0); // in minutes
    const maxWpm = sessions.length > 0 ? Math.max(...sessions.map((s) => s.wpm)) : 0;

    switch (badgeId) {
        case 'first-steps':
            return {
                badgeId,
                current: Math.min(sessions.length, 1),
                target: 1,
                percentage: Math.min(100, (sessions.length / 1) * 100),
                hint: 'Complete 1 session',
            };

        case 'speed-demon':
            return {
                badgeId,
                current: Math.floor(maxWpm),
                target: 50,
                percentage: Math.min(100, (maxWpm / 50) * 100),
                hint: `${50 - Math.floor(maxWpm)} WPM needed`,
            };

        case 'sharpshooter':
            const perfectSessions = sessions.filter((s) => s.accuracy === 1.0).length;
            return {
                badgeId,
                current: perfectSessions,
                target: 1,
                percentage: perfectSessions > 0 ? 100 : 0,
                hint: 'Achieve 100% accuracy in one session',
            };

        case 'on-fire':
            const streak = profile?.currentStreak ?? 0;
            return {
                badgeId,
                current: streak,
                target: 7,
                percentage: Math.min(100, (streak / 7) * 100),
                hint: `${7 - streak} more days to unlock`,
            };

        case 'scholar':
            const lessons = profile?.currentLevel ?? 0;
            return {
                badgeId,
                current: lessons,
                target: 10,
                percentage: Math.min(100, (lessons / 10) * 100),
                hint: `Complete ${10 - lessons} more lessons`,
            };

        case 'night-owl':
            const nightSessions = sessions.filter((s) => {
                const hour = new Date(s.startedAt).getHours();
                return hour >= 22 || hour < 7;
            }).length;
            return {
                badgeId,
                current: nightSessions,
                target: 1,
                percentage: nightSessions > 0 ? 100 : 0,
                hint: 'Practice between 10 PM - 7 AM',
            };

        case 'early-bird':
            const morningSessions = sessions.filter((s) => {
                const hour = new Date(s.startedAt).getHours();
                return hour < 7;
            }).length;
            return {
                badgeId,
                current: morningSessions,
                target: 1,
                percentage: morningSessions > 0 ? 100 : 0,
                hint: 'Practice before 7 AM',
            };

        case 'century':
            return {
                badgeId,
                current: Math.floor(maxWpm),
                target: 100,
                percentage: Math.min(100, (maxWpm / 100) * 100),
                hint: `${100 - Math.floor(maxWpm)} WPM more needed`,
            };

        case 'marathon':
            return {
                badgeId,
                current: Math.floor(totalTime),
                target: 60,
                percentage: Math.min(100, (totalTime / 60) * 100),
                hint: `${Math.max(0, 60 - Math.floor(totalTime))} more minutes`,
            };

        case 'perfectionist':
            const unlockedKeys = profile?.unlockedKeys.length ?? 0;
            return {
                badgeId,
                current: Math.min(unlockedKeys, 5),
                target: 5,
                percentage: Math.min(100, (unlockedKeys / 5) * 100),
                hint: 'Get 3 stars on 5 lessons',
            };

        case 'tamil-typist':
            const tamilCount = sessions.filter((s) => s.language === 'ta').length;
            return {
                badgeId,
                current: Math.min(tamilCount, 5),
                target: 5,
                percentage: Math.min(100, (tamilCount / 5) * 100),
                hint: `${Math.max(0, 5 - tamilCount)} more Tamil sessions`,
            };

        case 'word-machine':
            const totalCharsTyped = sessions.reduce((sum, s) => sum + s.totalChars, 0);
            return {
                badgeId,
                current: totalCharsTyped,
                target: 5000,
                percentage: Math.min(100, (totalCharsTyped / 5000) * 100),
                hint: `${Math.max(0, 5000 - totalCharsTyped)} chars remaining`,
            };

        case 'comeback-king':
            let hasGap = false;
            if (sessions.length >= 2) {
                const dates = sessions.map((s) => s.startedAt).sort((a, b) => a - b);
                for (let i = 1; i < dates.length; i++) {
                    if ((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24) >= 7) {
                        hasGap = true;
                        break;
                    }
                }
            }
            return {
                badgeId,
                current: hasGap ? 1 : 0,
                target: 1,
                percentage: hasGap ? 100 : 0,
                hint: 'Return after a 7-day break',
            };

        case 'speed-breaker':
            return {
                badgeId,
                current: Math.floor(maxWpm),
                target: 75,
                percentage: Math.min(100, (maxWpm / 75) * 100),
                hint: `${Math.max(0, 75 - Math.floor(maxWpm))} WPM more needed`,
            };

        case 'iron-fingers':
            const longestStreak = profile?.longestStreak ?? profile?.currentStreak ?? 0;
            return {
                badgeId,
                current: longestStreak,
                target: 30,
                percentage: Math.min(100, (longestStreak / 30) * 100),
                hint: `${Math.max(0, 30 - longestStreak)} more days`,
            };

        default:
            return {
                badgeId,
                current: 0,
                target: 1,
                percentage: 0,
                hint: 'Unknown badge',
            };
    }
}

// ─────────────────────────────────────────────
// Gamification Stats Aggregation
// ─────────────────────────────────────────────

export function calculateGamificationStats(
    sessions: Session[],
    profile: UserProfile | null,
): GamificationStats {
    const totalXp = calculateTotalXP(sessions);

    // Calculate average WPM
    const avgWpm = sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + s.wpm, 0) / sessions.length)
        : 0;

    const currentRank = getRankFromAvgWpm(avgWpm);

    // Find next rank
    const rankArray = getActiveRanks().sort((a, b) => a.minWpm - b.minWpm);
    const currentRankIndex = rankArray.findIndex((r) => r.type === currentRank.type);
    const nextRank = currentRankIndex < rankArray.length - 1
        ? rankArray[currentRankIndex + 1]
        : null;

    const xpToNextRank = nextRank
        ? calculateXpToNextRank(avgWpm, nextRank.minWpm)
        : 0;

    // Total words typed
    const totalWords = sessions.reduce((sum, s) => sum + s.totalChars, 0);

    // Total time
    const totalTime = sessions.reduce((sum, s) => sum + s.durationMs, 0);

    // Best WPM
    const bestWpm = sessions.length > 0
        ? Math.max(...sessions.map((s) => s.wpm))
        : 0;

    // Average accuracy
    const avgAccuracy = sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length
        : 0;

    // Current streak
    const currentStreak = profile?.currentStreak ?? 0;

    // Lessons completed (using profile.currentLevel as proxy)
    const lessonsCompleted = profile?.currentLevel ?? 0;

    // Calculate badges
    const { earned: badges } = calculateEarnedBadges(sessions, profile);

    return {
        rank: currentRank,
        xp: totalXp,
        xpToNextRank,
        badges,
        totalWords,
        totalTime,
        bestWpm,
        avgAccuracy,
        currentStreak,
        lessonsCompleted,
    };
}

// ─────────────────────────────────────────────
// Badge Categories & Filtering
// ─────────────────────────────────────────────

export type BadgeCategory = 'all' | 'speed' | 'accuracy' | 'dedication' | 'learning' | 'mastery';

export const BADGE_CATEGORIES: Record<BadgeCategory, { label: string; icon: string }> = {
    all: { label: 'All Badges', icon: '🏅' },
    speed: { label: 'Speed', icon: '⚡' },
    accuracy: { label: 'Accuracy', icon: '🎯' },
    dedication: { label: 'Dedication', icon: '🔥' },
    learning: { label: 'Learning', icon: '📚' },
    mastery: { label: 'Mastery', icon: '👑' },
};

/**
 * Get badge IDs filtered by category.
 */
export function getBadgesByCategory(category: BadgeCategory): BadgeId[] {
    const activeBadges = getActiveBadges();
    if (category === 'all') {
        return activeBadges.map(b => (b as any).badgeId || b.id) as BadgeId[];
    }
    return activeBadges
        .filter(badge => badge.category === category)
        .map(badge => (badge as any).badgeId || badge.id) as BadgeId[];
}

// ─────────────────────────────────────────────
// Helper: Get Rarity Color
// ─────────────────────────────────────────────

export function getRarityColor(rarity: Badge['rarity']): string {
    const colors: Record<Badge['rarity'], string> = {
        common: 'hsl(210, 40%, 60%)',
        uncommon: 'hsl(120, 50%, 50%)',
        rare: 'hsl(260, 70%, 55%)',
        epic: 'hsl(40, 90%, 50%)',
        legendary: 'hsl(0, 100%, 60%)',
    };
    return colors[rarity];
}

// ─────────────────────────────────────────────
// Season Challenges (Monthly rotating challenges)
// ─────────────────────────────────────────────

/**
 * Monthly challenges that rotate automatically.
 * Each month maps to a challenge with specific criteria.
 */
const SEASON_CHALLENGES: Omit<SeasonChallenge, 'month' | 'year'>[] = [
    { id: 'speed-month', title: 'Speed Month', description: 'Reach 60 WPM this month', icon: '/badges/speed-demon.svg', badgeReward: 'speed-demon', criteria: { type: 'wpm', target: 60 } },
    { id: 'accuracy-month', title: 'Accuracy Month', description: 'Achieve 95% accuracy this month', icon: '/badges/sharpshooter.svg', badgeReward: 'sharpshooter', criteria: { type: 'accuracy', target: 95 } },
    { id: 'streak-month', title: 'Streak Month', description: 'Build a 7-day streak this month', icon: '/badges/on-fire.svg', badgeReward: 'on-fire', criteria: { type: 'streak', target: 7 } },
    { id: 'grind-month', title: 'Grind Month', description: 'Complete 20 sessions this month', icon: '/badges/marathon.svg', badgeReward: 'marathon', criteria: { type: 'sessions', target: 20 } },
    { id: 'blitz-month', title: 'Blitz Month', description: 'Reach 75 WPM this month', icon: '/badges/speed-breaker.svg', badgeReward: 'speed-breaker', criteria: { type: 'wpm', target: 75 } },
    { id: 'precision-month', title: 'Precision Month', description: 'Achieve 98% accuracy this month', icon: '/badges/sharpshooter.svg', badgeReward: 'sharpshooter', criteria: { type: 'accuracy', target: 98 } },
    { id: 'endurance-month', title: 'Endurance Month', description: 'Build a 14-day streak this month', icon: '/badges/on-fire.svg', badgeReward: 'on-fire', criteria: { type: 'streak', target: 14 } },
    { id: 'volume-month', title: 'Volume Month', description: 'Complete 30 sessions this month', icon: '/badges/word-machine.svg', badgeReward: 'word-machine', criteria: { type: 'sessions', target: 30 } },
    { id: 'sprint-month', title: 'Sprint Month', description: 'Reach 50 WPM this month', icon: '/badges/speed-demon.svg', badgeReward: 'speed-demon', criteria: { type: 'wpm', target: 50 } },
    { id: 'sharp-month', title: 'Sharp Month', description: 'Achieve 97% accuracy this month', icon: '/badges/sharpshooter.svg', badgeReward: 'sharpshooter', criteria: { type: 'accuracy', target: 97 } },
    { id: 'habit-month', title: 'Habit Month', description: 'Build a 10-day streak this month', icon: '/badges/on-fire.svg', badgeReward: 'on-fire', criteria: { type: 'streak', target: 10 } },
    { id: 'hustle-month', title: 'Hustle Month', description: 'Complete 25 sessions this month', icon: '/badges/marathon.svg', badgeReward: 'marathon', criteria: { type: 'sessions', target: 25 } },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface SeasonChallengeProgress {
    challenge: SeasonChallenge;
    current: number;
    target: number;
    percentage: number;
    completed: boolean;
    monthLabel: string;
}

/**
 * Get the current month's season challenge and progress.
 */
export function getCurrentSeasonChallenge(
    sessions: Session[],
    profile: UserProfile | null,
): SeasonChallengeProgress {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    let challenge: SeasonChallenge;
    const monthLabel = `${MONTH_NAMES[month]} ${year}`;

    // Try to find a dynamic event for this month/year or just take the first one available if any
    if (dynamicEvents && dynamicEvents.length > 0) {
        const dynamicEvent = dynamicEvents[0]; // For now, just take the first one as a custom event
        challenge = {
            id: dynamicEvent.id,
            title: dynamicEvent.title,
            description: dynamicEvent.description,
            icon: '', // Handled via svgContent
            month,
            year,
            badgeReward: 'first-steps' as BadgeId, // Default reward
            criteria: { 
                type: (dynamicEvent as any).targetType as 'wpm' | 'accuracy' | 'streak' | 'sessions', 
                target: (dynamicEvent as any).targetValue 
            },
            ...({ svgContent: (dynamicEvent as any).svgContent } as any)
        };
    } else {
        const template = SEASON_CHALLENGES[month];
        challenge = { ...template, month, year };
    }

    // Filter sessions to current month only
    const monthStart = new Date(year, month, 1).getTime();
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59).getTime();
    const monthSessions = sessions.filter(
        (s) => s.startedAt >= monthStart && s.startedAt <= monthEnd,
    );

    let current = 0;
    const target = challenge.criteria.target;

    switch (challenge.criteria.type) {
        case 'wpm':
            current = monthSessions.length > 0
                ? Math.max(...monthSessions.map((s) => Math.floor(s.wpm)))
                : 0;
            break;
        case 'accuracy':
            current = monthSessions.length > 0
                ? Math.round(Math.max(...monthSessions.map((s) => s.accuracy)) * 100)
                : 0;
            break;
        case 'streak':
            current = profile?.currentStreak ?? 0;
            break;
        case 'sessions':
            current = monthSessions.length;
            break;
    }

    const percentage = Math.min(100, (current / target) * 100);

    return {
        challenge,
        current,
        target,
        percentage,
        completed: percentage >= 100,
        monthLabel,
    };
}
