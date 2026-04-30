# MET Quiz - Fix Plan

## Section 1: Writing Issues (1, 2, 8)

### Issue 1: Writing/Home - Hash not updating when entering Writing from Home

**Root cause:** `beginWriting()` (line 854-891) never calls `updateWritingHash()` after rendering. The hash stays stale.

**Fix:** Add hash update at end of `beginWriting()`:
```javascript
// After line 889 (updatePrevButtonVisibility();)
const taskPart = isTask2 ? 'task2' : 'task1';
const qNum = 1;
hashNavigationLocked = true;
updateWritingHash(taskPart, qNum);
hashNavigationLocked = false;
```

### Issue 2: Writing/Part 1 - Hash changes but page doesn't update on first NEXT click

**Root cause:** In `nextSectionStep()` (line 1841-1875):
1. The function calls `updateWritingHash()` which triggers `hashchange` event
2. `loadFromHash()` fires but the section comparison at line 258 (`currentPartKey === section`) fails because:
   - When on WRITING_TASK1, `currentPartKey` = 'WRITING_TASK1'
   - But `parseHash()` returns `section` = 'WRITING_TASK1' from hash
   - The check at line 258 looks for `questionGroups.length > 0` but Writing doesn't use `questionGroups`
3. The `loadFromHash()` returns early without rendering, so the page stays on same question

**Fix:** In `loadFromHash()`, add Writing-specific handling:
```javascript
// After line 256 (before the MC section check)
if (section.startsWith('WRITING') && currentSection === 'WRITING') {
  if (qStart !== null) {
    const step = qStart - 1; // q1 -> step 0, q2 -> step 1, q3 -> step 2
    if (step >= WRITING_STEPS.TASK1_Q1 && step <= WRITING_STEPS.TASK1_Q3) {
      if (currentWritingStep !== step) {
        currentWritingStep = step;
        renderWritingStep();
      }
    }
  }
  return;
}
```

Also fix `nextSectionStep()` to not trigger redundant hash navigation:
```javascript
// In nextSectionStep(), wrap hash update with lock:
hashNavigationLocked = true;
updateWritingHash(taskPart, qNum);
hashNavigationLocked = false;
```

### Issue 8: Writing/Preview - No ENVIAR button

**Root cause:** In `renderWritingStep()` (line 1272-1276):
```javascript
if (currentWritingStep === WRITING_STEPS.PREVIEW) {
  getElement('controls').classList.remove('hidden');
  getElement('check-btn').classList.add('hidden');
  getElement('next-btn').classList.add('hidden');
  getElement('prev-btn').classList.add('hidden');
  // MISSING: getElement('submit-section-btn').classList.remove('hidden');
}
```

And in `updatePrevButtonVisibility()` (line 1454-1459), the PREVIEW case shows `submit-btn` but the HTML uses `submit-section-btn` as the ID.

**Fix:** 
1. In `renderWritingStep()`, add: `getElement('submit-section-btn').classList.remove('hidden');`
2. In `updatePrevButtonVisibility()`, change all references from `submitBtn` to use the correct button ID

---

## Section 2: MC - COMPROBAR Button (Issue 3)

### Issue 3: Reimplement COMPROBAR button

**Current behavior:** Auto-checks on option selection (line 1184-1220, `selectGroupOption()`).

**Required behavior:**
- Single question groups: Show COMPROBAR below the question
- Multi-question groups: Show one COMPROBAR button for the whole group

**Fixes needed:**

1. **Remove auto-check from `selectGroupOption()`:**
   - Change to just select the option, don't validate yet
   - Store selection in a temp variable

2. **Add COMPROBAR button rendering:**
   - In `renderGroupQuestions()`, add a COMPROBAR button after options
   - For single-question groups: button below each question
   - For multi-question groups: one button at bottom of group

3. **Create `checkGroupAnswers()` function:**
   - Iterate through all questions in group
   - Check each selected answer against correct
   - Update score, show feedback

4. **Update `updatePrevButtonVisibility()`:**
   - Show COMPROBAR when group not yet checked
   - Hide COMPROBAR after checking, show NEXT

---

## Section 3: Speaking Issues (4, 7)

### Issue 4: Speaking - Duplicate SIGUIENTE button

**Root cause:** In `updatePrevButtonVisibility()` (line 1481-1506), both `next-btn` and `skip-btn` can be visible simultaneously. The `skip-btn` acts as a secondary "next" button.

**Fix:** 
- Remove duplicate button logic
- Use only `skip-btn` for navigation to next part/preview
- Hide `next-btn` in Speaking mode, use `skip-btn` exclusively

### Issue 7: Speaking/Audio - Store audio in IndexedDB

**Current behavior:** Audio stored as Blob in memory (`speakingResponses[speakingTaskIndex] = { blob, duration, timestamp }`), lost on page reload.

**Fix:**
1. Create IndexedDB wrapper functions:
   - `openSpeakingDB()` - open/create database
   - `saveSpeakingAudio(taskIndex, blob, duration)` - store audio
   - `getSpeakingAudio(taskIndex)` - retrieve audio
   - `clearSpeakingDB()` - cleanup

2. Update `startSpeakingRecording()` to save to IndexedDB instead of memory

3. Update `renderSpeakingTask()` to show playback button if audio exists

4. Update Preview to include audio playback for Speaking

5. Update email function to include audio blobs (may need to convert to base64 for mailto)

---

## Section 4: Preview Issues (6)

### Issue 6: Preview shows all as "sin respuesta"

**Root cause:** In `renderSectionPreview()` (line 2137-2229):
- Uses `getAnswerFromHash()` which looks in localStorage
- But answers are saved with `saveAnswerToHash()` which uses different key format

**Fixes per section:**

**MC (Listening/Reading):**
- Check `answeredQuestions` Set instead of just localStorage
- Show the selected letter (A/B/C/D)

**Writing:**
- Check `sectionResponses` array for non-empty strings
- Show first few words + "..." + last few words for long responses

**Speaking:**
- Check `speakingResponses` for non-null entries with duration
- Show "Recorded (Xs)" in preview

---

## Section 5: Mobile UI (9)

### Issue 9: SIGUIENTE button never on left in mobile

**Current CSS:** Lines 1700-1731 in styles.css use flexbox order but `#skip-btn` can appear on right side which becomes left in some layouts.

**Fix:**
- In mobile CSS (`@media (max-width: 600px)`):
  - Ensure `#skip-btn` always has `order: 1` or higher
  - Ensure `#prev-btn` always has `order: -1` or lower
  - Ensure `.controls-center` always has `order: 0`
  - Use `justify-content: center` for controls

---

## Implementation Order

1. Fix Writing hash issues (1, 2)
2. Fix Writing Preview ENVIAR button (8)
3. Test Writing section end-to-end
4. Fix MC COMPROBAR button (3)
5. Fix Speaking duplicate button (4)
6. Fix Speaking audio storage (7)
7. Fix Preview answer display (6)
8. Fix mobile UI (9)
9. Final end-to-end test
