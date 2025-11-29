# Dark Mode Feature

## Overview

The R.E.S.Q. application now supports a night mode (dark mode) toggle feature, allowing users to switch between light and dark themes for better visibility in different lighting conditions.

## Features

### 🌙 Automatic Theme Detection

- Detects system preference on first load
- Respects user's operating system dark mode setting

### 💾 Persistent Storage

- Remembers user's theme choice across sessions
- Stored in browser's localStorage

### 🎨 Comprehensive Styling

- All UI components support dark mode
- Smooth transitions between themes
- Optimized color contrast for accessibility

## User Guide

### Toggling Dark Mode

1. Look for the Moon/Sun icon in the top navigation bar (next to the logout button)
2. Click the icon to toggle between light and dark modes
3. Your preference will be saved automatically

### Icon Indicators

- **Moon icon** 🌙: Currently in light mode, click to switch to dark
- **Sun icon** ☀️: Currently in dark mode, click to switch to light

## Technical Implementation

### Files Modified/Created

1. **src/contexts/ThemeContext.jsx** (NEW)

   - Theme state management
   - localStorage persistence
   - System preference detection

2. **src/App.jsx**

   - Added ThemeProvider wrapper

3. **src/components/Layout.jsx**

   - Added dark mode toggle button
   - Updated all navigation colors for dark mode

4. **src/index.css**

   - Added dark mode variants for all component classes
   - Updated scrollbar styling for dark mode

5. **tailwind.config.js**
   - Enabled dark mode with 'class' strategy

### Theme Classes

All components now use Tailwind's dark mode classes:

```jsx
className = "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100";
```

### Color Palette (Dark Mode)

- **Background**: slate-900
- **Cards**: slate-800
- **Text**: slate-100
- **Borders**: slate-700
- **Hover states**: slate-700

## Developer Guide

### Adding Dark Mode to New Components

When creating new components, add dark mode classes:

```jsx
// Example: Card component
<div className="card">  {/* Already has dark mode support */}
  <h2 className="text-slate-900 dark:text-slate-100">Title</h2>
  <p className="text-slate-600 dark:text-slate-400">Description</p>
</div>

// Example: Custom element
<div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
  Content
</div>
```

### Using the Theme Context

```jsx
import { useTheme } from "../contexts/ThemeContext";

function MyComponent() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div>
      <p>Current mode: {isDarkMode ? "Dark" : "Light"}</p>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}
```

### Component Classes with Dark Mode

All utility classes in `index.css` now support dark mode:

- `.card` - Cards with dark background
- `.btn-secondary` - Buttons with dark variants
- `.input` - Form inputs with dark styling
- `.badge-*` - All badge variants
- Custom scrollbar

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Accessibility

- High contrast ratios maintained in both modes
- WCAG 2.1 AA compliant color combinations
- No impact on screen reader functionality
- Smooth transitions for reduced motion preference

## Future Enhancements

- [ ] Add "Auto" mode that follows system preference continuously
- [ ] Add more theme variants (e.g., high contrast, blue light filter)
- [ ] Theme-specific data visualization colors
- [ ] Per-user theme preference stored in database

## Testing

To test dark mode:

1. Start the application: `npm run dev`
2. Login to the dashboard
3. Click the theme toggle icon in the navigation bar
4. Verify all pages render correctly in both modes:
   - Dashboard
   - Sensors
   - Cameras
   - Incidents
   - Alerts
   - Map
   - Analytics
   - Settings
   - Maintenance

## Troubleshooting

### Theme not persisting after reload

- Check browser localStorage permissions
- Verify localStorage is enabled in browser settings

### Some elements not changing color

- Ensure all custom components use dark mode classes
- Check for inline styles overriding theme classes
- Verify Tailwind dark mode is enabled in config

### Flash of wrong theme on load

- This is normal and minimal due to localStorage check
- Theme is applied before React render

## Resources

- [Tailwind CSS Dark Mode Docs](https://tailwindcss.com/docs/dark-mode)
- [MDN: prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [Web.dev: Color Scheme](https://web.dev/color-scheme/)
