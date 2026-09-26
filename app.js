/* --- FocusOra Application Logic --- */

// Application State Management
let state = {
    subjects: [
        { id: 'sub-1', name: 'General Study', emoji: '📚', color: '#3b82f6', totalSeconds: 0 },
        { id: 'sub-2', name: 'English', emoji: '✍️', color: '#10b981', totalSeconds: 0 },
        { id: 'sub-3', name: 'Mathematics', emoji: '📐', color: '#8b5cf6', totalSeconds: 0 }
    ],
    sessions: [], // { id, subjectId, timestamp, durationSeconds }
    settings: {
        sound: 'chime',
        volume: 80,
        vibrate: true
    },
    timer: {
        activeSubjectId: 'sub-1',
        targetSeconds: 1800, // 30 min default
        timeRemaining: 1800,
        isRunning: false,
        startTimestamp: null,
        elapsedBeforePause: 0,
        lastBeepSecond: null
    }
};

// Timer loop reference
let timerInterval = null;

// Audio Context for offline synthesis
let audioCtx = null;

// DOM Elements
const DOM = {
    // Navigation Tabs
    tabs: document.querySelectorAll('.nav-tab'),
    views: document.querySelectorAll('.app-view'),
    headerTitle: document.getElementById('header-title'),
    
    // Timer Elements
    activeSubjectBadge: document.getElementById('active-subject-badge'),
    activeSubjectIcon: document.getElementById('active-subject-icon'),
    activeSubjectName: document.getElementById('active-subject-name'),
    subjectDropdown: document.getElementById('subject-dropdown'),
    dropdownList: document.getElementById('dropdown-list'),
    closeDropdownBtn: document.getElementById('close-dropdown-btn'),
    addSubjectShortcutBtn: document.getElementById('add-subject-shortcut-btn'),
    timerProgress: document.getElementById('timer-progress'),
    timerNumbers: document.getElementById('timer-numbers'),
    timerSubjectMini: document.getElementById('timer-subject-mini'),
    presetBtns: document.querySelectorAll('.preset-btn'),
    customTimeBtn: document.getElementById('custom-time-btn'),
    
    // Custom Time Picker Modal
    customPickerModal: document.getElementById('custom-picker-modal'),
    pickerHours: document.getElementById('picker-hours'),
    pickerMinutes: document.getElementById('picker-minutes'),
    cancelCustomBtn: document.getElementById('cancel-custom-btn'),
    applyCustomBtn: document.getElementById('apply-custom-btn'),
    
    // Controls
    resetTimerBtn: document.getElementById('reset-timer-btn'),
    playPauseBtn: document.getElementById('play-pause-btn'),
    playIcon: document.getElementById('play-icon'),
    pauseIcon: document.getElementById('pause-icon'),
    enterFullscreenBtn: document.getElementById('enter-fullscreen-btn'),
    quickFullscreenBtn: document.getElementById('quick-fullscreen-btn'),
    
    // Subjects View Elements
    subjectsGrid: document.getElementById('subjects-grid'),
    addSubjectBtn: document.getElementById('add-subject-btn'),
    subjectModal: document.getElementById('subject-modal'),
    subjectModalTitle: document.getElementById('subject-modal-title'),
    subjectNameInput: document.getElementById('subject-name-input'),
    cancelSubjectBtn: document.getElementById('cancel-subject-btn'),
    saveSubjectBtn: document.getElementById('save-subject-btn'),
    emojiOptions: document.querySelectorAll('.emoji-option'),
    colorOptions: document.querySelectorAll('.color-option'),
    
    // Dashboard Elements
    statToday: document.getElementById('stat-today'),
    statWeek: document.getElementById('stat-week'),
    statMonth: document.getElementById('stat-month'),
    monthlyChartContainer: document.getElementById('monthly-chart-container'),
    donutChartContainer: document.getElementById('donut-chart-container'),
    chartLegend: document.getElementById('chart-legend'),
    historyList: document.getElementById('history-list'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    
    // Settings Elements
    alarmSoundSelect: document.getElementById('alarm-sound-select'),
    alarmVolumeSlider: document.getElementById('alarm-volume-slider'),
    vibrateToggle: document.getElementById('vibrate-toggle'),
    exportDataBtn: document.getElementById('export-data-btn'),
    importDataBtn: document.getElementById('import-data-btn'),
    importFileInput: document.getElementById('import-file-input'),
    factoryResetBtn: document.getElementById('factory-reset-btn'),
    
    // Fullscreen Overlay
    fullscreenOverlay: document.getElementById('fullscreen-overlay'),
    fullscreenTimerDigits: document.getElementById('fullscreen-timer-digits'),
    fullscreenSubjectLabel: document.getElementById('fullscreen-subject-label')
};

// Emoji and Color selection state for Subject Modal
let selectedEmoji = '📚';
let selectedColor = '#3b82f6';
let editingSubjectId = null;

/* --- Core Application Init --- */
// Screen Wake Lock API to prevent sleep
let wakeLock = null;
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock is active');
        }
    } catch (err) {
        console.warn(`Wake lock request failed: ${err.name}, ${err.message}`);
    }
}

// Local Notification Management
const TIMER_NOTIF_ID = 9999;

async function requestNotificationPermission() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
        const { LocalNotifications } = window.Capacitor.Plugins;
        try {
            const perm = await LocalNotifications.checkPermissions();
            if (perm.display !== 'granted') {
                await LocalNotifications.requestPermissions();
            }
        } catch (err) {
            console.warn("LocalNotifications permissions error:", err);
        }
    }
}

async function scheduleEndNotification(secondsRemaining) {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
        const { LocalNotifications } = window.Capacitor.Plugins;
        try {
            await cancelEndNotification(); // clear existing first
            
            const activeSubject = state.subjects.find(s => s.id === state.timer.activeSubjectId) || { name: 'Study' };
            const fireDate = new Date(Date.now() + secondsRemaining * 1000);
            
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: "Focus Session Finished! 🎉",
                        body: `Great job! You completed your study session for "${activeSubject.name}".`,
                        id: TIMER_NOTIF_ID,
                        schedule: { at: fireDate },
                        sound: 'default',
                        attachments: null,
                        actionTypeId: "",
                        extra: null
                    }
                ]
            });
            console.log("Scheduled completed notification for", fireDate);
        } catch (err) {
            console.warn("Failed to schedule local notification:", err);
        }
    }
}

