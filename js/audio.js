// Geometry Dash Clone - Audio System

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.musicVolume = 1.0;
        this.sfxVolume = 1.0;
        this.currentMusic = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.sounds = {};
        this.musicBuffer = null;
        this.isPlaying = false;
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.musicGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();
            this.musicGain.connect(this.audioContext.destination);
            this.sfxGain.connect(this.audioContext.destination);

            // Generate synthetic sounds
            this.generateSounds();
            this.generateMusic();
        } catch (e) {
            console.warn('Audio not supported:', e);
        }
    }

    generateSounds() {
        // Jump sound
        this.sounds.jump = this.createJumpSound();
        // Death sound
        this.sounds.death = this.createDeathSound();
        // Click sound
        this.sounds.click = this.createClickSound();
        // Coin sound
        this.sounds.coin = this.createCoinSound();
        // Complete sound
        this.sounds.complete = this.createCompleteSound();
        // Checkpoint sound
        this.sounds.checkpoint = this.createCheckpointSound();
    }

    createJumpSound() {
        const duration = 0.1;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const freq = 800 - (t * 4000);
            data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 30) * 0.3;
        }

        return buffer;
    }

    createDeathSound() {
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() * 2 - 1) * 0.3;
            const freq = 200 - (t * 150);
            const sine = Math.sin(2 * Math.PI * freq * t) * 0.5;
            data[i] = (noise + sine) * Math.exp(-t * 4);
        }

        return buffer;
    }

    createClickSound() {
        const duration = 0.05;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            data[i] = Math.sin(2 * Math.PI * 1000 * t) * Math.exp(-t * 100) * 0.2;
        }

        return buffer;
    }

    createCoinSound() {
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const freq1 = 1200;
            const freq2 = 1600;
            const sound = Math.sin(2 * Math.PI * freq1 * t) * 0.3 +
                         Math.sin(2 * Math.PI * freq2 * t) * 0.2;
            data[i] = sound * Math.exp(-t * 8);
        }

        return buffer;
    }

    createCompleteSound() {
        const duration = 1.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            let sample = 0;

            notes.forEach((freq, idx) => {
                const noteStart = idx * 0.15;
                const noteT = t - noteStart;
                if (noteT > 0) {
                    sample += Math.sin(2 * Math.PI * freq * noteT) * Math.exp(-noteT * 3) * 0.2;
                }
            });

            data[i] = sample;
        }

        return buffer;
    }

    createCheckpointSound() {
        const duration = 0.2;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const freq = 600 + (t * 400);
            data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 15) * 0.3;
        }

        return buffer;
    }

    generateMusic() {
        // Generate a simple electronic beat similar to GD
        const duration = 30; // 30 second loop
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(2, sampleRate * duration, sampleRate);
        const leftChannel = buffer.getChannelData(0);
        const rightChannel = buffer.getChannelData(1);

        const bpm = 140;
        const beatDuration = 60 / bpm;
        const samplesPerBeat = Math.floor(sampleRate * beatDuration);

        // Bass drum pattern
        const kickPattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0];
        // Hi-hat pattern
        const hihatPattern = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0];
        // Snare pattern
        const snarePattern = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];

        // Melody notes (in Hz)
        const melodyNotes = [
            261.63, 329.63, 392.00, 523.25, // C4, E4, G4, C5
            293.66, 369.99, 440.00, 587.33, // D4, F#4, A4, D5
            329.63, 415.30, 493.88, 659.25, // E4, G#4, B4, E5
            261.63, 329.63, 392.00, 523.25  // C4, E4, G4, C5
        ];

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const beatIndex = Math.floor((i % (samplesPerBeat * 16)) / (samplesPerBeat / 4));
            const patternIndex = beatIndex % 16;

            let sample = 0;

            // Kick drum
            if (kickPattern[patternIndex]) {
                const kickT = (i % (samplesPerBeat / 4)) / sampleRate;
                const kickFreq = 80 * Math.exp(-kickT * 30);
                sample += Math.sin(2 * Math.PI * kickFreq * kickT) * Math.exp(-kickT * 15) * 0.4;
            }

            // Hi-hat
            if (hihatPattern[patternIndex]) {
                const hatT = (i % (samplesPerBeat / 4)) / sampleRate;
                sample += (Math.random() * 2 - 1) * Math.exp(-hatT * 50) * 0.1;
            }

            // Snare
            if (snarePattern[patternIndex]) {
                const snareT = (i % (samplesPerBeat / 4)) / sampleRate;
                const snareNoise = (Math.random() * 2 - 1) * 0.15;
                const snareTone = Math.sin(2 * Math.PI * 200 * snareT) * 0.2;
                sample += (snareNoise + snareTone) * Math.exp(-snareT * 20);
            }

            // Bass line
            const bassNoteIndex = Math.floor((i / (samplesPerBeat * 4)) % 4);
            const bassFreq = melodyNotes[bassNoteIndex * 4] / 2;
            sample += Math.sin(2 * Math.PI * bassFreq * t) * 0.15;

            // Lead melody
            const measureInSamples = samplesPerBeat * 4;
            const noteInMeasure = Math.floor((i % measureInSamples) / (samplesPerBeat));
            const melodyIdx = (Math.floor(i / measureInSamples) * 4 + noteInMeasure) % melodyNotes.length;
            const melodyFreq = melodyNotes[melodyIdx];

            const noteT = (i % samplesPerBeat) / sampleRate;
            const envelope = Math.exp(-noteT * 3);

            // Saw wave approximation for lead
            let sawWave = 0;
            for (let h = 1; h <= 5; h++) {
                sawWave += Math.sin(2 * Math.PI * melodyFreq * h * t) / h;
            }
            sample += sawWave * envelope * 0.08;

            // Add some pad/atmosphere
            const padFreq = melodyNotes[0] * 2;
            sample += Math.sin(2 * Math.PI * padFreq * t) * 0.03;
            sample += Math.sin(2 * Math.PI * padFreq * 1.5 * t) * 0.02;

            // Stereo effect
            leftChannel[i] = sample * 0.8;
            rightChannel[i] = sample * 0.8;
        }

        this.musicBuffer = buffer;
    }

    playSound(name) {
        if (!this.audioContext || !this.sounds[name]) return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name];
        source.connect(this.sfxGain);
        source.start(0);
    }

    playMusic() {
        if (!this.audioContext || !this.musicBuffer || this.isPlaying) return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.currentMusic = this.audioContext.createBufferSource();
        this.currentMusic.buffer = this.musicBuffer;
        this.currentMusic.loop = true;
        this.currentMusic.connect(this.musicGain);
        this.currentMusic.start(0);
        this.isPlaying = true;
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
            this.isPlaying = false;
        }
    }

    pauseMusic() {
        if (this.audioContext) {
            this.audioContext.suspend();
        }
    }

    resumeMusic() {
        if (this.audioContext) {
            this.audioContext.resume();
        }
    }

    setMusicVolume(value) {
        this.musicVolume = value;
        if (this.musicGain) {
            this.musicGain.gain.value = value;
        }
    }

    setSFXVolume(value) {
        this.sfxVolume = value;
        if (this.sfxGain) {
            this.sfxGain.gain.value = value;
        }
    }
}

// Global audio manager instance
const audioManager = new AudioManager();
