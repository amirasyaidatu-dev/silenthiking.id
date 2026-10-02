import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from datetime import datetime, date
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Response, Request
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select, func, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db, AsyncSessionLocal
from models import (
    Admin, Trip, TripSchedule, Booking, Apparel, ApparelOrder, Blog, Review, Setting,
)
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_admin, require_superadmin,
)
from seed import seed, slugify, gen_code


# ----------------------------- Serialization helpers -----------------------------
def ser(obj, exclude=()):
    from sqlalchemy import inspect as sa_inspect
    out = {}
    for c in sa_inspect(obj).mapper.column_attrs:
        if c.key in exclude:
            continue
        v = getattr(obj, c.key)
        if isinstance(v, (datetime, date)):
            v = v.isoformat()
        out[c.key] = v
    return out


async def slots_left(db: AsyncSession, schedule_id: str, quota: int) -> int:
    taken = (await db.execute(
        select(func.coalesce(func.sum(Booking.participants), 0)).where(
            Booking.schedule_id == schedule_id,
            Booking.payment_status != "REJECTED",
        )
    )).scalar() or 0
    return max(quota - taken, 0)


async def _slot_sums(db: AsyncSession, schedule_ids):
    if not schedule_ids:
        return {}
    rows = (await db.execute(
        select(Booking.schedule_id, func.coalesce(func.sum(Booking.participants), 0))
        .where(Booking.schedule_id.in_(schedule_ids), Booking.payment_status != "REJECTED")
        .group_by(Booking.schedule_id)
    )).all()
    return {sid: int(tot) for sid, tot in rows}


def build_trip(trip: Trip, sums: dict):
    data = ser(trip)
    active = [s for s in sorted(trip.schedules, key=lambda x: x.event_date) if s.is_active]
    scheds = []
    for s in active:
        sd = ser(s)
        sd["slots_left"] = max(s.quota - int(sums.get(s.id, 0)), 0)
        scheds.append(sd)
    data["schedules"] = scheds
    data["total_slots_left"] = sum(s["slots_left"] for s in scheds)
    return data


async def trip_payload(db: AsyncSession, trip: Trip):
    ids = [s.id for s in trip.schedules if s.is_active]
    sums = await _slot_sums(db, ids)
    return build_trip(trip, sums)


# ----------------------------- Pydantic schemas -----------------------------
class LoginIn(BaseModel):
    username: str
    password: str


class ScheduleIn(BaseModel):
    event_date: date
    quota: int = 15


class TripIn(BaseModel):
    title: str
    location: str
    meeting_point: Optional[str] = None
    difficulty: str = "Easy"
    duration: str = "4 jam"
    min_age: int = 16
    price: int = 0
    description: Optional[str] = None
    included: List[str] = []
    timeline: List[dict] = []
    gallery_urls: List[str] = []
    wa_group_link: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    schedules: List[ScheduleIn] = []


class BookingIn(BaseModel):
    trip_id: str
    schedule_id: str
    full_name: str
    whatsapp_number: str
    email: Optional[str] = None
    emergency_contact: str
    health_notes: Optional[str] = None
    participants: int = 1
    shirt_size: str
    drink_bonus: str
    agreed_terms: bool
    payment_method: str = "manual_transfer"
    payment_proof: Optional[str] = None


class BookingUpdateIn(BaseModel):
    full_name: Optional[str] = None
    whatsapp_number: Optional[str] = None
    email: Optional[str] = None
    emergency_contact: Optional[str] = None
    health_notes: Optional[str] = None
    participants: Optional[int] = None
    shirt_size: Optional[str] = None
    drink_bonus: Optional[str] = None
    payment_status: Optional[str] = None


class ApparelIn(BaseModel):
    name: str
    category: str = "Apparel"
    price: int = 0
    image_url: str
    gallery_urls: List[str] = []
    sizes: List[str] = []
    colors: List[dict] = []
    material: Optional[str] = None
    fit: Optional[str] = None
    stock: int = 10
    description: Optional[str] = None
    is_active: bool = True


class ApparelOrderIn(BaseModel):
    apparel_id: str
    full_name: str
    whatsapp_number: str
    email: Optional[str] = None
    address: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    quantity: int = 1
    payment_method: str = "manual_transfer"
    payment_proof: Optional[str] = None