async function cancelEndNotification() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
        const { LocalNotifications } = window.Capacitor.Plugins;
        try {
            await LocalNotifications.cancel({
                notifications: [{ id: TIMER_NOTIF_ID }]
            });
            console.log("Cancelled timer completion notification.");
        } catch (err) {
            console.warn("Failed to cancel local notification:", err);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initNavigation();
    initTimerControls();
    initSubjectView();
    initDashboard();
    initSettings();
    updateTimerUI();
    requestWakeLock();
    requestNotificationPermission();
});

document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});

// Load state from localStorage
function loadData() {
    let savedData = localStorage.getItem('focusOra_data');
    if (!savedData) {
        // Migrate from old focusora_data key if exists
        savedData = localStorage.getItem('focusora_data');
        if (!savedData) {
            // Migrate from old focus_space_data key if exists
            savedData = localStorage.getItem('focus_space_data');
        }
        if (savedData) {
            localStorage.setItem('focusOra_data', savedData);
        }
    }
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            if (parsed.subjects) state.subjects = parsed.subjects;
            if (parsed.sessions) state.sessions = parsed.sessions;
            if (parsed.settings) state.settings = parsed.settings;
            if (parsed.timer) {
                state.timer.activeSubjectId = parsed.timer.activeSubjectId || state.subjects[0].id;
                state.timer.targetSeconds = parsed.timer.targetSeconds || 1500;
                state.timer.timeRemaining = state.timer.targetSeconds;
            }
        } catch (e) {
            console.error("Error loading saved data, resetting to defaults", e);
        }
    }
}

// Save state to localStorage
function saveData() {
    localStorage.setItem('focusOra_data', JSON.stringify({
        subjects: state.subjects,
        sessions: state.sessions,
        settings: state.settings,
        timer: {
            activeSubjectId: state.timer.activeSubjectId,
            targetSeconds: state.timer.targetSeconds
        }
    }));
}

/* --- Navigation Routing --- */
function initNavigation() {
    DOM.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetViewId = tab.dataset.view;
            
            // Switch tabs
            DOM.tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Switch views
            DOM.views.forEach(view => {
                view.classList.remove('active');
                if (view.id === targetViewId) {
                    view.classList.add('active');
                }
            });
            
            // Set Header Title
            const titleMap = {
                'view-timer': 'FocusOra',
                'view-subjects': 'Subjects',
                'view-dashboard': 'Analytics',
                'view-settings': 'Settings'
            };
            DOM.headerTitle.textContent = titleMap[targetViewId] || 'FocusOra';
            
            // Refresh Dashboard when entering dashboard view
            if (targetViewId === 'view-dashboard') {
                renderDashboard();
            }
        });
    });
}

/* --- Audio Synthesizer (Works 100% Offline) --- */
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playAlarmSound() {
    initAudio();
    const volume = state.settings.volume / 100;
    const type = state.settings.sound;
    
    if (type === 'none' || volume === 0) return;
    
    const now = audioCtx.currentTime;
    
    if (type === 'chime') {
        // Melodious Crystal Bell Arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
        notes.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            const start = now + (index * 0.15);
            gainNode.gain.setValueAtTime(0, start);
            gainNode.gain.linearRampToValueAtTime(volume * 0.4, start + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, start + 1.8);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            
            osc.start(start);
            osc.stop(start + 2.0);
        });
    } else if (type === 'digital') {
        // Smart Watch Melody Motif (Smooth Triangle Waves)
        const notes = [880, 880, 987.77, 987.77, 1174.66, 1174.66, 1318.51]; // A5, A5, B5, B5, D6, D6, E6
        const times = [0, 0.12, 0.28, 0.40, 0.56, 0.68, 0.84];
        const durations = [0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.18];
        
        notes.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            const start = now + times[index];
            const dur = durations[index];
            
            gainNode.gain.setValueAtTime(0, start);
            gainNode.gain.linearRampToValueAtTime(volume * 0.5, start + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, start + dur);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);
            
            osc.start(start);
            osc.stop(start + dur + 0.1);
        });
    } else if (type === 'zen') {
        // Resonant Tibetan Singing Bowl Gong (Harmonic & Warm)
        const freqs = [196.00, 293.66, 392.00, 493.88, 587.33]; // G3, D4, G4, B4, D5 (G Major resonance)
        freqs.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            const volCoef = index === 0 ? 0.5 : (0.3 / index);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume * volCoef, now + 0.08);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            
            // Add slow organic frequency warble (vibrato)
            osc.frequency.linearRampToValueAtTime(freq + 1.2, now + 2.0);
            osc.frequency.linearRampToValueAtTime(freq - 1.2, now + 4.0);
            
            osc.start(now);
            osc.stop(now + 4.5);
        });
    } else if (type === 'sunrise') {
        // Happy Sunrise (Joyful Upbeat Melody)
        const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C5, D5, E5, G5, A5, C6
        const times = [0, 0.15, 0.3, 0.45, 0.6, 0.75];
        notes.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            const start = now + times[index];
            gainNode.gain.setValueAtTime(0, start);
            gainNode.gain.linearRampToValueAtTime(volume * 0.35, start + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, start + 1.2);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            
            osc.start(start);
            osc.stop(start + 1.5);
        });
    } else if (type === 'cosmic') {
        // Cosmic Glow (Swelling Ambient Chords)
        const freqs = [261.63, 329.63, 392.00, 493.88, 523.25]; // C4, E4, G4, B4, C5
        freqs.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume * 0.25, now + 0.8);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            
            osc.start(now);
            osc.stop(now + 3.5);
        });
    } else if (type === 'clock') {
        // Classic Clock (Double Beeps: Beep-Beep, Pause, Beep-Beep)
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, now);
        
        gainNode.gain.setValueAtTime(0, now);
        const beats = [0, 0.15, 0.5, 0.65];
        beats.forEach(beatStart => {
            gainNode.gain.setValueAtTime(volume * 0.4, now + beatStart);
            gainNode.gain.setValueAtTime(0, now + beatStart + 0.08);
        });
        
        osc.start(now);
        osc.stop(now + 1.0);
    } else if (type === 'bird') {
        // Forest Chirp (Rapid Frequency Sweep Simulation)
        for (let i = 0; i < 3; i++) {
            const start = now + (i * 0.35);
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            gainNode.gain.setValueAtTime(0, start);
            gainNode.gain.linearRampToValueAtTime(volume * 0.3, start + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1800, start);
            osc.frequency.exponentialRampToValueAtTime(3200, start + 0.15);
            
            osc.start(start);
            osc.stop(start + 0.3);
        }
    } else if (type === 'elevate') {
        // Elevate Arpeggio (Inspiring Rising Techno Synth)
        const notes = [261.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1567.98]; // C4, G4, C5, E5, G5, C6, G6
        const tempo = 0.08;
        notes.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            const start = now + (index * tempo);
            gainNode.gain.setValueAtTime(0, start);
            gainNode.gain.linearRampToValueAtTime(volume * 0.45, start + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, start);
            
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000, start);
            
            osc.disconnect(gainNode);
            osc.connect(filter);
            filter.connect(gainNode);
            
            osc.start(start);
            osc.stop(start + 0.4);
        });
    } else if (type === 'bell') {
        // Echo Bell (Deep resonant cathedral bell with fading echoes)
        const freq = 440.00; // A4
        const strikes = [0, 0.4, 0.8];
        strikes.forEach((delay, index) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            const start = now + delay;
            const strikeVol = volume * (0.6 / Math.pow(2, index));
            
            gainNode.gain.setValueAtTime(0, start);
            gainNode.gain.linearRampToValueAtTime(strikeVol, start + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, start + 2.5);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);
            
            const osc2 = audioCtx.createOscillator();
            osc2.frequency.setValueAtTime(freq * 1.5, start); // fifth harmonic
            osc2.type = 'sine';
            const gainNode2 = audioCtx.createGain();
            osc2.connect(gainNode2);
            gainNode2.connect(audioCtx.destination);
            
            gainNode2.gain.setValueAtTime(0, start);
            gainNode2.gain.linearRampToValueAtTime(strikeVol * 0.4, start + 0.02);
            gainNode2.gain.exponentialRampToValueAtTime(0.0001, start + 2.0);
            
            osc.start(start);
            osc2.start(start);
            osc.stop(start + 2.5);
            osc2.stop(start + 2.5);
        });
    } else if (type === 'fanfare') {
        // Victory Fanfare (Short brass victory melody)
        const notes = [523.25, 523.25, 523.25, 523.25, 659.25, 587.33, 659.25, 783.99, 1046.50];
        const times = [0, 0.1, 0.2, 0.3, 0.45, 0.55, 0.65, 0.75, 0.95];
        const durations = [0.08, 0.08, 0.08, 0.12, 0.08, 0.08, 0.08, 0.15, 0.4];
        
        notes.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            const start = now + times[index];
            const dur = durations[index];
            
            gainNode.gain.setValueAtTime(0, start);
            gainNode.gain.linearRampToValueAtTime(volume * 0.45, start + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, start + dur);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);
            
            osc.start(start);
            osc.stop(start + dur + 0.1);
        });
    }
}

