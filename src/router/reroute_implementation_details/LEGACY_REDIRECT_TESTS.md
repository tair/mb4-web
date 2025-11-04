# Legacy URL Redirect Test Cases

This document provides test cases to verify that legacy PHP URLs correctly redirect to the new Vue.js URLs.

## How to Test

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open a browser and test the URLs below
3. Verify that each old URL redirects to the expected new URL

## Test Cases

### 1. Static Public Pages

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:81/Home/index` | `http://localhost:81/` | Homepage |
| `http://localhost:81/index.php/Home/index` | `http://localhost:81/` | Homepage with PHP prefix |
| `http://localhost:81/Search/index` | `http://localhost:81/search` | Search page |
| `http://localhost:81/Contact/index` | `http://localhost:81/askus` | Contact/Ask Us |
| `http://localhost:81/Press/index` | `http://localhost:81/news` | News page |
| `http://localhost:81/TermsOfUse/index` | `http://localhost:81/terms` | Terms page |

### 2. Authentication Pages

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:81/LoginReg/form` | `http://localhost:81/users/login` | Login page |
| `http://localhost:81/index.php/LoginReg/form` | `http://localhost:81/users/login` | Login with PHP prefix |
| `http://localhost:81/LoginReg/resetSend` | `http://localhost:81/users/resetpassword` | Password reset |
| `http://localhost:81/LoginReg/resetSave` | `http://localhost:81/users/set-new-password` | Set new password |

### 3. API Documentation Page

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:81/About/api` | `http://localhost:81/api` | API documentation |
| `http://localhost:81/index.php/About/api` | `http://localhost:81/api` | API documentation with PHP prefix |

**Note:** API Service Endpoints (`/service.php/*`) are handled at the Apache/nginx proxy level, not in the Vue Router. See Apache httpd configuration for the rewrite rules.

### 4. MyProjects - Without project_id (Fallback)

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:81/MyProjects/List/index` | `http://localhost:81/myprojects` | Project list |
| `http://localhost:81/MyProjects/Media/index` | `http://localhost:81/myprojects` | Media (no project) |
| `http://localhost:81/MyProjects/Taxa/index` | `http://localhost:81/myprojects` | Taxa (no project) |

### 5. MyProjects - With project_id Query Parameter (Replace 123 with actual project ID)

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:81/MyProjects/List/ProjectOverview?project_id=123` | `http://localhost:81/myprojects/123/overview` | Project overview |
| `http://localhost:81/MyProjects/Media/index?project_id=123` | `http://localhost:81/myprojects/123/media` | Media list |
| `http://localhost:81/MyProjects/Media/form?project_id=123` | `http://localhost:81/myprojects/123/media/create` | Create media |
| `http://localhost:81/MyProjects/Media/BatchForm?project_id=123` | `http://localhost:81/myprojects/123/media/create/batch` | Batch upload |
| `http://localhost:81/MyProjects/Taxa/index?project_id=123` | `http://localhost:81/myprojects/123/taxa` | Taxa list |
| `http://localhost:81/MyProjects/Taxa/form?project_id=123` | `http://localhost:81/myprojects/123/taxa/create` | Create taxon |
| `http://localhost:81/MyProjects/Specimens/index?project_id=123` | `http://localhost:81/myprojects/123/specimens` | Specimens list |
| `http://localhost:81/MyProjects/Matrices/index?project_id=123` | `http://localhost:81/myprojects/123/matrices` | Matrices list |
| `http://localhost:81/MyProjects/Bibliography/index?project_id=123` | `http://localhost:81/myprojects/123/bibliography` | Bibliography |
| `http://localhost:81/MyProjects/Views/index?project_id=123` | `http://localhost:81/myprojects/123/views` | Media views |
| `http://localhost:81/MyProjects/Members/index?project_id=123` | `http://localhost:81/myprojects/123/members` | Members |
| `http://localhost:81/MyProjects/Publishing/publishForm?project_id=123` | `http://localhost:81/myprojects/123/publish` | Publish |

