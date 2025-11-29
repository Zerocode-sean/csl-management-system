import { Student, CreateStudentDTO, UpdateStudentDTO, StudentSearchFilter, PaginationOptions, PaginatedResponse } from '../types/models';
export declare class StudentRepository {
    /**
     * Create a new student
     */
    create(data: CreateStudentDTO): Promise<Student>;
    /**
     * Find student by ID
     */
    findById(id: number): Promise<Student | null>;
    /**
     * Find student by student ID
     */
    findByStudentId(studentId: string): Promise<Student | null>;
    /**
     * Update student
     */
    update(id: number, data: UpdateStudentDTO): Promise<Student>;
    /**
     * Delete student (soft delete)
     */
    delete(id: number): Promise<void>;
    /**
     * Search students with pagination
     */
    search(filters?: StudentSearchFilter, pagination?: PaginationOptions): Promise<PaginatedResponse<Student>>;
    /**
     * Get students by course
     */
    findByCourse(courseId: number): Promise<Student[]>;
    /**
     * Check if student ID exists
     */
    existsByStudentId(studentId: string, excludeId?: number): Promise<boolean>;
    /**
     * Check if email exists
     */
    existsByEmail(email: string, excludeId?: number): Promise<boolean>;
}
//# sourceMappingURL=StudentRepository.d.ts.map