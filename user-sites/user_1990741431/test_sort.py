from typing import List

def sort_numbers(numbers: str) -> str:
    """ Input is a space-delimited string of numberals from 'zero' to 'nine'.
    Valid choices are 'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight' and 'nine'.
    Return the string with numbers sorted from smallest to largest
    >>> sort_numbers('three one five')
    'one three five'
    """
    words = numbers.split()
    mapping = {
        'zero': 0,
        'one': 1,
        'two': 2,
        'three': 3,
        'four': 4,
        'five': 5,
        'six': 6,
        'seven': 7,
        'eight': 8,
        'nine': 9
    }
    # Convert to numbers, sort, convert back
    sorted_words = sorted(words, key=lambda w: mapping[w])
    return ' '.join(sorted_words)

if __name__ == "__main__":
    # Run doctest
    import doctest
    doctest.testmod(verbose=True)
    # Additional tests
    print("Test 1:", sort_numbers('three one five') == 'one three five')
    print("Test 2:", sort_numbers('nine zero two') == 'zero two nine')
    print("Test 3:", sort_numbers('six four eight') == 'four six eight')
    print("Test 4:", sort_numbers('seven') == 'seven')
    print("Test 5:", sort_numbers('') == '')
