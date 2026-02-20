import SwiftUI
import CoreData

@main
struct FlashcardsApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            DeckListView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
