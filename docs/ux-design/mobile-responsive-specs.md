# Mobile & Responsive Design Specifications

## Class Creation Wizard - Responsive Behavior

### 1. BREAKPOINT DEFINITIONS

```scss
// Core breakpoints aligned with shadcn/ui
$mobile-small: 320px;   // Minimum supported width
$mobile: 375px;         // Standard mobile
$mobile-large: 414px;   // Large phones
$tablet-small: 640px;   // Small tablets (sm)
$tablet: 768px;         // Standard tablets (md)
$desktop-small: 1024px; // Small desktop (lg)
$desktop: 1280px;       // Standard desktop (xl)
$desktop-large: 1536px; // Large screens (2xl)
```

---

## 2. MOBILE LAYOUT (320px - 639px)

### 2.1 Viewport Configuration

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
```

### 2.2 Container Specifications

```css
.wizard-container-mobile {
  width: 100%;
  min-height: 100vh;
  padding: 0;
  background: var(--background);
}

.wizard-content-mobile {
  padding: 16px;
  padding-bottom: env(safe-area-inset-bottom, 16px); /* iOS safe area */
}
```

### 2.3 Progress Indicator - Mobile

```css
.progress-mobile {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--background);
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  
  /* Horizontal scroll for steps */
  display: flex;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  -webkit-overflow-scrolling: touch; /* iOS smooth scroll */
}

.progress-mobile::-webkit-scrollbar {
  display: none; /* Chrome, Safari */
}

.progress-step-mobile {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin-right: 16px;
}

.progress-step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.progress-step-label {
  margin-left: 8px;
  font-size: 12px;
  white-space: nowrap;
}
```

### 2.4 Form Elements - Mobile

```css
/* Full-width inputs */
.form-input-mobile {
  width: 100%;
  height: 48px; /* Increased touch target */
  padding: 12px;
  font-size: 16px; /* Prevents zoom on iOS */
  border-radius: 8px;
}

/* Stacked labels */
.form-label-mobile {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
}

/* Radio/Checkbox sizing */
.form-checkbox-mobile,
.form-radio-mobile {
  width: 24px;
  height: 24px;
  /* Invisible touch target extension */
  position: relative;
}

.form-checkbox-mobile::before,
.form-radio-mobile::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
}
```

### 2.5 Button Layout - Mobile

```css
.button-group-mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--background);
  border-top: 1px solid var(--border);
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0));
  display: flex;
  gap: 12px;
}

.button-mobile {
  flex: 1;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
}

.button-mobile-primary {
  order: 2; /* Primary action on right */
}

.button-mobile-secondary {
  order: 1; /* Secondary action on left */
}
```

### 2.6 Schedule Selector - Mobile

```css
/* Native date/time inputs for better UX */
.schedule-input-mobile {
  /* Use native inputs */
  -webkit-appearance: none;
  appearance: none;
}

input[type="date"]::-webkit-calendar-picker-indicator,
input[type="time"]::-webkit-calendar-picker-indicator {
  width: 44px;
  height: 44px;
  opacity: 0.5;
}

/* Day selector as segmented control */
.day-selector-mobile {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin: 16px 0;
}

