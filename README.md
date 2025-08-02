
## Product JSON/CSV Conversion Script

You can convert between `products.json` and `products.csv` using the provided Python script:

### Convert JSON to CSV
```bash
python scripts/convert_products.py to_csv path/to/products.json path/to/products.csv
```

### Convert CSV to JSON
```bash
python scripts/convert_products.py to_json path/to/products.csv path/to/products.json
```

- If you omit the output file, it will use the same name as the input file but with the other extension.
- The script will flatten and reconstruct nested fields like rawMaterials, wastage, additonalCosting, and manufacturingCost automatically.
