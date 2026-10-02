import re
import random
import string
from datetime import date, datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models import (
    Admin, Trip, TripSchedule, Apparel, Blog, Setting,
)
from auth import hash_password


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s-]+", "-", text)
    return text.strip("-")


def gen_code(prefix: str) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    rand = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{prefix}-{stamp}-{rand}"


DEFAULT_SETTINGS = {
    "brand_name": "Silent Hiking Indonesia",
    "brand_tagline": "Walk Slowly. Be Present. Feel More.",
    "logo_url": "",
    "primary_color": "#2D4A3E",
    "accent_color": "#6B7144",
    "hero_image_url": "https://images.unsplash.com/photo-1758438919146-f3f59a6d2544?w=1800&h=1000&fit=crop&auto=format",
    "payment_mode": "manual_transfer",  # manual_transfer | gateway | both
    "bank_name": "BCA",
    "account_number": "1234567890",
    "account_holder": "Silent Hiking Indonesia",
    "processing_fee": "5000",
    "contact_email": "hello@silenthiking.id",
    "contact_whatsapp": "+62 812 3456 7890",
    "contact_instagram": "@silenthikingid",
}


async def seed(db: AsyncSession):
    import os

    # ----- Admin -----
    admin_email = os.environ["ADMIN_EMAIL"]
    admin_username = os.environ.get("ADMIN_USERNAME", "admin")
    admin_password = os.environ["ADMIN_PASSWORD"]
    res = await db.execute(select(Admin).where(Admin.email == admin_email))
    admin = res.scalar_one_or_none()
    if admin is None:
        admin = Admin(
            username=admin_username, email=admin_email, name="Owner",
            password_hash=hash_password(admin_password), role="superadmin",
        )
        db.add(admin)
        await db.commit()
        await db.refresh(admin)
    elif not __import__("auth").verify_password(admin_password, admin.password_hash):
        admin.password_hash = hash_password(admin_password)
        await db.commit()

    # ----- Settings -----
    for k, v in DEFAULT_SETTINGS.items():
        r = await db.execute(select(Setting).where(Setting.key == k))
        if r.scalar_one_or_none() is None:
            db.add(Setting(key=k, value=v))
    await db.commit()

    # ----- Trips (only if none) -----
    count = (await db.execute(select(func.count(Trip.id)))).scalar()
    if count == 0:
        trips_data = [
            {
                "title": "Silent Hiking Afternoon Escape",
                "location": "Gunung Salak, Bogor",
                "meeting_point": "Basecamp Salak Endah",
                "difficulty": "Easy", "duration": "4 jam", "price": 350000,
                "image_url": "https://images.unsplash.com/photo-1762770665765-de232b512652?w=900&h=1200&fit=crop&auto=format",
                "description": "Pengalaman berjalan hening sore hari menikmati kabut tipis dan suasana tenang di area kaki Gunung Salak. Setiap langkah, napas, dan momen dirancang dengan penuh kesadaran.",
                "wa_group_link": "https://chat.whatsapp.com/ExampleGroupSalak123",
                "included": ["Professional guide", "Snacks & herbal tea", "Mindfulness briefing", "Journey journal booklet", "Post-hike reflection session", "Insurance coverage"],
                "timeline": [
                    {"time": "06:00", "title": "Gathering & Briefing", "desc": "Meet at designated point, introduction, and mindfulness prep."},
                    {"time": "07:00", "title": "Begin Silently", "desc": "Enter the forest in intentional silence. No phone rule activated."},
                    {"time": "09:00", "title": "Rest Point & Journaling", "desc": "Pause, breathe, observe. Guided journaling prompts provided."},
                    {"time": "10:30", "title": "Forest Immersion", "desc": "Continue deeper into the trail with full sensory awareness."},
                    {"time": "12:00", "title": "Reflection & Closing", "desc": "Group sharing circle, herbal tea, and gratitude practice."},
                ],
                "schedules": [date(2026, 10, 15), date(2026, 10, 29)],
            },
            {
                "title": "Mindful Morning Session",
                "location": "Hutan Sentul, Bogor",
                "meeting_point": "Sentul Eco Edu Forest",
                "difficulty": "Easy", "duration": "3 jam", "price": 275000,
                "image_url": "https://images.unsplash.com/photo-1784732350314-3aca04d860b0?w=900&h=1200&fit=crop&auto=format",
                "description": "Sesi pagi penuh kesadaran di tengah rimbunnya Hutan Sentul. Rasakan udara segar dan ketenangan sebelum memulai hari.",
                "wa_group_link": "https://chat.whatsapp.com/ExampleGroupSentul",
                "included": ["Professional guide", "Herbal tea", "Mindfulness briefing", "Journey journal booklet"],
                "timeline": [
                    {"time": "05:30", "title": "Gathering", "desc": "Meet and morning breathing practice."},
                    {"time": "06:00", "title": "Silent Walk", "desc": "Begin the silent morning trail."},
                    {"time": "08:30", "title": "Closing Circle", "desc": "Reflection and herbal tea."},
                ],
                "schedules": [date(2026, 10, 22)],
            },
            {
                "title": "Forest Immersion Special",
                "location": "Taman Nasional Halimun",
                "meeting_point": "Pos TN Gunung Halimun Salak",
                "difficulty": "Moderate", "duration": "6 jam", "price": 550000,
                "image_url": "https://images.unsplash.com/photo-1768345755011-78c9abc4cb72?w=900&h=1200&fit=crop&auto=format",
                "description": "Immersion mendalam ke jantung hutan hujan tropis Halimun. Pengalaman lebih panjang untuk koneksi yang lebih dalam dengan alam.",
                "wa_group_link": "https://chat.whatsapp.com/ExampleGroupHalimun",
                "included": ["Professional guide", "Lunch & herbal tea", "Mindfulness briefing", "Journey journal booklet", "Insurance coverage"],
                "timeline": [
                    {"time": "06:00", "title": "Gathering & Briefing", "desc": "Introduction and mindfulness prep."},
                    {"time": "07:00", "title": "Begin Silently", "desc": "Enter the rainforest in silence."},
                    {"time": "10:00", "title": "Deep Immersion", "desc": "Sensory awareness exercises."},
                    {"time": "12:00", "title": "Lunch & Reflection", "desc": "Mindful lunch in nature."},
                    {"time": "13:30", "title": "Closing", "desc": "Group gratitude circle."},
                ],
                "schedules": [date(2026, 11, 1), date(2026, 11, 15)],
            },
        ]
        for td in trips_data:
            scheds = td.pop("schedules")
            trip = Trip(slug=slugify(td["title"]), **td)
            db.add(trip)
            await db.flush()
            for d in scheds:
                db.add(TripSchedule(trip_id=trip.id, event_date=d, quota=15))
        await db.commit()

    # ----- Apparel -----
    count = (await db.execute(select(func.count(Apparel.id)))).scalar()
    if count == 0:
        apparel_data = [
            {"name": "Trail Organic Tee", "category": "Apparel", "price": 285000,
             "image_url": "https://images.unsplash.com/photo-1540486674504-91e3ad500c52?w=900&h=1200&fit=crop&auto=format",
             "gallery_urls": ["https://images.unsplash.com/photo-1612178012526-dcc3024fb9b8?w=600&h=600&fit=crop&auto=format", "https://images.unsplash.com/photo-1768345755011-78c9abc4cb72?w=600&h=600&fit=crop&auto=format"],
             "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
             "colors": [{"name": "Forest Green", "hex": "#2D4A3E"}, {"name": "Bone", "hex": "#F5F0E8"}],
             "material": "100% Organic Cotton, 180gsm", "fit": "Slightly oversized, unisex", "stock": 20,
             "description": "A minimal, breathable tee designed for movement in nature. Made from 100% organic cotton with a slightly oversized fit that feels effortless on trail and off."},
            {"name": "Forest Windbreaker", "category": "Apparel", "price": 750000,
             "image_url": "https://images.unsplash.com/photo-1612178012526-dcc3024fb9b8?w=900&h=1100&fit=crop&auto=format",
             "gallery_urls": [], "sizes": ["S", "M", "L", "XL"],
             "colors": [{"name": "Moss", "hex": "#6B7144"}, {"name": "Charcoal", "hex": "#1C1C1A"}],
             "material": "Ultralight Nylon Ripstop", "fit": "Regular, unisex", "stock": 10,
             "description": "Jaket penahan angin dengan bahan ultralight ramah cuaca dingin."},
            {"name": "Field Cap", "category": "Accessories", "price": 195000,
             "image_url": "https://images.unsplash.com/photo-1763713441168-8d2fb207955f?w=900&h=700&fit=crop&auto=format",
             "gallery_urls": [], "sizes": ["One Size"],
             "colors": [{"name": "Earth", "hex": "#8B6B4A"}], "material": "Cotton Twill", "fit": "Adjustable", "stock": 15,
             "description": "Topi outdoor klasik untuk perlindungan terik matahari."},
            {"name": "Mindful Outdoor Kit", "category": "Limited Edition", "price": 950000,
             "image_url": "https://images.unsplash.com/photo-1730124749311-5676e2328cd8?w=900&h=700&fit=crop&auto=format",
             "gallery_urls": [], "sizes": ["One Size"],
             "colors": [{"name": "Natural", "hex": "#EDE8DC"}], "material": "Mixed", "fit": "Kit", "stock": 5,
             "description": "Paket lengkap jurnal, tumbler, dan bandana eksklusif."},
        ]
        for ad in apparel_data:
            db.add(Apparel(slug=slugify(ad["name"]), **ad))
        await db.commit()

    # ----- Blogs -----
    count = (await db.execute(select(func.count(Blog.id)))).scalar()
    if count == 0:
        blogs_data = [
            {"title": "What Silence Teaches Us", "category": "Mindfulness", "read_time": "5 min read",
             "image_url": "https://images.unsplash.com/photo-1713634438631-754fe8a8dc0c?w=1200&h=800&fit=crop&auto=format",
             "excerpt": "Dalam ketiadaan riuh suara, kita mulai mendengarkan hal-hal yang selama ini terabaikan.",
             "content": "Silent hiking adalah praktik berjalan di alam tanpa interaksi suara, berfokus pada ritme napas dan kesadaran sekitar. Dalam keheningan, kita mulai memperhatikan hal-hal yang sering terlewat — suara angin di antara pepohonan, langkah kaki di atas tanah basah, tarikan napas yang dalam dan perlahan.\n\nKeheningan bukan tentang tidak bicara. Keheningan adalah tentang hadir sepenuhnya — bagi alam, bagi diri sendiri, dan bagi orang-orang di sekitar kita."},
            {"title": "Finding Calm Between The Trees", "category": "Outdoor", "read_time": "4 min read",
             "image_url": "https://images.unsplash.com/photo-1640950824507-6d5a34cfb7ef?w=900&h=700&fit=crop&auto=format",
             "excerpt": "Hutan memiliki ritme napasnya sendiri. Saat kita menyelaraskan langkah, pikiran pun menjadi hening.",
             "content": "Berjalan di tengah pepohonan memberikan efek terapeutik yang menurunkan kadar kortisol dan keletihan mental. The forest has a rhythm. It breathes slowly. And when we match its pace, everything shifts."},
            {"title": "Why We Walk Without Talking", "category": "Stories", "read_time": "6 min read",
             "image_url": "https://images.unsplash.com/photo-1777058921942-95672ad15e36?w=900&h=1200&fit=crop&auto=format",
             "excerpt": "A conversation about the unexpected intimacy of shared silence.",
             "content": "Ketika sekelompok orang asing berjalan bersama dalam diam, sesuatu yang tak terduga terjadi. Mereka pulang sebagai komunitas. Keheningan menyatukan kami dengan cara yang kata-kata tidak bisa."},
        ]
        for bd in blogs_data:
            db.add(Blog(slug=slugify(bd["title"]), author_id=admin.id, **bd))
        await db.commit()
