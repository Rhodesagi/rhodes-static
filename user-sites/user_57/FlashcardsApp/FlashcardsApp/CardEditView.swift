import SwiftUI

struct CardEditView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss
    
    let deck: Deck
    var card: Card?  // nil = new card
    
    @State private var frontText = ""
    @State private var backText = ""
    @State private var selectedImage: UIImage?
    @State private var showingImagePicker = false
    
    init(deck: Deck, card: Card? = nil) {
        self.deck = deck
        self.card = card
        if let card = card {
            _frontText = State(initialValue: card.frontText ?? "")
            _backText = State(initialValue: card.backText ?? "")
            if let imagePath = card.imagePath {
                _selectedImage = State(initialValue: loadImage(from: imagePath))
            }
        }
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Front")) {
                    TextEditor(text: $frontText)
                        .frame(minHeight: 100)
                    
                    if let image = selectedImage {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFit()
                            .frame(maxHeight: 200)
                            .cornerRadius(8)
                        
                        Button("Remove Image", role: .destructive) {
                            selectedImage = nil
                        }
                    } else {
                        Button("Add Image") {
                            showingImagePicker = true
                        }
                    }
                }
                
                Section(header: Text("Back")) {
                    TextEditor(text: $backText)
                        .frame(minHeight: 100)
                }
            }
            .navigationTitle(card == nil ? "New Card" : "Edit Card")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveCard()
                    }
                    .disabled(frontText.isEmpty || backText.isEmpty)
                }
            }
            .sheet(isPresented: $showingImagePicker) {
                ImagePicker(image: $selectedImage)
            }
        }
    }
    
    private func saveCard() {
        let cardToSave: Card
        if let existingCard = card {
            cardToSave = existingCard
        } else {
            cardToSave = Card(context: viewContext)
            cardToSave.id = UUID()
            cardToSave.createdAt = Date()
            cardToSave.deck = deck
            cardToSave.nextReviewDate = Date()
            cardToSave.interval = 0
            cardToSave.repetitions = 0
            cardToSave.easeFactor = 2.5
        }
        
        cardToSave.frontText = frontText
        cardToSave.backText = backText
        
        // Save image if present
        if let image = selectedImage {
            let filename = "\(cardToSave.id?.uuidString ?? UUID().uuidString).jpg"
            if saveImage(image, filename: filename) {
                // Delete old image if updating
                if let oldPath = cardToSave.imagePath {
                    deleteImage(at: oldPath)
                }
                cardToSave.imagePath = filename
            }
        } else if cardToSave.imagePath != nil {
            // Image was removed
            deleteImage(at: cardToSave.imagePath!)
            cardToSave.imagePath = nil
        }
        
        PersistenceController.shared.save()
        dismiss()
    }
    
    private func saveImage(_ image: UIImage, filename: String) -> Bool {
        guard let data = image.jpegData(compressionQuality: 0.8) else { return false }
        guard let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?
            .appendingPathComponent(filename) else { return false }
        
        do {
            try data.write(to: url)
            return true
        } catch {
            print("Error saving image: \(error)")
            return false
        }
    }
    
    private func deleteImage(at path: String) {
        guard let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?
            .appendingPathComponent(path) else { return }
        try? FileManager.default.removeItem(at: url)
    }
}

private func loadImage(from path: String) -> UIImage? {
    guard let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?
        .appendingPathComponent(path) else { return nil }
    return UIImage(contentsOfFile: url.path)
}

// Simple image picker wrapper
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    @Environment(\.dismiss) private var dismiss
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .photoLibrary
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let uiImage = info[.originalImage] as? UIImage {
                parent.image = uiImage
            }
            parent.dismiss()
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}
