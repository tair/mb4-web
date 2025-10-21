# Legacy URL Redirects Documentation

This document describes the redirect mappings from the old PHP-based MorphoBank URLs to the new Vue.js application URLs.

## Overview

The legacy MorphoBank application used PHP with URLs following the pattern:
- `/index.php/Module/Controller/Action`
- `/Module/Controller/Action`

The new Vue.js application uses modern clean URLs. This redirect system ensures that old bookmarks and external links continue to work.

## Implementation Details

All redirects are implemented in `/src/router/oldMappingReroute.js` with:
- A helper function `createProjectRedirect()` that extracts `project_id` query parameters
- Explicit path parameter routes that handle `project_id` in the URL path
- Direct route redirects for static mappings
- Support for both `/index.php/` prefixed and non-prefixed URLs
- Proper array-to-path joining for multi-segment `/index.php/` URLs
- Case-sensitive matching

## Complete Redirect Mapping

### 1. Public Pages (Implemented)

| Old URL | New URL | Notes |
|---------|---------|-------|
| `/Home/index` | `/` | Homepage |
| `/index.php/Home/index` | `/` | Homepage with PHP prefix |
| `/Search/index` | `/search` | Global search |
| `/index.php/Search/index` | `/search` | Search with PHP prefix |
| `/Contact/index` | `/askus` | Contact form |
| `/index.php/Contact/index` | `/askus` | Contact with PHP prefix |
| `/Press/index` | `/news` | Press/news page |
| `/index.php/Press/index` | `/news` | Press with PHP prefix |
| `/TermsOfUse/index` | `/terms` | Terms of use |
| `/TermsOfUse/Form` | `/terms` | Terms form |
| `/index.php/TermsOfUse/index` | `/terms` | Terms with PHP prefix |
| `/index.php/TermsOfUse/Form` | `/terms` | Terms form with PHP prefix |

### 2. Authentication Pages (Implemented)

| Old URL | New URL | Notes |
|---------|---------|-------|
| `/LoginReg/form` | `/users/login` | Login/registration form |
| `/index.php/LoginReg/form` | `/users/login` | Login with PHP prefix |
| `/LoginReg/resetSend` | `/users/resetpassword` | Password reset request |
| `/index.php/LoginReg/resetSend` | `/users/resetpassword` | Reset with PHP prefix |
| `/LoginReg/resetSave` | `/users/set-new-password` | Set new password |
| `/index.php/LoginReg/resetSave` | `/users/set-new-password` | Set password with PHP prefix |

### 3. User Projects - MyProjects (Implemented)

All MyProjects URLs extract `project_id` from either query parameters or path parameters and construct the appropriate new URL.

**Supported URL Formats:**
- Query parameter: `/MyProjects/List/ProjectOverview?project_id=123`
- Path parameter: `/MyProjects/List/ProjectOverview/project_id/123`

Both formats redirect to the same new URL.

