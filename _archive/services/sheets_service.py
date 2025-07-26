import gspread
from google.oauth2.service_account import Credentials
import os
from dotenv import load_dotenv

load_dotenv()

class SheetsService:
    def __init__(self):
        self.credentials_file = os.getenv('GOOGLE_SHEETS_CREDENTIALS_FILE')
        self.sheet_id = os.getenv('GOOGLE_SHEET_ID')
        self.client = None
        self.worksheet = None
        
    def authenticate(self):
        """Authenticate with Google Sheets API"""
        if not self.credentials_file:
            raise ValueError("GOOGLE_SHEETS_CREDENTIALS_FILE not set in environment")
            
        scope = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
        ]
        
        credentials = Credentials.from_service_account_file(
            self.credentials_file, scopes=scope
        )
        self.client = gspread.authorize(credentials)
        
    def get_worksheet(self, worksheet_name="Sheet1"):
        """Get or create worksheet"""
        if not self.client:
            self.authenticate()
            
        if not self.sheet_id:
            raise ValueError("GOOGLE_SHEET_ID not set in environment")
            
        try:
            spreadsheet = self.client.open_by_key(self.sheet_id)
            self.worksheet = spreadsheet.worksheet(worksheet_name)
        except gspread.WorksheetNotFound:
            spreadsheet = self.client.open_by_key(self.sheet_id)
            self.worksheet = spreadsheet.add_worksheet(
                title=worksheet_name, rows=1000, cols=20
            )
        
        return self.worksheet
    
    def read_data(self, worksheet_name="Sheet1"):
        """Read all data from worksheet"""
        worksheet = self.get_worksheet(worksheet_name)
        return worksheet.get_all_records()
    
    def append_data(self, data, worksheet_name="Sheet1"):
        """Append data to worksheet"""
        worksheet = self.get_worksheet(worksheet_name)
        worksheet.append_row(data)
        
    def update_cell(self, row, col, value, worksheet_name="Sheet1"):
        """Update specific cell"""
        worksheet = self.get_worksheet(worksheet_name)
        worksheet.update_cell(row, col, value) 