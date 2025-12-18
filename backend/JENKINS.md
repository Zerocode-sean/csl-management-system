# Jenkins CI/CD Setup Guide

## 🚀 Quick Start

Your backend is Jenkins-ready! The `Jenkinsfile` is configured to run automated tests on every commit.

## 📋 Prerequisites

### Required Jenkins Plugins
1. **NodeJS Plugin** - For Node.js/npm support
2. **JUnit Plugin** - For test result visualization
3. **HTML Publisher Plugin** - For coverage reports
4. **Pipeline Plugin** - For Jenkinsfile support (usually pre-installed)

### Install Plugins
```
Jenkins Dashboard → Manage Jenkins → Manage Plugins → Available
Search and install:
- NodeJS Plugin
- JUnit Plugin  
- HTML Publisher Plugin
```

## ⚙️ Jenkins Configuration

### 1. Configure Node.js
```
Manage Jenkins → Global Tool Configuration → NodeJS
- Click "Add NodeJS"
- Name: NodeJS-18
- Version: NodeJS 18.x (or latest LTS)
- ✅ Install automatically
- Save
```

### 2. Create Pipeline Job
```
New Item → Pipeline → Name: "CSL-Backend-Tests"

Pipeline Configuration:
- Definition: Pipeline script from SCM
- SCM: Git
- Repository URL: <your-git-repo>
- Branch: */main
- Script Path: backend/Jenkinsfile
- Save
```

## 📊 Pipeline Stages

The Jenkinsfile includes these stages:

| Stage | Description | Output |
|-------|-------------|--------|
| **Checkout** | Clone repository | Source code |
| **Install Dependencies** | Run `npm ci` | node_modules |
| **Run Unit Tests** | Execute `npm run test:ci` | Test results + coverage |
| **Publish Results** | Publish JUnit XML & HTML | Reports in UI |
| **Build Backend** | Compile TypeScript | dist/ folder |
| **Archive Artifacts** | Save build outputs | downloadable files |

## 📁 Generated Artifacts

After each build:
- **JUnit XML**: `test-results/junit.xml` - Test results
- **Coverage HTML**: `coverage/lcov-report/index.html` - Coverage report
- **Build Output**: `dist/` - Compiled JavaScript

## 🎯 Test Commands Used

```bash
# CI mode (used by Jenkins)
npm run test:ci

# Generates:
# - test-results/junit.xml (JUnit format)
# - coverage/ (HTML + lcov reports)
```

## 📈 Viewing Results in Jenkins

### Test Results
```
Build → Test Results
- View pass/fail status
- See test duration
- Track trends over time
```

### Coverage Report
```
Build → Coverage Report (left sidebar)
- Line coverage percentage
- Branch coverage
- Function coverage
- Clickable file-by-file breakdown
```

## 🔧 Customization

### Change Test Command
Edit `Jenkinsfile` stage:
```groovy
stage('Run Unit Tests') {
  steps {
    dir('backend') {
      sh 'npm run test:unit:coverage'  // Change this
    }
  }
}
```

### Add Integration Tests
Add new stage in `Jenkinsfile`:
```groovy
stage('Run Integration Tests') {
  steps {
    dir('backend') {
      sh 'npm run test:integration'
    }
  }
}
```

### Skip Cleanup
Remove `cleanWs()` from `post` section if you want to inspect workspace after build.

## 🚨 Troubleshooting

### Issue: "npm: command not found"
**Solution**: Install NodeJS plugin and configure Global Tool

### Issue: "Cannot find module"
**Solution**: Ensure `npm ci` runs before tests

### Issue: "JUnit report not found"
**Solution**: Check that `jest-junit` package is installed and `test:ci` script runs

### Issue: Coverage report shows 404
**Solution**: Verify HTML Publisher plugin is installed

## 📝 Environment Variables (Optional)

Add to Jenkinsfile `environment` block:
```groovy
environment {
  NODE_ENV = 'test'
  CI = 'true'
}
```

## ✅ Verification Checklist

- [ ] Jenkins has NodeJS plugin installed
- [ ] Global Tool "NodeJS-18" configured
- [ ] Pipeline job created pointing to Jenkinsfile
- [ ] First build triggered successfully
- [ ] Test results visible in UI
- [ ] Coverage report accessible
- [ ] Build artifacts archived

## 🎉 Success Indicators

After a successful build:
1. ✅ **Blue ball** next to build number
2. 📊 **Test Results** link in sidebar
3. 📈 **Coverage Report** link in sidebar
4. 📦 **Build Artifacts** available for download
5. ⏱️ **Build time** < 2 minutes for unit tests

## 🔄 Automated Triggers (Optional)

### Poll SCM
```groovy
triggers {
  pollSCM('H/5 * * * *')  // Check every 5 minutes
}
```

### Webhook (Recommended)
Configure GitHub/GitLab webhook to trigger builds on push.

---

## 📚 Additional Resources

- **JUnit XML Format**: Used for test result visualization
- **jest-junit**: Already configured in `jest.config.unit.js`
- **Parallel Stages**: Can be added for frontend + backend testing

**Your Jenkins pipeline is production-ready!** 🚀
