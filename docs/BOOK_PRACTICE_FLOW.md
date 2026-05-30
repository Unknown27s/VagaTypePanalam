# Weekly Book Practice - Complete Flow

## How Book Practice Now Works

### 1. **Upload Book (Admin)**
- Admin uploads book content via `/admin` dashboard
- Book content is compressed/stored in database
- `words` array: stores UNIQUE deduplicated words (for database search/filter only)

### 2. **Fetch Active Book** (`/api/practice-book/active`)
- API retrieves the active book from database
- **NEW**: Extracts words from content **in order** (preserving sequence)
- Returns both `content` and `words` (in-order array)
- Handles decompression if book was compressed

```javascript
extractWordsInOrder(content) → ["the", "quick", "brown", "fox", ...]
// Not deduplicated, maintains reading order
```

### 3. **Frontend: Load Book** (`src/app/page.tsx`)
- User clicks "Weekly Book Practice" button
- Fetches active book from API
- Stores in localStorage for offline access
- Passes `weeklyBook.words` to TypingArea component

### 4. **SessionTracker: Sequential Reading** (`src/engine/sessionTracker.ts`)
- Initializes with `weeklyBookWords` (in-order word array)
- **Loads saved position** from localStorage: `vanga-book-position`
- `bookPositionIndex`: tracks current position in the word array

#### generateNextText() Flow:
```
1. If weeklyBookWords provided:
   - Start from bookPositionIndex
   - Read words sequentially until segment length reached
   - Increment bookPositionIndex
   - Save position after segment completes
   
2. Position wraps to 0 when reaching end of book
   - Allows user to cycle through book multiple times
```

### 5. **Typing Display** (`src/styles/typing.css`)
- **Adjusted text size**: `clamp(1.1rem, 1.6vw, 1.4rem)` (smaller for long books)
- **Line height**: `1.85` (more compact)
- Shows ~3 lines at a time with smooth scrolling

### 6. **Position Persistence**
- After each segment completes → save position to localStorage
- Next session → load position and continue from there
- User feels like continuous reading through the book

---

## Data Flow Diagram

```
[Book Upload] 
     ↓
[Compress + Extract Words in Order]
     ↓
[Database: PracticeBook {content, words, etc}]
     ↓
[GET /api/practice-book/active]
     ↓
[Frontend: setWeeklyBook()]
     ↓
[Pass weeklyBook.words → TypingArea → SessionTracker]
     ↓
[SessionTracker.init() loads bookPositionIndex from localStorage]
     ↓
[generateNextText() reads sequentially from position]
     ↓
[User types through book]
     ↓
[After segment: save bookPositionIndex to localStorage]
     ↓
[Next session: continue from saved position]
```

---

## Key Changes Made

### 1. SessionTracker (`src/engine/sessionTracker.ts`)
- ✅ Added `bookPositionIndex` to track position
- ✅ Load position from localStorage on init
- ✅ Sequential reading (not random)
- ✅ Save position after each segment

### 2. API (`src/app/api/practice-book/active/route.ts`)
- ✅ Extract words in order from content
- ✅ Handle decompression
- ✅ Return both content and ordered words

### 3. Typing Styles (`src/styles/typing.css`)
- ✅ Reduced font size for better visibility
- ✅ Adjusted line height for compact display

---

## Testing Checklist

- [ ] Upload a book via admin dashboard
- [ ] Mark book as "Active"
- [ ] Switch to "Weekly Book Practice" mode
- [ ] Type some words
- [ ] Refresh page
- [ ] Verify words continue sequentially (not random reset)
- [ ] Type until a new segment loads
- [ ] Verify new segment starts from where you left off (not back to beginning)
- [ ] Continue typing to another segment
- [ ] Verify all segments are sequential
- [ ] Close browser and reopen
- [ ] Verify position still saved and continues correctly

---

## Troubleshooting

**Issue**: "Still showing random words"
- Check: Is the book marked as `isActive`?
- Check: Browser localStorage cleared?
- Check: Did you upload with at least one book content?

**Issue**: "Position not saving"
- Check: localStorage is not disabled
- Check: Book practice mode is selected

**Issue**: "Words are old/cached"
- Clear localStorage: `localStorage.clear()`
- Or: Hard refresh page (Ctrl+Shift+R)
