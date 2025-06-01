# Flask Material3 Project

A Flask web application with Material3 UI design, dark theme, and Google Sheets integration.

## Features

- **Material3 Design System**: Modern UI with dark theme and burnt orange primary color
- **Google Sheets Integration**: Use Google Sheets as your database
- **Responsive Design**: Mobile-first approach with Material3 components
- **MOHAVE Font**: Custom typography for professional look

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Google Sheets Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API and Google Drive API
4. Create service account credentials
5. Download the JSON credentials file
6. Share your Google Sheet with the service account email

### 3. Environment Configuration

1. Copy `.env.example` to `.env`
2. Update the environment variables:
   ```
   GOOGLE_SHEETS_CREDENTIALS_FILE=path/to/your/credentials.json
   GOOGLE_SHEET_ID=your_google_sheet_id
   ```

### 4. Run the Application

```bash
python app.py
```

The application will be available at `http://localhost:5000`

## Project Structure

```
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
├── README.md             # This file
├── services/
│   └── sheets_service.py # Google Sheets integration
├── static/
│   └── css/
│       └── style.css     # Material3 design styles
└── templates/
    └── index.html        # Main template
```

## Design Features

- **Dark Theme**: Material3 dark color scheme
- **Primary Color**: Burnt orange (#FF8C42)
- **Typography**: MOHAVE Google Font
- **Components**: Material3 floating action button
- **Animations**: Smooth fade-in effects

## Usage

The current implementation shows a hero section with the message "BREAKING PROBLEMS AND ENGINEERING SOLUTIONS TO EMPOWER HUMANITY". You can extend this by:

1. Adding more routes in `app.py`
2. Creating additional templates
3. Using the `SheetsService` class for data operations
4. Adding more Material3 components in CSS 