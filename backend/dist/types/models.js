"use strict";
/**
 * Database Models and Interfaces for CSL Management System
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentStatus = exports.CertificateStatus = exports.StudentStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["INSTRUCTOR"] = "instructor";
    UserRole["STUDENT"] = "student";
    UserRole["VIEWER"] = "viewer";
})(UserRole || (exports.UserRole = UserRole = {}));
var StudentStatus;
(function (StudentStatus) {
    StudentStatus["ACTIVE"] = "active";
    StudentStatus["GRADUATED"] = "graduated";
    StudentStatus["SUSPENDED"] = "suspended";
    StudentStatus["WITHDRAWN"] = "withdrawn";
})(StudentStatus || (exports.StudentStatus = StudentStatus = {}));
var CertificateStatus;
(function (CertificateStatus) {
    CertificateStatus["ACTIVE"] = "active";
    CertificateStatus["REVOKED"] = "revoked";
    CertificateStatus["SUSPENDED"] = "suspended";
    CertificateStatus["EXPIRED"] = "expired";
})(CertificateStatus || (exports.CertificateStatus = CertificateStatus = {}));
var EnrollmentStatus;
(function (EnrollmentStatus) {
    EnrollmentStatus["ENROLLED"] = "enrolled";
    EnrollmentStatus["IN_PROGRESS"] = "in_progress";
    EnrollmentStatus["COMPLETED"] = "completed";
    EnrollmentStatus["DROPPED"] = "dropped";
    EnrollmentStatus["FAILED"] = "failed";
})(EnrollmentStatus || (exports.EnrollmentStatus = EnrollmentStatus = {}));
