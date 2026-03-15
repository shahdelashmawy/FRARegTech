"""
Seed script to populate the database with initial FRA regulation data.
Run with: python -m app.scripts.seed_data
"""
import asyncio
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from app.database import engine, Base
from app.models.regulation import Regulation
from app.models.user import User
from app.core.security import get_password_hash

SAMPLE_REGULATIONS = [
    {
        "title_en": "Law No. 175 of 2018 on Anti-Cybercrime",
        "title_ar": "قانون رقم 175 لسنة 2018 بشأن مكافحة جرائم تقنية المعلومات",
        "summary_en": "Egypt's Anti-Cybercrime Law regulates electronic transactions and penalizes unauthorized access to networks and systems. Relevant to fintech for data protection obligations.",
        "summary_ar": "ينظم قانون مكافحة جرائم المعلومات المعاملات الإلكترونية ويعاقب على الوصول غير المصرح به للشبكات. ذو صلة بشركات التكنولوجيا المالية لالتزامات حماية البيانات.",
        "regulation_type": "law",
        "source_url": "https://www.fra.gov.eg",
        "published_date": date(2018, 8, 14),
        "tags": ["cybercrime", "data protection", "electronic transactions"],
    },
    {
        "title_en": "FRA Decree No. 72 of 2020 - Crowdfunding Regulation",
        "title_ar": "قرار مجلس إدارة هيئة الرقابة المالية رقم 72 لسنة 2020 - التمويل الجماعي",
        "summary_en": "This decree establishes the regulatory framework for crowdfunding platforms in Egypt, including licensing requirements, capital minimums, and investor protection rules.",
        "summary_ar": "يضع هذا القرار الإطار التنظيمي لمنصات التمويل الجماعي في مصر، بما في ذلك متطلبات الترخيص والحد الأدنى لرأس المال وقواعد حماية المستثمر.",
        "regulation_type": "decree",
        "source_url": "https://www.fra.gov.eg/fra_new/2020/crowdfunding",
        "published_date": date(2020, 3, 15),
        "tags": ["crowdfunding", "fintech", "licensing", "investment"],
    },
    {
        "title_en": "FRA Circular No. 5 of 2022 - Digital Investment Platforms",
        "title_ar": "تعميم هيئة الرقابة المالية رقم 5 لسنة 2022 - منصات الاستثمار الرقمي",
        "summary_en": "Guidelines for digital investment platform operators covering KYC requirements, transaction monitoring, and reporting obligations to the FRA.",
        "summary_ar": "إرشادات لمشغلي منصات الاستثمار الرقمي تشمل متطلبات اعرف عميلك ومراقبة المعاملات والتزامات الإبلاغ لهيئة الرقابة المالية.",
        "regulation_type": "circular",
        "source_url": "https://www.fra.gov.eg/fra_new/2022/digital-investment",
        "published_date": date(2022, 6, 1),
        "tags": ["digital investment", "KYC", "AML", "reporting"],
    },
    {
        "title_en": "FRA Decree No. 11 of 2023 - Fintech Regulatory Sandbox",
        "title_ar": "قرار مجلس إدارة هيئة الرقابة المالية رقم 11 لسنة 2023 - البيئة التجريبية للتكنولوجيا المالية",
        "summary_en": "Establishes the FRA Fintech Regulatory Sandbox allowing innovative financial technology companies to test products and services in a controlled environment before obtaining full licensing.",
        "summary_ar": "يُنشئ البيئة التجريبية التنظيمية لهيئة الرقابة المالية مما يسمح لشركات التكنولوجيا المالية المبتكرة باختبار المنتجات والخدمات في بيئة خاضعة للرقابة قبل الحصول على الترخيص الكامل.",
        "regulation_type": "decree",
        "source_url": "https://www.fra.gov.eg/fra_new/2023/fintech-sandbox",
        "published_date": date(2023, 2, 20),
        "tags": ["sandbox", "fintech", "innovation", "licensing", "startup"],
    },
    {
        "title_en": "FRA Announcement - New Requirements for Payment Service Providers",
        "title_ar": "إعلان هيئة الرقابة المالية - متطلبات جديدة لمزودي خدمات الدفع",
        "summary_en": "The FRA announces updated capital requirements and operational standards for licensed payment service providers, effective January 2024.",
        "summary_ar": "تُعلن هيئة الرقابة المالية عن متطلبات رأس المال المحدثة والمعايير التشغيلية لمزودي خدمات الدفع المرخصين، سارية من يناير 2024.",
        "regulation_type": "announcement",
        "source_url": "https://www.fra.gov.eg/fra_new/2023/payment-providers",
        "published_date": date(2023, 11, 15),
        "tags": ["payment services", "capital requirements", "compliance"],
    },
    {
        "title_en": "Law No. 5 of 2022 - Digital Signature and Electronic Commerce",
        "title_ar": "قانون رقم 5 لسنة 2022 - التوقيع الإلكتروني والتجارة الإلكترونية",
        "summary_en": "Governs electronic signatures, digital certificates, and electronic commerce in Egypt. Key legislation for fintech companies conducting digital transactions.",
        "summary_ar": "ينظم التوقيعات الإلكترونية والشهادات الرقمية والتجارة الإلكترونية في مصر. تشريع رئيسي لشركات التكنولوجيا المالية التي تجري معاملات رقمية.",
        "regulation_type": "law",
        "source_url": "https://www.fra.gov.eg/fra_new/laws/digital-signature",
        "published_date": date(2022, 1, 10),
        "tags": ["digital signature", "e-commerce", "electronic transactions"],
    },
    {
        "title_en": "FRA Decree No. 45 of 2021 - Microfinance Regulations Update",
        "title_ar": "قرار مجلس إدارة هيئة الرقابة المالية رقم 45 لسنة 2021 - تحديث لوائح التمويل الأصغر",
        "summary_en": "Updated framework for microfinance institutions including digital lending platforms, covering interest rate caps, disclosure requirements, and consumer protection standards.",
        "summary_ar": "إطار محدث لمؤسسات التمويل الأصغر بما في ذلك منصات الإقراض الرقمي، يشمل حدود أسعار الفائدة ومتطلبات الإفصاح ومعايير حماية المستهلك.",
        "regulation_type": "decree",
        "source_url": "https://www.fra.gov.eg/fra_new/2021/microfinance",
        "published_date": date(2021, 7, 8),
        "tags": ["microfinance", "digital lending", "consumer protection", "interest rates"],
    },
    {
        "title_en": "FRA Circular No. 2 of 2024 - AML/CFT Requirements for Fintech",
        "title_ar": "تعميم هيئة الرقابة المالية رقم 2 لسنة 2024 - متطلبات مكافحة غسل الأموال وتمويل الإرهاب للتكنولوجيا المالية",
        "summary_en": "Updated AML/CFT compliance requirements for all FRA-licensed fintech companies, including enhanced due diligence, transaction monitoring thresholds, and SAR filing procedures.",
        "summary_ar": "متطلبات الامتثال المحدثة لمكافحة غسل الأموال وتمويل الإرهاب لجميع شركات التكنولوجيا المالية المرخصة من هيئة الرقابة المالية، بما في ذلك العناية الواجبة المعززة وعتبات مراقبة المعاملات وإجراءات تقديم تقارير الأنشطة المشبوهة.",
        "regulation_type": "circular",
        "source_url": "https://www.fra.gov.eg/fra_new/2024/aml-cft",
        "published_date": date(2024, 1, 15),
        "tags": ["AML", "CFT", "compliance", "due diligence", "SAR"],
    },
]


async def seed():
    """Seed the database with initial data."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    from sqlalchemy.ext.asyncio import AsyncSession
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        from sqlalchemy import select, func
        result = await session.execute(select(func.count()).select_from(Regulation))
        count = result.scalar()
        if count > 0:
            print(f"Database already has {count} regulations. Skipping seed.")
            return

        # Add sample regulations
        for reg_data in SAMPLE_REGULATIONS:
            regulation = Regulation(**reg_data, is_active=True)
            session.add(regulation)

        # Add a demo admin user
        from sqlalchemy import select
        existing = await session.execute(
            select(User).where(User.email == "admin@fraregtech.com")
        )
        if not existing.scalar_one_or_none():
            admin = User(
                email="admin@fraregtech.com",
                full_name="FRA RegTech Admin",
                password_hash=get_password_hash("admin123"),
                preferred_language="en",
                keywords=["fintech", "digital payments", "crowdfunding"],
                notification_email=True,
                notification_whatsapp=False,
                is_active=True,
            )
            session.add(admin)

        await session.commit()
        print(f"Seeded {len(SAMPLE_REGULATIONS)} regulations and 1 admin user.")
        print("Admin credentials: admin@fraregtech.com / admin123")


if __name__ == "__main__":
    asyncio.run(seed())
