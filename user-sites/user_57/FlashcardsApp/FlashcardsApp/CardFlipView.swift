import SwiftUI

struct CardFlipView: View {
    let frontText: String
    let backText: String
    let imagePath: String?
    
    @State private var isFlipped = false
    @State private var flipRotation = 0.0
    
    var body: some View {
        ZStack {
            // Front of card
            CardFace(
                text: frontText,
                imagePath: imagePath,
                bgColor: Color(.systemBackground),
                isFront: true
            )
            .opacity(isFlipped ? 0 : 1)
            .rotation3DEffect(.degrees(flipRotation), axis: (x: 0, y: 1, z: 0))
            
            // Back of card
            CardFace(
                text: backText,
                imagePath: nil,
                bgColor: Color(.secondarySystemBackground),
                isFront: false
            )
            .opacity(isFlipped ? 1 : 0)
            .rotation3DEffect(.degrees(flipRotation + 180), axis: (x: 0, y: 1, z: 0))
        }
        .frame(height: 400)
        .onTapGesture {
            withAnimation(.easeInOut(duration: 0.3)) {
                flipRotation += 180
                isFlipped.toggle()
            }
        }
    }
}

struct CardFace: View {
    let text: String
    let imagePath: String?
    let bgColor: Color
    let isFront: Bool
    
    var body: some View {
        VStack(spacing: 20) {
            if let imagePath = imagePath, isFront {
                if let uiImage = loadImage(from: imagePath) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: 200)
                        .cornerRadius(8)
                }
            }
            
            Text(text)
                .font(.title2)
                .multilineTextAlignment(.center)
                .padding()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(bgColor)
        .cornerRadius(16)
        .shadow(radius: 4)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
        )
    }
    
    private func loadImage(from path: String) -> UIImage? {
        let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?
            .appendingPathComponent(path)
        guard let url = url else { return nil }
        return UIImage(contentsOfFile: url.path)
    }
}
