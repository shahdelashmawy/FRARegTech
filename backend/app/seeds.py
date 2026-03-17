"""
Seed script to populate the database with initial FRA regulation data.
"""
import logging
from datetime import date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.regulation import Regulation
from app.models.user import User
from app.core.security import get_password_hash
from app.services.embedding_service import generate_embedding

logger = logging.getLogger(__name__)

SAMPLE_REGULATIONS = [
    {
        "title_en": "FRA Decision No. 1 of 2022 - Fintech Regulatory Framework",
        "title_ar": "قرار هيئة الرقابة المالية رقم 1 لسنة 2022 - الإطار التنظيمي للتكنولوجيا المالية",
        "content_en": (
            "The Financial Regulatory Authority (FRA) hereby establishes the regulatory framework "
            "for financial technology (Fintech) companies operating in Egypt. This framework covers "
            "digital lending, payment services, crowdfunding, and InsurTech activities. "
            "All fintech companies must register with the FRA and obtain necessary licenses before "
            "commencing operations. Capital requirements, governance standards, and consumer protection "
            "measures are outlined in this decision."
        ),
        "content_ar": (
            "تضع هيئة الرقابة المالية الإطار التنظيمي لشركات التكنولوجيا المالية العاملة في مصر. "
            "يشمل هذا الإطار الإقراض الرقمي وخدمات الدفع والتمويل الجماعي وأنشطة التأمين التقني. "
            "يجب على جميع شركات التكنولوجيا المالية التسجيل لدى هيئة الرقابة المالية والحصول على التراخيص اللازمة "
            "قبل بدء العمليات."
        ),
        "summary_en": (
            "FRA establishes the regulatory framework for fintech companies in Egypt, "
            "covering digital lending, payments, crowdfunding, and InsurTech with mandatory registration requirements."
        ),
        "summary_ar": (
            "تضع هيئة الرقابة المالية الإطار التنظيمي لشركات التكنولوجيا المالية في مصر، "
            "بما يشمل الإقراض الرقمي والمدفوعات والتمويل الجماعي والتأمين التقني مع اشتراطات تسجيل إلزامية."
        ),
        "regulation_type": "decree",
        "source_url": "https://www.fra.gov.eg/fra_new/regulations/fintech-framework-2022",
        "published_date": date(2022, 3, 15),
        "tags": ["fintech", "digital-lending", "payments", "crowdfunding", "InsurTech"],
    },
    {
        "title_en": "Circular No. 5 of 2023 - Anti-Money Laundering Requirements for Capital Market Entities",
        "title_ar": "تعميم رقم 5 لسنة 2023 - متطلبات مكافحة غسل الأموال لكيانات سوق المال",
        "content_en": (
            "This circular sets out the anti-money laundering (AML) and counter-terrorist financing (CTF) "
            "requirements for all entities regulated by the FRA operating in the Egyptian capital market. "
            "Regulated entities must implement robust KYC (Know Your Customer) procedures, conduct enhanced "
            "due diligence for high-risk customers, maintain transaction records for a minimum of 5 years, "
            "and report suspicious transactions to the Egyptian Money Laundering Combating Unit (EMLCU) "
            "within 24 hours of detection."
        ),
        "content_ar": (
            "يحدد هذا التعميم متطلبات مكافحة غسل الأموال وتمويل الإرهاب لجميع الكيانات الخاضعة لرقابة "
            "هيئة الرقابة المالية العاملة في سوق المال المصري. يجب على الكيانات الخاضعة للتنظيم تطبيق "
            "إجراءات اعرف عميلك، وإجراء العناية الواجبة المعززة للعملاء ذوي المخاطر العالية، "
            "والاحتفاظ بسجلات المعاملات لمدة لا تقل عن 5 سنوات."
        ),
        "summary_en": (
            "Mandatory AML/CTF requirements for FRA-regulated capital market entities, "
            "including KYC procedures, enhanced due diligence, 5-year record retention, and 24-hour STR reporting."
        ),
        "summary_ar": (
            "متطلبات إلزامية لمكافحة غسل الأموال وتمويل الإرهاب لكيانات سوق المال الخاضعة لرقابة هيئة الرقابة المالية."
        ),
        "regulation_type": "circular",
        "source_url": "https://www.fra.gov.eg/fra_new/regulations/aml-circular-5-2023",
        "published_date": date(2023, 6, 20),
        "tags": ["AML", "KYC", "capital-market", "compliance", "CTF"],
    },
    {
        "title_en": "Law No. 176 of 2023 - Amendments to the Capital Market Law",
        "title_ar": "قانون رقم 176 لسنة 2023 - تعديلات قانون سوق المال",
        "content_en": (
            "The Egyptian parliament enacted amendments to the Capital Market Law (Law No. 95 of 1992) "
            "through Law No. 176 of 2023. Key amendments include: strengthened investor protection mechanisms, "
            "new provisions for digital asset trading, enhanced corporate governance requirements for listed companies, "
            "increased penalties for market manipulation and insider trading, and expanded powers for the FRA to "
            "supervise and regulate emerging financial technologies."
        ),
        "content_ar": (
            "أصدر البرلمان المصري تعديلات على قانون سوق المال (قانون رقم 95 لسنة 1992) من خلال القانون رقم 176 لسنة 2023. "
            "تشمل التعديلات الرئيسية: تعزيز آليات حماية المستثمرين، وأحكاما جديدة لتداول الأصول الرقمية، "
            "ومتطلبات حوكمة مؤسسية معززة للشركات المدرجة، وعقوبات متزايدة لتلاعب السوق والتداول بناء على معلومات داخلية."
        ),
        "summary_en": (
            "Major amendments to Egypt's Capital Market Law enhancing investor protection, "
            "enabling digital asset trading, and strengthening FRA's regulatory powers."
        ),
        "summary_ar": (
            "تعديلات جوهرية على قانون سوق المال المصري لتعزيز حماية المستثمرين وتمكين تداول الأصول الرقمية."
        ),
        "regulation_type": "law",
        "source_url": "https://www.fra.gov.eg/fra_new/regulations/law-176-2023",
        "published_date": date(2023, 11, 5),
        "tags": ["capital-market", "digital-assets", "investor-protection", "corporate-governance"],
    },
    {
        "title_en": "FRA Announcement - New Crowdfunding Platform Registration Guidelines",
        "title_ar": "إعلان هيئة الرقابة المالية - إرشادات تسجيل منصات التمويل الجماعي الجديدة",
        "content_en": (
            "The FRA announces updated registration guidelines for equity-based and debt-based crowdfunding platforms. "
            "Platforms must meet minimum capital requirements of EGP 5 million for equity crowdfunding and EGP 3 million "
            "for debt crowdfunding. Platforms must implement investor suitability assessments, disclosure requirements, "
            "escrow arrangements for funds, and risk warning mechanisms. Applications must be submitted through the "
            "FRA's online portal."
        ),
        "content_ar": (
            "تعلن هيئة الرقابة المالية عن إرشادات تسجيل محدثة لمنصات التمويل الجماعي القائمة على حقوق الملكية والديون. "
            "يجب أن تستوفي المنصات الحد الأدنى لمتطلبات رأس المال البالغ 5 ملايين جنيه مصري للتمويل الجماعي بالملكية، "
            "و3 ملايين جنيه مصري للتمويل الجماعي بالدين."
        ),
        "summary_en": (
            "Updated FRA registration guidelines for crowdfunding platforms with EGP 5M equity and EGP 3M debt "
            "capital requirements, plus investor suitability and disclosure obligations."
        ),
        "summary_ar": (
            "إرشادات تسجيل محدثة من هيئة الرقابة المالية لمنصات التمويل الجماعي مع اشتراطات رأس مال ومتطلبات إفصاح."
        ),
        "regulation_type": "announcement",
        "source_url": "https://www.fra.gov.eg/fra_new/news/crowdfunding-guidelines-2024",
        "published_date": date(2024, 1, 15),
        "tags": ["crowdfunding", "fintech", "capital-requirements", "registration"],
    },
    {
        "title_en": "Circular No. 2 of 2024 - ESG Reporting Requirements for Listed Companies",
        "title_ar": "تعميم رقم 2 لسنة 2024 - متطلبات تقارير الاستدامة للشركات المدرجة",
        "content_en": (
            "The FRA requires all companies listed on the Egyptian Exchange to include Environmental, Social, "
            "and Governance (ESG) disclosures in their annual reports starting from fiscal year 2024. "
            "Reports must cover: carbon emissions and energy consumption, workforce diversity and inclusion metrics, "
            "board composition and independence, anti-corruption policies, and supply chain sustainability. "
            "Companies must use the internationally recognized GRI standards for ESG reporting."
        ),
        "content_ar": (
            "تلزم هيئة الرقابة المالية جميع الشركات المدرجة في البورصة المصرية بتضمين إفصاحات الاستدامة البيئية "
            "والاجتماعية والحوكمة في تقاريرها السنوية اعتبارا من السنة المالية 2024. "
            "يجب أن تغطي التقارير: انبعاثات الكربون، وتنوع القوى العاملة، وتكوين مجلس الإدارة."
        ),
        "summary_en": (
            "FRA mandates ESG disclosures for all Egyptian Exchange-listed companies from FY2024, "
            "following GRI standards covering emissions, diversity, governance, and supply chain sustainability."
        ),
        "summary_ar": (
            "تُلزم هيئة الرقابة المالية الشركات المدرجة في البورصة المصرية بالإفصاح عن معايير الاستدامة اعتبارا من 2024."
        ),
        "regulation_type": "circular",
        "source_url": "https://www.fra.gov.eg/fra_new/regulations/esg-circular-2-2024",
        "published_date": date(2024, 2, 28),
        "tags": ["ESG", "sustainability", "listed-companies", "reporting", "governance"],
    },
]


