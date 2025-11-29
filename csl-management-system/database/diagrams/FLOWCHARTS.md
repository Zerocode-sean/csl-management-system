# CSL Management System - Flow Charts

## 1. Admin Authentication Flow

```mermaid
flowchart TD
    A[Start: Admin Access Dashboard] --> B{Has Valid Session?}
    B -->|Yes| C[Display Dashboard]
    B -->|No| D[Show Login Page]
    D --> E[Enter Credentials]
    E --> F{Credentials Valid?}
    F -->|No| G[Show Error Message]
    G --> H{Retry Attempts < 3?}
    H -->|Yes| D
    H -->|No| I[Lock Account for 15 mins]
    I --> J[Send Alert to Super Admin]
    J --> K[End]
    F -->|Yes| L{MFA Enabled?}
    L -->|Yes| M[Send OTP]
    M --> N[Enter OTP]
    N --> O{OTP Valid?}
    O -->|No| G
    O -->|Yes| P[Generate JWT Token]
    L -->|No| P
    P --> Q[Log Authentication Event]
    Q --> C
    C --> R{Select Action}
    R -->|Manage Courses| S[Course Management Module]
    R -->|Manage Students| T[Student Management Module]
    R -->|Issue Certificate| U[Certificate Issuance Module]
    R -->|View Reports| V[Reports Module]
    R -->|Logout| W[Destroy Session]
    W --> K
```

## 2. Certificate Issuance Flow

```mermaid
flowchart TD
    A[Start: Admin Selects Issue Certificate] --> B[Load Active Courses List]
    B --> C[Load Active Students List]
    C --> D[Admin Selects Student]
    D --> E[Admin Selects Course]
    E --> F{Validate Selection}
    F -->|Invalid| G[Display Error: Missing/Inactive Data]
    G --> H[Return to Selection]
    H --> D
    F -->|Valid| I{Check Duplicate Certificate}
    I -->|Exists| J[Display Warning: Certificate Already Issued]
    J --> K{Override?}
    K -->|No| H
    K -->|Yes| L[Mark Old as Revoked]
    L --> M[Proceed to Generation]
    I -->|Not Exists| M
    M --> N[Get Current Year YYYY]
    N --> O[Get Course Code CC]
    O --> P[Query Max Sequential Number for Year+Course]
    P --> Q[Increment Sequential NNNN]
    Q --> R[Concatenate: YYYY-CC-NNNN]
    R --> S[Generate Verification Hash VVVVVV]
    S --> T[Hash = SHA256 student_id + YYYY-CC-NNNN + PEPPER]
    T --> U[Truncate to 6 chars]
    U --> V[Final CSL = YYYY-CC-NNNN-VVVVVV]
    V --> W[Save to Database]
    W --> X{Save Successful?}
    X -->|No| Y[Display Error: DB Issue]
    Y --> Z[End]
    X -->|Yes| AA[Log Audit Event]
    AA --> AB[Display Success with CSL Number]
    AB --> AC[Generate Printable Certificate PDF]
    AC --> AD{Send Email Notification?}
    AD -->|Yes| AE[Send to Student Email]
    AD -->|No| AF[End]
    AE --> AF
```

## 3. Public Certificate Verification Flow

