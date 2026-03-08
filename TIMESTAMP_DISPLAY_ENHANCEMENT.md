# Timestamp Display Enhancement

## Summary
Added relative time display (e.g., "2 hours ago", "3 days ago") for farmer produce listings and buyer procurement requests, with tooltips showing exact date and time.

## Changes Made

### 1. Created Time Utility Functions

#### `src/utils/timeUtils.ts`

Created two utility functions:

**getRelativeTime(date)**
- Converts a date to relative time string
- Examples:
  - Less than 1 minute: "Just now"
  - 5 minutes ago: "5 minutes ago"
  - 2 hours ago: "2 hours ago"
  - 3 days ago: "3 days ago"
  - 2 weeks ago: "2 weeks ago"
  - 1 month ago: "1 month ago"
  - 1 year ago: "1 year ago"

**formatDateTime(date)**
- Formats date to readable string with time
- Format: "Jan 15, 2024, 02:30 PM"
- Uses Indian locale (en-IN)

### 2. Updated Buyer Pages

#### `src/pages/buyer/Procurement.tsx`
- Added relative time display for farmer listings
- Shows "Listed X ago" instead of just the date
- Tooltip shows exact date and time on hover

**Before:**
```jsx
<p className="text-sm text-gray-600">
  Listed {new Date(listing.createdAt).toLocaleDateString()}
</p>
```

**After:**
```jsx
<p className="text-sm text-gray-600" title={formatDateTime(listing.createdAt)}>
  Listed {getRelativeTime(listing.createdAt)}
</p>
```

#### `src/pages/buyer/MyProcurementRequests.tsx`
- Added relative time display for procurement requests
- Shows "Created X ago" instead of just the date
- Tooltip shows exact date and time on hover

**Before:**
```jsx
<p className="text-sm text-gray-600">
  Created {new Date(request.createdAt).toLocaleDateString()}
</p>
```

**After:**
```jsx
<p className="text-sm text-gray-600" title={formatDateTime(request.createdAt)}>
  Created {getRelativeTime(request.createdAt)}
</p>
```

### 3. Updated Farmer Pages

#### `src/pages/farmer/MyListings.tsx`
- Added relative time display for farmer listings
- Shows "Listed X ago" instead of just the date
- Tooltip shows exact date and time on hover

**Before:**
```jsx
<p className="text-sm text-gray-600">
  Listed {new Date(listing.createdAt).toLocaleDateString()}
</p>
```

**After:**
```jsx
<p className="text-sm text-gray-600" title={formatDateTime(listing.createdAt)}>
  Listed {getRelativeTime(listing.createdAt)}
</p>
```

## How It Works

### Relative Time Calculation:

The `getRelativeTime()` function calculates the time difference between now and the given date, then returns an appropriate string:

1. **< 1 minute**: "Just now"
2. **< 1 hour**: "X minutes ago"
3. **< 1 day**: "X hours ago"
4. **< 1 week**: "X days ago"
5. **< 4 weeks**: "X weeks ago"
6. **< 1 year**: "X months ago"
7. **≥ 1 year**: "X years ago"

### Tooltip Display:

When users hover over the relative time, they see the exact date and time:
- Format: "Jan 15, 2024, 02:30 PM"
- Uses browser's locale settings
- Provides precise timestamp for reference

## Benefits

1. **Better User Experience**: Relative time is more intuitive than absolute dates
2. **Quick Understanding**: Users can quickly see how recent a listing is
3. **Precise Information**: Tooltip provides exact timestamp when needed
4. **Consistent Display**: Same format across all pages
5. **Automatic Updates**: Time display updates on page refresh

## Examples

### Farmer Listing:
- **Display**: "Listed 2 hours ago"
- **Tooltip**: "Jan 15, 2024, 02:30 PM"

### Procurement Request:
- **Display**: "Created 3 days ago"
- **Tooltip**: "Jan 12, 2024, 10:15 AM"

### Old Listing:
- **Display**: "Listed 2 months ago"
- **Tooltip**: "Nov 15, 2023, 04:45 PM"

## User Interface

### Visual Appearance:
- Text color: Gray (text-gray-600)
- Font size: Small (text-sm)
- Cursor: Default (shows tooltip on hover)
- Position: Below the crop name/title

### Hover Behavior:
- Hovering shows browser's native tooltip
- Tooltip contains full date and time
- No delay in showing tooltip

## Testing

### Test Scenarios:

1. **Recent Listing (< 1 hour)**
   - Create a new listing
   - Should show "Just now" or "X minutes ago"
   - Tooltip shows current date and time

2. **Today's Listing (< 24 hours)**
   - View listing created earlier today
   - Should show "X hours ago"
   - Tooltip shows today's date with time

3. **This Week's Listing (< 7 days)**
   - View listing created this week
   - Should show "X days ago"
   - Tooltip shows date from this week

4. **Old Listing (> 1 month)**
   - View old listing
   - Should show "X months ago" or "X years ago"
   - Tooltip shows historical date

### Verification:
1. Navigate to buyer procurement page
2. Check farmer listings show "Listed X ago"
3. Hover to see exact timestamp
4. Navigate to my procurement requests
5. Check requests show "Created X ago"
6. Navigate to farmer my listings
7. Check listings show "Listed X ago"

## Notes

- Time calculations are done client-side
- Display updates on page refresh
- Timezone is based on user's browser settings
- Relative time is approximate (uses 30 days for month, 365 days for year)
- Exact timestamp in tooltip uses browser's locale
- No server-side changes required
- Works with existing createdAt timestamps

## Future Enhancements

Potential improvements:
1. Auto-update relative time without page refresh
2. Add "Updated X ago" for edited items
3. Show different colors for very old listings
4. Add "New" badge for listings < 1 hour old
5. Localization support for different languages
