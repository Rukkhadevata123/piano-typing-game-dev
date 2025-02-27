const basePath = import.meta.env.BASE_URL || '/';
const sounds = {
  tap: new Audio(`${basePath}audio/tap.mp3`),
  error: new Audio(`${basePath}audio/err.mp3`),
  gameOver: new Audio(`${basePath}audio/end.mp3`),
};

// 预加载音频
Object.values(sounds).forEach((sound) => {
  sound.preload = 'auto';
  sound.addEventListener('error', () => {
    console.error(`Failed to load audio: ${sound.src}`);
  });
  sound.addEventListener('canplaythrough', () => {
    console.log(`Audio ${sound.src} ready`);
  });
});

export async function playSound(soundName) {
  try {
    const sound = sounds[soundName];
    // if (!sound) throw new Error(`Sound "${soundName}" not found`);
    sound.currentTime = 0;
    await sound.play();
  } catch (error) {
    console.error('音频播放失败:', error);
    window.dispatchEvent(
      new CustomEvent('audioError', { detail: { soundName, error } })
    );
  }
}
