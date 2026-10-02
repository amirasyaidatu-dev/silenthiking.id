import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Integer, Text, Boolean, DateTime, Date, ForeignKey, Numeric,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from database import Base


def gen_uuid():
    return str(uuid.uuid4())


def utcnow():
    return datetime.now(timezone.utc)


class Admin(Base):
    __tablename__ = "admins"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    username = Column(String(80), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(120), nullable=False, default="Admin")
    password_hash = Column(Text, nullable=False)
    role = Column(String(20), nullable=False, default="admin")  # admin | superadmin
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class Trip(Base):
    __tablename__ = "trips"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    title = Column(String(200), nullable=False)
    slug = Column(String(220), unique=True, nullable=False, index=True)
    location = Column(String(200), nullable=False)
    meeting_point = Column(String(200))
    difficulty = Column(String(20), nullable=False, default="Easy")  # Easy|Moderate|Private
    duration = Column(String(60), default="4 jam")
    min_age = Column(Integer, default=16)
    price = Column(Integer, nullable=False, default=0)
    description = Column(Text)
    included = Column(JSONB, default=list)        # ["Professional guide", ...]
    timeline = Column(JSONB, default=list)        # [{time, title, desc}]
    gallery_urls = Column(JSONB, default=list)
    wa_group_link = Column(Text)
    image_url = Column(Text)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    schedules = relationship("TripSchedule", back_populates="trip", cascade="all, delete-orphan")


class TripSchedule(Base):
    __tablename__ = "trip_schedules"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    trip_id = Column(String(36), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    event_date = Column(Date, nullable=False)
    quota = Column(Integer, nullable=False, default=15)   # max 15 per schedule
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    trip = relationship("Trip", back_populates="schedules")
    bookings = relationship("Booking", back_populates="schedule")


class Booking(Base):
    __tablename__ = "bookings"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    booking_code = Column(String(40), unique=True, nullable=False, index=True)
    trip_id = Column(String(36), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    schedule_id = Column(String(36), ForeignKey("trip_schedules.id", ondelete="SET NULL"), index=True)
    full_name = Column(String(150), nullable=False)
    whatsapp_number = Column(String(30), nullable=False)
    email = Column(String(255))
    emergency_contact = Column(String(150), nullable=False)
    health_notes = Column(Text)
    participants = Column(Integer, nullable=False, default=1)
    shirt_size = Column(String(5), nullable=False)          # XS..XXL (wajib)
    drink_bonus = Column(String(20), nullable=False)        # kopi | cokelat (wajib)
    agreed_terms = Column(Boolean, nullable=False, default=True)
    total_amount = Column(Integer, nullable=False, default=0)
    payment_method = Column(String(30), nullable=False, default="manual_transfer")
    payment_status = Column(String(20), nullable=False, default="PENDING", index=True)  # PENDING|APPROVED|REJECTED
    payment_proof = Column(Text)   # base64 data url
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    schedule = relationship("TripSchedule", back_populates="bookings")
    trip = relationship("Trip")
    review = relationship("Review", back_populates="booking", uselist=False, cascade="all, delete-orphan")


class Apparel(Base):
    __tablename__ = "apparel"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(150), nullable=False)
    slug = Column(String(170), unique=True, nullable=False, index=True)
    category = Column(String(30), nullable=False, default="Apparel", index=True)  # Apparel|Accessories|Merchandise|Limited Edition
    price = Column(Integer, nullable=False, default=0)
    image_url = Column(Text, nullable=False)
    gallery_urls = Column(JSONB, default=list)
    sizes = Column(JSONB, default=list)       # ["XS","S","M","L","XL","XXL"]
    colors = Column(JSONB, default=list)      # [{"name":"Forest Green","hex":"#2D4A3E"}]
    material = Column(String(200))
    fit = Column(String(120))
    stock = Column(Integer, nullable=False, default=10)
    description = Column(Text)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class ApparelOrder(Base):
    __tablename__ = "apparel_orders"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    order_code = Column(String(40), unique=True, nullable=False, index=True)
    apparel_id = Column(String(36), ForeignKey("apparel.id", ondelete="SET NULL"), index=True)
    product_name = Column(String(150), nullable=False)
    full_name = Column(String(150), nullable=False)
    whatsapp_number = Column(String(30), nullable=False)
    email = Column(String(255))
    address = Column(Text)
    size = Column(String(10))
    color = Column(String(60))
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Integer, nullable=False, default=0)
    total_amount = Column(Integer, nullable=False, default=0)
    payment_method = Column(String(30), nullable=False, default="manual_transfer")
    payment_status = Column(String(20), nullable=False, default="PENDING", index=True)
    payment_proof = Column(Text)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class Blog(Base):
    __tablename__ = "blogs"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    trip_id = Column(String(36), ForeignKey("trips.id", ondelete="SET NULL"), index=True)
    title = Column(String(220), nullable=False)
    slug = Column(String(240), unique=True, nullable=False, index=True)
    category = Column(String(40), nullable=False, default="Mindfulness", index=True)
    read_time = Column(String(30), default="5 min read")
    image_url = Column(Text, nullable=False)
    excerpt = Column(Text)
    content = Column(Text, nullable=False)
    author_id = Column(String(36), ForeignKey("admins.id", ondelete="SET NULL"))
    is_published = Column(Boolean, nullable=False, default=True)
    published_at = Column(DateTime(timezone=True), default=utcnow)


class Review(Base):
    __tablename__ = "reviews"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    trip_id = Column(String(36), ForeignKey("trips.id", ondelete="CASCADE"), index=True)
    reviewer_name = Column(String(150), nullable=False)
    rating = Column(Integer, nullable=False, default=5)
    comment = Column(Text)
    is_approved = Column(Boolean, nullable=False, default=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    booking = relationship("Booking", back_populates="review")


class Setting(Base):
    __tablename__ = "settings"
    key = Column(String(80), primary_key=True)
    value = Column(Text, nullable=False)
