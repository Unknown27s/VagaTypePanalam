# Complete Book Flow: Compress → Decompress → Type

## 1️⃣ UPLOAD & COMPRESS (Server)

### Admin uploads book:
```
Admin → File upload (.epub or .txt)
  ↓
Server receives content
  ↓
compressContent(text) function:
  - If size < 100KB → Store uncompressed
  - If size ≥ 100KB → Gzip compress + Base64 encode
  
Example:
  Original: "The quick brown fox..." (500KB)
  ↓ Gzip compression
  Binary data
  ↓ Base64 encode
  "H4sIAAAAAAAAA3N2d3Z1ZgIAa1l7ZQYAAAA=" (175KB)
  ↓
Stored in database:
  - content: null
  - compressedContent: "H4sIAAAAAAAAA3N2d3Z1ZgIAa1l7ZQYAAAA="
```

### Code (Upload Route):
```typescript
// src/app/api/admin/books/route.ts POST

const compressionResult = await compressContent(content);

if (compressionResult.compressed) {
  bookData.compressedContent = compressionResult.compressed; // Base64
  bookData.content = null;
} else {
  bookData.content = content;
  bookData.compressedContent = null;
}

// Save to database
const book = await prisma.practiceBook.create({ data: bookData });
```

---

## 2️⃣ FETCH & DECOMPRESS (Server)

### User opens Weekly Book Practice:
```
Frontend: fetch('/api/practice-book/active')
  ↓
Server: GET /api/practice-book/active
  ↓
prisma.practiceBook.findFirst({ where: { isActive: true } })
  ↓
Check if compressed:
  
  IF has compressedContent && no content:
    decompressContent(base64String)
    ↓
    Buffer.from(base64, 'base64')
    ↓
    gunzip() decompression
    ↓
    .toString('utf-8')
    ↓
    "The quick brown fox..." (500KB) ← Original text recovered!
    
  IF has content && no compressedContent:
    Use content directly (no decompression needed)
```

### Code (Practice-Book API):
```typescript
// src/app/api/practice-book/active/route.ts GET

let content = activeBook.content;
const isCompressed = !!activeBook.compressedContent && !activeBook.content;

if (isCompressed) {
  // ✅ Decompress if needed
  content = await decompressContent(activeBook.compressedContent);
  console.log(`Decompressed: ${content.length} characters`);
}

// Extract words in order
const words = extractWordsInOrder(content);

return NextResponse.json({
  success: true,
  book: {
    id: activeBook.id,
    title: activeBook.title,
    content: content,  // ✅ Full text, ready to use!
    words: words,      // ✅ Words extracted in sequence
  }
});
```

---

## 3️⃣ EXTRACT WORDS IN SEQUENCE (Server)

### Convert full text to word array:
```typescript
function extractWordsInOrder(content: string): string[] {
  // Remove punctuation, normalize spacing
  const cleaned = content
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"''""-•]/g, ' ')
    .replace(/\s+/g, ' ');

  // Split into words, preserve order
  const words = cleaned
    .toLowerCase()
    .split(' ')
    .map(w => w.trim())
    .filter(w => w.length >= 1);

  return words;
  
  // Example:
  // Input:  "The quick brown fox—jumps, over the lazy dog!"
  // Output: ["the", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog"]
}
```

---

## 4️⃣ PASS TO FRONTEND (Network)

### Response to browser:
```json
{
  "success": true,
  "book": {
    "id": "book_123",
    "title": "Sample Book",
    "content": "The quick brown fox jumps over the lazy dog...",
    "words": ["the", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog"],
    "metadata": {
      "isCompressed": true,
      "originalSize": 524288,
      "compressionRatio": 0.354,
      "contentHash": "a1b2c3d4e5f6..."
    }
  }
}
```

---

## 5️⃣ FRONTEND: USE IN TYPING (Browser)

### React component receives data:
```typescript
// src/app/page.tsx

useEffect(() => {
  async function fetchWeeklyBook() {
    const res = await fetch('/api/practice-book/active');
    const data = await res.json();
    
    setWeeklyBook(data.book);
    // ✅ Now weeklyBook has:
    //    - id
    //    - title
    //    - content (full decompressed text!)
    //    - words (array of words)
  }
}, []);

// Pass to TypingArea:
<TypingArea
  weeklyBookWords={practiceMode === 'weekly-book' ? weeklyBook.words : undefined}
  bookId={practiceMode === 'weekly-book' ? weeklyBook.id : undefined}
/>
```

---

## 6️⃣ SESSIONTRACKER: SEQUENTIAL READING (Engine)

### Split words into segments:
```typescript
// src/engine/sessionTracker.ts init()

async init(targetKeys, customText, weeklyBookWords, bookId) {
  // weeklyBookWords is the array: ["the", "quick", "brown", ...]
  
  this.weeklyBookWords = weeklyBookWords;
  this.bookId = bookId;
  
  // Load saved position from database
  const progress = await fetch(`/api/reading-progress?bookId=${bookId}`);
  const data = await progress.json();
  this.bookPositionIndex = data.position || 0;  // e.g., 1500
  
  // Generate first segment of text
  this.text = await this.generateNextText();
}

// generateNextText():
async generateNextText() {
  if (this.weeklyBookWords && this.weeklyBookWords.length > 0) {
    const selected = [];
    let currentLength = 0;
    
    // Read sequentially from bookPositionIndex
    while (currentLength < SEGMENT_LENGTH && 
           this.bookPositionIndex < this.weeklyBookWords.length) {
      
      const word = this.weeklyBookWords[this.bookPositionIndex];
      selected.push(word);
      currentLength += word.length + 1;
      this.bookPositionIndex++;  // Increment for next segment
    }
    
    return selected.join(' ');
    
    // Example:
    // bookPositionIndex = 0
    // Returns: "the quick brown fox jumps over the lazy dog"
    // bookPositionIndex now = 9
    
    // Next segment:
    // bookPositionIndex = 9
    // Returns words[9] onwards...
  }
}
```