### 5b. MyProjects - With project_id Path Parameter (Replace 123 with actual project ID)

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:81/MyProjects/List/ProjectOverview/project_id/123` | `http://localhost:81/myprojects/123/overview` | Project overview |
| `http://localhost:81/index.php/MyProjects/List/ProjectOverview/project_id/123` | `http://localhost:81/myprojects/123/overview` | With PHP prefix |
| `http://localhost:81/MyProjects/Media/index/project_id/123` | `http://localhost:81/myprojects/123/media` | Media list |
| `http://localhost:81/MyProjects/Media/form/project_id/123` | `http://localhost:81/myprojects/123/media/create` | Create media |
| `http://localhost:81/MyProjects/Media/BatchForm/project_id/123` | `http://localhost:81/myprojects/123/media/create/batch` | Batch upload |
| `http://localhost:81/MyProjects/Taxa/index/project_id/123` | `http://localhost:81/myprojects/123/taxa` | Taxa list |
| `http://localhost:81/MyProjects/Taxa/form/project_id/123` | `http://localhost:81/myprojects/123/taxa/create` | Create taxon |
| `http://localhost:81/MyProjects/Specimens/index/project_id/123` | `http://localhost:81/myprojects/123/specimens` | Specimens list |
| `http://localhost:81/MyProjects/Matrices/index/project_id/123` | `http://localhost:81/myprojects/123/matrices` | Matrices list |
| `http://localhost:81/MyProjects/Bibliography/index/project_id/123` | `http://localhost:81/myprojects/123/bibliography` | Bibliography |
| `http://localhost:81/MyProjects/Views/index/project_id/123` | `http://localhost:81/myprojects/123/views` | Media views |
| `http://localhost:81/MyProjects/Members/index/project_id/123` | `http://localhost:81/myprojects/123/members` | Members |
| `http://localhost:81/MyProjects/Publishing/publishForm/project_id/123` | `http://localhost:81/myprojects/123/publish` | Publish |

### 6. MyProjects - With PHP prefix

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:81/index.php/MyProjects/List/index` | `http://localhost:81/myprojects` | Via PHP prefix |
| `http://localhost:81/index.php/MyProjects/Media/index?project_id=123` | `http://localhost:81/myprojects/123/media` | Media via PHP prefix |

### 7. Published Projects - Without project_id

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:81/Projects/index` | `http://localhost:81/projects/journal_year` | Browse projects |
| `http://localhost:81/index.php/Projects/index` | `http://localhost:81/projects/journal_year` | Browse with PHP prefix |

### 8. Published Projects - With project_id Query Parameter (Replace 456 with actual project ID)

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:81/Projects/ProjectOverview?project_id=456` | `http://localhost:81/project/456/overview` | Project overview |
| `http://localhost:81/Projects/matrices?project_id=456` | `http://localhost:81/project/456/matrices` | Published matrices |
| `http://localhost:81/Projects/media?project_id=456` | `http://localhost:81/project/456/media` | Published media |
| `http://localhost:81/Projects/Taxa?project_id=456` | `http://localhost:81/project/456/taxa` | Published taxa |
| `http://localhost:81/Projects/Specimens?project_id=456` | `http://localhost:81/project/456/specimens` | Published specimens |
| `http://localhost:81/Projects/MediaViews?project_id=456` | `http://localhost:81/project/456/views` | Media views |
| `http://localhost:81/Projects/ProjectDocuments?project_id=456` | `http://localhost:81/project/456/documents` | Documents |
| `http://localhost:81/Projects/BibliographicReferences?project_id=456` | `http://localhost:81/project/456/bibliography` | Bibliography |
| `http://localhost:81/Projects/FoliosList?project_id=456` | `http://localhost:81/project/456/folios` | Folios |

### 8b. Published Projects - With project_id Path Parameter (Replace 456 with actual project ID)

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:81/Projects/ProjectOverview/project_id/456` | `http://localhost:81/project/456/overview` | Project overview |
| `http://localhost:81/index.php/Projects/ProjectOverview/project_id/456` | `http://localhost:81/project/456/overview` | With PHP prefix |
| `http://localhost:81/Projects/matrices/project_id/456` | `http://localhost:81/project/456/matrices` | Published matrices |
| `http://localhost:81/Projects/media/project_id/456` | `http://localhost:81/project/456/media` | Published media |
| `http://localhost:81/Projects/Taxa/project_id/456` | `http://localhost:81/project/456/taxa` | Published taxa |
| `http://localhost:81/Projects/Specimens/project_id/456` | `http://localhost:81/project/456/specimens` | Published specimens |
| `http://localhost:81/Projects/MediaViews/project_id/456` | `http://localhost:81/project/456/views` | Media views |
| `http://localhost:81/Projects/ProjectDocuments/project_id/456` | `http://localhost:81/project/456/documents` | Documents |
| `http://localhost:81/Projects/BibliographicReferences/project_id/456` | `http://localhost:81/project/456/bibliography` | Bibliography |
| `http://localhost:81/Projects/FoliosList/project_id/456` | `http://localhost:81/project/456/folios` | Folios |

