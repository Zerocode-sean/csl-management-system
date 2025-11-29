import { Course, CreateCourseDTO, UpdateCourseDTO, CourseSearchFilter, PaginationOptions, PaginatedResponse } from '../types/models';
export declare class CourseRepository {
    /**
     * Create a new course
     */
    create(data: CreateCourseDTO): Promise<Course>;
    /**
     * Find course by ID
     */
    findById(id: number): Promise<Course | null>;
    /**
     * Find course by course code
     */
    findByCourseCode(courseCode: string): Promise<Course | null>;
    /**
     * Update course
     */
    update(id: number, data: UpdateCourseDTO): Promise<Course>;
    /**
     * Delete course (soft delete)
     */
    delete(id: number): Promise<void>;
    /**
     * Search courses with pagination
     */
    search(filters?: CourseSearchFilter, pagination?: PaginationOptions): Promise<PaginatedResponse<Course>>;
    /**
     * Get all active courses
     */
    findAllActive(): Promise<Course[]>;
    /**
     * Get courses by category
     */
    findByCategory(category: string): Promise<Course[]>;
    /**
     * Check if course code exists
     */
    existsByCourseCode(courseCode: string, excludeId?: number): Promise<boolean>;
    /**
     * Get course statistics
     */
    getStatistics(): Promise<{
        total: number;
        active: number;
        by_category: {
            category: string;
            count: number;
        }[];
    }>;
}
//# sourceMappingURL=CourseRepository.d.ts.map