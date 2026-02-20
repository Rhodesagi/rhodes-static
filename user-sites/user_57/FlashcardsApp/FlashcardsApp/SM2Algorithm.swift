import Foundation

// SM-2 Spaced Repetition Algorithm
// Based on: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method

enum Rating: Int16, CaseIterable {
    case again = 1  // Complete blackout
    case hard = 2   // Incorrect response, remembered after seeing answer
    case good = 3   // Correct with difficulty
    case easy = 4   // Perfect response
    
    var label: String {
        switch self {
        case .again: return "Again"
        case .hard: return "Hard"
        case .good: return "Good"
        case .easy: return "Easy"
        }
    }
}

struct SM2Result {
    let newInterval: Double  // in days
    let newRepetitions: Int16
    let newEaseFactor: Double
    let nextReviewDate: Date
}

class SM2Algorithm {
    static let shared = SM2Algorithm()
    
    private let minutesInDay: Double = 24 * 60
    
    func calculate(
        rating: Rating,
        previousInterval: Double,
        previousRepetitions: Int16,
        previousEaseFactor: Double
    ) -> SM2Result {
        var newInterval: Double
        var newRepetitions: Int16
        var newEaseFactor: Double
        
        // Calculate new ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        // where q is rating (1-5 scale, we use 1-4, so we map: 1->1, 2->2, 3->3, 4->5)
        let quality = rating == .easy ? 5 : Int(rating.rawValue)
        let q = Double(quality)
        
        newEaseFactor = previousEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        
        // EF minimum is 1.3
        if newEaseFactor < 1.3 {
            newEaseFactor = 1.3
        }
        
        if rating == .again {
            // Reset repetitions, interval = 1 minute (immediate retry)
            newRepetitions = 0
            newInterval = 1.0 / minutesInDay  // 1 minute in days
        } else {
            newRepetitions = previousRepetitions + 1
            
            if newRepetitions == 1 {
                newInterval = 1  // 1 day
            } else if newRepetitions == 2 {
                newInterval = 6  // 6 days
            } else {
                newInterval = previousInterval * newEaseFactor
            }
            
            // Adjust for hard/easy
            switch rating {
            case .hard:
                newInterval = newInterval * 1.2  // 20% boost for getting it right
            case .easy:
                newInterval = newInterval * 1.3  // Easy = longer interval
            default:
                break
            }
        }
        
        // Cap at 365 days for sanity
        newInterval = min(newInterval, 365)
        
        let nextReviewDate = Date().addingTimeInterval(newInterval * 24 * 60 * 60)
        
        return SM2Result(
            newInterval: newInterval,
            newRepetitions: newRepetitions,
            newEaseFactor: newEaseFactor,
            nextReviewDate: nextReviewDate
        )
    }
    
    func intervalString(days: Double) -> String {
        if days < 1.0 / 24 {
            return "< 1h"
        } else if days < 1 {
            let hours = Int(days * 24)
            return "\(hours)h"
        } else if days < 30 {
            return "\(Int(days))d"
        } else if days < 365 {
            let months = Int(days / 30)
            return "\(months)mo"
        } else {
            return "1y+"
        }
    }
}