function playCountdownTickSound() {
    initAudio();
    const volume = state.settings.volume / 100;
    if (state.settings.sound === 'none' || volume === 0) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.type = 'sine';
    // 880 Hz is A5, crisp and warning tone
    osc.frequency.setValueAtTime(880, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume * 0.45, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.start(now);
    osc.stop(now + 0.15);
}

// Device Vibration API support
function triggerVibration() {
    if (state.settings.vibrate && navigator.vibrate) {
        // Vibrate pattern: vibrate 300ms, pause 150ms, vibrate 300ms
        navigator.vibrate([300, 150, 300]);
    }
}

function triggerShortVibration() {
    if (state.settings.vibrate && navigator.vibrate) {
        navigator.vibrate(60); // 60ms brief pulse
    }
}

/* --- Timer Functionality --- */
function initTimerControls() {
    // Subject Selection badge click
    DOM.activeSubjectBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        openSubjectDropdown();
    });
    
    DOM.closeDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeSubjectDropdown();
    });
    
    // Add subject shortcut from dropdown
    DOM.addSubjectShortcutBtn.addEventListener('click', () => {
        closeSubjectDropdown();
        openSubjectModal();
    });
    
    // Close dropdown on click outside
    document.addEventListener('click', () => {
        closeSubjectDropdown();
    });
    
    // Preset Buttons Click
    DOM.presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.timer.isRunning) return;
            
            DOM.presetBtns.forEach(p => p.classList.remove('active'));
            DOM.customTimeBtn.classList.remove('active');
            btn.classList.add('active');
            
            const minutes = parseInt(btn.dataset.time);
            setTimerDuration(minutes * 60);
        });
    });
    
    // Custom Time Button
    DOM.customTimeBtn.addEventListener('click', () => {
        if (state.timer.isRunning) return;
        DOM.customPickerModal.classList.add('active');
    });
    
    DOM.cancelCustomBtn.addEventListener('click', () => {
        DOM.customPickerModal.classList.remove('active');
    });
    
    DOM.applyCustomBtn.addEventListener('click', () => {
        const hours = parseInt(DOM.pickerHours.value) || 0;
        const minutes = parseInt(DOM.pickerMinutes.value) || 0;
        
        const totalSecs = (hours * 3600) + (minutes * 60);
        if (totalSecs > 0) {
            DOM.presetBtns.forEach(p => p.classList.remove('active'));
            DOM.customTimeBtn.classList.add('active');
            setTimerDuration(totalSecs);
        }
        
        DOM.customPickerModal.classList.remove('active');
    });
    
    // Play/Pause Timer
    DOM.playPauseBtn.addEventListener('click', () => {
        initAudio(); // Activate context on first user gesture
        if (state.timer.isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    });
    
    // Reset Timer
    DOM.resetTimerBtn.addEventListener('click', resetTimer);
    
    // Fullscreen toggles
    DOM.enterFullscreenBtn.addEventListener('click', enterFullscreenMode);
    DOM.quickFullscreenBtn.addEventListener('click', enterFullscreenMode);
    
    // Double-tap (mobile) and Double-click (desktop) to exit fullscreen
    let lastTap = 0;
    DOM.fullscreenOverlay.addEventListener('touchstart', (e) => {
        const currentTime = Date.now();
        const tapLength = currentTime - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            exitFullscreenMode();
            e.preventDefault();
        }
        lastTap = currentTime;
    });
    DOM.fullscreenOverlay.addEventListener('dblclick', exitFullscreenMode);
}

function setTimerDuration(seconds) {
    if (state.timer.elapsedBeforePause > 0) {
        logCurrentSession();
    }
    state.timer.targetSeconds = seconds;
    state.timer.timeRemaining = seconds;
    state.timer.elapsedBeforePause = 0;
    updateTimerUI();
}

function getActiveSubject() {
    return state.subjects.find(s => s.id === state.timer.activeSubjectId) || state.subjects[0];
}

