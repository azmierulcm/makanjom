// High-end, glassy and elegant high-tone sounds
const CRYSTAL_SOUNDS = {
  start: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // High-end soft pop
  tick: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3',  // High-tone glassy ping
  reveal: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' // Clear celebratory chime
};

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      Object.entries(CRYSTAL_SOUNDS).forEach(([key, url]) => {
        const audio = new Audio(url);
        audio.preload = 'auto';
        this.sounds.set(key, audio);
      });
    }
  }

  play(name: keyof typeof CRYSTAL_SOUNDS, volume = 0.3) {
    const sound = this.sounds.get(name);
    if (sound) {
      sound.currentTime = 0;
      sound.volume = volume;
      sound.play().catch(() => {});
    }
  }
}

export const sounds = typeof window !== 'undefined' ? new SoundManager() : null;