### 9. Admin Pages

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:81/Administration/Users/ListUsers` | `http://localhost:81/admin` | User management |
| `http://localhost:81/Administration/Analytics/index` | `http://localhost:81/admin` | Analytics |
| `http://localhost:81/index.php/Administration/ProjectStats/index` | `http://localhost:81/admin` | Project stats |

### 10. Curator Pages

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:81/Curator/Projects/index` | `http://localhost:81/curator` | Curator projects |
| `http://localhost:81/Curator/Dashboard/index` | `http://localhost:81/curator` | Curator dashboard |
| `http://localhost:81/index.php/Curator/InstitutionRequests/index` | `http://localhost:81/curator` | Institution requests |

### 11. User Preferences

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:81/system/Preferences/EditProfilePrefs` | `http://localhost:81/users/myprofile` | Edit profile |
| `http://localhost:81/index.php/system/Preferences/EditProfilePrefs` | `http://localhost:81/users/myprofile` | Edit profile with PHP prefix |

### 12. Unimplemented Pages (Should redirect to homepage)

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:81/About/index` | `http://localhost:81/` | About page |
| `http://localhost:81/Documentation/index` | `http://localhost:81/` | Documentation |
| `http://localhost:81/FAQ/index` | `http://localhost:81/` | FAQ |
| `http://localhost:81/Projects/ProjectPreview` | `http://localhost:81/` | Project preview |
| `http://localhost:81/system/Error/Show` | `http://localhost:81/` | Error page |
| `http://localhost:81/logs/Events/index` | `http://localhost:81/` | Event logs |

## Automated Testing

To verify redirects programmatically, you can use this approach:

```javascript
// Example test with fetch API
async function testRedirect(oldUrl, expectedNewPath) {
  try {
    const response = await fetch(oldUrl, { redirect: 'manual' });
    console.log(`Testing: ${oldUrl}`);
    console.log(`Expected: ${expectedNewPath}`);
    console.log(`Status: ${response.status}`);
    console.log(`Location: ${response.headers.get('location')}`);
    console.log('---');
  } catch (error) {
    console.error(`Error testing ${oldUrl}:`, error);
  }
}

// Run tests
testRedirect('http://localhost:81/Home/index', '/');
testRedirect('http://localhost:81/MyProjects/Media/index?project_id=123', '/myprojects/123/media');
```

## Production Testing

For production (https://morphobank.org), replace `http://localhost:81` with `https://morphobank.org`:

Examples:
- `https://morphobank.org/index.php/Projects/index` → `https://morphobank.org/projects/journal_year`
- `https://morphobank.org/MyProjects/Media/index?project_id=123` → `https://morphobank.org/myprojects/123/media`

## Notes

1. **Case Sensitivity**: All redirects are case-sensitive. `/MyProjects/Media/index` works, but `/myprojects/media/index` will not match.

2. **Two project_id Formats**: The system supports both formats from the legacy PHP application:
   - **Query Parameter**: `?project_id=123` (e.g., `/Projects/ProjectOverview?project_id=123`)
   - **Path Parameter**: `/project_id/123` (e.g., `/Projects/ProjectOverview/project_id/123`)

3. **Query Parameters**: The `project_id` parameter is extracted (from either query or path) and incorporated into the new URL path. Other query parameters are preserved.

4. **Fallback Behavior**: If a URL requires a `project_id` but none is provided, it redirects to the general section (e.g., `/myprojects`).

5. **PHP Prefix**: All URLs with `/index.php/` prefix are handled by stripping the prefix first, then applying the appropriate redirect. The prefix stripper properly handles multi-segment paths.

## Verification Checklist

- [ ] Static public pages redirect correctly
- [ ] Authentication pages redirect correctly
- [ ] API documentation page (/About/api) redirects to /api (Vue Router)
- [ ] API service endpoints (/service.php/*) work via curl/API clients (Apache/nginx proxy rewrite)
- [ ] MyProjects URLs without project_id redirect to /myprojects
- [ ] MyProjects URLs with project_id query parameter (?project_id=123) redirect correctly
- [ ] MyProjects URLs with project_id path parameter (/project_id/123) redirect correctly
- [ ] Published project URLs with project_id query parameter redirect correctly
- [ ] Published project URLs with project_id path parameter redirect correctly
- [ ] PHP-prefixed URLs (/index.php/) are handled correctly for both formats
- [ ] Multi-segment paths with /index.php/ prefix are properly joined with slashes
- [ ] Admin URLs redirect to /admin
- [ ] Curator URLs redirect to /curator
- [ ] Unimplemented pages redirect to homepage
- [ ] Query parameters (other than project_id) are preserved

