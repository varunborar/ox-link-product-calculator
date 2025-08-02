import json
import csv
import sys
import os

def json_to_csv(json_file, csv_file):
    with open(json_file, 'r') as f:
        data = json.load(f)
    fieldnames = ['id', 'name', 'rate']
    with open(csv_file, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for item in data:
            writer.writerow({k: item.get(k, '') for k in fieldnames})
    print(f"Converted {json_file} to {csv_file}")

def csv_to_json(csv_file, json_file):
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        data = [dict(row) for row in reader]
    # Convert rate to number if possible
    for item in data:
        if 'rate' in item:
            try:
                item['rate'] = float(item['rate'])
            except Exception:
                pass
    with open(json_file, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Converted {csv_file} to {json_file}")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python convert_raw_material_rates.py [to_csv|to_json] <input_file> [output_file]")
        sys.exit(1)
    op = sys.argv[1]
    input_file = sys.argv[2]
    output_file = sys.argv[3] if len(sys.argv) > 3 else (
        os.path.splitext(input_file)[0] + ('.csv' if op == 'to_csv' else '.json')
    )
    if op == 'to_csv':
        json_to_csv(input_file, output_file)
    elif op == 'to_json':
        csv_to_json(input_file, output_file)
    else:
        print("Unknown operation. Use 'to_csv' or 'to_json'.")