function openSubjectDropdown() {
    // Populate Dropdown
    DOM.dropdownList.innerHTML = '';
    state.subjects.forEach(subject => {
        const item = document.createElement('div');
        item.className = `dropdown-item ${subject.id === state.timer.activeSubjectId ? 'selected' : ''}`;
        
        item.innerHTML = `
            <div class="dropdown-item-content">
                <div class="dropdown-item-icon" style="background-color: ${subject.color}15; color: ${subject.color}">${subject.emoji}</div>
                <div class="dropdown-item-name">${subject.name}</div>
            </div>
            ${subject.id === state.timer.activeSubjectId ? '<svg class="dropdown-item-check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
        `;
        
        item.addEventListener('click', () => {
            selectSubject(subject.id);
            closeSubjectDropdown();
        });
        
        DOM.dropdownList.appendChild(item);
    });
    
    DOM.subjectDropdown.classList.add('active');
}

function closeSubjectDropdown() {
    DOM.subjectDropdown.classList.remove('active');
}

function selectSubject(subjectId) {
    if (state.timer.isRunning) {
        pauseTimer();
    }
    if (state.timer.elapsedBeforePause > 0) {
        logCurrentSession();
    }
    state.timer.activeSubjectId = subjectId;
    saveData();
    updateTimerUI();
}

function startTimer() {
    if (state.timer.isRunning) return;
    
    state.timer.isRunning = true;
    state.timer.startTimestamp = Date.now();
    
    // Update play button styling
    DOM.playIcon.classList.add('hidden');
    DOM.pauseIcon.classList.remove('hidden');
    DOM.playPauseBtn.classList.add('paused-state');
    
    // Schedule notification when the timer will end
    scheduleEndNotification(state.timer.timeRemaining);

    // Start native background countdown service
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TimerPlugin) {
        const activeSub = getActiveSubject();
        window.Capacitor.Plugins.TimerPlugin.startNativeTimer({
            durationSeconds: state.timer.timeRemaining,
            subjectName: activeSub.name
        });
    }
    
    state.timer.lastBeepSecond = null;
    
    // Trigger high-accuracy timing interval
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.timer.startTimestamp) / 1000) + state.timer.elapsedBeforePause;
        const remaining = Math.max(0, state.timer.targetSeconds - elapsed);
        
        if (remaining !== state.timer.timeRemaining) {
            state.timer.timeRemaining = remaining;
            updateTimerUI();
            
            // Play countdown warning tick in the last 5 seconds
            if (state.timer.timeRemaining > 0 && state.timer.timeRemaining <= 5 && state.timer.lastBeepSecond !== state.timer.timeRemaining) {
                state.timer.lastBeepSecond = state.timer.timeRemaining;
                playCountdownTickSound();
                triggerShortVibration();
            }
        }
        
        if (state.timer.timeRemaining <= 0) {
            timerCompleted();
        }
    }, 250);
}

function pauseTimer() {
    if (!state.timer.isRunning) return;
    
    state.timer.isRunning = false;
    clearInterval(timerInterval);
    
    // Cancel notification
    cancelEndNotification();

    // Stop native background countdown service
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TimerPlugin) {
        window.Capacitor.Plugins.TimerPlugin.stopNativeTimer();
    }
    
    // Save current elapsed seconds
    const elapsed = Math.floor((Date.now() - state.timer.startTimestamp) / 1000);
    state.timer.elapsedBeforePause += elapsed;
    
    // Update play button styling
    DOM.pauseIcon.classList.add('hidden');
    DOM.playIcon.classList.remove('hidden');
    DOM.playPauseBtn.classList.remove('paused-state');
}

function resetTimer() {
    pauseTimer();
    if (state.timer.elapsedBeforePause > 0) {
        logCurrentSession();
    }
    state.timer.timeRemaining = state.timer.targetSeconds;
    state.timer.elapsedBeforePause = 0;
    updateTimerUI();
}

function logCurrentSession() {
    if (state.timer.elapsedBeforePause > 0) {
        const activeSubject = getActiveSubject();
        const duration = state.timer.elapsedBeforePause;
        
        if (duration >= 5) {
            const session = {
                id: 'sess-' + Date.now(),
                subjectId: activeSubject.id,
                timestamp: Date.now(),
                durationSeconds: duration
            };
            state.sessions.unshift(session);
            saveData();
            
            // Update subjects view time lists
            renderSubjects();
            
            // If on dashboard view, render charts/history
            const dashboardView = document.getElementById('view-dashboard');
            if (dashboardView && dashboardView.classList.contains('active')) {
                renderDashboard();
            }
        }
        state.timer.elapsedBeforePause = 0;
    }
}

function timerCompleted() {
    pauseTimer();
    const duration = state.timer.elapsedBeforePause;
    logCurrentSession();
    
    // Play sound and trigger vibration
    playAlarmSound();
    triggerVibration();
    
    // Reset timer
    state.timer.timeRemaining = state.timer.targetSeconds;
    state.timer.elapsedBeforePause = 0;
    updateTimerUI();
    
    // Exit Fullscreen mode if active
    exitFullscreenMode();
    
    // Visual alert modal or prompt
    const activeSubject = getActiveSubject();
    showCustomAlert(
        "🎉 Great work!",
        `You completed your ${formatDurationText(duration)} focus session for ${activeSubject.name}.`
    );
}

function formatTimerTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function updateTimerUI() {
    const activeSubject = getActiveSubject();
    
    // Update active subject displays
    DOM.activeSubjectIcon.textContent = activeSubject.emoji;
    DOM.activeSubjectName.textContent = activeSubject.name;
    DOM.timerSubjectMini.textContent = activeSubject.name;
    DOM.fullscreenSubjectLabel.textContent = activeSubject.name;
    
    // Set custom accent variables on DOM
    document.documentElement.style.setProperty('--primary-color', activeSubject.color);
    document.documentElement.style.setProperty('--primary-glow', `${activeSubject.color}44`);
    
    // Format time dynamically based on duration (HH:MM:SS if >= 1 hour, otherwise MM:SS)
    const formattedTime = formatTimerTime(state.timer.timeRemaining);
    
    DOM.timerNumbers.textContent = formattedTime;
    DOM.fullscreenTimerDigits.textContent = formattedTime;
    
    // SVG Circular Progress offset logic
    // Circumference = 2 * PI * r = 2 * 3.14159 * 95 = 596.9 (use 597)
    const strokeLength = 597;
    const progressPercent = state.timer.timeRemaining / state.timer.targetSeconds;
    const offset = strokeLength - (progressPercent * strokeLength);
    DOM.timerProgress.setAttribute('stroke-dashoffset', offset.toString());
}

