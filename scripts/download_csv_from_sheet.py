import os
import json
import pandas as pd
from google.oauth2 import service_account
from googleapiclient.discovery import build

def download_sheet(sheet_id, gid, output_csv):
    # Load service account credentials directly from environment variable
    credentials_env = os.environ.get("GOOGLE_SHEETS_CREDENTIALS_JSON")
    if not credentials_env:
        raise EnvironmentError("GOOGLE_SHEETS_CREDENTIALS_JSON is not set")

    try:
        credentials_info = json.loads(credentials_env)
    except json.JSONDecodeError as e:
        raise ValueError("Invalid JSON in GOOGLE_SHEETS_CREDENTIALS_JSON") from e

    SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
    credentials = service_account.Credentials.from_service_account_info(
        credentials_info, scopes=SCOPES)
    service = build('sheets', 'v4', credentials=credentials)

    # Map GID to sheet title
    metadata = service.spreadsheets().get(spreadsheetId=sheet_id).execute()
    sheets = metadata.get("sheets", [])
    sheet_title = None
    for s in sheets:
        if str(s["properties"]["sheetId"]) == str(gid):
            sheet_title = s["properties"]["title"]
            break

    if not sheet_title:
        raise Exception(f"GID {gid} not found in spreadsheet")

    print(f"Using sheet tab: {sheet_title}")

    result = service.spreadsheets().values().get(
        spreadsheetId=sheet_id,
        range=sheet_title
    ).execute()

    values = result.get("values", [])
    if not values:
        raise Exception("No data found in the sheet")

    df = pd.DataFrame(values[1:], columns=values[0])
    df.to_csv(output_csv, index=False)
    print(f"Saved data to {output_csv}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--sheet-id", required=True)
    parser.add_argument("--gid", required=True)
    parser.add_argument("--output", default="sheet.csv")
    args = parser.parse_args()

    download_sheet(args.sheet_id, args.gid, args.output)