| Old URL Pattern | New URL Pattern | Example |
|----------------|-----------------|---------|
| `/MyProjects/List/index` | `/myprojects` | Project list |
| `/MyProjects/List/ProjectOverview?project_id=123` | `/myprojects/123/overview` | Project overview (query) |
| `/MyProjects/List/ProjectOverview/project_id/123` | `/myprojects/123/overview` | Project overview (path) |
| `/MyProjects/List/DownloadProjectPage?project_id=123` | `/myprojects/123/download` | Download project |
| `/MyProjects/Media/index?project_id=123` | `/myprojects/123/media` | Media list |
| `/MyProjects/Media/form?project_id=123` | `/myprojects/123/media/create` | Create media |
| `/MyProjects/Media/View?project_id=123` | `/myprojects/123/media` | View media |
| `/MyProjects/Media/BatchForm?project_id=123` | `/myprojects/123/media/create/batch` | Batch upload |
| `/MyProjects/Taxa/index?project_id=123` | `/myprojects/123/taxa` | Taxa list |
| `/MyProjects/Taxa/form?project_id=123` | `/myprojects/123/taxa/create` | Create taxon |
| `/MyProjects/Taxa/AddTaxa?project_id=123` | `/myprojects/123/taxa/create` | Add taxa |
| `/MyProjects/Specimens/index?project_id=123` | `/myprojects/123/specimens` | Specimens list |
| `/MyProjects/Specimens/form?project_id=123` | `/myprojects/123/specimens/create` | Create specimen |
| `/MyProjects/Matrices/index?project_id=123` | `/myprojects/123/matrices` | Matrices list |
| `/MyProjects/Matrices/form?project_id=123` | `/myprojects/123/matrices/create` | Create matrix |
| `/MyProjects/Matrices/choose?project_id=123` | `/myprojects/123/matrices/create/choose` | Choose matrix type |
| `/MyProjects/Bibliography/index?project_id=123` | `/myprojects/123/bibliography` | Bibliography |
| `/MyProjects/Views/index?project_id=123` | `/myprojects/123/views` | Media views |
| `/MyProjects/Views/form?project_id=123` | `/myprojects/123/views/create` | Create view |
| `/MyProjects/Project/form?project_id=123` | `/myprojects/123/edit` | Edit project |
| `/MyProjects/Members/index?project_id=123` | `/myprojects/123/members` | Project members |
| `/MyProjects/MemberGroups/index?project_id=123` | `/myprojects/123/members/groups` | Member groups |
| `/MyProjects/Publishing/publishForm?project_id=123` | `/myprojects/123/publish` | Publish project |
| `/MyProjects/Publishing/pubPrefForm?project_id=123` | `/myprojects/123/publish/preferences` | Publishing preferences |

**Note:** All `/index.php/MyProjects/*` URLs are also supported and will be redirected appropriately.

### 4. Published Projects - Public View (Implemented)

All published project URLs extract `project_id` from either query parameters or path parameters.

**Supported URL Formats:**
- Query parameter: `/Projects/ProjectOverview?project_id=123`
- Path parameter: `/Projects/ProjectOverview/project_id/123`

Both formats redirect to the same new URL.

| Old URL Pattern | New URL Pattern | Example |
|----------------|-----------------|---------|
| `/Projects/index` | `/projects/journal_year` | Browse projects |
| `/Projects/ProjectOverview?project_id=123` | `/project/123/overview` | Project overview (query) |
| `/Projects/ProjectOverview/project_id/123` | `/project/123/overview` | Project overview (path) |
| `/Projects/matrices?project_id=123` | `/project/123/matrices` | Published matrices |
| `/Projects/media?project_id=123` | `/project/123/media` | Published media |
| `/Projects/Taxa?project_id=123` | `/project/123/taxa` | Published taxa |
| `/Projects/Specimens?project_id=123` | `/project/123/specimens` | Published specimens |
| `/Projects/MediaViews?project_id=123` | `/project/123/views` | Media views |
| `/Projects/ProjectDocuments?project_id=123` | `/project/123/documents` | Project documents |
| `/Projects/BibliographicReferences?project_id=123` | `/project/123/bibliography` | Bibliography |
| `/Projects/FoliosList?project_id=123` | `/project/123/folios` | Folios list |

**Note:** All `/index.php/Projects/*` URLs are also supported and will be redirected appropriately.

### 5. Admin Pages (Implemented)

All administration URLs redirect to the admin home page.

| Old URL Pattern | New URL | Notes |
|----------------|---------|-------|
| `/Administration/*` | `/admin` | All admin pages redirect to admin home |
| `/index.php/Administration/*` | `/admin` | With PHP prefix |

Examples:
- `/Administration/Users/ListUsers` → `/admin`
- `/Administration/Roles/ListRoles` → `/admin`
- `/Administration/Analytics/index` → `/admin`
- `/Administration/ProjectStats/index` → `/admin`
- `/Administration/ProjectBrowser/index` → `/admin`

### 6. Curator Pages (Implemented)

All curator URLs redirect to the curator home page.

| Old URL | New URL | Notes |
|---------|---------|-------|
| `/Curator/Projects/index` | `/curator` | Curator projects |
| `/Curator/Dashboard/index` | `/curator` | Curator dashboard |
| `/Curator/InstitutionRequests/index` | `/curator` | Institution requests |
| `/Curator/*` | `/curator` | Any other curator page |

**Note:** All `/index.php/Curator/*` URLs are also supported.

