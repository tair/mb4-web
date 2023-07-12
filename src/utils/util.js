function buildImageProps(mediaObj, type) {
  try {
    media = mediaObj[type]

    if (!media.HASH || !media.MAGIC || !media.FILENAME) return null

    const url =
      `https://morphobank.org/media/morphobank3/` +
      `images/${media.HASH}/${media.MAGIC}_${media.FILENAME}`
    return {
      url: url,
      width: media.WIDTH,
      height: media.HEIGHT,
    }
  } catch (e) {
    return null
  }
}

function getPasswordPattern() {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
}

function getPasswordRule() {
  return 'Password must be 8 or more characters long, have at least 1 number, 1 uppercase letter, 1 lowercase letter, and 1 special character.'
}

export { buildImageProps, getPasswordPattern, getPasswordRule }
