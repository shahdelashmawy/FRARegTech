import logging
from typing import List, Optional, Dict
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import aiosmtplib

from app.config import settings
from app.models.user import User
from app.models.regulation import Regulation

logger = logging.getLogger(__name__)


def build_email_html(regulation: Regulation, language: str = "en") -> str:
    """Build an HTML email body for a regulation alert."""
    if language == "ar":
        title = regulation.title_ar or regulation.title_en or "لائحة جديدة"
        summary = regulation.summary_ar or regulation.summary_en or ""
        subject_prefix = "تنبيه لوائح هيئة الرقابة المالية"
        view_label = "عرض على الموقع"
        type_label = "النوع"
        date_label = "تاريخ النشر"
    else:
        title = regulation.title_en or regulation.title_ar or "New Regulation"
        summary = regulation.summary_en or regulation.summary_ar or ""
        subject_prefix = "FRA Regulation Alert"
        view_label = "View on FRA Website"
        type_label = "Type"
        date_label = "Published"

    source_link = ""
    if regulation.source_url:
        source_link = f'<p><a href="{regulation.source_url}">{view_label}</a></p>'

    html = f"""
    <!DOCTYPE html>
    <html dir="{'rtl' if language == 'ar' else 'ltr'}">
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #1e3a5f; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
            .content {{ background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }}
            .footer {{ background-color: #eee; padding: 10px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }}
            .badge {{ display: inline-block; background-color: #e74c3c; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>{subject_prefix}</h2>
                <p>FRA RegTech - هيئة الرقابة المالية</p>
            </div>
            <div class="content">
                <h3>{title}</h3>
                <p><span class="badge">{type_label}: {regulation.regulation_type}</span></p>
                <p><strong>{date_label}:</strong> {regulation.published_date or 'N/A'}</p>
                <p>{summary}</p>
                {source_link}
            </div>
            <div class="footer">
                <p>FRA RegTech Platform | Unsubscribe from alerts in your account settings</p>
            </div>
        </div>
    </body>
    </html>
    """
    return html


async def send_email_alert(
    recipient_email: str,
    regulation: Regulation,
    language: str = "en",
) -> bool:
    """Send an email alert about a new regulation."""
    if not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD]):
        logger.warning("SMTP not configured; skipping email alert")
        return False

    try:
        if language == "ar":
            subject = f"تنبيه: {regulation.title_ar or regulation.title_en or 'لائحة جديدة'}"
        else:
            subject = f"FRA Alert: {regulation.title_en or regulation.title_ar or 'New Regulation'}"

        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = settings.EMAIL_FROM or settings.SMTP_USER
        message["To"] = recipient_email

        html_body = build_email_html(regulation, language)
        message.attach(MIMEText(html_body, "html", "utf-8"))

        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info(f"Email alert sent to {recipient_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {e}")
        return False


def send_whatsapp_alert(
    whatsapp_number: str,
    regulation: Regulation,
    language: str = "en",
) -> bool:
    """Send a WhatsApp alert about a new regulation via Twilio."""
    if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN]):
        logger.warning("Twilio not configured; skipping WhatsApp alert")
        return False

    try:
        from twilio.rest import Client

        if language == "ar":
            title = regulation.title_ar or regulation.title_en or "لائحة جديدة"
            summary = (regulation.summary_ar or regulation.summary_en or "")[:300]
            body = (
                f"*تنبيه هيئة الرقابة المالية*\n\n"
                f"*{title}*\n"
                f"النوع: {regulation.regulation_type}\n"
                f"التاريخ: {regulation.published_date or 'غير محدد'}\n\n"
                f"{summary}\n\n"
                f"{'المصدر: ' + regulation.source_url if regulation.source_url else ''}"
            )
        else:
            title = regulation.title_en or regulation.title_ar or "New Regulation"
            summary = (regulation.summary_en or regulation.summary_ar or "")[:300]
            body = (
                f"*FRA Regulation Alert*\n\n"
                f"*{title}*\n"
                f"Type: {regulation.regulation_type}\n"
                f"Date: {regulation.published_date or 'N/A'}\n\n"
                f"{summary}\n\n"
                f"{'Source: ' + regulation.source_url if regulation.source_url else ''}"
            )

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        to_number = f"whatsapp:{whatsapp_number}" if not whatsapp_number.startswith("whatsapp:") else whatsapp_number

        message = client.messages.create(
            body=body,
            from_=settings.TWILIO_WHATSAPP_FROM,
            to=to_number,
        )
        logger.info(f"WhatsApp alert sent to {whatsapp_number}: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Failed to send WhatsApp to {whatsapp_number}: {e}")
        return False


async def notify_user_about_regulation(
    user: User, regulation: Regulation
) -> Dict[str, bool]:
    """
    Send notification to a user about a matching regulation.
    Uses their preferred channels and language.
    """
    results = {"email": False, "whatsapp": False}
    lang = user.preferred_language or "en"

    if user.notification_email and user.email:
        results["email"] = await send_email_alert(user.email, regulation, lang)

    if user.notification_whatsapp and user.whatsapp_number:
        results["whatsapp"] = send_whatsapp_alert(user.whatsapp_number, regulation, lang)

    return results
