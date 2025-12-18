"""
Certificate Serial Number Generation
Handles the generation of unique certificate serial numbers
"""

import hashlib
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from models.certificate_models import Certificate, Course
from typing import Tuple

def generate_serial_number(db: Session, student_id: int, course_id: int) -> Tuple[str, int, str]:
    """
    Generate a unique certificate serial number in format: YYYY-CC-NNNN-VVVVVV
    
    Args:
        db: SQLAlchemy database session
        student_id: ID of the student
        course_id: ID of the course
        
    Returns:
        Tuple containing (serial_number, sequential_part, hash_part)
        
    Example:
        ('2024-WD-0001-A1B2C3', 1, 'A1B2C3')
    """
    
    # Get current year
    current_year = datetime.now().year
    
    # Get the course to retrieve the 2-letter code
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise ValueError(f"Course with ID {course_id} not found")
    
    course_code = course.course_code.upper()
    
    # Find the maximum sequential number for this course and year
    max_sequential = db.query(func.max(Certificate.sequential_part)).filter(
        and_(
            Certificate.course_id == course_id,
            Certificate.issue_year == current_year
        )
    ).scalar()
    
    # Calculate next sequential number (starts from 1 each year)
    next_sequential = (max_sequential or 0) + 1
    
    # Format sequential number with zero padding (4 digits)
    sequential_str = f"{next_sequential:04d}"
    
    # Create verification hash
    hash_input = f"{student_id}-{course_id}-{current_year}-{sequential_str}"
    hash_object = hashlib.sha256(hash_input.encode())
    hash_hex = hash_object.hexdigest()
    
    # Take first 6 characters and convert to uppercase
    verification_hash = hash_hex[:6].upper()
    
    # Construct the full serial number
    serial_number = f"{current_year}-{course_code}-{sequential_str}-{verification_hash}"
    
    return serial_number, next_sequential, verification_hash

def validate_serial_number(serial_number: str) -> bool:
    """
    Validate the format of a certificate serial number
    
    Args:
        serial_number: Serial number to validate
        
    Returns:
        True if valid format, False otherwise
    """
    import re
    
    # Pattern: YYYY-CC-NNNN-VVVVVV
    pattern = r'^\d{4}-[A-Z]{2}-\d{4}-[A-F0-9]{6}$'
    return bool(re.match(pattern, serial_number))

def verify_certificate_authenticity(db: Session, serial_number: str) -> dict:
    """
    Verify if a certificate is authentic by checking the hash
    
    Args:
        db: SQLAlchemy database session
        serial_number: Certificate serial number to verify
        
    Returns:
        Dictionary with verification results
    """
    
    if not validate_serial_number(serial_number):
        return {
            'is_valid': False,
            'reason': 'Invalid serial number format',
            'certificate': None
        }
    
    # Find certificate in database
    certificate = db.query(Certificate).filter(
        Certificate.serial_number == serial_number
    ).first()
    
    if not certificate:
        return {
            'is_valid': False,
            'reason': 'Certificate not found in database',
            'certificate': None
        }
    
    # Check if certificate is revoked or suspended
    if certificate.status != 'active':
        return {
            'is_valid': False,
            'reason': f'Certificate status is {certificate.status}',
            'certificate': certificate
        }
    
    # Verify the hash part
    parts = serial_number.split('-')
    year, course_code, sequential, provided_hash = parts
    
    # Regenerate hash to verify authenticity
    hash_input = f"{certificate.student_id}-{certificate.course_id}-{year}-{sequential}"
    hash_object = hashlib.sha256(hash_input.encode())
    expected_hash = hash_object.hexdigest()[:6].upper()
    
    if provided_hash != expected_hash:
        return {
            'is_valid': False,
            'reason': 'Hash verification failed - certificate may be forged',
            'certificate': certificate
        }
    
    return {
        'is_valid': True,
        'reason': 'Certificate is authentic and valid',
        'certificate': certificate
    }

def get_certificate_stats_by_year(db: Session, year: int = None) -> dict:
    """
    Get statistics about certificates issued in a specific year
    
    Args:
        db: SQLAlchemy database session
        year: Year to get stats for (defaults to current year)
        
    Returns:
        Dictionary with certificate statistics
    """
    
    if year is None:
        year = datetime.now().year
    
    # Total certificates issued this year
    total_certificates = db.query(Certificate).filter(
        Certificate.issue_year == year
    ).count()
    
    # Certificates by course
    course_stats = db.query(
        Course.course_code,
        Course.course_name,
        func.count(Certificate.id).label('count')
    ).join(
        Certificate, Course.id == Certificate.course_id
    ).filter(
        Certificate.issue_year == year
    ).group_by(
        Course.id, Course.course_code, Course.course_name
    ).all()
    
    # Active vs revoked certificates
    status_stats = db.query(
        Certificate.status,
        func.count(Certificate.id).label('count')
    ).filter(
        Certificate.issue_year == year
    ).group_by(
        Certificate.status
    ).all()
    
    return {
        'year': year,
        'total_certificates': total_certificates,
        'by_course': [
            {
                'course_code': stat[0],
                'course_name': stat[1],
                'count': stat[2]
            } for stat in course_stats
        ],
        'by_status': [
            {
                'status': stat[0],
                'count': stat[1]
            } for stat in status_stats
        ]
    }
