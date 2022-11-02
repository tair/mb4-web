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

module.exports = {
  buildImageProps,
}
