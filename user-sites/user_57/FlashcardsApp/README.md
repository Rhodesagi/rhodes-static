# Flashcards iOS App

A native iOS flashcard app with spaced repetition (SM-2 algorithm), built with SwiftUI and Core Data.

## Features

- **Decks**: Create and manage multiple decks of flashcards
- **Spaced Repetition**: Uses the proven SM-2 algorithm for optimal review scheduling
- **Card Images**: Add photos from your library to cards
- **3D Flip Animation**: Smooth card flip with proper state guards
- **Study Mode**: Review due cards with Again/Hard/Good/Easy ratings
- **iOS 16+ Support**: Works on iOS 16 and later

## Architecture

- **SwiftUI** for modern, declarative UI
- **Core Data** for local persistence (not UserDefaults - no 1MB limit)
- **FileManager** for image storage (images stored as files, not Base64 in Core Data)
- **SM-2 Algorithm** proper implementation (not homegrown intervals)

## File Structure

```
FlashcardsApp/
├── FlashcardApp.swift          # App entry point
├── Persistence.swift           # Core Data stack with iCloud backup exclusion
├── SM2Algorithm.swift          # Proper SM-2 SRS implementation
├── CardFlipView.swift          # 3D flip animation with state guards
├── DeckListView.swift          # Browse all decks
├── DeckDetailView.swift        # View deck contents
├── CardEditView.swift          # Add/edit cards with image support
├── StudyView.swift             # Study session with rating buttons
├── Info.plist                  # Privacy descriptions for photo access
└── FlashcardsModel.xcdatamodeld/  # Core Data model
```

## SM-2 Algorithm

The app implements the standard SM-2 spaced repetition algorithm:

- **Intervals**: 1 day → 6 days → then EF multiplier
- **Ease Factor**: Starts at 2.5, adjusts based on performance (min 1.3)
- **Ratings**:
  - **Again**: Reset repetitions, 1 minute interval
  - **Hard**: +20% interval boost, small EF decrease
  - **Good**: Standard interval
  - **Easy**: +30% interval, EF increase

## Setup Instructions

1. Open `FlashcardsApp.xcodeproj` in Xcode 15+
2. Select your target device (iOS 16+ required)
3. Build and run (⌘+R)

## Required Info.plist Entries

The app requires these privacy descriptions (already included):
- `NSPhotoLibraryUsageDescription` - For adding images to cards
- `NSCameraUsageDescription` - For taking photos

## Data Model

### Deck
- `id`: UUID
- `name`: String
- `createdAt`: Date
- `cards`: Relationship to Cards

### Card
- `id`: UUID
- `frontText`: String
- `backText`: String
- `imagePath`: String (filename, actual image stored in Documents)
- `createdAt`: Date
- `nextReviewDate`: Date
- `interval`: Double (days)
- `repetitions`: Int16
- `easeFactor`: Double
- `deck`: Relationship to Deck

## Performance Considerations

- Uses `@StateObject` and `@ObservedObject` for O(1) view updates
- Images stored in FileManager, not Core Data (better performance)
- Card flip animation uses proper `.animation` guards (no glitch loops)
- No `Timer` leaks (no scheduled timers in view lifecycle)

## License

Built for Rhodes AGI LLC
