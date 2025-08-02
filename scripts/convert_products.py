import json
import csv
import sys
import os

def json_to_csv(json_file, csv_file):
    with open(json_file, 'r') as f:
        products = json.load(f)

    # Collect all possible top-level fields except deprecated ones
    deprecated_fields = {'ratio', 'cal', 'percent_change', 'net_rate'}
    top_fields = set()
    raw_material_keys = set()
    wastage_keys = set()
    add_cost_keys = set()
    manuf_cost_keys = set()
    for p in products:
        top_fields.update([k for k in p.keys() if k not in ('rawMaterials', 'wastage', 'additonalCosting', 'manufacturingCost') and k not in deprecated_fields])
        if 'rawMaterials' in p:
            raw_material_keys.update(p['rawMaterials'].keys())
        if 'wastage' in p:
            wastage_keys.update(p['wastage'].keys())
        if 'additonalCosting' in p:
            add_cost_keys.update(p['additonalCosting'].keys())
        if 'manufacturingCost' in p:
            manuf_cost_keys.update(p['manufacturingCost'].keys())

    fieldnames = list(sorted(top_fields))
    # Add dynamic fields
    fieldnames += [f'raw_{k}' for k in sorted(raw_material_keys)]
    fieldnames += [f'wastage_{k}' for k in sorted(wastage_keys)]
    fieldnames += [f'addcost_{k}' for k in sorted(add_cost_keys)]
    fieldnames += [f'manufcost_{k}' for k in sorted(manuf_cost_keys)]

    with open(csv_file, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for p in products:
            row = {k: p.get(k, '') for k in top_fields}
            # Flatten rawMaterials
            for k in raw_material_keys:
                row[f'raw_{k}'] = p.get('rawMaterials', {}).get(k, {}).get('usage', '')
            for k in wastage_keys:
                row[f'wastage_{k}'] = p.get('wastage', {}).get(k, '')
            for k in add_cost_keys:
                row[f'addcost_{k}'] = p.get('additonalCosting', {}).get(k, '')
            for k in manuf_cost_keys:
                row[f'manufcost_{k}'] = p.get('manufacturingCost', {}).get(k, '')
            writer.writerow(row)
    print(f"Converted {json_file} to {csv_file}")

def csv_to_json(csv_file, json_file):
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        products = []
        for row in reader:
            # Only use fields that are present in the row and not deprecated
            deprecated_fields = {'ratio', 'cal', 'percent_change', 'net_rate'}
            p = {k: row[k] for k in row if k and not (k.startswith('raw_') or k.startswith('wastage_') or k.startswith('addcost_') or k.startswith('manufcost_')) and k not in deprecated_fields and row[k]}
            # If packingSize is present, parse as JSON
            if 'packingSize' in p and p['packingSize']:
                try:
                    p['packingSize'] = json.loads(p['packingSize'])
                except Exception as e:
                    print(f"Warning: Could not parse packingSize as JSON for row with id={p.get('id', '')}: {e}")
            # Reconstruct nested fields
            rawMaterials = {}
            wastage = {}
            additonalCosting = {}
            manufacturingCost = {}
            for k, v in row.items():
                if k.startswith('raw_') and v:
                    rawMaterials[k[4:]] = {'usage': v, 'unit': 'kg'}
                elif k.startswith('wastage_') and v:
                    wastage[k[8:]] = v
                elif k.startswith('addcost_') and v:
                    additonalCosting[k[8:]] = v
                elif k.startswith('manufcost_') and v:
                    manufacturingCost[k[10:]] = v
            if rawMaterials:
                p['rawMaterials'] = rawMaterials
            if wastage:
                p['wastage'] = wastage
            if additonalCosting:
                p['additonalCosting'] = additonalCosting
            if manufacturingCost:
                p['manufacturingCost'] = manufacturingCost
            products.append(p)
    with open(json_file, 'w') as f:
        json.dump(products, f, indent=2)
    print(f"Converted {csv_file} to {json_file}")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python convert_products.py [to_csv|to_json] <input_file> [output_file]")
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