/* --- Fullscreen Mode Manager --- */
function enterFullscreenMode() {
    DOM.fullscreenOverlay.classList.add('active');
    
    // 1. Native Capacitor implementation
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
        const plugins = window.Capacitor.Plugins;
        if (plugins.StatusBar) {
            plugins.StatusBar.hide().catch(err => console.log("StatusBar hide failed:", err));
        }
        if (plugins.ScreenOrientation) {
            plugins.ScreenOrientation.lock({ orientation: 'landscape' }).catch(err => console.log("ScreenOrientation lock failed:", err));
        }
    } else {
        // 2. Web Browser Fallback
        const docEl = document.documentElement;
        const reqFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen;
        if (reqFs) {
            reqFs.call(docEl).then(() => {
                if (screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock('landscape').catch(err => {
                        console.log("Web Landscape lock failed:", err);
                    });
                }
            }).catch(err => {
                console.log("Web Fullscreen request rejected:", err);
                if (screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock('landscape').catch(() => {});
                }
            });
        } else {
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(() => {});
            }
        }
    }
}

function exitFullscreenMode() {
    DOM.fullscreenOverlay.classList.remove('active');
    
    // 1. Native Capacitor implementation
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
        const plugins = window.Capacitor.Plugins;
        if (plugins.StatusBar) {
            plugins.StatusBar.show().catch(err => console.log("StatusBar show failed:", err));
        }
        if (plugins.ScreenOrientation) {
            plugins.ScreenOrientation.unlock().catch(err => console.log("ScreenOrientation unlock failed:", err));
        }
    } else {
        // 2. Web Browser Fallback
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
            if (exitFs) {
                exitFs.call(document).then(() => {
                    if (screen.orientation && screen.orientation.unlock) {
                        screen.orientation.unlock();
                    }
                }).catch(err => {
                    console.log("Web Fullscreen exit error:", err);
                });
            }
        } else {
            if (screen.orientation && screen.orientation.unlock) {
                screen.orientation.unlock();
            }
        }
    }
}

/* --- Subjects View Handler --- */
function initSubjectView() {
    DOM.addSubjectBtn.addEventListener('click', () => {
        openSubjectModal();
    });
    
    DOM.cancelSubjectBtn.addEventListener('click', () => {
        DOM.subjectModal.classList.remove('active');
    });
    
    DOM.saveSubjectBtn.addEventListener('click', saveSubject);
    
    // Emoji Selector Grid
    DOM.emojiOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            DOM.emojiOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            selectedEmoji = opt.textContent;
        });
    });
    
    // Color Selector Preset list
    DOM.colorOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            DOM.colorOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            selectedColor = opt.dataset.color;
        });
    });
    
    renderSubjects();
}

