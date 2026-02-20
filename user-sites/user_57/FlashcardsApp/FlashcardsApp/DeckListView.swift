import SwiftUI
import CoreData

struct DeckListView: View {
    @Environment(\.managedObjectContext) private var viewContext
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Deck.createdAt, ascending: false)],
        animation: .default
    ) private var decks: FetchedResults<Deck>
    
    @State private var showingAddDeck = false
    @State private var newDeckName = ""
    
    var body: some View {
        NavigationView {
            List {
                ForEach(decks) { deck in
                    NavigationLink(destination: DeckDetailView(deck: deck)) {
                        DeckRow(deck: deck)
                    }
                }
                .onDelete(perform: deleteDecks)
            }
            .navigationTitle("Flashcards")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddDeck = true }) {
                        Label("Add Deck", systemImage: "plus")
                    }
                }
            }
            .alert("New Deck", isPresented: $showingAddDeck) {
                TextField("Deck Name", text: $newDeckName)
                Button("Cancel", role: .cancel) { newDeckName = "" }
                Button("Create") {
                    createDeck()
                }
            } message: {
                Text("Enter a name for your new deck")
            }
        }
    }
    
    private func createDeck() {
        guard !newDeckName.isEmpty else { return }
        
        let deck = Deck(context: viewContext)
        deck.id = UUID()
        deck.name = newDeckName
        deck.createdAt = Date()
        
        PersistenceController.shared.save()
        newDeckName = ""
    }
    
    private func deleteDecks(offsets: IndexSet) {
        withAnimation {
            offsets.map { decks[$0] }.forEach(viewContext.delete)
            PersistenceController.shared.save()
        }
    }
}

struct DeckRow: View {
    @ObservedObject var deck: Deck
    
    var cardCount: Int {
        deck.cards?.count ?? 0
    }
    
    var dueCount: Int {
        guard let cards = deck.cards as? Set<Card> else { return 0 }
        let now = Date()
        return cards.filter { $0.nextReviewDate <= now }.count
    }
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(deck.name ?? "Untitled")
                    .font(.headline)
                Text("\(cardCount) cards")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if dueCount > 0 {
                ZStack {
                    Circle()
                        .fill(Color.red)
                        .frame(width: 28, height: 28)
                    Text("\(dueCount)")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
            }
        }
        .padding(.vertical, 4)
    }
}
