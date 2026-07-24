import { beforeEach, describe, expect, it } from 'vitest';
import { COLORS, ProfileStore } from '@store/ProfileStore.ts';

describe('ProfileStore', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('has no profiles and no active profile initially', () => {
        expect(ProfileStore.getProfiles()).toEqual([]);
        expect(ProfileStore.getActiveProfile()).toBeNull();
        expect(ProfileStore.getActiveProfileId()).toBeNull();
    });

    it('creates a profile with a generated id and createdAt, and persists it', () => {
        const profile = ProfileStore.createProfile({
            name: 'Cliff',
            avatar: '🦁',
            color: 'blue',
            pin: null,
        });

        expect(profile.id).toBeTruthy();
        expect(profile.createdAt).toBeGreaterThan(0);
        expect(ProfileStore.getProfiles()).toEqual([profile]);
    });

    it('sets and clears the active profile independently of the profile list', () => {
        const profile = ProfileStore.createProfile({
            name: 'Cliff',
            avatar: '🦁',
            color: 'blue',
            pin: null,
        });

        ProfileStore.setActiveProfile(profile.id);
        expect(ProfileStore.getActiveProfileId()).toBe(profile.id);
        expect(ProfileStore.getActiveProfile()).toEqual(profile);

        ProfileStore.clearActiveProfile();
        expect(ProfileStore.getActiveProfileId()).toBeNull();
        expect(ProfileStore.getActiveProfile()).toBeNull();
    });

    it('deleting the active profile also clears the active-profile pointer', () => {
        const profile = ProfileStore.createProfile({
            name: 'Cliff',
            avatar: '🦁',
            color: 'blue',
            pin: null,
        });
        ProfileStore.setActiveProfile(profile.id);

        ProfileStore.deleteProfile(profile.id);

        expect(ProfileStore.getProfiles()).toEqual([]);
        expect(ProfileStore.getActiveProfileId()).toBeNull();
    });

    it('deleting a non-active profile leaves the active pointer untouched', () => {
        const active = ProfileStore.createProfile({
            name: 'Cliff',
            avatar: '🦁',
            color: 'blue',
            pin: null,
        });
        const other = ProfileStore.createProfile({
            name: 'Sam',
            avatar: '🐯',
            color: 'green',
            pin: null,
        });
        ProfileStore.setActiveProfile(active.id);

        ProfileStore.deleteProfile(other.id);

        expect(ProfileStore.getActiveProfileId()).toBe(active.id);
        expect(ProfileStore.getProfiles()).toEqual([active]);
    });

    it('scopes scoreKey to the active profile, falling back to "default" with none active', () => {
        expect(ProfileStore.scoreKey('best')).toBe('qm:default:best');

        const profile = ProfileStore.createProfile({
            name: 'Cliff',
            avatar: '🦁',
            color: 'blue',
            pin: null,
        });
        ProfileStore.setActiveProfile(profile.id);

        expect(ProfileStore.scoreKey('best')).toBe(`qm:${profile.id}:best`);
    });

    it('getColorGradient falls back to the first color for an unknown id', () => {
        expect(ProfileStore.getColorGradient('blue')).toBe(COLORS[0].gradient);
        expect(ProfileStore.getColorGradient('not-a-real-color')).toBe(
            COLORS[0].gradient
        );
    });
});
