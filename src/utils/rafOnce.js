
// Utility to  make it easy for one instance to create only one
// animation request.
import raf from 'raf';
export default function createRAFOnce() {
  let rafID;
  return function rafOnce(notify) {
    if (rafID) {
      return;
    }
    rafID = raf(() => {
      rafID = null;
      notify();
    });
  };
}
