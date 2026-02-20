import SwiftUI
import CoreData

struct DeckDetailView: View {
    @ObservedObject var deck: Deck
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.presentationMode) var presentationMode
    
    @State private var showingAddCard = false
    @State private var showingStudy = false
    
    var cards: [Card] {
        guard let deckCards = deck.cards as? Set<Card> else { return [] }
        return Array(deckCards).sorted { $0.createdAt < $1.createdAt }
    }
    
    var dueCards: [Card] {
        let now = Date()
        return cards.filter { $0.nextReviewDate <= now }
    }
    
    var body: some View {
        List {
            Section {
                if dueCards.count > 0 {
                    Button(action: { showingStudy = true }) {
                        HStack {
                            Image(systemName: "play.circle.fill")
                                .font(.title2)
                                .foregroundColor(.green)
                            VStack(alignment: .leading) {
                                Text("Study Now")
                                    .font(.headline)
                                Text("\(dueCards.count) cards due")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(.gray)
                        }
                    }
                } else {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.title2)
                            .foregroundColor(.gray)
                        VStack(alignment: .leading) {
                            Text("All Caught Up!")
                                .font(.headline)
                                .foregroundColor(.secondary)
                            Text("No cards due for review")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            
            Section(header: Text("Cards (\(cards.count))")) {
                ForEach(cards) { card in
                    CardRow(card: card)
                }
                .onDelete(perform: deleteCards)
                
                Button(action: { showingAddCard = true }) {
                    Label("Add Card", systemImage: "plus")
                }
            }
        }
        .navigationTitle(deck.name ?? "Deck")
        .sheet(isPresented: $showingAddCard) {
            CardEditView(deck: deck)
        }
        .sheet(isPresented: $showingStudy) {
            StudyView(deck: deck)
        }
    }
    
    private func deleteCards(offsets: IndexSet) {
        withAnimation {
            offsets.map { cards[$0] }.forEach(viewContext.delete)
            PersistenceController.shared.save()
        }
    }
}

struct CardRow: View {
    @ObservedObject var card: Card
    
    var isDue: Bool {
        card.nextReviewDate <= Date()
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(card.frontText ?? "")
                .font(.body)
                .lineLimit(2)
            HStack {
                Text("Interval: \(SM2Algorithm.shared.intervalString(days: card.interval))")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                if isDue {
                    Text("Due")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.red)
                } else {
                    Text("Due: \(card.nextReviewDate, style: .date)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 2)
    }
}
