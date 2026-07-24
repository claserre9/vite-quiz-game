/** The QuizViewModel markup, isolated from the view-model logic itself. */
export function buildQuizTemplate(basePath: string): string {
    return `
        <div class="container qm-quiz-page">
            <div data-bind="visible: isLoading()" class="qm-empty-card text-center">
                <p class="mb-0">🧠 Chargement en cours... Prépare-toi pour un super quiz !</p>
            </div>

            <div data-bind="visible: errorMessage()" class="qm-empty-card text-center">
                <h2 class="qm-title-font">Oups, petit contretemps</h2>
                <p data-bind="text: errorMessage"></p>
                <button data-bind="click: loadQuestions" class="btn qm-btn mt-2 px-4 py-3">🔁 Réessayer</button>
            </div>

            <div data-bind="if: !isLoading() && !errorMessage()">
                <div class="mx-auto" style="max-width: 860px;">
                    <div class="d-flex justify-content-start mb-3">
                        <a href="${basePath}" class="btn qm-btn-home">🏠 Accueil</a>
                    </div>
                    <div class="qm-quiz-card">
                        <div data-bind="if: !quizFinished() && currentQuestion()">
                            <div class="qm-quiz-header">
                                <div class="qm-chip-row">
                                    <span class="qm-chip">🧩 <span data-bind="text: headline"></span></span>
                                    <span class="qm-chip" data-bind="visible: !isTraining() && exerciseType() !== 'chrono'">🎯 Question <span data-bind="text: currentIndex() + 1"></span>/<span data-bind="text: totalQuestions"></span></span>
                                    <span class="qm-chip" data-bind="visible: isTraining">🔥 Mode Entraînement</span>
                                    <span class="qm-chip">⭐ Score <span data-bind="text: score"></span></span>
                                </div>
                                <div class="qm-chip" data-bind="visible: exerciseType() === 'sprint'">⏱️ <span data-bind="text: sprintElapsed"></span>s</div>
                                <div class="qm-chip" data-bind="visible: !isTraining() && exerciseType() !== 'chrono' && exerciseType() !== 'sprint'">⏰ <span data-bind="text: timeLeft"></span>s</div>
                            </div>

                            <div class="qm-progress-wrap" data-bind="visible: !isTraining() && exerciseType() !== 'chrono'">
                                <div class="progress">
                                    <div class="progress-bar" role="progressbar" data-bind="style: { width: ((currentIndex()+1)/totalQuestions()*100 + '%') }"></div>
                                </div>
                            </div>

                            <div class="qm-question-card">

                                <!-- Table grid for table-gaps -->
                                <div data-bind="if: tableGridCells().length > 0" class="qm-table-grid-ctx mb-3">
                                    <div class="d-flex flex-wrap gap-2 justify-content-center" data-bind="foreach: tableGridCells">
                                        <div class="qm-grid-cell" data-bind="css: {
                                            'qm-grid-cell--current': isCurrent,
                                            'qm-grid-cell--correct': wasCorrect,
                                            'qm-grid-cell--incorrect': answered && !wasCorrect,
                                            'qm-grid-cell--pending': !answered && !isCurrent
                                        }">
                                            <div class="qm-grid-cell-label" data-bind="text: label + '='"></div>
                                            <div class="qm-grid-cell-result" data-bind="text: answered ? result : (isCurrent ? '?' : '·')"></div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Visual aid (fraction bar, number line, array...) -->
                                <div data-bind="visible: visualMarkup(), html: visualMarkup" class="qm-visual-wrap mb-3 text-center"></div>

                                <h2 class="qm-question-text text-center" data-bind="text: currentQuestion().question" style="white-space: pre-line"></h2>

                                <!-- Multiple choice buttons -->
                                <div data-bind="if: !isFreeInput()">
                                    <div class="qm-answer-grid" data-bind="foreach: currentQuestion().answers">
                                        <button class="btn qm-answer-btn" data-bind="text: answer, click: $root.selectAnswer, css: $parent.getAnswerClasses($parent.currentQuestion(), $data), disable: $parent.answerChosen() || $parent.quizFinished()"></button>
                                    </div>
                                </div>

                                <!-- Free input -->
                                <div data-bind="if: isFreeInput()">
                                    <div data-bind="visible: !answerChosen()" class="qm-free-input-wrap">
                                        <input type="number" class="qm-free-input" min="0" max="9999"
                                               placeholder="?"
                                               data-bind="value: userInput, valueUpdate: 'input', hasFocus: shouldFocusInput, event: { keydown: onInputKeyDown }" />
                                        <button class="btn qm-btn px-4 py-2"
                                                data-bind="click: submitFreeInput, disable: !userInput().trim()">✅ Valider</button>
                                    </div>
                                    <div data-bind="visible: answerChosen()" class="qm-free-feedback" style="min-height: 2.5rem">
                                        <span data-bind="text: lastAnswerFeedback, css: { 'qm-feedback-correct': lastAnswerCorrect(), 'qm-feedback-incorrect': !lastAnswerCorrect() }"></span>
                                    </div>
                                </div>

                            </div>

                            <div class="qm-scoreboard">
                                <div class="qm-score-item">
                                    <span class="qm-score-label">Score</span>
                                    <span class="qm-score-value" data-bind="text: score"></span>
                                </div>
                                <div class="qm-score-item">
                                    <span class="qm-score-label">Restantes</span>
                                    <span class="qm-score-value" data-bind="text: remainingQuestions"></span>
                                </div>
                                <div class="qm-score-item">
                                    <span class="qm-score-label">Mode</span>
                                    <span class="qm-score-value" data-bind="text: gameModeLabel"></span>
                                </div>
                                <div class="qm-score-item">
                                    <span class="qm-score-label">Record</span>
                                    <span class="qm-score-value qm-score-value-sm" data-bind="text: bestScoreLabel"></span>
                                </div>
                            </div>

                            <div data-bind="visible: isTraining()" class="text-center mt-3">
                                <button class="btn qm-btn-secondary px-4 py-2" data-bind="click: quitTraining">🚪 Terminer la session</button>
                            </div>
                        </div>

                        <div data-bind="if: quizFinished()" class="qm-finish">
                            <span class="qm-finish-badge" data-bind="text: isTraining() ? '🏁 Session terminée' : '🏁 Partie terminée'"></span>
                            <h2 class="qm-title-font mt-3" data-bind="text: isTraining() ? 'Belle session !' : 'Bravo, tu as terminé !'"></h2>
                            <h3 class="qm-muted" data-bind="text: scoreEvaluation"></h3>

                            <!-- Standard score -->
                            <h4 data-bind="visible: exerciseType() !== 'chrono' && exerciseType() !== 'sprint'">
                                🌈 Ton score final : <strong data-bind="text: score"></strong>/<span data-bind="text: isUnlimitedTraining() ? totalAnswered() : totalQuestions()"></span>
                            </h4>

                            <!-- Chrono score -->
                            <h4 data-bind="visible: exerciseType() === 'chrono'">
                                🌈 Bonnes réponses : <strong data-bind="text: score"></strong> sur <span data-bind="text: totalAnswered"></span> tentatives
                            </h4>

                            <!-- Sprint score -->
                            <div data-bind="visible: exerciseType() === 'sprint'" class="mt-2">
                                <h4>⏱️ <strong data-bind="text: sprintElapsed"></strong>s &nbsp;·&nbsp; Score : <strong data-bind="text: score"></strong>/<span data-bind="text: totalQuestions"></span></h4>
                                <p data-bind="visible: bestTimeLabel()" class="qm-muted mt-1">
                                    🏅 Meilleur temps : <strong data-bind="text: bestTimeLabel"></strong>
                                </p>
                            </div>

                            <button data-bind="click: restart" class="btn qm-btn mt-3 px-4 py-3">🔄 Recommencer</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}
