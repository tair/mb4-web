# Matrix Lazy Loading Implementation

This directory contains the Vue.js implementation of lazy loading for matrix editor cell images.

## Components

### LazyMatrixImage.vue
A Vue 3 component that uses `v-lazy-image` for efficient lazy loading of matrix cell thumbnails.

**Features:**
- Lazy loads images using Intersection Observer API
- Shows loading placeholders while images load
- Supports multiple images per cell with navigation arrows
- Handles click events to open ImageViewerDialog
- Responsive design for different screen sizes
- Error handling for failed image loads

**Props:**
- `imageUrls`: Array of image objects with id, url, and optional caption
- `type`: Image type (typically 'X' for matrix cells)  
- `projectId`: Project ID for media URL building
- `cellId`: Optional cell/link ID for annotation context
- `readonly`: Whether the image should be readonly
- `published`: Whether the project is published
- `placeholderImage`: URL for loading placeholder (defaults to SVG)

**Events:**
- `imageClick`: Emitted when user clicks on image

## TypeScript Integration

### LazyImageRenderer.ts
TypeScript class that integrates the Vue component with the existing matrix editor.

**Features:**
- Extends Component class for matrix editor integration
- Uses VueMountingUtility to mount Vue components in TypeScript
- Provides same API as original ImageRenderer
- Handles cleanup of Vue components properly
- Fallback display when Vue component fails to load

**Usage:**
```typescript
const images = new LazyImageRenderer('X')
images.setProjectId(projectId)
images.setReadOnly(readonly)
images.setCellId(cellId)
images.addImage(mediaId, thumbnailUrl, caption)
images.render(cellElement)
```

## Performance Benefits

1. **Faster Initial Load**: Only visible images are loaded initially
2. **Reduced Memory Usage**: Images outside viewport aren't loaded into memory  
3. **Better Scrolling Performance**: Smooth scrolling through large matrices
4. **Progressive Loading**: Images load as user scrolls/navigates
5. **Bandwidth Savings**: Significant reduction in initial data transfer

## Usage in Matrix Editor

The lazy loading is automatically enabled when you use:
- `CellStateNameImageRenderer`
- `CellStateNumberImageRenderer`

These renderers now use `LazyImageRenderer` instead of the original `ImageRenderer`.

## Placeholder Images

The system uses `/images/loading-placeholder.svg` as the default placeholder while images load. This is a lightweight SVG with a subtle loading animation.

## Browser Support

- Modern browsers with Intersection Observer API support
- Graceful fallback for older browsers (loads images immediately)
- Vue 3.2+ compatibility

## Testing

To verify the implementation:
1. Open a matrix with many cell images
2. Check browser DevTools Network tab
3. Observe images loading only as they come into view
4. Verify smooth scrolling performance
