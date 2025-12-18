"""
Certificate Generation Models
SQLAlchemy models for certificate management system
"""

from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import hashlib

Base = declarative_base()

class Student(Base):
    __tablename__ = 'students'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_custom_id = Column(String(50), unique=True, nullable=False)  # CSL-2024-001
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    mobile = Column(String(20), nullable=False)
    address = Column(Text, nullable=False)
    date_of_birth = Column(Date)
    status = Column(String(20), default='active')  # active, inactive, suspended
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    
    # Relationships
    certificates = relationship("Certificate", back_populates="student")
    enrollments = relationship("StudentCourse", back_populates="student")
    
    def __repr__(self):
        return f"<Student(id={self.id}, name='{self.full_name}', email='{self.email}')>"

class Course(Base):
    __tablename__ = 'courses'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    course_code = Column(String(2), unique=True, nullable=False)  # 2-letter code (WD, DS, CS, etc.)
    course_name = Column(String(100), nullable=False)
    description = Column(Text)
    duration_months = Column(Integer)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    
    # Relationships
    certificates = relationship("Certificate", back_populates="course")
    enrollments = relationship("StudentCourse", back_populates="course")
    
    def __repr__(self):
        return f"<Course(id={self.id}, code='{self.course_code}', name='{self.course_name}')>"

class Certificate(Base):
    __tablename__ = 'certificates'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey('students.id'), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False)
    serial_number = Column(String(20), unique=True, nullable=False)  # YYYY-CC-NNNN-VVVVVV
    sequential_part = Column(Integer, nullable=False)  # The NNNN part as integer
    hash_part = Column(String(6), nullable=False)  # The VVVVVV verification hash
    issue_date = Column(Date, default=datetime.utcnow().date)
    issue_year = Column(Integer, nullable=False)  # Extracted year for easier querying
    status = Column(String(20), default='active')  # active, revoked, suspended
    revoked_at = Column(DateTime, nullable=True)
    revoked_by = Column(Integer, nullable=True)  # Admin who revoked
    revocation_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = relationship("Student", back_populates="certificates")
    course = relationship("Course", back_populates="certificates")
    
    def __repr__(self):
        return f"<Certificate(id={self.id}, serial='{self.serial_number}', student_id={self.student_id}, course_id={self.course_id})>"

class StudentCourse(Base):
    """Junction table for student-course enrollments"""
    __tablename__ = 'student_courses'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey('students.id'), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False)
    enrollment_date = Column(DateTime, default=datetime.utcnow)
    completion_date = Column(DateTime, nullable=True)
    status = Column(String(20), default='enrolled')  # enrolled, completed, dropped, failed
    grade = Column(String(5), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
    
    # Unique constraint to prevent duplicate enrollments
    __table_args__ = (
        {'extend_existing': True},
    )
    
    def __repr__(self):
        return f"<StudentCourse(student_id={self.student_id}, course_id={self.course_id}, status='{self.status}')>"