```mermaid
flowchart TD
    A[Start: User Accesses Verification Portal] --> B[Display Input Form]
    B --> C[User Enters CSL Number]
    C --> D{Format Valid YYYY-CC-NNNN-VVVVVV?}
    D -->|No| E[Display Error: Invalid Format]
    E --> F[Return to Form]
    F --> C
    D -->|Yes| G{Rate Limit Check}
    G -->|Exceeded| H[Display Error: Too Many Requests]
    H --> I[End]
    G -->|OK| J[Submit to API: GET /verify/CSL]
    J --> K[Query Database for CSL Number]
    K --> L{CSL Exists?}
    L -->|No| M[Log Failed Attempt]
    M --> N[Display: Certificate Not Found]
    N --> I
    L -->|Yes| O{Status = Active?}
    O -->|No Revoked/Suspended| P[Display: Certificate Invalid/Revoked]
    P --> Q[Show Revocation Date if applicable]
    Q --> I
    O -->|Yes| R[Verify Hash Integrity]
    R --> S[Recompute Hash using student_id + CSL + PEPPER]
    S --> T{Hash Matches?}
    T -->|No| U[Log Potential Forgery Attempt]
    U --> V[Display: Certificate Invalid Authentication Failed]
    V --> I
    T -->|Yes| W[Log Successful Verification]
    W --> X[Display Certificate Details]
    X --> Y[Show: Student Name, Course Title, Issue Date]
    Y --> Z{User Requests Full Details?}
    Z -->|No| I
    Z -->|Yes| AA{Admin Authenticated?}
    AA -->|No| AB[Display: Login Required for Full Details]
    AB --> I
    AA -->|Yes| AC[Show Complete Certificate Data]
    AC --> I
```

## 4. Course Management CRUD Flow

```mermaid
flowchart TD
    A[Start: Admin Selects Course Management] --> B{Select Action}
    B -->|Create| C[Display Create Form]
    C --> D[Enter Code, Title, Description, Duration]
    D --> E{Validate Input}
    E -->|Invalid| F[Show Validation Errors]
    F --> C
    E -->|Valid| G{Code Already Exists?}
    G -->|Yes| H[Display Error: Duplicate Code]
    H --> C
    G -->|No| I[Save Course to DB]
    I --> J[Log Audit Event]
    J --> K[Display Success]
    K --> L[Return to Course List]
    
    B -->|Read/View| M[Query All Courses]
    M --> N[Display Course List with Search/Filter]
    N --> O{Select Course?}
    O -->|Yes| P[Display Course Details]
    P --> Q{Edit or Back?}
    Q -->|Edit| R[Go to Update Flow]
    Q -->|Back| N
    O -->|No| L
    
    B -->|Update| R
    R --> S[Load Course Data into Form]
    S --> T[Modify Fields]
    T --> U{Validate Changes}
    U -->|Invalid| V[Show Errors]
    V --> S
    U -->|Valid| W[Update DB]
    W --> X[Log Audit Event]
    X --> Y[Display Success]
    Y --> L
    
    B -->|Delete| Z[Select Course to Delete]
    Z --> AA{Course Has Active Certificates?}
    AA -->|Yes| AB[Display Warning: Cannot Delete]
    AB --> AC[Suggest Deactivate Instead]
    AC --> L
    AA -->|No| AD[Confirm Deletion]
    AD --> AE{Confirmed?}
    AE -->|No| L
    AE -->|Yes| AF[Soft Delete set deleted_at]
    AF --> AG[Log Audit Event]
    AG --> AH[Display Success]
    AH --> L
```

## 5. Student Management CRUD Flow

```mermaid
flowchart TD
    A[Start: Admin Selects Student Management] --> B{Select Action}
    B -->|Create| C[Display Registration Form]
    C --> D[Enter Name, Email, Mobile, Address]
    D --> E{Validate Input}
    E -->|Invalid| F[Show Validation Errors]
    F --> C
    E -->|Valid| G{Email Already Exists?}
    G -->|Yes| H[Display Error: Duplicate Email]
    H --> C
    G -->|No| I[Save Student to DB]
    I --> J[Log Audit Event]
    J --> K[Display Success]
    K --> L[Return to Student List]
    
    B -->|Read/View| M[Query All Active Students]
    M --> N[Display Student List with Search]
    N --> O{Select Student?}
    O -->|Yes| P[Display Student Profile]
    P --> Q[Show: Personal Info + Certificate History]
    Q --> R{Action?}
    R -->|Edit| S[Go to Update Flow]
    R -->|View Certificates| T[Display Student's Certificates]
    T --> P
    R -->|Back| N
    O -->|No| L
    
    B -->|Update| S
    S --> U[Load Student Data]
    U --> V[Modify Fields]
    V --> W{Validate Changes}
    W -->|Invalid| X[Show Errors]
    X --> U
    W -->|Valid| Y[Update DB]
    Y --> Z[Log Audit Event]
    Z --> AA[Display Success]
    AA --> L
    
    B -->|Delete| AB[Select Student to Delete]
    AB --> AC{Student Has Certificates?}
    AC -->|Yes| AD[Display Warning: Cannot Permanently Delete]
    AD --> AE[Soft Delete Only]
    AE --> AF[Confirm Soft Delete]
    AF --> AG{Confirmed?}
    AG -->|No| L
    AG -->|Yes| AH[Set deleted_at timestamp]
    AH --> AI[Log Audit Event]
    AI --> AJ[Display Success]
    AJ --> L
    AC -->|No| AK[Confirm Permanent Delete]
    AK --> AL{Confirmed?}
    AL -->|No| L
    AL -->|Yes| AM[Delete from DB]
    AM --> AI
```

