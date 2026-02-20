import SwiftUI
import CoreData

struct StudyView: View {
    @ObservedObject var deck: Deck
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss
    
    @State private var currentCardIndex = 0
    @State private var showingAnswer = false
    @State private var cardsToStudy: [Card] = []
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Progress bar
                ProgressView(value: Double(currentCardIndex), total: Double(max(cardsToStudy.count, 1)))
                    .padding()
                
                Text("\(currentCardIndex + 1) / \(cardsToStudy.count)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.bottom)
                
                if currentCardIndex < cardsToStudy.count {
                    let card = cardsToStudy[currentCardIndex]
                    
                    CardFlipView(
                        frontText: card.frontText ?? "",
                        backText: card.backText ?? "",
                        imagePath: card.imagePath
                    )
                    .padding(.horizontal)
                    
                    if showingAnswer {
                        // Rating buttons
                        HStack(spacing: 12) {
                            ForEach(Rating.allCases, id: \.self) { rating in
                                RatingButton(rating: rating) {
                                    rateCard(card, rating: rating)
                                }
                            }
                        }
                        .padding()
                    } else {
                        Button("Show Answer") {
                            withAnimation {
                                showingAnswer = true
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .padding()
                    }
                } else {
                    // Session complete
                    VStack(spacing: 20) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 80))
                            .foregroundColor(.green)
                        
                        Text("Session Complete!")
                            .font(.title)
                            .fontWeight(.bold)
                        
                        Text("You've reviewed all due cards.")
                            .foregroundColor(.secondary)
                        
                        Button("Done") {
                            dismiss()
                        }
                        .buttonStyle(.borderedProminent)
                        .padding(.top)
                    }
                    .padding()
                }
                
                Spacer()
            }
            .navigationTitle("Studying \(deck.name ?? "")")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") {
                        dismiss()
                    }
                }
            }
            .onAppear {
                loadDueCards()
            }
        }
    }
    
    private func loadDueCards() {
        guard let allCards = deck.cards as? Set<Card> else {
            cardsToStudy = []
            return
        }
        
        let now = Date()
        cardsToStudy = allCards
            .filter { $0.nextReviewDate <= now }
            .sorted { $0.nextReviewDate < $1.nextReviewDate }
        
        currentCardIndex = 0
        showingAnswer = false
    }
    
    private func rateCard(_ card: Card, rating: Rating) {
        let result = SM2Algorithm.shared.calculate(
            rating: rating,
            previousInterval: card.interval,
            previousRepetitions: card.repetitions,
            previousEaseFactor: card.easeFactor
        )
        
        card.interval = result.newInterval
        card.repetitions = result.newRepetitions
        card.easeFactor = result.newEaseFactor
        card.nextReviewDate = result.nextReviewDate
        
        PersistenceController.shared.save()
        
        // Move to next card
        withAnimation {
            showingAnswer = false
            currentCardIndex += 1
        }
    }
}

struct RatingButton: View {
    let rating: Rating
    let action: () -> Void
    
    var backgroundColor: Color {
        switch rating {
        case .again: return .red
        case .hard: return .orange
        case .good: return .blue
        case .easy: return .green
        }
    }
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Text(rating.label)
                    .font(.caption)
                    .fontWeight(.bold)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(backgroundColor)
            .foregroundColor(.white)
            .cornerRadius(8)
        }
    }
}
