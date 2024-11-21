function buildImageProps(mediaObj, type) {
  try {
    let media = mediaObj
    if (type) media = mediaObj[type]

    if (!media.HASH || !media.MAGIC || !media.FILENAME) return null

    const url =
      `https://morphobank.org/media/morphobank3/` +
      `images/${media.HASH}/${media.MAGIC}_${media.FILENAME}`

    return url
  } catch (e) {
    return null
  }
}

function getPasswordPattern() {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
}

function getPasswordRule() {
  return 'Password must be 8 or more characters long, have at least 1 number, 1 uppercase letter, 1 lowercase letter, and 1 special character (@$!%*?&).'
}

function searchInObject(obj, searchStr, includeFields = []) {
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (searchInObject(obj[key], searchStr, includeFields)) {
        return true
      }
    } else {
      // when includeFields option present, check if the current key shall be examined
      // otherwise check all keys
      if (includeFields.length > 0 && !includeFields.includes(key)) continue
      if (typeof obj[key] === 'string' || typeof obj[key] === 'number') {
        if (
          obj[key].toString().toLowerCase().includes(searchStr.toLowerCase())
        ) {
          return true
        }
      }
    }
  }
  return false
}

function getViewStatsTooltipText() {
  return 'Project download and view statistics are available since August 2012. Views and downloads pre August 2012 are not reflected in the statistics.'
}

function getDownloadTooltipText() {
  return "By downloading from MorphoBank, you agree to the site's Terms of Use & Privacy Policy."
}

function getCopyRightTooltipText() {
  return `MorphoBank hosts phylogenetic data (matrices, characters, character states and documents) that are scientific facts in the public domain and not typically subject to copyright. Some authors have additionally marked their non-image data as CC0 <img src="/images/CC-0_gray.png" /> to emphasize its availability for reuse.<br/><br/>Image data on MorphoBank may, however, be subject to copyright and licenses should be checked before reuse.`
}

function getCC0ImgTag() {
  return '<img src="/images/CC-0_gray.png" />'
}

export {
  buildImageProps,
  getPasswordPattern,
  getPasswordRule,
  searchInObject,
  getViewStatsTooltipText,
  getDownloadTooltipText,
  getCopyRightTooltipText,
  getCC0ImgTag,
}