function renderSubjects() {
    DOM.subjectsGrid.innerHTML = '';
    
    state.subjects.forEach(subject => {
        // Calculate cumulative hours for this subject
        const secondsStudied = state.sessions
            .filter(s => s.subjectId === subject.id)
            .reduce((acc, curr) => acc + curr.durationSeconds, 0);
            
        const formattedTime = formatHoursMinutes(secondsStudied);
        
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.style.setProperty('--card-accent', subject.color);
        card.style.setProperty('--card-accent-opacity', `${subject.color}15`);
        
        card.innerHTML = `
            <div class="subject-card-left">
                <div class="subject-icon-wrap" style="color: ${subject.color}">${subject.emoji}</div>
                <div class="subject-info-text">
                    <h3>${subject.name}</h3>
                    <p>Total logged: ${formattedTime}</p>
                </div>
            </div>
            <div class="subject-card-right">
                <span class="time-badge">${formattedTime}</span>
                ${subject.id !== 'sub-1' ? `
                    <button class="icon-btn edit-subject-btn" data-id="${subject.id}" title="Edit Subject">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    </button>
                    <button class="icon-btn delete-subject-btn" data-id="${subject.id}" title="Delete Subject">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--danger)"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                ` : ''}
            </div>
        `;
        
        // Hook Edit Actions
        const editBtn = card.querySelector('.edit-subject-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openSubjectModal(subject.id);
            });
        }
        
        // Hook Delete Actions
        const deleteBtn = card.querySelector('.delete-subject-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteSubject(subject.id);
            });
        }
        
        DOM.subjectsGrid.appendChild(card);
    });
}

function openSubjectModal(subjectId = null) {
    editingSubjectId = subjectId;
    
    if (subjectId) {
        DOM.subjectModalTitle.textContent = "Edit Subject";
        const subject = state.subjects.find(s => s.id === subjectId);
        DOM.subjectNameInput.value = subject.name;
        
        // Select matching emoji
        selectedEmoji = subject.emoji;
        DOM.emojiOptions.forEach(opt => {
            opt.classList.toggle('active', opt.textContent === subject.emoji);
        });
        
        // Select matching color
        selectedColor = subject.color;
        DOM.colorOptions.forEach(opt => {
            opt.classList.toggle('active', opt.dataset.color === subject.color);
        });
    } else {
        DOM.subjectModalTitle.textContent = "New Subject";
        DOM.subjectNameInput.value = '';
        
        // Set defaults
        selectedEmoji = '📚';
        DOM.emojiOptions.forEach((opt, idx) => opt.classList.toggle('active', idx === 0));
        
        selectedColor = '#3b82f6';
        DOM.colorOptions.forEach((opt, idx) => opt.classList.toggle('active', idx === 0));
    }
    
    DOM.subjectModal.classList.add('active');
}

function saveSubject() {
    const name = DOM.subjectNameInput.value.trim();
    if (!name) {
        showCustomAlert("Name Required", "Please enter a subject name.");
        return;
    }
    
    if (editingSubjectId) {
        // Edit Existing
        const subject = state.subjects.find(s => s.id === editingSubjectId);
        if (subject) {
            subject.name = name;
            subject.emoji = selectedEmoji;
            subject.color = selectedColor;
        }
    } else {
        // Create New
        const newSubject = {
            id: 'sub-' + Date.now(),
            name: name,
            emoji: selectedEmoji,
            color: selectedColor,
            totalSeconds: 0
        };
        state.subjects.push(newSubject);
    }
    
    saveData();
    renderSubjects();
    updateTimerUI();
    DOM.subjectModal.classList.remove('active');
}

function deleteSubject(subjectId) {
    showCustomConfirm(
        "Delete Subject?",
        "All logged study sessions under this subject will be reassigned to 'General Study'.",
        true,
        () => {
            // Re-assign session logs to General Study
            state.sessions.forEach(s => {
                if (s.subjectId === subjectId) {
                    s.subjectId = 'sub-1';
                }
            });
            
            // Filter out subject
            state.subjects = state.subjects.filter(s => s.id !== subjectId);
            
            // If the active timer was on this subject, reset it
            if (state.timer.activeSubjectId === subjectId) {
                state.timer.activeSubjectId = 'sub-1';
            }
            
            saveData();
            renderSubjects();
            updateTimerUI();
        }
    );
}

/* --- Dashboard Analytics View --- */
function initDashboard() {
    state.activeChartTab = 'daily'; // Default to daily view
    
    DOM.clearHistoryBtn.addEventListener('click', () => {
        showCustomConfirm(
            "Clear Study Logs?", 
            "This will permanently erase all study session history and reset your dashboard charts. This cannot be undone.", 
            true, 
            () => {
                state.sessions = [];
                saveData();
                renderDashboard();
                renderSubjects();
            }
        );
    });
    
    // Chart toggle listeners
    const btnDaily = document.getElementById('btn-chart-daily');
    const btnMonthly = document.getElementById('btn-chart-monthly');
    const chartTitle = document.getElementById('chart-section-title');
    const chartSubtitle = document.getElementById('chart-section-subtitle');
    
    if (btnDaily && btnMonthly) {
        btnDaily.addEventListener('click', () => {
            state.activeChartTab = 'daily';
            btnDaily.classList.add('active');
            btnMonthly.classList.remove('active');
            if (chartTitle) chartTitle.textContent = "Study Activity";
            if (chartSubtitle) chartSubtitle.textContent = "Daily breakdown for the last 7 days";
            renderStudyActivityChart();
        });
        
        btnMonthly.addEventListener('click', () => {
            state.activeChartTab = 'monthly';
            btnMonthly.classList.add('active');
            btnDaily.classList.remove('active');
            if (chartTitle) chartTitle.textContent = "Monthly Study Hours";
            if (chartSubtitle) chartSubtitle.textContent = "Compare your monthly study dedication";
            renderStudyActivityChart();
        });
    }
}

function renderDashboard() {
    // 1. Calculate Summary Stats (Today, Week, Month)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Week: Last 7 calendar days
    const startOfWeek = startOfToday - (7 * 24 * 60 * 60 * 1000);
    
    // Month: Current calendar month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    let secsToday = 0;
    let secsWeek = 0;
    let secsMonth = 0;
    
    state.sessions.forEach(s => {
        if (s.timestamp >= startOfToday) secsToday += s.durationSeconds;
        if (s.timestamp >= startOfWeek) secsWeek += s.durationSeconds;
        if (s.timestamp >= startOfMonth) secsMonth += s.durationSeconds;
    });
    
    DOM.statToday.textContent = formatHoursMinutesShort(secsToday);
    DOM.statWeek.textContent = formatHoursMinutesShort(secsWeek);
    DOM.statMonth.textContent = formatHoursMinutesShort(secsMonth);
    
    // 2. Render Study Activity Chart (Daily or Monthly breakdown)
    renderStudyActivityChart();
    
    // 3. Render Subject Distribution Chart
    renderSubjectDistribution();
    
    // 4. Render History Logs Feed
    renderHistoryFeed();
}

// Render study activity chart based on current selection
function renderStudyActivityChart() {
    if (state.activeChartTab === 'monthly') {
        renderMonthlyChart();
    } else {
        renderDailyChart();
    }
}

// Format duration value for chart display
function formatChartValue(seconds) {
    if (seconds === 0) return '0';
    if (seconds < 3600) {
        return Math.round(seconds / 60) + 'm';
    }
    return (seconds / 3600).toFixed(1) + 'h';
}

// Render dynamic custom SVG daily chart
function renderDailyChart() {
    const container = DOM.monthlyChartContainer;
    container.innerHTML = '';
    
    const dailyData = [];
    const now = new Date();
    
    // Generate last 7 days including today
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        dailyData.push({
            year: d.getFullYear(),
            month: d.getMonth(),
            date: d.getDate(),
            label: d.toLocaleDateString('en-US', { weekday: 'short' }),
            seconds: 0
        });
    }
    
    state.sessions.forEach(s => {
        const sessionDate = new Date(s.timestamp);
        dailyData.forEach(day => {
            if (sessionDate.getFullYear() === day.year && 
                sessionDate.getMonth() === day.month && 
                sessionDate.getDate() === day.date) {
                day.seconds += s.durationSeconds;
            }
        });
    });
    
    const width = 360;
    const height = 220;
    const padding = 30;
    
    const maxSeconds = Math.max(...dailyData.map(d => d.seconds), 1800);
    
    let svgContent = `<svg class="svg-bar-chart" viewBox="0 0 ${width} ${height}">`;
    
    // Grid lines
    const gridLines = 4;
    for (let g = 0; g <= gridLines; g++) {
        const y = padding + ((height - 2 * padding) * (g / gridLines));
        const valSecs = maxSeconds * (1 - (g / gridLines));
        let valLabel = '';
        if (maxSeconds < 3600) {
            valLabel = Math.round(valSecs / 60) + 'm';
        } else {
            valLabel = (valSecs / 3600).toFixed(1) + 'h';
        }
        
        svgContent += `
            <line x1="${padding + 10}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
            <text x="${padding - 5}" y="${y + 4}" fill="var(--text-muted)" font-size="9" text-anchor="end">${valLabel}</text>
        `;
    }
    
    // Columns
    const colCount = dailyData.length;
    const chartWidth = width - 2 * padding - 20;
    const colSpacing = chartWidth / colCount;
    const colWidth = 20;
    
    dailyData.forEach((d, idx) => {
        const x = padding + 15 + (idx * colSpacing) + (colSpacing / 2) - (colWidth / 2);
        const colHeight = (d.seconds / maxSeconds) * (height - 2 * padding);
        const y = height - padding - colHeight;
        const displayVal = formatChartValue(d.seconds);
        
        // Today is highlighted in active theme color with glow
        const fill = idx === colCount - 1 ? 'var(--primary-color)' : 'rgba(255,255,255,0.15)';
        const glow = idx === colCount - 1 ? 'filter="drop-shadow(0 0 5px var(--primary-glow))"' : '';
        
        svgContent += `
            <rect x="${x}" y="${y}" width="${colWidth}" height="${Math.max(colHeight, 4)}" rx="4" ry="4" fill="${fill}" ${glow} />
            <text x="${x + colWidth/2}" y="${height - padding + 15}" fill="var(--text-secondary)" font-size="9" font-weight="500" text-anchor="middle">${d.label}</text>
            ${d.seconds > 0 ? `<text x="${x + colWidth/2}" y="${y - 8}" fill="var(--text-primary)" font-size="9" font-weight="600" text-anchor="middle">${displayVal}</text>` : ''}
        `;
    });
    
    svgContent += `</svg>`;
    container.innerHTML = svgContent;
}

// Render dynamic custom SVG monthly chart
function renderMonthlyChart() {
    const container = DOM.monthlyChartContainer;
    container.innerHTML = '';
    
    // Group logs by month: Last 3 months + current month
    const monthsData = [];
    const now = new Date();
    
    for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthsData.push({
            year: d.getFullYear(),
            month: d.getMonth(),
            label: d.toLocaleString('en-US', { month: 'short' }),
            seconds: 0
        });
    }
    
    state.sessions.forEach(s => {
        const sessionDate = new Date(s.timestamp);
        monthsData.forEach(m => {
            if (sessionDate.getFullYear() === m.year && sessionDate.getMonth() === m.month) {
                m.seconds += s.durationSeconds;
            }
        });
    });
    
    // SVG dimensions
    const width = 360;
    const height = 220;
    const padding = 30;
    
    // Calculate scaling factor
    const maxSeconds = Math.max(...monthsData.map(m => m.seconds), 3600); // minimum 1h max to draw properly
    
    let svgContent = `<svg class="svg-bar-chart" viewBox="0 0 ${width} ${height}">`;
    
    // Render horizontal grid lines
    const gridLines = 4;
    for (let g = 0; g <= gridLines; g++) {
        const y = padding + ((height - 2 * padding) * (g / gridLines));
        const valHrs = Math.round(((maxSeconds * (1 - (g / gridLines))) / 3600) * 10) / 10;
        svgContent += `
            <line x1="${padding + 10}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
            <text x="${padding - 5}" y="${y + 4}" fill="var(--text-muted)" font-size="9" text-anchor="end">${valHrs}h</text>
        `;
    }
    
    // Draw columns
    const colCount = monthsData.length;
    const chartWidth = width - 2 * padding - 20;
    const colSpacing = chartWidth / colCount;
    const colWidth = 32;
    
    monthsData.forEach((m, idx) => {
        const x = padding + 20 + (idx * colSpacing) + (colSpacing / 2) - (colWidth / 2);
        const colHeight = (m.seconds / maxSeconds) * (height - 2 * padding);
        const y = height - padding - colHeight;
        const hours = (m.seconds / 3600).toFixed(1);
        
        // Active month highlight
        const fill = idx === colCount - 1 ? 'var(--primary-color)' : 'rgba(255,255,255,0.15)';
        const glow = idx === colCount - 1 ? 'filter="drop-shadow(0 0 5px var(--primary-glow))"' : '';
        
        svgContent += `
            <rect x="${x}" y="${y}" width="${colWidth}" height="${Math.max(colHeight, 4)}" rx="6" ry="6" fill="${fill}" ${glow} />
            <text x="${x + colWidth/2}" y="${height - padding + 15}" fill="var(--text-secondary)" font-size="10" font-weight="500" text-anchor="middle">${m.label}</text>
            <text x="${x + colWidth/2}" y="${y - 8}" fill="var(--text-primary)" font-size="10" font-weight="600" text-anchor="middle">${hours}h</text>
        `;
    });
    
    svgContent += `</svg>`;
    container.innerHTML = svgContent;
}

// Render dynamic custom SVG donut chart & legend
function renderSubjectDistribution() {
    const container = DOM.donutChartContainer;
    const legend = DOM.chartLegend;
    
    container.innerHTML = '';
    legend.innerHTML = '';
    
    // Aggregate seconds per subject
    const subjectStats = state.subjects.map(sub => {
        const secs = state.sessions
            .filter(s => s.subjectId === sub.id)
            .reduce((acc, curr) => acc + curr.durationSeconds, 0);
        return {
            ...sub,
            seconds: secs
        };
    }).filter(s => s.seconds > 0); // only active subjects
    
    const totalSeconds = subjectStats.reduce((acc, curr) => acc + curr.seconds, 0);
    
    if (totalSeconds === 0) {
        // Render Empty state circle
        container.innerHTML = `
            <svg viewBox="0 0 100 100" width="100%" height="100%">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="12" />
                <text x="50" y="54" fill="var(--text-muted)" font-size="10" text-anchor="middle" font-weight="500">No Data</text>
            </svg>
        `;
        legend.innerHTML = '<div class="empty-state" style="padding: 0;">Start focus logs to populate breakdown.</div>';
        return;
    }
    
    let svgContent = `<svg viewBox="0 0 100 100" width="100%" height="100%">`;
    let accumulatedPercent = 0;
    
    // Circumference = 2 * PI * r = 2 * 3.14159 * 35 = 219.9 (use 220)
    const strokeCircumference = 220;
    
    subjectStats.forEach((stat, idx) => {
        const pct = stat.seconds / totalSeconds;
        const strokeDash = pct * strokeCircumference;
        const strokeOffset = strokeCircumference - strokeDash + (accumulatedPercent * strokeCircumference);
        
        // Draw segment circle
        svgContent += `
            <circle cx="50" cy="50" r="35" 
                fill="none" 
                stroke="${stat.color}" 
                stroke-width="12" 
                stroke-dasharray="${strokeCircumference}" 
                stroke-dashoffset="${strokeOffset}" 
                transform="rotate(-90 50 50)" />
        `;
        
        accumulatedPercent -= pct;
        
        // Render corresponding Legend Item
        const pctText = Math.round(pct * 100) + '%';
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <div class="legend-left">
                <span class="legend-color" style="background-color: ${stat.color};"></span>
                <span class="legend-name">${stat.emoji} ${stat.name}</span>
            </div>
            <span class="legend-time">${pctText} (${formatHoursMinutesShort(stat.seconds)})</span>
        `;
        legend.appendChild(legendItem);
    });
    
    svgContent += `
        <circle cx="50" cy="50" r="29" fill="var(--bg-main)" />
        <text x="50" y="53" fill="var(--text-primary)" font-size="9" text-anchor="middle" font-weight="700">Total</text>
        <text x="50" y="61" fill="var(--text-secondary)" font-size="7" text-anchor="middle" font-weight="500">${formatHoursMinutesShort(totalSeconds)}</text>
    </svg>`;
    
    container.innerHTML = svgContent;
}