async def seed_initial_data():
    """Seed the database with initial regulations and an admin user."""
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        existing = await db.execute(select(Regulation).limit(1))
        if existing.scalar_one_or_none():
            logger.info("Database already seeded, skipping")
            return

        logger.info("Seeding initial data...")

        # Create admin user
        admin_check = await db.execute(select(User).where(User.email == "admin@fraregtech.eg"))
        if not admin_check.scalar_one_or_none():
            admin = User(
                email="admin@fraregtech.eg",
                password_hash=get_password_hash("Admin@123"),
                full_name="FRA RegTech Admin",
                preferred_language="en",
                keywords=["fintech", "regulation", "compliance"],
                notification_email=True,
                notification_whatsapp=False,
                is_active=True,
                is_admin=True,
            )
            db.add(admin)
            logger.info("Created admin user: admin@fraregtech.eg")

        # Seed regulations
        for reg_data in SAMPLE_REGULATIONS:
            # Generate embedding for semantic search
            combined_text = " ".join(filter(None, [
                reg_data.get("title_en"),
                reg_data.get("title_ar"),
                reg_data.get("content_en"),
                reg_data.get("content_ar"),
            ]))
            try:
                embedding = generate_embedding(combined_text) if combined_text else None
            except Exception:
                embedding = None

            regulation = Regulation(
                **reg_data,
                embedding=embedding,
                is_active=True,
            )
            db.add(regulation)

        await db.commit()
        logger.info(f"Seeded {len(SAMPLE_REGULATIONS)} sample regulations")