### 7. User Preferences (Implemented)

| Old URL | New URL | Notes |
|---------|---------|-------|
| `/system/Preferences/EditProfilePrefs` | `/users/myprofile` | User profile/preferences |
| `/index.php/system/Preferences/EditProfilePrefs` | `/users/myprofile` | With PHP prefix |

### 8. System/Error Pages (Implemented)

| Old URL | New URL | Notes |
|---------|---------|-------|
| `/system/Error/Show` | `/` | Error display redirects to homepage |
| `/logs/*` | `/` | All log pages redirect to homepage |

## Unimplemented Pages (Redirecting to Homepage)

The following legacy URLs are not yet implemented in the new Vue.js application and redirect to the homepage (`/`):

### Public Information Pages
- `/About/index` - About page
- `/Documentation/index` - User documentation
- `/FAQ/index` - Frequently Asked Questions

### MyProjects Features
- `/MyProjects/Members/find` - Find members search interface
- `/MyProjects/Members/invite_member` - Invite members form

### Published Projects Features
- `/Projects/ProjectPreview` - Quick project preview
- `/Projects/viewMatrix` - Standalone matrix viewer
- `/Projects/MediaViewer` - Standalone media viewer
- `/Projects/HTML5Labels` - HTML5 labeling interface
- `/Projects/HTML5ViewerHelp` - HTML5 viewer help

### System Pages
- All specific admin sub-pages (redirect to `/admin` instead)
- `/logs/*` - All log viewing pages
- `/system/Error/Show` - Error display page

## Project ID Handling

The redirect system intelligently handles `project_id` in two formats:

### Format 1: Query Parameter (e.g., `?project_id=123`)
- Example: `/MyProjects/Media/index?project_id=456` → `/myprojects/456/media`
- Example: `/Projects/ProjectOverview?project_id=456` → `/project/456/overview`

### Format 2: Path Parameter (e.g., `/project_id/123`)
- Example: `/MyProjects/Media/index/project_id/456` → `/myprojects/456/media`
- Example: `/Projects/ProjectOverview/project_id/456` → `/project/456/overview`
- Example: `/index.php/Projects/ProjectOverview/project_id/456` → `/project/456/overview`

### Without project_id
When no project ID is provided, redirects to the general section or fallback:
- Example: `/MyProjects/Media/index` → `/myprojects` (fallback to project list)

## Case Sensitivity

All redirects are **case-sensitive** and match the exact casing from the legacy PHP application:
- `/MyProjects/Media/index` ✅ (matches)
- `/myprojects/media/index` ❌ (does not match)

## Testing Redirects

To test these redirects:

1. **Static redirects** (no query parameters):
   ```
   https://morphobank.org/Home/index → https://morphobank.org/
   https://morphobank.org/index.php/LoginReg/form → https://morphobank.org/users/login
   ```

2. **Dynamic redirects with query parameters**:
   ```
   https://morphobank.org/MyProjects/Media/index?project_id=123
   → https://morphobank.org/myprojects/123/media
   
   https://morphobank.org/index.php/Projects/Taxa?project_id=456
   → https://morphobank.org/project/456/taxa
   ```

3. **Dynamic redirects with path parameters**:
   ```
   https://morphobank.org/MyProjects/Media/index/project_id/123
   → https://morphobank.org/myprojects/123/media
   
   https://morphobank.org/index.php/Projects/ProjectOverview/project_id/456
   → https://morphobank.org/project/456/overview
   
   https://morphobank.org/Projects/Taxa/project_id/789
   → https://morphobank.org/project/789/taxa
   ```

4. **Fallback redirects** (no project_id provided):
   ```
   https://morphobank.org/MyProjects/Media/index
   → https://morphobank.org/myprojects
   ```

## Future Considerations

If any of the unimplemented pages are added to the application in the future:

1. Update the redirect to point to the new implementation
2. Update this documentation
3. Consider if the new page requires authentication or other access controls

## Maintenance

When adding new features that replace legacy functionality:

1. Check this document for relevant legacy URLs
2. Update the redirect mapping in `/src/router/index.js`
3. Update this documentation
4. Test that old URLs properly redirect to the new implementation