// Render dynamic list of recent focus sessions
function renderHistoryFeed() {
    const list = DOM.historyList;
    list.innerHTML = '';
    
    if (state.sessions.length === 0) {
        list.innerHTML = '<div class="empty-state">No study history recorded yet. Select a subject and start studying!</div>';
        return;
    }
    
    // Show top 6 logs
    const displayLogs = state.sessions.slice(0, 6);
    
    displayLogs.forEach(sess => {
        const subject = state.subjects.find(sub => sub.id === sess.subjectId) || { name: 'Unknown', emoji: '❓', color: '#64748b' };
        const dateObj = new Date(sess.timestamp);
        
        // Formats e.g. "May 27, 2026 - 10:45 AM"
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
                              dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                              
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-item-left">
                <div class="history-item-subject">
                    <span style="color: ${subject.color}">${subject.emoji}</span>
                    <span>${subject.name}</span>
                </div>
                <div class="history-item-date">${formattedDate}</div>
            </div>
            <div class="history-item-right">
                <div class="history-item-duration">+${formatDurationText(sess.durationSeconds)}</div>
            </div>
        `;
        list.appendChild(item);
    });
}

/* --- Settings Configs & Data IO --- */
function initSettings() {
    // Select Sound UI load
    DOM.alarmSoundSelect.value = state.settings.sound;
    DOM.alarmSoundSelect.addEventListener('change', (e) => {
        state.settings.sound = e.target.value;
        saveData();
        playAlarmSound(); // Play preview
    });
    
    // Volume UI load
    DOM.alarmVolumeSlider.value = state.settings.volume;
    DOM.alarmVolumeSlider.addEventListener('input', (e) => {
        state.settings.volume = parseInt(e.target.value);
        saveData();
    });
    DOM.alarmVolumeSlider.addEventListener('change', () => {
        playAlarmSound(); // Preview volume on let go
    });
    
    // Vibrate Toggle load
    DOM.vibrateToggle.checked = state.settings.vibrate;
    DOM.vibrateToggle.addEventListener('change', (e) => {
        state.settings.vibrate = e.target.checked;
        saveData();
        if (state.settings.vibrate) triggerVibration();
    });
    
    // Factory Reset
    DOM.factoryResetBtn.addEventListener('click', () => {
        showCustomConfirm(
            "Reset FocusOra?", 
            "This will permanently wipe all subjects, custom settings, and study sessions. This action is irreversible.", 
            true, 
            () => {
                localStorage.removeItem('focusOra_data');
                localStorage.removeItem('focusora_data');
                localStorage.removeItem('focus_space_data');
                location.reload();
            }
        );
    });
    
    // Export JSON File
    DOM.exportDataBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 4));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", `FocusOra_Backup_${new Date().toISOString().slice(0,10)}.json`);
        dlAnchorElem.click();
    });
    
    // Import JSON File
    DOM.importDataBtn.addEventListener('click', () => {
        DOM.importFileInput.click();
    });
    
    DOM.importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const imported = JSON.parse(evt.target.result);
                if (imported.subjects && imported.sessions) {
                    state = imported;
                    saveData();
                    showCustomAlert("Backup Imported", "✅ Data backup imported successfully! The app will reload now.", () => {
                        location.reload();
                    });
                } else {
                    showCustomAlert("Import Error", "❌ Invalid backup file format.");
                }
            } catch (err) {
                showCustomAlert("Import Error", "❌ Failed to parse backup file.");
            }
        };
        reader.readAsText(file);
    });
    

}

/* --- General Helper Utilities --- */

// Format seconds into: 2h 15m
function formatHoursMinutes(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    
    if (hrs > 0) {
        return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
}

// Format seconds into shorter format: 2.5h or 45m
function formatHoursMinutesShort(totalSeconds) {
    const hrs = totalSeconds / 3600;
    if (hrs >= 1) {
        return `${hrs.toFixed(1)}h`;
    }
    const mins = Math.floor(totalSeconds / 60);
    return `${mins}m`;
}

// Format seconds into complete text: "25 minutes" or "1 hour"
function formatDurationText(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    
    let text = '';
    if (hrs > 0) {
        text += `${hrs} hr${hrs > 1 ? 's' : ''} `;
    }
    if (mins > 0 || hrs === 0) {
        text += `${mins} min${mins !== 1 ? 's' : ''}`;
    }
    return text.trim();
}

function showCustomConfirm(title, message, isDanger, onConfirm) {
    const confirmModal = document.getElementById('confirm-modal');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmOkBtn = document.getElementById('confirm-ok-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmCancelBtn.classList.remove('hidden');
    confirmOkBtn.textContent = isDanger ? "Proceed" : "Confirm";
    confirmCancelBtn.textContent = "Cancel";

    if (isDanger) {
        confirmOkBtn.className = "action-btn danger-btn small-btn";
    } else {
        confirmOkBtn.className = "action-btn primary-btn small-btn";
    }

    const newOkBtn = confirmOkBtn.cloneNode(true);
    confirmOkBtn.parentNode.replaceChild(newOkBtn, confirmOkBtn);

    const newCancelBtn = confirmCancelBtn.cloneNode(true);
    confirmCancelBtn.parentNode.replaceChild(newCancelBtn, confirmCancelBtn);

    confirmModal.classList.remove('hidden');

    newOkBtn.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
        if (onConfirm) onConfirm();
    });

    newCancelBtn.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
    });
}

function showCustomAlert(title, message, onOk = null) {
    const confirmModal = document.getElementById('confirm-modal');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmOkBtn = document.getElementById('confirm-ok-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmCancelBtn.classList.add('hidden');
    confirmOkBtn.textContent = "OK";
    confirmOkBtn.className = "action-btn primary-btn small-btn";

    const newOkBtn = confirmOkBtn.cloneNode(true);
    confirmOkBtn.parentNode.replaceChild(newOkBtn, confirmOkBtn);

    confirmModal.classList.remove('hidden');

    newOkBtn.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
        confirmCancelBtn.classList.remove('hidden');
        if (onOk) onOk();
    });
}

// Save active timer seconds on tab close or page hide
window.addEventListener('pagehide', () => {
    if (state.timer.isRunning) {
        pauseTimer();
    }
    if (state.timer.elapsedBeforePause > 0) {
        logCurrentSession();
    }
});