class BlogIn(BaseModel):
    title: str
    category: str = "Mindfulness"
    read_time: str = "5 min read"
    image_url: str
    excerpt: Optional[str] = None
    content: str
    trip_id: Optional[str] = None
    is_published: bool = True


class ReviewIn(BaseModel):
    booking_code: str
    rating: int = 5
    comment: Optional[str] = None


class AdminIn(BaseModel):
    username: str
    email: str
    name: str = "Admin"
    password: str
    role: str = "admin"


class AdminUpdateIn(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


# ----------------------------- App setup -----------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with AsyncSessionLocal() as db:
        await seed(db)
    yield


app = FastAPI(lifespan=lifespan)
api = APIRouter(prefix="/api")


@api.get("/")
async def root():
    return {"message": "Silent Hiking Indonesia API"}


# ----------------------------- Auth -----------------------------
@api.post("/auth/login")
async def login(body: LoginIn, response: Response, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Admin).where(Admin.username == body.username))
    admin = res.scalar_one_or_none()
    if not admin or not verify_password(body.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Username atau password salah")
    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Akun dinonaktifkan")
    token = create_access_token(admin.id, admin.username, admin.role)
    response.set_cookie("access_token", token, httponly=True, secure=True,
                        samesite="none", max_age=60 * 60 * 12, path="/")
    return {"token": token, "admin": ser(admin, exclude=("password_hash",))}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(admin: Admin = Depends(get_current_admin)):
    return ser(admin, exclude=("password_hash",))


# ----------------------------- Public: settings -----------------------------
async def get_settings_dict(db: AsyncSession):
    rows = (await db.execute(select(Setting))).scalars().all()
    return {r.key: r.value for r in rows}


@api.get("/settings/public")
async def public_settings(db: AsyncSession = Depends(get_db)):
    return await get_settings_dict(db)


# ----------------------------- Public: trips -----------------------------
@api.get("/trips")
async def list_trips(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(
        select(Trip).where(Trip.is_active == True).options(selectinload(Trip.schedules))
        .order_by(Trip.created_at.desc())
    )).scalars().all()
    all_ids = [s.id for t in rows for s in t.schedules if s.is_active]
    sums = await _slot_sums(db, all_ids)
    return [build_trip(t, sums) for t in rows]


@api.get("/trips/{slug}")
async def get_trip(slug: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Trip).where(Trip.slug == slug).options(selectinload(Trip.schedules))
    )
    trip = res.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip tidak ditemukan")
    return await trip_payload(db, trip)


# ----------------------------- Public: bookings -----------------------------
@api.post("/bookings")
async def create_booking(body: BookingIn, db: AsyncSession = Depends(get_db)):
    if not body.agreed_terms:
        raise HTTPException(status_code=400, detail="Anda harus menyetujui syarat & ketentuan")
    trip = (await db.execute(select(Trip).where(Trip.id == body.trip_id))).scalar_one_or_none()
    sched = (await db.execute(select(TripSchedule).where(TripSchedule.id == body.schedule_id))).scalar_one_or_none()
    if not trip or not sched or sched.trip_id != trip.id:
        raise HTTPException(status_code=404, detail="Trip / jadwal tidak valid")
    avail = await slots_left(db, sched.id, sched.quota)
    if body.participants < 1 or body.participants > avail:
        raise HTTPException(status_code=400, detail=f"Slot tidak cukup. Tersisa {avail} slot")
    settings = await get_settings_dict(db)
    fee = int(settings.get("processing_fee", "0") or 0)
    total = trip.price * body.participants + fee
    booking = Booking(
        booking_code=gen_code("SHI"), trip_id=trip.id, schedule_id=sched.id,
        full_name=body.full_name, whatsapp_number=body.whatsapp_number, email=body.email,
        emergency_contact=body.emergency_contact, health_notes=body.health_notes,
        participants=body.participants, shirt_size=body.shirt_size, drink_bonus=body.drink_bonus,
        agreed_terms=True, total_amount=total, payment_method=body.payment_method,
        payment_proof=body.payment_proof, payment_status="PENDING",
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    return ser(booking)


@api.get("/bookings/{booking_code}")
async def get_booking(booking_code: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Booking).where(Booking.booking_code == booking_code)
        .options(selectinload(Booking.trip), selectinload(Booking.schedule))
    )
    b = res.scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")
    data = ser(b)
    data["trip"] = ser(b.trip) if b.trip else None
    data["schedule"] = ser(b.schedule) if b.schedule else None
    if b.trip and data["payment_status"] == "APPROVED":
        data["wa_group_link"] = b.trip.wa_group_link
    return data


