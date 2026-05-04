# Your English World - MET Quiz

## Project Overview
Web quiz for MET (Michigan English Test) practice for Diana's English school "Your English World".

**Repository:** https://github.com/YourEnglishWorld/MET
**Live URL:** https://yourenglishworld.github.io/MET

**Contact Email:** yourenglishworld.dianagranados@gmail.com (Diana's English classes email)

---

## MET Structure

The MET exam is divided into **4 parts**:

### 1. WRITING
- **Task 1:** 3 correlative questions about personal experiences
- **Task 2:** 1 essay of 250 words

### 2. LISTENING (Multiple Choice)
- 4 answer options
- In the real MET, audio plays only once
- Dialogs include transcription with (T) button - note that in the real MET there is NO transcription
- Watch out for trap questions with words like "imply" (imply/deduce) or "mainly" (main topic)

**Parts:**
- **Part 1:** Short conversations between 2 people - 19 questions
- **Part 2:** Long conversations (some with 3-4 questions) - 14 questions
- **Part 3:** Short talks - 17 questions

### 3. READING AND GRAMMAR (Multiple Choice)

**Parts:**
- **Part 1:** Grammar - 20 questions
- **Part 2:** 1 long reading passage with 11 questions
  - Tip: Question 3 has single-word alternatives
  - Tip: Question 5 asks about meaning of expressions in the text
- **Part 3:** Two groups of 3 magazine article readings - 20 questions
  - Tip: 2-4 questions per text depending on size
  - Tip: Final question connects all three readings

### 4. SPEAKING

**Part 1:** Responses max 60 seconds
- Task 1: Describe an image
- Task 2: Give an opinion
- Task 3: Talk about a personal experience

**Part 2:**
- Task 1: Advantages and disadvantages
- Task 2: Justify an opinion (try to convince)

---

## Section Times (in minutes)

| Section                | Time |
|------------------------|------|
| WRITING                | 45   |
| LISTENING              | 35   |
| READING AND GRAMMAR   | 65   |
| SPEAKING               | 10   |

---

## Design Guidelines

- Minimalist, elegant design with smooth animations
- Header only visible on Home, small footer in quiz
- Home button in quiz view (top right)
- Logo in Home footer
- Compact progress bar with category badge
- Size reduction ~20% from original design
- Compact option buttons (alternatives)

---

## Features Implemented

### User Registration
- Form collects name + email before starting quiz
- Data stored in localStorage for return users
- User name displayed in header with "change" button
- Replaces the old 5-category system (Grammar, Reading, Listening, Writing, Speaking) with 4 MET categories

### Help/Contact
- "?" button in Home and Quiz views
- Modal with textarea for questions/consultations
- Data sent to Google Sheets via Apps Script

### Data Collection
- Google Analytics for visitor tracking
- Google Sheets + Apps Script for:
  - Quiz start/end logging
  - Help/consultation submissions
  - Notification emails to Diana

---

## File Structure

```
├── index.html          (HTML structure, modals, GA script)
├── styles.css          (CSS styles)
├── script.js           (JavaScript logic)
├── agents.md           (This file - project context)
├── data/
│   ├── grammar.json    (Grammar questions - to be restructured)
│   ├── reading.json    (Reading questions - to be restructured)
│   ├── listening.json (Listening questions - to be restructured)
│   ├── writing.json   (Writing guide)
│   ├── speaking.json   (Speaking guide)
│   ├── audios/         (Audio files for listening)
│   └── images/         (Logo and images)
└── README.md
```

---

## Google Setup Required

### Google Analytics
- Create GA4 property with Diana's Google account
- Measurement ID: To be added (G-XXXXXXXXXX)

### Google Apps Script
- Connect to Google Sheet for data collection
- Email for notifications: yourenglishworld.dianagranados@gmail.com
- Script URL: To be configured

---

## Categories (Current vs MET)

**Current (5 categories - needs restructuring):**
- GRAMMAR
- READING
- LISTENING
- WRITING
- SPEAKING

**MET Standard (4 categories - target):**
- WRITING
- LISTENING
- READING AND GRAMMAR
- SPEAKING

**Note:** JSON files need restructuring to match MET format (future task).

---

## Results Screen

### UI Structure

**Logo:** `data/images/yew logo png.png` - Same size as Home (80px)

**Header:** "¡Test completado!" (below logo)

**Score Display:** Large blue gradient text showing percentage and fraction
- Format: `50% (3/6)` or `100% (4/4)`

**Sections (in order):**
1. **WRITING** - Shows progress per part: `3/3 • 1/1`
2. **LISTENING** - Correct answers: `3/21`
3. **READING AND GRAMMAR** - Combined: `3/11`
4. **SPEAKING** - Completeness: `1/2`

**Action Buttons:**
- Home (gray, secondary)
- Enviar resultados por email (purple, primary) - Opens mailto
- Reiniciar test (gray, secondary)

### Calculation Logic

- `totalScore` = sum of correct answers across all sections
- `totalParts` = total questions/parts across all sections
- `percentage` = round((totalScore / totalParts) * 100)

**WRITING:** Uses `sectionResponses` array - counts non-empty answers per part
- Part 1 (3 questions): count answered
- Part 2 (essay): 1 if answered

**LISTENING/READING_AND_GRAMMAR:** Uses `score[section]` from quiz data

**SPEAKING:** Uses `sectionResponses` - counts completed parts

---

## Function Naming Convention

Use generic names that apply to all sections:
- `sectionResponses` (not `writingResponses`)
- `currentGroup` (not `writingGroup`)
- `partCount`/`partAnswered` (not `task1Count`/`task2Count`)
- `showResults()` - handles multiple sections
- `showWritingResults()` - handles Writing only

Use section-specific names only where the functionality IS section-specific:
- `renderStep(section, partId, items, inputType)` - universal function replacing renderWritingStep, renderWritingTask1, renderWritingTask2, renderSpeakingTask
- `renderPreview(section, items, inputType)` - universal function replacing renderWritingPreviewItems, renderSpeakingPreviewItems, renderMCPreviewItems
- `.writing-question, .speaking-task-container` - unified CSS class for text alignment
- `.writing-task-prompt, .speaking-prompt` - unified CSS class for prompt styling

### Navigation and Buttons in MET Quiz

Button PREVIOUS (ANTERIOR):
- Location: in all questions/groups of a section, except the first one.
- Function: goes back to the previous question/group, even if it requires moving back to a previous Part/Task.
- Note: in groups of questions, only one button per group.

Button NEXT (SIGUIENTE) / FINISH (FINALIZAR) (unified):
- Normal state: shows "Next" and moves to the next question/part/task.
- Special state: in the last question/group of the section, changes to "Finish section" with primary style and redirects to the section preview (#/[section-name]/preview).
- Note: never redirects to Results or another section. In groups, only one button per group.

Button SKIP TO:
- Location: in all questions/groups except the last one of the section.
- Function: redirects to the next Part of the section.
- In the last Part: shows "Skip to Preview" and redirects to the section preview.
- Label: dynamic, "Skip to [next block name]" obtained from the data array (no hardcoding).
- Note: in groups of questions, only one button per group.

Button CHECK (COMPROBAR):
- Location: in MC individual questions (below each question) or in groups (one button per group).
- Initial state: only CHECK is visible.
- On click: highlights correct answers in blue, incorrect ones in gray, updates the response counter in localStorage, hides CHECK, and shows NEXT/FINISH in the same place.

Button CONFIRM (CONFIRMAR):
- Location: only in the preview of any section.
- Function: redirects to the results page (#/results) using ShowResults().

Visual placement:
- Desktop:
  - Left → PREVIOUS
  - Center → NEXT/FINISH and CHECK
  - Right → SKIP TO
  - If SKIP does not apply, NEXT/FINISH moves to the right.
- Mobile:
  - First row → PREVIOUS (left), NEXT/FINISH (right)
  - Second row → SKIP TO (right, dynamic label) and CHECK (center)
  - Long labels (e.g., Skip to Part 2) may wrap into two lines.

---

### Response Tracking System

What counts as a response:
- MC: correctly answered questions.
- Writing: any textarea with written text.
- Speaking: any question with audio captured.

Preview:
- Must display all questions with their status:
  - Correctly answered
  - Wrong
  - Skipped/not answered

Results:
- Only counts correct answers.
- Does not add wrong or skipped ones.

Home (progress percentage):
- Under each section name, show a progress percentage.
- Calculation: considers all answered questions (correct or wrong).
- Skipped/not answered questions are not counted.
- Example: if a section has 10 questions and the user answered 7 (even if 3 are wrong), progress shows 70%.

### Syntax Validation Rule (Node.js + npm)

Prerequisites:
- Node.js LTS installed on Windows.
- npm available in PATH (verify with `node -v` and `npm -v`).

Workflow:
1. Before committing any code, run:
   - `npm run lint` → validates syntax with ESLint.
   - `npm run format` → formats code with Prettier.
2. Commits must be blocked if syntax errors are detected.
   - Husky pre-commit hook enforces this rule automatically.
3. OpenCode must not commit changes until lint and format pass successfully.
4. Push to remote repository only after all commits are validated locally.

Notes:
- "Tools for Native Modules" is not required during Node.js installation for this project.
- ESLint + Prettier ensure consistent style and prevent errors like `Unexpected token '}'`.
