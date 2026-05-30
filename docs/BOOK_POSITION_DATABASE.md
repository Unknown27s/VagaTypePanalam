# Book Practice Diagnostic & Database Position Storage

## Issue 1: "tm" Appearing Instead of Words

### Possible Causes:

1. **No Book Uploaded**
   - Check: Go to `/admin` → Books tab
   - Should see at least one book listed
   - If empty: Upload a book first

2. **Book Content Corrupted**
   - Check: Books admin page → click on the book
   - Should show full text content
   - If empty or "tm": Content was not extracted properly from EPUB

3. **Decompression Failed**
   - Check: Browser console (F12) for errors
   - Check: Server console for "❌ Decompression failed"
   - Solution: Delete book and re-upload

4. **API Not Returning Content**
   - Check: Open browser DevTools → Network tab
   - Request: `GET /api/practice-book/active`
   - Response should have `book.words` array with many items
   - If words array has 0-2 items: Content wasn't extracted

---

## Solution Steps:

### Step 1: Verify a Book Exists
```bash
# In browser console:
fetch('/api/admin/books')
  .then(r => r.json())
  .then(books => {
    console.log('Total books:', books.length);
    console.log('Books:', books.map(b => ({
      id: b.id,
      title: b.title,
      isActive: b.isActive,
      hasContent: !!b.content,
      hasCompressed: !!b.compressedContent,
      contentSize: b.originalSize
    })));
  });
```

### Step 2: Check Active Book
```bash
fetch('/api/practice-book/active')
  .then(r => r.json())
  .then(data => {
    console.log('Active book:', data.book.title);
    console.log('Content length:', data.book.content?.length);
    console.log('Words count:', data.book.words?.length);
    console.log('First 10 words:', data.book.words?.slice(0, 10));
    if (!data.book.content || data.book.content.length < 50) {
      console.error('❌ Content too small or empty!');
    }
  });
```

### Step 3: Upload a Test Book
If no book exists or content is wrong:

1. Create a simple `.txt` file with at least 100 words:
```
The quick brown fox jumps over the lazy dog. This is a test book for practicing typing skills. 
The system should extract all these words correctly and display them sequentially. 
Each word will be highlighted as you type through the book content...
```

2. Go to `/admin` → Books tab → Upload file
3. Select all chapters (for EPUB)
4. Click "Apply Selection"
5. Fill in title: "Test Book"
6. Mark as "Active"
7. Click "Save"
8. Check console for logs

---

## Issue 2: Reading Position Now Stored in Database

### How It Works:

**Before:**
- Reading position stored in `localStorage` 
- Lost if localStorage cleared
- Only on this device

**After:**
- Reading position stored in database per user per book
- Synced across all devices
- Survives browser cache clearing
- Persists indefinitely

### Database Storage:

```sql
-- New table created:
ReadingProgress {
  userId: String (user who's reading)
  bookId: String (which book)
  position: Int (word index)
  updatedAt: DateTime (last update)
  
  Unique constraint: userId + bookId
}
```

### API Endpoints:

**Get Reading Position:**
```bash
GET /api/reading-progress?bookId=BOOK_ID

Response:
{
  "userId": "user123",
  "bookId": "book456",
  "position": 1234,  // word index
  "updatedAt": "2025-05-30T12:34:56.789Z"
}
```

**Save Reading Position:**
```bash
POST /api/reading-progress

Request:
{
  "bookId": "book456",
  "position": 1234
}

Response: {saved progress object}
```

### Flow:

1. **User starts Weekly Book Practice**
   ```
   TypingArea receives: bookId="book123"
   ↓
   SessionTracker.init(weeklyBookWords, bookId)
   ↓
   Fetch: GET /api/reading-progress?bookId=book123
   ↓
   Load position from database (e.g., position 1500)
   ↓
   Start reading from word 1500
   ```

2. **User completes a segment**
   ```
   SessionTracker.finishSegment()
   ↓
   bookPositionIndex incremented (e.g., 1500 → 1650)
   ↓
   POST /api/reading-progress { bookId, position: 1650 }
   ↓
   Database updated
   ↓
   Position saved for next session
   ```

3. **User logs in on different device**
   ```
   User opens Weekly Book Practice
   ↓
   SessionTracker fetches: GET /api/reading-progress?bookId=book123
   ↓
   Gets same position (1650) from database
   ↓
   Continues reading from exact same place
   ✅ Seamless cross-device experience
   ```

---

## Server Logs:

When you practice with book mode, check server console for:

```
📖 Loaded reading position from database: 1500
📝 Session initialized - Text length: 52341, Words: 8934

[Typing...]

💾 Reading position saved to database: 1650
   ✅ Position saved successfully
```

---

## Testing Checklist:

### Test 1: Initial Upload & Display
- [ ] Create test `.txt` file with 200+ words
- [ ] Upload via `/admin` → Books
- [ ] Mark as "Active"
- [ ] Click "Weekly Book Practice"
- [ ] Should see words, NOT "tm"
- [ ] Check server console: "Session initialized - Words: XXXX"

### Test 2: Position Persistence (Same Device)
- [ ] Type through 1-2 segments (~200 words)
- [ ] Refresh page
- [ ] Check: Does it continue from where you left off?
- [ ] Check server console: "Loaded reading position from database: XXXX"

### Test 3: Position Persistence (Cross-Device)
- [ ] On Device A: Start book, type 200 words, close
- [ ] On Device B: Same user account, open "Weekly Book Practice"
- [ ] Should show same position as Device A
- [ ] Check DB: Position should match

### Test 4: Position Reset When Switching Books
- [ ] Have 2 active books (switch via admin)
- [ ] On Book A: Type 100 words
- [ ] Switch to Book B (different user or delete A)
- [ ] Position should be different for each book
- [ ] Check DB: Different rows for userId+bookId

---

## Database Queries:

```sql
-- See all reading progress
SELECT * FROM "ReadingProgress" ORDER BY "updatedAt" DESC;

-- See reading progress for specific user
SELECT * FROM "ReadingProgress" 
WHERE "userId" = 'user_id_here'
ORDER BY "updatedAt" DESC;

-- See reading progress for specific book
SELECT u.email, rp.position, rp."updatedAt"
FROM "ReadingProgress" rp
JOIN "User" u ON rp."userId" = u.id
WHERE rp."bookId" = 'book_id_here'
ORDER BY rp."updatedAt" DESC;

-- Reset position for a book (if needed)
DELETE FROM "ReadingProgress" 
WHERE "bookId" = 'book_id_here';
```

---

## Fallback Behavior:

If database position save fails:
1. SessionTracker automatically falls back to `localStorage`
2. Server logs: "Failed to save reading position to database, using localStorage"
3. Position still saved locally
4. Next sync to database when network recovers

---

## What's Changed:

| Feature | Before | After |
|---------|--------|-------|
| Position Storage | localStorage only | Database + localStorage fallback |
| Cross-Device | ❌ Not available | ✅ Automatic sync |
| Persistence | Lost on cache clear | ✅ Permanent in DB |
| Scope | Per browser | ✅ Per user per book |
| Sync | Manual (page refresh) | ✅ Automatic every segment |