# ----------------------------- Public: apparel -----------------------------
@api.get("/apparel")
async def list_apparel(category: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    q = select(Apparel).where(Apparel.is_active == True)
    if category and category != "All":
        q = q.where(Apparel.category == category)
    rows = (await db.execute(q.order_by(Apparel.created_at.desc()))).scalars().all()
    return [ser(a) for a in rows]


@api.get("/apparel/{slug}")
async def get_apparel(slug: str, db: AsyncSession = Depends(get_db)):
    a = (await db.execute(select(Apparel).where(Apparel.slug == slug))).scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    return ser(a)


@api.post("/apparel-orders")
async def create_apparel_order(body: ApparelOrderIn, db: AsyncSession = Depends(get_db)):
    a = (await db.execute(select(Apparel).where(Apparel.id == body.apparel_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    if body.quantity < 1:
        raise HTTPException(status_code=400, detail="Jumlah tidak valid")
    total = a.price * body.quantity
    order = ApparelOrder(
        order_code=gen_code("APP"), apparel_id=a.id, product_name=a.name,
        full_name=body.full_name, whatsapp_number=body.whatsapp_number, email=body.email,
        address=body.address, size=body.size, color=body.color, quantity=body.quantity,
        unit_price=a.price, total_amount=total, payment_method=body.payment_method,
        payment_proof=body.payment_proof, payment_status="PENDING",
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return ser(order)


@api.get("/apparel-orders/{order_code}")
async def get_apparel_order(order_code: str, db: AsyncSession = Depends(get_db)):
    o = (await db.execute(select(ApparelOrder).where(ApparelOrder.order_code == order_code))).scalar_one_or_none()
    if not o:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    return ser(o)


# ----------------------------- Public: blogs -----------------------------
@api.get("/blogs")
async def list_blogs(category: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    q = select(Blog).where(Blog.is_published == True)
    if category and category != "All":
        q = q.where(Blog.category == category)
    rows = (await db.execute(q.order_by(Blog.published_at.desc()))).scalars().all()
    return [ser(b, exclude=("content",)) for b in rows]


@api.get("/blogs/{slug}")
async def get_blog(slug: str, db: AsyncSession = Depends(get_db)):
    b = (await db.execute(select(Blog).where(Blog.slug == slug))).scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")
    return ser(b)


# ----------------------------- Public: reviews -----------------------------
@api.get("/reviews")
async def list_reviews(trip_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    q = select(Review).where(Review.is_approved == True)
    if trip_id:
        q = q.where(Review.trip_id == trip_id)
    rows = (await db.execute(q.order_by(Review.created_at.desc()))).scalars().all()
    return [ser(r) for r in rows]


@api.post("/reviews")
async def create_review(body: ReviewIn, db: AsyncSession = Depends(get_db)):
    b = (await db.execute(select(Booking).where(Booking.booking_code == body.booking_code))).scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail="Kode booking tidak ditemukan")
    if b.payment_status != "APPROVED":
        raise HTTPException(status_code=400, detail="Ulasan hanya untuk booking yang sudah dikonfirmasi")
    existing = (await db.execute(select(Review).where(Review.booking_id == b.id))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Booking ini sudah memiliki ulasan")
    r = Review(booking_id=b.id, trip_id=b.trip_id, reviewer_name=b.full_name,
               rating=max(1, min(5, body.rating)), comment=body.comment, is_approved=False)
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return ser(r)


# =============================================================================
#  ADMIN ROUTES
# =============================================================================
@api.get("/admin/overview")
async def admin_overview(admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    total_bookings = (await db.execute(select(func.count(Booking.id)))).scalar()
    pending = (await db.execute(select(func.count(Booking.id)).where(Booking.payment_status == "PENDING"))).scalar()
    approved = (await db.execute(select(func.count(Booking.id)).where(Booking.payment_status == "APPROVED"))).scalar()
    revenue = (await db.execute(select(func.coalesce(func.sum(Booking.total_amount), 0)).where(Booking.payment_status == "APPROVED"))).scalar()
    apparel_orders = (await db.execute(select(func.count(ApparelOrder.id)))).scalar()
    apparel_rev = (await db.execute(select(func.coalesce(func.sum(ApparelOrder.total_amount), 0)).where(ApparelOrder.payment_status == "APPROVED"))).scalar()
    trips = (await db.execute(select(func.count(Trip.id)))).scalar()
    blogs = (await db.execute(select(func.count(Blog.id)))).scalar()
    pending_reviews = (await db.execute(select(func.count(Review.id)).where(Review.is_approved == False))).scalar()
    return {
        "total_bookings": total_bookings, "pending_bookings": pending, "approved_bookings": approved,
        "trip_revenue": revenue, "apparel_orders": apparel_orders, "apparel_revenue": apparel_rev,
        "total_trips": trips, "total_blogs": blogs, "pending_reviews": pending_reviews,
    }


# ----- Trips CRUD -----
@api.post("/admin/trips")
async def create_trip(body: TripIn, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    data = body.model_dump()
    scheds = data.pop("schedules")
    slug = slugify(data["title"])
    if (await db.execute(select(Trip).where(Trip.slug == slug))).scalar_one_or_none():
        slug = f"{slug}-{gen_code('')[-4:].lower()}"
    trip = Trip(slug=slug, **data)
    db.add(trip)
    await db.flush()
    for s in scheds:
        db.add(TripSchedule(trip_id=trip.id, event_date=s["event_date"], quota=min(s["quota"], 15)))
    await db.commit()
    res = await db.execute(select(Trip).where(Trip.id == trip.id).options(selectinload(Trip.schedules)))
    return await trip_payload(db, res.scalar_one())


@api.put("/admin/trips/{trip_id}")
async def update_trip(trip_id: str, body: TripIn, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Trip).where(Trip.id == trip_id).options(selectinload(Trip.schedules)))
    trip = res.scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip tidak ditemukan")
    data = body.model_dump()
    scheds = data.pop("schedules")
    for k, v in data.items():
        setattr(trip, k, v)
    # replace schedules
    await db.execute(sa_delete(TripSchedule).where(TripSchedule.trip_id == trip.id))
    for s in scheds:
        db.add(TripSchedule(trip_id=trip.id, event_date=s["event_date"], quota=min(s["quota"], 15)))
    await db.commit()
    res = await db.execute(select(Trip).where(Trip.id == trip.id).options(selectinload(Trip.schedules)))
    return await trip_payload(db, res.scalar_one())


@api.delete("/admin/trips/{trip_id}")
async def delete_trip(trip_id: str, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    trip = (await db.execute(select(Trip).where(Trip.id == trip_id))).scalar_one_or_none()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip tidak ditemukan")
    await db.delete(trip)
    await db.commit()
    return {"ok": True}


# ----- Bookings admin -----
@api.get("/admin/bookings")
async def admin_bookings(status: Optional[str] = None, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    q = select(Booking).options(selectinload(Booking.trip), selectinload(Booking.schedule))
    if status and status != "ALL":
        q = q.where(Booking.payment_status == status)
    rows = (await db.execute(q.order_by(Booking.created_at.desc()))).scalars().all()
    out = []
    for b in rows:
        d = ser(b)
        d["trip"] = {"title": b.trip.title, "location": b.trip.location} if b.trip else None
        d["schedule"] = {"event_date": b.schedule.event_date.isoformat()} if b.schedule else None
        out.append(d)
    return out


@api.put("/admin/bookings/{booking_id}")
async def admin_update_booking(booking_id: str, body: BookingUpdateIn, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    b = (await db.execute(select(Booking).where(Booking.id == booking_id))).scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(b, k, v)
    await db.commit()
    await db.refresh(b)
    return ser(b)


@api.delete("/admin/bookings/{booking_id}")
async def admin_delete_booking(booking_id: str, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    b = (await db.execute(select(Booking).where(Booking.id == booking_id))).scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail="Booking tidak ditemukan")
    await db.delete(b)
    await db.commit()
    return {"ok": True}


# ----- Apparel admin -----
@api.post("/admin/apparel")
async def create_apparel(body: ApparelIn, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    slug = slugify(body.name)
    if (await db.execute(select(Apparel).where(Apparel.slug == slug))).scalar_one_or_none():
        slug = f"{slug}-{gen_code('')[-4:].lower()}"
    a = Apparel(slug=slug, **body.model_dump())
    db.add(a)
    await db.commit()
    await db.refresh(a)
    return ser(a)


@api.put("/admin/apparel/{apparel_id}")
async def update_apparel(apparel_id: str, body: ApparelIn, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    a = (await db.execute(select(Apparel).where(Apparel.id == apparel_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    for k, v in body.model_dump().items():
        setattr(a, k, v)
    await db.commit()
    await db.refresh(a)
    return ser(a)


@api.delete("/admin/apparel/{apparel_id}")
async def delete_apparel(apparel_id: str, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    a = (await db.execute(select(Apparel).where(Apparel.id == apparel_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    await db.delete(a)
    await db.commit()
    return {"ok": True}


# ----- Apparel orders admin -----
@api.get("/admin/apparel-orders")
async def admin_apparel_orders(status: Optional[str] = None, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    q = select(ApparelOrder)
    if status and status != "ALL":
        q = q.where(ApparelOrder.payment_status == status)
    rows = (await db.execute(q.order_by(ApparelOrder.created_at.desc()))).scalars().all()
    return [ser(o) for o in rows]


@api.put("/admin/apparel-orders/{order_id}")
async def admin_update_apparel_order(order_id: str, body: BookingUpdateIn, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    o = (await db.execute(select(ApparelOrder).where(ApparelOrder.id == order_id))).scalar_one_or_none()
    if not o:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")
    patch = body.model_dump(exclude_none=True)
    if "payment_status" in patch:
        o.payment_status = patch["payment_status"]
    if "full_name" in patch:
        o.full_name = patch["full_name"]
    await db.commit()
    await db.refresh(o)
    return ser(o)


@api.get("/admin/reports/apparel")
async def apparel_report(admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(ApparelOrder).order_by(ApparelOrder.created_at.desc()))).scalars().all()
    agg = {}
    for o in rows:
        key = (o.product_name, o.size or "-")
        if key not in agg:
            agg[key] = {"product_name": o.product_name, "size": o.size or "-", "quantity": 0, "revenue": 0, "orders": 0}
        agg[key]["quantity"] += o.quantity
        agg[key]["orders"] += 1
        if o.payment_status == "APPROVED":
            agg[key]["revenue"] += o.total_amount
    return {
        "rows": list(agg.values()),
        "total_orders": len(rows),
        "total_quantity": sum(o.quantity for o in rows),
        "total_revenue": sum(o.total_amount for o in rows if o.payment_status == "APPROVED"),
        "generated_at": datetime.now().isoformat(),
    }


# ----- Blogs admin -----
@api.post("/admin/blogs")
async def create_blog(body: BlogIn, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    slug = slugify(body.title)
    if (await db.execute(select(Blog).where(Blog.slug == slug))).scalar_one_or_none():
        slug = f"{slug}-{gen_code('')[-4:].lower()}"
    b = Blog(slug=slug, author_id=admin.id, **body.model_dump())
    db.add(b)
    await db.commit()
    await db.refresh(b)
    return ser(b)


@api.put("/admin/blogs/{blog_id}")
async def update_blog(blog_id: str, body: BlogIn, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    b = (await db.execute(select(Blog).where(Blog.id == blog_id))).scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")
    for k, v in body.model_dump().items():
        setattr(b, k, v)
    await db.commit()
    await db.refresh(b)
    return ser(b)


@api.delete("/admin/blogs/{blog_id}")
async def delete_blog(blog_id: str, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    b = (await db.execute(select(Blog).where(Blog.id == blog_id))).scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")
    await db.delete(b)
    await db.commit()
    return {"ok": True}


# ----- Reviews admin -----
@api.get("/admin/reviews")
async def admin_reviews(admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Review).order_by(Review.created_at.desc()))).scalars().all()
    return [ser(r) for r in rows]


@api.put("/admin/reviews/{review_id}")
async def admin_update_review(review_id: str, is_approved: bool, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(Review).where(Review.id == review_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Ulasan tidak ditemukan")
    r.is_approved = is_approved
    await db.commit()
    await db.refresh(r)
    return ser(r)


@api.delete("/admin/reviews/{review_id}")
async def admin_delete_review(review_id: str, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(Review).where(Review.id == review_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Ulasan tidak ditemukan")
    await db.delete(r)
    await db.commit()
    return {"ok": True}


# ----- Settings admin -----
@api.get("/admin/settings")
async def admin_get_settings(admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    return await get_settings_dict(db)


@api.put("/admin/settings")
async def admin_update_settings(body: dict, admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    for k, v in body.items():
        row = (await db.execute(select(Setting).where(Setting.key == k))).scalar_one_or_none()
        if row:
            row.value = str(v)
        else:
            db.add(Setting(key=k, value=str(v)))
    await db.commit()
    return await get_settings_dict(db)


# ----- Admin users / roles (superadmin) -----
@api.get("/admin/admins")
async def list_admins(admin: Admin = Depends(require_superadmin), db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Admin).order_by(Admin.created_at))).scalars().all()
    return [ser(a, exclude=("password_hash",)) for a in rows]


@api.post("/admin/admins")
async def create_admin(body: AdminIn, admin: Admin = Depends(require_superadmin), db: AsyncSession = Depends(get_db)):
    if (await db.execute(select(Admin).where((Admin.username == body.username) | (Admin.email == body.email)))).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username atau email sudah dipakai")
    a = Admin(username=body.username, email=body.email, name=body.name,
              password_hash=hash_password(body.password),
              role=body.role if body.role in ("admin", "superadmin") else "admin")
    db.add(a)
    await db.commit()
    await db.refresh(a)
    return ser(a, exclude=("password_hash",))


@api.put("/admin/admins/{admin_id}")
async def update_admin(admin_id: str, body: AdminUpdateIn, admin: Admin = Depends(require_superadmin), db: AsyncSession = Depends(get_db)):
    a = (await db.execute(select(Admin).where(Admin.id == admin_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Admin tidak ditemukan")
    patch = body.model_dump(exclude_none=True)
    if "password" in patch:
        a.password_hash = hash_password(patch.pop("password"))
    for k, v in patch.items():
        setattr(a, k, v)
    await db.commit()
    await db.refresh(a)
    return ser(a, exclude=("password_hash",))


@api.delete("/admin/admins/{admin_id}")
async def delete_admin(admin_id: str, admin: Admin = Depends(require_superadmin), db: AsyncSession = Depends(get_db)):
    if admin.id == admin_id:
        raise HTTPException(status_code=400, detail="Tidak bisa menghapus akun sendiri")
    a = (await db.execute(select(Admin).where(Admin.id == admin_id))).scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Admin tidak ditemukan")
    await db.delete(a)
    await db.commit()
    return {"ok": True}


# ----- DB info & export (migration mechanism) -----
@api.get("/admin/db-info")
async def db_info(admin: Admin = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    ver = (await db.execute(text("select version()"))).scalar()
    rev = (await db.execute(text("select version_num from alembic_version"))).scalar()
    return {"engine": "PostgreSQL (Supabase)", "version": ver, "alembic_revision": rev}


@api.get("/admin/export")
async def export_data(admin: Admin = Depends(require_superadmin), db: AsyncSession = Depends(get_db)):
    """Full data export (JSON) — portable backup / migration helper."""
    payload = {}
    for name, model in [
        ("trips", Trip), ("trip_schedules", TripSchedule), ("bookings", Booking),
        ("apparel", Apparel), ("apparel_orders", ApparelOrder), ("blogs", Blog),
        ("reviews", Review), ("settings", Setting),
    ]:
        rows = (await db.execute(select(model))).scalars().all()
        payload[name] = [ser(r) for r in rows]
    payload["exported_at"] = datetime.now().isoformat()
    return payload


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