## 6. Certificate Revocation Flow

```mermaid
flowchart TD
    A[Start: Admin Selects Revoke Certificate] --> B[Search for Certificate by CSL or Student]
    B --> C{Certificate Found?}
    C -->|No| D[Display Error: Not Found]
    D --> E[End]
    C -->|Yes| F[Display Certificate Details]
    F --> G{Current Status?}
    G -->|Already Revoked| H[Display: Already Revoked]
    H --> E
    G -->|Active| I[Display Revocation Form]
    I --> J[Enter Revocation Reason]
    J --> K{Confirm Revocation?}
    K -->|No| L[Cancel Operation]
    L --> E
    K -->|Yes| M[Update Status to 'revoked']
    M --> N[Set revoked_at = NOW]
    N --> O[Set revoked_by_admin_id]
    O --> P[Save Revocation Reason]
    P --> Q[Log Audit Event]
    Q --> R{Send Notification?}
    R -->|Yes| S[Email Student about Revocation]
    R -->|No| T[Display Success]
    S --> T
    T --> E
```

## 7. System Backup and Recovery Flow

```mermaid
flowchart TD
    A[Scheduled Backup Trigger Daily] --> B[Check Database Connection]
    B --> C{Connection OK?}
    C -->|No| D[Log Error]
    D --> E[Alert Admin]
    E --> F[End]
    C -->|Yes| G[Execute pg_dump Command]
    G --> H[Compress Backup File]
    H --> I[Generate Filename: csl_backup_YYYYMMDD_HHMMSS.sql.gz]
    I --> J[Upload to Cloud Storage]
    J --> K{Upload Successful?}
    K -->|No| D
    K -->|Yes| L[Verify Backup Integrity]
    L --> M{Integrity Check Pass?}
    M -->|No| D
    M -->|Yes| N[Log Success]
    N --> O[Delete Backups Older than 30 days]
    O --> F
    
    P[Recovery Trigger: Admin Request] --> Q[List Available Backups]
    Q --> R[Admin Selects Backup]
    R --> S[Confirm Recovery Overwrites Current Data]
    S --> T{Confirmed?}
    T -->|No| U[Cancel Recovery]
    U --> F
    T -->|Yes| V[Stop Application Services]
    V --> W[Download Backup from Cloud]
    W --> X[Decompress Backup File]
    X --> Y[Drop Current Database Caution]
    Y --> Z[Restore from Backup File]
    Z --> AA{Restore Successful?}
    AA -->|No| AB[Log Critical Error]
    AB --> AC[Manual Intervention Required]
    AC --> F
    AA -->|Yes| AD[Restart Services]
    AD --> AE[Verify Application Functionality]
    AE --> AF[Log Recovery Event]
    AF --> F
```

## Flow Chart Legend

- **Rectangle**: Process/Action
- **Diamond**: Decision Point
- **Parallelogram**: Input/Output
- **Rounded Rectangle**: Start/End
- **Arrow**: Flow Direction

## Notes

1. All flows include audit logging for compliance
2. Error handling returns user to safe state
3. Rate limiting prevents abuse on public endpoints
4. MFA adds security layer for admin authentication
5. Soft deletes preserve data integrity
6. Backup strategy ensures 30-day retention minimum
