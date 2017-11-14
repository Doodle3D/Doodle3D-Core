import raf from 'raf';

export function tween(duration, callback) {
  return new Promise(resolve => {
    let elapsedTime = 0;
    let lastTime = performance.now();

    const step = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      elapsedTime += deltaTime;
      const progress = elapsedTime / duration;

      if (progress >= 1.0) {
        callback(1.0);
        resolve();
      } else {
        callback(progress);
        raf(step);
      }
    };
    step(lastTime);
  });
}
