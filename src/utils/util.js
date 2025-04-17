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

// Tooltip content functions
export function getNSFFundedTooltip() {
  return 'When checked, the NSF logo will appear on your project page to indicate your research project has received funding from NSF.'
}

export function getExemplarMediaTooltip() {
  return "Choose one image to feature with your project. If there is media in your project, you must select a project exemplar before saving.<br><br>You can set the exemplar while editing a media record, or with this form. Click Browse Media to see a selection of project media to choose from or type the name of the taxon in the image or the media number (without the leading 'M') and MorphoBank will pull up choices. If you do not have any images in your project, please add one by first adding the taxonomic name, the specimen information and then the media, in that order. See the tabs on the left. Note that only the first 500 matches will be shown."
}

export function getReviewerAccessTooltip() {
  return "<h4>Can I allow an anonymous reviewer to access my matrix during review at a journal?</h4>Many journals like to provide reviewers access to matrix data so they can check authors' results. Project Administrators can enable an anonymous reviewer login for their project in the Project Info form accessed through the 'Edit project info' link on the Project Overview page. Once enabled, reviewers can login by entering the project number in the email address field and the reviewer login password entered by the Project Administrator in the Project Info form. Don't forget – you have to tell editors and reviewers your project number and reviewer password when you invite them to review your project."
}

export function getAllowReviewerLoginTooltip(projectId) {
  const login = projectId ? `the login '${projectId}'` : 'your project id'
  return `If reviewer login is enabled, anonymous read-only access to your project data will be allowed using ${login} (instead of an email address) and the password below. Note that access will be allowed even if the project is unpublished.`
}

export function getDiskSpaceUsageTooltip() {
  return 'Maximum allowed media usage for this project in bytes. This limit determines how much storage space your project can use for media files.'
}

export function getJournalTitleTooltip() {
  return 'Contact Support ("Ask Us link at page bottom") if you have questions or if the journal logo does not appear once a journal title is selected.'
}

export function getJournalCoverTooltip() {
  return 'Upload a JPEG, GIF, PNG or TIFF image file of the journal cover from your publication to be used as an illustration on MorphoBank.org for your project'
}

export const TOOLTIP_ALLOW_REVIEWER_LOGIN =
  'Allow reviewers to log in and access your project data during the review process'
export const TOOLTIP_ARTICLE_DOI =
  'Enter the article DOI as provided by the publisher. The DOI should be entered as the identifier alone, like this:<br/><br/>10.1093/sysbio/syu008<br/><br/>If the publication has not been or will not be issued a DOI, please leave blank.'

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
