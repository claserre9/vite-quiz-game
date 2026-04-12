import { BaseViewModel } from '@core/BaseViewModel';
import { url } from '@core/url';
import { observable, observableArray } from 'knockout';
import { ProfileStore, type Profile } from '@store/ProfileStore';

export class ProfileSelectorViewModel extends BaseViewModel {
    profiles = observableArray<Profile>(ProfileStore.getProfiles());
    selectedProfile = observable<Profile | null>(null);
    pinInput = observable('');
    pinError = observable('');
    manageMode = observable(false);

    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(this.getTemplate());
    }

    private getTemplate(): string {
        const hasActive = ProfileStore.getActiveProfile() !== null;
        const backBtn = hasActive
            ? `<a href="${url('/')}" class="btn qm-btn-home mb-3">🏠 Accueil</a>`
            : '';

        return `
        <div class="container qm-profiles-page" style="max-width: 760px;">
            ${backBtn}
            <div class="qm-panel">
                <div class="text-center mb-4">
                    <span class="qm-pill">👤 Profils</span>
                    <h1 class="qm-section-title mt-3 mb-2">Qui joue ?</h1>
                    <p class="qm-muted mb-0">Choisis ton profil pour commencer.</p>
                </div>

                <!-- Empty state -->
                <div data-bind="visible: profiles().length === 0" class="text-center py-3">
                    <p class="qm-muted">Aucun profil pour l'instant. Crée le premier !</p>
                </div>

                <!-- Profile grid -->
                <div class="qm-profiles-grid" data-bind="foreach: profiles">
                    <div class="qm-profile-card" data-bind="click: $root.selectProfile">
                        <div class="qm-profile-avatar"
                             data-bind="text: avatar, style: { background: $root.gradient(color) }"></div>
                        <div class="qm-profile-name" data-bind="text: name"></div>
                        <div class="qm-profile-pin-badge" data-bind="visible: pin !== null">🔒</div>
                        <!-- ko if: $root.manageMode() -->
                        <button class="qm-profile-delete-btn"
                                data-bind="click: $root.deleteProfile, clickBubble: false">✕</button>
                        <!-- /ko -->
                    </div>
                </div>

                <!-- Actions -->
                <div class="text-center mt-4 d-flex flex-wrap gap-2 justify-content-center">
                    <a href="${url('/profils/nouveau')}" class="btn qm-btn px-4 py-3">➕ Nouveau profil</a>
                    <button class="btn qm-btn-secondary px-4 py-3"
                            data-bind="visible: profiles().length > 0,
                                       click: toggleManage,
                                       text: manageMode() ? '✅ Terminer' : '✏️ Gérer'"></button>
                </div>
            </div>

            <!-- PIN overlay -->
            <div data-bind="if: selectedProfile() !== null" class="qm-pin-overlay">
                <div class="qm-pin-dialog">
                    <div data-bind="if: selectedProfile()">
                        <div class="qm-pin-avatar mx-auto"
                             data-bind="text: selectedProfile().avatar,
                                        style: { background: $root.gradient(selectedProfile().color) }"></div>
                        <h3 class="mt-3 mb-0" data-bind="text: selectedProfile().name"></h3>
                    </div>
                    <p class="qm-muted mb-3 mt-1">Saisis ton PIN</p>
                    <input type="password" inputmode="numeric" pattern="[0-9]*"
                           maxlength="4" class="qm-pin-input"
                           placeholder="● ● ● ●"
                           data-bind="value: pinInput,
                                      valueUpdate: 'input',
                                      hasFocus: selectedProfile() !== null,
                                      event: { keydown: onPinKeyDown }" />
                    <p class="qm-feedback-incorrect mt-2" style="min-height:1.4em"
                       data-bind="text: pinError, visible: pinError()"></p>
                    <div class="d-flex gap-2 justify-content-center mt-3">
                        <button class="btn qm-btn px-4 py-2" data-bind="click: submitPin">✅ Valider</button>
                        <button class="btn qm-btn-secondary px-4 py-2" data-bind="click: cancelPin">Annuler</button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    gradient = (colorId: string): string => ProfileStore.getColorGradient(colorId);

    selectProfile = (profile: Profile) => {
        if (profile.pin) {
            this.selectedProfile(profile);
            this.pinInput('');
            this.pinError('');
        } else {
            this.activate(profile.id);
        }
    };

    submitPin = () => {
        const profile = this.selectedProfile();
        if (!profile) return;
        if (this.pinInput() === profile.pin) {
            this.activate(profile.id);
        } else {
            this.pinError('PIN incorrect, essaie encore !');
            this.pinInput('');
        }
    };

    onPinKeyDown = (_: unknown, event: KeyboardEvent): boolean => {
        if (event.key === 'Enter') { this.submitPin(); return false; }
        return true;
    };

    cancelPin = () => {
        this.selectedProfile(null);
        this.pinInput('');
        this.pinError('');
    };

    toggleManage = () => this.manageMode(!this.manageMode());

    deleteProfile = (profile: Profile) => {
        if (confirm(`Supprimer le profil de ${profile.name} ?`)) {
            ProfileStore.deleteProfile(profile.id);
            this.profiles(ProfileStore.getProfiles());
            if (this.profiles().length === 0) this.manageMode(false);
        }
    };

    private activate(id: string) {
        ProfileStore.setActiveProfile(id);
        const p = window.page;
        if (p?.show) p.show('/'); else window.location.href = '/';
    }
}
