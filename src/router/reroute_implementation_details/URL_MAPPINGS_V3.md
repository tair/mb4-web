# MorphoBank User-Accessible Pages URL Mapping

This document maps all URL paths that users can access as actual web pages in their browser. These are frontend pages that form part of the user interface, excluding API endpoints, AJAX calls, and backend services.

## URL Architecture for User Pages

User-accessible pages follow this structure:
```
/module/controller/action
```

**Note:** This excludes service API endpoints and AJAX calls that are not meant to be visited directly.

## 1. Public Site Pages (Available to Everyone)

### Home & Information Pages
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/` or `/Home/index` | Homepage | Main landing page with site statistics, user activity maps, and recent activity | Public |
| `/About/index` | About Page | Information about MorphoBank | Public |
| `/Press/index` | Press/News | News and press releases | Public |
| `/Documentation/index` | Documentation | User documentation and help | Public |
| `/FAQ/index` | FAQ | Frequently Asked Questions | Public |
| `/Contact/index` | Contact | Contact form for site administrators | Public |

### Authentication Pages
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/LoginReg/form` | Login/Register Form | Main login and registration form | Public |
| `/LoginReg/resetSend` | Password Reset Request | Interface to request password reset | Public |
| `/LoginReg/resetSave` | Password Reset | Form to set new password after reset | Public |
| `/TermsOfUse/index` | Terms of Use | Display terms of use agreement | Public |
| `/TermsOfUse/Form` | Terms Form | Terms acceptance form | Public |

## 2. Global Search & Browse Pages

### Search Interface
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/Search/index` | Global Search | Main search interface for finding projects, users, media, taxa, specimens, matrices, and references | Public |

### Public Project Browsing
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/Projects/index` | Browse Projects | Browse all published projects | Public |
| `/Projects/ProjectPreview` | Project Preview | Quick preview of projects | Public |
| `/Projects/ProjectOverview` | Project Details | Detailed view of specific published project | Public |

## 3. MyProjects Pages (Project Management - Logged In Users Only)

### Project Dashboard
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/MyProjects/List/index` | Project Dashboard | Main project overview showing user's projects | Logged In |
| `/MyProjects/List/select` | Project Selection | Interface for selecting active project | Logged In |
| `/MyProjects/List/ProjectOverview` | Project Overview | Detailed view of selected project | Logged In |
| `/MyProjects/List/DownloadProjectPage` | Download Project | Interface for downloading project data | Logged In |

### Media Management Interface
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/MyProjects/Media/index` | Media Overview | List and manage media files in project | Logged In |
| `/MyProjects/Media/form` | Media Upload/Edit | Interface for uploading new media or editing existing | Logged In |
| `/MyProjects/Media/View` | Media Viewer | View individual media items | Logged In |
| `/MyProjects/Media/BatchForm` | Batch Upload | Interface for batch media upload | Logged In |

### Taxonomic Data Interface
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/MyProjects/Taxa/index` | Taxa Overview | List and manage taxonomic data | Logged In |
| `/MyProjects/Taxa/form` | Taxa Edit | Interface for adding/editing taxonomic records | Logged In |
| `/MyProjects/Taxa/AddTaxa` | Add Taxa | Interface for adding new taxa | Logged In |

### Specimen Management Interface
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/MyProjects/Specimens/index` | Specimen Overview | List and manage specimen records | Logged In |
| `/MyProjects/Specimens/form` | Specimen Edit | Interface for adding/editing specimen records | Logged In |

### Matrix Management Interface
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/MyProjects/Matrices/index` | Matrix Overview | List and manage phylogenetic matrices | Logged In |
| `/MyProjects/Matrices/form` | Matrix Edit | Interface for creating/editing matrices | Logged In |
| `/MyProjects/Matrices/choose` | Matrix Selection | Choose from existing matrices | Logged In |

### Bibliography Interface
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/MyProjects/Bibliography/index` | Bibliography | Manage bibliographic references | Logged In |

### Views and Annotations Interface
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/MyProjects/Views/index` | Views Overview | Manage media annotation views | Logged In |
| `/MyProjects/Views/form` | View Edit | Interface for creating/editing views | Logged In |

### Project Administration Interface
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/MyProjects/Project/form` | Project Edit | Edit project information | Logged In |
| `/MyProjects/Members/index` | Member Management | Manage project members | Logged In |
| `/MyProjects/Members/find` | Find Members | Search for project members | Logged In |
| `/MyProjects/Members/invite_member` | Invite Members | Send project invitations | Logged In |
| `/MyProjects/MemberGroups/index` | Member Groups | Manage member groups | Logged In |

### Publishing Interface
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/MyProjects/Publishing/pubPrefForm` | Publishing Preferences | Set publishing preferences | Logged In |
| `/MyProjects/Publishing/publishForm` | Publish Form | Interface for publishing projects | Logged In |

## 4. Published Project Pages (Public Data Access)

### Project Data Browsing
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/Projects/matrices` | Published Matrices | View published phylogenetic matrices | Public |
| `/Projects/viewMatrix` | Matrix Viewer | Interactive matrix viewer | Public |
| `/Projects/MediaViewer` | Media Viewer | View published media | Public |
| `/Projects/media` | Browse Media | Browse published media files | Public |
| `/Projects/Taxa` | Browse Taxa | Browse published taxonomic data | Public |
| `/Projects/Specimens` | Browse Specimens | Browse published specimen data | Public |
| `/Projects/MediaViews` | Media Views | View media annotation views | Public |
| `/Projects/ProjectDocuments` | Project Documents | View project documentation | Public |
| `/Projects/BibliographicReferences` | Bibliography | View published references | Public |
| `/Projects/FoliosList` | Folios | View published folios | Public |

