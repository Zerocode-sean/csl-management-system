import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { body, param, query as queryValidator, validationResult } from 'express-validator';
import { StudentRepository } from '../repositories/StudentRepository';
import { CreateStudentDTO, UpdateStudentDTO, StudentStatus } from '../types/models';
import { logger } from '../utils/logger';

const router = Router();
const studentRepo = new StudentRepository();

// All student routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get students with pagination and search
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, student ID, or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, graduated, suspended, withdrawn]
 *       - in: query
 *         name: enrollment_year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: created_at
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: List of students
 */
router.get('/', 
  [
    queryValidator('page').optional().isInt({ min: 1 }).toInt(),
    queryValidator('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    queryValidator('search').optional().isString().trim(),
    queryValidator('status').optional().isIn(['active', 'graduated', 'suspended', 'withdrawn']),
    queryValidator('enrollment_year').optional().isInt().toInt(),
    queryValidator('sort_by').optional().isString(),
    queryValidator('sort_order').optional().isIn(['ASC', 'DESC'])
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const filters = {
      search: req.query.search as string,
      status: req.query.status as StudentStatus,
      enrollment_year: req.query.enrollment_year as number
    };

    const pagination = {
      page: req.query.page as number || 1,
      limit: req.query.limit as number || 20,
      sort_by: req.query.sort_by as string || 'created_at',
      sort_order: (req.query.sort_order as 'ASC' | 'DESC') || 'DESC'
    };

    const result = await studentRepo.search(filters, pagination);

    res.json({
      success: true,
      message: 'Students retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });
  })
);

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Get student by ID
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student details
 *       404:
 *         description: Student not found
 */
router.get('/:id',
  [
    param('id').isInt({ min: 1 }).toInt()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID',
        errors: errors.array()
      });
    }

    const student = await studentRepo.findById(req.params.id as unknown as number);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student retrieved successfully',
      data: student
    });
  })
);

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Create new student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_id
 *               - first_name
 *               - last_name
 *               - email
 *             properties:
 *               student_id:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               address:
 *                 type: string
 *               enrollment_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Student created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Student ID or email already exists
 */
router.post('/',
  authorizeRoles(['admin', 'instructor']),
  [
    body('student_id').notEmpty().isString().trim(),
    body('first_name').notEmpty().isString().trim().isLength({ min: 2, max: 50 }),
    body('last_name').notEmpty().isString().trim().isLength({ min: 2, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().isMobilePhone('any'),
    body('date_of_birth').optional().isISO8601().toDate(),
    body('address').optional().isString().trim().isLength({ max: 500 }),
    body('enrollment_date').optional().isISO8601().toDate()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if student ID already exists
    const existingStudentId = await studentRepo.existsByStudentId(req.body.student_id);
    if (existingStudentId) {
      return res.status(409).json({
        success: false,
        message: 'Student ID already exists'
      });
    }

    // Check if email already exists
    const existingEmail = await studentRepo.existsByEmail(req.body.email);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const studentData: CreateStudentDTO = {
      student_id: req.body.student_id,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      phone: req.body.phone,
      date_of_birth: req.body.date_of_birth,
      address: req.body.address,
      enrollment_date: req.body.enrollment_date
    };

    const student = await studentRepo.create(studentData);

    logger.info('Student created', { 
      student_id: student.student_id, 
      created_by: req.user?.id 
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });
  })
);

/**
 * @swagger
 * /students/{id}:
 *   put:
 *     summary: Update student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, graduated, suspended, withdrawn]
 *     responses:
 *       200:
 *         description: Student updated successfully
 *       404:
 *         description: Student not found
 */
router.put('/:id',
  authorizeRoles(['admin', 'instructor']),
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('first_name').optional().isString().trim().isLength({ min: 2, max: 50 }),
    body('last_name').optional().isString().trim().isLength({ min: 2, max: 50 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isMobilePhone('any'),
    body('address').optional().isString().trim().isLength({ max: 500 }),
    body('status').optional().isIn(['active', 'graduated', 'suspended', 'withdrawn'])
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const studentId = req.params.id as unknown as number;

    // Check if email already exists (excluding current student)
    if (req.body.email) {
      const existingEmail = await studentRepo.existsByEmail(req.body.email, studentId);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const updateData: UpdateStudentDTO = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      status: req.body.status as StudentStatus
    };

    try {
      const student = await studentRepo.update(studentId, updateData);

      logger.info('Student updated', { 
        student_id: studentId, 
        updated_by: req.user?.id 
      });

      res.json({
        success: true,
        message: 'Student updated successfully',
        data: student
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Student not found') {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }
      throw error;
    }
  })
);

/**
 * @swagger
 * /students/{id}:
 *   delete:
 *     summary: Delete student (soft delete)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       404:
 *         description: Student not found
 */
router.delete('/:id',
  authorizeRoles(['admin']),
  [
    param('id').isInt({ min: 1 }).toInt()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID',
        errors: errors.array()
      });
    }

    const studentId = req.params.id as unknown as number;

    try {
      await studentRepo.delete(studentId);

      logger.info('Student deleted', { 
        student_id: studentId, 
        deleted_by: req.user?.id 
      });

      res.json({
        success: true,
        message: 'Student deleted successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Student not found') {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }
      throw error;
    }
  })
);

/**
 * @swagger
 * /students/{id}/certificates:
 *   get:
 *     summary: Get certificates for a student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student certificates
 *       404:
 *         description: Student not found
 */
router.get('/:id/certificates',
  [
    param('id').isInt({ min: 1 }).toInt()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID',
        errors: errors.array()
      });
    }

    const studentId = req.params.id as unknown as number;
    
    const student = await studentRepo.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // This would use CertificateRepository in a full implementation
    // For now, return empty array as placeholder
    res.json({
      success: true,
      message: 'Student certificates retrieved successfully',
      data: []
    });
  })
);

export default router;
