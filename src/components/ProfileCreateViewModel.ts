import { BaseViewModel } from '@core/BaseViewModel';
import { url } from '@core/url';
import { observable } from 'knockout';
import {
    ProfileStore,
    AVATARS,
    COLORS,
    type ColorOption,
} from '@store/ProfileStore';

export class ProfileCreateViewModel extends BaseViewModel {
    name = observable('');
    avatar = observable(AVATARS[0]);
    color = observable(COLORS[0].id);
    usePin = observable(false);
    pin = observable('');
    nameError = observable('');
    pinError = observable('');

    readonly avatars = AVATARS;
    readonly colors = COLORS;

    constructor(context: PageJS.Context | undefined) {
        super(context);
        this.setTemplate(this.getTemplate());
    }

    private getTemplate(): string {
        return `
        <div class="container qm-create-profile-page" style="max-width: 580px;">
            <a href="${url('/profils')}" class="btn qm-btn-home mb-3">← Retour</a>
            <div class="qm-panel">
                <div class="text-center mb-4">
                    <span class="qm-pill">✨ Nouveau profil</span>
                    <h1 class="qm-section-title mt-3 mb-2">Crée ton profil</h1>
                </div>

                <!-- Live preview -->
                <div class="text-center mb-4">
                    <div class="qm-profile-avatar qm-profile-avatar--xl mx-auto"
                         data-bind="text: avatar, style: { background: gradient(color()) }"></div>
                    <div class="mt-2 fw-bold fs-5" data-bind="text: name() || '...'"></div>
                </div>

                <!-- Avatar picker -->
                <div class="mb-4">
                    <label class="form-label fw-bold">Avatar</label>
                    <div class="d-flex flex-wrap gap-2 justify-content-center" data-bind="foreach: avatars">
                        <div class="qm-avatar-option"
                             data-bind="text: $data,
                                        click: $root.selectAvatar,
                                        css: { 'qm-avatar-option--selected': $root.avatar() === $data }">
                        </div>
                    </div>
                </div>

                <!-- Color picker -->
                <div class="mb-4">
                    <label class="form-label fw-bold">Couleur</label>
                    <div class="d-flex gap-3 justify-content-center" data-bind="foreach: colors">
                        <div class="qm-color-option"
                             data-bind="style: { background: gradient },
                                        click: $root.selectColor,
                                        css: { 'qm-color-option--selected': $root.color() === id },
                                        attr: { title: label }">
                        </div>
                    </div>
                </div>

                <!-- Name -->
                <div class="mb-3">
                    <label class="form-label fw-bold">Prénom</label>
                    <input type="text" class="form-control qm-select"
                           placeholder="ex : Maxime"
                           maxlength="20"
                           data-bind="value: name, valueUpdate: 'input'" />
                    <p class="qm-feedback-incorrect mt-1" style="min-height:1.2em"
                       data-bind="text: nameError, visible: nameError()"></p>
                </div>

                <!-- Optional PIN -->
                <div class="mb-4">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="usePinCheck"
                               data-bind="checked: usePin" />
                        <label class="form-check-label" for="usePinCheck">
                            Protéger avec un PIN 🔒
                        </label>
                    </div>
                    <div data-bind="visible: usePin()" class="mt-2">
                        <input type="password" inputmode="numeric" pattern="[0-9]*"
                               maxlength="4" class="qm-pin-input"
                               placeholder="4 chiffres"
                               data-bind="value: pin, valueUpdate: 'input'" />
                        <p class="qm-feedback-incorrect mt-1" style="min-height:1.2em"
                           data-bind="text: pinError, visible: pinError()"></p>
                    </div>
                </div>

                <div class="d-flex justify-content-center">
                    <button class="btn qm-btn px-5 py-3" data-bind="click: create">
                        🎉 Créer le profil
                    </button>
                </div>
            </div>
        </div>`;
    }

    gradient = (colorId: string): string =>
        ProfileStore.getColorGradient(colorId);

    selectAvatar = (avatar: string) => this.avatar(avatar);

    selectColor = (option: ColorOption) => this.color(option.id);

    create = () => {
        this.nameError('');
        this.pinError('');

        if (!this.name().trim()) {
            this.nameError('Saisis un prénom !');
            return;
        }
        if (this.usePin() && !/^\d{4}$/.test(this.pin())) {
            this.pinError('Le PIN doit contenir exactement 4 chiffres.');
            return;
        }

        const profile = ProfileStore.createProfile({
            name: this.name().trim(),
            avatar: this.avatar(),
            color: this.color(),
            pin: this.usePin() ? this.pin() : null,
        });

        ProfileStore.setActiveProfile(profile.id);

        const p = window.page;
        if (p?.show) p.show('/');
        else window.location.href = '/';
    };
}