### Split into individual words for display:
```typescript
// In SessionTracker.init():
this.words = this.text.split(' ');

// this.words = ["the", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog"]
```

---

## 7️⃣ DISPLAY IN TYPING AREA (UI)

### Render each word with letter-level detail:
```typescript
// src/components/typing/TypingArea.tsx

// Map through words array
return snapshot.words.map((word, wordIdx) => (
  <div key={wordIdx} className={`word ${activeClass}`}>
    {word.split('').map((letter, letterIdx) => (
      <span 
        key={letterIdx} 
        className={`letter ${getLetterClass(letter, wordIdx, letterIdx)}`}
      >
        {letter}
      </span>
    ))}
  </div>
));

// Display:
// ┌─────────────────────────────────────┐
// │ the quick brown fox jumps over the  │
// │     ↑                                │
// │   (current word being typed)         │
// └─────────────────────────────────────┘
```

---

## 8️⃣ SAVE POSITION (Loop)

### After typing completes segment:
```typescript
// SessionTracker.finishSegment()

// Save position to database
await fetch('/api/reading-progress', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bookId: this.bookId,
    position: this.bookPositionIndex,  // e.g., 45
  }),
});

// Database updated:
// ReadingProgress { userId, bookId, position: 45 }

// Load next segment
this.text = await this.generateNextText();
this.words = this.text.split(' ');

// user continues typing...
```

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    UPLOAD (Admin)                           │
├─────────────────────────────────────────────────────────────┤
│  File (.epub/.txt)                                          │
│         ↓                                                    │
│  parseEpub() or file.text()                                 │
│         ↓                                                    │
│  Plain text: "The quick brown fox..."                       │
│         ↓                                                    │
│  compressContent()                                          │
│    - Gzip compress                                          │
│    - Base64 encode                                          │
│         ↓                                                    │
│  Store in DB:                                               │
│    compressedContent: "H4sIAAAA..."  ✅                     │
│    content: null                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  FETCH & DECOMPRESS                         │
├─────────────────────────────────────────────────────────────┤
│  GET /api/practice-book/active                              │
│         ↓                                                    │
│  Check: compressedContent exists?                           │
│         ↓ YES                                                │
│  decompressContent("H4sIAAAA...")                           │
│    - Base64 decode                                          │
│    - Gunzip decompress                                      │
│         ↓                                                    │
│  "The quick brown fox..." (500KB) ✅                         │
│         ↓                                                    │
│  extractWordsInOrder()                                      │
│    - Remove punctuation                                     │
│    - Split by spaces                                        │
│         ↓                                                    │
│  ["the", "quick", "brown", "fox", ...]  ✅                  │
│         ↓                                                    │
│  Return to frontend                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (Browser)                             │
├─────────────────────────────────────────────────────────────┤
│  setWeeklyBook(data.book)                                   │
│    - content: full text                                     │
│    - words: ["the", "quick", "brown", ...]                  │
│         ↓                                                    │
│  <TypingArea weeklyBookWords={words} bookId={id} />         │
│         ↓                                                    │
│  SessionTracker.init(weeklyBookWords, bookId)               │
│    - Load position from DB                                  │
│    - Generate first segment                                 │
│         ↓                                                    │
│  Display words in UI                                        │
│  "the quick brown fox jumps over the lazy dog"              │
│         ↓                                                    │
│  User types...                                              │
│         ↓                                                    │
│  Segment complete → Save position to DB                     │
│  Generate next segment                                      │
│         ↓                                                    │
│  Continue loop                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Points:

| Step | What Happens | Data Format |
|------|-------------|------------|
| 1. Upload | Compress if large | Base64 gzip string |
| 2. Fetch | Decompress | Full text string |
| 3. Extract | Split & clean | Word array |
| 4. Display | Show in UI | HTML with spans |
| 5. Type | Track input | Keyboard events |
| 6. Save | Store position | Database record |

---

## Example with Real Numbers

```
UPLOAD:
  File size: 1,000,000 bytes (1MB)
  After compression: 350,000 bytes (35% of original)
  Stored as: Base64 encoded (~467KB as text)
  
DECOMPRESS:
  Base64 string: "H4sIAAAAAAAA..." (467KB)
  ↓ Base64 decode
  Binary: \x1f\x8b\x08\x00... (350KB)
  ↓ Gunzip decompress
  Text: "The quick brown..." (1MB) ✅ Recovered!
  
EXTRACT WORDS:
  Text: "The quick brown fox jumps..."
  After cleaning: "the quick brown fox jumps..."
  Words array: ["the", "quick", "brown", "fox", "jumps", ...] (200,000 words)
  
TYPING:
  Segment 1: words[0:100] = "the quick brown fox..." (display)
  Segment 2: words[100:200] = "sits down on..." (display)
  Segment 3: words[200:300] = "and watches..." (display)
  ...
```

