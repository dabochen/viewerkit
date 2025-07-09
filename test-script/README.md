# ViewerKit Test Suite

This directory contains comprehensive tests for ViewerKit Phase 3 implementation, validating all feature modules and their integration.

## Test Structure

### Core Test Files
- **`feature-tests.js`** - Tests individual feature modules (Hot Reload, Autosave, Theme Sync, Content Parsers)
- **`integration-test.js`** - Tests system-wide integration and coordination between features
- **`run-tests.js`** - Master test runner that executes all test suites

## Test Coverage

### Feature Module Tests (`feature-tests.js`)
Tests each Phase 3 feature individually:

**🔥 Hot Reload Feature**
- Module structure validation (host.ts, web.ts, public.ts, index.ts)
- VS Code FileSystemWatcher integration
- 100ms debounce implementation
- Internal write loop prevention
- Glob pattern support for ignore rules
- Bridge communication between host and web

**💾 Autosave Feature**
- Debounced file writing with 400ms timeout
- Automatic backup creation
- Retry mechanism with exponential backoff (3 attempts)
- Integration with hot reload loop prevention
- Diagnostics reporting and error handling

**🎨 Theme Sync Feature**
- VS Code theme detection and CSS generation
- CSS variable mapping with `--vk-*` namespace
- Light/dark/high contrast theme support
- Real-time theme synchronization
- Body class application for theme switching

**📄 Content Parsers Feature**
- JSON parsing (native implementation)
- YAML parsing (dynamic import for tree-shaking)
- Markdown parsing (dynamic import for tree-shaking)
- Auto content-type detection
- File size limits and validation
- Metadata extraction and client/server delegation

### Integration Tests (`integration-test.js`)
Tests system-wide coordination:

**🤝 Feature Interactions**
- Hot Reload + Autosave coordination with loop prevention
- Theme Sync propagation to all features
- Content Parsers integration with file watching

**⚡ Performance Coordination**
- Debouncing hierarchy (100ms hot reload, 400ms autosave)
- Resource management with dynamic imports
- Memory efficiency with proper cleanup

**🛡️ Error Handling**
- Graceful degradation when features fail
- Error recovery mechanisms
- Comprehensive error reporting through diagnostics

**🏗️ Architectural Integrity**
- Clean separation between host and web code
- Consistent patterns across all features
- Extension points for future development

**🌍 Real-World Scenarios**
- User editing workflows with autosave
- Developer workflows with multiple file types
- Extension integration scenarios

**📋 PRD Compliance**
- Single entry point validation
- Frontend-backend separation
- Horizontal scaling architecture
- Zero dependency hell through dynamic imports
- Tree-shaking optimization
- CSS variable theming system

## Running Tests

### Quick Start
```bash
# Run all tests
node run-tests.js
```

### Individual Tests
```bash
# Run feature tests only
node feature-tests.js

# Run integration tests only
node integration-test.js
```

## Test Results

**✅ All Tests Passing (2/2)**

```
🧪 ViewerKit Test Suite Runner
==============================

🚀 Starting 2 test suites...

▶️  Running Feature Module Tests...
✅ Feature Module Tests passed

▶️  Running Integration Tests...  
✅ Integration Tests passed

==================================================
📊 Test Results Summary
==================================================
✅ Passed: 2/2
❌ Failed: 0/2

🎉 All tests passed! ViewerKit is ready for production.
```

## Test Methodology

The tests validate:
1. **Structure Compliance** - All modules follow PRD architecture patterns
2. **Feature Implementation** - Core functionality matches specifications
3. **Performance Optimization** - Debouncing, tree-shaking, and resource management
4. **Integration Stability** - Features work together without conflicts
5. **Error Resilience** - Graceful handling of failure scenarios
6. **PRD Compliance** - All requirements from product specification are met

## Next Steps

With all Phase 3 tests passing, ViewerKit is ready for:
- **Phase 4**: React Hooks and UI Components
- **Production Deployment**: All core features are stable and tested
- **Extension Development**: Architecture supports horizontal scaling

The test suite confirms that ViewerKit Phase 3 successfully implements:
- ✅ Hot Reload with file watching and loop prevention
- ✅ Autosave with debouncing and backup creation  
- ✅ Theme Sync with CSS variable injection
- ✅ Content Parsers with dynamic imports for tree-shaking
- ✅ Comprehensive integration and error handling
- ✅ Full PRD compliance and production readiness 