import json


def parse_json_file(filepath):
    """
    Parse JSON data from a file.
    
    Args:
        filepath: Path to the JSON file
        
    Returns:
        The parsed Python object (dict, list, etc.)
        
    Raises:
        FileNotFoundError: If the file doesn't exist
        json.JSONDecodeError: If the file contains invalid JSON
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


# Example usage
if __name__ == "__main__":
    # Example: data = parse_json_file('data.json')
    # print(data)
    pass
