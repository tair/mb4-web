# Access Control System

This directory contains a centralized access control system for MorphoBank that handles permissions for editing different types of entities (taxa, specimens, media, etc.).

## Architecture

The access control system consists of three main components:

1. **`access-control.js`** - Core service with permission logic
2. **`route-guards.js`** - Pre-configured router guards for different entity types
3. **Router integration** - Guards applied to edit routes

## How It Works

### Permission Hierarchy (highest to lowest priority):

1. **System-level permissions** - Curators and system administrators
2. **Project-level permissions** - Project administrators 
3. **Membership-based permissions** - Based on user's role in project
4. **Item-level permissions** - Based on entity's `access` field

### Membership Types:

- **Type 0 (Full Member)** - Can edit all content types
- **Type 1 (Observer)** - Cannot edit anything
- **Type 2 (Character Annotator)** - Can edit taxa, specimens, media, etc. but not characters/states
- **Type 3 (Bibliography Maintainer)** - Can only edit bibliographic references

### Access Levels:

- **0 (Project Editable)** - Anyone with proper membership can edit
- **1 (Owner Only)** - Only the owner (and admins/curators) can edit

## Using the System

### 1. Router Guards (Recommended)

Apply router guards to prevent unauthorized users from accessing edit pages:

```javascript
// In router/projects.js
import { requireTaxonEditAccess } from '@/lib/route-guards.js'

{
  path: 'taxa/:taxonId(\\d+)/edit',
  name: 'MyProjectTaxaEditView',
  component: () => import('@/views/project/taxa/EditView.vue'),
  beforeEnter: requireTaxonEditAccess,  // Add this line
}
```

### 2. Component-Level Access Control

For fine-grained control within components:

```javascript
import { AccessControlService, EntityType } from '@/lib/access-control.js'

// Check if user can edit
const accessResult = await AccessControlService.canEditEntity({
  entityType: EntityType.TAXON,
  projectId: 123,
  entity: taxonObject
})

if (accessResult.canEdit) {
  // User can edit
} else {
  // Show error: accessResult.reason
}

// Get restricted fields
const restrictedFields = AccessControlService.getRestrictedFields(
  EntityType.TAXON, 
  accessResult
)

// Get user-friendly message
const message = AccessControlService.getAccessMessage(
  accessResult, 
  EntityType.TAXON
)
```

## Adding Support for New Entity Types

### 1. Add Entity Type

```javascript
// In access-control.js
export const EntityType = {
  // ... existing types
  NEW_ENTITY: 'new_entity'
}
```

### 2. Update Membership Access Logic

```javascript
// In AccessControlService._checkMembershipAccess()
case MembershipType.CHARACTER_ANNOTATOR:
  if (entityType === EntityType.NEW_ENTITY) {
    return { canEdit: true, level: 'character_annotator' }
  }
  // ...
```

### 3. Create Entity Loader

```javascript
// In route-guards.js
async function loadNewEntity({ projectId, entityId }) {
  const store = useNewEntityStore()
  
  if (!store.isLoaded) {
    await store.fetch(projectId)
  }
  
  return store.getEntityById(entityId)
}
```

### 4. Create Router Guard

```javascript
// In route-guards.js
export const requireNewEntityEditAccess = createEntityEditGuard(
  EntityType.NEW_ENTITY,
  loadNewEntity
)
```

### 5. Apply to Routes

```javascript
// In router/projects.js
import { requireNewEntityEditAccess } from '@/lib/route-guards.js'

{
  path: 'newentities/:entityId(\\d+)/edit',
  name: 'MyProjectNewEntityEditView',
  component: () => import('@/views/project/newentities/EditView.vue'),
  beforeEnter: requireNewEntityEditAccess,
}
```

## Existing Entity Support

The following entity types are already supported:

- ✅ **Taxa** (`EntityType.TAXON`)
- ✅ **Specimens** (`EntityType.SPECIMEN`) 
- ✅ **Media** (`EntityType.MEDIA`)
- ✅ **Bibliographic References** (`EntityType.BIBLIOGRAPHIC_REFERENCE`)
- 🔄 **Media Views** (`EntityType.MEDIA_VIEW`) - Service ready, guards need implementation
- 🔄 **Project Documents** (`EntityType.PROJECT_DOCUMENT`) - Service ready, guards need implementation
- 🔄 **Folios** (`EntityType.FOLIO`) - Service ready, guards need implementation

## Benefits

1. **Centralized Logic** - All access control logic in one place
2. **Consistent Security** - Same rules applied across all entity types
3. **Router-Level Protection** - Users can't access edit pages they shouldn't see
4. **Reusable** - Easy to add support for new entity types
5. **User-Friendly** - Clear error messages explaining access restrictions
6. **Field-Level Control** - Automatic restriction of sensitive fields

## Migration Guide

To migrate existing edit views to use this system:

1. **Remove component-level access logic** - Replace with `AccessControlService` calls
2. **Add router guard** - Apply appropriate guard to the edit route
3. **Update field restrictions** - Use `getRestrictedFields()` instead of manual logic
4. **Simplify error handling** - Use `getAccessMessage()` for user feedback

See `taxa/EditView.vue` for a complete example of the migration. 