### Interactive Features
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/Projects/HTML5Labels` | HTML5 Labels | Interactive labeling interface | Public |
| `/Projects/HTML5ViewerHelp` | Viewer Help | Help for HTML5 viewers | Public |

## 5. Administrative Pages (Admin/Curator Only)

### User Administration Interface
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/Administration/Users/ListUsers` | User Management | List and manage all users | Admin |
| `/Administration/Users/Edit` | Edit User | Edit user accounts | Admin |

### Role Management Interface
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/Administration/Roles/ListRoles` | Role Management | Manage access roles | Admin |
| `/Administration/Roles/Edit` | Edit Role | Edit role permissions | Admin |

### Analytics Interface
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/Administration/Analytics/index` | Site Analytics | Overall site statistics | Admin |
| `/Administration/Analytics/LoginInfo` | Login Analytics | User login statistics | Admin |
| `/Administration/Analytics/RegistrationInfo` | Registration Analytics | Registration statistics | Admin |

### Project Administration Interface
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/Administration/ProjectStats/index` | Project Statistics | Project-specific statistics | Admin |
| `/Administration/ProjectBrowser/index` | Project Browser | Admin project overview | Admin |
| `/Administration/ProjectBrowser/ProjectDetails` | Project Details | Detailed project information | Admin |
| `/Administration/DuplicationRequests/ListRequests` | Duplication Requests | Manage project duplication requests | Admin |
| `/Administration/InactiveProjects/index` | Inactive Projects | Manage inactive projects | Admin |

### Site Management Interface
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/Administration/HomePage/index` | Homepage Management | Manage homepage content | Admin |
| `/Administration/Press/index` | Press Management | Manage press releases | Admin |
| `/Administration/MaintenanceMessage/index` | Maintenance Message | Set site maintenance messages | Admin |

### Registration Management Interface
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/Administration/ManageRegistrations/Approve` | Approve Registrations | Approve pending user registrations | Admin |
| `/Administration/ManageRegistrations/ListUsers` | Registration List | List pending registrations | Admin |

## 6. Curator Pages (Curator Role Only)

### Curation Interface
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/Curator/Projects/index` | Curation Projects | Projects requiring curation | Curator |
| `/Curator/Dashboard/index` | Curation Dashboard | Curator dashboard | Curator |
| `/Curator/InstitutionRequests/index` | Institution Requests | Manage institution requests | Curator |

## 7. System Pages (User Preferences)

### User Preferences Interface
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/system/Preferences/EditProfilePrefs` | Profile Preferences | Edit user profile and preferences | Logged In |

## 8. Error & Information Pages

### System Pages
| URL | Purpose | Description | Access |
|-----|---------|-------------|---------|
| `/system/Error/Show` | Error Display | Show application errors | Varies |
| `/logs/Events/index` | Event Logs | View system event logs | Admin |
| `/logs/Search/index` | Search Logs | View search operation logs | Admin |

## 9. Navigation Structure

### Main Navigation (Public)
- **Home** → `/Home/index`
- **Browse Projects** → `/Projects/index`
- **About** → `/About/index`
- **Press** → `/Press/index`
- **Documentation** → `/Documentation/index`
- **FAQ** → `/FAQ/index`
- **Contact** → `/Contact/index`

### User Navigation (Logged In)
- **My Projects** → `/MyProjects/List/index`
  - Project Overview → `/MyProjects/List/ProjectOverview`
  - Media → `/MyProjects/Media/index`
  - Taxa → `/MyProjects/Taxa/index`
  - Specimens → `/MyProjects/Specimens/index`
  - Matrices → `/MyProjects/Matrices/index`
  - Bibliography → `/MyProjects/Bibliography/index`
  - Views → `/MyProjects/Views/index`
  - Project Info → `/MyProjects/Project/form`
  - Members → `/MyProjects/Members/index`
  - Publishing → `/MyProjects/Publishing/publishForm`

### Admin Navigation (Admin Only)
- **User Logins** → `/Administration/Users/ListUsers`
- **Access Roles** → `/Administration/Roles/ListRoles`
- **Site Statistics** → `/Administration/Analytics/index`
- **Project Statistics** → `/Administration/ProjectStats/index`
- **Project Browser** → `/Administration/ProjectBrowser/index`
- **Duplication Requests** → `/Administration/DuplicationRequests/ListRequests`
- **Home Page Dashboard** → `/Administration/HomePage/index`
- **Press Dashboard** → `/Administration/Press/index`
- **Inactive Projects** → `/Administration/InactiveProjects/index`
- **Maintenance message** → `/Administration/MaintenanceMessage/index`

## 10. URL Parameters for User Pages

Common parameters users might encounter:
- `project_id=X` - Specify project ID for project-specific pages
- `search=X` - Search query parameter for search pages
- `tab=X` - Tab selection on pages with multiple sections

## 11. Access Summary

- **Public Pages**: No authentication required - available to all visitors
- **User Pages**: Require login - personal project management
- **Admin Pages**: Require admin role - site administration
- **Curator Pages**: Require curator role - content curation

## 12. User Interface Features

- **Responsive Design**: All pages adapt to different screen sizes
- **Interactive Elements**: Forms, search, filtering, sorting
- **Navigation**: Breadcrumb trails and menu systems
- **Help Systems**: Context-sensitive help and documentation
- **Data Export**: Download options for project data

---

**Note:** This excludes all API endpoints, AJAX calls, backend services, and programmatic interfaces that are not meant to be visited directly by users in their browsers.
