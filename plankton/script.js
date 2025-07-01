document.addEventListener('DOMContentLoaded', () => {

    // --- Configuratie ---
    const SUB_CODES = ["KR@B", "BURG3R", "seke-kaka", "nieuwpo0rt"];
    
    const MISSION_TEXT = "Gegroet. Jullie, de leden van KLJ Wolfsdonk, zijn door mij, Plankton, geselecteerd om de ultieme diefstal te plegen. Jullie missie: infiltreer de Krokante Krab en steel het meest waardevolle bezit van Bikinibroek... de geheime formule van de Krabburger. Maar pas op. Krabs heeft die eekhoorn, Sandy, ingehuurd om een meesterlijk beveiligingssysteem te installeren. Talloze pogingen om het te doorbreken zijn al mislukt. Voor jullie is falen geen optie. Succes.";
    
    let unlockedLayers = {};

    // --- Element Selecties ---
    const loginScreen = document.getElementById('login-screen');
    const missionScreen = document.getElementById('mission-screen');
    const successScreen = document.getElementById('success-screen');

    const loginForm = document.getElementById('login-form');
    const crewNameInput = document.getElementById('crew-name-input');
    const crewNameDisplays = document.querySelectorAll('.crew-name-display');

    const heistForm = document.getElementById('heist-form');
    const passcode_input = document.getElementById('passcode-input');
    const feedbackMessage = document.getElementById('feedback-message');
    const resetLink = document.getElementById('reset-link');

    const modalContainer = document.getElementById('mission-modal-container');
    const modalTextElement = document.getElementById('modal-text');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // --- Kernfuncties ---

    function initializeGame() {
        const savedCrewName = localStorage.getItem('crewName');
        if (savedCrewName) {
            const savedLayers = localStorage.getItem('unlockedLayers');
            crewNameDisplays.forEach(span => span.textContent = savedCrewName);
            unlockedLayers = JSON.parse(savedLayers || '{}');
            updateProgressIndicator();
            loginScreen.classList.add('hidden');
            missionScreen.classList.remove('hidden');
            checkWinCondition(false);
        } else {
            resetGame();
            modalContainer.style.display = 'flex';
            startTypewriter();
        }
    }

    function updateProgressIndicator() {
        SUB_CODES.forEach((code, index) => {
            // FIX #2: Gebruik de index van de code om de juiste ID te vinden (bv. 'layer-0', 'layer-1', etc.)
            const layerId = `layer-${index}`;
            const layerElement = document.getElementById(layerId);
            
            if (layerElement) {
                // We controleren de ontgrendelstatus met de *echte* code (bv. 'nieuwpo0rt')
                if (unlockedLayers[code]) {
                    layerElement.classList.remove('locked');
                    layerElement.classList.add('unlocked');
                    layerElement.innerHTML = `<span>🔓</span> Laag ${index + 1}: ONTGRENDELD`;
                } else {
                    layerElement.classList.add('locked');
                    layerElement.classList.remove('unlocked');
                    layerElement.innerHTML = `<span>🔒</span> Laag ${index + 1}: VERGRENDELD`;
                }
            }
        });
    }

    // --- Event Listeners ---

    // Behandelt het invoeren van subcodes
    heistForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        // FIX #1: Verwijder .toUpperCase(). De controle gebeurt nu zonder de tekst te veranderen.
        const userInput = passcode_input.value.trim();

        if (!userInput) return;

        // Controleer of de ingevoerde tekst *exact* overeenkomt met een van de subcodes
        if (SUB_CODES.includes(userInput)) {
            // Gebruik de `userInput` (die nu de juiste hoofdletters heeft) als sleutel
            if (!unlockedLayers[userInput]) {
                unlockedLayers[userInput] = true;
                const crewName = localStorage.getItem('crewName');
                saveState(crewName, unlockedLayers);
                
                updateProgressIndicator();
                showFeedback('CODE GEACCEPTEERD! LAAG ONTGRENDELD!', 'success');
                checkWinCondition();
            } else {
                showFeedback('LAAG AL ONTGRENDELD. PROBEER EEN ANDERE CODE.', 'warn');
            }
        } else {
            showFeedback('CODE FOUT. SYSTEEM REAGEERT NIET.', 'error');
        }
        passcode_input.value = '';
    });

    function startTypewriter() {
        let i = 0;
        const speed = 40;
        function type() {
            if (i < MISSION_TEXT.length) {
                modalTextElement.innerHTML += MISSION_TEXT.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                modalTextElement.classList.add('typing-complete');
                modalCloseBtn.classList.remove('hidden');
            }
        }
        type();
    }

    function resetGame() {
        localStorage.removeItem('crewName');
        localStorage.removeItem('unlockedLayers');
        SUB_CODES.forEach(code => unlockedLayers[code] = false);
    }
    
    function saveState(crewName, layers) {
        localStorage.setItem('crewName', crewName);
        localStorage.setItem('unlockedLayers', JSON.stringify(layers));
    }

    function checkWinCondition(showWinScreen = true) {
        const allUnlocked = Object.values(unlockedLayers).every(status => status === true);
        if (allUnlocked && showWinScreen) {
            showFeedback('ALLE SYSTEMEN GEKRAAKT! DE KLUIS GAAT OPEN...', 'success');
            setTimeout(() => {
                missionScreen.classList.add('hidden');
                successScreen.classList.remove('hidden');
                triggerConfetti();
            }, 2000);
        }
        return allUnlocked;
    }

    function showFeedback(message, type) {
        feedbackMessage.textContent = message;
        feedbackMessage.className = type;
        feedbackMessage.classList.remove('hidden');
        setTimeout(() => { feedbackMessage.classList.add('hidden'); }, 3000);
    }
    
    function triggerConfetti() {
        const container = successScreen;
        if (!container) return;
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'absolute';
            confetti.style.width = `${Math.random() * 10 + 5}px`;
            confetti.style.height = confetti.style.width;
            confetti.style.backgroundColor = ['#f7b801', '#a2d2ff', '#ff4d4d', '#4caf50'][Math.floor(Math.random() * 4)];
            confetti.style.top = `${Math.random() * 100}%`;
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.animation = `fall ${Math.random() * 2 + 3}s linear forwards`;
            confetti.style.borderRadius = '50%';
            container.style.position = 'relative';
            container.appendChild(confetti);
        }
        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = `@keyframes fall { to { transform: translateY(100vh); opacity: 0; } }`;
        document.head.appendChild(styleSheet);
    }
    
    modalCloseBtn.addEventListener('click', () => { modalContainer.style.display = 'none'; });
    
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const crewName = crewNameInput.value.trim();
        if (crewName) {
            crewNameDisplays.forEach(span => span.textContent = crewName);
            saveState(crewName, unlockedLayers);
            loginScreen.classList.add('hidden');
            missionScreen.classList.remove('hidden');
        } else {
             crewNameInput.style.border = '2px solid #ff4d4d';
        }
    });
    
    resetLink.addEventListener('click', (event) => {
        event.preventDefault();
        if (confirm('Weet je zeker dat je alle voortgang wilt wissen en opnieuw wilt beginnen?')) {
            resetGame();
            location.reload();
        }
    });

    // --- Start het spel ---
    initializeGame();
});