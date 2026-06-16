# Search Page Refactoring - Architecture Documentation

## Overview

The monolithic `RecherchePage.vue` has been completely refactored into a scalable, maintainable architecture following Vue 3 + Quasar + Tailwind best practices.

## New Architecture

### 📁 File Structure

```
src/
├── pages/
│   └── logement/
│       ├── RecherchePage.vue (legacy - keep for backward compatibility)
│       └── SearchPage.vue (new refactored version)
│
├── composables/
│   ├── useLogementFilters.js      - Filter state management
│   ├── useLogementSearch.js       - API calls & search state
│   ├── usePagination.js           - Pagination logic
│   ├── useRouteFilters.js         - Route synchronization
│   ├── useMapMarkers.js           - Google Maps markers
│   └── useResponsiveMap.js        - Responsive layout
│
├── services/
│   └── logement.service.js        - API service layer
│
├── utils/
│   ├── buildQuery.js              - Query parameter builder
│   ├── escapeHtml.js              - XSS protection
│   └── safeJsonParse.js           - Safe JSON parsing
│
└── components/
    └── search/
        ├── SearchTopbar.vue       - Top bar with filters
        ├── SearchFiltersDialog.vue - Mobile filter dialog
        ├── SearchResults.vue      - Results list
        ├── ListingCard.vue        - Individual listing card
        ├── PaginationBar.vue      - Pagination controls
        └── search-styles.css      - Shared styles
```

## Separation of Concerns

### Before (Monolithic)

- ❌ 600+ lines in single file
- ❌ Mixed UI, logic, API calls, state
- ❌ Hard to test individual features
- ❌ Difficult to reuse components

### After (Modular)

- ✅ Clear separation of concerns
- ✅ Each composable handles one responsibility
- ✅ Reusable components
- ✅ Easy to test and maintain
- ✅ Scalable architecture

## Composables Breakdown

### 1. `useLogementFilters`

**Purpose**: Manages filter state and options

**Responsibilities**:

- Filter state (q, ville, types, budget, etc.)
- Filter options (villeOptions, typeOptions, placesOptions)
- Filter validation
- Reset functionality

**Usage**:

```javascript
const { filters, villeOptions, typeOptions, resetFilters, hasActiveFilters } = useLogementFilters()
```

### 2. `useLogementSearch`

**Purpose**: Handles API communication and search state

**Responsibilities**:

- API calls to `/api/logements`
- Loading state
- Search context
- Data normalization

**Usage**:

```javascript
const { loading, logements, searchContext, fetchLogements } = useLogementSearch(filters, pagination)
```

### 3. `usePagination`

**Purpose**: Manages pagination state and logic

**Responsibilities**:

- Page tracking
- Total pages calculation
- Visible pages computation (smart pagination)
- Reset functionality

**Usage**:

```javascript
const { pagination, visiblePages, resetPagination } = usePagination({ initialPage: 1, limit: 12 })
```

### 4. `useRouteFilters`

**Purpose**: Synchronizes filters with URL

**Responsibilities**:

- Read filters from route query
- Update route on filter change
- Navigate between pages
- Maintain clean URLs (no `?page=1`)

**Usage**:

```javascript
const { applyRouteQuery, navigateToPage } = useRouteFilters(filters, pagination)
```

### 5. `useMapMarkers`

**Purpose**: Generates Google Maps markers

**Responsibilities**:

- Marker generation from logements
- Map center calculation
- Info card HTML generation
- Image URL resolution

**Usage**:

```javascript
const { mapMarkers, mapCenter } = useMapMarkers(logements)
```

### 6. `useResponsiveMap`

**Purpose**: Manages responsive layout

**Responsibilities**:

- Topbar height observation
- Mobile map height calculation
- Tab state (liste/carte)
- Resize observer cleanup

**Usage**:

```javascript
const { activeTab, mobileMapHeight } = useResponsiveMap()
```

## Services Layer

### `logement.service.js`

**Purpose**: API abstraction layer

**Functions**:

- `normalizeLogement()` - Data normalization
- `fetchLogementsApi()` - API fetch with error handling

**Benefits**:

- Single source of truth for API calls
- Easy to mock for testing
- Centralized error handling

## Utilities

### `buildQuery.js`

Builds URLSearchParams from filters and pagination objects.

### `escapeHtml.js`

Prevents XSS attacks by escaping HTML special characters.

### `safeJsonParse.js`

Safely parses JSON strings with fallback values.

## Components

### 1. `SearchTopbar.vue`

**Props**: filters, options, hasFilters, activeTab
**Emits**: update:filters, search, reset, open-filters
**Responsibility**: Desktop filter bar and mobile tabs

### 2. `SearchFiltersDialog.vue`

**Props**: show, filters, options, loading
**Emits**: update:show, update:filters, apply, reset
**Responsibility**: Mobile filter sheet dialog

### 3. `SearchResults.vue`

**Props**: logements, loading, context, pagination, visiblePages
**Emits**: hover, change-page
**Responsibility**: Results list with pagination

### 4. `ListingCard.vue`

**Props**: logement, isActive
**Emits**: hover
**Responsibility**: Individual listing card display

### 5. `PaginationBar.vue`

**Props**: page, totalPages, total, hasPrev, hasNext, visiblePages
**Emits**: change-page
**Responsibility**: Pagination controls UI

## Migration Guide

### To use the new SearchPage:

1. Update routes.js:

```javascript
// Old
{ path: 'recherche', component: () => import('pages/logement/RecherchePage.vue') }

// New
{ path: 'recherche', component: () => import('pages/logement/SearchPage.vue') }
```

2. The new page is fully backward compatible - same URL structure, same API calls.

## Benefits

### 🚀 Performance

- Smaller component chunks = faster rendering
- Composables are tree-shakeable
- Efficient reactivity with computed properties

### 🧪 Testability

- Each composable can be unit tested independently
- Components are isolated and testable
- Service layer can be mocked

### 🔧 Maintainability

- Clear separation of concerns
- Single Responsibility Principle
- Easy to locate and fix bugs

### 📈 Scalability

- Easy to add new features
- Reusable components and composables
- Clean architecture for team collaboration

### 🎨 Reusability

- Components can be used in other pages
- Composables can be shared across projects
- Utilities are generic and reusable

## Best Practices Applied

1. **Composition API** - Modern Vue 3 pattern
2. **Single Responsibility** - Each file does one thing well
3. **Separation of Concerns** - UI, logic, API separated
4. **DRY (Don't Repeat Yourself)** - Shared utilities and composables
5. **Clean Code** - Descriptive names, small functions
6. **Type Safety** - JSDoc comments for type hints
7. **Error Handling** - Centralized in service layer
8. **Responsive Design** - Mobile-first approach

## Future Enhancements

1. Add TypeScript for better type safety
2. Implement virtual scrolling for large result sets
3. Add skeleton loaders for better UX
4. Implement caching with Vue Query or SWR
5. Add analytics tracking
6. Implement server-side rendering (SSR) optimization

## Testing Strategy

### Unit Tests

- Test each composable independently
- Test utility functions
- Test component rendering

### Integration Tests

- Test filter + search interaction
- Test route synchronization
- Test pagination flow

### E2E Tests

- Full search workflow
- Mobile responsive behavior
- Map interaction

## Conclusion

This refactoring transforms a 600+ line monolithic component into a clean, scalable architecture that follows modern Vue 3 best practices. The new structure is easier to maintain, test, and extend while providing the same functionality with better performance.