.day-button-mobile {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border-radius: 8px;
}
```

### 2.7 Student List - Mobile

```css
.student-card-mobile {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.student-card-header-mobile {
  display: flex;
  justify-content: space-between;
  align-items: start;
}

.student-info-mobile {
  flex: 1;
}

.student-name-mobile {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.student-email-mobile {
  font-size: 12px;
  color: var(--muted-foreground);
}

.student-actions-mobile {
  display: flex;
  gap: 8px;
}

.student-action-button-mobile {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## 3. TABLET LAYOUT (640px - 1023px)

### 3.1 Container Adjustments

```css
.wizard-container-tablet {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px;
}

.wizard-card-tablet {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
```

### 3.2 Progress Indicator - Tablet

```css
.progress-tablet {
  display: flex;
  justify-content: space-between;
  margin-bottom: 32px;
  padding: 0;
  background: transparent;
}

.progress-step-tablet {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.progress-step-tablet::after {
  content: '';
  position: absolute;
  top: 16px;
  left: calc(50% + 20px);
  right: calc(-50% + 20px);
  height: 2px;
  background: var(--border);
}

.progress-step-tablet:last-child::after {
  display: none;
}
```

### 3.3 Form Layout - Tablet

```css
.form-grid-tablet {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group-full-tablet {
  grid-column: 1 / -1;
}

.button-group-tablet {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  position: static; /* Not fixed like mobile */
}

.button-tablet {
  min-width: 120px;
  height: 40px;
}
```

---

## 4. DESKTOP LAYOUT (1024px+)

### 4.1 Container Structure

```css
.wizard-container-desktop {
  max-width: 800px;
  margin: 40px auto;
  padding: 0 24px;
}

.wizard-card-desktop {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}
```

### 4.2 Two-Column Layouts

```css
.form-grid-desktop {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.schedule-grid-desktop {
  display: grid;
  grid-template-columns: 140px 1fr 1fr auto;
  gap: 16px;
  align-items: center;
}
```

### 4.3 Side Context Panel (Optional)

```css
@media (min-width: 1280px) {
  .wizard-layout-desktop {
    display: grid;
    grid-template-columns: 800px 320px;
    gap: 24px;
    max-width: 1144px;
    margin: 0 auto;
  }
  
  .context-panel-desktop {
    position: sticky;
    top: 24px;
    height: fit-content;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
  }
}
```

---

## 5. RESPONSIVE TYPOGRAPHY

```scss
// Mobile Typography
@media (max-width: 639px) {
  .heading-1 { font-size: 24px; line-height: 32px; }
  .heading-2 { font-size: 20px; line-height: 28px; }
  .heading-3 { font-size: 18px; line-height: 24px; }
  .body-text { font-size: 14px; line-height: 20px; }
  .caption { font-size: 12px; line-height: 16px; }
}

// Tablet Typography
@media (min-width: 640px) and (max-width: 1023px) {
  .heading-1 { font-size: 28px; line-height: 36px; }
  .heading-2 { font-size: 22px; line-height: 30px; }
  .heading-3 { font-size: 18px; line-height: 24px; }
  .body-text { font-size: 15px; line-height: 22px; }
  .caption { font-size: 13px; line-height: 18px; }
}

// Desktop Typography
@media (min-width: 1024px) {
  .heading-1 { font-size: 32px; line-height: 40px; }
  .heading-2 { font-size: 24px; line-height: 32px; }
  .heading-3 { font-size: 20px; line-height: 28px; }
  .body-text { font-size: 16px; line-height: 24px; }
  .caption { font-size: 14px; line-height: 20px; }
}
```

---

## 6. TOUCH INTERACTIONS

### 6.1 Gesture Support

```javascript
// Swipe navigation for mobile
const useSwipeNavigation = () => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  const minSwipeDistance = 50;
  
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      // Navigate to next step
    } else if (isRightSwipe) {
      // Navigate to previous step
    }
  };
};
```

### 6.2 Touch Feedback

```css
/* Tap highlight */
.touchable {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
  touch-action: manipulation; /* Prevents double-tap zoom */
}

/* Active states */
.touchable:active {
  transform: scale(0.98);
  transition: transform 100ms ease;
}

/* Disabled touch */
.disabled-touch {
  pointer-events: none;
  opacity: 0.5;
}
```

---

## 7. PERFORMANCE OPTIMIZATIONS

### 7.1 Mobile-Specific Optimizations

```javascript
// Lazy load heavy components
const StudentList = lazy(() => 
  import(/* webpackChunkName: "student-list" */ './StudentList')
);

// Debounce input handlers
const debouncedSearch = useMemo(
  () => debounce((value) => {
    searchStudents(value);
  }, 300),
  []
);

// Virtual scrolling for long lists
const VirtualStudentList = () => {
  return (
    <VirtualList
      height={400}
      itemCount={students.length}
      itemSize={80}
      overscan={3}
    >
      {({ index, style }) => (
        <div style={style}>
          <StudentCard student={students[index]} />
        </div>
      )}
    </VirtualList>
  );
};
```

### 7.2 Image Optimization

```javascript
// Responsive images
const DomainIcon = ({ domain }) => {
  return (
    <picture>
      <source 
        media="(max-width: 639px)" 
        srcSet={`${domain.icon}-mobile.webp`}
      />
      <source 
        media="(max-width: 1023px)" 
        srcSet={`${domain.icon}-tablet.webp`}
      />
      <img 
        src={`${domain.icon}.webp`}
        alt={domain.name}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
};
```

### 7.3 CSS Containment

```css
/* Optimize reflow/repaint */
.student-card {
  contain: layout style;
}

.progress-indicator {
  contain: layout;
}

.form-section {
  contain: style;
}
```

---

## 8. OFFLINE SUPPORT

### 8.1 Service Worker Strategy

```javascript
// Cache wizard assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('wizard-v1').then((cache) => {
      return cache.addAll([
        '/teacher/classes/create',
        '/static/js/wizard.bundle.js',
        '/static/css/wizard.css',
      ]);
    })
  );
});

// Offline form data persistence
const saveOfflineData = (data) => {
  const queue = JSON.parse(localStorage.getItem('offline-queue') || '[]');
  queue.push({
    id: Date.now(),
    type: 'create-class',
    data,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem('offline-queue', JSON.stringify(queue));
};
```

### 8.2 Network Status Indicator

```jsx
const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (isOnline) return null;
  
  return (
    <div className="network-status-banner">
      <Icon name="wifi-off" />
      <span>You're offline. Changes will be saved locally.</span>
    </div>
  );
};
```

---

## 9. PLATFORM-SPECIFIC CONSIDERATIONS

### 9.1 iOS Specific

```css
/* iOS safe areas */
.container-ios {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* iOS momentum scrolling */
.scrollable-ios {
  -webkit-overflow-scrolling: touch;
}

/* Prevent iOS zoom on input focus */
input[type="text"],
input[type="email"],
select,
textarea {
  font-size: 16px;
}
```

### 9.2 Android Specific

```css
/* Android status bar */
@supports (padding-top: env(safe-area-inset-top)) {
  .header-android {
    padding-top: env(safe-area-inset-top, 24px);
  }
}

/* Android back gesture area */
.container-android {
  margin-left: 16px;
  margin-right: 16px;
}
```

---

## 10. TESTING CHECKLIST

### Device Testing Matrix

| Device Category | Viewport | Test Priority | Key Focus Areas |
|----------------|----------|---------------|-----------------|
| iPhone SE | 375x667 | High | Touch targets, keyboard |
| iPhone 14 Pro | 393x852 | High | Safe areas, notch |
| iPad Mini | 768x1024 | High | Tablet layout |
| Samsung Galaxy S22 | 360x780 | High | Android specific |
| Desktop 1080p | 1920x1080 | Medium | Full features |
| Desktop 4K | 3840x2160 | Low | Scaling issues |

### Responsive Testing Tools

```javascript
// Cypress responsive tests
describe('Responsive Wizard', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
  ];
  
  viewports.forEach(({ name, width, height }) => {
    context(`${name} viewport`, () => {
      beforeEach(() => {
        cy.viewport(width, height);
        cy.visit('/teacher/classes/create');
      });
      
      it('should display appropriate layout', () => {
        // Test viewport-specific elements
      });
    });
  });
});
```

---

## IMPLEMENTATION PRIORITIES

1. **Phase 1 - Core Mobile (Week 1)**
   - Basic mobile layout
   - Touch interactions
   - Form validation
   - Navigation flow

2. **Phase 2 - Responsive Enhancement (Week 2)**
   - Tablet layouts
   - Desktop optimizations
   - Animation polish
   - Performance tuning

3. **Phase 3 - Platform Polish (Week 3)**
   - iOS optimizations
   - Android optimizations
   - Offline support
   - Accessibility audit