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
| `http://localhost:5173/Home/index` | `http://localhost:5173/` | Homepage |
| `http://localhost:5173/index.php/Home/index` | `http://localhost:5173/` | Homepage with PHP prefix |
| `http://localhost:5173/Search/index` | `http://localhost:5173/search` | Search page |
| `http://localhost:5173/Contact/index` | `http://localhost:5173/askus` | Contact/Ask Us |
| `http://localhost:5173/Press/index` | `http://localhost:5173/news` | News page |
| `http://localhost:5173/TermsOfUse/index` | `http://localhost:5173/terms` | Terms page |

### 2. Authentication Pages

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:5173/LoginReg/form` | `http://localhost:5173/users/login` | Login page |
| `http://localhost:5173/index.php/LoginReg/form` | `http://localhost:5173/users/login` | Login with PHP prefix |
| `http://localhost:5173/LoginReg/resetSend` | `http://localhost:5173/users/resetpassword` | Password reset |
| `http://localhost:5173/LoginReg/resetSave` | `http://localhost:5173/users/set-new-password` | Set new password |

### 3. MyProjects - Without project_id (Fallback)

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:5173/MyProjects/List/index` | `http://localhost:5173/myprojects` | Project list |
| `http://localhost:5173/MyProjects/Media/index` | `http://localhost:5173/myprojects` | Media (no project) |
| `http://localhost:5173/MyProjects/Taxa/index` | `http://localhost:5173/myprojects` | Taxa (no project) |

### 4. MyProjects - With project_id (Replace 123 with actual project ID)

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:5173/MyProjects/List/ProjectOverview?project_id=123` | `http://localhost:5173/myprojects/123/overview` | Project overview |
| `http://localhost:5173/MyProjects/Media/index?project_id=123` | `http://localhost:5173/myprojects/123/media` | Media list |
| `http://localhost:5173/MyProjects/Media/form?project_id=123` | `http://localhost:5173/myprojects/123/media/create` | Create media |
| `http://localhost:5173/MyProjects/Media/BatchForm?project_id=123` | `http://localhost:5173/myprojects/123/media/create/batch` | Batch upload |
| `http://localhost:5173/MyProjects/Taxa/index?project_id=123` | `http://localhost:5173/myprojects/123/taxa` | Taxa list |
| `http://localhost:5173/MyProjects/Taxa/form?project_id=123` | `http://localhost:5173/myprojects/123/taxa/create` | Create taxon |
| `http://localhost:5173/MyProjects/Specimens/index?project_id=123` | `http://localhost:5173/myprojects/123/specimens` | Specimens list |
| `http://localhost:5173/MyProjects/Matrices/index?project_id=123` | `http://localhost:5173/myprojects/123/matrices` | Matrices list |
| `http://localhost:5173/MyProjects/Bibliography/index?project_id=123` | `http://localhost:5173/myprojects/123/bibliography` | Bibliography |
| `http://localhost:5173/MyProjects/Views/index?project_id=123` | `http://localhost:5173/myprojects/123/views` | Media views |
| `http://localhost:5173/MyProjects/Members/index?project_id=123` | `http://localhost:5173/myprojects/123/members` | Members |
| `http://localhost:5173/MyProjects/Publishing/publishForm?project_id=123` | `http://localhost:5173/myprojects/123/publish` | Publish |

### 5. MyProjects - With PHP prefix

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:5173/index.php/MyProjects/List/index` | `http://localhost:5173/myprojects` | Via PHP prefix |
| `http://localhost:5173/index.php/MyProjects/Media/index?project_id=123` | `http://localhost:5173/myprojects/123/media` | Media via PHP prefix |

### 6. Published Projects - Without project_id

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:5173/Projects/index` | `http://localhost:5173/projects/journal_year` | Browse projects |
| `http://localhost:5173/index.php/Projects/index` | `http://localhost:5173/projects/journal_year` | Browse with PHP prefix |

