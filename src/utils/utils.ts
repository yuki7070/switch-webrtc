export const browser = () => {
  const ua = window.navigator.userAgent.toLocaleLowerCase();
  if (ua.indexOf('edge') !== -1) {
    return 'edge';
  }
  else if (ua.indexOf('chrome') !== -1 && ua.indexOf('edge') === -1) {
    return 'chrome';
  }
  else if (ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1) {
    return 'safari';
  }
  else if (ua.indexOf('opera') !== -1) {
    return 'opera';
  }
  else if (ua.indexOf('firefox') !== -1) {
    return 'firefox';
  }
  return;
}

export const isSafari = () => {
  return browser() === 'safari';
}