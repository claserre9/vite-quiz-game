export interface Profile {
    id: string;
    name: string;
    avatar: string;
    color: string;
    pin: string | null;
    createdAt: number;
}

export interface ColorOption {
    id: string;
    label: string;
    gradient: string;
}

export const AVATARS = [
    '🦁', '🐯', '🐻', '🐼', '🦊', '🐸',
    '🦋', '🌟', '🚀', '🦄', '🐲', '🎈',
];

export const COLORS: ColorOption[] = [
    { id: 'blue',   label: 'Bleu',   gradient: 'linear-gradient(135deg, #4c75ff, #60a5fa)' },
    { id: 'green',  label: 'Vert',   gradient: 'linear-gradient(135deg, #19c59a, #4ade80)' },
    { id: 'orange', label: 'Orange', gradient: 'linear-gradient(135deg, #ff7a59, #ffb347)' },
    { id: 'purple', label: 'Violet', gradient: 'linear-gradient(135deg, #a78bfa, #f472b6)' },
    { id: 'red',    label: 'Rouge',  gradient: 'linear-gradient(135deg, #ff6b6b, #ff4757)' },
];

const PROFILES_KEY = 'qm-profiles';
const ACTIVE_KEY   = 'qm-active-profile';

export class ProfileStore {
    static getProfiles(): Profile[] {
        try {
            const raw = localStorage.getItem(PROFILES_KEY);
            return raw ? (JSON.parse(raw) as Profile[]) : [];
        } catch {
            return [];
        }
    }

    static saveProfiles(profiles: Profile[]): void {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    }

    static createProfile(data: Omit<Profile, 'id' | 'createdAt'>): Profile {
        const profile: Profile = {
            ...data,
            id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            createdAt: Date.now(),
        };
        const profiles = this.getProfiles();
        profiles.push(profile);
        this.saveProfiles(profiles);
        return profile;
    }

    static deleteProfile(id: string): void {
        this.saveProfiles(this.getProfiles().filter((p) => p.id !== id));
        if (this.getActiveProfileId() === id) this.clearActiveProfile();
    }

    static getActiveProfileId(): string | null {
        return localStorage.getItem(ACTIVE_KEY);
    }

    static getActiveProfile(): Profile | null {
        const id = this.getActiveProfileId();
        if (!id) return null;
        return this.getProfiles().find((p) => p.id === id) ?? null;
    }

    static setActiveProfile(id: string): void {
        localStorage.setItem(ACTIVE_KEY, id);
    }

    static clearActiveProfile(): void {
        localStorage.removeItem(ACTIVE_KEY);
    }

    /** Returns a localStorage key scoped to the active profile. */
    static scoreKey(baseKey: string): string {
        const id = this.getActiveProfileId() ?? 'default';
        return `qm:${id}:${baseKey}`;
    }

    static getColorGradient(colorId: string): string {
        return COLORS.find((c) => c.id === colorId)?.gradient ?? COLORS[0].gradient;
    }
}
