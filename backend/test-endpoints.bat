@echo off
echo Testing CSL Backend API Endpoints...
echo ===================================

echo.
echo Testing Health Endpoint...
curl -s http://localhost:5001/health

echo.
echo.
echo Testing Students API...
curl -s http://localhost:5001/api/students

echo.
echo.
echo Testing Courses API...
curl -s http://localhost:5001/api/courses

echo.
echo.
echo Testing Certificates API...
curl -s http://localhost:5001/api/certificates

echo.
echo.
echo Testing Certificate Verification...
curl -s http://localhost:5001/api/verification/verify/CSL-2025-001

echo.
echo.
echo All endpoint tests completed!
echo Visit http://localhost:5001/api-docs for Swagger documentation
pause