### 7. Published Projects - With project_id (Replace 456 with actual project ID)

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:5173/Projects/ProjectOverview?project_id=456` | `http://localhost:5173/project/456/overview` | Project overview |
| `http://localhost:5173/Projects/matrices?project_id=456` | `http://localhost:5173/project/456/matrices` | Published matrices |
| `http://localhost:5173/Projects/media?project_id=456` | `http://localhost:5173/project/456/media` | Published media |
| `http://localhost:5173/Projects/Taxa?project_id=456` | `http://localhost:5173/project/456/taxa` | Published taxa |
| `http://localhost:5173/Projects/Specimens?project_id=456` | `http://localhost:5173/project/456/specimens` | Published specimens |
| `http://localhost:5173/Projects/MediaViews?project_id=456` | `http://localhost:5173/project/456/views` | Media views |
| `http://localhost:5173/Projects/ProjectDocuments?project_id=456` | `http://localhost:5173/project/456/documents` | Documents |
| `http://localhost:5173/Projects/BibliographicReferences?project_id=456` | `http://localhost:5173/project/456/bibliography` | Bibliography |
| `http://localhost:5173/Projects/FoliosList?project_id=456` | `http://localhost:5173/project/456/folios` | Folios |

### 8. Admin Pages

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:5173/Administration/Users/ListUsers` | `http://localhost:5173/admin` | User management |
| `http://localhost:5173/Administration/Analytics/index` | `http://localhost:5173/admin` | Analytics |
| `http://localhost:5173/index.php/Administration/ProjectStats/index` | `http://localhost:5173/admin` | Project stats |

### 9. Curator Pages

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:5173/Curator/Projects/index` | `http://localhost:5173/curator` | Curator projects |
| `http://localhost:5173/Curator/Dashboard/index` | `http://localhost:5173/curator` | Curator dashboard |
| `http://localhost:5173/index.php/Curator/InstitutionRequests/index` | `http://localhost:5173/curator` | Institution requests |

### 10. User Preferences

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:5173/system/Preferences/EditProfilePrefs` | `http://localhost:5173/users/myprofile` | Edit profile |
| `http://localhost:5173/index.php/system/Preferences/EditProfilePrefs` | `http://localhost:5173/users/myprofile` | Edit profile with PHP prefix |

### 11. Unimplemented Pages (Should redirect to homepage)

| Test URL | Expected Redirect | Description |
|----------|-------------------|-------------|
| `http://localhost:5173/About/index` | `http://localhost:5173/` | About page |
| `http://localhost:5173/Documentation/index` | `http://localhost:5173/` | Documentation |
| `http://localhost:5173/FAQ/index` | `http://localhost:5173/` | FAQ |
| `http://localhost:5173/Projects/ProjectPreview` | `http://localhost:5173/` | Project preview |
| `http://localhost:5173/system/Error/Show` | `http://localhost:5173/` | Error page |
| `http://localhost:5173/logs/Events/index` | `http://localhost:5173/` | Event logs |

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
testRedirect('http://localhost:5173/Home/index', '/');
testRedirect('http://localhost:5173/MyProjects/Media/index?project_id=123', '/myprojects/123/media');
```

## Production Testing

For production (https://morphobank.org), replace `http://localhost:5173` with `https://morphobank.org`:

Examples:
- `https://morphobank.org/index.php/Projects/index` → `https://morphobank.org/projects/journal_year`
- `https://morphobank.org/MyProjects/Media/index?project_id=123` → `https://morphobank.org/myprojects/123/media`

## Notes

1. **Case Sensitivity**: All redirects are case-sensitive. `/MyProjects/Media/index` works, but `/myprojects/media/index` will not match.

2. **Query Parameters**: The `project_id` parameter is extracted and incorporated into the new URL path. Other query parameters are preserved.

3. **Fallback Behavior**: If a URL requires a `project_id` but none is provided, it redirects to the general section (e.g., `/myprojects`).

4. **PHP Prefix**: All URLs with `/index.php/` prefix are handled by stripping the prefix first, then applying the appropriate redirect.

## Verification Checklist

- [ ] Static public pages redirect correctly
- [ ] Authentication pages redirect correctly
- [ ] MyProjects URLs without project_id redirect to /myprojects
- [ ] MyProjects URLs with project_id extract ID and redirect correctly
- [ ] Published project URLs with project_id extract ID and redirect correctly
- [ ] PHP-prefixed URLs (/index.php/) are handled correctly
- [ ] Admin URLs redirect to /admin
- [ ] Curator URLs redirect to /curator
- [ ] Unimplemented pages redirect to homepage
- [ ] Query parameters (other than project_id) are preserved

