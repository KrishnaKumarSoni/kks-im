import resend
import os
from datetime import datetime
import sqlite3
import hashlib
import secrets
from flask import url_for
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.resend = resend
        # Set API key from environment
        resend.api_key = os.getenv("RESEND_API_KEY", "re_72Nr7Z4n_BtyL4XF7yAxkU9faGg2jr2gW")
        self.sender_email = "krishna@kks.im"
        self.sender_name = "KKS Team"
        self.serverless_mode = bool(os.getenv('VERCEL'))
        try:
            self.init_database()
        except Exception as e:
            logger.warning(f"Database initialization failed, running in serverless mode: {str(e)}")
            self.serverless_mode = True

    def init_database(self):
        """Initialize the subscription database"""
        try:
            # Use in-memory database for serverless environments
            if os.getenv('VERCEL'):
                db_path = ':memory:'
            else:
                db_path = 'subscribers.db'
            
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
        
        # Create subscribers table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS subscribers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                unsubscribe_token TEXT UNIQUE,
                preferences TEXT DEFAULT '{"board_posts": true, "ideas": true}'
            )
        ''')
        
        # Create email_logs table for tracking sent emails
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS email_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                subject TEXT NOT NULL,
                email_type TEXT NOT NULL,
                content_id TEXT,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resend_id TEXT
            )
        ''')
        
            conn.commit()
            conn.close()
            logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Database initialization failed: {str(e)}")

    def get_db_connection(self):
        """Get database connection (serverless-friendly)"""
        try:
            if os.getenv('VERCEL'):
                return sqlite3.connect(':memory:')
            else:
                return sqlite3.connect('subscribers.db')
        except Exception as e:
            logger.error(f"Database connection failed: {str(e)}")
            return sqlite3.connect(':memory:')  # Fallback to in-memory

    def subscribe_email(self, email):
        """Subscribe an email address"""
        try:
            # Generate unique unsubscribe token
            unsubscribe_token = secrets.token_urlsafe(32)
            
            if not self.serverless_mode:
                try:
                    conn = self.get_db_connection()
                    cursor = conn.cursor()
                    
                    cursor.execute('''
                        INSERT INTO subscribers (email, unsubscribe_token) 
                        VALUES (?, ?)
                    ''', (email, unsubscribe_token))
                    
                    conn.commit()
                    conn.close()
                except sqlite3.IntegrityError:
                    return {"success": False, "message": "Email already subscribed"}
                except Exception as db_error:
                    logger.warning(f"Database error, continuing without storage: {str(db_error)}")
            
            # Send welcome email
            self.send_welcome_email(email, unsubscribe_token)
            
            logger.info(f"Successfully subscribed: {email}")
            return {"success": True, "message": "Successfully subscribed to KKS notifications"}
            
        except Exception as e:
            logger.error(f"Subscription error: {str(e)}")
            return {"success": False, "message": "Failed to subscribe. Please try again."}

    def unsubscribe_email(self, token):
        """Unsubscribe using token"""
        try:
            conn = sqlite3.connect('subscribers.db')
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE subscribers 
                SET is_active = FALSE 
                WHERE unsubscribe_token = ? AND is_active = TRUE
            ''', (token,))
            
            if cursor.rowcount > 0:
                conn.commit()
                conn.close()
                return {"success": True, "message": "Successfully unsubscribed"}
            else:
                conn.close()
                return {"success": False, "message": "Invalid or already used unsubscribe link"}
                
        except Exception as e:
            logger.error(f"Unsubscribe error: {str(e)}")
            return {"success": False, "message": "Failed to unsubscribe"}

    def get_active_subscribers(self):
        """Get all active subscribers"""
        if self.serverless_mode:
            logger.info("Running in serverless mode, no active subscribers stored")
            return []
        
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT email, unsubscribe_token FROM subscribers 
                WHERE is_active = TRUE
            ''')
            
            subscribers = cursor.fetchall()
            conn.close()
            
            return subscribers
        except Exception as e:
            logger.warning(f"Failed to get subscribers: {str(e)}")
            return []

    def create_cyberpunk_email_template(self, title, content, unsubscribe_token, email_type="notification"):
        """Create HTML email template with cyberpunk design"""
        unsubscribe_url = f"https://www.kks.im/unsubscribe?token={unsubscribe_token}"
        
        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{title}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&family=Mohave:wght@300;400;500&display=swap');
                
                :root {{
                    --cyber-dark: #03000E;
                    --cyber-surface: #1C1B1F;
                    --cyber-primary: #FF8C42;
                    --cyber-accent: #00FFFF;
                    --cyber-neon-green: #39FF14;
                    --cyber-text: #E6E1E5;
                    --cyber-text-dim: #CAC4CF;
                    --cyber-border: rgba(255, 140, 66, 0.3);
                }}
                
                * {{
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }}
                
                body {{
                    font-family: 'Mohave', sans-serif;
                    background-color: var(--cyber-dark);
                    color: var(--cyber-text);
                    line-height: 1.6;
                    padding: 20px 0;
                }}
                
                .email-container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background: linear-gradient(135deg, var(--cyber-surface) 0%, #2D1B0F 100%);
                    border: 1px solid var(--cyber-border);
                    border-radius: 12px;
                    overflow: hidden;
                    position: relative;
                }}
                
                .email-container::before {{
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                        transparent 50%, 
                        rgba(245, 222, 44, 0.02) 50%
                    );
                    background-size: 100% 3px;
                    pointer-events: none;
                    animation: scanlines 2s linear infinite;
                }}
                
                @keyframes scanlines {{
                    0% {{ background-position: 0 0; }}
                    100% {{ background-position: 0 3px; }}
                }}
                
                .header {{
                    background: linear-gradient(90deg, var(--cyber-primary), #CC5500);
                    padding: 30px 20px;
                    text-align: center;
                    position: relative;
                    z-index: 2;
                }}
                
                .logo {{
                    font-family: 'Orbitron', monospace;
                    font-size: 32px;
                    font-weight: 700;
                    color: #000;
                    margin-bottom: 8px;
                    text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
                }}
                
                .tagline {{
                    font-size: 14px;
                    color: rgba(0, 0, 0, 0.8);
                    font-weight: 300;
                    letter-spacing: 1px;
                }}
                
                .content {{
                    padding: 40px 30px;
                    position: relative;
                    z-index: 2;
                }}
                
                .title {{
                    font-family: 'Orbitron', monospace;
                    font-size: 24px;
                    font-weight: 600;
                    color: var(--cyber-accent);
                    margin-bottom: 20px;
                    text-align: center;
                    text-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
                }}
                
                .message {{
                    font-size: 16px;
                    color: var(--cyber-text);
                    margin-bottom: 30px;
                    text-align: left;
                }}
                
                .cta-button {{
                    display: inline-block;
                    background: linear-gradient(45deg, var(--cyber-primary), #CC5500);
                    color: #000;
                    padding: 16px 32px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    margin: 20px auto;
                    display: block;
                    text-align: center;
                    width: fit-content;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                }}
                
                .cta-button:hover {{
                    background: transparent;
                    border-color: var(--cyber-primary);
                    color: var(--cyber-primary);
                    box-shadow: 0 0 20px rgba(255, 140, 66, 0.4);
                }}
                
                .divider {{
                    height: 1px;
                    background: linear-gradient(90deg, transparent, var(--cyber-border), transparent);
                    margin: 30px 0;
                }}
                
                .footer {{
                    background: #0F0D13;
                    padding: 25px 30px;
                    text-align: center;
                    border-top: 1px solid var(--cyber-border);
                    position: relative;
                    z-index: 2;
                }}
                
                .footer-text {{
                    font-size: 14px;
                    color: var(--cyber-text-dim);
                    margin-bottom: 15px;
                }}
                
                .unsubscribe {{
                    font-size: 12px;
                    color: var(--cyber-text-dim);
                }}
                
                .unsubscribe a {{
                    color: var(--cyber-primary);
                    text-decoration: none;
                }}
                
                .unsubscribe a:hover {{
                    color: var(--cyber-accent);
                    text-shadow: 0 0 10px rgba(0, 255, 255, 0.6);
                }}
                
                .cyber-accent {{
                    color: var(--cyber-accent);
                    text-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
                }}
                
                .cyber-green {{
                    color: var(--cyber-neon-green);
                    text-shadow: 0 0 10px rgba(57, 255, 20, 0.4);
                }}
                
                @media (max-width: 600px) {{
                    .email-container {{
                        margin: 0 10px;
                    }}
                    
                    .content {{
                        padding: 30px 20px;
                    }}
                    
                    .title {{
                        font-size: 20px;
                    }}
                    
                    .logo {{
                        font-size: 28px;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <div class="logo">KKS</div>
                    <div class="tagline">BREAKING PROBLEMS • ENGINEERING SOLUTIONS</div>
                </div>
                
                <div class="content">
                    <div class="title">{title}</div>
                    <div class="message">
                        {content}
                    </div>
                </div>
                
                <div class="footer">
                    <div class="footer-text">
                        <span class="cyber-accent">KKS</span> - Empowering humanity through innovation
                    </div>
                    <div class="unsubscribe">
                        Don't want these updates? <a href="{unsubscribe_url}">Unsubscribe</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

    def send_welcome_email(self, email, unsubscribe_token):
        """Send welcome email to new subscriber"""
        subject = "🚀 Welcome to KKS Notifications - Breaking Problems, Engineering Solutions"
        
        content = """
        <p>Welcome to the <span class="cyber-accent">KKS community</span>! 🎯</p>
        
        <p>You're now subscribed to receive notifications about:</p>
        <ul style="color: #E6E1E5; margin: 20px 0; padding-left: 20px;">
            <li><span class="cyber-green">🛠️ New Engineering Board Posts</span> - Technical insights and solutions</li>
            <li><span class="cyber-green">💡 Fresh Startup Ideas</span> - Innovation concepts and breakthrough thinking</li>
        </ul>
        
        <p>Our team shares cutting-edge technical discussions, engineering challenges, and innovative startup concepts that are changing how we solve problems and build the future.</p>
        
        <p>Get ready to dive into the world of <span class="cyber-accent">cyberpunk innovation</span> where technology meets human empowerment! ⚡</p>
        """
        
        try:
            html_content = self.create_cyberpunk_email_template(
                "Welcome to KKS Notifications", 
                content, 
                unsubscribe_token,
                "welcome"
            )
            
            result = resend.Emails.send({
                "from": f"{self.sender_name} <{self.sender_email}>",
                "to": [email],
                "subject": subject,
                "html": html_content
            })
            
            # Log the sent email
            self.log_email(email, subject, "welcome", None, result.get('id'))
            
            logger.info(f"Welcome email sent to {email}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to send welcome email to {email}: {str(e)}")
            raise

    def send_board_post_notification(self, post_title, post_content, post_id, post_author):
        """Send notification for new board post"""
        subscribers = self.get_active_subscribers()
        
        if not subscribers:
            logger.info("No active subscribers for board post notification")
            return
        
        subject = f"🛠️ New Engineering Insight: {post_title}"
        post_url = f"https://www.kks.im/board/post/{post_id}"
        
        content = f"""
        <p>A new engineering insight has been shared on the <span class="cyber-accent">KKS Engineering Board</span>! 🚀</p>
        
        <div style="background: rgba(255, 140, 66, 0.1); border-left: 4px solid #FF8C42; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <h3 style="color: #00FFFF; margin-bottom: 15px; font-family: 'Orbitron', monospace;">{post_title}</h3>
            <p style="color: #E6E1E5; margin-bottom: 15px;">{post_content[:200]}{'...' if len(post_content) > 200 else ''}</p>
            <p style="color: #39FF14; font-size: 14px; margin: 0;">By: <span class="cyber-accent">{post_author}</span></p>
        </div>
        
        <a href="{post_url}" class="cta-button">Read Full Post</a>
        
        <p>Join the discussion and share your engineering insights! 💬</p>
        """
        
        sent_count = 0
        for email, unsubscribe_token in subscribers:
            try:
                html_content = self.create_cyberpunk_email_template(
                    f"New Engineering Post: {post_title}",
                    content,
                    unsubscribe_token,
                    "board_post"
                )
                
                result = resend.Emails.send({
                    "from": f"{self.sender_name} <{self.sender_email}>",
                    "to": [email],
                    "subject": subject,
                    "html": html_content
                })
                
                self.log_email(email, subject, "board_post", post_id, result.get('id'))
                sent_count += 1
                
            except Exception as e:
                logger.error(f"Failed to send board post notification to {email}: {str(e)}")
        
        logger.info(f"Board post notification sent to {sent_count} subscribers")

    def send_idea_notification(self, idea_title, idea_description, idea_id, idea_author):
        """Send notification for new startup idea"""
        subscribers = self.get_active_subscribers()
        
        if not subscribers:
            logger.info("No active subscribers for idea notification")
            return
        
        subject = f"💡 New Startup Idea: {idea_title}"
        idea_url = f"https://www.kks.im/idea-box#{idea_id}"
        
        content = f"""
        <p>A breakthrough startup idea has been shared in the <span class="cyber-accent">KKS Idea Box</span>! 💡</p>
        
        <div style="background: rgba(57, 255, 20, 0.1); border-left: 4px solid #39FF14; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <h3 style="color: #00FFFF; margin-bottom: 15px; font-family: 'Orbitron', monospace;">{idea_title}</h3>
            <p style="color: #E6E1E5; margin-bottom: 15px;">{idea_description[:200]}{'...' if len(idea_description) > 200 else ''}</p>
            <p style="color: #FF8C42; font-size: 14px; margin: 0;">By: <span class="cyber-accent">{idea_author}</span></p>
        </div>
        
        <a href="{idea_url}" class="cta-button">Explore This Idea</a>
        
        <p>Innovation awaits - dive in and share your thoughts! 🌟</p>
        """
        
        sent_count = 0
        for email, unsubscribe_token in subscribers:
            try:
                html_content = self.create_cyberpunk_email_template(
                    f"New Startup Idea: {idea_title}",
                    content,
                    unsubscribe_token,
                    "idea"
                )
                
                result = resend.Emails.send({
                    "from": f"{self.sender_name} <{self.sender_email}>",
                    "to": [email],
                    "subject": subject,
                    "html": html_content
                })
                
                self.log_email(email, subject, "idea", idea_id, result.get('id'))
                sent_count += 1
                
            except Exception as e:
                logger.error(f"Failed to send idea notification to {email}: {str(e)}")
        
        logger.info(f"Idea notification sent to {sent_count} subscribers")

    def log_email(self, email, subject, email_type, content_id, resend_id):
        """Log sent email for tracking"""
        try:
            conn = sqlite3.connect('subscribers.db')
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO email_logs (email, subject, email_type, content_id, resend_id)
                VALUES (?, ?, ?, ?, ?)
            ''', (email, subject, email_type, content_id, resend_id))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Failed to log email: {str(e)}")

# Global email service instance
try:
    email_service = EmailService()
except Exception as e:
    print(f"EmailService initialization failed: {str(e)}")
    # Create a minimal fallback service
    class FallbackEmailService:
        def subscribe_email(self, email):
            return {'success': False, 'error': 'Email service unavailable'}
        def unsubscribe_email(self, token):
            return {'success': False, 'message': 'Email service unavailable'}
        def send_board_post_notification(self, *args, **kwargs):
            pass
        def send_idea_notification(self, *args, **kwargs):
            pass
    email_service = FallbackEmailService()